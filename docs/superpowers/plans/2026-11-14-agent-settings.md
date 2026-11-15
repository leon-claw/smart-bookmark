# Agent Settings Implementation Plan

**Goal** Implement unified desktop settings and configure the embedded Pi agent entirely within Smart Bookmark.

**Architecture** Electron owns the application model profile and encrypted credential, exposes redacted settings over the existing preload IPC, and supplies a private configuration to Pi. The renderer uses one settings dialog with Agent and Chrome extension categories.

- [x] Verify profile validation and persisted credential handling, including credential reuse only for the same provider and endpoint, replacement, and clearing.
- [x] Wire the application profile to Pi model selection and in-memory sessions. Test an isolated synthetic tool call and replace the session when the profile changes.
- [x] Add the unified settings dialog and entry points, empty/configured Agent states, and inline connection feedback. Migrate existing Chrome connection UI.
- [x] Run project checks and Windows smoke coverage using an isolated profile configured through the dialog. Rebuild the portable app and update the project graph.
