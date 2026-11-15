import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const introduction = JSON.parse(readFileSync('content/project-introduction.json', 'utf8'));
test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
async function ready(page: any) {
	await page.goto('/');
	await expect(page.locator('#save')).toBeEnabled();
}
async function aligned(page: any, selector: string) {
	await expect
		.poll(() =>
			page
				.locator(selector)
				.evaluate((n: HTMLElement) => Math.round(n.getBoundingClientRect().top)),
		)
		.toBe(0);
}

test('the static introduction precedes the footer with English text and native RU/UK disclosures', async ({
	page,
}) => {
	await ready(page);
	await expect(page.locator('[data-introduction-text=en]')).toHaveText(introduction.en.text);
	await expect(page.locator('#about-hmap [lang=ru]')).not.toHaveAttribute('open');
	await expect(page.locator('#about-hmap [lang=uk]')).not.toHaveAttribute('open');
	expect(
		await page
			.locator('#about-hmap')
			.evaluate(
				(n) =>
					!!(
						n.compareDocumentPosition(document.querySelector('#page-footer')!) &
						Node.DOCUMENT_POSITION_FOLLOWING
					),
			),
	).toBe(true);
	await page.getByRole('link', { name: 'About this project ↓' }).click();
	await aligned(page, '#about-hmap');
	await page.locator('#about-hmap details[lang=ru] > summary').click();
	await expect(page.locator('[data-introduction-text=ru]')).toHaveText(introduction.ru.text);
	await page.locator('#about-hmap details[lang=uk] > summary').click();
	await expect(page.locator('[data-introduction-text=uk]')).toHaveText(introduction.uk.text);
	await expect(page.locator('#about-hmap a').first()).toHaveAttribute(
		'href',
		introduction.reviewUrl,
	);
});

test('ordinary wheel reads the workspace while a strong gesture exits each fitted section', async ({
	page,
}) => {
	await ready(page);
	await aligned(page, '#workspace');
	await page.mouse.move(80, 70);
	await page.mouse.wheel(0, 80);
	await aligned(page, '#workspace');
	const source = page.locator('.hmap-source');
	await source.hover();
	await page.mouse.wheel(0, 100);
	await expect.poll(() => source.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
	await aligned(page, '#workspace');
	await page.mouse.wheel(0, 1200);
	await aligned(page, '#about-hmap');
	expect(
		await page.locator('#about-hmap').evaluate((n) => n.getBoundingClientRect().height),
	).toBeLessThanOrEqual(901);
	await page.mouse.move(80, 100);
	await page.mouse.wheel(0, 80);
	await aligned(page, '#about-hmap');
	await page.mouse.wheel(0, -1200);
	await aligned(page, '#workspace');
	await page.mouse.wheel(0, 1200);
	await aligned(page, '#about-hmap');
	await page.mouse.wheel(0, 1200);
	await expect
		.poll(() =>
			page
				.locator('#page-footer')
				.evaluate((n) => Math.round(n.getBoundingClientRect().bottom - innerHeight)),
		)
		.toBe(0);
	expect(await page.evaluate(() => scrollY)).toBeGreaterThan(900);
});

test('an open editing form keeps strong wheel input inside the dialog', async ({ page }) => {
	await ready(page);
	await page.locator('[data-edit-kind=chunk]').first().click();
	const form = page.locator('.hmap-authoring-dialog');
	const text = form.getByLabel('Текст', { exact: true });
	await text.fill('Draft paragraph\n'.repeat(100));
	await text.hover();
	await page.mouse.wheel(0, 1200);
	await aligned(page, '#workspace');
	await expect(form).toBeVisible();
	await form.getByRole('button', { name: 'Отменить', exact: true }).click();
	await expect(form).not.toBeVisible();
	await aligned(page, '#workspace');
});

test('keyboard links, horizontal route scrolling and zoom events keep native navigation', async ({
	page,
}) => {
	await ready(page);
	const rail = page.locator('.hmap-rail');
	await rail.hover();
	await page.mouse.wheel(350, 0);
	await aligned(page, '#workspace');
	const cancelled = await page.locator('#host-status').evaluate((node) => {
		const event = new WheelEvent('wheel', {
			deltaY: 1200,
			ctrlKey: true,
			cancelable: true,
			bubbles: true,
		});
		node.dispatchEvent(event);
		return event.defaultPrevented;
	});
	expect(cancelled).toBe(false);
	await page.getByRole('link', { name: 'About this project ↓' }).focus();
	await page.keyboard.press('Enter');
	await aligned(page, '#about-hmap');
	await page.getByRole('link', { name: 'Back to the workspace ↑' }).focus();
	await page.keyboard.press('Enter');
	await aligned(page, '#workspace');
});

test('a small touch viewport can read expanded translations and return through section links', async ({
	browser,
}) => {
	const context = await browser.newContext({
		viewport: { width: 390, height: 844 },
		hasTouch: true,
		reducedMotion: 'reduce',
	});
	const page = await context.newPage();
	await ready(page);
	await page.getByRole('link', { name: 'About this project ↓' }).tap();
	await aligned(page, '#about-hmap');
	expect(
		await page.locator('#about-hmap').evaluate((n) => n.getBoundingClientRect().height),
	).toBeLessThanOrEqual(845);
	await page.locator('#about-hmap details[lang=ru] > summary').tap();
	await page.locator('#about-hmap details[lang=uk] > summary').tap();
	expect(
		await page.locator('#about-hmap').evaluate((n) => n.getBoundingClientRect().height),
	).toBeGreaterThan(844);
	await page.locator('#about-hmap').evaluate((node) => node.scrollIntoView({ block: 'start' }));
	await aligned(page, '#about-hmap');
	const before = await page.evaluate(() => scrollY);
	await page.mouse.move(80, 100);
	await page.mouse.wheel(0, 120);
	await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
	await page.getByRole('link', { name: 'Back to the workspace ↑' }).tap();
	await aligned(page, '#workspace');
	await context.close();
});
