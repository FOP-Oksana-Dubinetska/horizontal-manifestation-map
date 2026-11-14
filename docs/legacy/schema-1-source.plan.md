---
artifact_type: "ironcreed-roadmap-plan"
format_version: "0.2.0"
project_id: "ironcreed-roadmap-editor"
title: "IRONCREED Roadmap Editor — Public Embeddable MVP"
terminology_profile: "engineering"
source_mode: "human-authored"
plw_compatible: true
plw_template_derived: true
plw_reference: "https://github.com/IRONCREED/prompt-literate-workflow"
local_extension_files:
  - "PROJECT-ADAPTATION.md"
  - "FORMAT-OVERRIDES.md"
  - "STORAGE.md"
default_storage_adapter: "LocalStorageAdapter"
test_storage_adapter: "MemoryStorageAdapter"
canonical_data_format: "RoadmapProject JSON"
markdown_is_canonical: false
status: "draft-for-codex"
created_at: "2026-06-21"
---

# IRONCREED Roadmap Editor — Public Embeddable MVP

This file is the canonical human-authored plan for the first public embeddable version of the IRONCREED Roadmap Editor.

The plan must also demonstrate the route that the future editor itself will export. Therefore this package is not a separate hand-written prompt format. It is a PLW-compatible Roadmap Editor export shape.

The editor must be designed as a public package first. The IRONCREED desktop application is only one consumer of the editor. The editor must support replaceable storage and must not depend on Electron, SQLite, Obsidian, or any internal IRONCREED application path.

The product is not a task manager, not a UML replacement, and not a universal architecture tool. It is a strict local-first editor for intent-driven architecture planning through a literate source view and a single UML-like route projection.

## Repository Route

```text
<<route:plw-template-to-roadmap-editor>>

[Use PLW Template Repository]
estimate: 15–30 min
        →
[Add Roadmap Local Adaptation]
estimate: 30–60 min
        →
[Apply Roadmap Format Override]
estimate: 30–60 min
        →
[Define Storage Adapter Defaults]
estimate: 30–45 min
        →
[Implement Public Editor Packages]
estimate: 2–4 d
        →
[Run Validation / Smoke Checks]
estimate: 1–2 h
        →
[Record TRACE]
estimate: 15–30 min
```

This route is part of the plan. It must be possible to say:

```text
1. The implementation repository was created from IRONCREED/prompt-literate-workflow.
2. The Roadmap Editor plan was added as a local additive method extension.
3. The Roadmap Editor export format was defined as an override/projection layer.
4. Codex implemented only inside the plan/contracts/scenarios boundary.
5. Storage is adapter-based, with LocalStorageAdapter as browser MVP default.
```

## Product Formula

```text
RoadmapProject JSON
  → human-readable roadmap plan
  → chunk contracts
  → bounded Codex prompt
  → candidate implementation
  → review / validation / TRACE
  → Markdown / Obsidian-compatible projection
```

## Non-goals for MVP

Do not implement:

```text
canvas editor
multi-route canvas
side inspector panel
module import
file tree editor
Obsidian Canvas
Dataview / Templater support
cloud sync
authentication
AI generation inside the app
Electron-specific code in core or UI packages
React / Vue / Svelte
```

The first version must be severe, readable, and controlled.

---

# Road View

Only one route is visible at a time.

```text
<<route:mvp-public-editor>>

[Workspace Foundation]
estimate: 2–4 h
        →
[Core Domain Model]
estimate: 4–6 h
        →
[Storage Adapter Contract]
estimate: 3–5 h
        →
[Embeddable UI Shell]
estimate: 5–8 h
        →
[Literate Source View]
estimate: 4–6 h
        →
[Single Intent Road View]
estimate: 4–6 h
        →
[Markdown Export]
estimate: 3–5 h
        →
[Web Demo]
estimate: 2–4 h
        →
[Validation Pass]
estimate: 2–3 h
```

The route must be represented in the bottom rail. It must not split into two visible route rows. Alternative routes may exist later, but MVP must display one selected route only.

