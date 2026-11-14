# Smart Bookmark 实施计划

**目标**　提供可运行的 Windows 桌面书签库和 Chrome 扩展。

**架构**　Electron 主进程持有 SQLite、扩展桥接和 Pi 会话。扩展通过经过配对的本机 WebSocket 收发书签树和用户确认的操作。React 渲染进程通过窄 IPC 调用应用服务。

**技术**　Node.js 24、pnpm workspace、Electron、React、Vite、SQLite、Pi SDK、Chrome Manifest V3。

## 实施

- [x] 在 `apps/desktop/test/library.test.mjs` 验证文件夹树导入、重复导入、重开数据库、保留本地字段和差异计算，随后实现 `apps/desktop/main/library.mjs`。
- [x] 在 `apps/chrome-extension/bookmarks.test.mjs` 验证浏览器写入、冲突和重试，随后实现 Chrome 操作和扩展后台、弹窗，并用 `apps/desktop/test/bridge.test.mjs` 验证本机配对与请求。
- [x] 在 `apps/desktop/test/agent.test.mjs` 验证 Agent 的本地命令与拒绝任意命令，随后将命令执行接入 Pi SDK。
- [x] 用预加载 IPC 接入正式界面组件，并验证空库、备注与标签持久化、选择写回和扩展连接。
- [x] 运行两个应用的检查、桌面构建、扩展浏览器验证和设计规范校验，更新 Graphify，并记录覆盖与限制。

## 验收记录

- 视觉参考通过类型检查、7 项测试、生产构建和本机预览。正式桌面端沿用文件夹树、书签列表和编辑面板的布局。
- 工作区通过类型及语法检查和 6 项测试，覆盖 SQLite 重开、重复导入、本地备注与标签、Chrome 冲突、回执合并、扩展配对和 Agent 命令。
- Windows 源码版端到端检查使用 Electron、真实 Chromium 扩展与隔离配置，覆盖导入、界面本地编辑、确认后新增、更新与删除，以及 Pi SDK 调用唯一内置工具。模型响应由本地测试端点提供。
- Windows x64 便携包生成后，通过同一套端到端检查。
- 首版绑定一个 Chrome 配置。Chrome 新增已开始但结果未知时暂停该项重试。真实模型提供方使用本机 Pi 配置。
