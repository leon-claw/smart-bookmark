# Smart Bookmark 首版

个人用户在 Windows 管理 Chrome 书签。Chrome 扩展读取书签树，桌面端用 SQLite 保存本地书签、文件夹、备注、标签与扩展字段。桌面界面可查找、新建、编辑、删除书签。用户可预览并选择要写回 Chrome 的增删改。Pi Agent 使用内置工具完成本地书签增删查改。首版服务于当前电脑上的一个配对 Chrome 配置。

## 技术选择

Electron 复用原型中的 React 界面组件，并让桌面进程持有 SQLite 和 Pi 会话。Tauri 体积更小，但这版仍需额外打包 Node 运行时来运行 Pi。采用 pnpm workspace 管理桌面和 Chrome 扩展两个应用，视觉参考单独预览。

浏览器通信采用带配对码的本机 WebSocket。Chrome Native Messaging 可由安装程序注册主机并限制扩展来源，但要求分发并注册额外的本机可执行入口。本机连接由桌面启动和关闭，Chrome 扩展以 Manifest V3 的 service worker 保持会话。桌面只接受配对的扩展配置。

SQLite 为本地事实来源，按 Chrome ID 保存导入基线和本地版本。反复导入保留备注、标签、扩展字段和待写回修改。写回只提交 Chrome 可表示的字段；检测浏览器端变更并逐条报告。Pi 使用内置 bash 工具的可配置执行后端，接收本地 bookmark 命令并调用同一套验证与持久化逻辑。Agent 按需启动，可使用 Pi 已配置的模型提供方，使用远程模型时书签结果可能进入模型上下文。
