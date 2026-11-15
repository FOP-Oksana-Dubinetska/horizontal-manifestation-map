import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
const copies = Object.fromEntries(
	['en', 'uk', 'ru'].map((lang) => [
		lang,
		JSON.parse(readFileSync(`locales/${lang}.json`, 'utf8')),
	]),
);
async function ready(page: Page) {
	await page.goto('/');
	await expect(page.locator('#save')).toBeEnabled();
}
async function source(page: Page) {
	if (!(await page.locator('#file-menu').evaluate((n) => (n as HTMLDetailsElement).open)))
		await page.locator('#file-menu > summary').click();
	const pending = page.waitForEvent('download');
	await page.locator('#download-json').click();
	return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}
function assertCopy(project: any, language: string) {
	for (const entity of [
		project,
		...project.intents,
		...project.routes,
		...project.routes.flatMap((r: any) => r.steps),
		...project.modules,
		...project.chunks,
		...project.intersections,
	])
		for (const [key, text] of Object.entries(copies[language].example[entity.id]))
			expect(entity[key]).toEqual(text);
}
test('the complete pristine example follows language and retains the selected line', async ({
	page,
}) => {
	await ready(page);
	assertCopy(await source(page), 'en');
	await page.locator('.hmap-line-select').last().click();
	const route = await page.locator('.hmap-active-line').getAttribute('data-route-id');
	for (const lang of ['uk', 'ru', 'en']) {
		await page.locator('#language').selectOption(lang);
		await expect(page.locator('.hmap-project-title')).toHaveText(
			copies[lang].example['p-architecture-workspace'].title,
		);
		await expect(page.locator('.hmap-active-line')).toHaveAttribute('data-route-id', route!);
		assertCopy(await source(page), lang);
	}
});
test('saving the sample makes its text persistent across language changes and reload', async ({
	page,
}) => {
	await ready(page);
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText(
		copies.en.host['The map is saved in this browser.'],
	);
	const before = await source(page);
	await page.locator('#language').selectOption('uk');
	await expect(page.locator('.hmap-map-title')).toHaveText('Горизонтальна карта');
	expect(await source(page)).toEqual(before);
	await page.reload();
	await expect(page.locator('#save')).toBeEnabled();
	expect(await source(page)).toEqual(before);
});
test('an edit accepted during a delayed example translation remains the authored source', async ({
	page,
}) => {
	await ready(page);
	let release = () => {},
		requested = false;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route('**/examples/architecture-workspace.uk.roadmap.json', async (route) => {
		requested = true;
		await gate;
		await route.continue();
	});
	await page.locator('#language').selectOption('uk');
	await expect.poll(() => requested).toBe(true);
	await page.locator('[data-edit-kind=project]').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form.getByLabel('Назва', { exact: true }).fill('Мій власний план');
	await form.getByRole('button', { name: 'Застосувати', exact: true }).click();
	await expect(form).not.toBeVisible();
	const response = page.waitForResponse((r) =>
		r.url().endsWith('architecture-workspace.uk.roadmap.json'),
	);
	release();
	await (await response).finished();
	await page.locator('#validate').click();
	await expect(page.locator('#validation-report')).toBeVisible();
	expect((await source(page)).title).toBe('Мій власний план');
	await page.locator('#language').selectOption('ru');
	expect((await source(page)).title).toBe('Мій власний план');
});
test('about sits after help and the licensed GitHub icon precedes Licenses', async ({ page }) => {
	await ready(page);
	await expect(page.locator('.demo-actions #help + #about')).toHaveAttribute('href', '#about-hmap');
	await expect(page.locator('#workspace > a[href="#about-hmap"]')).toHaveCount(0);
	await page.getByRole('link', { name: 'About this project', exact: true }).click();
	await expect(page).toHaveURL(/#about-hmap$/);
	const repository = page.locator('#page-footer > a').first();
	await expect(repository).toHaveAttribute(
		'href',
		'https://github.com/FOP-Oksana-Dubinetska/horizontal-manifestation-map',
	);
	await expect(repository).toHaveAccessibleName('GitHub repository');
	expect(
		await repository
			.locator('img')
			.evaluate(
				(n) => (n as HTMLImageElement).complete && (n as HTMLImageElement).naturalWidth === 16,
			),
	).toBe(true);
	await expect(page.locator('#page-footer > a').nth(1)).toHaveAttribute(
		'href',
		'./licenses/NOTICE.txt',
	);
});
test('vertical reading has compact named sections with semantic headings at both widths', async ({
	page,
}) => {
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await ready(page);
		const sections = await page
			.locator('.hmap-source h1,.hmap-source h2,.hmap-source h3')
			.evaluateAll((nodes) =>
				nodes.map((n) => ({
					name: n.textContent,
					font: parseFloat(getComputedStyle(n).fontSize),
					weight: getComputedStyle(n).fontWeight,
				})),
			);
		expect(sections.length).toBeGreaterThan(8);
		for (const section of sections) {
			expect(section.name).toMatch(/^<<[\s\S]+>>$/);
			expect(section.font).toBeLessThanOrEqual(14);
			expect(section.weight).toBe('400');
		}
		await expect(page.locator('.hmap-source h1')).toHaveCount(1);
		await page.locator('[data-step-id=s-check-map]').click();
		await expect(page.locator('[data-chunk-id=c-validation]')).toHaveClass(/hmap-focused/);
	}
});
test('a superseded presentation replacement preserves the accepted project and view', async ({
	page,
}) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	await page.evaluate(async () => {
		const app = (window as any).hmapEmbeddingTest;
		const { createRoadmapEditor } = await import('/embed/hmap-editor.js');
		const root = document.createElement('div');
		root.style.height = '600px';
		document.body.append(root);
		let release = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const holder: any = { current: true, waiting: false, done: false, release };
		const engine = {
			ready: app.engine.ready,
			dispose() {},
			async request(op: string, args: any) {
				if (
					op === 'render' &&
					JSON.parse(args.input.text).title === 'Translated sample candidate'
				) {
					holder.waiting = true;
					await gate;
				}
				return app.engine.request(op, args);
			},
		};
		holder.editor = await createRoadmapEditor({
			root,
			engine,
			storage: app.storage,
			initialProject: app.first.getProject(),
		});
		holder.before = holder.editor.getProject();
		holder.view = holder.editor.getViewState();
		const candidate = structuredClone(holder.before);
		candidate.title = 'Translated sample candidate';
		holder.pending = holder.editor
			.setProject(candidate, { preserveView: true, isCurrent: () => holder.current })
			.then(() => {
				holder.done = true;
			});
		(window as any).sampleGuardTest = holder;
	});
	await expect.poll(() => page.evaluate(() => (window as any).sampleGuardTest.waiting)).toBe(true);
	const result = await page.evaluate(async () => {
		const h = (window as any).sampleGuardTest;
		h.current = false;
		h.release();
		await h.pending;
		return {
			before: h.before,
			after: h.editor.getProject(),
			view: h.view,
			afterView: h.editor.getViewState(),
		};
	});
	expect(result.after).toEqual(result.before);
	expect(result.afterView).toEqual(result.view);
});
