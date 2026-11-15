import type { RoadmapProject } from '../../roadmap-storage/src/index.ts';

export type EntityKind =
	| 'intent'
	| 'route'
	| 'step'
	| 'module'
	| 'chunk'
	| 'intersection'
	| 'estimate';
export interface AuthoringTarget {
	kind: EntityKind | 'project' | 'new-project';
	id: string;
	routeId?: string;
}
export interface EntityName {
	kind: EntityKind;
	id: string;
	title: string;
}
type AuthoringErrorCode =
	| 'intent-required'
	| 'route-required'
	| 'missing-entity'
	| 'invalid-position';
export class AuthoringError extends Error {
	readonly code: AuthoringErrorCode;
	constructor(code: AuthoringErrorCode) {
		super(code);
		this.code = code;
	}
}
export function createDraftProject(id: string, title = ''): RoadmapProject {
	return {
		schemaVersion: 2,
		id,
		title,
		terminologyProfile: 'engineering',
		selectedIntentId: null,
		selectedRouteId: null,
		intents: [],
		routes: [],
		modules: [],
		chunks: [],
		intersections: [],
		estimates: [],
		metadata: { formatVersion: '2.0.0', createdAt: null, updatedAt: null },
	};
}
export function entityNames(project: RoadmapProject): EntityName[] {
	return [
		...project.intents.map((v) => ({ kind: 'intent' as const, id: v.id, title: v.title })),
		...project.routes.map((v) => ({ kind: 'route' as const, id: v.id, title: v.title })),
		...project.routes.flatMap((r) =>
			r.steps.map((v) => ({ kind: 'step' as const, id: v.id, title: v.title })),
		),
		...project.modules.map((v) => ({ kind: 'module' as const, id: v.id, title: v.title })),
		...project.chunks.map((v) => ({ kind: 'chunk' as const, id: v.id, title: v.name })),
		...project.intersections.map((v) => ({
			kind: 'intersection' as const,
			id: v.id,
			title: v.title,
		})),
		...project.estimates.map((v) => ({ kind: 'estimate' as const, id: v.id, title: v.label })),
	];
}
export function nextEntityId(project: RoadmapProject, prefix: string): string {
	const ids = new Set([project.id, ...entityNames(project).map((v) => v.id)]);
	let n = 1;
	while (ids.has(prefix + '-' + n)) ++n;
	return prefix + '-' + n;
}
export function prepareAddition(
	project: RoadmapProject,
	kind: EntityKind,
	selection: { intentId?: string | null; routeId?: string | null } = {},
): { project: RoadmapProject; target: AuthoringTarget } {
	const draft = structuredClone(project);
	const prefixes = {
		intent: 'i',
		route: 'r',
		step: 's',
		module: 'm',
		chunk: 'c',
		intersection: 'x',
		estimate: 'e',
	};
	const id = nextEntityId(draft, prefixes[kind]);
	const intentId = selection.intentId ?? draft.selectedIntentId ?? draft.intents[0]?.id;
	const routeId = selection.routeId ?? draft.selectedRouteId;
	const target: AuthoringTarget = { kind, id };
	switch (kind) {
		case 'intent':
			draft.intents.push({
				id,
				title: '',
				summary: '',
				status: 'draft',
				kind: 'finite',
				parentIntentIds: [],
				acceptanceCriteria: [],
			});
			if (!draft.selectedIntentId) draft.selectedIntentId = id;
			break;
		case 'route':
			if (!intentId) throw new AuthoringError('intent-required');
			draft.routes.push({ id, title: '', intentId, steps: [] });
			draft.selectedIntentId = intentId;
			draft.selectedRouteId = id;
			break;
		case 'step': {
			const route = draft.routes.find((r) => r.id === routeId);
			if (!route) throw new AuthoringError('route-required');
			target.routeId = route.id;
			route.steps.push({
				id,
				title: '',
				stereotype: 'module',
				estimateId: null,
				linkedModuleIds: [],
				linkedChunkIds: [],
			});
			break;
		}
		case 'module':
			draft.modules.push({
				id,
				title: '',
				summary: '',
				kind: 'core',
				linkedIntentIds: intentId ? [intentId] : [],
				existence: 'planned',
				codeRefs: [],
			});
			break;
		case 'chunk':
			draft.chunks.push({
				id,
				name: '',
				body: '',
				linkedIntentIds: intentId ? [intentId] : [],
				linkedModuleIds: [],
			});
			break;
		case 'intersection':
			draft.intersections.push({ id, title: '', sourceIds: [], note: '' });
			break;
		case 'estimate':
			draft.estimates.push({
				id,
				label: '',
				basis: '',
				confidence: 'low',
				value: { type: 'unknown', reason: '' },
			});
			break;
	}
	return { project: draft, target };
}
function objects(project: RoadmapProject, target: AuthoringTarget): { id: string }[] {
	switch (target.kind) {
		case 'intent':
			return project.intents;
		case 'route':
			return project.routes;
		case 'module':
			return project.modules;
		case 'chunk':
			return project.chunks;
		case 'intersection':
			return project.intersections;
		case 'estimate':
			return project.estimates;
		case 'step': {
			const route = project.routes.find((r) => r.id === target.routeId);
			if (!route) throw new AuthoringError('missing-entity');
			return route.steps;
		}
		default:
			throw new AuthoringError('missing-entity');
	}
}
export function entityPosition(project: RoadmapProject, target: AuthoringTarget) {
	const list = objects(project, target);
	const index = list.findIndex((v) => v.id === target.id);
	if (index < 0) throw new AuthoringError('missing-entity');
	return { position: index + 1, count: list.length };
}
export function reorderEntity(project: RoadmapProject, target: AuthoringTarget, position: number) {
	const draft = structuredClone(project);
	const list = objects(draft, target);
	const index = list.findIndex((v) => v.id === target.id);
	if (index < 0) throw new AuthoringError('missing-entity');
	if (!Number.isInteger(position) || position < 1 || position > list.length)
		throw new AuthoringError('invalid-position');
	const [item] = list.splice(index, 1);
	list.splice(position - 1, 0, item);
	return draft;
}
export interface DeletionPreview {
	project: RoadmapProject;
	removed: EntityName[];
	detachedReferences: number;
}
/** A proposal only: callers show the full impact and validate before acceptance. */
export function prepareDeletion(project: RoadmapProject, target: AuthoringTarget): DeletionPreview {
	const names = entityNames(project);
	if (!names.some((v) => v.id === target.id && v.kind === target.kind))
		throw new AuthoringError('missing-entity');
	const draft = structuredClone(project);
	const removed = new Set([target.id]);
	for (const route of draft.routes) {
		if (removed.has(route.intentId)) removed.add(route.id);
		if (removed.has(route.id)) for (const step of route.steps) removed.add(step.id);
	}
	let detachedReferences = 0;
	const detach = (ids: string[]) => {
		const result = ids.filter((id) => !removed.has(id));
		detachedReferences += ids.length - result.length;
		return result;
	};
	draft.intents = draft.intents.filter((v) => !removed.has(v.id));
	draft.routes = draft.routes.filter((v) => !removed.has(v.id));
	draft.modules = draft.modules.filter((v) => !removed.has(v.id));
	draft.chunks = draft.chunks.filter((v) => !removed.has(v.id));
	draft.estimates = draft.estimates.filter((v) => !removed.has(v.id));
	for (const intent of draft.intents) intent.parentIntentIds = detach(intent.parentIntentIds);
	for (const route of draft.routes) {
		route.steps = route.steps.filter((v) => !removed.has(v.id));
		for (const step of route.steps) {
			step.linkedModuleIds = detach(step.linkedModuleIds);
			step.linkedChunkIds = detach(step.linkedChunkIds);
			if (step.estimateId && removed.has(step.estimateId)) {
				++detachedReferences;
				step.estimateId = null;
			}
		}
	}
	for (const module of draft.modules) module.linkedIntentIds = detach(module.linkedIntentIds);
	for (const chunk of draft.chunks) {
		chunk.linkedIntentIds = detach(chunk.linkedIntentIds);
		chunk.linkedModuleIds = detach(chunk.linkedModuleIds);
	}
	draft.intersections = draft.intersections
		.filter((v) => !removed.has(v.id))
		.filter((v) => {
			v.sourceIds = detach(v.sourceIds);
			if (v.sourceIds.length >= 2) return true;
			removed.add(v.id);
			return false;
		});
	if (draft.selectedIntentId && removed.has(draft.selectedIntentId)) {
		draft.selectedIntentId = null;
		draft.selectedRouteId = null;
	} else if (draft.selectedRouteId && removed.has(draft.selectedRouteId))
		draft.selectedRouteId = null;
	return { project: draft, removed: names.filter((v) => removed.has(v.id)), detachedReferences };
}
