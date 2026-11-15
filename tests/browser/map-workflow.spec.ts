import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const fixture = JSON.parse(readFileSync('test/fixtures/minimal-v2.roadmap.json', 'utf8'));
async function ready(page: any) {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	return page.locator('#first');
}
async function add(root: any, kind: string, title: string) {
	await root.locator('.hmap-add-menu > summary').click();
	await root.locator(`[data-add-kind=${kind}]`).click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill(title);
	await form.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(form).not.toBeVisible();
}
const state = (page: any) =>
	page.evaluate(() => (window as any).hmapEmbeddingTest.first.getProject());

test('an empty map starts with an intention and immediately shows several intention origins', async ({
	page,
}) => {
	const root = await ready(page);
	await page.evaluate(() => (window as any).hmapEmbeddingTest.first.newProject());
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('A fresh map');
	await form.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(form).not.toBeVisible();
	await root.locator('.hmap-add-menu > summary').click();
	for (const kind of ['module', 'chunk', 'route', 'step', 'intersection', 'estimate'])
		await expect(root.locator(`[data-add-kind=${kind}]`)).toBeDisabled();
	await expect(root.locator('[data-add-kind=intent]')).toBeEnabled();
	await expect(root.locator('.hmap-add-choices')).toContainText(
		'Add or select an intention first.',
	);
	await root.locator('.hmap-add-menu > summary').click();
	await add(root, 'intent', 'First result');
	await expect(root.locator('.hmap-intent-origin')).toHaveCount(1);
	await expect(root.locator('.hmap-intent-origin')).toContainText('First result');
	await root.locator('.hmap-add-menu > summary').click();
	await expect(root.locator('[data-add-kind=route]')).toBeEnabled();
	await expect(root.locator('[data-add-kind=step]')).toBeDisabled();
	await expect(root.locator('[data-add-kind=intersection]')).toBeDisabled();
	await root.locator('.hmap-add-menu > summary').click();
	await add(root, 'intent', 'Second result');
	await expect(root.locator('.hmap-intent-origin')).toHaveCount(2);
	expect((await state(page)).routes).toEqual([]);
	const first = root.locator('.hmap-map-line').first();
	await first.locator('[data-line-add=route]').click();
	await form.getByLabel('Title', { exact: true }).fill('First implementation');
	await form.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(form).not.toBeVisible();
	await first.locator('[data-line-add=step]').click();
	await form.getByLabel('Title', { exact: true }).fill('Observe the result');
	await form.getByRole('button', { name: 'Create', exact: true }).click();
	await expect(form).not.toBeVisible();
	const p = await state(page);
	expect(p.routes[0].intentId).toBe(p.intents[0].id);
	expect(p.routes[0].steps).toHaveLength(1);
	expect(p.intents).toHaveLength(2);
	await expect(root.locator('.hmap-intent-origin')).toHaveCount(2);
});

test('an intersection explains and enforces two selected sources before submission', async ({
	page,
}) => {
	const root = await ready(page);
	await root.locator('.hmap-add-menu > summary').click();
	await root.locator('[data-add-kind=intersection]').click();
	const form = root.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('Shared contract');
	const submit = form.getByRole('button', { name: 'Create', exact: true });
	await expect(submit).toBeDisabled();
	await expect(form).toContainText('Select at least two different sources.');
	const sources = form.locator('fieldset input[type=checkbox]');
	await sources.nth(0).check();
	await expect(submit).toBeDisabled();
	await sources.nth(1).check();
	await expect(submit).toBeEnabled();
	await submit.click();
	await expect(form).not.toBeVisible();
	const before = await state(page);
	expect(before.intersections[0].sourceIds).toHaveLength(2);
	await root.locator('[data-edit-kind=intersection]').click();
	await form.locator('fieldset input:checked').first().uncheck();
	await expect(form.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
	await form.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(await state(page)).toEqual(before);
});

test('all lines share the C++ projection and selecting a step changes only its view context', async ({
	page,
}) => {
	const root = await ready(page);
	const p = structuredClone(fixture);
	p.intents.push({ ...structuredClone(p.intents[0]), id: 'i-other', title: 'Another result' });
	p.routes.push({ id: 'r-alternative', intentId: 'i-check', title: 'Alternative', steps: [] });
	p.selectedIntentId = p.selectedRouteId = null;
	const expected = await page.evaluate(async (p) => {
		const app = (window as any).hmapEmbeddingTest;
		await app.first.setProject(p);
		return (
			await app.engine.request('render', {
				input: { format: 'json', text: JSON.stringify(p) },
				options: { format: 'json' },
			})
		).result.rows.map((r: any) => [r.intent.id, r.route?.id ?? null]);
	}, p);
	await expect(root.locator('.hmap-intent-origin')).toHaveCount(3);
	const actual = await root
		.locator('.hmap-map-line')
		.evaluateAll((nodes) =>
			nodes.map((n) => [
				(n as HTMLElement).dataset.intentId,
				(n as HTMLElement).dataset.routeId ?? null,
			]),
		);
	expect(actual).toEqual(expected);
	await root.locator('.hmap-step[data-step-id=s-validation]').click();
	await expect(root.locator('[data-entity-id=m-validator]')).toHaveClass(/hmap-focused/);
	await root.locator('.hmap-add-menu > summary').click();
	await expect(root.locator('[data-add-kind=step]')).toBeEnabled();
	expect(await state(page)).toEqual(p);
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.changes)).toBe(0);
});
