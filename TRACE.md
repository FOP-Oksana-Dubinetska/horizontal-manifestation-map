# TRACE

## Completion run record — HMAP-20261111-COMPLETION

- **Phase**: 1 — candidate implementation.
- **Method version**: PLW 0.1.0-dev, pinned 3f75890a1b211eb81fc51697692a73a8ce895599.
- **Run id**: HMAP-20261111-COMPLETION.
- **Model/tool**: Codex via the connected GitHub tools and local C++/Wasm/TypeScript toolchains.
- **Date**: 2026-11-11.
- **Prompt file**: prompts/complete-mvp.prompt.md
- **Input plan version**: roadmap-editor.plan.md 0.3.0-draft; hmap-completion.plan.md 2026-11-11.
- **Contract version**: CONTRACTS.md 2026-11-11.
- **Generated file**: generated/implementation-candidate.md
- **Accepted chunks**: pending
- **Rejected chunks**: pending
- **Manual edits**: stage-local corrections and boundary hardening recorded below.
- **Reviewer**: project owner for human acceptance; deterministic tools for technical evidence.
- **Method validation result**: recorded by the pinned candidate validator in the consolidated report.
- **Smoke-check command**: python tools/check-project.py --profile all
- **Smoke-check result**: see build/check-reports/check-project.json after execution.
- **Test report**: build/check-reports/check-project.json; stage observations below.
- **Acceptance decision**: pending
- **Notes**: one author-authorized completion operation; every stage retains its own trace. Technical PASS does not ratify the proposed Profile, accept content or publish infrastructure.


## 2026-09-08 — stage 00 scaffold preparation

- **Phase**: planning / workspace-foundation
- **Run id**: chat-stage00-2026-09-08
- **Model/tool**: ChatGPT GPT-5.6 Sol; project file source; GitHub metadata; isolated build container
- **Inputs**: `roadmap-editor.plan.md`; PLW starter at `3f75890a1b211eb81fc51697692a73a8ce895599`
- **Allowed files**: stage-00 infrastructure, governance drafts, manifests, smoke test, lessons.
- **Changed files**: initial project scaffold only.
- **Review summary**: предметная реализация намеренно не создана. Каталог подготовлен для локального принятия пользователем.
- **Validation performed in assistant environment**: CMake syntax/native smoke build without network-backed Catch2 fetch; filesystem boundary check; archive integrity.
- **Validation still required on author machine**: online dependency preparation, Catch2/CTest run, GDB breakpoint, Emscripten smoke build.
- **Result**: candidate-stage00; not human-accepted yet.
- **Notes**: локальный рабочий путь пользователя недоступен ассистенту; подготовлен переносимый каталог.

## 2026-09-09 — stage 00 native platform revision

- **Phase**: planning / workspace-foundation revision
- **Run id**: chat-stage00-windows-2026-09-09
- **Decision**: автор выбрал native Windows вместо предложенного первоначальным планом WSL/Linux default.
- **Allowed files**: stage-00 infrastructure and documentation only.
- **Changed files**: Windows/MSVC presets and compiler policy, PowerShell environment diagnostics, Python check portability, governance/profile/regulators, Stage 00 lesson, README, decision record.
- **Preserved boundary**: `RoadmapProject`, CLI, JSON/RoadmapText, validator and Web/Wasm product code remain unimplemented.
- **Supersedes**: WSL-first operational instructions from the 2026-09-08 candidate scaffold. Historical TRACE entry is retained.
- **Validation performed in assistant environment**: JSON/Python/static structure checks; CMake preset schema/list inspection where host-independent; stage boundary check; archive integrity. Native MSVC compile cannot be truthfully executed in the non-Windows assistant container.
- **Validation still required on author machine**: Developer PowerShell diagnostic, MSVC configure/build, Catch2/CTest, `workspace-smoke.exe`, debugger breakpoint. Emscripten can be checked now if already installed, but its required product gate remains Stage 03.
- **Result**: candidate-stage00-windows; pending local human gate.

## 2026-09-16 — Stage 00 MinGW-w64 correction

