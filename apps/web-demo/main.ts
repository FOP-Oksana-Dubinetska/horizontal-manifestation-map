import {
	createTranslator,
	isLocale,
	localeResources,
	type Locale,
	type MessageKey,
} from '../../packages/roadmap-ui/src/locales.ts';
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
const localeKey = 'hmap:workspace:locale';
const requestedLocale = new URL(location.href).searchParams.get('lang');
let language: Locale = 'en';
try {
	const preference = localStorage.getItem(localeKey);
	if (isLocale(preference)) language = preference;
} catch {}
if (isLocale(requestedLocale)) language = requestedLocale;
const t = createTranslator(() => language);
const languageSelect = document.querySelector<HTMLSelectElement>('#language')!;
function localizeHost() {
	document.documentElement.lang = language;
	document.querySelector('#workspace')!.setAttribute('aria-label', t('Workspace'));
	document.querySelector('.demo-actions')!.setAttribute('aria-label', t('Map actions'));
	for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]'))
		node.textContent = t(node.dataset.i18n as MessageKey);
	languageSelect.value = language;
}
localizeHost();
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
	const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
	const translated = (localeResources[language].guidance.codes as Record<string, string>)[code];
	status.textContent = translated
		? code + ': ' + translated
		: cause instanceof Error
			? cause.message
			: String(cause);
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
		storageStatus.textContent = t(
			'The map was saved; the last-opened preference could not be recorded.',
		);
	}
}
function canDiscard() {
	return (
		!(dirty || editor?.hasOpenDraft()) ||
		window.confirm(t('There are unsaved changes. Continue without saving them?'))
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
	if (!response.ok) throw new Error(t('The architecture example could not be loaded.'));
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
	status.textContent = t('Loading the map\u2026');
	let succeeded = false;
	try {
		const version = await fetch(new URL('./version.json', document.baseURI), {
			cache: 'no-store',
		}).then((response) => {
			if (!response.ok) throw new Error(t('The build manifest could not be loaded.'));
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
						storageStatus.textContent =
							error.code +
							': ' +
							((localeResources[language].guidance.codes as Record<string, string>)[error.code] ??
								error.message);
					},
					window,
				);
				savedProjects = await storage.listProjects();
			} catch {
				settings = undefined;
				storage = new MemoryStorageAdapter(codec);
				storageStatus.textContent = t(
					'Temporary session. Download JSON to keep your work beyond this page.',
				);
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
			language,
			terminology: 'engineering',
			features: { terminologySelector: false },
			onChange: (accepted) => {
				currentSnapshot = structuredClone(accepted);
				dirty = !lastSaved || !same(accepted, lastSaved);
				clearReport();
				status.textContent = t('There are unsaved changes.');
			},
			onError: showError,
		});
		editor.setLanguage(language);
		currentSnapshot = editor.getProject();
		savedChoices(currentSnapshot.id);
		status.textContent = previous
			? dirty
				? t('The map was restored with unsaved changes.')
				: t('The current map was restored.')
			: lastSaved
				? t('The saved map is open.')
				: t('The architecture example is open. Edit it or create a new map.');
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
	status.textContent = t('Saving the map\u2026');
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
			? t('This version was saved. The current map has newer unsaved changes.')
			: storage instanceof MemoryStorageAdapter
				? t('The map is saved for this session. Download JSON to transfer it.')
				: t('The map is saved in this browser.');
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
		if (!candidate) throw new Error(t('The saved map was not found.'));
		await editor.setProject(candidate);
		currentSnapshot = editor.getProject();
		lastSaved = example ? null : structuredClone(candidate);
		dirty = false;
		clearReport();
		if (!example) remember(candidate.id);
		status.textContent = example
			? t('The architecture example is open.')
			: t('The saved map is open.');
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
			options: { format: 'markdown', language },
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
			options: { language },
		});
		if (token !== validationRevision) return;
		report.textContent = reply.diagnostics.length
			? reply.diagnostics.map((d) => `${d.code} ${d.pointer}: ${d.message}`).join('\n')
			: t('The map passed validation with no errors or warnings.');
		report.hidden = false;
	} catch (cause) {
		if (token === validationRevision) showError(cause);
	}
});
languageSelect.addEventListener('change', () => {
	const next = languageSelect.value;
	if (!isLocale(next) || (editor && !editor.setLanguage(next))) {
		languageSelect.value = language;
		return;
	}
	language = next;
	localizeHost();
	if (storage instanceof MemoryStorageAdapter)
		storageStatus.textContent = t(
			'Temporary session. Download JSON to keep your work beyond this page.',
		);
	else {
		const code = storageStatus.textContent?.split(':', 1)[0] ?? '';
		const message = (localeResources[language].guidance.codes as Record<string, string>)[code];
		if (message) storageStatus.textContent = code + ': ' + message;
	}
	clearReport();
	status.textContent = dirty ? t('There are unsaved changes.') : t('The current map was restored.');
	try {
		localStorage.setItem(localeKey, language);
	} catch {}
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
	editor?.destroy();
	editor = undefined;
	engine?.dispose();
	if (storage instanceof LocalStorageAdapter) storage.dispose();
});
void start();