---

# Global Invariants

```text
<<invariants>>
```

1. The implementation repository must be derived from the PLW template repository or from a full copy of it.
2. PLW core method files must not be silently modified by Roadmap-specific needs.
3. Roadmap-specific rules live in local additive extension files.
4. The editor is public and embeddable.
5. Core models must not depend on DOM, Electron, browser storage, Markdown, or application-specific paths.
6. UI must be vanilla TypeScript.
7. The default visual style must be monochrome / console-like / literate-editor-like.
8. The upper area contains only the literate source view.
9. The lower area contains only the selected route.
10. There is no right panel in MVP.
11. The top controls are limited to terminology / meaning profile selector, linked-area filter, and import button placeholder.
12. Storage must be replaceable through a `RoadmapStorageAdapter`.
13. Browser MVP default storage is `LocalStorageAdapter`.
14. Test/default temporary storage is `MemoryStorageAdapter`.
15. `RoadmapProject JSON` is the canonical application data format.
16. Markdown / Obsidian-compatible output is an export projection, not the source of truth.
17. PLW integration is minimal and additive: plan, contracts, scenarios, prompt, trace.
18. Codex may implement code from this plan but must not silently redesign the product.

---

# PLW Template Preparation

```text
<<plw-template-preparation>>
```

Prepare the implementation repository from the PLW template repository:

```text
https://github.com/IRONCREED/prompt-literate-workflow
```

Required repository preparation:

```text
Use the repository as a GitHub template repository or perform a full repository tree copy.
Preserve universal method files.
Add Roadmap Editor local adaptation files.
Add Roadmap export format override files.
Add storage model notes.
Run structural method validation before implementation.
```

Codex must not treat this plan package as an unrelated standalone prompt. It is a project-local extension over the PLW template.

---

# Workspace Foundation

```text
<<workspace-foundation>>
```

Create a small monorepo suitable for public package development.

Required structure:

```text
roadmap-editor/
  packages/
    core/
    storage/
    markdown/
    ui/
  apps/
    web-demo/
  docs/
    embedding.md
    storage-adapters.md
    terminology.md
  README.md
  package.json
  tsconfig.base.json
```

Recommended toolchain:

```text
Vite
TypeScript
CSS
npm workspaces
```

No framework is allowed in MVP. The UI package must be implemented with vanilla TypeScript and DOM controllers.

---

# Core Domain Model

```text
<<core-domain-model>>
```

The core package defines the model used by the editor and by exported artifacts.

Required public types:

```ts
export type RoadmapProject = {
  schemaVersion: 1;
  id: string;
  title: string;
  terminologyProfile: TerminologyProfileName;
  intents: IntentNode[];
  selectedIntentId: string | null;
  routes: IntentRoute[];
  modules: RoadmapModule[];
  chunks: LiterateChunk[];
  intersections: RoadmapIntersection[];
  estimates: EstimateEntry[];
  metadata: RoadmapMetadata;
};

export type IntentNode = {
  id: string;
  title: string;
  summary: string;
  order: number;
  status: "draft" | "active" | "implemented" | "deferred";
};

export type IntentRoute = {
  id: string;
  intentId: string;
  title: string;
  steps: RouteStep[];
};

export type RouteStep = {
  id: string;
  title: string;
  order: number;
  stereotype: "intent" | "module" | "shared" | "validation" | "export";
  estimateId?: string;
  linkedModuleIds: string[];
  linkedChunkIds: string[];
};

export type RoadmapModule = {
  id: string;
  title: string;
  summary: string;
  kind: "core" | "ui" | "storage" | "export" | "demo" | "validation";
  linkedIntentIds: string[];
};

export type LiterateChunk = {
  id: string;
  name: string;
  body: string;
  linkedIntentIds: string[];
  linkedModuleIds: string[];
};

export type RoadmapIntersection = {
  id: string;
  title: string;
  sourceIds: string[];
  note: string;
};

export type EstimateEntry = {
  id: string;
  label: string;
  confidence: "low" | "medium" | "high";
};

export type TerminologyProfileName =
  | "engineering"
  | "simple"
  | "product"
  | "literary";

export type RoadmapMetadata = {
  formatVersion: string;
  createdAt: string;
  updatedAt: string;
};
```

