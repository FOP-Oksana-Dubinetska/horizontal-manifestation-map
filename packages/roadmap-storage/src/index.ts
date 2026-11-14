export type TerminologyProfile = 'engineering' | 'simple' | 'product' | 'literary';
export type ModuleKind = 'core' | 'ui' | 'storage' | 'export' | 'demo' | 'validation';
export interface IntentNode {
	id: string;
	title: string;
	summary: string;
	status: 'draft' | 'active' | 'implemented' | 'deferred';
	kind: 'finite' | 'continuous';
	parentIntentIds: string[];
	acceptanceCriteria: string[];
}
export interface RouteStep {
	id: string;
	title: string;
	stereotype: 'intent' | 'module' | 'shared' | 'validation' | 'export';
	estimateId: string | null;
	linkedModuleIds: string[];
	linkedChunkIds: string[];
}
export interface IntentRoute {
	id: string;
	intentId: string;
	title: string;
	steps: RouteStep[];
}
export interface RoadmapModule {
	id: string;
	title: string;
	summary: string;
	kind: ModuleKind;
	linkedIntentIds: string[];
	existence: 'planned' | 'existing' | 'deprecated';
	codeRefs: { repository: string; path: string; revision: string | null; symbol: string | null }[];
}
export interface LiterateChunk {
	id: string;
	name: string;
	body: string;
	linkedIntentIds: string[];
	linkedModuleIds: string[];
}
export type EstimateValue =
	| { type: 'range'; metric: 'effort' | 'elapsed'; minMinutes: number; maxMinutes: number }
	| { type: 'unknown' | 'not-applicable'; reason: string }
	| { type: 'text'; text: string };
