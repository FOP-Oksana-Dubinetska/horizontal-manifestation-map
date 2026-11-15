import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const fixture = JSON.parse(readFileSync('test/fixtures/minimal-v2.roadmap.json', 'utf8'));
test('root and nested URLs load every map line with correct Wasm MIME', async ({ page }) => {
	for (const path of ['/?lang=ru', '/tools/roadmap/?lang=ru']) {
		const failures: string[] = [];
		page.on('pageerror', (e) => failures.push(e.message));
		const wasm = page.waitForResponse((r) => r.url().endsWith('.wasm'));
		await page.goto(path);
		await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
		expect((await wasm).headers()['content-type']).toContain('application/wasm');
		await expect(page.locator('.hmap-route-row')).toHaveCount(2);
		await expect(page.locator('.hmap-intent-origin')).toHaveCount(2);
		expect(failures).toEqual([]);
	}
});
test('embedding isolates two editors, readonly, copies and shared engine lifecycle', async ({
	page,
}) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	await expect(page.locator('#first .hmap-route-row')).toHaveCount(1);
	await expect(page.locator('#second .hmap-controls button')).toHaveCount(0);
	expect(await page.locator('#outside').evaluate((n) => getComputedStyle(n).backgroundColor)).toBe(
		'rgb(18, 52, 86)',
	);
	const result = await page.evaluate(async () => {
		const app = (window as any).hmapEmbeddingTest;
		const copy = app.first.getProject();
		copy.title = 'mutated copy';
		const retained = app.first.getProject().title;
		const accepted = app.first.getProject();
		accepted.title = '<img src=x onerror="window.hmapXss=1">';
		await app.first.setProject(accepted);
		const changes = app.changes;
		app.first.destroy();
		app.first.destroy();
		return {
			retained,
			changes,
			engineOk: (await app.engine.request('getVersions')).ok,
			secondTitle: app.second.getProject().title,
		};
	});
	expect(result.retained).not.toBe('mutated copy');
	expect(result.changes).toBe(0);
	expect(result.engineOk).toBe(true);
	await expect(page.locator('#second .hmap-editor')).toHaveCount(1);
	await expect(page.locator('#first .hmap-editor')).toHaveCount(0);
	expect(await page.evaluate(() => (window as any).hmapXss)).toBeUndefined();
});
test('import is reviewed, cancelled or accepted once, and invalid input preserves state', async ({
	page,
}) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	const candidate = structuredClone(fixture);
	candidate.title = 'Imported candidate';
	candidate.chunks[0].body = '<script>window.hmapXss=1</script>';
	const file = page.locator('#first input[type=file]');
	await file.setInputFiles({
		name: 'candidate.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(candidate)),
	});
	await expect(page.locator('#first [role=dialog]')).toBeVisible();
	await page.locator('#first').getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(
		await page.evaluate(() => (window as any).hmapEmbeddingTest.first.getProject().title),
	).not.toBe(candidate.title);
	await file.setInputFiles({
		name: 'candidate.json',
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(candidate)),
	});
	await page.locator('#first').getByRole('button', { name: 'Accept import', exact: true }).click();
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.changes)).toBe(1);
	expect(await page.evaluate(() => (window as any).hmapXss)).toBeUndefined();
	await file.setInputFiles({
		name: 'bad.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{"bad":true}'),
	});
	await expect(page.locator('#first .hmap-review-text')).toContainText('E_FIELD');
	expect(
		await page.evaluate(() => (window as any).hmapEmbeddingTest.first.getProject().title),
	).toBe(candidate.title);
});
test('splitter keyboard, filter and terminology keep the canonical project', async ({ page }) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	const before = await page.evaluate(() =>
		JSON.stringify((window as any).hmapEmbeddingTest.first.getProject()),
	);
	const divider = page.locator('#first [role=separator]');
	await divider.focus();
	await page.keyboard.press('ArrowUp');
	await expect(divider).toHaveAttribute('aria-valuenow', /\d+/);
	await page.locator('#first select[aria-label="Linked area"]').selectOption('storage');
	await expect(page.locator('#first .hmap-status')).toContainText('No matches');
	await expect(page.locator('#first .hmap-step')).toHaveCount(3);
	await page.locator('#first select[aria-label="Terminology"]').selectOption('simple');
	await expect(page.locator('#first .hmap-intent-heading')).toContainText('Goal:');
	expect(
		await page.evaluate(() => JSON.stringify((window as any).hmapEmbeddingTest.first.getProject())),
	).toBe(before);
});
test('denied local storage is visible and JSON remains downloadable', async ({ page }) => {
	await page.addInitScript(() =>
		Object.defineProperty(window, 'localStorage', {
			get() {
				throw new DOMException('denied', 'SecurityError');
			},
		}),
	);
	await page.goto('/?lang=ru');
	await expect(page.locator('#storage-status')).toContainText('Временная сессия');
	await page.locator('#file-menu > summary').click();
	await expect(page.getByRole('button', { name: 'Скачать JSON', exact: true })).toBeEnabled();
	const downloaded = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Скачать JSON', exact: true }).click();
	expect((await downloaded).suggestedFilename()).toMatch(/\.roadmap\.json$/);
});
test('explicit local save survives reload; initial display performs no hidden project save', async ({
	page,
}) => {
	await page.goto('/?lang=ru');
	await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
	expect(
		await page.evaluate(
			() =>
				Object.keys(localStorage).filter((k) => k.startsWith('ironcreed-roadmap:v2:project:'))
					.length,
		),
	).toBe(0);
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await page.reload();
	await expect(page.locator('#host-status')).toHaveText('Сохранённая карта открыта.');
});
test('late validation never replaces a newer accepted project', async ({ page }) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	const result = await page.evaluate(async () => {
		const app = (window as any).hmapEmbeddingTest;
		const { createRoadmapEditor } = await import('/embed/hmap-editor.js');
		const root = document.createElement('div');
		root.style.height = '500px';
		document.body.append(root);
		const delayed = {
			ready: app.engine.ready,
			dispose() {},
			async request(operation: string, parameters: any) {
				if (operation === 'validate' && JSON.parse(parameters.input.text).title === 'slow')
					await new Promise((resolve) => setTimeout(resolve, 150));
				return app.engine.request(operation, parameters);
			},
		};
		const editor = await createRoadmapEditor({
			root,
			engine: delayed,
			storage: app.storage,
			initialProject: app.first.getProject(),
		});
		const slow = editor.getProject(),
			fast = editor.getProject();
		slow.title = 'slow';
		fast.title = 'fast';
		await Promise.all([editor.setProject(slow), editor.setProject(fast)]);
		const result = editor.getProject().title;
		const pending = editor.setProject(slow);
		editor.destroy();
		await pending;
		return { result, removed: root.children.length === 0 };
	});
	expect(result).toEqual({ result: 'fast', removed: true });
});
test('a later storage quota failure preserves a downloadable current project', async ({ page }) => {
	await page.goto('/?lang=ru');
	await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
	await page.evaluate(() => {
		Storage.prototype.setItem = function () {
			throw new DOMException('full', 'QuotaExceededError');
		};
	});
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
	await expect(page.locator('#host-status')).toContainText('E_STORAGE_QUOTA');
	await expect(page.locator('#storage-status')).not.toContainText('Временная сессия');
	await page.locator('#file-menu > summary').click();
	await expect(page.getByRole('button', { name: 'Скачать JSON', exact: true })).toBeEnabled();
});
test('a second tab detects an external writer and pauses save', async ({ page, context }) => {
	await page.goto('/?lang=ru');
	await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	const other = await context.newPage();
	await other.goto('/?lang=ru');
	await expect(other.locator('#host-status')).toHaveText('Сохранённая карта открыта.');
	await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await other.getByRole('button', { name: 'Сохранить', exact: true }).click();
	await expect(other.locator('#host-status')).toContainText('E_STORAGE_CONFLICT');
	await other.close();
});
test('desktop and narrow layouts retain a horizontal row for each route', async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 1366, height: 1000 });
	await page.goto('/?lang=ru');
	await expect(page.locator('.hmap-step')).toHaveCount(7);
	const requests: string[] = [];
	page.on('request', (request) => {
		if (request.method() !== 'GET' || request.postData()) requests.push(request.url());
	});
	await page.getByRole('link', { name: 'Как работать', exact: true }).click();
	await expect(page.locator('#guide')).toBeVisible();
	await page
		.locator('#guide')
		.getByRole('link', { name: 'К рабочей области ↑', exact: true })
		.click();
	await page.screenshot({
		path: `build/check-reports/ui-${testInfo.project.name}-desktop.png`,
		fullPage: true,
	});
	await page.setViewportSize({ width: 390, height: 844 });
	const geometry = await page
		.locator('.hmap-route-row')
		.evaluateAll((rows) =>
			rows.map(
				(row) =>
					new Set(
						Array.from(row.querySelectorAll('.hmap-step')).map((n) =>
							Math.round(n.getBoundingClientRect().top + n.getBoundingClientRect().height / 2),
						),
					).size,
			),
		);
	expect(geometry).toEqual([1, 1]);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	const originFits = await page
		.locator('.hmap-intent-origin')
		.first()
		.evaluate((node) => {
			const origin = node.getBoundingClientRect(),
				rail = node.closest('.hmap-rail')!.getBoundingClientRect();
			return origin.top >= rail.top && origin.bottom <= rail.bottom;
		});
	expect(originFits).toBe(true);

	const overflowingLinks = await page
		.locator('.hmap-step-links')
		.evaluateAll((nodes) =>
			nodes.some(
				(node) =>
					node.getBoundingClientRect().right >
					node.closest('button')!.getBoundingClientRect().right + 1,
			),
		);
	expect(overflowingLinks).toBe(false);
	await page.screenshot({
		path: `build/check-reports/ui-${testInfo.project.name}-narrow.png`,
		fullPage: true,
	});
	expect(requests).toEqual([]);
});