- **Phase**: workspace-foundation correction.
- **Run id**: chat-stage00-mingw-r2-2026-09-16.
- **Observed author environment**: Windows 10.0.19045.0; MinGW-w64 `g++.exe` at `C:\Portable\MinGW-w64\bin\g++.exe`; GNU GDB 17.1; CMake 4.2.1; Ninja 1.13.2; Git 2.50.1.windows.1; Python 3.14.2; Node 24.18.0; npm 11.18.0; Emscripten unavailable/unused at this stage.
- **Decision**: MinGW-w64 GCC replaces MSVC as primary native compiler.
- **Reason**: existing historical learning environment selected explicitly by the author.
- **Failure evidence**: previous MinGW delivery was an incomplete overlay; local diagnostics still checked `cl.exe` and CMake preset still selected `cl`. `cmake --preset native-debug` therefore failed before generating `build.ninja`.
- **Correction**: full Stage 00 scaffold regenerated from the Windows baseline; presets, diagnostics, checks, governance, regulators, documentation and debugger instructions now use MinGW-w64/GDB.
- **Preserved boundary**: no `RoadmapProject`, CLI, JSON/RoadmapText, validator or product Wasm implementation was added.
- **Validation in assistant environment**: JSON/Python/static checks and archive integrity only. Native Windows/MinGW compile remains a local gate.
- **Result**: candidate-stage00-mingw-r2; pending local native gate.

## 2026-09-16 — Stage 00 local acceptance

- **Phase**: workspace-foundation acceptance.
- **Run id**: local-stage00-mingw-acceptance-2026-09-16.
- **Environment**: Windows 10.0.19045.0; MinGW-w64 GCC/G++ 15.2.0; GNU GDB 17.1; CMake 4.2.1; Ninja 1.13.2; Git 2.50.1.windows.1; Python 3.14.2.
- **Configure evidence**: `cmake --preset native-debug` selected `C:/Portable/MinGW-w64/bin/g++.exe` and completed configure/generate successfully.
- **Build evidence**: `cmake --build --preset native-debug` completed successfully.
- **Test evidence**: `ctest --preset native-debug --output-on-failure` reported 1/1 tests passed, 0 failed.
- **Runtime evidence**: `workspace-smoke.exe` printed `horizontal-manifestation-map workspace: ready`.
- **Debugger evidence**: GNU GDB loaded debug symbols, `break main` succeeded, and execution stopped at `apps/workspace-smoke/main.cpp:4`.
- **Wasm status**: Emscripten is not installed; this is accepted for Stage 00 because the required Wasm gate is Stage 03.
- **Boundary status**: product implementation has not started.
- **Result**: PASS — Stage 00 accepted; Stage 01 may begin.


## 2026-09-17 — Stage 01.1 — RouteStep

STATUS: PASS

- IntentStatus introduced
- StepStereotype introduced
- RouteStep implemented
- std::optional introduced
- std::vector introduced
- roadmap-core connected to CMake
- domain header compiled by real translation unit
- Catch2 coverage added
- native-debug build PASS
- CTest 2/2 PASS

## 2026-10-19 — Stage 01 domain model checkpoint

- **Phase:** Stage 01 — C++ domain model.
- **Source:** roadmap-editor.plan.md, sections 5.4–5.6 and Stage 01.
- **Environment:** Windows, MinGW-w64 GCC 15.2.0, C++20, CMake/Ninja.
- **Scope:** domain structures and Catch2 tests only.

### Completed

- Stage 01.1: RouteStep — PASS.
- Stage 01.2: IntentRoute — PASS.
- Stage 01.3: IntentNode — PASS.
- Stage 01.4: RoadmapModule and CodeRef — PASS.

### Verification

- Native Debug build: PASS.
- CTest: 5/5 PASS.
- RoadmapModule field assertions: implemented.
- CodeRef optional-field assertions: implemented.

### Architecture boundary

- Core model remains independent of JSON, CLI, filesystem and DOM.
- Entity relationships use stable IDs.
- No graph validator or file existence checks are implemented.

### Next

Stage 01.5 — construct a small connected roadmap in memory
and verify its ID relationships.

## 2026-10-19 — Stage 01.5 — Connected roadmap fragment

- **Phase:** Stage 01 — domain model.
- **Scope:** small connected in-memory roadmap.
- **Changed file:** tests/roadmap-project.test.cpp.
- **Implementation:** IntentNode, IntentRoute, RouteStep,
  RoadmapModule and CodeRef composed in memory.
- **Link mechanism:** stable string IDs.
- **Verification:** native-debug build PASS; CTest 6/6 PASS.
- **Negative test:** intentionally broken intentId causes FAIL;
  original relationship restored.
