# Graph Report - smart-bookmark  (2026-11-13)

## Corpus Check
- 56 files · ~76,391 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .css 3, (none) 2)

## Summary
- 408 nodes · 759 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

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
- agent.mjs
- manifest.json
- scripts
- BookmarkApi
- compilerOptions
- Smart Bookmark
- chrome-extension/package.json
- popup.js
- Smart Bookmark
- Smart Bookmark 实施计划
- Smart Bookmark 首版

## God Nodes (most connected - your core abstractions)
1. `Library` - 22 edges
2. `App()` - 16 edges
3. `App()` - 16 edges
4. `compilerOptions` - 16 edges
5. `FolderNode` - 15 edges
6. `FolderNode` - 13 edges
7. `Bookmark` - 13 edges
8. `getFolderPath()` - 13 edges
9. `Bookmark` - 13 edges
10. `BookmarkApi` - 11 edges

## Surprising Connections (you probably didn't know these)
- `start()` --calls--> `Library`  [EXTRACTED]
  apps/desktop/main/main.mjs → apps/desktop/main/library.mjs
- `NewBookmarkModalProps` --references--> `FolderNode`  [EXTRACTED]
  apps/desktop/src/components/NewBookmarkModal.tsx → apps/desktop/src/lib/types.ts
- `ExtensionPopupModalProps` --references--> `ChromeExtensionStatus`  [EXTRACTED]
  design-reference/web/smart-bookmark/src/components/ExtensionPopupModal.tsx → design-reference/web/smart-bookmark/src/lib/types.ts
- `NewBookmarkModalProps` --references--> `FolderNode`  [EXTRACTED]
  design-reference/web/smart-bookmark/src/components/NewBookmarkModal.tsx → design-reference/web/smart-bookmark/src/lib/types.ts
- `connect()` --calls--> `writeBookmark()`  [EXTRACTED]
  apps/chrome-extension/background.js → apps/chrome-extension/bookmarks.js

## Import Cycles
- None detected.

## Communities (21 total, 5 thin omitted)

### Community 0 - "smart-bookmark/package.json"
Cohesion: 0.05
Nodes (36): dependencies, lucide-react, react, react-dom, devDependencies, tailwindcss, @tailwindcss/vite, tsx (+28 more)

### Community 1 - "smart-bookmark/src/App.tsx"
Cohesion: 0.12
Nodes (46): App(), BookmarkDetailPanel(), BookmarkDetailPanelProps, BookmarkList(), BookmarkListProps, ExtensionPopupModal(), ExtensionPopupModalProps, NewBookmarkModal() (+38 more)

### Community 2 - "desktop/src/App.tsx"
Cohesion: 0.11
Nodes (40): App(), apply(), send(), startImport(), writeback(), empty, messageOf(), AgentPanel() (+32 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "desktop/package.json"
Cohesion: 0.04
Nodes (47): build, appId, directories, electronDist, files, win, dependencies, @earendil-works/pi-coding-agent (+39 more)

### Community 5 - "windows-smoke.mjs"
Cohesion: 0.05
Nodes (29): connect(), identity(), journal, signatures(), state, fields, writeBookmark(), ChromeBridge (+21 more)

### Community 6 - "Library"
Cohesion: 0.16
Nodes (8): chromeFields(), FIELDS, flattenTree(), folderId(), Library, LOCAL_FOLDER, timestamp(), validate()

### Community 9 - "agent.mjs"
Cohesion: 0.29
Nodes (3): BookmarkAgent, runBookmarkCommand(), @earendil-works/pi-coding-agent

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

### Community 20 - "Smart Bookmark 实施计划"
Cohesion: 0.50
Nodes (3): Smart Bookmark 实施计划, 实施, 验收记录

## Knowledge Gaps
- **23 isolated node(s):** `lucide-react`, `react`, `react-dom`, `@tailwindcss/vite`, `@types/react` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ws` connect `windows-smoke.mjs` to `desktop/package.json`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `lucide-react`, `react`, `react-dom` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `smart-bookmark/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Why does `Library` connect `Library` to `agent.mjs`, `windows-smoke.mjs`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `smart-bookmark/src/App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11584699453551912 - nodes in this community are weakly interconnected._
- **Should `desktop/src/App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11363636363636363 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._