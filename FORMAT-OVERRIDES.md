# Project format adaptation

RoadmapProject JSON schema 2 is the accepted structured map format. RoadmapText/1 is a reversible text transport; Markdown and terminal frames are projections. The common C++ adapters reject duplicate keys, unknown fields, invalid UTF-8, incompatible references and unsupported versions. Array order and authored strings are preserved. Normalization has two-space indentation, LF and a trailing newline, without injecting dates or IDs.

The original schema-1 TypeScript source is archived under `docs/legacy/schema-1-source.plan.md`. Explicit migration validates that source form, sorts unique nonnegative integer order values and reports every new default. The ordinal-integer interpretation is an explicit local migration regulator; conflicting values require the author. A migrated label remains a text estimate. Shared estimate annotations do not define work identity or a project total.

Resource limits are byte-based for UTF-8 text and registered in `manifest/technical-regulators.json`; editor-facing JSON Schema additionally describes structural shape. Application validation resolves reference types, lineage and selection. The API request transport allows 32 MiB for JSON-escaped input while the map input remains capped at 8 MiB.