- **Boundary:** no JSON, filesystem, CLI or general validator.
- **Result:** PASS.

## 2026-10-19 — Stage 01.6 — LiterateChunk

- **Phase:** Stage 01 — C++ domain model.
- **Source:** roadmap-editor.plan.md, §5.7.
- **Implementation:** LiterateChunk.
- **Fields:** id, name, body, linkedIntentIds, linkedModuleIds.
- **Text:** UTF-8 source text stored without transformation.
- **Relations:** stable string IDs.
- **Tests:** Catch2 author-text and link-storage checks.
- **Verification:** native-debug build PASS; CTest 7/7 PASS.
- **Boundary:** no Markdown parser, JSON or filesystem access.
- **Result:** PASS.

## 2026-10-19 — Stage 01.7 — RoadmapIntersection

- **Phase:** Stage 01 — C++ domain model.
- **Source:** roadmap-editor.plan.md, §5.7.
- **Implementation:** RoadmapIntersection.
- **Fields:** id, title, sourceIds, note.
- **Relations:** stable string IDs.
- **Tests:** authored intersection data and source ordering.
- **Negative experiment:** removing one source causes test failure.
- **Verification:** native-debug build PASS; CTest 8/8 PASS.
- **Boundary:** no generic source-ID validation or inferred intersections.
- **Result:** PASS.

## 2026-10-19 — Stage 01.8a — EstimateValue

- **Phase:** Stage 01 — C++ domain model.
- **Source:** roadmap-editor.plan.md, §5.8.
- **Implementation:** EstimateMetric, EstimateRange,
  EstimateUnknown, EstimateNotApplicable, EstimateText,
  EstimateValue.
- **Design:** std::variant with named alternatives.
- **Units:** integer minutes; effort and elapsed are distinct.
- **Tests:** typed value storage and alternative switching.
- **Verification:** native-debug build PASS; CTest 9/9 PASS.
- **Boundary:** no numeric aggregation, JSON or validation rules.
- **Result:** PASS.

## 2026-10-19 — Stage 01.8b — EstimateEntry

- **Phase:** Stage 01 — C++ domain model.
- **Source:** roadmap-editor.plan.md, §5.8.
- **Implementation:** EstimateConfidence and EstimateEntry.
- **Fields:** id, label, confidence, basis, value.
- **Design:** EstimateValue embedded as std::variant.
- **Relations:** RouteStep.estimateId refers to EstimateEntry.id.
- **Tests:** metadata, range value and estimate ID linkage.
- **Negative experiment:** mismatched estimateId causes FAIL.
- **Verification:** native-debug build PASS; CTest 10/10 PASS.
- **Boundary:** no duration aggregation or generic validator.
- **Result:** PASS.

## 2026-10-19 — Stage 01.9a — RoadmapProject root

- **Phase:** Stage 01 — C++ domain model.
- **Source:** specification §5.3, implementation plan §20.
- **Implementation:** TerminologyProfile, RoadmapMetadata,
  RoadmapProject.
- **Schema:** schemaVersion 2, formatVersion 2.0.0.
- **Collections:** intents, routes, modules, chunks,
  intersections, estimates.
- **Selection:** optional selectedIntentId and selectedRouteId.
- **Metadata:** nullable createdAt and updatedAt.
- **Verification:** native-debug build PASS; CTest 11/11 PASS.
- **Boundary:** no JSON, Clock, filesystem or validation logic.
- **Result:** PASS.

## 2026-10-19 — Stage 01.9b — Connected RoadmapProject

- **Phase:** Stage 01 — C++ domain model.
- **Source:** specification §5.3–5.9 and §20.
- **Implementation:** connected RoadmapProject test fixture.
- **Entities:** IntentNode, IntentRoute, RouteStep,
  RoadmapModule, LiterateChunk, RoadmapIntersection,
  EstimateEntry and CodeRef.
- **Ownership:** root project owns entity collections;
  routes own steps.
- **Relations:** stable string IDs between entities.
- **Selection:** selectedIntentId and selectedRouteId
  reference compatible records.
- **Tests:** connected project fixture with explicit
  relationship assertions.
- **Negative experiment:** invalid selectedIntentId
  causes an expected test failure.
