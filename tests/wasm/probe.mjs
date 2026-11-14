import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const path = process.argv[2];
const { default: create } = await import(pathToFileURL(path));
const engine = await create({ wasmBinary: await readFile(path.replace(/\.mjs$/, '.wasm')) });
assert.equal(engine.probe('Карта → перевірка'), 'Карта → перевірка');
assert.equal(engine.probeException(), 'caught');
console.log('Wasm UTF-8 and exception probe: PASS');
