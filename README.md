# OneArk

本地优先的个人资产工作台。当前是可启动、可检查、可打包的桌面开发脚手架。

## 技术选择

使用 **Electron + electron-vite + React + TypeScript**，通过 **napi-rs** 接入 Rust 原生模块。

electron-vite 统一管理主进程、预加载脚本和界面的开发与构建，避免自行维护多套 Vite 配置与启动顺序。Electron 保持两个平台的 Chromium 渲染环境一致。Rust 仅用于需要的本机能力，不重复实现已有的普通文件操作。

## 环境要求

| 工具         | 要求                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| Node.js      | 24.x，版本入口见 `.node-version`                                         |
| npm          | 11 或以上；使用 `package-lock.json` 固定依赖                             |
| Rust         | 通过 rustup 安装，版本与组件由 `rust-toolchain.toml` 管理                |
| macOS 开发   | Xcode Command Line Tools，Apple Silicon                                  |
| Windows 开发 | Visual Studio Build Tools 的“使用 C++ 的桌面开发”组件及 Windows SDK，x64 |

应用目标系统为 Windows 11 x64、macOS 14.2 及以上的 Apple Silicon。

Rust 安装说明：<https://rustup.rs/>。构建脚本会查找 `PATH` 和默认的 `~/.cargo/bin`，无需修改系统配置即可识别通过 rustup 安装的 Cargo。

## 开始开发

```bash
npm ci
npm run dev
```

第一次安装会下载 Electron；第一次构建会下载 Rust 工具链与依赖，需要联网。当前运行页面不依赖外部网络。

`dev` 先构建 Rust 模块，再启动 Electron 和 Vite。React 修改会热更新；主进程和预加载脚本由 electron-vite 重新构建。修改 Rust 后，停止并重新运行 `npm run dev`。

窗口菜单中可打开开发者工具。首页应显示“Rust 本机连接正常”，正文为单栏所见即所得编辑，支持工具栏、快捷键和 Markdown 导出。

## 常用命令

| 命令                     | 用途                                                |
| ------------------------ | --------------------------------------------------- |
| `npm run dev`            | 构建原生模块并启动开发环境                          |
| `npm run build`          | 构建 Rust、检查 TypeScript、构建应用                |
| `npm start`              | 启动已经构建的应用，需要先运行 `build`              |
| `npm run check`          | 检查代码、格式、原生模块、真实 Electron 窗口和 Rust |
| `npm run typecheck`      | 检查主进程、预加载脚本和界面类型                    |
| `npm run native:build`   | 构建当前系统和架构的 Rust 模块                      |
| `npm run native:check`   | Rust 格式检查和 Clippy 检查                         |
| `npm run format`         | 格式化本脚手架代码和 README，不改已有产品文档       |
| `npm run package:dir`    | 生成当前平台可运行的应用目录                        |
| `npm run package:mac`    | 在 Apple Silicon macOS 生成 ARM64 DMG 和 ZIP        |
| `npm run package:win`    | 在 Windows x64 生成 NSIS 安装程序                   |
| `npm run smoke:packaged` | 打开打包后的应用并验证原生调用和编辑预览            |

构建结果在 `out/`，发布产物在 `dist/`，检查截图在 `test-results/`；这些目录均不进入版本控制。

## 目录与边界

```text
src/
├── main/              Electron 生命周期、IPC 校验和原生模块加载
├── preload/           只暴露明确列出的 window.oneark 方法
├── renderer/          React 界面、Tiptap 所见即所得编辑与 Markdown 导出
└── shared/            主进程与界面共享的通信类型
native/                napi-rs 模块、Cargo 配置和锁文件
scripts/               构建脚本与真实 Electron 检查
tests/                 原生模块检查
build/                 macOS 权限配置
.github/workflows/     Windows / macOS 检查及打包
docs/design/           原有产品设计文档，原样保留
```

- 界面启用上下文隔离和沙箱，关闭 Node.js 集成，不暴露通用 IPC、文件接口或原生模块加载器。
- 主进程检查 IPC 的窗口和顶层框架来源，拒绝其他来源复用本机接口。
- Rust 模块在开发时从 `native/` 加载，发布时作为独立资源复制到应用中，不交给 Vite 打包，也不放入 ASAR。
- 原生模块使用 Node-API 8；仍需分别构建 Windows x64 与 macOS ARM64 二进制。
- 外部导航、弹窗和媒体权限默认拒绝；后续功能按来源和用途开放。
- 当前编辑器使用 Tiptap 与 Markdown 扩展，支持标题、常用文字格式、列表、任务列表、引用、代码块和表格；不加载远程图片，点击链接不会导航。外部 HTML/SVG 预览将使用独立容器。

