# Graph Report - smart-bookmark  (2026-11-14)

## Corpus Check
- 61 files · ~24,861 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 3, (none) 2)

## Summary
- 440 nodes · 834 edges · 27 communities (21 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff3e71e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- smart-bookmark/package.json
- smart-bookmark/src/App.tsx
- desktop/src/App.tsx
- compilerOptions
- desktop/package.json
- windows-smoke.mjs
- Library
- AGENTS.md
- README.md
- main.mjs
- manifest.json
- scripts
- ChromeBridge
- compilerOptions
- Smart Bookmark
- chrome-extension/package.json
- popup.js
- Smart Bookmark
- devDependencies
- Smart Bookmark 实施计划
- Smart Bookmark 首版
- build
- dependencies
- scripts
- preload.cjs
- 2026-11-14-agent-settings.md

## God Nodes (most connected - your core abstractions)
1. `Library` - 23 edges
2. `App()` - 16 edges
3. `App()` - 16 edges
4. `compilerOptions` - 16 edges
5. `FolderNode` - 15 edges
6. `BookmarkApi` - 14 edges
7. `FolderNode` - 13 edges
8. `Bookmark` - 13 edges
9. `getFolderPath()` - 13 edges
10. `Bookmark` - 13 edges

## Surprising Connections (you probably didn't know these)
- `start()` --calls--> `ChromeBridge`  [EXTRACTED]
  apps/desktop/main/main.mjs → apps/desktop/main/bridge.mjs
- `start()` --calls--> `Library`  [EXTRACTED]
  apps/desktop/main/main.mjs → apps/desktop/main/library.mjs
- `send()` --calls--> `messageOf()`  [EXTRACTED]
  apps/desktop/src/App.tsx → apps/desktop/src/lib/api.ts
- `NewBookmarkModalProps` --references--> `FolderNode`  [EXTRACTED]
  apps/desktop/src/components/NewBookmarkModal.tsx → apps/desktop/src/lib/types.ts
- `submit()` --calls--> `messageOf()`  [EXTRACTED]
  apps/desktop/src/components/SettingsDialog.tsx → apps/desktop/src/lib/api.ts

## Import Cycles
- None detected.

## Communities (27 total, 6 thin omitted)

### Community 0 - "smart-bookmark/package.json"
Cohesion: 0.05
Nodes (36): dependencies, lucide-react, react, react-dom, devDependencies, tailwindcss, @tailwindcss/vite, tsx (+28 more)

### Community 1 - "smart-bookmark/src/App.tsx"
Cohesion: 0.11
Nodes (46): App(), BookmarkDetailPanel(), BookmarkDetailPanelProps, BookmarkList(), BookmarkListProps, ExtensionPopupModal(), ExtensionPopupModalProps, NewBookmarkModal() (+38 more)

### Community 2 - "desktop/src/App.tsx"
Cohesion: 0.07
Nodes (47): App(), apply(), send(), startImport(), writeback(), empty, AgentPanel(), Message (+39 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "desktop/package.json"
Cohesion: 0.11
Nodes (18): description, lucide-react, react, react-dom, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom (+10 more)

### Community 5 - "windows-smoke.mjs"
Cohesion: 0.07
Nodes (20): connect(), identity(), journal, signatures(), state, fields, writeBookmark(), browserProfile (+12 more)

### Community 6 - "Library"
Cohesion: 0.16
Nodes (8): chromeFields(), FIELDS, flattenTree(), folderId(), Library, LOCAL_FOLDER, timestamp(), validate()

### Community 9 - "main.mjs"
Cohesion: 0.11
Nodes (18): BookmarkAgent, runBookmarkCommand(), connectionError(), createAgentModel(), endpoints, testAgentModel(), AgentSettings, isLoopback() (+10 more)

### Community 10 - "manifest.json"
Cohesion: 0.14
Nodes (13): action, default_popup, default_title, background, service_worker, type, description, host_permissions (+5 more)

### Community 11 - "scripts"
Cohesion: 0.17
Nodes (11): engines, node, name, packageManager, private, scripts, build, check (+3 more)

### Community 13 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, lib, module, moduleResolution, noEmit, skipLibCheck, target (+2 more)

### Community 14 - "Smart Bookmark"
Cohesion: 0.20
Nodes (9): Colors, Components, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes, Smart Bookmark (+1 more)

### Community 15 - "chrome-extension/package.json"
Cohesion: 0.33
Nodes (5): name, private, scripts, check, type

### Community 16 - "popup.js"
Cohesion: 0.33
Nodes (4): code, form, help, status

### Community 17 - "Smart Bookmark"
Cohesion: 0.33
Nodes (5): Pi Agent, Smart Bookmark, 启动, 连接 Chrome, 验证与设计参考

### Community 18 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, electron, electron-builder, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript (+2 more)

### Community 20 - "Smart Bookmark 实施计划"
Cohesion: 0.50
Nodes (3): Smart Bookmark 实施计划, 实施, 验收记录

### Community 22 - "build"
Cohesion: 0.25
Nodes (8): build, appId, directories, electronDist, files, win, output, signAndEditExecutable

### Community 23 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, @earendil-works/pi-coding-agent, lucide-react, react, react-dom, ws

### Community 24 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, check, package:win, start

### Community 25 - "preload.cjs"
Cohesion: 0.50
Nodes (3): { contextBridge, ipcRenderer }, names, electron

## Knowledge Gaps
- **23 isolated node(s):** `lucide-react`, `react`, `react-dom`, `@tailwindcss/vite`, `@types/react` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ws` connect `ChromeBridge` to `desktop/package.json`, `windows-smoke.mjs`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `lucide-react`, `react`, `react-dom` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `smart-bookmark/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `Library` connect `Library` to `main.mjs`, `windows-smoke.mjs`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `smart-bookmark/src/App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11315924219150025 - nodes in this community are weakly interconnected._
- **Should `desktop/src/App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07263157894736842 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._