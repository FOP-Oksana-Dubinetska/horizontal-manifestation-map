import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-expect-error The build helper is intentionally plain JavaScript for Node/Vite.
import { localizeExample } from '../../tools/localize-example.mjs';
import { localeResources } from '../../packages/roadmap-ui/src/locales.ts';
const source = JSON.parse(readFileSync('examples/architecture-workspace.roadmap.json', 'utf8'));
const structure = (project: typeof source) => {
	const value = structuredClone(project);
	for (const entity of [
		value,
		...value.intents,
		...value.routes,
		...value.routes.flatMap((r: any) => r.steps),
		...value.modules,
		...value.chunks,
		...value.intersections,
		...value.estimates,
	])
		for (const key of [
			'title',
			'summary',
			'acceptanceCriteria',
			'name',
			'body',
			'note',
			'label',
			'basis',
		])
			delete entity[key];
	return value;
};
test('every sample language preserves identities, references, ordering and source ownership', () => {
	const before = structuredClone(source);
	for (const locale of ['en', 'uk', 'ru'] as const) {
		const project = localizeExample(source, localeResources[locale].example);
		assert.deepEqual(structure(project), structure(source));
		assert.equal(project.title, localeResources[locale].example['p-architecture-workspace'].title);
		project.modules[0].codeRefs.push({ path: 'private draft' });
		assert.deepEqual(source, before);
	}
});
test('missing fields and attempted structural translation fail before producing a sample', () => {
	const missing = structuredClone(localeResources.en.example) as Record<string, any>;
	delete missing['i-author'].summary;
	assert.throws(() => localizeExample(source, missing), /Incomplete example translation/);
	const invalid = structuredClone(localeResources.en.example) as Record<string, any>;
	invalid['m-core'].id = 'm-replaced';
	assert.throws(() => localizeExample(source, invalid), /Incomplete example translation/);
});
