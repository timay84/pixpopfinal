# PixPop 智能解压玩具

PixPop 是一个基于 Electron 的 Windows 桌面解压玩具应用。电脑通过 USB 连接 ESP32-S3，ESP32-S3 接收 PS2/HW504 摇杆输入，PixPop 将摇杆动作转换为桌面上的夸张动画特效。

## 当前功能

- 透明、无边框、始终置顶的桌面悬浮层
- 悬浮物件区域不再鼠标穿透，会遮挡并接收其下方区域的鼠标操作
- Windows 系统托盘图标和设置入口
- 支持三种玩具：
  - 幽灵杆
  - 萝卜刀
  - 捏捏乐
- 支持十种摇杆操作：
  - 上、下、左、右
  - 左上、左下、右上、右下
  - 摇杆单击
  - 摇杆双击
- 每种玩具拥有独立的动画特效代码
- 支持默认模式、酷炫模式和解压模式
- 用户可以为十种操作分别选择不同特效
- 配置保存到本地，下次启动自动读取
- 键盘输入后立即隐藏悬浮物件
- 连续 2 秒无键盘输入后，允许通过摇杆双击召回物件
- 首次授权串口后，启动时自动尝试重连 ESP32
- 支持透明 PNG 素材和透明素材动画
- 三种物件均支持长按八方向摇杆持续平移，斜向长按会按对应斜角移动并同时播放方向特效
- 长按摇杆按键会播放三种物件通用的压扁动效，单击和双击行为保持不变
- 顺时针旋转摇杆三圈会触发一次持续 2 秒的炫酷旋转特效

## 玩具特效

### 幽灵杆

- 漂浮和弹跳
- 星星爆散
- 幽灵冲刺
- 灵魂爆炸
- 灵魂飘落
- 惊喜闪现

### 萝卜刀

- 桌面裂缝
- 飞刀雨
- 旋转挥刀
- 刀光冲击
- 刀片爆散
- 惊喜闪现

### 捏捏乐

- 弹性爆开
- 果冻星雨
- 夸张挤压
- 彩色波纹
- 糖果喷发
- 惊喜闪现

## 快速开始

要求：

- Windows
- Node.js
- npm
- ESP32-S3 和已连接的摇杆模块

安装依赖：

```bash
npm install
```

启动应用：

```bash
npm start
```

当前版本主要用于本机开发和测试，暂不要求制作 Windows 安装程序。

## ESP32 串口协议

项目中的 `esp32code.cpp` 默认使用以下配置：

- 波特率：`115200`
- 每行一条 JSON 数据
- X 轴：GPIO1
- Y 轴：GPIO2
- SW 按键：GPIO3
- 摇杆按下时 `sw` 为 `1`

推荐数据格式：

```json
{"x":2048,"y":2048,"sw":0,"direction":"NE"}
```

程序也支持通过 X/Y 轴自动计算方向。当没有 `direction` 字段时，电脑端会按照中心值 `2048` 和死区 `330` 进行八方向判断。

首次连接时，需要在设置窗口点击“连接 ESP32”并授权串口。这是 Windows/Electron 对串口设备的安全限制。完成授权后，后续启动会自动尝试连接已经授权的设备。

## 配置说明

设置窗口可以配置：

- ESP32 波特率
- 当前使用的玩具
- 十种摇杆操作对应的动画特效
- 默认、酷炫、解压三种快速模式
- 摄像头访问权限开关

设置保存后写入 Electron 用户数据目录中的 `pixpop-config.json`。

## 项目结构

```text
├── main.js                    # Electron 主进程、托盘、窗口和 IPC
├── preload.js                 # contextBridge 安全接口
├── package.json               # Electron 和运行依赖
├── esp32code.cpp              # ESP32-S3 摇杆示例程序
├── index.html                 # 原始 ESP32 串口检验页面
├── ghost.png                  # 原始幽灵杆素材
├── ghostfinal.png             # 幽灵杆抠图来源素材
├── effect.png                 # 幽灵杆特效参考图
├── assets/
│   ├── ghost-cutout.png       # 去除背景后的幽灵杆素材
│   ├── radish-knife.png       # 透明萝卜刀素材
│   ├── squeeze-toy.png        # 透明捏捏乐素材
│   └── tray-icon.png          # 系统托盘图标
├── renderer/
│   ├── settings.html          # 设置窗口
│   ├── settings.js            # 设置、串口读取和十种操作识别
│   ├── overlay.html           # 全屏透明悬浮层
│   └── overlay.js             # 三种玩具的独立特效代码
└── scripts/
    ├── process_images.py      # 图片处理和幽灵杆抠图工具
    └── generate_toy_assets.py # 生成萝卜刀和捏捏乐素材
```

## 图片处理

项目中的幽灵杆抠图工具使用 Pillow。安装 Pillow：

```bash
python -m pip install Pillow
```

根据 `ghostfinal.png` 重新生成透明幽灵杆素材：

```bash
python scripts/process_images.py cutout-ghost --source ghostfinal.png --output assets/ghost-cutout.png
```

输出文件为带透明通道的 RGBA PNG，不包含棋盘格或矩形背景。

## 当前限制和后续工作

- 摄像头开关目前可以申请摄像头权限，但尚未接入人脸关键点识别和真正的头部跟随。
- 萝卜刀和捏捏乐目前使用第一阶段生成的透明 3D 风格 PNG，后续可以替换为更高质量的 WebP 或序列帧。
- 当前悬浮层主要使用主显示器，多显示器位置和 DPI 适配仍需完善。
- 摇杆长按移动会在当前屏幕范围内限制物件位置，摇杆回中后停止移动；当前平移速度为初始版本的 3 倍。
- 当前未制作 Windows 安装程序。

## 许可证

MIT
