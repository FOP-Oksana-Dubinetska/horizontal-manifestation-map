import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
const locales = Object.fromEntries(
	['en', 'uk', 'ru'].map((l) => [l, JSON.parse(readFileSync(`locales/${l}.json`, 'utf8'))]),
);
async function source(page: Page) {
	await page.locator('#file-menu > summary').click();
	const pending = page.waitForEvent('download');
	await page.locator('#download-json').click();
	return JSON.parse(await readFile((await (await pending).path())!, 'utf8'));
}

test('English is the fresh default and host language changes preserve unsaved source and selected line', async ({
	page,
}) => {
	await page.goto('/');
	await expect(page.locator('#save')).toBeEnabled();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.locator('#save')).toHaveText('Save');
	await page.locator('.hmap-line-select').last().click();
	const active = await page.locator('.hmap-active-line').getAttribute('data-route-id');
	await page.locator('[data-edit-kind=project]').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form.getByLabel('Title', { exact: true }).fill('Авторська карта — authored text');
	await form.getByRole('button', { name: 'Apply', exact: true }).click();
	await expect(form).not.toBeVisible();
	const before = await source(page);
	for (const lang of ['uk', 'ru', 'en']) {
		await page.locator('#language').selectOption(lang);
		await expect(page.locator('html')).toHaveAttribute('lang', lang);
		await expect(page.locator('#save')).toHaveText(locales[lang].host.Save);
		await expect(page.locator('#guide-title')).toHaveText(
			locales[lang].host['Working with the map'],
		);
		await expect(page.locator('.hmap-map-title')).toHaveText(locales[lang].ui['Horizontal map']);
		await expect(page.locator('.hmap-active-line')).toHaveAttribute('data-route-id', active!);
		await expect(page.locator('#host-status')).toHaveText(
			locales[lang].host['There are unsaved changes.'],
		);
		expect(await source(page)).toEqual(before);
	}
});

test('explicit URL locale and saved preference work without altering the map', async ({ page }) => {
	await page.goto('/?lang=uk');
	await expect(page.locator('#save')).toBeEnabled();
	await expect(page.locator('#save')).toHaveText('Зберегти');
	await page.locator('#language').selectOption('ru');
	await page.goto('/');
	await expect(page.locator('#save')).toHaveText('Сохранить');
	await page.goto('/?lang=en');
	await expect(page.locator('#save')).toHaveText('Save');
});

test('a locale change protects an open draft and stays scoped to one embedded editor', async ({
	page,
}) => {
	await page.goto('/embedding-example.html');
	await expect(page.locator('#status')).toHaveText('Both editors are ready.');
	await page.locator('#first [data-edit-kind=chunk]').click();
	const form = page.locator('#first .hmap-authoring-dialog');
	await form.getByLabel('Text', { exact: true }).fill('Pending authored draft');
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.first.setLanguage('uk'))).toBe(
		false,
	);
	await expect(form.getByLabel('Text', { exact: true })).toHaveValue('Pending authored draft');
	await form.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.first.setLanguage('uk'))).toBe(
		true,
	);
	await expect(page.locator('#first .hmap-map-title')).toHaveText('Горизонтальна карта');
	await expect(page.locator('#second .hmap-map-title')).toHaveText('Horizontal map');
	await page.locator('#first [data-edit-kind=chunk]').click();
	await expect(form.getByLabel('Текст', { exact: true })).not.toHaveValue('Pending authored draft');
	expect(await page.evaluate(() => (window as any).hmapEmbeddingTest.changes)).toBe(0);
});

test('Ukrainian forms and shared C++ diagnostics use the selected locale', async ({ page }) => {
	await page.goto('/?lang=uk');
	await expect(page.locator('#save')).toBeEnabled();
	await page.locator('.hmap-add-menu > summary').click();
	await page.locator('[data-add-kind=estimate]').click();
	const form = page.locator('.hmap-authoring-dialog');
	await form.getByLabel('Назва', { exact: true }).fill('Оцінка перевірки');
	await form.getByLabel('Тип оцінки', { exact: true }).selectOption('range');
	await form.getByLabel('Від, хвилин', { exact: true }).fill('120');
	await form.getByLabel('До, хвилин', { exact: true }).fill('60');
	await form.getByRole('button', { name: 'Створити', exact: true }).click();
	await expect(form.locator('.hmap-form-error')).toContainText('E_ESTIMATE_RANGE');
	await expect(form.locator('.hmap-form-error')).toContainText('Укажіть цілі хвилини');
	await form.getByRole('button', { name: 'Скасувати', exact: true }).click();
});