test.beforeAll(async ({ browser }, info) => {
	const path = 'build/check-reports/browser-versions.json';
	const versions = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
	versions[info.project.name] = browser.version();
	writeFileSync(path, JSON.stringify(versions, null, 2) + '\n');
});
test('warm Worker validates a near-megabyte map with one thousand steps', async ({
	page,
}, info) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	const measured = await page.evaluate(async () => {
		const app = (window as any).hmapEmbeddingTest;
		const project = app.first.getProject();
		const step = project.routes[0].steps[1];
		project.routes[0].steps = Array.from({ length: 1000 }, (_, i) => ({
			...structuredClone(step),
			id: 's-load-' + i,
		}));
		for (let i = 0; i < 3; i++)
			project.chunks.push({
				...structuredClone(project.chunks[0]),
				id: 'c-load-' + i,
				body: 'a'.repeat(250000),
			});
		const text = JSON.stringify(project),
			milliseconds: number[] = [];
		for (let i = 0; i < 3; i++) {
			const start = performance.now();
			const response = await app.engine.request('validate', { input: { format: 'json', text } });
			if (!response.ok) throw new Error('Load fixture rejected');
			milliseconds.push(performance.now() - start);
		}
		return {
			inputBytes: new TextEncoder().encode(text).length,
			steps: 1000,
			milliseconds,
			medianMilliseconds: [...milliseconds].sort((a, b) => a - b)[1],
			targetMilliseconds: 2000,
		};
	});
	writeFileSync(
		'build/check-reports/worker-performance-' + info.project.name + '.json',
		JSON.stringify(measured, null, 2) + '\n',
	);
	expect(measured.medianMilliseconds).toBeLessThan(10000);
});
