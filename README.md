# Smart Bookmark

Windows 本地 Chrome 书签管理器。桌面端用 SQLite 保存书签、文件夹、备注、标签和扩展字段。Chrome 扩展按需导入书签树。桌面和 Pi Agent 的改动默认保存在本地，在桌面端勾选并确认后才写回 Chrome。

## 启动

Windows x64 可运行 `apps/desktop/release/Smart Bookmark 0.1.0.exe`。从源码开发时使用 Node.js 24.14 或更新的版本，以及项目指定的 pnpm。

```powershell
pnpm install
pnpm dev
```

桌面构建使用 `pnpm build`。生成 Windows 便携版使用 `pnpm package:win`。

## 连接 Chrome

1. 启动桌面端。在 Chrome 116 或更新的版本打开 `chrome://extensions`，启用开发者模式，选择「加载已解压的扩展程序」，打开 `apps/chrome-extension`。
2. 在桌面端点击工具栏的拼图图标，复制配对码。在 Chrome 的 Smart Bookmark 扩展弹窗中输入配对码。
3. 在桌面端点击「从 Chrome 导入」。桌面书签库与首次导入的 Chrome 配置关联。重复导入会保留本地备注、标签、扩展字段和待写回修改。
4. 「写回 Chrome」会列出可以应用到浏览器的新增、编辑、移动或删除。删除项需勾选。位于「本地书签」的新书签写入 Chrome 书签栏。遇到 Chrome 侧冲突时，应用会保留本地修改并报告出错的项目。如果 Chrome 在新增操作完成前异常退出且结果无法确认，该条写回会暂停，避免自动重复新增。

SQLite 文件在桌面应用的用户数据目录 `%APPDATA%\Smart Bookmark\bookmarks.sqlite`。Chrome 扩展通过配对后的本机连接与应用通信。

## Pi Agent

在 Pi CLI 中使用 `/login` 配置模型提供方，用 `/model` 选择模型并保存默认设置。桌面应用读取同一份 Pi 配置，亦支持在 Pi 的 `models.json` 中设置兼容的本地模型。修改配置后可重启应用。

打开「Pi Agent」即可通过自然语言查找、新增、修改或删除本地书签。Agent 使用 Pi 内置 `bash` 工具。应用将其执行后端限定为四种书签命令，所有变更沿用桌面端的 SQLite 数据服务。远程模型会收到用户输入及本次任务所需的书签工具结果。

## 验证与设计参考

```powershell
pnpm check
pnpm test
pnpm build
```

`pnpm test` 包含对 127.0.0.1 的连接测试。Windows 端到端检查使用独立的桌面和 Chromium 测试配置及本地模拟模型端点。

```powershell
$env:SMART_BOOKMARK_TEST_CHROME = 'C:\path\to\chrome.exe'
node apps/desktop/test/windows-smoke.mjs
```

使用支持加载未打包扩展的 Chromium 或 Chrome for Testing。设置 `SMART_BOOKMARK_TEST_APP` 可改为验证打包后的应用。

视觉参考在 `design-reference/web/smart-bookmark`，其交互使用模拟数据。设计规范见 `DESIGN.md`，项目结构见 `graphify-out/GRAPH_REPORT.md`。Graphify 生成项目代码结构索引。
