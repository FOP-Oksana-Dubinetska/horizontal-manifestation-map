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
import { createDraftProject } from './authoring.ts';
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
	language?: 'en' | 'ru';
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
	hasOpenDraft(): boolean;
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
	const language = config.language ?? 'en',
		ru = language === 'ru';
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
	const dialog = element('dialog', 'hmap-import-review');
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
			value === 'all'
				? ru
					? 'Все области'
					: 'All areas'
				: ru
					? (
							{
								core: 'Ядро',
								ui: 'Интерфейс',
								storage: 'Хранение',
								export: 'Экспорт',
								demo: 'Пример',
								validation: 'Проверка',
							} as Record<string, string>
						)[value]
					: value,
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
		ru,
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
			const before = project;
			project = clone(response.result);
			setSelection(project, before);
			render();
			status.textContent =
				(ru
					? 'Изменения применены. Сохраните карту, чтобы оставить их в браузере.'
					: 'Changes applied. Save the map to keep them in this browser.') +
				(response.diagnostics.length
					? (ru ? ' Предупреждений: ' : ' Warnings: ') + response.diagnostics.length
					: '');
			config.onChange?.(clone(project));
			return true;
		},
	});
	if (canEdit) {
		const add = element('details', 'hmap-add-menu');
		add.append(element('summary', '', ru ? '+ Добавить' : '+ Add'));
		const choices = element('div', 'hmap-add-choices');
		const options: [EntityKind, string][] = [
			['intent', ru ? 'Намерение' : 'Intention'],
			['module', ru ? 'Компонент' : 'Component'],
			['chunk', ru ? 'Контракт / пояснение' : 'Contract / explanation'],
			['route', ru ? 'Маршрут' : 'Route'],
			['step', ru ? 'Шаг маршрута' : 'Route step'],
			['intersection', ru ? 'Пересечение' : 'Intersection'],
			['estimate', ru ? 'Оценка' : 'Estimate'],
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
			choices.append(button);
		}
		add.append(choices);
		controls.prepend(add);
	}
	const editButton = (target: AuthoringTarget, title: string) => {
		const button = element('button', 'hmap-edit', ru ? 'Изменить' : 'Edit');
		button.setAttribute('aria-label', (ru ? 'Изменить: ' : 'Edit: ') + title);
		button.dataset.editKind = target.kind;
		button.dataset.editId = target.id;
		button.addEventListener('click', () => authoring.open(target), { signal: renderAbort.signal });
		return button;
	};
	const estimateText = (entry: RoadmapProject['estimates'][number]) => {
		const v = entry.value;
		return v.type === 'range'
			? `${v.minMinutes}–${v.maxMinutes} ${ru ? 'мин' : 'min'} · ${v.metric === 'effort' ? (ru ? 'трудоёмкость' : 'effort') : ru ? 'календарное время' : 'elapsed'}`
			: v.type === 'text'
				? v.text
				: (v.type === 'unknown'
						? ru
							? 'Пока неизвестно: '
							: 'Unknown: '
						: ru
							? 'Неприменимо: '
							: 'Not applicable: ') + v.reason;
	};
	const render = () => {
		if (dead) return;
		renderAbort.abort();
		renderAbort = new AbortController();
		const contentSignal = renderAbort.signal;
		upper.replaceChildren();
		rail.replaceChildren();
		const projectHeading = element('div', 'hmap-heading-row');
		projectHeading.append(element('h1', 'hmap-project-title', project.title));
		if (canEdit)
			projectHeading.append(editButton({ kind: 'project', id: project.id }, project.title));
		upper.append(projectHeading);
		if (!project.intents.length)
			upper.append(
				element(
					'p',
					'hmap-empty',
					ru
						? 'Начните с намерения: какой результат должна обеспечить система? Затем добавьте компоненты, контракты и маршрут.'
						: 'Start with an intention: what result should the system provide? Then add components, contracts and a route.',
				),
			);
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
			if (canEdit) row.append(editButton({ kind: 'intent', id: intent.id }, intent.title));
			upper.append(row, element('p', '', intent.summary));
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
			upper.append(element('h2', '', ru ? 'Архитектура' : 'Architecture'));
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
			row.append(element('h3', '', labels.module + ': ' + module.title));
			if (canEdit) row.append(editButton({ kind: 'module', id: module.id }, module.title));
			const uses = project.routes.filter((r) =>
				r.steps.some((s) => s.linkedModuleIds.includes(module.id)),
			);
			section.append(row, element('p', '', module.summary));
			section.append(
				element(
					'p',
					'hmap-related',
					(ru ? 'Используется в маршрутах: ' : 'Used by routes: ') +
						(uses.map((r) => r.title).join('; ') || (ru ? 'пока не связан' : 'not linked yet')),
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
									`${c.repository} / ${c.path} @ ${c.revision ?? (ru ? 'ревизия не указана' : 'unspecified')} ${c.symbol ?? ''}`,
							)
							.join('\n'),
					),
				);
			upper.append(section);
		}
		if (project.chunks.length)
			upper.append(element('h2', '', ru ? 'Контракты и пояснения' : 'Contracts and explanations'));
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
			row.append(element('h3', 'hmap-chunk-label', '<<' + chunk.name + '>>'));
			if (canEdit) row.append(editButton({ kind: 'chunk', id: chunk.id }, chunk.name));
			section.append(row, element('div', 'hmap-body', chunk.body));
			const modules = project.modules.filter((m) => chunk.linkedModuleIds.includes(m.id));
			if (modules.length)
				section.append(
					element(
						'p',
						'hmap-related',
						(ru ? 'Компоненты: ' : 'Components: ') + modules.map((m) => m.title).join('; '),
					),
				);
			upper.append(section);
		}
		for (const intersection of project.intersections) {
			const section = element('section', 'hmap-intersection');
			const row = element('div', 'hmap-heading-row');
			row.append(element('h3', '', labels.intersection + ': ' + intersection.title));
			if (canEdit)
				row.append(editButton({ kind: 'intersection', id: intersection.id }, intersection.title));
			section.append(row, element('p', '', intersection.note));
			upper.append(section);
		}
		for (const estimate of project.estimates) {
			const section = element('section', 'hmap-estimate');
			const row = element('div', 'hmap-heading-row');
			row.append(element('h3', '', estimate.label));
			if (canEdit) row.append(editButton({ kind: 'estimate', id: estimate.id }, estimate.label));
			section.append(
				row,
				element('p', 'hmap-estimate-detail', estimateText(estimate)),
				element('p', '', estimate.basis),
			);
			upper.append(section);
		}
		const route = project.routes.find(
			(r) => r.id === view.selectedRouteId && r.intentId === view.selectedIntentId,
		);
		if (route) {
			const heading = element('div', 'hmap-heading-row');
			heading.append(element('h2', '', route.title));
			if (canEdit) {
				const addStep = element('button', '', ru ? '+ Шаг' : '+ Step');
				addStep.addEventListener('click', () => authoring.add('step'), { signal: contentSignal });
				heading.append(addStep);
			}
			rail.append(heading);
		}
		const stepSummary = element(
			'p',
			'hmap-step-summary',
			ru
				? 'Выберите шаг, чтобы увидеть связанные компоненты и контракты.'
				: 'Select a step to see its components and contracts.',
		);
		rail.append(stepSummary);
		if (!route || !route.steps.length)
			rail.append(
				element(
					'p',
					'hmap-empty',
					ru
						? 'Выберите маршрут. Добавьте шаги через «+ Добавить».'
						: 'Select a route. Add steps using “+ Add”.',
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
				const value = estimate ? estimateText(estimate) : ru ? 'Без оценки' : 'No estimate';
				button.setAttribute('aria-pressed', String(view.selectedStepId === step.id));
				button.title = ru
					? 'Показать компоненты и контракты шага'
					: 'Show the components and contracts for this step';
				button.append(
					element(
						'span',
						'hmap-stereotype',
						ru
							? {
									intent: 'Намерение',
									module: 'Компонент',
									shared: 'Повторное использование',
									validation: 'Проверка',
									export: 'Передача',
								}[step.stereotype]
							: '<<' + step.stereotype + '>>',
					),
					element('strong', '', step.title),
					element('span', 'hmap-step-estimate', value),
				);
				button.addEventListener(
					'click',
					() => {
						view.selectedStepId = step.id;
						const ids = [...step.linkedChunkIds, ...step.linkedModuleIds];
						for (const node of Array.from(upper.querySelectorAll<HTMLElement>('[data-entity-id]')))
							node.classList.toggle('hmap-focused', ids.includes(node.dataset.entityId!));
						for (const node of Array.from(rail.querySelectorAll<HTMLElement>('[data-step-id]')))
							node.setAttribute('aria-pressed', String(node.dataset.stepId === step.id));
						stepSummary.textContent =
							step.title +
							(ids.length
								? ru
									? ' — связанные элементы выделены выше.'
									: ' — linked elements are highlighted above.'
								: ru
									? ' — добавьте связи через «Изменить».'
									: ' — add links using Edit.');
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
					group.append(editButton({ kind: 'step', id: step.id, routeId: route.id }, step.title));
				row.append(group);
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
				if (!features.terminologySelector && ru)
					labels = {
						...labels,
						intent: 'Намерение',
						route: 'Маршрут',
						module: 'Компонент',
						chunk: 'Контракт',
						intersection: 'Пересечение',
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
				120,
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
	render();
	await loadLabels();
	return {
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
		async setProject(candidate: RoadmapProject) {
			check();
			const token = ++revision;
			const accepted = await validate(clone(candidate));
			if (dead || token !== revision) return;
			authoring.close();
			project = accepted;
			setSelection(project);
			preview = null;
			if (dialog.open) dialog.close();
			dialog.hidden = true;
			render();
		},
	};
}
