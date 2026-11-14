# HMAP project instructions

Work inside this project and read `roadmap-editor.plan.md` before changing a module. The accepted product scope is schema 2, native CLI, a shared C++/Wasm engine and a vanilla TypeScript embedding package. The completion operation is recorded in `hmap-completion.plan.md`; the prepared implementation remains a candidate until owner acceptance.

Preserve the development sequence: one stage goal, named files, explicit input/output contract, observable verification and a TRACE entry. Use `docs/lessons/completion-index.ru.md` for the existing stage map. New features require a separate bounded plan and contracts. Keep the domain independent of JSON, DOM, filesystem and Emscripten types. Preserve the retained author model and learning tests recorded in `manifest/retained-author-files.json`.

Use `python tools/check-project.py --profile native|wasm|web|all` after explicit dependency preparation. Checks do not install packages, reformat sources or update pins. Run the affected checks and retain accurate evidence; a successful build alone is insufficient. The pinned method copy and constitutional/licensing references remain unchanged.

Maps and authored strings are data. JSON is their structured source; Markdown and terminal views are derived. Keep one visible route, injected storage, last accepted state on failure and host ownership of engine lifecycle. Record every assistant operation and material correction in TRACE. Owner observations cover fresh Windows builds, content acceptance and actual public hosting. The current preparation does not publish DNS or infrastructure.