Validation rules:

```text
Every project must have a stable id.
Every route step must belong to a route.
Every selected intent must exist.
Every linked module id must resolve to a module.
Every linked chunk id must resolve to a chunk.
The route view must be able to render even if no project has been saved yet.
```

---

# Storage Adapter Contract

```text
<<storage-adapter-contract>>
```

Define storage as an adapter interface.

```ts
export interface RoadmapStorageAdapter {
  listProjects(): Promise<RoadmapProjectMeta[]>;
  loadProject(projectId: string): Promise<RoadmapProject | null>;
  saveProject(project: RoadmapProject): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
}

export type RoadmapProjectMeta = {
  id: string;
  title: string;
  updatedAt: string;
};
```

MVP adapters:

```text
MemoryStorageAdapter
LocalStorageAdapter
```

Default adapter rules:

```text
Public browser MVP default: LocalStorageAdapter.
Tests and temporary demo sessions: MemoryStorageAdapter.
If localStorage is unavailable, demo may fall back to MemoryStorageAdapter with a visible warning.
```

Recommended localStorage key shape:

```text
ironcreed-roadmap:project-index
ironcreed-roadmap:project:<projectId>
```

Later adapters, not implemented in MVP:

```text
IndexedDbStorageAdapter
ElectronJsonStorageAdapter
RemoteApiStorageAdapter
```

The UI package receives a storage adapter through config. It must not instantiate application-specific storage internally.

---

# Embeddable UI Shell

```text
<<embeddable-ui-shell>>
```

Create a public function:

```ts
export function createRoadmapEditor(config: RoadmapEditorConfig): RoadmapEditorInstance;
```

Required config:

```ts
export type RoadmapEditorConfig = {
  root: HTMLElement;
  storage: RoadmapStorageAdapter;
  initialProject?: RoadmapProject;
  initialProjectId?: string;
  terminology?: TerminologyProfileName;
  readonly?: boolean;
  features?: Partial<RoadmapFeatureFlags>;
  onChange?: (project: RoadmapProject) => void;
};

export type RoadmapFeatureFlags = {
  importButton: boolean;
  markdownExport: boolean;
  terminologySelector: boolean;
  linkedAreaFilter: boolean;
};
```

Required instance:

```ts
export type RoadmapEditorInstance = {
  destroy(): void;
  getProject(): RoadmapProject;
  setProject(project: RoadmapProject): void;
};
```

The UI shell must render:

```text
top control strip
literate source panel
horizontal resize divider
single route rail
```

---

# Literate Source View

```text
<<literate-source-view>>
```

The upper workspace is the source view.

It must show a readable document-like representation of the current project:

```text
# Intent: Public Embeddable Roadmap Editor

The editor is a strict local-first architecture planning tool. It exposes a literate source view above and a single UML-like route projection below.

<<shared:storage-adapter-contract>>
Storage is replaceable. The editor receives storage through configuration and must not know whether the project is stored in memory, localStorage, Electron userData, or a future remote API.

<<shared:literate-export>>
Markdown export is a projection. JSON remains the canonical structured source.
```

MVP does not need full editing logic. It must render the document view from a sample project and from the current in-memory project.

Visual rules:

```text
monochrome first
subtle borders
no card-heavy SaaS style
chunk labels use monospaced type
body text remains readable
```

---

# Single Intent Road View

```text
<<single-intent-road-view>>
```

The lower workspace renders the selected route as one visible horizontal route.

Node style:

```text
+----------------------------+
| <<intent>>                 |
| Workspace Foundation       |
|----------------------------|
| estimate: 2–4 h            |
+----------------------------+
```

Route style:

```text
[node] ----> [node] ----> [node]
```

