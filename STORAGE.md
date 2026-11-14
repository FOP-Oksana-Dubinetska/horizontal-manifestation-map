# Storage contract

CLI reads an explicit file/stdin and prepares the whole result before output. A file save writes an exclusively created temporary file beside the destination, checks writing and close, then installs it. Linux uses hard-link installation for atomic no-clobber and rename for explicit replacement. Windows uses CreateFileW/MoveFileExW. Source/target aliases are rejected; expected failures clean temporary files. Power-loss durability through fsync and cross-platform filesystem transactions remain outside this contract.

MemoryStorageAdapter returns copies on both save and load and uses an injected codec. LocalStorageAdapter uses that same C++ codec for persisted external data. Each project is stored in one key `ironcreed-roadmap:v2:project:<id>`; the list scans that namespace. A separate mutable project index is unnecessary for this MVP. Invalid existing bytes cause E_STORAGE_CORRUPT and are preserved. Healthy list entries remain available with a host callback for corrupt entries.

The host chooses LocalStorage or a visible temporary Memory session at startup. A later save failure produces an error and a JSON download path; it preserves the current editor and last-saved snapshot. Access, quota and conflict errors have distinct codes. Storage does not change timestamps. `prepareProjectSave(project, clock)` sets updatedAt and initializes createdAt from an explicit external clock.

One active writer is supported. The adapter observes storage events and compares the last-read raw value immediately before a write. It pauses after observed conflicts until reload or save-as-copy. This detects relevant races and does not establish a cross-tab transaction. LocalStorage belongs to one origin and does not constitute a backup.
