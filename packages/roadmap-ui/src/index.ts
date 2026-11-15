import { createTranslator, isLocale, type Locale } from './locales.ts';
import type {
	RoadmapProject,
	RoadmapStorageAdapter,
	TerminologyProfile,
	ModuleKind,
} from '../../roadmap-storage/src/index.ts';
import type { RoadmapEngine } from './engine.ts';
import { EngineError, projectCodec } from './engine.ts';
import './style.css';
import { createAuthoringForm } from './authoring-form.ts';
import { createDraftProject, additionUnavailable } from './authoring.ts';
import type { AuthoringTarget, EntityKind } from './authoring.ts';
export * from './engine.ts';
export * from '../../roadmap-storage/src/index.ts';
export interface RoadmapFeatureFlags {
	editing: boolean;
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
	language?: Locale;
	readonly?: boolean;
	features?: Partial<RoadmapFeatureFlags>;
	onChange?: (project: RoadmapProject) => void;
	onError?: (error: Error) => void;
}
export interface RoadmapViewState {
	selectedStepId: string | null;
	selectedIntentId: string | null;
	selectedRouteId: string | null;
	filter: 'all' | ModuleKind;
	terminology: TerminologyProfile;
	splitter: number;
}
export interface RoadmapEditorInstance {
	newProject(): void;
	setLanguage(language: Locale): boolean;
	hasOpenDraft(): boolean;
	destroy(): void;
	getProject(): RoadmapProject;
	setProject(
		project: RoadmapProject,
		options?: { preserveView?: boolean; isCurrent?: () => boolean },
	): Promise<void>;
	getViewState(): RoadmapViewState;
}
interface MapProjection {
	rows: {
		intent: RoadmapProject['intents'][number];
		route: RoadmapProject['routes'][number] | null;
	}[];
}
let sequence = 0;
const clone = <T>(value: T): T => structuredClone(value);
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
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
	let project = await validate(
		initial ?? createDraftProject(config.newProjectId!, 'Untitled project'),
	);
	const loadMap = async (candidate: RoadmapProject): Promise<MapProjection> => {
		const reply = await config.engine.request<MapProjection>('render', {
			input: { format: 'json', text: JSON.stringify(candidate) },
			options: { format: 'json' },
		});
		if (!reply.ok || !reply.result)
			throw new EngineError('Unable to project the map', reply.diagnostics);
		return reply.result;
	};
	let map = await loadMap(project);
	let language: Locale = config.language ?? 'en';
	if (!isLocale(language)) throw new TypeError('Supported languages: en, uk, ru');
	const t = createTranslator(() => language);
	const features = {
		importButton: true,
		markdownExport: true,
		terminologySelector: false,
		editing: true,
		linkedAreaFilter: true,
		...config.features,
	};
	const canEdit = !config.readonly && features.editing;
	const view: RoadmapViewState = {
		selectedStepId: null,
		selectedIntentId: project.selectedIntentId,
		selectedRouteId: project.selectedRouteId,
		filter: 'all',
		terminology:
			config.terminology ??
			(features.terminologySelector ? project.terminologyProfile : 'engineering'),
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
	container.setAttribute('aria-label', t('Roadmap editor'));
	const controls = element('div', 'hmap-controls');
	const upper = element('article', 'hmap-source');
	upper.setAttribute('aria-label', t('Literate source'));
	const divider = element('div', 'hmap-divider');
	divider.tabIndex = 0;
	divider.setAttribute('role', 'separator');
	divider.setAttribute('aria-orientation', 'horizontal');
	divider.setAttribute('aria-label', t('Panel height'));
	const rail = element('section', 'hmap-rail');
	rail.setAttribute('aria-label', t('Horizontal map'));
	const status = element('p', 'hmap-status');
	status.setAttribute('role', 'status');
	const dialog = element('dialog', 'hmap-import-review');
	dialog.hidden = true;
	dialog.setAttribute('role', 'dialog');
	dialog.setAttribute('aria-modal', 'true');
	dialog.setAttribute('aria-label', t('Review import'));
	const dialogText = element('pre', 'hmap-review-text');
	const accept = element('button', '', t('Accept import'));
	const cancel = element('button', '', t('Cancel'));
	dialog.append(dialogText, accept, cancel);
	container.append(controls, upper, divider, rail, dialog);
	config.root.append(container);
	let preview: { project: RoadmapProject; map: MapProjection; revision: number } | null = null;
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
	terminology.setAttribute('aria-label', t('Terminology'));
	for (const value of ['engineering', 'simple', 'product', 'literary']) {
		const option = element('option', '', value);
		option.value = value;
		terminology.append(option);
	}
	terminology.value = view.terminology;
	const filter = element('select', '');
	filter.setAttribute('aria-label', t('Linked area'));
	for (const value of ['all', 'core', 'ui', 'storage', 'export', 'demo', 'validation']) {
		const option = element(
			'option',
			'',
			t(
				(
					{
						all: 'All areas',
						core: 'Core',
						ui: 'Interface',
						storage: 'Storage',
						export: 'Export',
						demo: 'Example',
						validation: 'Validation',
					} as const
				)[value as 'all' | 'core' | 'ui' | 'storage' | 'export' | 'demo' | 'validation'],
			),
		);
		option.value = value;
		filter.append(option);
	}
	const importButton = element('button', '', t('Import'));
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
	const setSelection = (accepted: RoadmapProject, before?: RoadmapProject) => {
		if (
			!before ||
			before.selectedIntentId !== accepted.selectedIntentId ||
			before.selectedRouteId !== accepted.selectedRouteId ||
			!accepted.intents.some((i) => i.id === view.selectedIntentId)
		) {
			view.selectedIntentId = accepted.selectedIntentId;
			view.selectedRouteId = accepted.selectedRouteId;
		}
		if (
			!accepted.routes.some(
				(r) => r.id === view.selectedRouteId && r.intentId === view.selectedIntentId,
			)
		)
			view.selectedRouteId = null;
		if (
			!accepted.routes.some(
				(r) => r.id === view.selectedRouteId && r.steps.some((s) => s.id === view.selectedStepId),
			)
		)
			view.selectedStepId = null;
	};
	const authoring = createAuthoringForm({
		root: container,
		prefix,
		getLanguage: () => language,
		getProject: () => clone(project),
		getSelection: () => ({ intentId: view.selectedIntentId, routeId: view.selectedRouteId }),
		onError: error,
		onOpen() {
			++revision;
			preview = null;
			if (dialog.open) dialog.close();
			dialog.hidden = true;
		},
		async apply(candidate, isCurrent) {
			if (!canEdit || dead) return false;
			const token = ++revision;
			const response = await config.engine.request<RoadmapProject>('validate', {
				input: { format: 'json', text: JSON.stringify(candidate) },
				options: { language },
			});
			if (dead || token !== revision || !isCurrent()) return false;
			if (!response.ok || !response.result)
				throw new EngineError(
					response.diagnostics.map((d) => `${d.code} ${d.pointer}: ${d.message}`).join('\n'),
					response.diagnostics,
				);
			const projected = await loadMap(response.result);
			if (dead || token !== revision || !isCurrent()) return false;
			const before = project;
			map = projected;
			project = clone(response.result);
			setSelection(project, before);
			render();
			status.textContent =
				t('Changes applied. Save the map to keep them in this browser.') +
				(response.diagnostics.length ? t(' Warnings: ') + response.diagnostics.length : '');
			config.onChange?.(clone(project));
			return true;
		},
	});
	const addButtons = new Map<EntityKind, { button: HTMLButtonElement; note: HTMLElement }>();
	const updateActionAvailability = () => {
		for (const [kind, { button, note }] of addButtons) {
			const reason = additionUnavailable(project, kind, {
				intentId: view.selectedIntentId,
				routeId: view.selectedRouteId,
			});
			button.disabled = !!reason;
			note.textContent = !reason
				? ''
				: reason === 'intent-required'
					? t('Add or select an intention first.')
					: reason === 'route-required'
						? t('Create and select a route first.')
						: t('Requires two intentions, steps, components or explanations.');
			note.hidden = !reason;
			button.title = note.textContent;
		}
	};
	if (canEdit) {
		const add = element('details', 'hmap-add-menu');
		add.append(element('summary', '', t('+ Add')));
		const choices = element('div', 'hmap-add-choices');
		const options: [EntityKind, string][] = [
			['intent', t('Intention')],
			['module', t('Component')],
			['chunk', t('Contract / explanation')],
			['route', t('Route')],
			['step', t('Route step')],
			['intersection', t('Intersection')],
			['estimate', t('Estimate')],
		];
		for (const [kind, title] of options) {
			const button = element('button', '', title);
			button.dataset.addKind = kind;
			button.addEventListener(
				'click',
				() => {
					add.open = false;
					authoring.add(kind);
				},
				{ signal },
			);
			const wrapper = element('div', 'hmap-add-choice');
			const note = element('small', 'hmap-action-note');
			note.id = prefix + '-add-note-' + kind;
			button.setAttribute('aria-describedby', note.id);
			addButtons.set(kind, { button, note });
			wrapper.append(button, note);
			choices.append(wrapper);
		}
		add.append(choices);
		controls.prepend(add);
	}
	const editButton = (target: AuthoringTarget, title: string) => {
		const button = element('button', 'hmap-edit', t('Edit'));
		button.setAttribute('aria-label', t('Edit: ') + title);
		button.dataset.editKind = target.kind;
		button.dataset.editId = target.id;
		button.addEventListener('click', () => authoring.open(target), { signal: renderAbort.signal });
		return button;
	};
	const estimateText = (entry: RoadmapProject['estimates'][number]) => {
		const v = entry.value;
		return v.type === 'range'
			? `${v.minMinutes}–${v.maxMinutes} ${t('min')} · ${v.metric === 'effort' ? t('effort') : t('elapsed')}`
			: v.type === 'text'
				? v.text
				: (v.type === 'unknown' ? t('Unknown: ') : t('Not applicable: ')) + v.reason;
	};
	const render = () => {
		if (dead) return;
		renderAbort.abort();
		renderAbort = new AbortController();
		const contentSignal = renderAbort.signal;
		upper.replaceChildren();
		rail.replaceChildren();
		updateActionAvailability();
		const projectHeading = element('div', 'hmap-heading-row');
		const title = element('h1', 'hmap-section-name hmap-project-heading');
		title.append(
			'<<' + t('Project') + ': ',
			element('span', 'hmap-project-title', project.title),
			'>>',
		);
		projectHeading.append(title);
		if (canEdit)
			projectHeading.append(editButton({ kind: 'project', id: project.id }, project.title));
		upper.append(projectHeading);
		if (!project.intents.length)
			upper.append(
				element(
					'p',
					'hmap-empty',
					t(
						'Start with an intention: what result should the system provide? It will immediately appear in the horizontal map.',
					),
				),
			);
		upper.append(status);
		status.textContent = '';
		const moduleMatches = (id: string) =>
			view.filter === 'all' || project.modules.some((m) => m.id === id && m.kind === view.filter);
		let matching = 0;
		for (const intent of project.intents) {
			const heading = element('h2', 'hmap-section-name hmap-intent-heading');
			const button = element('button', '', '<<' + labels.intent + ': ' + intent.title + '>>');
			button.setAttribute('aria-label', labels.intent + ': ' + intent.title);
			button.dataset.intentId = intent.id;
			button.setAttribute('aria-pressed', String(view.selectedIntentId === intent.id));
			button.addEventListener(
				'click',
				() => {
					view.selectedIntentId = intent.id;
					view.selectedStepId = null;
					const routes = project.routes.filter((r) => r.intentId === intent.id);
					view.selectedRouteId = routes.length === 1 ? routes[0].id : null;
					render();
				},
				{ signal: contentSignal },
			);
			heading.append(button);
			const row = element('div', 'hmap-heading-row');
			row.append(heading);
			row.dataset.entityId = intent.id;
			row.tabIndex = -1;
			if (canEdit) row.append(editButton({ kind: 'intent', id: intent.id }, intent.title));
			upper.append(row, element('p', '', intent.summary));
			const criteria = element('ul', '');
			for (const criterion of intent.acceptanceCriteria)
				criteria.append(element('li', '', criterion));
			upper.append(criteria);
			const routes = element('p', 'hmap-route-choices');
			for (const route of project.routes.filter((r) => r.intentId === intent.id)) {
				const link = element('button', '', '<<' + labels.route + ': ' + route.title + '>>');
				link.setAttribute('aria-label', labels.route + ': ' + route.title);
				link.dataset.routeId = route.id;
				link.setAttribute('aria-pressed', String(view.selectedRouteId === route.id));
				link.addEventListener(
					'click',
					() => {
						view.selectedIntentId = intent.id;
						view.selectedRouteId = route.id;
						view.selectedStepId = null;
						render();
					},
					{ signal: contentSignal },
				);
				const choice = element('span', 'hmap-route-choice');
				choice.append(link);
				if (canEdit) choice.append(editButton({ kind: 'route', id: route.id }, route.title));
				routes.append(choice);
			}
			upper.append(routes);
		}
		const selectedStep = project.routes
			.flatMap((r) => r.steps)
			.find((s) => s.id === view.selectedStepId);
		if (project.modules.length)
			upper.append(element('h2', 'hmap-section-name', '<<' + t('Architecture') + '>>'));
		for (const module of project.modules) {
			const section = element('section', 'hmap-module');
			section.dataset.entityId = module.id;
			section.tabIndex = -1;
			const matches = moduleMatches(module.id);
			section.classList.toggle('hmap-dim', !matches);
			if (matches) ++matching;
			section.classList.toggle(
				'hmap-focused',
				selectedStep?.linkedModuleIds.includes(module.id) ?? false,
			);
			const row = element('div', 'hmap-heading-row');
			row.append(
				element('h3', 'hmap-section-name', '<<' + labels.module + ': ' + module.title + '>>'),
			);
			if (canEdit) row.append(editButton({ kind: 'module', id: module.id }, module.title));
			const uses = project.routes.filter((r) =>
				r.steps.some((s) => s.linkedModuleIds.includes(module.id)),
			);
			section.append(row, element('p', '', module.summary));
			section.append(
				element(
					'p',
					'hmap-related',
					t('Used by routes: ') + (uses.map((r) => r.title).join('; ') || t('not linked yet')),
				),
			);
			if (module.codeRefs.length)
				section.append(
					element(
						'p',
						'hmap-code-reference',
						module.codeRefs
							.map(
								(c) =>
									`${c.repository} / ${c.path} @ ${c.revision ?? t('unspecified')} ${c.symbol ?? ''}`,
							)
							.join('\n'),
					),
				);
			upper.append(section);
		}
		if (project.chunks.length)
			upper.append(
				element('h2', 'hmap-section-name', '<<' + t('Contracts and explanations') + '>>'),
			);
		for (const chunk of project.chunks) {
			const section = element('section', 'hmap-chunk');
			section.id = prefix + '-' + chunk.id;
			section.tabIndex = -1;
			section.dataset.chunkId = chunk.id;
			section.dataset.entityId = chunk.id;
			const matches = view.filter === 'all' || chunk.linkedModuleIds.some(moduleMatches);
			section.classList.toggle('hmap-dim', !matches);
			if (matches) ++matching;
			section.classList.toggle(
				'hmap-focused',
				selectedStep?.linkedChunkIds.includes(chunk.id) ?? false,
			);
			const row = element('div', 'hmap-heading-row');
			row.append(element('h3', 'hmap-section-name hmap-chunk-label', '<<' + chunk.name + '>>'));
			if (canEdit) row.append(editButton({ kind: 'chunk', id: chunk.id }, chunk.name));
			section.append(row, element('div', 'hmap-body', chunk.body));
			const modules = project.modules.filter((m) => chunk.linkedModuleIds.includes(m.id));
			if (modules.length)
				section.append(
					element('p', 'hmap-related', t('Components: ') + modules.map((m) => m.title).join('; ')),
				);
			upper.append(section);
		}
		for (const intersection of project.intersections) {
			const section = element('section', 'hmap-intersection');
			const row = element('div', 'hmap-heading-row');
			row.append(
				element(
					'h3',
					'hmap-section-name',
					'<<' + labels.intersection + ': ' + intersection.title + '>>',
				),
			);
			if (canEdit)
				row.append(editButton({ kind: 'intersection', id: intersection.id }, intersection.title));
			section.append(row, element('p', '', intersection.note));
			upper.append(section);
		}
		for (const estimate of project.estimates) {
			const section = element('section', 'hmap-estimate');
			const row = element('div', 'hmap-heading-row');
			row.append(
				element('h3', 'hmap-section-name', '<<' + t('Estimate') + ': ' + estimate.label + '>>'),
			);
			if (canEdit) row.append(editButton({ kind: 'estimate', id: estimate.id }, estimate.label));
			section.append(
				row,
				element('p', 'hmap-estimate-detail', estimateText(estimate)),
				element('p', '', estimate.basis),
			);
			upper.append(section);
		}
		rail.append(element('h2', 'hmap-map-title', t('Horizontal map')));
		const stepSummary = element(
			'p',
			'hmap-step-summary',
			!map.rows.length
				? t('Add an intention: every map line begins with one.')
				: t(
						'Select a line to work on its route. Select a step to reveal its components and explanations above.',
					),
		);
		rail.append(stepSummary);
		for (const { intent, route } of map.rows) {
			const line = element('section', 'hmap-map-line');
			line.dataset.intentId = intent.id;
			if (route) line.dataset.routeId = route.id;
			line.classList.toggle(
				'hmap-active-line',
				view.selectedIntentId === intent.id && view.selectedRouteId === (route?.id ?? null),
			);
			const heading = element('div', 'hmap-heading-row');
			const caption = element('button', 'hmap-line-select', route?.title ?? intent.title);
			caption.dataset.selectLine = route?.id ?? intent.id;
			const selectLine = () => {
				view.selectedIntentId = intent.id;
				view.selectedRouteId = route?.id ?? null;
				view.selectedStepId = null;
			};
			caption.addEventListener(
				'click',
				() => {
					selectLine();
					render();
				},
				{ signal: contentSignal },
			);
			heading.append(caption);
			if (canEdit) {
				const add = element('button', '', route ? t('+ Step') : t('+ Route'));
				add.dataset.lineAdd = route ? 'step' : 'route';
				add.addEventListener(
					'click',
					() => {
						selectLine();
						updateActionAvailability();
						authoring.add(route ? 'step' : 'route');
					},
					{ signal: contentSignal },
				);
				heading.append(add);
				if (route) heading.append(editButton({ kind: 'route', id: route.id }, route.title));
			}
			const row = element('div', 'hmap-route-row');
			row.dataset.intentId = intent.id;
			if (route) row.dataset.routeId = route.id;
			row.tabIndex = 0;
			row.setAttribute('role', 'group');
			row.setAttribute('aria-label', intent.title + (route ? ' — ' + route.title : ''));
			const origin = element('button', 'hmap-intent-origin');
			origin.dataset.intentId = intent.id;
			if (route) origin.dataset.routeId = route.id;
			origin.setAttribute(
				'aria-pressed',
				String(view.selectedIntentId === intent.id && view.selectedRouteId === (route?.id ?? null)),
			);
			origin.append(
				element('span', 'hmap-stereotype', labels.intent),
				element('strong', '', intent.title),
			);
			origin.addEventListener(
				'click',
				() => {
					selectLine();
					render();
					const target = Array.from(upper.querySelectorAll<HTMLElement>('[data-entity-id]')).find(
						(n) => n.dataset.entityId === intent.id,
					);
					target?.focus({ preventScroll: true });
					target?.scrollIntoView({ block: 'nearest' });
				},
				{ signal: contentSignal },
			);
			row.append(origin);
			for (const step of route?.steps ?? []) {
				{
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
				const value = estimate ? estimateText(estimate) : t('No estimate');
				button.setAttribute('aria-pressed', String(view.selectedStepId === step.id));
				button.title = t('Show the components and contracts for this step');
				button.append(
					element(
						'span',
						'hmap-stereotype',
						t(
							(
								{
									intent: 'Intention',
									module: 'Component',
									shared: 'Reuse',
									validation: 'Validation',
									export: 'Delivery',
								} as const
							)[step.stereotype],
						),
					),
					element('strong', '', step.title),
					element('span', 'hmap-step-estimate', value),
				);
				button.addEventListener(
					'click',
					() => {
						view.selectedIntentId = intent.id;
						view.selectedRouteId = route!.id;
						view.selectedStepId = step.id;
						updateActionAvailability();
						for (const line of Array.from(rail.querySelectorAll<HTMLElement>('.hmap-map-line')))
							line.classList.toggle('hmap-active-line', line.dataset.routeId === route!.id);
						for (const origin of Array.from(
							rail.querySelectorAll<HTMLElement>('.hmap-intent-origin'),
						))
							origin.setAttribute('aria-pressed', String(origin.dataset.routeId === route!.id));
						const ids = [...step.linkedChunkIds, ...step.linkedModuleIds];
						for (const node of Array.from(upper.querySelectorAll<HTMLElement>('[data-entity-id]')))
							node.classList.toggle('hmap-focused', ids.includes(node.dataset.entityId!));
						for (const node of Array.from(rail.querySelectorAll<HTMLElement>('[data-step-id]')))
							node.setAttribute('aria-pressed', String(node.dataset.stepId === step.id));
						stepSummary.textContent =
							step.title +
							(ids.length
								? t(' — linked elements are highlighted above.')
								: t(' — add links using Edit.'));
						const target = Array.from(upper.querySelectorAll<HTMLElement>('[data-entity-id]')).find(
							(n) => n.dataset.entityId === ids[0],
						);
						target?.focus({ preventScroll: true });
						target?.scrollIntoView({ block: 'nearest' });
					},
					{ signal: contentSignal },
				);
				const group = element('div', 'hmap-step-group');
				group.append(button);
				const linkedNames = [
					...project.modules.filter((m) => step.linkedModuleIds.includes(m.id)).map((m) => m.title),
					...project.chunks.filter((c) => step.linkedChunkIds.includes(c.id)).map((c) => c.name),
				];
				if (linkedNames.length)
					button.append(element('span', 'hmap-step-links', linkedNames.join(' · ')));
				if (canEdit)
					group.append(editButton({ kind: 'step', id: step.id, routeId: route!.id }, step.title));
				row.append(group);
			}
			if (!route || !route.steps.length)
				row.append(
					element(
						'p',
						'hmap-empty',
						!route
							? t('Continue this intention by adding a route.')
							: t('Add the first step to this route.'),
					),
				);
			line.append(heading, row);
			rail.append(line);
		}
		if (view.filter !== 'all' && !matching)
			status.textContent = t('No matches for the selected area.');
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
				if (!features.terminologySelector)
					labels = {
						intent: t('Intention'),
						route: t('Route'),
						module: t('Component'),
						chunk: t('Contract'),
						intersection: t('Intersection'),
					};
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
				authoring.close();
				dialog.hidden = false;
				if (!dialog.open) dialog.showModal();
				if (!response.ok || !response.result) {
					preview = null;
					accept.hidden = true;
					dialogText.textContent = response.diagnostics
						.map((d) => `${d.code} ${d.pointer}: ${d.message}`)
						.join('\n');
					cancel.focus();
					return;
				}
				const projected = await loadMap(response.result);
				if (dead || token !== revision) return;
				preview = { project: clone(response.result), map: projected, revision: token };
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
		++revision;
		preview = null;
		if (dialog.open) dialog.close();
		dialog.hidden = true;
		importButton.focus();
	};
	cancel.addEventListener('click', closeReview, { signal });
	dialog.addEventListener(
		'cancel',
		(event) => {
			event.preventDefault();
			closeReview();
		},
		{ signal },
	);
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
			map = preview.map;
			++revision;
			setSelection(project);
			closeReview();
			render();
			config.onChange?.(clone(project));
		},
		{ signal },
	);
	const resize = (value: number) => {
		const total = container.clientHeight || 600;
		const maximum = Math.max(
			140,
			total -
				controls.getBoundingClientRect().height -
				divider.getBoundingClientRect().height -
				180,
		);
		view.splitter = Math.max(140, Math.min(maximum, value));
		container.style.setProperty('--hmap-upper', view.splitter + 'px');
		divider.setAttribute('aria-valuemin', '140');
		divider.setAttribute('aria-valuemax', String(maximum));
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
	const localizeControls = () => {
		container.lang = language;
		container.setAttribute('aria-label', t('Roadmap editor'));
		upper.setAttribute('aria-label', t('Literate source'));
		divider.setAttribute('aria-label', t('Panel height'));
		rail.setAttribute('aria-label', t('Horizontal map'));
		dialog.setAttribute('aria-label', t('Review import'));
		terminology.setAttribute('aria-label', t('Terminology'));
		filter.setAttribute('aria-label', t('Linked area'));
		importButton.textContent = t('Import');
		accept.textContent = t('Accept import');
		cancel.textContent = t('Cancel');
		const summary = controls.querySelector('.hmap-add-menu > summary');
		if (summary) summary.textContent = t('+ Add');
		const names = {
			intent: 'Intention',
			route: 'Route',
			step: 'Route step',
			module: 'Component',
			chunk: 'Contract / explanation',
			intersection: 'Intersection',
			estimate: 'Estimate',
		} as const;
		for (const [kind, { button }] of addButtons) button.textContent = t(names[kind]);
		const areas = {
			all: 'All areas',
			core: 'Core',
			ui: 'Interface',
			storage: 'Storage',
			export: 'Export',
			demo: 'Example',
			validation: 'Validation',
		} as const;
		for (const option of filter.options)
			option.textContent = t(areas[option.value as keyof typeof areas]);
		labels = {
			intent: t('Intention'),
			route: t('Route'),
			module: t('Component'),
			chunk: t('Contract'),
			intersection: t('Intersection'),
		};
	};
	localizeControls();

	render();
	await loadLabels();
	return {
		setLanguage(next: Locale) {
			check();
			if (!isLocale(next)) throw new TypeError('Supported languages: en, uk, ru');
			if (container.querySelector('dialog[open]')) return false;
			language = next;
			localizeControls();
			render();
			void loadLabels();
			return true;
		},
		hasOpenDraft() {
			check();
			return !!container.querySelector('dialog[open]');
		},
		newProject() {
			check();
			if (!canEdit) throw new Error('Authoring is disabled');
			authoring.newProject();
		},
		destroy() {
			if (dead) return;
			dead = true;
			++revision;
			++labelRevision;
			abort.abort();
			renderAbort.abort();
			authoring.destroy();
			if (dialog.open) dialog.close();
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
		async setProject(
			candidate: RoadmapProject,
			options?: { preserveView?: boolean; isCurrent?: () => boolean },
		) {
			check();
			const token = ++revision;
			const accepted = await validate(clone(candidate));
			const projected = await loadMap(accepted);
			if (dead || token !== revision || options?.isCurrent?.() === false) return;
			authoring.close();
			const before = project;
			project = accepted;
			map = projected;
			setSelection(project, options?.preserveView ? before : undefined);
			preview = null;
			if (dialog.open) dialog.close();
			dialog.hidden = true;
			render();
		},
	};
}