export interface EstimateEntry {
	id: string;
	label: string;
	confidence: 'low' | 'medium' | 'high';
	basis: string;
	value: EstimateValue;
}
export interface RoadmapProject {
	schemaVersion: 2;
	id: string;
	title: string;
	terminologyProfile: TerminologyProfile;
	intents: IntentNode[];
	selectedIntentId: string | null;
	selectedRouteId: string | null;
	routes: IntentRoute[];
	modules: RoadmapModule[];
	chunks: LiterateChunk[];
	intersections: { id: string; title: string; sourceIds: string[]; note: string }[];
	estimates: EstimateEntry[];
	metadata: { formatVersion: '2.0.0'; createdAt: string | null; updatedAt: string | null };
}
export interface RoadmapProjectMeta {
	id: string;
	title: string;
	updatedAt: string | null;
}
export interface RoadmapStorageAdapter {
	listProjects(): Promise<RoadmapProjectMeta[]>;
	loadProject(projectId: string): Promise<RoadmapProject | null>;
	saveProject(project: RoadmapProject): Promise<void>;
	deleteProject(projectId: string): Promise<void>;
}
export type ProjectCodec = (candidate: unknown) => Promise<RoadmapProject>;
export class StorageError extends Error {
	readonly code: string;
	constructor(code: string, message: string) {
		super(message);
		this.name = 'StorageError';
		this.code = code;
	}
}
const copy = <T>(value: T): T => structuredClone(value);
const meta = (p: RoadmapProject): RoadmapProjectMeta => ({
	id: p.id,
	title: p.title,
	updatedAt: p.metadata.updatedAt,
});
export function prepareProjectSave(project: RoadmapProject, clock: () => string): RoadmapProject {
	const candidate = copy(project);
	const now = clock();
	candidate.metadata.updatedAt = now;
	if (candidate.metadata.createdAt === null) candidate.metadata.createdAt = now;
	return candidate;
}
export class MemoryStorageAdapter implements RoadmapStorageAdapter {
	private readonly projects = new Map<string, RoadmapProject>();
	private readonly codec: ProjectCodec;
	constructor(codec: ProjectCodec) {
		this.codec = codec;
	}
	async listProjects() {
		return Array.from(this.projects.values(), meta);
	}
	async loadProject(id: string) {
		const p = this.projects.get(id);
		return p ? copy(await this.codec(copy(p))) : null;
	}
	async saveProject(project: RoadmapProject) {
		const candidate = await this.codec(copy(project));
		this.projects.set(candidate.id, copy(candidate));
	}
	async deleteProject(id: string) {
		this.projects.delete(id);
	}
}
export const storagePrefix = 'ironcreed-roadmap:v2:project:';
export class LocalStorageAdapter implements RoadmapStorageAdapter {
	private readonly storage: Storage;
	private readonly codec: ProjectCodec;
	private readonly onError?: (error: StorageError) => void;
	private readonly snapshots = new Map<string, string | null>();
	private readonly conflicts = new Set<string>();
	private readonly events?: Window;
	private readonly listener: (event: StorageEvent) => void;
	constructor(
		storage: Storage,
		codec: ProjectCodec,
		onError?: (error: StorageError) => void,
		events?: Window,
	) {
		this.storage = storage;
		this.codec = codec;
		this.onError = onError;
		this.events = events;
		this.listener = (event) => {
			if (event.storageArea && event.storageArea !== this.storage) return;
			if (event.key === null) {
				for (const key of this.snapshots.keys()) this.conflicts.add(key);
			} else if (event.key.startsWith(storagePrefix) && this.snapshots.has(event.key))
				this.conflicts.add(event.key);
		};
		events?.addEventListener('storage', this.listener);
	}
	dispose() {
		this.events?.removeEventListener('storage', this.listener);
	}
	private access<T>(fn: () => T): T {
		try {
			return fn();
		} catch (error) {
			if (error instanceof StorageError) throw error;
			const quota =
				error instanceof DOMException &&
				(error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
			throw new StorageError(
				quota ? 'E_STORAGE_QUOTA' : 'E_STORAGE_UNAVAILABLE',
				error instanceof Error ? error.message : String(error),
			);
		}
	}
	private async decode(raw: string, id: string) {
		try {
			const p = await this.codec(JSON.parse(raw));
			if (p.id !== id) throw new Error('Stored ID differs from key');
			return p;
		} catch (error) {
			throw new StorageError(
				'E_STORAGE_CORRUPT',
				error instanceof Error ? error.message : String(error),
			);
		}
	}
	async listProjects() {
		const keys = this.access(() =>
			Array.from({ length: this.storage.length }, (_, i) => this.storage.key(i)).filter(
				(key): key is string => key !== null && key.startsWith(storagePrefix),
			),
		);
		const result: RoadmapProjectMeta[] = [];
		for (const key of keys) {
			try {
				const p = await this.loadProject(key.slice(storagePrefix.length));
				if (p) result.push(meta(p));
			} catch (error) {
				if (error instanceof StorageError && error.code === 'E_STORAGE_CORRUPT') {
					this.onError?.(error);
					continue;
				}
				throw error;
			}
		}
		return result;
	}
	async loadProject(id: string) {
		const key = storagePrefix + id;
		const raw = this.access(() => this.storage.getItem(key));
		if (raw === null) {
			this.snapshots.set(key, null);
			this.conflicts.delete(key);
			return null;
		}
		const project = await this.decode(raw, id);
		this.snapshots.set(key, raw);
		this.conflicts.delete(key);
		return copy(project);
	}
	private check(key: string) {
		const current = this.access(() => this.storage.getItem(key));
		const expected = this.snapshots.has(key) ? this.snapshots.get(key) : null;
		if (this.conflicts.has(key) || current !== expected)
			throw new StorageError(
				'E_STORAGE_CONFLICT',
				'Project changed outside this editor; reload or save a copy',
			);
	}
	async saveProject(project: RoadmapProject) {
		const candidate = await this.codec(copy(project));
		const key = storagePrefix + candidate.id;
		this.check(key);
		const raw = JSON.stringify(candidate);
		this.access(() => this.storage.setItem(key, raw));
		this.snapshots.set(key, raw);
	}
	async deleteProject(id: string) {
		const key = storagePrefix + id;
		const current = this.access(() => this.storage.getItem(key));
		if (!this.snapshots.has(key)) this.snapshots.set(key, current);
		if (current === null) {
			this.snapshots.set(key, null);
			return;
		}
		this.check(key);
		this.access(() => this.storage.removeItem(key));
		this.snapshots.set(key, null);
		this.conflicts.delete(key);
	}
}
