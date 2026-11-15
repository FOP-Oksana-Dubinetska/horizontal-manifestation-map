import { createTranslator, type Locale } from './locales.ts';
import type { RoadmapProject } from '../../roadmap-storage/src/index.ts';
import {
	AuthoringError,
	createDraftProject,
	intersectionSources,
	entityPosition,
	prepareAddition,
	prepareDeletion,
	reorderEntity,
} from './authoring.ts';
import type { AuthoringTarget, EntityKind } from './authoring.ts';

export function createAuthoringForm(config: {
	root: HTMLElement;
	prefix: string;
	getLanguage(): Locale;
	getProject(): RoadmapProject;
	getSelection(): { intentId: string | null; routeId: string | null };
	apply(project: RoadmapProject, isCurrent: () => boolean): Promise<boolean>;
	onError(error: Error): void;
	onOpen(): void;
}) {
	const t = createTranslator(config.getLanguage);
	const names = (): Record<AuthoringTarget['kind'], string> => ({
		project: t('map'),
		'new-project': t('new map'),
		intent: t('intention'),
		route: t('route'),
		step: t('step'),
		module: t('component'),
		chunk: t('contract / explanation'),
		intersection: t('intersection'),
		estimate: t('estimate'),
	});
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
		const heading = node('h2', (isNew ? t('Create ') : t('Edit ')) + names()[target.kind]);
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
		const submit = node('button', isNew ? t('Create') : t('Apply'));
		submit.type = 'submit';
		const cancel = node('button', t('Cancel'));
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
			if (!options.length) group.append(node('p', t('No objects to link yet.')));
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
		const titleLabel = t('Title');
		const summaryLabel = t('Description');
		const intentOptions = draft.intents.map((v) => ({ id: v.id, title: v.title }));
		const moduleOptions = draft.modules.map((v) => ({ id: v.id, title: v.title }));
		const chunkOptions = draft.chunks.map((v) => ({ id: v.id, title: v.name }));
		let collect: () => void = () => {};
		let checkSources = () => true;
		switch (target.kind) {
			case 'project':
			case 'new-project': {
				const title = input(titleLabel, draft.title, true);
				fields.append(
					node(
						'p',
						target.kind === 'new-project'
							? t(
									'Creating replaces the current map with an empty project. Saving is a separate action.',
								)
							: t('Edit text and links in the forms for individual objects.'),
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
					t('Acceptance criteria — one per line'),
					value.acceptanceCriteria.join('\n'),
				);
				const status = select(t('Status'), value.status, [
					['draft', t('Draft')],
					['active', t('Active')],
					['implemented', t('Implemented')],
					['deferred', t('Deferred')],
				]);
				const kind = select(t('Intention kind'), value.kind, [
					['finite', t('Finite result')],
					['continuous', t('Continuous intention')],
				]);
				const parents = links(
					t('Originating intentions'),
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
					t('Intention'),
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
				const kind = select(t('Step role'), value.stereotype, [
					['intent', t('Intention')],
					['module', t('Component')],
					['shared', t('Reuse')],
					['validation', t('Validation')],
					['export', t('Delivery')],
				]);
				const modules = links(t('Architecture components'), value.linkedModuleIds, moduleOptions);
				const chunks = links(t('Contracts and explanations'), value.linkedChunkIds, chunkOptions);
				const estimate = select(t('Estimate'), value.estimateId ?? '', [
					['', t('No estimate')],
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
				const kind = select(t('Area'), value.kind, [
					['core', t('Core')],
					['ui', t('Interface')],
					['storage', t('Storage')],
					['export', t('Export')],
					['demo', t('Example')],
					['validation', t('Validation')],
				]);
				const existence = select(t('Component existence'), value.existence, [
					['planned', t('Planned')],
					['existing', t('Existing')],
					['deprecated', t('Deprecated')],
				]);
				const intents = links(t('Supported intentions'), value.linkedIntentIds, intentOptions);
				const refs = node('fieldset');
				refs.className = 'hmap-code-refs';
				refs.append(node('legend', t('Code references')));
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
						repository: input(t('Repository'), ref.repository, true, root),
						path: input(t('Repository path'), ref.path, true, root),
						revision: input(t('Revision (optional)'), ref.revision ?? '', false, root),
						symbol: input(t('Symbol (optional)'), ref.symbol ?? '', false, root),
					};
					const remove = node('button', t('Remove reference'));
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
				const add = node('button', t('Add code reference'));
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
				const body = text(t('Text'), value.body, 9);
				const modules = links(t('Architecture components'), value.linkedModuleIds, moduleOptions);
				const intents = links(t('Linked intentions'), value.linkedIntentIds, intentOptions);
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
				const note = text(t('Connection note'), value.note);
				const sources = links(
					t('Shared objects — at least two'),
					value.sourceIds,
					intersectionSources(draft),
				);
				const sourceGroup = fields.lastElementChild!;
				const guidance = node(
					'p',
					t(
						'An intersection describes a relationship between intentions, steps, components or explanations. Select at least two different sources. Routes and estimates are excluded.',
					),
				);
				const count = node('p');
				count.className = 'hmap-source-count';
				count.setAttribute('role', 'status');
				fields.append(guidance, count);
				checkSources = () => {
					const total = sources().length;
					count.textContent = t('Selected sources: ') + total + t(' (minimum 2)');
					submit.disabled = total < 2;
					return total >= 2;
				};
				sourceGroup.addEventListener('change', checkSources, { signal });
				checkSources();
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
				const basis = text(t('Estimate basis'), value.basis);
				const confidence = select(t('Confidence'), value.confidence, [
					['low', t('Low')],
					['medium', t('Medium')],
					['high', t('High')],
				]);
				const type = select(t('Estimate type'), value.value.type, [
					['unknown', t('Unknown')],
					['range', t('Numeric range')],
					['text', t('Text estimate')],
					['not-applicable', t('Not applicable')],
				]);
				const reason = input(t('Reason'), 'reason' in value.value ? value.value.reason : '');
				const description = input(
					t('Estimate text'),
					value.value.type === 'text' ? value.value.text : '',
				);
				const metric = select(
					t('Metric'),
					value.value.type === 'range' ? value.value.metric : 'effort',
					[
						['effort', t('Effort')],
						['elapsed', t('Elapsed time')],
					],
				);
				const min = numeric(
					t('Minimum minutes'),
					value.value.type === 'range' ? value.value.minMinutes : 0,
					0,
				);
				const max = numeric(
					t('Maximum minutes'),
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
			position = numeric(t('Position in list'), order.position, 1, order.count);
		}
		const identity = node('details');
		identity.className = 'hmap-identity';
		identity.append(node('summary', t('Identity')), node('code', target.id));
		fields.append(identity);
		let proposal = () => {
			collect();
			return position ? reorderEntity(draft, target, position.valueAsNumber) : draft;
		};
		if (!isNew && target.kind !== 'project') {
			const remove = node('button', t('Delete…'));
			remove.type = 'button';
			remove.className = 'hmap-delete';
			actions.append(remove);
			remove.addEventListener(
				'click',
				() => {
					const deletion = prepareDeletion(original, target);
					fields.replaceChildren(node('p', t('Objects to delete:')));
					const list = node('ul');
					for (const item of deletion.removed)
						list.append(node('li', item.title + ' · ' + item.id));
					fields.append(
						list,
						node('p', t('References to detach: ') + deletion.detachedReferences),
						node(
							'p',
							t(
								'Shared components and explanations are retained unless explicitly selected for deletion.',
							),
						),
					);
					remove.remove();
					error.textContent = '';
					submit.textContent = t('Confirm deletion');
					checkSources = () => true;
					submit.disabled = false;
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
				if (submit.disabled || !checkSources()) return;
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
				error.textContent = t('Validating changes…');
				try {
					const accepted = await config.apply(candidate, () => token === session && dialog.open);
					if (token !== session) return;
					if (accepted) close();
				} catch (cause) {
					if (token === session)
						error.textContent = cause instanceof Error ? cause.message : String(cause);
				} finally {
					if (token === session) {
						controls.forEach((c) => (c.disabled = false));
						checkSources();
					}
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
						? t('Add or select an intention first.')
						: cause.code === 'sources-required'
							? t('Create at least two intersection sources.')
							: t('Create and select a route first.')
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
