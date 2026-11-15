import { readFile } from 'node:fs/promises';
import { localizeExample } from '../../tools/localize-example.mjs';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const [modulePath,nativePath,fixture]=process.argv.slice(2);
const {default:create}=await import(pathToFileURL(modulePath));
const engine=await create({wasmBinary:await readFile(modulePath.replace(/\.mjs$/,'.wasm'))});
const text=await readFile(fixture,'utf8');
const requests=[...['validate','import','normalize','render','inspect','hints','export'].map(operation=>({operation,input:{format:'json',text},options:{format:operation==='export'?'roadmap-text':'json',...(operation==='inspect'?{id:'m-validator'}:{})}})),{operation:'getVersions'},{operation:'help',options:{topic:'llm',language:'ru'}},{operation:'validate',input:{format:'json',text:'{"a":1,"a":2}'}},{operation:'render',input:{format:'json',text},options:{glyphs:'unicode',width:40}}];
requests.push(...['en','uk','ru'].flatMap(language=>[{operation:'help',options:{topic:'workflow',language}},{operation:'help',options:{topic:'intersections',language}},{operation:'render',input:{format:'json',text},options:{format:'json',language}},{operation:'render',input:{format:'json',text},options:{routeId:'r-check',language}}]));
const architecture=JSON.parse(await readFile(new URL('../../examples/architecture-workspace.roadmap.json',import.meta.url),'utf8'));
for(const language of ['en','uk','ru']) {
 const copy=JSON.parse(await readFile(new URL(`../../locales/${language}.json`,import.meta.url),'utf8')).example;
 const input={format:'json',text:JSON.stringify(localizeExample(architecture,copy))};
 requests.push({operation:'validate',input,options:{language}},{operation:'render',input,options:{format:'json',language}},{operation:'export',input,options:{format:'markdown',language}});
}
for(const request of requests){request.apiVersion=1;request.requestId='parity';const input=JSON.stringify(request);const native=spawnSync(nativePath,{input,encoding:'utf8'});assert.equal(native.status,0,native.stderr);assert.deepEqual(JSON.parse(engine.processRoadmapRequest(input)),JSON.parse(native.stdout));}
console.log(`Native/Wasm API parity: ${requests.length}/${requests.length} PASS`);
