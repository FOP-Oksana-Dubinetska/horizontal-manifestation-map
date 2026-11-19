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

The top strip contains terminology, linked-area filter and import. The literature occupies the top area and all intention-led route lines occupy the bottom rail. Each intention appears before any route exists; each row scrolls horizontally on its own. The separator supports pointer and keyboard input. User text is assigned through textContent and pre-wrap. Core rules remain in C++; TypeScript consumes validated results and DTOs.

Asset URLs resolve from the specified assetBaseUrl and the package module. For cross-origin hosting, browser Worker origin/CORS requirements still apply: host the package/Worker on the embedding origin or supply an approved same-origin workerUrl and compatible asset CORS. The supplied root/nested examples use same-origin resources.

## Authoring continuation (Stage 15–18)

The active `hmap-authoring.plan.md` supersedes the original viewer-only top strip. `features.editing` defaults to true and adds named creation actions plus per-object edit buttons. Native modal forms prepare independent candidates, use the shared validator, retain authored input on error and emit one `onChange` per accepted user edit, creation, deletion or import. Cancelling or superseding a validation prevents a late result from committing. Deletion previews explicitly list removed objects and detached references.

`editor.newProject()` opens a user-confirmed empty-map form; it rejects calls when readonly or editing is disabled. `editor.hasOpenDraft()` reports an open form/import review for host navigation protection. A host still owns dirty-state comparison, storage writes, metadata timestamps and unsaved-work prompts. `features.editing=false` suppresses forms while the separate `importButton` flag governs import. Readonly suppresses every user write; host `setProject()` remains supported.

`terminologySelector` now defaults to false. The ordinary workspace passes engineering terminology explicitly; files retain their original terminologyProfile until an explicit authored change. Existing terminology options remain compatible when enabled by the embedding host. `getViewState()` also exposes the selected step; selecting a step highlights its component/chunk links and does not execute the named roadmap activity.

The technical embedding fixture opts into the legacy selector to test compatibility. Its **Host button** has no product action: the browser regression checks that the editor's scoped CSS leaves the external host button's style intact. The example is documented here and is not linked from the ordinary workspace footer.


Language is independent of project terminology and authored text. Pass `language: 'en' | 'uk' | 'ru'` (default `en`), or call `setLanguage(language)`. The call returns `false` while a form or import review is open, protecting its draft; after closing the form it changes labels without modifying project data, selection or notifications. Each editor owns its language. The host preference selector uses the same method.

The shared engine's default `render` JSON DTO now contains `rows[{intent,route|null}]` and `scope: "map"`. An explicit `routeId` yields one row with `scope: "route"`. The earlier selected-route DTO has been superseded; direct render consumers should read rows. Project schema 2 and API envelope version 1 remain current.

For presentation-only replacement of the same document, `setProject(candidate, {preserveView: true, isCurrent: () => stillCurrent})` retains compatible view context and checks the caller's guard immediately before accepting the validated project/projection pair. Omitting these options retains the existing replacement contract. The host uses this path only for a pristine bundled example; accepted user edits and saved/imported maps stay literal.

<details><summary>Русский</summary>

Публичный пакет позволяет встроить карту в другую страницу. Host создаёт движок и адаптер хранения, передаёт их редактору и сохраняет данные по явному действию. Формы проверяют изменения общим движком; readonly оставляет просмотр и навигацию. Пример встраивания показывает два независимых экземпляра с одним движком.

</details>

<details><summary>Українська</summary>

Публічний пакет дає змогу вбудувати карту в іншу сторінку. Host створює рушій та адаптер сховища, передає їх редактору й зберігає дані за явною дією. Форми перевіряють зміни спільним рушієм; readonly залишає перегляд і навігацію. Приклад вбудовування показує два незалежні екземпляри зі спільним рушієм.

</details>
