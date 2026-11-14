# Public embedding contract

Build the project, copy `dist/site` to your HTTP(S) host and open `embedding-example.html`. The example uses only `embed/hmap-editor.js`, its CSS and a versioned engine asset directory. It contains no imports into the demo source tree.

```js
import { createRoadmapEngine, createRoadmapEditor, MemoryStorageAdapter, projectCodec }
  from './embed/hmap-editor.js';
const version = await fetch('./version.json').then(response => response.json());
const engine = await createRoadmapEngine({ assetBaseUrl: version.engineBaseUrl });
const storage = new MemoryStorageAdapter(projectCodec(engine));
const initial = await engine.request('template');
const editor = await createRoadmapEditor({
  root: document.querySelector('#roadmap'), engine, storage,
  initialProject: initial.result,
  onChange: project => console.log('Accepted user import', project.id),
});
```

The root needs a defined height, at least 420px. Alternatively provide `initialProjectId` and load through the supplied storage. If both initial fields are absent, provide `newProjectId`; a valid empty draft is created without saving. The factory awaits engine readiness and validation, and rejects invalid initial data or an absent stored project. Simultaneous initial fields are rejected.

`getProject()` returns a defensive copy. `setProject()` validates a whole candidate, preserves the last accepted state on failure and ignores an older response after a newer request. It does not call `onChange`. Accepted user import calls `onChange` once. View state has its own selection, filter, profile and separator position; viewing changes do not rewrite JSON preferences. To persist view preferences, the host constructs an explicit updated candidate.

The host owns its engine and storage. `destroy()` is idempotent and removes only the editor's own DOM and listeners. It leaves a shared engine running. Dispose a host-owned engine after destroying its consumers; this rejects all pending requests. A 10-second initialization/request timeout terminates the Worker and cancels its outstanding requests. A new host-created engine can resume from the editor's last project snapshot.

Readonly hides user import and the UI performs no storage writes. Programmatic setProject remains available to the host. Feature flags cover import, terminology and linked-area controls. `markdownExport` records the host's export capability; export controls live outside the package and the host enforces that feature when adding its controls.

The top strip contains terminology, linked-area filter and import. The literature occupies the top area and one route occupies the bottom rail. The separator supports pointer and keyboard input. User text is assigned through textContent and pre-wrap. Core rules remain in C++; TypeScript consumes validated results and DTOs.

Asset URLs resolve from the specified assetBaseUrl and the package module. For cross-origin hosting, browser Worker origin/CORS requirements still apply: host the package/Worker on the embedding origin or supply an approved same-origin workerUrl and compatible asset CORS. The supplied root/nested examples use same-origin resources.