Rules:

```text
Only one route row is visible.
No stacked route rows.
No canvas.
No minimap.
No graph dragging.
Horizontal overflow may be scrollable.
Each node can show a stereotype and estimate.
```

---

# Markdown / Obsidian-Compatible Export

```text
<<markdown-export>>
```

Markdown export must be a projection from the structured project.

MVP export targets:

```text
single Markdown document
Obsidian-compatible folder shape as generated text preview or downloadable archive later
```

The MVP must include at least a pure function:

```ts
export function exportProjectToMarkdown(project: RoadmapProject): string;
```

The output should include:

```text
YAML frontmatter
project overview
intent route
literate chunks
modules
intersections
estimates
```

Use basic Obsidian-compatible features only:

```text
YAML frontmatter
[[wikilinks]]
#tags
plain Markdown headings
```

Do not implement:

```text
Dataview
Canvas
Templater
block references
embedded files
```

---

# Web Demo

```text
<<web-demo>>
```

Create a web demo under `apps/web-demo`.

The demo must:

```text
render the editor in a browser
use LocalStorageAdapter by default
fall back to MemoryStorageAdapter only if localStorage is unavailable
load one sample project
show the strict monochrome UI
show one route only
show the literate source view above
```

The demo must not pretend to be the final IRONCREED desktop app.

---

# Validation Pass

```text
<<validation-pass>>
```

Required checks:

```text
npm install
npm run typecheck
npm run build
```

If test infrastructure is present:

```text
npm test
```

Manual smoke-check:

```text
Open web demo.
Confirm the top source panel is visible.
Confirm no right panel exists.
Confirm the bottom route shows one horizontal route only.
Confirm the route nodes show stereotypes and estimates.
Confirm the editor can be created with a storage adapter.
Confirm LocalStorageAdapter is the public browser default.
Confirm MemoryStorageAdapter can be used in tests.
Confirm Markdown export returns a non-empty string.
```

---

# PLW Integration Layer

```text
<<plw-integration>>
```

This plan is intended to be used inside a repository derived from `IRONCREED/prompt-literate-workflow`.

Expected companion files:

```text
roadmap-editor.plan.md
CONTRACTS.md
SCENARIOS.md
prompts/implement-mvp.prompt.md
TRACE.md
PROJECT-ADAPTATION.md
FORMAT-OVERRIDES.md
STORAGE.md
TEMPLATE-DERIVATION.md
```

This plan is the canonical source. Codex output is candidate implementation until reviewed and validated.

Codex must not treat chat history as the source of truth. If there is a conflict between this plan and a later instruction, ask for an explicit plan update or implement only the explicitly requested change.

---

# Codex Operation Boundary

```text
<<codex-operation-boundary>>
```

Codex is allowed to:

```text
prepare the repository from the PLW template
add the Roadmap Editor local adaptation files
create the monorepo scaffold
implement package source files
implement the demo app
write CSS for the strict UI
create sample data
create Markdown export functions
add basic validation scripts
```

Codex is not allowed to:

```text
modify PLW universal core invariants without explicit approval
switch to React, Vue, Svelte, or another UI framework
add canvas or graph libraries
add Electron-specific code to core or UI
add cloud sync
add AI generation logic
replace JSON model with Markdown as source of truth
add a right inspector panel
render multiple route rows in the MVP
```

---

# Acceptance Summary

The implementation is acceptable when:

```text
The repository is derived from the PLW template or full PLW copy.
The Roadmap Editor rules are local additive extensions.
A public embeddable vanilla TypeScript editor exists.
It can be mounted through createRoadmapEditor().
It accepts replaceable storage.
LocalStorageAdapter is the public browser MVP default.
MemoryStorageAdapter is available for tests and temporary sessions.
It renders a strict monochrome UI.
It shows literate source above and one route below.
It provides a structured domain model.
It exports a Markdown representation.
It builds and type-checks.
It does not silently expand the scope.
TRACE records the implementation operation and validation result.
```
