import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function ready(page: Page) {
	await page.goto('/');
	await expect(page.locator('#save')).toBeEnabled();
}
async function files(page: Page) {
	if (!(await page.locator('#file-menu').evaluate((n) => (n as HTMLDetailsElement).open)))
		await page.locator('#file-menu > summary').click();
}
async function source(page: Page) {
	await files(page);
	const pending = page.waitForEvent('download');
	await page.locator('#download-json').click();
	const path = await (await pending).path();
	return JSON.parse(await readFile(path!, 'utf8'));
}

test('the workspace edits text, saves it explicitly and exports the accepted source', async ({
	page,
}) => {
	await ready(page);
	await expect(page.locator('header, .demo-heading, .demo-build')).toHaveCount(0);
	await expect(page.getByLabel('Терминология', { exact: true })).toHaveCount(0);
	await expect(page.locator('body')).not.toContainText('JSON IS THE SOURCE');
	await expect(page.locator('a[href*="embedding-example"]')).toHaveCount(0);
	await page.locator('[data-edit-kind="chunk"][data-edit-id="c-architecture"]').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form
		.getByLabel('Текст', { exact: true })
		.fill('Архитектурное решение автора.\nОбщий компонент используется в нескольких маршрутах.');
	await form.getByRole('button', { name: 'Применить', exact: true }).click();
	await expect(form).not.toBeVisible();
	await expect(page.locator('#host-status')).toHaveText('Есть несохранённые изменения.');
	const accepted = await source(page);
	expect(accepted.chunks.find((v: any) => v.id === 'c-architecture').body).toContain(
		'решение автора',
	);
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await page.reload();
	await expect(page.locator('#host-status')).toHaveText('Сохранённая карта открыта.');
	await expect(page.locator('[data-chunk-id="c-architecture"] .hmap-body')).toContainText(
		'решение автора',
	);
	await files(page);
	const pending = page.waitForEvent('download');
	await page.locator('#download-markdown').click();
	const path = await (await pending).path();
	expect(await readFile(path!, 'utf8')).toContain('Архитектурное решение автора.');
});

test('a new map is built through forms and saved maps can be reopened independently', async ({
	page,
}) => {
	await ready(page);
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await page.locator('#new').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form.getByLabel('Название', { exact: true }).fill('Мой архитектурный план');
	await form.getByRole('button', { name: 'Создать', exact: true }).click();
	await expect(page.locator('.hmap-project-title')).toHaveText('Мой архитектурный план');
	await page.locator('.hmap-add-menu > summary').click();
	await page.locator('[data-add-kind="intent"]').click();
	await form.getByLabel('Название', { exact: true }).fill('Получить проверенный результат');
	await form.getByRole('button', { name: 'Создать', exact: true }).click();
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await page.reload();
	await expect(page.locator('.hmap-project-title')).toHaveText('Мой архитектурный план');
	await files(page);
	await expect(page.locator('#saved-projects option')).toHaveCount(2);
	await page.locator('#saved-projects').selectOption('p-architecture-workspace');
	await page.locator('#open').click();
	await expect(page.locator('.hmap-project-title')).toHaveText(
		'Пример: архитектура редактора карт',
	);
	await page.reload();
	await expect(page.locator('.hmap-project-title')).toHaveText(
		'Пример: архитектура редактора карт',
	);
	expect(
		await page.evaluate(
			() =>
				Object.keys(localStorage).filter((k) => k.startsWith('ironcreed-roadmap:v2:project:'))
					.length,
		),
	).toBe(2);
});

test('route navigation and actual validation have explicit distinct behaviour under CSP', async ({
	page,
}) => {
	const securityErrors: string[] = [];
	page.on('console', (message) => {
		if (
			message.type() === 'error' &&
			/Content.Security.Policy|script-src|file:\/\//i.test(message.text())
		)
			securityErrors.push(message.text());
	});
	await ready(page);
	const before = await source(page);
	await page.locator('[data-step-id="s-check-map"]').click();
	await expect(page.locator('[data-entity-id="m-validation"]')).toHaveClass(/hmap-focused/);
	await expect(page.locator('[data-chunk-id="c-validation"]')).toHaveClass(/hmap-focused/);
	await expect(page.locator('#validation-report')).not.toBeVisible();
	await page.locator('#validate').click();
	await expect(page.locator('#validation-report')).toBeVisible();
	await expect(page.locator('#validation-report')).toContainText('Карта прошла проверку.');
	await page.locator('.hmap-intent-heading [data-intent-id="i-delivery"]').click();
	await expect(page.locator('.hmap-focused')).toHaveCount(0);
	await page.locator('[data-step-id="s-check-delivery"]').click();
	await expect(page.locator('[data-entity-id="m-validation"]')).toHaveClass(/hmap-focused/);
	expect(await source(page)).toEqual(before);
	expect(await page.locator('script:not([src])').count()).toBe(0);
	expect(await page.locator('[href^="file:"], [src^="file:"]').count()).toBe(0);
	expect(securityErrors).toEqual([]);
});

test('an edited map remains downloadable after storage fails and closing a draft cancels replacement', async ({
	page,
}) => {
	await ready(page);
	await page.locator('[data-edit-kind="project"]').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form.getByLabel('Название', { exact: true }).fill('Изменённая архитектура');
	await form.getByRole('button', { name: 'Применить', exact: true }).click();
	await expect(form).not.toBeVisible();
	page.once('dialog', (dialog) => dialog.dismiss());
	await page.locator('#new').click();
	await expect(form).not.toBeVisible();
	await expect(page.locator('.hmap-project-title')).toHaveText('Изменённая архитектура');
	await page.evaluate(() => {
		Storage.prototype.setItem = function () {
			throw new DOMException('full', 'QuotaExceededError');
		};
	});
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText('full');
	expect((await source(page)).title).toBe('Изменённая архитектура');
});

test('saving a copy preserves the original map and exposes both identities for reopening', async ({
	page,
}) => {
	await ready(page);
	await page.locator('#save').click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	await files(page);
	await page.locator('#save-copy').click();
	await expect(page.locator('#host-status')).toHaveText('Карта сохранена в этом браузере.');
	const copy = await source(page);
	expect(copy.id).toMatch(/^p-copy-/);
	await files(page);
	await expect(page.locator('#saved-projects option')).toHaveCount(2);
	await page.locator('#saved-projects').selectOption('p-architecture-workspace');
	await page.locator('#open').click();
	const original = await source(page);
	expect(original.id).toBe('p-architecture-workspace');
	expect(original.chunks).toEqual(copy.chunks);
});
