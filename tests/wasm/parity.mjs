import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const [modulePath,nativePath,fixture]=process.argv.slice(2);
const {default:create}=await import(pathToFileURL(modulePath));
const engine=await create({wasmBinary:await readFile(modulePath.replace(/\.mjs$/,'.wasm'))});
const text=await readFile(fixture,'utf8');
const requests=[...['validate','import','normalize','render','inspect','hints','export'].map(operation=>({operation,input:{format:'json',text},options:{format:operation==='export'?'roadmap-text':'json',...(operation==='inspect'?{id:'m-validator'}:{})}})),{operation:'getVersions'},{operation:'help',options:{topic:'llm',language:'ru'}},{operation:'validate',input:{format:'json',text:'{"a":1,"a":2}'}},{operation:'render',input:{format:'json',text},options:{glyphs:'unicode',width:40}}];
for(const request of requests){request.apiVersion=1;request.requestId='parity';const input=JSON.stringify(request);const native=spawnSync(nativePath,{input,encoding:'utf8'});assert.equal(native.status,0,native.stderr);assert.deepEqual(JSON.parse(engine.processRoadmapRequest(input)),JSON.parse(native.stdout));}
console.log(`Native/Wasm API parity: ${requests.length}/${requests.length} PASS`);