- **Verification:** native-debug build PASS; CTest 12/12 PASS.
- **Boundary:** no general validator, JSON, CLI or filesystem.
- **Result:** PASS.

## 2026-10-20 — Stage 01.10 — External model demo

- **Phase:** Stage 01 — C++ domain model.
- **Source:** specification §20, Stage 01, steps 7–8.
- **New file:** apps/roadmap-model-demo/main.cpp.
- **Updated:** root CMakeLists.txt.
- **Implementation:** standalone learning executable.
- **Input:** RoadmapProject created in memory.
- **Reader:** describeProject(const RoadmapProject&).
- **Output:** std::string returned to external main.
- **Ownership:** project owns collections; no raw pointers.
- **Verification:** native-debug build PASS.
- **Runtime:** roadmap-model-demo.exe prints project summary.
- **Regression:** CTest 12/12 PASS.
- **Boundary:** not a CLI; no JSON, filesystem or validator.
- **Result:** PASS.

## 2026-10-20 — Stage 01 acceptance

- **Phase:** core-domain-model.
- **Specification:** §5 and §20, Stage 01.
- **Domain schema:** 2.
- **Source review:** PASS.
- **Native build:** PASS.
- **Model demo:** PASS.
- **Regression:** CTest 12/12 PASS.
- **Core boundary:** no JSON, DOM or filesystem dependencies.
- **Remaining:** domain validation and serialization are deferred
  to their designated stages.
- **Result:** TECHNICAL PASS.
- **Next:** Stage 02 — native CLI shell.

## 2026-10-20 — Stage 02.1 — CLI bootstrap

- **Phase:** native-cli-shell.
- **Source:** specification §8 and §20, Stage 02.
- **New file:** apps/roadmap-cli/main.cpp.
- **Updated:** root CMakeLists.txt.
- **Executable:** hmap.exe.
- **Supported:** no arguments, help, --help, -h.
- **Error handling:** invalid arguments return exit code 2.
- **Output:** help to stdout; diagnostics to stderr.
- **Remaining:** version, command parser, composition root,
  automated CLI regression tests.
- **Result:** PASS after local verification.

## 2026-10-20 — Stage 02.2 — Typed CLI options and version

- **Phase:** native-cli-shell.
- **Source:** specification §8.1–8.3 and §20, Stage 02.
- **New files:** command-options.hpp, command-options.cpp.
- **Updated:** apps/roadmap-cli/main.cpp and root CMakeLists.txt.
- **Implementation:** CommandKind, CommandOptions, ParseResult.
- **Parser:** argc/argv converted into typed command options.
- **Separation:** argument parsing does not print or execute commands.
- **Version:** program version from CMake; schema 2;
  RoadmapText 1; API 1.
- **Expected errors:** exit code 2 with stderr diagnostics.
- **Verification:** native build and manual CLI checks.
- **Regression:** CTest 12/12 PASS.
- **Result:** PASS after local verification.


## 2026-11-11 — Stage 02.3a — Composition Root

- **Phase:** native-cli-shell.
- **Source:** specification §8 and §20; supplied Stage 02.3a instructions.
- **Implementation:** thin main, hmap-cli-shell STATIC, injected stdout/stderr.
- **Parser:** unchanged.
- **Verification:** GCC 14.2.0 configure/build and four-line version PASS.
- **Result:** TECHNICAL PASS in preparation environment; author acceptance pending.
- **Next:** Stage 02.3b — automated CLI tests.

## 2026-11-11 — Stage 02.3b — Automated CLI contracts

- **Phase:** native-cli-shell.
- **Tests:** help aliases, no arguments, exact four-line version, invalid commands and surplus arguments.
- **Infrastructure:** explicit pinned dependency preparation; configure does not access the network.
- **Platforms:** retained Windows/MinGW defaults; presets now allow an independent Linux gate.
- **Verification:** native-debug build PASS; CTest 15/15 PASS, GCC 14.2.0.
- **Result:** TECHNICAL PASS; Stage 02 implementation complete, author acceptance pending.
- **Next:** Stage 03 — Wasm portability probe.

## 2026-11-11 — Stage 03 — Early Wasm probe

