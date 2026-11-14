import type { RoadmapProject, ProjectCodec } from '../../roadmap-storage/src/index.ts';
export interface Diagnostic {
	code: string;
	severity: 'error' | 'warning';
	entityId: string | null;
	pointer: string;
	source: { line: number | null; columnBytes: number | null; byteOffset: number | null };
	message: string;
	relatedIds: string[];
	helpTopic: string;
}
export interface EngineResponse<T = unknown> {
	apiVersion: 1;
	requestId: string | null;
	ok: boolean;
	result: T | null;
	diagnostics: Diagnostic[];
	diagnosticsTruncated: boolean;
}
export interface RoadmapEngine {
	readonly ready: Promise<void>;
	request<T = unknown>(
		operation: string,
		parameters?: {
			input?: { format: 'json' | 'roadmap-text' | 'auto'; text: string };
			options?: Record<string, unknown>;
		},
	): Promise<EngineResponse<T>>;
	dispose(): void;
}
export class EngineError extends Error {
	readonly diagnostics: Diagnostic[];
	readonly code: string;
	constructor(message: string, diagnostics: Diagnostic[] = []) {
		super(message);
		this.name = 'EngineError';
		this.diagnostics = diagnostics;
		this.code = diagnostics[0]?.code ?? 'E_INTERNAL';
	}
}
export function projectCodec(engine: RoadmapEngine): ProjectCodec {
	return async (candidate: unknown) => {
		const response = await engine.request<RoadmapProject>('validate', {
			input: { format: 'json', text: JSON.stringify(candidate) },
		});
		if (!response.ok || !response.result)
			throw new EngineError(
				response.diagnostics.map((d) => d.code + ': ' + d.message).join('\n'),
				response.diagnostics,
			);
		return structuredClone(response.result);
	};
}
export async function createRoadmapEngine(config: {
	assetBaseUrl: string | URL;
	timeoutMs?: number;
	workerUrl?: string | URL;
}): Promise<RoadmapEngine> {
	const worker = config.workerUrl
		? new Worker(config.workerUrl, { type: 'module' })
		: new Worker(new URL('./engine-worker.ts', import.meta.url), { type: 'module' });
	const pending = new Map<
		string,
		{
			resolve: (value: EngineResponse) => void;
			reject: (reason: Error) => void;
			timer: ReturnType<typeof setTimeout>;
		}
	>();
	let count = 0,
		disposed = false,
		readyDone = false;
	let resolveReady!: () => void, rejectReady!: (error: Error) => void;
	const ready = new Promise<void>((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	const timeout = config.timeoutMs ?? 10000;
	let startupTimer: ReturnType<typeof setTimeout>;
	const fail = (error: Error) => {
		if (disposed) return;
		disposed = true;
		worker.terminate();
		clearTimeout(startupTimer);
		if (!readyDone) {
			readyDone = true;
			rejectReady(error);
		}
		for (const value of pending.values()) {
			clearTimeout(value.timer);
			value.reject(error);
		}
		pending.clear();
	};
	startupTimer = setTimeout(
		() => fail(new EngineError('Engine initialization timed out')),
		timeout,
	);
	worker.onmessage = (event: MessageEvent) => {
		const data = event.data;
		if (data.type === 'ready') {
			if (disposed) return;
			clearTimeout(startupTimer);
			readyDone = true;
			resolveReady();
			return;
		}
		if (data.type === 'fatal') {
			fail(new EngineError(data.message));
			return;
		}
		if (data.type === 'response') {
			const response = data.response as EngineResponse;
			const entry = response.requestId ? pending.get(response.requestId) : undefined;
			if (entry) {
				clearTimeout(entry.timer);
				pending.delete(response.requestId!);
				entry.resolve(response);
			}
		}
	};
	worker.onerror = (event) => {
		event.preventDefault();
		fail(new EngineError(event.message || 'Wasm Worker failed'));
	};
	worker.onmessageerror = () => fail(new EngineError('Worker message could not be decoded'));
	worker.postMessage({
		type: 'initialize',
		assetBaseUrl: new URL(config.assetBaseUrl, document.baseURI).href,
	});
	const engine: RoadmapEngine = {
		ready,
		async request<T>(
			operation: string,
			parameters: {
				input?: { format: 'json' | 'roadmap-text' | 'auto'; text: string };
				options?: Record<string, unknown>;
			} = {},
		) {
			await ready;
			if (disposed) throw new EngineError('Engine is disposed');
			const requestId = 'request-' + ++count;
			return await new Promise<EngineResponse<T>>((resolve, reject) => {
				const timer = setTimeout(
					() =>
						fail(new EngineError('Engine request timed out; all pending requests were cancelled')),
					timeout,
				);
				pending.set(requestId, {
					resolve: resolve as (value: EngineResponse) => void,
					reject,
					timer,
				});
				worker.postMessage({
					type: 'request',
					request: { apiVersion: 1, requestId, operation, ...parameters },
				});
			});
		},
		dispose() {
			fail(new EngineError('Engine disposed; pending requests cancelled'));
		},
	};
	await ready;
	return engine;
}
