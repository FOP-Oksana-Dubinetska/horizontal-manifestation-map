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
	RoadmapProjectMeta,
} from '../../packages/roadmap-ui/src/index.ts';
import './style.css';
import { setupSectionScrolling } from './section-scroll.ts';
const stopSectionScrolling = setupSectionScrolling();
const status = document.querySelector<HTMLElement>('#host-status')!;
const storageStatus = document.querySelector<HTMLElement>('#storage-status')!;
const root = document.querySelector<HTMLElement>('#editor')!;
const report = document.querySelector<HTMLElement>('#validation-report')!;
const savedSelect = document.querySelector<HTMLSelectElement>('#saved-projects')!;
const fileMenu = document.querySelector<HTMLDetailsElement>('#file-menu')!;
const buttons = Array.from(
	document.querySelectorAll<HTMLButtonElement>('.demo-actions button:not(#retry)'),
);
const retry = document.querySelector<HTMLButtonElement>('#retry')!;
const activeKey = 'hmap:workspace:last-project';
let engine: RoadmapEngine;
let editor: RoadmapEditorInstance | undefined;
let storage: RoadmapStorageAdapter | undefined;
let settings: Storage | undefined;
let lastSaved: RoadmapProject | null = null;
let currentSnapshot: RoadmapProject | undefined;
let savedProjects: RoadmapProjectMeta[] = [];
let dirty = false,
	starting = false,
	busy = false,
	validationRevision = 0;
