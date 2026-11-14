# Template derivation

The initial project used the PLW starter at commit `3f75890a1b211eb81fc51697692a73a8ce895599`. The completion package retains the full upstream regular-file tree under `methodology/upstream/prompt-literate-workflow` without changing its bytes. `manifest/plw-upstream-tree.json` records the original Git blobs and SHA-256 values. The upstream policy gitlink is represented by its exact commit and reused through the root `.licensing-policy` reference.

Local root artifacts adapt the starter's plan/contracts/scenarios/prompts/TRACE to C++20, CLI/Wasm/Web and the author's stage workflow. The canonical product plan remains `roadmap-editor.plan.md` 0.3.0-draft; `hmap-completion.plan.md` bounds the current completion operation. Constitutional integration remains reference mode with a draft local Profile. Upstream methodology and licensing-policy corpora retain their own terms and are excluded from the browser distribution.
