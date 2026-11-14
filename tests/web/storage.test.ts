import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	MemoryStorageAdapter,
	LocalStorageAdapter,
	StorageError,
	storagePrefix,
	prepareProjectSave,
} from '../../packages/roadmap-storage/src/index.ts';
import type { RoadmapProject } from '../../packages/roadmap-storage/src/index.ts';
const example = (): RoadmapProject =>
	JSON.parse(
		readFileSync(new URL('../../test/fixtures/minimal-v2.roadmap.json', import.meta.url), 'utf8'),
	);
// The test double observes the codec boundary; production supplies the C++ engine.
const codec = async (p: unknown) => {
	assert.equal((p as RoadmapProject).schemaVersion, 2);
	return structuredClone(p as RoadmapProject);
};
class FakeStorage implements Storage {
	private data = new Map<string, string>();
	mode = 'normal';
	get length() {
		return this.data.size;
	}
	clear() {
		this.data.clear();
	}
	getItem(key: string) {
		if (this.mode === 'blocked') throw new DOMException('denied', 'SecurityError');
		return this.data.get(key) ?? null;
	}
	key(index: number) {
		return [...this.data.keys()][index] ?? null;
	}
	removeItem(key: string) {
		this.data.delete(key);
	}
	setItem(key: string, value: string) {
		if (this.mode === 'quota') throw new DOMException('full', 'QuotaExceededError');
		this.data.set(key, value);
	}
}
test('Memory storage copies input and output; clock is external', async () => {
	const adapter = new MemoryStorageAdapter(codec);
	const project = example();
	await adapter.saveProject(project);
	project.title = 'mutated';
	const loaded = (await adapter.loadProject(project.id))!;
	assert.notEqual(loaded.title, 'mutated');
	loaded.title = 'again';
	assert.notEqual((await adapter.loadProject(project.id))!.title, 'again');
	assert.equal(loaded.metadata.updatedAt, null);
	const saved = prepareProjectSave(loaded, () => '2026-11-11T00:00:00Z');
	assert.equal(saved.metadata.createdAt, saved.metadata.updatedAt);
	assert.equal(loaded.metadata.createdAt, null);
	await adapter.deleteProject('p-absent');
	assert.equal(await adapter.loadProject('p-absent'), null);
});
test('Local storage preserves corrupt records and reports them', async () => {
	const storage = new FakeStorage();
	const errors: StorageError[] = [];
	const adapter = new LocalStorageAdapter(storage, codec, (e) => errors.push(e));
	storage.setItem(storagePrefix + 'p-bad', 'broken');
	await assert.rejects(adapter.loadProject('p-bad'), { code: 'E_STORAGE_CORRUPT' });
	assert.deepEqual(await adapter.listProjects(), []);
	assert.equal(errors[0].code, 'E_STORAGE_CORRUPT');
	assert.equal(storage.getItem(storagePrefix + 'p-bad'), 'broken');
});
test('Local storage detects stale writers and classifies quota/access errors', async () => {
	const storage = new FakeStorage();
	const first = new LocalStorageAdapter(storage, codec),
		second = new LocalStorageAdapter(storage, codec);
	const p = example();
	await first.saveProject(p);
	await second.loadProject(p.id);
	p.title = 'new';
	await first.saveProject(p);
	await assert.rejects(second.saveProject(p), { code: 'E_STORAGE_CONFLICT' });
	storage.mode = 'quota';
	await assert.rejects(first.saveProject(p), { code: 'E_STORAGE_QUOTA' });
	storage.mode = 'blocked';
	await assert.rejects(first.loadProject(p.id), { code: 'E_STORAGE_UNAVAILABLE' });
});