- **Phase:** wasm-portability-probe.
- **Toolchain:** Emscripten 6.0.9, isolated wasm-debug cache.
- **Boundary:** Embind std::string; UTF-8 round trip and caught C++ exception.
- **Build:** ES module, no entry/filesystem/pthreads; 256 MiB memory ceiling.
- **Correction:** Emscripten 6 requires explicit incoming wasmBinary API for the Node fixture runner.
- **Verification:** wasm-debug build and CTest probe PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 04 — strict JSON boundary.

## 2026-11-11 — Stage 04 — Strict JSON boundary

- **Phase:** roadmap-json-boundary.
- **Sources:** specification §5, §6.2, §16; nlohmann/json 3.12.0, verified SHA-256.
- **Implementation:** schema 2, typed reader/writer, embedded self-contained template/schema, initial CLI commands.
- **Strictness:** duplicate keys, unknown fields, malformed UTF-8, depth and byte limits; nullable timestamps remain unchanged.
- **Tests:** canonical JSON round trip, negative JSON, UTF-8/BOM and input bound.
- **Verification:** native-debug build PASS; CTest 18/18 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 05 — model validation.

## 2026-11-11 — Stage 05 — Domain validation

- **Phase:** roadmap-model-validation.
- **Implementation:** global IDs, typed references, duplicate references, selection, iterative lineage DFS, continuous state and estimates.
- **Warnings:** draft routes, acceptance, estimate basis, unused objects.
- **Guarantee:** rejected candidate has no project; diagnostic truncation preserves the error state.
- **Verification:** native-debug build PASS; CTest 22/22 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 06 — RoadmapText/1.

## 2026-11-11 — Stage 06 — RoadmapText/1

- **Phase:** roadmap-text-protocol.
- **Implementation:** explicit records, brace/string-aware scanner, ASCII/Unicode arrows, route blocks, exact step membership.
- **Round trip:** author strings, IDs and array order preserved; comments remain presentation-only.
- **Shared syntax:** JSON duplicate-key/depth/encoding checks reused by record parser.
- **Verification:** native-debug build PASS; CTest 25/25 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 07 — route views and inspect.

## 2026-11-11 — Stage 07 — Route view and inspect

- **Phase:** roadmap-route-view.
- **Implementation:** one route DTO, ASCII/Unicode cards, horizontal viewport with whole glyph clipping, explicit empty selection.
- **Inspect:** author fields, outgoing references and ordered use sites, including route/step occurrences.
- **Output safety:** terminal control bytes are escaped; author data remains unchanged.
- **Verification:** native-debug build PASS; CTest 27/27 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 08 — guidance and common request API.

## 2026-11-11 — Stage 08 — Guidance and common request boundary

- **Phase:** roadmap-guidance and CLI/Wasm integration.
- **Implementation:** one versioned bilingual catalog, help/explain/hints, API 1 envelope and typed CLI options.
- **CLI:** stdin/file input, command-specific flags, JSON envelopes for informational commands, strict warnings and exit codes.
- **Wasm:** processRoadmapRequest bound with Embind; native runner uses the same implementation.
- **Verification:** CTest 29/29 PASS; wasm-debug probe PASS; native/Wasm API parity 11/11 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 09 — durable and temporary storage.

## 2026-11-11 — Stage 09 — Storage adapters

- **Phase:** roadmap-storage.
- **CLI:** same-directory exclusive temporary file, checked write/close, atomic no-clobber install, explicit overwrite and source/target alias rejection.
- **Browser:** codec-injected Memory/LocalStorage, defensive copies, retained corrupt records, typed access/quota/conflict errors; external Clock save operation.
- **Guarantees:** one active writer; no cross-tab transaction or power-loss durability claim.
- **Verification:** CTest 30/30 PASS; TypeScript typecheck PASS; storage tests 3/3 PASS.
- **Result:** TECHNICAL PASS on Linux; Windows file adapter awaits the author's gate.
- **Next:** Stage 10 — Markdown projection.

## 2026-11-11 — Stage 10 — Markdown projection

- **Phase:** markdown-export.
- **Implementation:** safe quoted YAML frontmatter, stable ID anchors, complete sequential routes, author chunks, modules/intersections/typed estimates, explicit route slice.
- **Self-hosting:** examples/hmap-development.roadmap.json references the companion contracts and scenarios; content acceptance remains human.
- **Verification:** native-debug build PASS; CTest 31/31 PASS; repeated export bytes and hostile frontmatter fixture PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 11 — explicit schema-1 migration.

## 2026-11-11 — Stage 11 — Schema-1 migration