const showError = (cause: unknown) => {
	status.textContent = cause instanceof Error ? cause.message : String(cause);
};
const same = (a: RoadmapProject, b: RoadmapProject) => JSON.stringify(a) === JSON.stringify(b);
function enable(enabled: boolean) {
	buttons.forEach((button) => (button.disabled = !enabled));
	savedSelect.disabled = !enabled || !savedProjects.length;
	document.querySelector<HTMLButtonElement>('#open')!.disabled = !enabled || !savedProjects.length;
	root.inert = !enabled;
	retry.disabled = starting || busy;
}
function clearReport() {
	++validationRevision;
	report.hidden = true;
	report.textContent = '';
}
function savedChoices(preferred?: string) {
	savedProjects.sort(
		(a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.id.localeCompare(b.id),
	);
	savedSelect.replaceChildren();
	for (const project of savedProjects) {
		const option = document.createElement('option');
		option.value = project.id;
		option.textContent =
			project.title +
			(savedProjects.filter((p) => p.title === project.title).length > 1 ? ' · ' + project.id : '');
		savedSelect.append(option);
	}
	if (preferred && savedProjects.some((p) => p.id === preferred)) savedSelect.value = preferred;
}
function remember(id: string) {
	try {
		settings?.setItem(activeKey, id);
	} catch {
		storageStatus.textContent =
			'Карта сохранена; предпочтение последней открытой карты записать не удалось.';
	}
}
function canDiscard() {
	return (
		!(dirty || editor?.hasOpenDraft()) ||
		window.confirm('Есть несохранённые изменения. Продолжить без их сохранения?')
	);
}
function download(name: string, text: string, type: string) {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function loadExample() {
	const response = await fetch(new URL('./example.roadmap.json', document.baseURI), {
		cache: 'no-store',
	});
	if (!response.ok) throw new Error('Пример архитектуры загрузить не удалось.');
	return projectCodec(engine)(await response.json());
}
async function start() {
	if (starting || busy) return;
	starting = true;
	enable(false);
	const previous = editor?.getProject() ?? currentSnapshot;
	currentSnapshot = previous;
	editor?.destroy();
	editor = undefined;
	engine?.dispose();
	clearReport();
	status.textContent = 'Загрузка карты…';
	let succeeded = false;
	try {
		const version = await fetch(new URL('./version.json', document.baseURI), {
			cache: 'no-store',
		}).then((response) => {
			if (!response.ok) throw new Error('Манифест сборки загрузить не удалось.');
			return response.json();
		});
		engine = await createRoadmapEngine({
			assetBaseUrl: new URL(version.engineBaseUrl, document.baseURI),
		});
		if (!storage) {
			const codec = (candidate: unknown) => projectCodec(engine)(candidate);
			try {
				settings = window.localStorage;
				const probe = 'hmap:probe:' + crypto.randomUUID();
				settings.setItem(probe, '1');
				settings.removeItem(probe);
				storage = new LocalStorageAdapter(
					settings,
					codec,
					(error) => {
						storageStatus.textContent = error.code + ': ' + error.message;
					},
					window,
				);
				savedProjects = await storage.listProjects();
			} catch {
				settings = undefined;
				storage = new MemoryStorageAdapter(codec);
				storageStatus.textContent =
					'Временная сессия. Скачайте JSON, чтобы сохранить работу за пределами этой страницы.';
			}
		}
		let initial = previous;
		if (!initial && savedProjects.length) {
			let preferred: string | null = null;
			try {
				preferred = settings?.getItem(activeKey) ?? null;
			} catch {}
			savedChoices(preferred ?? undefined);
			initial = (await storage.loadProject(savedSelect.value)) ?? undefined;
			lastSaved = initial ? structuredClone(initial) : null;
		}
		if (!initial) initial = await loadExample();
		editor = await createRoadmapEditor({
			root,
			engine,
			storage,
			initialProject: initial,
			language: 'ru',
			terminology: 'engineering',
			features: { terminologySelector: false },
			onChange: (accepted) => {
				currentSnapshot = structuredClone(accepted);
				dirty = !lastSaved || !same(accepted, lastSaved);
				clearReport();
				status.textContent = 'Есть несохранённые изменения.';
			},
			onError: showError,
		});
		currentSnapshot = editor.getProject();
		savedChoices(currentSnapshot.id);
		status.textContent = previous
			? dirty
				? 'Карта восстановлена. Есть несохранённые изменения.'
				: 'Текущая карта восстановлена.'
			: lastSaved
				? 'Сохранённая карта открыта.'
				: 'Открыт пример архитектуры. Измените его или создайте новую карту.';
		succeeded = true;
	} catch (cause) {
		showError(cause);
	} finally {
		starting = false;
		enable(succeeded);
	}
}
async function save(asCopy = false) {
	if (!editor || !storage || busy || starting) return;
	busy = true;
	enable(false);
	status.textContent = 'Сохранение карты…';
	try {
		const before = editor.getProject();
		const candidate = prepareProjectSave(before, () => new Date().toISOString());
		const view = editor.getViewState();
		candidate.selectedIntentId = view.selectedIntentId;
		candidate.selectedRouteId = view.selectedRouteId;
		if (asCopy) candidate.id = 'p-copy-' + crypto.randomUUID();
		await storage.saveProject(candidate);
		// A save never replaces a newer accepted revision from an embedding host.
		if (same(editor.getProject(), before)) await editor.setProject(candidate);
		lastSaved = structuredClone(candidate);
		currentSnapshot = editor.getProject();
		dirty = !same(currentSnapshot, lastSaved);
		const meta = {
			id: candidate.id,
			title: candidate.title,
			updatedAt: candidate.metadata.updatedAt,
		};
		savedProjects = [...savedProjects.filter((p) => p.id !== meta.id), meta];
		// Listing all records here would acknowledge external changes in the storage adapter.
		savedChoices(currentSnapshot.id);
		if (!dirty) remember(candidate.id);
		status.textContent = dirty
			? 'Версия сохранена. В текущей карте есть более новые несохранённые изменения.'
			: storage instanceof MemoryStorageAdapter
				? 'Карта сохранена на время этой сессии. Скачайте JSON для переноса.'
				: 'Карта сохранена в этом браузере.';
	} catch (cause) {
		showError(cause);
	} finally {
		busy = false;
		enable(true);
	}
}
async function openProject(example = false) {
	if (!editor || !storage || busy || starting || !canDiscard()) return;
	busy = true;
	enable(false);
	fileMenu.open = false;
	try {
		const candidate = example ? await loadExample() : await storage.loadProject(savedSelect.value);
		if (!candidate) throw new Error('Сохранённая карта не найдена.');
		await editor.setProject(candidate);
		currentSnapshot = editor.getProject();
		lastSaved = example ? null : structuredClone(candidate);
		dirty = false;
		clearReport();
		if (!example) remember(candidate.id);
		status.textContent = example ? 'Открыт пример архитектуры.' : 'Сохранённая карта открыта.';
	} catch (cause) {
		showError(cause);
	} finally {
		busy = false;
		enable(true);
	}
}
document.querySelector('#new')!.addEventListener('click', () => {
	if (editor && canDiscard()) {
		fileMenu.open = false;
		editor.newProject();
	}
});
document.querySelector('#save')!.addEventListener('click', () => void save());
document.querySelector('#save-copy')!.addEventListener('click', () => {
	fileMenu.open = false;
	void save(true);
});
document.querySelector('#open')!.addEventListener('click', () => void openProject());
document.querySelector('#example')!.addEventListener('click', () => void openProject(true));
document.querySelector('#download-json')!.addEventListener('click', () => {
	if (editor)
		download(
			editor.getProject().id + '.roadmap.json',
			JSON.stringify(editor.getProject(), null, 2) + '\n',
			'application/json',
		);
	fileMenu.open = false;
});
document.querySelector('#download-markdown')!.addEventListener('click', async () => {
	if (!editor) return;
	fileMenu.open = false;
	try {
		const project = editor.getProject();
		const reply = await engine.request<{ text: string }>('export', {
			input: { format: 'json', text: JSON.stringify(project) },
			options: { format: 'markdown', language: 'ru' },
		});
		if (!reply.ok || !reply.result)
			throw new Error(reply.diagnostics.map((d) => d.message).join('\n'));
		download(project.id + '.md', reply.result.text, 'text/markdown');
	} catch (cause) {
		showError(cause);
	}
});
document.querySelector('#validate')!.addEventListener('click', async () => {
	if (!editor) return;
	const token = ++validationRevision;
	try {
		const reply = await engine.request<RoadmapProject>('validate', {
			input: { format: 'json', text: JSON.stringify(editor.getProject()) },
			options: { language: 'ru' },
		});
		if (token !== validationRevision) return;
		report.textContent = reply.diagnostics.length
			? reply.diagnostics.map((d) => `${d.code} ${d.pointer}: ${d.message}`).join('\n')
			: 'Карта прошла проверку. Ошибок и предупреждений нет.';
		report.hidden = false;
	} catch (cause) {
		if (token === validationRevision) showError(cause);
	}
});
document.querySelector('#help')!.addEventListener('click', () => {
	const guide = document.querySelector<HTMLElement>('#guide')!;
	guide.hidden = false;
	guide.scrollIntoView({ block: 'start' });
	document.querySelector<HTMLButtonElement>('#close-guide')!.focus();
});
document.querySelector('#close-guide')!.addEventListener('click', () => {
	document.querySelector<HTMLElement>('#guide')!.hidden = true;
	document.querySelector<HTMLButtonElement>('#help')!.focus();
});
retry.addEventListener('click', () => {
	fileMenu.open = false;
	void start();
});
window.addEventListener('beforeunload', (event) => {
	if (dirty || editor?.hasOpenDraft()) {
		event.preventDefault();
		event.returnValue = '';
	}
});
window.addEventListener('pagehide', () => {
	stopSectionScrolling();
	editor?.destroy();
	editor = undefined;
	engine?.dispose();
	if (storage instanceof LocalStorageAdapter) storage.dispose();
});
void start();
