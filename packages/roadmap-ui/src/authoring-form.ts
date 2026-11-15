import type { RoadmapProject } from '../../roadmap-storage/src/index.ts';
import {
	AuthoringError,
	createDraftProject,
	entityNames,
	entityPosition,
	prepareAddition,
	prepareDeletion,
	reorderEntity,
} from './authoring.ts';
import type { AuthoringTarget, EntityKind } from './authoring.ts';

export function createAuthoringForm(config: {
	root: HTMLElement;
	prefix: string;
	ru: boolean;
	getProject(): RoadmapProject;
	getSelection(): { intentId: string | null; routeId: string | null };
	apply(project: RoadmapProject, isCurrent: () => boolean): Promise<boolean>;
	onError(error: Error): void;
	onOpen(): void;
}) {
	const t = (ru: string, en: string) => (config.ru ? ru : en);
	const names: Record<AuthoringTarget['kind'], string> = {
		project: t('карты', 'map'),
		'new-project': t('новой карты', 'new map'),
		intent: t('намерения', 'intention'),
		route: t('маршрута', 'route'),
		step: t('шага', 'step'),
		module: t('компонента', 'component'),
		chunk: t('контракта / пояснения', 'contract / explanation'),
		intersection: t('пересечения', 'intersection'),
		estimate: t('оценки', 'estimate'),
	};
	const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
		const result = document.createElement(tag);
		if (text !== undefined) result.textContent = text;
		return result;
	};
	const dialog = node('dialog');
	dialog.className = 'hmap-authoring-dialog';
	config.root.append(dialog);
	let session = 0;
	let opener: HTMLElement | null = null;
	let formAbort = new AbortController();
	const close = () => {
		++session;
		formAbort.abort();
		if (dialog.open) dialog.close();
		if (opener?.isConnected) opener.focus();
		else config.root.querySelector<HTMLElement>('button')?.focus();
	};
	dialog.addEventListener('keydown', (event) => {
		if (event.key !== 'Tab') return;
		const controls = Array.from(
			dialog.querySelectorAll<HTMLElement>(
				'input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled),summary',
			),
		).filter((node) => node.getClientRects().length > 0);
		const first = controls[0],
			last = controls.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
	});
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		close();
	});
	const show = (
		original: RoadmapProject,
		draft: RoadmapProject,
		target: AuthoringTarget,
		isNew: boolean,
	) => {
		config.onOpen();
		const nextOpener =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		close();
		opener = nextOpener;
		const token = ++session;
		formAbort = new AbortController();
		const signal = formAbort.signal;
		dialog.replaceChildren();
		const heading = node(
			'h2',
			(isNew ? t('Создание ', 'Create ') : t('Изменение ', 'Edit ')) + names[target.kind],
		);
		heading.id = config.prefix + '-form-heading';
		dialog.setAttribute('aria-labelledby', heading.id);
		const form = node('form');
		form.className = 'hmap-authoring-form';
		const fields = node('div');
		fields.className = 'hmap-fields';
		const error = node('pre');
		error.className = 'hmap-form-error';
		error.setAttribute('role', 'alert');
		const actions = node('div');
		actions.className = 'hmap-form-actions';
		const submit = node('button', isNew ? t('Создать', 'Create') : t('Применить', 'Apply'));
		submit.type = 'submit';
		const cancel = node('button', t('Отменить', 'Cancel'));
		cancel.type = 'button';
		cancel.addEventListener('click', close, { signal });
		actions.append(submit, cancel);
		form.append(fields, error, actions);
		dialog.append(heading, form);
		let fieldSequence = 0;
		const label = (title: string, control: HTMLElement, parent: HTMLElement = fields) => {
			const wrapper = node('div');
			wrapper.className = 'hmap-field';
			const caption = node('label', title);
			control.id = config.prefix + '-field-' + ++fieldSequence;
			caption.htmlFor = control.id;
			wrapper.append(caption, control);
			parent.append(wrapper);
		};
		const input = (title: string, value: string, required = false, parent?: HTMLElement) => {
			const control = node('input');
			control.type = 'text';
			control.value = value;
			control.required = required;
			label(title, control, parent);
			return control;
		};
		const text = (title: string, value: string, rows = 4) => {
			const control = node('textarea');
			control.value = value;
			control.rows = rows;
			label(title, control);
			return control;
		};
		const select = (title: string, value: string, options: [string, string][]) => {
			const control = node('select');
			for (const [id, title] of options) {
				const option = node('option', title);
				option.value = id;
				control.append(option);
			}
			control.value = value;
			label(title, control);
			return control;
		};
		const links = (title: string, selected: string[], options: { id: string; title: string }[]) => {
			const group = node('fieldset');
			group.className = 'hmap-link-choices';
			group.append(node('legend', title));
			if (!options.length)
				group.append(node('p', t('Пока нет объектов для связи.', 'No objects to link yet.')));
			const controls = options.map((option) => {
				const wrapper = node('label');
				const control = node('input');
				control.type = 'checkbox';
				control.value = option.id;
				control.checked = selected.includes(option.id);
				wrapper.append(control, node('span', option.title), node('small', option.id));
				group.append(wrapper);
				return control;
			});
			fields.append(group);
			return () => controls.filter((c) => c.checked).map((c) => c.value);
		};
		const numeric = (title: string, value: number, min: number, max?: number) => {
			const control = input(title, String(value), true);
			control.type = 'number';
			control.min = String(min);
			control.step = '1';
			if (max !== undefined) control.max = String(max);
			return control;
		};
		const titleLabel = t('Название', 'Title');
		const summaryLabel = t('Описание', 'Description');
		const intentOptions = draft.intents.map((v) => ({ id: v.id, title: v.title }));
		const moduleOptions = draft.modules.map((v) => ({ id: v.id, title: v.title }));
		const chunkOptions = draft.chunks.map((v) => ({ id: v.id, title: v.name }));
		let collect: () => void = () => {};
		switch (target.kind) {
			case 'project':
			case 'new-project': {
				const title = input(titleLabel, draft.title, true);
				fields.append(
					node(
						'p',
						target.kind === 'new-project'
							? t(
									'После создания текущая карта заменится пустым проектом. Сохранение выполняется отдельной кнопкой.',
									'Creating replaces the current map with an empty project. Saving is a separate action.',
								)
							: t(
									'Текст и связи изменяются в формах соответствующих объектов.',
									'Edit text and links in the forms for individual objects.',
								),
					),
				);
				collect = () => {
					draft.title = title.value;
				};
				break;
			}
			case 'intent': {
				const value = draft.intents.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.title, true);
				const summary = text(summaryLabel, value.summary);
				const criteria = text(
					t('Критерии результата — по одному на строку', 'Acceptance criteria — one per line'),
					value.acceptanceCriteria.join('\n'),
				);
				const status = select(t('Состояние', 'Status'), value.status, [
					['draft', t('Черновик', 'Draft')],
					['active', t('Активно', 'Active')],
					['implemented', t('Реализовано', 'Implemented')],
					['deferred', t('Отложено', 'Deferred')],
				]);
				const kind = select(t('Характер намерения', 'Intention kind'), value.kind, [
					['finite', t('Конечный результат', 'Finite result')],
					['continuous', t('Постоянное намерение', 'Continuous intention')],
				]);
				const parents = links(
					t('Происходит из намерений', 'Originating intentions'),
					value.parentIntentIds,
					intentOptions.filter((v) => v.id !== value.id),
				);
				collect = () => {
					value.title = title.value;
					value.summary = summary.value;
					value.acceptanceCriteria = criteria.value
						.split(/\r?\n/)
						.map((s) => s.trim())
						.filter(Boolean);
					value.status = status.value as typeof value.status;
					value.kind = kind.value as typeof value.kind;
					value.parentIntentIds = parents();
				};
				break;
			}
			case 'route': {
				const value = draft.routes.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.title, true);
				const intent = select(
					t('Намерение', 'Intention'),
					value.intentId,
					intentOptions.map((v) => [v.id, v.title]),
				);
				collect = () => {
					value.title = title.value;
					value.intentId = intent.value;
					if (draft.selectedRouteId === value.id) draft.selectedIntentId = value.intentId;
				};
				break;
			}
			case 'step': {
				const value = draft.routes
					.find((v) => v.id === target.routeId)!
					.steps.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.title, true);
				const kind = select(t('Роль шага', 'Step role'), value.stereotype, [
					['intent', t('Уточнение намерения', 'Intention')],
					['module', t('Реализация компонента', 'Component')],
					['shared', t('Повторное использование', 'Reuse')],
					['validation', t('Проверка', 'Validation')],
					['export', t('Передача результата', 'Delivery')],
				]);
				const modules = links(
					t('Компоненты архитектуры', 'Architecture components'),
					value.linkedModuleIds,
					moduleOptions,
				);
				const chunks = links(
					t('Контракты и пояснения', 'Contracts and explanations'),
					value.linkedChunkIds,
					chunkOptions,
				);
				const estimate = select(t('Оценка', 'Estimate'), value.estimateId ?? '', [
					['', t('Без оценки', 'No estimate')],
					...draft.estimates.map((v) => [v.id, v.label] as [string, string]),
				]);
				collect = () => {
					value.title = title.value;
					value.stereotype = kind.value as typeof value.stereotype;
					value.linkedModuleIds = modules();
					value.linkedChunkIds = chunks();
					value.estimateId = estimate.value || null;
				};
				break;
			}
			case 'module': {
				const value = draft.modules.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.title, true);
				const summary = text(summaryLabel, value.summary);
				const kind = select(t('Область', 'Area'), value.kind, [
					['core', t('Ядро', 'Core')],
					['ui', t('Интерфейс', 'Interface')],
					['storage', t('Хранение', 'Storage')],
					['export', t('Экспорт', 'Export')],
					['demo', t('Пример', 'Example')],
					['validation', t('Проверка', 'Validation')],
				]);
				const existence = select(t('Наличие компонента', 'Component existence'), value.existence, [
					['planned', t('Запланирован', 'Planned')],
					['existing', t('Существует', 'Existing')],
					['deprecated', t('Выведен из использования', 'Deprecated')],
				]);
				const intents = links(
					t('Поддерживаемые намерения', 'Supported intentions'),
					value.linkedIntentIds,
					intentOptions,
				);
				const refs = node('fieldset');
				refs.className = 'hmap-code-refs';
				refs.append(node('legend', t('Ссылки на код', 'Code references')));
				fields.append(refs);
				const rows: {
					root: HTMLElement;
					repository: HTMLInputElement;
					path: HTMLInputElement;
					revision: HTMLInputElement;
					symbol: HTMLInputElement;
				}[] = [];
				const addRef = (ref: (typeof value.codeRefs)[number]) => {
					const root = node('div');
					root.className = 'hmap-code-ref-row';
					refs.append(root);
					const row = {
						root,
						repository: input(t('Репозиторий', 'Repository'), ref.repository, true, root),
						path: input(t('Путь в репозитории', 'Repository path'), ref.path, true, root),
						revision: input(
							t('Ревизия (необязательно)', 'Revision (optional)'),
							ref.revision ?? '',
							false,
							root,
						),
						symbol: input(
							t('Символ (необязательно)', 'Symbol (optional)'),
							ref.symbol ?? '',
							false,
							root,
						),
					};
					const remove = node('button', t('Убрать ссылку', 'Remove reference'));
					remove.type = 'button';
					root.append(remove);
					remove.addEventListener(
						'click',
						() => {
							rows.splice(rows.indexOf(row), 1);
							root.remove();
						},
						{ signal },
					);
					rows.push(row);
				};
				for (const ref of value.codeRefs) addRef(ref);
				const add = node('button', t('Добавить ссылку на код', 'Add code reference'));
				add.type = 'button';
				refs.append(add);
				add.addEventListener(
					'click',
					() => addRef({ repository: '', path: '', revision: null, symbol: null }),
					{ signal },
				);
				collect = () => {
					value.title = title.value;
					value.summary = summary.value;
					value.kind = kind.value as typeof value.kind;
					value.existence = existence.value as typeof value.existence;
					value.linkedIntentIds = intents();
					value.codeRefs = rows.map((row) => ({
						repository: row.repository.value,
						path: row.path.value,
						revision: row.revision.value || null,
						symbol: row.symbol.value || null,
					}));
				};
				break;
			}
			case 'chunk': {
				const value = draft.chunks.find((v) => v.id === target.id)!;
				const name = input(titleLabel, value.name, true);
				const body = text(t('Текст', 'Text'), value.body, 9);
				const modules = links(
					t('Компоненты архитектуры', 'Architecture components'),
					value.linkedModuleIds,
					moduleOptions,
				);
				const intents = links(
					t('Связанные намерения', 'Linked intentions'),
					value.linkedIntentIds,
					intentOptions,
				);
				collect = () => {
					value.name = name.value;
					value.body = body.value;
					value.linkedModuleIds = modules();
					value.linkedIntentIds = intents();
				};
				break;
			}
			case 'intersection': {
				const value = draft.intersections.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.title, true);
				const note = text(t('Объяснение связи', 'Connection note'), value.note);
				const sources = links(
					t('Общие объекты — минимум два', 'Shared objects — at least two'),
					value.sourceIds,
					entityNames(draft).filter((v) => ['intent', 'step', 'module', 'chunk'].includes(v.kind)),
				);
				collect = () => {
					value.title = title.value;
					value.note = note.value;
					value.sourceIds = sources();
				};
				break;
			}
			case 'estimate': {
				const value = draft.estimates.find((v) => v.id === target.id)!;
				const title = input(titleLabel, value.label, true);
				const basis = text(t('Основание оценки', 'Estimate basis'), value.basis);
				const confidence = select(t('Уверенность', 'Confidence'), value.confidence, [
					['low', t('Низкая', 'Low')],
					['medium', t('Средняя', 'Medium')],
					['high', t('Высокая', 'High')],
				]);
				const type = select(t('Тип оценки', 'Estimate type'), value.value.type, [
					['unknown', t('Пока неизвестна', 'Unknown')],
					['range', t('Числовой диапазон', 'Numeric range')],
					['text', t('Текстовая оценка', 'Text estimate')],
					['not-applicable', t('Неприменима', 'Not applicable')],
				]);
				const reason = input(
					t('Причина', 'Reason'),
					'reason' in value.value ? value.value.reason : '',
				);
				const description = input(
					t('Текст оценки', 'Estimate text'),
					value.value.type === 'text' ? value.value.text : '',
				);
				const metric = select(
					t('Измерение', 'Metric'),
					value.value.type === 'range' ? value.value.metric : 'effort',
					[
						['effort', t('Трудоёмкость', 'Effort')],
						['elapsed', t('Календарное время', 'Elapsed time')],
					],
				);
				const min = numeric(
					t('От, минут', 'Minimum minutes'),
					value.value.type === 'range' ? value.value.minMinutes : 0,
					0,
				);
				const max = numeric(
					t('До, минут', 'Maximum minutes'),
					value.value.type === 'range' ? value.value.maxMinutes : 0,
					0,
				);
				const update = () => {
					for (const control of [reason, description, metric, min, max]) {
						const visible =
							control === reason
								? ['unknown', 'not-applicable'].includes(type.value)
								: control === description
									? type.value === 'text'
									: type.value === 'range';
						control.closest<HTMLElement>('.hmap-field')!.hidden = !visible;
						if (control instanceof HTMLInputElement) control.required = visible;
					}
				};
				type.addEventListener('change', update, { signal });
				update();
				collect = () => {
					value.label = title.value;
					value.basis = basis.value;
					value.confidence = confidence.value as typeof value.confidence;
					value.value =
						type.value === 'range'
							? {
									type: 'range',
									metric: metric.value as 'effort' | 'elapsed',
									minMinutes: min.valueAsNumber,
									maxMinutes: max.valueAsNumber,
								}
							: type.value === 'text'
								? { type: 'text', text: description.value }
								: { type: type.value as 'unknown' | 'not-applicable', reason: reason.value };
				};
				break;
			}
		}
		let position: HTMLInputElement | undefined;
		if (target.kind !== 'project' && target.kind !== 'new-project') {
			const order = entityPosition(draft, target);
			position = numeric(t('Позиция в списке', 'Position in list'), order.position, 1, order.count);
		}
		const identity = node('details');
		identity.className = 'hmap-identity';
		identity.append(node('summary', t('Идентификатор', 'Identity')), node('code', target.id));
		fields.append(identity);
		let proposal = () => {
			collect();
			return position ? reorderEntity(draft, target, position.valueAsNumber) : draft;
		};
		if (!isNew && target.kind !== 'project') {
			const remove = node('button', t('Удалить…', 'Delete…'));
			remove.type = 'button';
			remove.className = 'hmap-delete';
			actions.append(remove);
			remove.addEventListener(
				'click',
				() => {
					const deletion = prepareDeletion(original, target);
					fields.replaceChildren(node('p', t('Будут удалены:', 'Objects to delete:')));
					const list = node('ul');
					for (const item of deletion.removed)
						list.append(node('li', item.title + ' · ' + item.id));
					fields.append(
						list,
						node(
							'p',
							t('Снимаемых ссылок: ', 'References to detach: ') + deletion.detachedReferences,
						),
						node(
							'p',
							t(
								'Общие компоненты и пояснения сохраняются, если они сами не выбраны для удаления.',
								'Shared components and explanations are retained unless explicitly selected for deletion.',
							),
						),
					);
					remove.remove();
					error.textContent = '';
					submit.textContent = t('Подтвердить удаление', 'Confirm deletion');
					proposal = () => deletion.project;
					cancel.focus();
				},
				{ signal },
			);
		}
		form.addEventListener(
			'submit',
			async (event) => {
				event.preventDefault();
				if (submit.disabled) return;
				let candidate: RoadmapProject;
				try {
					candidate = proposal();
				} catch (cause) {
					error.textContent = String(cause);
					return;
				}
				const controls = Array.from(
					form.querySelectorAll<
						HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
					>('input,select,textarea,button'),
				).filter((c) => c !== cancel);
				controls.forEach((c) => (c.disabled = true));
				error.textContent = t('Проверка изменений…', 'Validating changes…');
				try {
					const accepted = await config.apply(candidate, () => token === session && dialog.open);
					if (token !== session) return;
					if (accepted) close();
				} catch (cause) {
					if (token === session)
						error.textContent = cause instanceof Error ? cause.message : String(cause);
				} finally {
					if (token === session) controls.forEach((c) => (c.disabled = false));
				}
			},
			{ signal },
		);
		dialog.showModal();
		form.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
	};
	const open = (target: AuthoringTarget) => {
		const original = config.getProject();
		show(original, structuredClone(original), target, false);
	};
	const add = (kind: EntityKind) => {
		try {
			const original = config.getProject();
			const prepared = prepareAddition(original, kind, config.getSelection());
			show(original, prepared.project, prepared.target, true);
		} catch (cause) {
			const message =
				cause instanceof AuthoringError
					? cause.code === 'intent-required'
						? t('Сначала добавьте намерение.', 'Add an intention first.')
						: t('Сначала создайте и выберите маршрут.', 'Create and select a route first.')
					: String(cause);
			config.onError(new Error(message));
		}
	};
	return {
		open,
		add,
		close,
		newProject() {
			const id = 'p-' + crypto.randomUUID();
			show(config.getProject(), createDraftProject(id), { kind: 'new-project', id }, true);
		},
		destroy() {
			close();
			dialog.remove();
		},
	};
}