- **Phase:** roadmap-format-migration.
- **Authority:** original roadmap-editor.plan.md 0.2.0 read in full; archived in docs/legacy/schema-1-source.plan.md.
- **Implementation:** strict legacy shape, unique order sorting, preserved IDs/timestamps/estimate labels, explicit defaults and selected-route decision report.
- **CLI:** candidate JSON on stdout; migration report on stderr; source remains untouched.
- **Verification:** native-debug build PASS; CTest 32/32 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 12 — public embeddable UI.

## 2026-11-11 — Stage 12 — Public editor and Worker lifecycle

- **Phase:** embeddable-ui-shell / literate-source-view / single-intent-road-view.
- **Implementation:** async public factory, defensive snapshots, separate view state, two roots, readonly, reviewed import, latest-revision guard and idempotent destroy.
- **Layout:** literature above, one horizontally scrolling route below, keyboard/pointer separator, scoped monochrome CSS.
- **Ownership:** host owns the shared engine and storage; editor removes its own DOM/listeners.
- **Browser correction:** DYNAMIC_EXECUTION=0 keeps Embind compatible with the strict static CSP.
- **Verification through demo/embedding fixtures:** TypeScript PASS; Firefox 6/6 and Chromium 6/6 PASS.
- **Result:** TECHNICAL PASS; author acceptance pending.
- **Next:** Stage 13 — static demo and deployment passport.

## 2026-11-11 — Stage 13 — Static host and Cloudflare passport

- **Phase:** web-demo.
- **Host:** explicit save/copy, JSON/Markdown downloads, guidance, engine retry and visible temporary storage.
- **Build:** separate public embedding package, versioned JS/Wasm pair, same-origin static loading and third-party notices.
- **HTTP:** root and /tools/roadmap/ probe with Wasm MIME; independent embedding example.
- **Cloudflare:** docs/cloudflare-site-passport.ru.md; proposed hmap.zhovten.games; current monorepo and future standalone root configurations.
- **Verification:** production web build PASS; distribution check PASS; root/nested and host browser fixtures PASS.
- **Publication:** prepared only; no Pages project, DNS mutation or public release performed.
- **Result:** TECHNICAL PASS locally; public deployment smoke is reserved for the owner.
- **Next:** Stage 14 — consolidated acceptance.

## 2026-11-11 — Stage 14 — Consolidated candidate validation

- **Phase:** validation-pass.
- **Hardening:** bounded ID matching, calendar timestamps, request/map byte separation, error-preserving diagnostic truncation, pre-analysis resource counts and UTF-8 CLI transport.
- **Lifecycle:** latest candidate guard, retained host snapshot across failed engine retries and explicit storage deletion semantics.
- **Source evidence:** retained author files, immutable complete PLW regular-file copy, reused root policy reference and candidate-profile source mapping.
- **Delivery:** ordered project-relative diffs with exact before/after hashes, isolated full-series preflight and per-stage lesson cards.
- **Validation:** final all-profile, sanitizer and clean replay results are recorded in the generated delivery report; no unobserved PASS is asserted here.
- **Human gates:** fresh Windows adapter build, independent author pass and actual Cloudflare/DNS/HTTPS observation remain with the owner.
- **Result:** completed implementation candidate for technical and content review.

### Final observed checks before handoff

- Native Catch2/CTest: 33/33 PASS; real CLI integration including help/flag/color/NO_COLOR boundaries: 40/40 PASS.
- Browser contracts: 22/22 PASS; Chromium 145.0.7632.6 and Firefox 146.0.1.
- Storage adapter tests: 3/3 PASS; native/Wasm request parity: 11/11 PASS.
- Native Release validation workload: 945,990 bytes / 1,000 steps, 0.13 s including process startup.
- Warm Worker median on the matching release artifact: 0.20 s Chromium / 0.41 s Firefox for 933,877 bytes / 1,000 steps.
- Near-input-limit workload: 7,506,178 bytes accepted in both browser Workers, with retained warnings and no runtime failure.
- ASan/UBSan: 33/33 PASS with ASAN_OPTIONS=detect_leaks=0. LeakSanitizer is unavailable under this execution host's tracing; no leak-check PASS is claimed.
- All-profile source snapshot: unchanged during verification. The final all-profile and clean replay reports accompany the ordered diff archive.
