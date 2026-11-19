# HMAP — test map

This map connects each feature to an observable check. The runner writes current results to `build/check-reports/check-project.json`; TRACE keeps the development history and the smaller experiments that led here.

| ID | Feature | Evidence |
| --- | --- | --- |
| AC-01 | Native build | native-debug CMake/CTest; real CLI integration |
| AC-02 | Shared Wasm build | wasm-release probe, exception/UTF-8 boundary |
| AC-03 | Minimal JSON | JSON round trip; API validate |
| AC-04 | RoadmapText input | import `test/fixtures/minimal-v2.roadmap.txt`, JSON equality |
| AC-05 | Lossless text round trip | roadmap-text.test.cpp; repeated canonical JSON |
| AC-06 | Duplicate JSON keys | strict JSON tests and native/Wasm negative parity |
| AC-07 | Missing references | project-validation.test.cpp; CLI E_REF_NOT_FOUND envelope |
| AC-08 | Reference types | domain test and CLI E_REF_TYPE |
| AC-09 | Global ID collisions | global-index test and CLI E_ID_DUPLICATE |
| AC-10 | Duplicate step membership | RoadmapText membership rejection |
| AC-11 | Cyclic intention lineage | iterative DFS; chain in relatedIds; CLI negative case |
| AC-12 | Empty projects and routes | empty-project CLI, empty-route validation and text round trip |
| AC-13 | Route selection | E_SELECTION test; browser view/project separation |
| AC-14 | Unknown estimates with a reason | preserved variant and bilingual hint reason |
| AC-15 | Estimate reasons and bounds | domain and CLI errors |
| AC-16 | Shared component reuse | inspect counts two route/step occurrences; annotation-only values |
| AC-17 | Deterministic Markdown | deterministic export and hostile YAML fixture |
| AC-18 | Native/Wasm parity | tests/wasm/parity.mjs on the shared compiled service |
| AC-19 | Structured CLI errors | exact one-envelope stdout and nonzero exit; empty stderr |
| AC-20 | Protected file output | file-output.test.cpp and real CLI output-file checks |
| AC-21 | State retained after failure | source/target alias and invalid-import checks; rejected browser import |
| AC-22 | Memory snapshots | adapter tests mutate save input and load result |
| AC-23 | Storage access and quota | adapter exceptions; browser temporary session and later quota failure |
| AC-24 | Corrupt stored data | corrupt storage load/list test; original bytes retained |
| AC-25 | Two embedded instances | public embedding page, CSS/DOM/state isolation and shared engine |
| AC-26 | Readonly and late results | import control absence; delayed validation race and destroy |
| AC-27 | One long route | terminal viewport and whole Unicode glyphs; narrow browser rail |
| AC-28 | Authored HTML, escapes and quotes | textContent import, terminal escaping, safe YAML quotes |
| AC-29 | Nested asset URLs | root and /tools/roadmap/ HTTP browser checks; actual Wasm MIME |
| AC-30 | Self-contained help | bilingual catalog topics; CLI help/explain/hints; JSON/Markdown/text |
| AC-31 | Schema-1 migration | original 0.2.0 source, strict fixture, order/default report and CLI candidate |
| AC-32 | Clean verification run | source byte snapshots; no install/formatter inside check-project.py |
| AC-33 | Resource bounds | input/depth/large ID checks, validator regulators and host error handling |
| AC-34 | Keyboard and focus | browser separator, controls, modal focus/escape and focus-visible CSS |
| AC-35 | Workspace layout | browser literature and intention-led route lines; contextual authoring actions |

The map is local-first. Estimates describe the author's assumptions, and code references record where a component belongs. The browser and CLI checks exercise the corresponding data and interaction contracts.

## Authoring workspace — Stage 15–18

The authoring plan connects the original model checks to complete editing and persistence scenarios.

| Feature | Check |
| --- | --- |
| Create a map, intention, component, contract, route and step | authoring.spec.ts: author creates an architecture map |
| Text, stable identities, named links and order | authoring.test.ts + authoring.spec.ts: identity, reorder, text editing |
| Retain map and form input after validation errors | authoring.spec.ts: C++ rejects a cycle; invalid estimate ordering |
| Previewed deletion, reference updates and cancellation | pure deletion tests + browser deletion preview |
| Readonly, keyboard and cancelled late validation | authoring.spec.ts: readonly/modal focus/pending validation |
| Edit → explicit save → reload → JSON/Markdown | workspace.spec.ts: workspace edits text |
| Multiple saved maps and reopening | workspace.spec.ts: new map and saved maps |
| Distinct navigation/validation and CSP | workspace.spec.ts: route navigation and actual validation |
| Quota, concurrent tabs and temporary sessions | editor.spec.ts + workspace.spec.ts |
| Compact layout and horizontal scrolling per line at 390px | workspace.spec.ts + editor.spec.ts: desktop and narrow |

Commands: `npm run test:storage`, `npm run typecheck`, `npm run build`, `npm run test:web`, `python tools/check-project.py --profile all`. Results are recorded in TRACE and the delivery report. The site setup guide provides a short check of the deployed page.


## Shared introduction and section navigation

The CLI terminal checks compare the English introduction with `content/project-introduction.json`. Browser tests cover the static translations, native section scrolling and anchor help, inner scrolling, keyboard links, zoom events and open forms. Existing stream and editor checks continue to exercise the surrounding behaviour.

<details><summary>Русский</summary>

Эта таблица помогает найти проверку нужной функции. Актуальные результаты находятся в отчётах, история разработки — в TRACE. Проверки вступления сравнивают английский текст сайта и терминала с общим источником. Браузерные сценарии проверяют переходы между секциями, внутреннюю прокрутку и работу форм.

</details>

<details><summary>Українська</summary>

Ця таблиця допомагає знайти перевірку потрібної функції. Поточні результати зберігаються у звітах, історія розроблення — у TRACE. Перевірки вступу порівнюють англійський текст сайту й термінала зі спільним джерелом. Браузерні сценарії перевіряють переходи між секціями, внутрішнє прокручування та роботу форм.

</details>
