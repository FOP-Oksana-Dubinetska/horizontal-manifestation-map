import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const fixture = JSON.parse(readFileSync('test/fixtures/minimal-v2.roadmap.json', 'utf8'));
async function ready(page: any) {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	return page.locator('#first');
}
async function add(root: any, kind: string) {
	await root.locator('.hmap-add-menu > summary').click();
	await root.locator(`[data-add-kind="${kind}"]`).click();
	return root.locator('.hmap-authoring-dialog');
}
async function accept(form: any, create = true) {
	await form.getByRole('button', { name: create ? 'Create' : 'Apply', exact: true }).click();
	await expect(form).not.toBeVisible();
}
const state = (page: any) =>
	page.evaluate(() => (window as any).hmapEmbeddingTest.first.getProject());

test('author creates an architecture map, links contracts to steps and reorders stable identities', async ({
	page,
}) => {
	const root = await ready(page);
	await page.evaluate(() => (window as any).hmapEmbeddingTest.first.newProject());
	let form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('Author workspace');
	await accept(form);
	form = await add(root, 'intent');
	await form.getByLabel('Title', { exact: true }).fill('Edit and preserve the architecture');
	await form
		.getByLabel('Acceptance criteria — one per line', { exact: true })
		.fill('Links survive a rename.\nChanges are saved explicitly.');
	await accept(form);
	form = await add(root, 'module');
	await form.getByLabel('Title', { exact: true }).fill('Shared storage');
	await form.getByLabel('Area', { exact: true }).selectOption('storage');
	await accept(form);
	form = await add(root, 'chunk');
	await form.getByLabel('Title', { exact: true }).fill('Storage contract');
	await form
		.getByLabel('Text', { exact: true })
		.fill('The host owns persistence.\nA rejected candidate preserves the accepted map.');
	await form.getByRole('checkbox', { name: /^Shared storage/ }).check();
	await accept(form);
	form = await add(root, 'route');
	await form.getByLabel('Title', { exact: true }).fill('Authoring route');
	await accept(form);
	form = await add(root, 'step');
	await form.getByLabel('Title', { exact: true }).fill('Connect the storage adapter');
	await form.getByLabel('Step role', { exact: true }).selectOption('shared');
	await form.getByRole('checkbox', { name: /^Shared storage/ }).check();
	await form.getByRole('checkbox', { name: /^Storage contract/ }).check();
	await accept(form);
	form = await add(root, 'step');
	await form.getByLabel('Title', { exact: true }).fill('Explain the architecture');
	await form.getByLabel('Position in list', { exact: true }).fill('1');
	await accept(form);
	const project = await state(page);
	expect(project.intents[0].acceptanceCriteria).toHaveLength(2);
	expect(project.routes[0].steps.map((s: any) => s.id)).toEqual(['s-2', 's-1']);
	expect(project.routes[0].steps[1].linkedModuleIds).toEqual(['m-1']);
	expect(project.routes[0].steps[1].linkedChunkIds).toEqual(['c-1']);
	await root.locator('.hmap-step[data-step-id="s-1"]').click();
	await expect(root.locator('[data-entity-id="m-1"]')).toHaveClass(/hmap-focused/);
	await expect(root.locator('[data-chunk-id="c-1"]')).toHaveClass(/hmap-focused/);
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.changes)).toBe(7);
});

test('text editing retains identity, cancellation and literal HTML preserve the accepted map', async ({
	page,
}) => {
	const root = await ready(page);
	const before = await state(page);
	await root.locator('[data-edit-kind="chunk"]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Text', { exact: true }).fill('Discarded draft');
	await form.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(await state(page)).toEqual(before);
	await root.locator('[data-edit-kind="chunk"]').click();
	await form.getByLabel('Title', { exact: true }).fill('Renamed contract');
	await form
		.getByLabel('Text', { exact: true })
		.fill('<img src=x onerror="window.hmapXss=1">\nAn authored paragraph.');
	await accept(form, false);
	const after = await state(page);
	expect(after.chunks[0].id).toBe(before.chunks[0].id);
	expect(after.routes[0].steps[0].linkedChunkIds).toEqual(before.routes[0].steps[0].linkedChunkIds);
	await expect(root.locator('.hmap-body')).toContainText('<img src=x');
	expect(await page.evaluate(() => (window as any).hmapXss)).toBeUndefined();
});

test('C++ rejects a cycle and the form keeps the authored draft for correction', async ({
	page,
}) => {
	const root = await ready(page);
	const candidate = structuredClone(fixture);
	candidate.intents.push({
		...structuredClone(candidate.intents[0]),
		id: 'i-child',
		title: 'Child intention',
		parentIntentIds: ['i-check'],
	});
	await page.evaluate((p) => (window as any).hmapEmbeddingTest.first.setProject(p), candidate);
	const before = await state(page);
	await root.locator('[data-edit-kind="intent"][data-edit-id="i-check"]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('Draft with a cycle');
	await form.getByRole('checkbox', { name: /^Child intention/ }).check();
	await form.getByRole('button', { name: 'Apply', exact: true }).click();
	await expect(form.locator('.hmap-form-error')).toContainText('E_INTENT_CYCLE');
	await expect(form.getByLabel('Title', { exact: true })).toHaveValue('Draft with a cycle');
	expect(await state(page)).toEqual(before);
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.changes)).toBe(0);
	await form.getByRole('checkbox', { name: /^Child intention/ }).uncheck();
	await accept(form, false);
	expect((await state(page)).intents[0].title).toBe('Draft with a cycle');
});

