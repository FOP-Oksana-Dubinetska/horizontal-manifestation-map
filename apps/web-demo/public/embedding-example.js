import {
	createRoadmapEngine,
	createRoadmapEditor,
	MemoryStorageAdapter,
	projectCodec,
} from './embed/hmap-editor.js';
const status = document.querySelector('#status');
try {
	const version = await fetch('./version.json').then((r) => r.json());
	const engine = await createRoadmapEngine({ assetBaseUrl: version.engineBaseUrl });
	const storage = new MemoryStorageAdapter(projectCodec(engine));
	const sample = await engine.request('template');
	if (!sample.ok) throw new Error('Template failed');
	let changes = 0;
	const first = await createRoadmapEditor({
		root: document.querySelector('#first'),
		engine,
		storage,
		initialProject: sample.result,
		onChange: () => ++changes,
	});
	const second = await createRoadmapEditor({
		root: document.querySelector('#second'),
		engine,
		storage,
		initialProject: sample.result,
		readonly: true,
	});
	window.hmapEmbeddingTest = {
		engine,
		storage,
		first,
		second,
		get changes() {
			return changes;
		},
	};
	status.textContent = 'Both editors are ready.';
	window.addEventListener('pagehide', () => {
		first.destroy();
		second.destroy();
		engine.dispose();
	});
} catch (error) {
	status.textContent = String(error);
}
