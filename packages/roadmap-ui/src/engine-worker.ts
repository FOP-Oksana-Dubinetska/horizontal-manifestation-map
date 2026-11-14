type EngineModule = { processRoadmapRequest: (request: string) => string };
const scope = globalThis as unknown as {
	onmessage: ((event: MessageEvent) => void) | null;
	postMessage: (message: unknown) => void;
};
let engine: EngineModule | undefined;
scope.onmessage = async (event) => {
	try {
		if (event.data.type === 'initialize') {
			const base = new URL(event.data.assetBaseUrl);
			const { default: create } = await import(
				/* @vite-ignore */ new URL('roadmap-engine.mjs', base).href
			);
			engine = await create({ locateFile: (name: string) => new URL(name, base).href });
			scope.postMessage({ type: 'ready' });
		} else if (event.data.type === 'request') {
			if (!engine) throw new Error('Engine is not ready');
			const response = JSON.parse(engine.processRoadmapRequest(JSON.stringify(event.data.request)));
			scope.postMessage({ type: 'response', response });
		}
	} catch (error) {
		scope.postMessage({
			type: 'fatal',
			message: error instanceof Error ? error.message : String(error),
		});
	}
};
export {};
