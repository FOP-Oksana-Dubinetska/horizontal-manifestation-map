import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	createDraftProject,
	prepareAddition,
	prepareDeletion,
	reorderEntity,
	nextEntityId,
} from '../../packages/roadmap-ui/src/authoring.ts';
import type { RoadmapProject } from '../../packages/roadmap-storage/src/index.ts';
const fixture = (): RoadmapProject =>
	JSON.parse(readFileSync('test/fixtures/minimal-v2.roadmap.json', 'utf8'));

test('a new map and additions own their values; identity also excludes nested steps', () => {
	const blank = createDraftProject('p-1', 'My architecture');
	assert.equal(blank.metadata.createdAt, null);
	const added = prepareAddition(blank, 'intent');
	assert.equal(added.project.selectedIntentId, added.target.id);
	assert.equal(blank.intents.length, 0);
	const source = fixture();
	source.routes[0].steps[0].id = 'm-1';
	assert.equal(nextEntityId(source, 'm'), 'm-2');
	const component = prepareAddition(source, 'module');
	component.project.intents[0].title = 'changed';
	assert.notEqual(source.intents[0].title, 'changed');
});
test('routes require intentions and steps require an explicitly selected route', () => {
	const blank = createDraftProject('p-test');
	assert.throws(() => prepareAddition(blank, 'route'), /intent-required/);
	assert.throws(
		() => prepareAddition(fixture(), 'step', { routeId: 'r-missing' }),
		/route-required/,
	);
	const added = prepareAddition(fixture(), 'route');
	assert.equal(added.project.routes.at(-1)?.intentId, 'i-check');
	assert.equal(added.project.selectedRouteId, added.target.id);
});
test('deleting a shared component detaches declared references and drops underspecified intersections', () => {
	const source = fixture();
	source.intersections.push({
		id: 'x-one',
		title: 'Reuse',
		sourceIds: ['m-validator', 'c-validation'],
		note: '',
	});
	const before = JSON.stringify(source);
	const result = prepareDeletion(source, { kind: 'module', id: 'm-validator' });
	assert.deepEqual(result.project.routes[0].steps[1].linkedModuleIds, []);
	assert.deepEqual(result.project.chunks[0].linkedModuleIds, []);
	assert.equal(result.project.chunks[0].body, source.chunks[0].body);
	assert.equal(result.project.intersections.length, 0);
	assert.deepEqual(
		result.removed.map((v) => v.id),
		['m-validator', 'x-one'],
	);
	assert.equal(result.detachedReferences, 3);
	assert.equal(JSON.stringify(source), before);
});
test('deleting an intention declares its routes and steps while preserving shared architecture', () => {
	const source = fixture();
	source.intents.push({
		...structuredClone(source.intents[0]),
		id: 'i-other',
		parentIntentIds: ['i-check'],
	});
	source.intersections.push({
		id: 'x-step',
		title: 'Step link',
		sourceIds: ['s-intent', 's-validation', 'c-validation'],
		note: '',
	});
	const result = prepareDeletion(source, { kind: 'intent', id: 'i-check' });
	assert.equal(result.project.routes.length, 0);
	assert.equal(result.project.modules.length, 1);
	assert.equal(result.project.chunks.length, 1);
	assert.deepEqual(result.project.intents[0].parentIntentIds, []);
	assert.equal(result.project.selectedIntentId, null);
	assert.equal(result.project.selectedRouteId, null);
	assert.equal(result.removed.length, 6);
});
test('step deletion preserves the reused module and estimate deletion clears references', () => {
	const source = fixture();
	const step = prepareDeletion(source, { kind: 'step', id: 's-validation', routeId: 'r-check' });
	assert.equal(step.project.modules.length, 1);
	assert.equal(step.project.estimates.length, 1);
	assert.equal(step.project.routes[0].steps.length, 2);
	const estimate = prepareDeletion(source, { kind: 'estimate', id: 'e-validation' });
	assert.equal(estimate.project.routes[0].steps[1].estimateId, null);
	assert.equal(estimate.detachedReferences, 1);
});
test('reordering preserves identity and references and rejects an invalid array position', () => {
	const source = fixture();
	const target = { kind: 'step' as const, id: 's-export', routeId: 'r-check' };
	const result = reorderEntity(source, target, 1);
	assert.equal(result.routes[0].steps[0].id, 's-export');
	assert.equal(result.routes[0].steps[2].id, 's-validation');
	assert.equal(source.routes[0].steps[0].id, 's-intent');
	assert.throws(() => reorderEntity(source, target, 0), /invalid-position/);
	assert.throws(
		() => prepareDeletion(source, { kind: 'chunk', id: 'c-missing' }),
		/missing-entity/,
	);
});