test('deletion previews detach impact, cancellation preserves state and confirmation retains shared text', async ({
	page,
}) => {
	const root = await ready(page);
	const before = await state(page);
	await root.locator('[data-edit-kind="module"]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByRole('button', { name: 'Delete…', exact: true }).click();
	await expect(form).toContainText('References to detach: 2');
	await form.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(await state(page)).toEqual(before);
	await root.locator('[data-edit-kind="module"]').click();
	await form.getByRole('button', { name: 'Delete…', exact: true }).click();
	await form.getByRole('button', { name: 'Confirm deletion', exact: true }).click();
	await expect(form).not.toBeVisible();
	const after = await state(page);
	expect(after.modules).toHaveLength(0);
	expect(after.chunks[0].body).toBe(before.chunks[0].body);
	expect(after.chunks[0].linkedModuleIds).toEqual([]);
	expect(after.routes[0].steps[1].linkedModuleIds).toEqual([]);
});

test('estimates, intersections and code references use forms and the engine checks range ordering', async ({
	page,
}) => {
	const root = await ready(page);
	let form = await add(root, 'estimate');
	await form.getByLabel('Title', { exact: true }).fill('Implementation effort');
	await form.getByLabel('Estimate type', { exact: true }).selectOption('range');
	await form.getByLabel('Minimum minutes', { exact: true }).fill('120');
	await form.getByLabel('Maximum minutes', { exact: true }).fill('60');
	await form.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(form.locator('.hmap-form-error')).toContainText('E_ESTIMATE');
	await form.getByLabel('Maximum minutes', { exact: true }).fill('240');
	await accept(form);
	form = await add(root, 'intersection');
	await form.getByLabel('Title', { exact: true }).fill('Shared validation contract');
	await form.getByRole('checkbox', { name: /^Валидатор карты/ }).check();
	await form.getByRole('checkbox', { name: /^Контракт проверки/ }).check();
	await accept(form);
	await root.locator('[data-edit-kind="module"]').click();
	form = root.locator('.hmap-authoring-dialog');
	await form.getByRole('button', { name: 'Add code reference', exact: true }).click();
	await form.getByLabel('Repository', { exact: true }).fill('local-project');
	await form.getByLabel('Repository path', { exact: true }).fill('src/storage.cpp');
	await accept(form, false);
	const project = await state(page);
	expect(project.estimates.at(-1).value).toEqual({
		type: 'range',
		minMinutes: 120,
		maxMinutes: 240,
		metric: 'effort',
	});
	expect(project.intersections[0].sourceIds).toEqual(['m-validator', 'c-validation']);
	expect(project.modules[0].codeRefs[0].path).toBe('src/storage.cpp');
});

test('readonly hides authoring, supports host replacement and keeps modal focus inside the active editor', async ({
	page,
}) => {
	const root = await ready(page);
	await expect(page.locator('#second [data-edit-kind], #second .hmap-add-menu')).toHaveCount(0);
	expect(
		await page.evaluate(() => {
			try {
				(window as any).hmapEmbeddingTest.second.newProject();
				return false;
			} catch {
				return true;
			}
		}),
	).toBe(true);
	await root.locator('[data-edit-kind="project"]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await page.keyboard.press('Shift+Tab');
	expect(await form.evaluate((n) => n.contains(document.activeElement))).toBe(true);
	await page.keyboard.press('Escape');
	await expect(form).not.toBeVisible();
	await expect(root.locator('[data-edit-kind="project"]')).toBeFocused();
});

test('cancelling a pending validation prevents a late form from replacing accepted state', async ({
	page,
}) => {
	await ready(page);
	await page.evaluate(async () => {
		const app = (window as any).hmapEmbeddingTest;
		const { createRoadmapEditor } = await import('/embed/hmap-editor.js');
		const root = document.createElement('div');
		root.id = 'delayed-editor';
		root.style.height = '600px';
		document.body.append(root);
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const holder = { editor: null as any, release, completed: false, changes: 0 };
		const delayed = {
			ready: app.engine.ready,
			dispose() {},
			async request(op: string, args: any) {
				if (op === 'validate' && JSON.parse(args.input.text).title === 'Delayed edit') {
					await gate;
					const response = await app.engine.request(op, args);
					holder.completed = true;
					return response;
				}
				return app.engine.request(op, args);
			},
		};
		holder.editor = await createRoadmapEditor({
			root,
			engine: delayed,
			storage: app.storage,
			initialProject: app.first.getProject(),
			onChange: () => ++holder.changes,
		});
		(window as any).authoringDelayTest = holder;
	});
	const root = page.locator('#delayed-editor');
	await root.locator('[data-edit-kind="project"]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('Delayed edit');
	await form.getByRole('button', { name: 'Apply', exact: true }).click();
	await expect(form.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
	await form.getByRole('button', { name: 'Cancel', exact: true }).click();
	await page.evaluate(() => (window as any).authoringDelayTest.release());
	await expect
		.poll(() => page.evaluate(() => (window as any).authoringDelayTest.completed))
		.toBe(true);
	expect(
		await page.evaluate(() => ({
			title: (window as any).authoringDelayTest.editor.getProject().title,
			changes: (window as any).authoringDelayTest.changes,
		})),
	).toEqual({ title: fixture.title, changes: 0 });
});
