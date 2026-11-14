import type {
	RoadmapProject,
	RoadmapStorageAdapter,
	TerminologyProfile,
	ModuleKind,
} from '../../roadmap-storage/src/index.ts';
import type { RoadmapEngine } from './engine.ts';
import { EngineError, projectCodec } from './engine.ts';
import './style.css';
export * from './engine.ts';
export * from '../../roadmap-storage/src/index.ts';
export interface RoadmapFeatureFlags {
	importButton: boolean;
	markdownExport: boolean;
	terminologySelector: boolean;
	linkedAreaFilter: boolean;
}
export interface RoadmapEditorConfig {
	root: HTMLElement;
	engine: RoadmapEngine;
	storage: RoadmapStorageAdapter;
	initialProject?: RoadmapProject;
	initialProjectId?: string;
	newProjectId?: string;
	terminology?: TerminologyProfile;
	language?: 'en' | 'ru';
	readonly?: boolean;
	features?: Partial<RoadmapFeatureFlags>;
	onChange?: (project: RoadmapProject) => void;
	onError?: (error: Error) => void;
}
export interface RoadmapViewState {
	selectedIntentId: string | null;
	selectedRouteId: string | null;
	filter: 'all' | ModuleKind;
	terminology: TerminologyProfile;
	splitter: number;
}
export interface RoadmapEditorInstance {
	destroy(): void;
	getProject(): RoadmapProject;
	setProject(project: RoadmapProject): Promise<void>;
	getViewState(): RoadmapViewState;
}
let sequence = 0;
const clone = <T>(value: T): T => structuredClone(value);
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}
function blank(id: string): RoadmapProject {
	return {
		schemaVersion: 2,
		id,
		title: 'Untitled project',
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
function diff(before: RoadmapProject, after: RoadmapProject) {
	const flatten = (project: RoadmapProject) => {
		const map = new Map<string, string>();
		for (const values of [
			project.intents,
			project.routes,
			project.modules,
			project.chunks,
			project.intersections,
			project.estimates,
			...project.routes.map((r) => r.steps),
		])
			for (const item of values) map.set(item.id, JSON.stringify(item));
		return map;
	};
	const left = flatten(before),
		right = flatten(after);
	let added = 0,
		removed = 0,
		changed = 0;
	for (const [id, value] of right) {
		if (!left.has(id)) ++added;
		else if (left.get(id) !== value) ++changed;
	}
	for (const id of left.keys()) if (!right.has(id)) ++removed;
	return { added, removed, changed };
}
export async function createRoadmapEditor(
	config: RoadmapEditorConfig,
): Promise<RoadmapEditorInstance> {
	if (config.initialProject && config.initialProjectId)
		throw new TypeError('Choose initialProject or initialProjectId');
	if (!config.initialProject && !config.initialProjectId && !config.newProjectId)
		throw new TypeError('newProjectId is required for a new draft');
	await config.engine.ready;
	const validate = projectCodec(config.engine);
	let initial = config.initialProject;
	if (config.initialProjectId) {
		const stored = await config.storage.loadProject(config.initialProjectId);
		if (!stored) throw new Error('Project not found: ' + config.initialProjectId);
		initial = stored;
	}
	let project = await validate(initial ?? blank(config.newProjectId!));
	const language = config.language ?? 'en',
		ru = language === 'ru';
	const features = {
		importButton: true,
		markdownExport: true,
		terminologySelector: true,
		linkedAreaFilter: true,
		...config.features,
	};
	const view: RoadmapViewState = {
		selectedIntentId: project.selectedIntentId,
		selectedRouteId: project.selectedRouteId,
		filter: 'all',
		terminology: config.terminology ?? project.terminologyProfile,
		splitter: 0,
	};
	let dead = false,
		revision = 0,
		labelRevision = 0;
	let renderAbort = new AbortController();
	const abort = new AbortController(),
		signal = abort.signal;
	const prefix = 'hmap-' + ++sequence;
	const container = element('section', 'hmap-editor');
	container.setAttribute('aria-label', ru ? 'Редактор карты' : 'Roadmap editor');
	const controls = element('div', 'hmap-controls');
	const upper = element('article', 'hmap-source');
	upper.setAttribute('aria-label', ru ? 'Литературное представление' : 'Literate source');
	const divider = element('div', 'hmap-divider');
	divider.tabIndex = 0;
	divider.setAttribute('role', 'separator');
	divider.setAttribute('aria-orientation', 'horizontal');
	divider.setAttribute('aria-label', ru ? 'Высота областей' : 'Panel height');
	const rail = element('section', 'hmap-rail');
	rail.setAttribute('aria-label', ru ? 'Выбранный маршрут' : 'Selected route');
	const status = element('p', 'hmap-status');
	status.setAttribute('role', 'status');
	const dialog = element('div', 'hmap-import-review');
	dialog.hidden = true;
	dialog.setAttribute('role', 'dialog');
	dialog.setAttribute('aria-modal', 'true');
	dialog.setAttribute('aria-label', ru ? 'Проверка импорта' : 'Review import');
	const dialogText = element('pre', 'hmap-review-text');
	const accept = element('button', '', ru ? 'Принять импорт' : 'Accept import');
	const cancel = element('button', '', ru ? 'Отменить' : 'Cancel');
	dialog.append(dialogText, accept, cancel);
	container.append(controls, upper, divider, rail, dialog);
	config.root.append(container);
	let preview: { project: RoadmapProject; revision: number } | null = null;
	const file = element('input', 'hmap-file-input');
	file.type = 'file';
	file.accept = '.json,.txt';
	file.hidden = true;
	controls.append(file);
	let labels: Record<string, string> = {
		intent: 'Intention',
		route: 'Route',
		module: 'System element',
		chunk: 'Literate fragment',
		intersection: 'Intersection',
	};
	const terminology = element('select', '');
	terminology.setAttribute('aria-label', ru ? 'Терминология' : 'Terminology');
	for (const value of ['engineering', 'simple', 'product', 'literary']) {
		const option = element('option', '', value);
		option.value = value;
		terminology.append(option);
	}
	terminology.value = view.terminology;
	const filter = element('select', '');
	filter.setAttribute('aria-label', ru ? 'Связанная область' : 'Linked area');
	for (const value of ['all', 'core', 'ui', 'storage', 'export', 'demo', 'validation']) {
		const option = element(
			'option',
			'',
			value === 'all' ? (ru ? 'Все области' : 'All areas') : value,
		);
		option.value = value;
		filter.append(option);
	}
	const importButton = element('button', '', ru ? 'Импорт' : 'Import');
	if (features.terminologySelector) controls.append(terminology);
	if (features.linkedAreaFilter) controls.append(filter);
	if (features.importButton && !config.readonly) controls.append(importButton);
	const error = (cause: unknown) => {
		const value = cause instanceof Error ? cause : new Error(String(cause));
		if (!dead) {
			status.textContent = value.message;
			config.onError?.(value);
		}
	};
	const check = () => {
		if (dead) throw new Error('Editor is destroyed');
	};
	const render = () => {
		if (dead) return;
		renderAbort.abort();
		renderAbort = new AbortController();
		const contentSignal = renderAbort.signal;
		upper.replaceChildren();
		rail.replaceChildren();
		upper.append(element('h1', 'hmap-project-title', project.title));
		upper.append(status);
		status.textContent = '';
		const moduleMatches = (id: string) =>
			view.filter === 'all' || project.modules.some((m) => m.id === id && m.kind === view.filter);
		let matching = 0;
		for (const intent of project.intents) {
			const heading = element('h2', 'hmap-intent-heading');
			const button = element('button', '', labels.intent + ': ' + intent.title);
			button.dataset.intentId = intent.id;
			button.setAttribute('aria-pressed', String(view.selectedIntentId === intent.id));
			button.addEventListener(
				'click',
				() => {
					view.selectedIntentId = intent.id;
					const routes = project.routes.filter((r) => r.intentId === intent.id);
					view.selectedRouteId = routes.length === 1 ? routes[0].id : null;
					render();
				},
				{ signal: contentSignal },
			);
			heading.append(button);
			upper.append(heading, element('p', '', intent.summary));
			const criteria = element('ul', '');
			for (const criterion of intent.acceptanceCriteria)
				criteria.append(element('li', '', criterion));
			upper.append(criteria);
			const routes = element('p', 'hmap-route-choices');
			for (const route of project.routes.filter((r) => r.intentId === intent.id)) {
				const link = element('button', '', labels.route + ': ' + route.title);
				link.dataset.routeId = route.id;
				link.setAttribute('aria-pressed', String(view.selectedRouteId === route.id));
				link.addEventListener(
					'click',
					() => {
						view.selectedIntentId = intent.id;
						view.selectedRouteId = route.id;
						render();
					},
					{ signal: contentSignal },
				);
				routes.append(link);
			}
			upper.append(routes);
		}
		for (const chunk of project.chunks) {
			const section = element('section', 'hmap-chunk');
			section.id = prefix + '-' + chunk.id;
			section.tabIndex = -1;
			section.dataset.chunkId = chunk.id;
			const matches = view.filter === 'all' || chunk.linkedModuleIds.some(moduleMatches);
			section.classList.toggle('hmap-dim', !matches);
			if (matches) ++matching;
			section.append(
				element('h3', 'hmap-chunk-label', '<<' + chunk.name + '>>'),
				element('div', 'hmap-body', chunk.body),
			);
			upper.append(section);
		}
		for (const module of project.modules) {
			const section = element('section', 'hmap-module');
			const matches = moduleMatches(module.id);
			section.classList.toggle('hmap-dim', !matches);
			if (matches) ++matching;
			section.append(
				element('h3', '', labels.module + ': ' + module.title),
				element('p', '', module.summary),
				element(
					'p',
					'hmap-code-reference',
					module.codeRefs
						.map(
							(c) =>
								`${c.repository} / ${c.path} @ ${c.revision ?? 'unspecified'} ${c.symbol ?? ''}`,
						)
						.join('\n'),
				),
			);
			upper.append(section);
		}
		for (const intersection of project.intersections) {
			upper.append(
				element('h3', '', labels.intersection + ': ' + intersection.title),
				element('p', '', intersection.note),
			);
		}
		for (const estimate of project.estimates) {
			upper.append(
				element('h3', '', estimate.label),
				element(
					'p',
					'hmap-estimate-detail',
					JSON.stringify(estimate.value) + ' · ' + estimate.confidence + ' · ' + estimate.basis,
				),
			);
		}
		const route = project.routes.find(
			(r) => r.id === view.selectedRouteId && r.intentId === view.selectedIntentId,
		);
		if (!route || !route.steps.length)
			rail.append(
				element(
					'p',
					'hmap-empty',
					ru
						? 'Выберите маршрут или добавьте шаги в кандидате карты.'
						: 'Select a route, or add steps to the project candidate.',
				),
			);
		else {
			const row = element('div', 'hmap-route-row');
			row.dataset.routeId = route.id;
			for (const [index, step] of route.steps.entries()) {
				if (index) {
					const arrow = element('span', 'hmap-arrow', '→');
					arrow.setAttribute('aria-hidden', 'true');
					row.append(arrow);
				}
				const button = element('button', 'hmap-step');
				button.dataset.stepId = step.id;
				button.classList.toggle(
					'hmap-dim',
					view.filter !== 'all' && !step.linkedModuleIds.some(moduleMatches),
				);
				const estimate = project.estimates.find((e) => e.id === step.estimateId);
				let value = '-';
				if (estimate) {
					const v = estimate.value;
					value =
						v.type === 'range'
							? `${v.minMinutes}–${v.maxMinutes} min (${v.metric})`
							: v.type === 'text'
								? v.text
								: v.type === 'unknown'
									? '?'
									: 'n/a';
				}
				button.append(
					element('span', 'hmap-stereotype', '<<' + step.stereotype + '>>'),
					element('strong', '', step.title),
					element('span', 'hmap-step-estimate', value),
				);
				button.addEventListener(
					'click',
					() => {
						for (const chunk of Array.from(
							upper.querySelectorAll<HTMLElement>('[data-chunk-id]'),
						)) {
							const linked = step.linkedChunkIds.includes(chunk.dataset.chunkId!);
							chunk.classList.toggle('hmap-focused', linked);
						}
						const first = step.linkedChunkIds[0];
						if (first) {
							const target = upper.querySelector<HTMLElement>('[data-chunk-id="' + first + '"]');
							target?.focus({ preventScroll: true });
							target?.scrollIntoView({ block: 'nearest' });
						}
					},
					{ signal: contentSignal },
				);
				row.append(button);
			}
			rail.append(row);
		}
		if (view.filter !== 'all' && !matching)
			status.textContent = ru
				? 'Для выбранной области совпадений нет.'
				: 'No matches for the selected area.';
	};
	const loadLabels = async () => {
		const token = ++labelRevision;
		try {
			const reply = await config.engine.request<{ labels?: Record<string, string> }>('help', {
				options: {
					topic: 'intents',
					language,
					terminologyProfile: view.terminology,
					format: 'json',
				},
			});
			if (!dead && token === labelRevision) {
				labels = reply.result?.labels ?? labels;
				render();
			}
		} catch (cause) {
			error(cause);
		}
	};
	terminology.addEventListener(
		'change',
		() => {
			view.terminology = terminology.value as TerminologyProfile;
			void loadLabels();
		},
		{ signal },
	);
	filter.addEventListener(
		'change',
		() => {
			view.filter = filter.value as RoadmapViewState['filter'];
			render();
		},
		{ signal },
	);
	importButton.addEventListener('click', () => file.click(), { signal });
	file.addEventListener(
		'change',
		async () => {
			const selected = file.files?.[0];
			file.value = '';
			if (!selected || config.readonly) return;
			const token = ++revision;
			try {
				if (selected.size > 8388608)
					throw new EngineError('E_INPUT_LIMIT: input exceeds 8388608 bytes');
				const text = new TextDecoder('utf-8', { fatal: true }).decode(await selected.arrayBuffer());
				const response = await config.engine.request<RoadmapProject>('import', {
					input: { format: 'auto', text },
					options: { language },
				});
				if (dead || token !== revision) return;
				dialog.hidden = false;
				if (!response.ok || !response.result) {
					preview = null;
					accept.hidden = true;
					dialogText.textContent = response.diagnostics
						.map((d) => `${d.code} ${d.pointer}: ${d.message}`)
						.join('\n');
					cancel.focus();
					return;
				}
				preview = { project: clone(response.result), revision: token };
				const changes = diff(project, response.result);
				accept.hidden = false;
				dialogText.textContent =
					response.result.title +
					`\n+${changes.added} / −${changes.removed} / Δ${changes.changed}` +
					(response.diagnostics.length
						? '\n' + response.diagnostics.map((d) => d.code + ': ' + d.message).join('\n')
						: '');
				accept.focus();
			} catch (cause) {
				error(cause);
			}
		},
		{ signal },
	);
	const closeReview = () => {
		preview = null;
		dialog.hidden = true;
		importButton.focus();
	};
	cancel.addEventListener('click', closeReview, { signal });
	dialog.addEventListener(
		'keydown',
		(event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeReview();
			}
			if (event.key === 'Tab') {
				const first = accept.hidden ? cancel : accept;
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					cancel.focus();
				} else if (!event.shiftKey && document.activeElement === cancel) {
					event.preventDefault();
					first.focus();
				}
			}
		},
		{ signal },
	);
	accept.addEventListener(
		'click',
		() => {
			if (!preview || preview.revision !== revision || config.readonly) return;
			project = clone(preview.project);
			++revision;
			view.selectedIntentId = project.selectedIntentId;
			view.selectedRouteId = project.selectedRouteId;
			closeReview();
			render();
			config.onChange?.(clone(project));
		},
		{ signal },
	);
	const resize = (value: number) => {
		const total = container.clientHeight || 600;
		view.splitter = Math.max(140, Math.min(total - 160, value));
		container.style.setProperty('--hmap-upper', view.splitter + 'px');
		divider.setAttribute('aria-valuemin', '140');
		divider.setAttribute('aria-valuemax', String(Math.max(140, total - 160)));
		divider.setAttribute('aria-valuenow', String(view.splitter));
	};
	divider.addEventListener(
		'keydown',
		(event) => {
			if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
				event.preventDefault();
				const current = view.splitter || upper.clientHeight;
				resize(
					event.key === 'Home'
						? 140
						: event.key === 'End'
							? container.clientHeight
							: current + (event.key === 'ArrowUp' ? -20 : 20),
				);
			}
		},
		{ signal },
	);
	let dragging = false;
	divider.addEventListener(
		'pointerdown',
		(event) => {
			dragging = true;
			divider.setPointerCapture(event.pointerId);
		},
		{ signal },
	);
	divider.addEventListener(
		'pointermove',
		(event) => {
			if (dragging) resize(event.clientY - upper.getBoundingClientRect().top);
		},
		{ signal },
	);
	divider.addEventListener(
		'pointerup',
		() => {
			dragging = false;
		},
		{ signal },
	);
	divider.addEventListener(
		'pointercancel',
		() => {
			dragging = false;
		},
		{ signal },
	);
	render();
	await loadLabels();
	return {
		destroy() {
			if (dead) return;
			dead = true;
			++revision;
			++labelRevision;
			abort.abort();
			renderAbort.abort();
			container.remove();
		},
		getProject() {
			check();
			return clone(project);
		},
		getViewState() {
			check();
			return clone(view);
		},
		async setProject(candidate: RoadmapProject) {
			check();
			const token = ++revision;
			const accepted = await validate(clone(candidate));
			if (dead || token !== revision) return;
			project = accepted;
			view.selectedIntentId = project.selectedIntentId;
			view.selectedRouteId = project.selectedRouteId;
			preview = null;
			dialog.hidden = true;
			render();
		},
	};
}
