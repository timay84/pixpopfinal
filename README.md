# Desktop Pet

A floating desktop companion dog built with Electron. Sits, licks, lies down, and responds to interactions — stays on top of your workspace.

## Features

- **Floating on desktop** — transparent, frameless, always-on-top
- **Idle animations** — sits quietly, periodically licks
- **Auto lie-down** — after 30s idle, lies down with a butterfly
- **Draggable** — drag anywhere on screen
- **Click bubble** — click the dog for a speech bubble
- **System tray** — right-click to quit

## Tech Stack

- Electron 28
- HTML5 Canvas
- State machine animation

## Quick Start

```bash
npm install
npm start
```

## Build

```bash
npm run build:win      # Windows: portable .exe + NSIS installer
npm run build:linux    # Linux: AppImage + deb
npm run build:mac      # macOS: DMG + zip
```

Artifacts in `dist/`. CI: `.github/workflows/build.yml`.

## Project Structure

```
├── main.js              # Electron main process (tray, window)
├── preload.js           # contextBridge for drag IPC
├── scripts/
│   ├── process_images.py  # Image processing pipeline
│   └── after-pack.js      # macOS ad-hoc code signing
├── renderer/
│   ├── index.html       # Canvas host
│   ├── app.js           # Entry point, image loading
│   ├── state-machine.js # State machine (idle/licking/lying/bouncing)
│   ├── renderer.js      # Canvas draw loop
│   ├── interactions.js  # Mouse click/drag handling
│   └── bubble.js        # Speech bubble overlay
├── assets/
│   ├── *.png            # Runtime sprites
│   ├── *-source.png     # Source images
│   └── tray-icon.png    # System tray icon
└── package.json
```

## Image Pipeline

Source images are RGB with solid backgrounds. Runtime sprites are RGBA with transparency.

```bash
# Batch convert source images
python3 scripts/process_images.py batch --source-dir assets --output-dir assets

# Remove watermarks
python3 scripts/process_images.py clean assets/*.png --in-place

# Generate tray icon
python3 scripts/process_images.py trayicon --base assets/base.png --output assets/tray-icon.png --size 64

# Convert a single image
python3 scripts/process_images.py convert assets/sit-source.png assets/base.png
```

Requirements: Python 3.12+ with Pillow (`pip install pillow`).

Pipeline steps:
1. Open source RGB image
2. Background removal: pixels where R, G, B > 240 are set to transparent
3. Watermark removal: bottom-right corner cleared
4. Save as RGBA PNG

`--bg-threshold` adjusts sensitivity (default 240, lower = more aggressive).

## Platform Notes

### WSL2
Tested with WSLg. GPU sandbox warnings are harmless.

### Windows Install Guide

**Portable (.exe)**

Download `Desktop-Pet-x.x.x.exe`, double-click to run. No installation needed.

**NSIS Installer**

Download `Desktop-Pet-Setup-x.x.x.exe`, run the installer, follow the prompts. Creates Start Menu shortcuts.

### Linux Install Guide

**AppImage (Recommended)**

1. Download `Desktop-Pet-x.x.x.AppImage`
2. Make it executable: `chmod +x Desktop-Pet-*.AppImage`
3. Double-click or run: `./Desktop-Pet-*.AppImage`

**deb (System install)**

```bash
sudo dpkg -i desktop-pet_*_amd64.deb
# or: sudo apt install ./desktop-pet_*_amd64.deb
```

Installs to system with launcher entry.

### macOS Install Guide

Built without Apple Developer signing. First launch requires manual approval.

**DMG (Recommended)**

1. Download `Desktop-Pet-x.x.x-arm64.dmg`
2. Double-click to mount the DMG
3. Drag `Desktop Pet` into the `Applications` folder
4. Open **Terminal** (search in Launchpad)
5. Run: `xattr -cr /Applications/Desktop\ Pet.app`
6. In Applications, **right-click** `Desktop Pet` → **Open**
7. Click **Open** in the dialog

After this, double-click works normally.

**ZIP (Portable)**

1. Download `Desktop-Pet-x.x.x-arm64-mac.zip`
2. Double-click to extract `Desktop Pet.app`
3. Open Terminal, type `xattr -cr` (with trailing space)
4. Drag `Desktop Pet.app` from Finder into Terminal, press Enter
5. **Right-click** `Desktop Pet.app` → **Open**
6. Click **Open** in the dialog

> If prompted "unidentified developer": **System Settings → Privacy & Security** → click "Open Anyway".

