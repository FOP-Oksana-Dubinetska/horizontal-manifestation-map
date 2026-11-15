# Project adaptation

The author implemented the Stage 01 C++ model and tests. The direct completion request of 2026-11-11 authorizes the assistant to prepare the remaining MVP and a sequential diff delivery. Candidate implementation is reviewed through the original stage order and lesson cards. Technical checks, author understanding and publication remain distinct records.

The primary author environment remains Windows/MinGW-w64 GCC/CMake/Ninja/GDB. This delivery adds an independent Linux/GCC verification environment and a pinned Emscripten 6.0.9 target. Each compiler owns its build cache. The default native presets discover the toolchain from PATH; a personal compiler path belongs in CMakeUserPresets.json.

The architecture keeps typed domain/application code separate from JSON/text/Markdown adapters, CLI files, guidance resources, the Wasm string boundary, storage and DOM. Source naming follows the established project package map. Universal PLW files are retained unmodified in a pinned full-tree copy; local contracts/scenarios/prompts remain at the project root. Its upstream policy gitlink is mapped to the root pinned policy reference, avoiding a second policy tree. The full-copy inventory is checked by byte hash.

The proposed constitutional mode is reference. The prepared Profile P01–P18 and legislation remain drafts for owner adoption; preparation grants no ratification or release authority to the assistant. The governing facts, source SHA, changes and evidence are recorded in governance/GOVERNANCE_SOURCES.md and the normative translation record.

The direct request of 2026-11-14 authorizes Stage 15–18 under hmap-authoring.plan.md: authoring forms, explicit architecture/route links and a simplified workspace. The schema, retained author artifacts, external method copies and publication boundary are unchanged.
