import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	localeResources,
	createTranslator,
	isLocale,
} from '../../packages/roadmap-ui/src/locales.ts';

function keys(value: unknown, path = ''): string[] {
	if (typeof value === 'string') {
		assert.ok(value.trim(), path);
		return [path];
	}
	assert.ok(value && typeof value === 'object', path);
	return Object.entries(value)
		.flatMap(([key, v]) => keys(v, path + '/' + key))
		.sort();
}
test('EN/UK/RU configurations have complete matching message keys and nonempty translations', () => {
	const expected = keys(localeResources.en);
	assert.deepEqual(keys(localeResources.uk), expected);
	assert.deepEqual(keys(localeResources.ru), expected);
});
test('translation follows an explicit locale and language codes stay independent of project data', () => {
	let language: 'en' | 'uk' | 'ru' = 'en';
	const t = createTranslator(() => language);
	assert.equal(t('Intention'), 'Intention');
	language = 'uk';
	assert.equal(t('Intention'), 'Намір');
	language = 'ru';
	assert.equal(t('Intention'), 'Намерение');
	assert.ok(isLocale('uk'));
	assert.equal(isLocale('ua'), false);
});