## 本轮实现范围

已接通 Electron → 预加载脚本 → 类型化 IPC → Rust → 界面的真实调用链路，提供单栏所见即所得笔记、Markdown 导出和内联 SVG。配色参考用户提供的豆包截图，使用白色主区、浅灰背景、黑色文字和淡蓝色焦点边框。自动化检查实际打开 Electron 窗口，验证隔离配置、原生调用、格式操作、撤销重做，以及导出结果中的标题、任务状态和表格。

示例编辑内容只存在内存中，不会自动保存；可点击“导出 Markdown”通过系统保存对话框导出 `.md` 文件。当前没有文件工作区、原文件保存、目录监听、文件冲突处理、外部 HTML/SVG 预览、录音、托盘后台任务、模型下载或 ASR。不会用模拟状态表示这些功能已完成。

后续按已确认需求接入：

1. 工作目录、文件树、Markdown 原文件保存和外部修改冲突提示。
2. 隔离的外部 HTML/SVG 预览，可运行脚本，默认限制联网，不暴露本机命令。
3. 麦克风与系统声音录制、持续写入磁盘、托盘运行及明确退出提示。
4. 独立 ASR 进程、分段读取和转写、逐段保存结果，限制缓冲区与任务并发。

所见即所得编辑使用文档结构重新生成 Markdown，不保证保留原始空行、缩进或未支持的语法。后续接入真实文件前，需要明确支持的语法范围并验证往返转换，避免静默覆盖特殊内容。

长音频推理不直接加载到 Electron 主进程。napi-rs 是本机模块调用方式，不提供进程故障隔离。

## 打包与验证

在目标平台构建目标平台的 Rust 模块和应用。不要将 macOS `.node` 文件混入 Windows 安装包，或反向使用。修改目标架构后需重新构建原生模块。

```bash
# Apple Silicon macOS：不自动寻找本机发布证书，生成本地验证包。
CSC_IDENTITY_AUTO_DISCOVERY=false npm run package:mac
npm run smoke:packaged
```

Windows 在 PowerShell 中执行：

```powershell
$env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
npm run package:win
npm run smoke:packaged
```

CI 分别在 Windows 和 macOS 执行检查与打包，并启动打包后的应用。CI 产物用于验证，不代表已经正式签名、公证或发布。正式分发需要配置开发者证书、签名和 Apple 公证凭据；不得将凭据提交到仓库。

macOS 已配置麦克风和系统声音用途声明，但尚未申请权限或采集声音；权限与真实采集必须在后续录音实现中使用安装包验证。

## 本次本机验证

在 Apple Silicon macOS 上，使用 Node.js 24.16.0、Rust 1.99.1、Electron 44.9.3 完成：

- 从锁文件执行 `npm ci` 安装依赖。
- `npm run check`：代码、格式、TypeScript、Rust、原生模块和真实 Electron 窗口检查通过。
- `npm run dev`：开发服务器和桌面窗口启动成功。
- `npm run package:mac`：生成 ARM64 DMG 和 ZIP。
- `npm run smoke:packaged`：打包后的应用成功加载 Rust 模块，单栏编辑、Markdown 导出及隔离配置检查通过。

生成的 DMG 和 ZIP 各约 123 MB，采用默认 Electron 应用图标，未正式签名或公证。Windows 仅完成构建流程配置，尚未在 Windows 环境实际执行。以上不代表录音、原文件保存或 ASR 已实现。

## 现有文件

搭建前已有 `docs/design/`、`main.py` 和 `.idea/`，本次未修改它们。早期产品文档中的技术设想不代表当前可运行脚手架的实现；当前技术入口以本 README、构建配置和代码为准。

## 工具文档

- [electron-vite](https://electron-vite.org/guide/)
- [napi-rs](https://napi.rs/docs/introduction/getting-started)
- [Electron 安全边界](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-builder](https://www.electron.build/v26/)
