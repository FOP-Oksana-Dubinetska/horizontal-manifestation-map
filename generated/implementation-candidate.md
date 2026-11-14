# HMAP implementation candidate

Run: HMAP-20261111-COMPLETION. Product authority: `roadmap-editor.plan.md` 0.3.0-draft; bounded operation: `hmap-completion.plan.md`, `<<complete-mvp>>`.

Candidate artifacts reside in `packages/`, `apps/`, `schema/`, `test/`, `tests/`, `tools/`, `docs/`, `manifest/` and the root project overlay. The delivery collection contains ordered patches against the recorded upstream subtree. `TRACE.md` records stage checks and retains technical candidate status separately from human acceptance.

Evidence is produced in `build/check-reports/`: native Catch2/CTest, real CLI integration, native/Wasm parity, browser/storage tests, distribution integrity and control-pass source snapshots. The human acceptance checklist and remote deployment observations remain in `docs/acceptance-matrix.ru.md` and `docs/cloudflare-site-passport.ru.md`.
