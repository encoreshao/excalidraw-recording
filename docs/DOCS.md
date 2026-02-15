# Excalidraw Recording Studio — 项目技术文档

## 项目概述

**Excalidraw Recording Studio** 是一个基于浏览器的白板录制工具，将 [Excalidraw](https://excalidraw.com/) 绘图功能与屏幕录制能力深度集成。用户可以在白板上绘图的同时录制语音、摄像头画面和实时字幕，最终导出为视频文件。所有处理均在浏览器本地完成，无需服务器上传。

**线上地址**：[https://video.ranbot.online](https://video.ranbot.online)

**开源协议**：MIT License

---

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | [React](https://react.dev/) | 18.x | 使用函数式组件 + Hooks 架构 |
| 开发语言 | [TypeScript](https://www.typescriptlang.org/) | 5.6+ | 全项目严格类型检查 (`strict: true`) |
| 构建工具 | [Vite](https://vite.dev/) | 6.x | 极速开发服务器与生产构建 |
| 白板引擎 | [@excalidraw/excalidraw](https://www.npmjs.com/package/@excalidraw/excalidraw) | 0.18+ | 全功能白板（绘图、文本、形状、协作） |
| CSS 框架 | [Tailwind CSS](https://tailwindcss.com/) | 3.4+ | 原子化 CSS，含自定义主题配置 |
| 认证 | [Google Identity Services](https://developers.google.com/identity) | — | 通过 `@react-oauth/google` 实现可选登录 |
| 录制 | [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) | 浏览器原生 | Canvas 合成 + 视频编码 |
| 语音转文字 | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) | 浏览器原生 | 实时语音识别字幕 |
| 状态持久化 | `localStorage` | 浏览器原生 | 设置、用户信息、UI 位置持久化 |
| 容器化 | [Docker](https://www.docker.com/) + [Nginx](https://nginx.org/) | Node 20 / Nginx stable | 多阶段构建，生产部署 |
| 字体 | Google Fonts | — | Plus Jakarta Sans、DM Sans、JetBrains Mono |
| 数据分析 | Google Analytics (gtag.js) | — | 站点访问统计 |

---

## 项目结构

```
excalidraw-recording/
├── index.html                          # HTML 入口（含 SEO meta、Open Graph、Google Analytics）
├── package.json                        # 依赖管理与脚本
├── vite.config.ts                      # Vite 构建配置
├── tsconfig.json                       # TypeScript 编译配置
├── tailwind.config.js                  # Tailwind CSS 主题扩展（颜色、字体、动画）
├── postcss.config.js                   # PostCSS 配置
├── Dockerfile                          # 多阶段 Docker 构建（Node 构建 → Nginx 部署）
├── nginx.conf                          # Nginx 配置（Gzip、静态缓存、SPA 回退）
├── .env.example                        # 环境变量模板
├── .github/workflows/main.yml          # GitHub Actions CI/CD
├── scripts/build-static.sh             # 静态构建脚本
├── assets/images/                      # 项目截图等静态资源
└── src/
    ├── main.tsx                         # 应用入口（React.StrictMode 渲染）
    ├── App.tsx                          # 根组件（Google OAuth 可选包装）
    ├── index.css                        # 全局样式（Tailwind 指令 + 自定义组件层）
    ├── vite-env.d.ts                    # Vite 环境类型声明
    ├── components/
    │   ├── BoardPage.tsx                # 主页面 — Excalidraw 画布 + 所有叠加层
    │   ├── AreaSelector.tsx             # 录制区域选择器（含宽高比预设）
    │   ├── CameraPreview.tsx            # 可拖拽圆形摄像头预览气泡
    │   ├── CaptionOverlay.tsx           # 可拖拽实时字幕叠加层
    │   ├── RecordingControls.tsx        # 可拖拽底部录制工具栏
    │   ├── SettingsDialog.tsx           # 设置弹窗
    │   └── ExportDialog.tsx             # 录制完成后的视频预览与下载弹窗
    ├── contexts/
    │   └── AuthContext.tsx              # Google OAuth 认证上下文
    ├── hooks/
    │   ├── useMediaDevices.ts           # 摄像头与麦克风设备管理
    │   ├── useRecorder.ts              # Canvas 合成、MediaRecorder、帧循环
    │   ├── useSettings.ts              # 应用设置管理（localStorage 持久化）
    │   └── useSpeechToText.ts          # Web Speech API 语音转文字
    └── types/
        └── index.ts                     # 共享 TypeScript 类型定义
```

---

## 主要功能

### 1. 全功能 Excalidraw 白板

- 完整集成 Excalidraw 绘图引擎，支持所有绘图工具、形状、文本、图片嵌入
- 自定义主菜单，包含加载/保存场景、导出图片、搜索、帮助等功能
- 支持更改画布背景色
- 使用 `React.lazy` 懒加载 Excalidraw 组件，优化首屏加载速度
- 无需登录即可使用全部绘图功能

### 2. 录制区域选择

- **宽高比预设**：一键选择常用比例
  - YouTube (16:9)
  - TikTok (9:16)
  - 小红书 RedNote (3:4)
  - 正方形 Square (1:1)
  - 经典 Classic (4:3)
- **自定义区域**：鼠标拖拽绘制任意录制区域
- 选定区域在画布上以绿色边框标示，录制时切换为红色闪烁边框

### 3. 视频录制与合成

- 基于浏览器原生 `MediaRecorder API`，所有处理在客户端完成
- **Canvas 合成引擎**：将 Excalidraw 画布层、摄像头画面、字幕、鼠标光标特效合成到离屏 Canvas
- 支持录制暂停/恢复
- 录制时长实时计时显示
- **视频格式**：优先 MP4 (H.264 + AAC)，降级 WebM (VP9/VP8 + Opus)
- **可配置参数**：
  - 录制帧率：15 / 24 / 30 / 60 FPS
  - 视频码率：1–10 Mbps
  - 画布内边距
- 自动确保输出尺寸为偶数（编解码器兼容性要求）
- 最大输出分辨率限制为 1920px

### 4. 摄像头叠加

- 圆形摄像头预览气泡，可在页面上自由拖拽
- 录制时自动合成到视频右下角
- 支持三种气泡尺寸：小 / 中 / 大
- 带绿色边框和阴影的精致视觉效果
- 智能裁剪视频画面为正方形（居中裁剪）

### 5. 麦克风录音

- 音频与画面同步录制
- 配置参数：回声消除、噪声抑制、48kHz 采样率
- 与视频轨道合并为统一的 `MediaStream`

### 6. 实时语音转文字字幕

- 使用浏览器原生 `SpeechRecognition API`（Chrome/Edge 支持）
- 实时显示中间识别结果（interim results）
- 句子结束后自动清除字幕（可配置延迟时间）
- 字幕以可拖拽叠加层形式显示在画布上
- 录制时自动合成到视频中
- **字幕样式可配置**：
  - 背景颜色
  - 文字颜色
  - 圆角半径
  - 字体大小（小 / 中 / 大）

### 7. 鼠标光标特效

- **高亮模式 (Highlight)**：鼠标位置显示半透明彩色圆圈
- **聚光灯模式 (Spotlight)**：以鼠标位置为中心的径向渐变暗角效果
- 光标颜色可自定义
- 特效仅在录制输出中可见

### 8. 视频导出

- 录制结束后弹出视频预览对话框
- 支持内嵌播放器预览
- 显示视频格式、时长、文件大小等元信息
- 支持自定义文件名
- 一键下载为 MP4 或 WebM 文件
- 支持"重新录制"快捷操作

### 9. 可拖拽录制工具栏

- 底部浮动工具栏，集成所有录制控制按钮
- 工具栏位置可自由拖拽，位置通过 `localStorage` 持久化
- 录制状态下自动折叠，仅显示计时器、暂停和停止按钮
- 带有 Tooltip 提示的图标按钮

### 10. 设置面板

- 弹窗式设置界面，分组管理所有可配置项：
  - **字幕设置**：背景色、文字色、圆角、字体大小、自动清除延迟
  - **摄像头设置**：是否显示在录制中、气泡大小
  - **录制设置**：画布内边距、帧率、码率
  - **光标设置**：特效类型、光标颜色
- 支持一键重置为默认值
- 所有设置自动保存到 `localStorage`

### 11. Google 登录（可选）

- 通过 `@react-oauth/google` 实现轻量级 Google 登录
- 仅需配置 `VITE_GOOGLE_CLIENT_ID` 环境变量
- 登录后在 Excalidraw 右上角显示用户头像和名称
- **完全可选**：未配置时应用正常运行，登录按钮显示禁用状态并提示
- 用户信息持久化到 `localStorage`

---

## 架构设计

### 组件层次

```
App
└── AuthProvider (Google OAuth 上下文，可选)
    └── BoardPage (主页面)
        ├── Excalidraw (白板引擎，懒加载)
        ├── AreaSelector (区域选择叠加层)
        ├── CameraPreview (摄像头预览气泡)
        ├── CaptionOverlay (字幕叠加层)
        ├── RecordingControls (录制工具栏)
        ├── SettingsDialog (设置弹窗)
        └── ExportDialog (导出弹窗)
```

### Hooks 架构

| Hook | 职责 |
|------|------|
| `useMediaDevices` | 管理摄像头和麦克风的请求、开启、关闭 |
| `useRecorder` | 核心录制逻辑 — Canvas 合成、MediaRecorder 管理、帧循环 |
| `useSettings` | 应用设置的加载、更新、持久化 |
| `useSpeechToText` | 语音识别的启动、停止、文本管理、自动清除 |

### 关键设计决策

1. **纯客户端架构**：所有录制、合成、编码均在浏览器端完成，视频文件不离开用户设备
2. **无 Firebase 依赖**：使用轻量级 `@react-oauth/google` 替代完整的 Firebase 项目，降低复杂度
3. **Ref 驱动的实时数据**：字幕文本、设置、鼠标位置通过 `useRef` 传递给录制帧循环，避免频繁 re-render
4. **优雅降级**：Google 登录可选，Speech API 不支持时字幕功能自动禁用
5. **Canvas 离屏合成**：在隐藏的 Canvas 上逐帧合成所有图层，再通过 `captureStream` 输出到 MediaRecorder

---

## 浏览器兼容性

| 浏览器 | 录制功能 | 语音转文字 | 整体支持 |
|--------|---------|-----------|---------|
| Chrome | 完整支持 | 完整支持 | 全功能 |
| Edge | 完整支持 | 完整支持 | 全功能 |
| Firefox | 支持 | 不支持 | 部分功能 |
| Safari | 有限支持 | 不支持 | 有限功能 |
| Arc | 有限支持 | 不支持 | 有限功能 |

---

## 开发与部署

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

### Docker 部署

```bash
# 构建镜像
docker build -t excalidraw-recording .

# 运行容器（http://localhost:8080）
docker run -p 8080:80 excalidraw-recording
```

### 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `VITE_GOOGLE_CLIENT_ID` | 否 | Google OAuth Client ID，用于启用 Google 登录功能 |

---

## 作者

**Encore Shao**

- [GitHub](https://github.com/encoreshao)
- [LinkedIn](https://www.linkedin.com/in/encoreshao)
- [X / Twitter](https://x.com/encoreshao)
