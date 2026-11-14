import {
	createRoadmapEngine,
	createRoadmapEditor,
	projectCodec,
	LocalStorageAdapter,
	MemoryStorageAdapter,
	prepareProjectSave,
} from '../../packages/roadmap-ui/src/index.ts';
import type {
	RoadmapEngine,
	RoadmapEditorInstance,
	RoadmapStorageAdapter,
	RoadmapProject,
} from '../../packages/roadmap-ui/src/index.ts';
import './style.css';
const status = document.querySelector<HTMLElement>('#host-status')!,
	storageStatus = document.querySelector<HTMLElement>('#storage-status')!,
	root = document.querySelector<HTMLElement>('#editor')!;
const buttons = Array.from(
	document.querySelectorAll<HTMLButtonElement>('.demo-actions button:not(#retry)'),
);
let engine: RoadmapEngine,
	editor: RoadmapEditorInstance | undefined,
	storage: RoadmapStorageAdapter | undefined,
	lastSaved: RoadmapProject | null = null,
	currentSnapshot: RoadmapProject | undefined,
	starting = false;
const showError = (cause: unknown) => {
	status.textContent = cause instanceof Error ? cause.message : String(cause);
};
function download(name: string, text: string, type: string) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function start() {
	if (starting) return;
	starting = true;
	buttons.forEach((b) => (b.disabled = true));
	const previous = editor?.getProject() ?? currentSnapshot;
	currentSnapshot = previous;
	editor?.destroy();
	editor = undefined;
	engine?.dispose();
	status.textContent = 'Loading the local engine…';
	try {
		const version = await fetch(new URL('./version.json', document.baseURI), {
			cache: 'no-store',
		}).then((r) => {
			if (!r.ok) throw new Error('Build manifest could not be loaded');
			return r.json();
		});
		engine = await createRoadmapEngine({
			assetBaseUrl: new URL(version.engineBaseUrl, document.baseURI),
		});
		if (!storage) {
			const codec = (candidate: unknown) => projectCodec(engine)(candidate);
			try {
				const local = window.localStorage;
				const probe = 'hmap:probe:' + crypto.randomUUID();
				local.setItem(probe, '1');
				local.removeItem(probe);
				storage = new LocalStorageAdapter(
					local,
					codec,
					(error) => {
						storageStatus.textContent = error.code + ': ' + error.message;
					},
					window,
				);
				await storage.listProjects();
			} catch {
				storage = new MemoryStorageAdapter(codec);
				storageStatus.textContent = 'Temporary session. Download JSON to preserve your work.';
			}
		}
		let initial = previous;
		if (!initial) {
			const saved = await storage.listProjects();
			if (saved.length) {
				initial = (await storage.loadProject(saved[0].id)) ?? undefined;
				lastSaved = initial ?? null;
			}
		}
		if (!initial) {
			const response = await engine.request<RoadmapProject>('template');
			if (!response.ok || !response.result) throw new Error('Example project could not be loaded');
			initial = response.result;
		}
		editor = await createRoadmapEditor({
			root,
			engine,
			storage,
			initialProject: initial,
			onChange: (accepted) => {
				currentSnapshot = structuredClone(accepted);
				status.textContent =
					'Imported candidate accepted. Save explicitly to keep it in this browser.';
			},
			onError: showError,
		});
		currentSnapshot = editor.getProject();
		status.textContent = previous
			? 'Current project restored. Save explicitly to keep it.'
			: lastSaved
				? 'Saved project loaded.'
				: 'Example loaded. Import a candidate or download the source.';
		buttons.forEach((b) => (b.disabled = false));
	} catch (cause) {
		showError(cause);
	} finally {
		starting = false;
	}
}
async function save(asCopy = false) {
	if (!editor || !storage) return;
	try {
		const candidate = prepareProjectSave(editor.getProject(), () => new Date().toISOString());
		if (asCopy) candidate.id = 'p-copy-' + crypto.randomUUID();
		await storage.saveProject(candidate);
		await editor.setProject(candidate);
		lastSaved = structuredClone(candidate);
		currentSnapshot = structuredClone(candidate);
		status.textContent = 'Saved locally in this browser.';
	} catch (cause) {
		showError(cause);
	}
}
document.querySelector('#save')!.addEventListener('click', () => void save());
document.querySelector('#save-copy')!.addEventListener('click', () => void save(true));
document.querySelector('#download-json')!.addEventListener('click', () => {
	if (editor)
		download(
			editor.getProject().id + '.roadmap.json',
			JSON.stringify(editor.getProject(), null, 2) + '\n',
			'application/json',
		);
});
document.querySelector('#download-markdown')!.addEventListener('click', async () => {
	if (!editor) return;
	try {
		const reply = await engine.request<{ text: string }>('export', {
			input: { format: 'json', text: JSON.stringify(editor.getProject()) },
			options: { format: 'markdown' },
		});
		if (!reply.ok || !reply.result)
			throw new Error(reply.diagnostics.map((d) => d.message).join('\n'));
		download(editor.getProject().id + '.md', reply.result.text, 'text/markdown');
	} catch (cause) {
		showError(cause);
	}
});
document.querySelector('#help')!.addEventListener('click', async () => {
	try {
		const reply = await engine.request<{ text: string }>('help', {
			options: { topic: 'getting-started' },
		});
		document.querySelector('#guide-text')!.textContent = reply.result?.text ?? '';
		document.querySelector<HTMLElement>('#guide')!.hidden = false;
		document.querySelector<HTMLButtonElement>('#close-guide')!.focus();
	} catch (cause) {
		showError(cause);
	}
});
document.querySelector('#close-guide')!.addEventListener('click', () => {
	document.querySelector<HTMLElement>('#guide')!.hidden = true;
	document.querySelector<HTMLButtonElement>('#help')!.focus();
});
document.querySelector('#retry')!.addEventListener('click', () => void start());
window.addEventListener('pagehide', () => {
	editor?.destroy();
	editor = undefined;
	engine?.dispose();
	if (storage instanceof LocalStorageAdapter) storage.dispose();
});
void start();