## License

MIT

---

# 桌面宠物

基于 Electron 的桌面漂浮小狗伴侣。静坐、伸舌、躺倒，响应互动，始终在你的工作区顶层。

## 功能

- **桌面悬浮** — 透明无边框，始终置顶
- **空闲动画** — 静坐，间歇伸舌
- **自动躺倒** — 30 秒无互动后躺下，蝴蝶相伴
- **可拖拽** — 拖到屏幕任意位置
- **点击气泡** — 点击小狗弹出爱心文案
- **系统托盘** — 右键退出程序

## 技术栈

- Electron 28
- HTML5 Canvas
- 状态机动画

## 快速开始

```bash
npm install
npm start
```

## 构建

```bash
npm run build:win      # Windows: 便携版 .exe + NSIS 安装程序
npm run build:linux    # Linux: AppImage + deb
npm run build:mac      # macOS: DMG + zip
```

产物在 `dist/` 目录。CI 工作流见 `.github/workflows/build.yml`。

## 项目结构

```
├── main.js              # Electron 主进程（托盘、窗口）
├── preload.js           # contextBridge 拖拽 IPC
├── scripts/
│   ├── process_images.py  # 图片处理管线
│   └── after-pack.js      # macOS 临时签名
├── renderer/
│   ├── index.html       # 画布容器
│   ├── app.js           # 入口、图片加载
│   ├── state-machine.js # 状态机（空闲/伸舌/躺倒/跳动）
│   ├── renderer.js      # Canvas 渲染循环
│   ├── interactions.js  # 鼠标点击/拖拽
│   └── bubble.js        # 气泡文案
├── assets/
│   ├── *.png            # 运行时精灵图
│   ├── *-source.png     # 源图片
│   └── tray-icon.png    # 托盘图标
└── package.json
```

## 图片管线

源图为带背景的 RGB 图片，运行时精灵图为透明背景的 RGBA 图片。

```bash
# 批量转换源图
python3 scripts/process_images.py batch --source-dir assets --output-dir assets

# 去除水印
python3 scripts/process_images.py clean assets/*.png --in-place

# 生成托盘图标
python3 scripts/process_images.py trayicon --base assets/base.png --output assets/tray-icon.png --size 64

# 单张转换
python3 scripts/process_images.py convert assets/sit-source.png assets/base.png
```

依赖：Python 3.12+ 和 Pillow（`pip install pillow`）。

处理流程：
1. 打开源 RGB 图片
2. 去背景：R、G、B 均大于 240 的像素设为透明
3. 去水印：清除右下角水印区域
4. 保存为 RGBA PNG

`--bg-threshold` 调整去背景敏感度（默认 240，数值越低越激进）。

## 平台说明

### WSL2
通过 WSLg 显示 GUI，GPU 沙箱警告无害。

### Windows 安装指南

**便携版 (.exe)**

下载 `Desktop-Pet-x.x.x.exe`，双击即运行，无需安装。

**安装版 (NSIS)**

下载 `Desktop-Pet-Setup-x.x.x.exe`，运行安装程序，按提示完成。会创建开始菜单快捷方式。

### Linux 安装指南

**AppImage（推荐，绿色版）**



**deb（系统安装）**



安装后可在启动器中找到。

### macOS 安装指南

未签名应用，首次打开需手动允许。提供两种格式。

**DMG（推荐，简单）**

1. 下载 `Desktop-Pet-x.x.x-arm64.dmg`
2. 双击打开 DMG 文件
3. 将 `Desktop Pet` 拖入 `Applications` 文件夹
4. 打开 **终端**（在启动台搜索"终端"）
5. 粘贴并回车：`xattr -cr /Applications/Desktop\ Pet.app`
6. 在 Applications 中**右键**点击 `Desktop Pet` → **打开**
7. 弹出对话框中点击 **打开**

设置一次后直接双击即可运行。

**ZIP（便携）**

1. 下载 `Desktop-Pet-x.x.x-arm64-mac.zip`
2. 双击解压得到 `Desktop Pet.app`（可放桌面或任意位置）
3. 打开终端，输入 `xattr -cr`（注意后面有空格，不要回车）
4. 将 `Desktop Pet.app` 从访达拖入终端窗口，按回车
5. **右键**点击 `Desktop Pet.app` → **打开**
6. 弹出对话框中点击 **打开**

> 如果提示"无法验证开发者"：**系统设置 → 隐私与安全性** → 点击"仍要打开"。

## 许可证

MIT
