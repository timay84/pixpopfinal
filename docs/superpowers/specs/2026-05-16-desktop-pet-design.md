# Desktop Pet — Design Spec

## Overview

A desktop pet application using Electron + HTML Canvas. The pet appears as a floating, always-on-top character based on `端坐.png`. It responds to mouse hover, click, and long idle with different animations and poses.

## Behavior & State Machine

| State | Trigger | Visual | Exit |
|---|---|---|---|
| **IDLE** | Default / on launch | 端坐.png | — |
| **LICKING** | Mouse enters oval head zone | 吐舌.png + rotate animation (tail wag) | Mouse leaves pet area |
| **LYING DOWN** | 30s no interaction | 躺倒.png (crossfade transition) | Any mouse move over pet |
| **BOUNCING** | Click on pet | 端坐.png + 3x translateY hops + speech bubble | After 2s animation |

### Transitions diagram

```
IDLE ──(head hover)──→ LICKING ──(mouse leave)──→ IDLE
IDLE ──(30s idle)────→ LYING DOWN ──(mouse move)──→ IDLE
IDLE ──(click)───────→ BOUNCING ──(2s elapsed)────→ IDLE
```

- Idle timer resets on any mouse event within the pet area
- LYING DOWN and LICKING states are mutually exclusive

## Window Behavior

- **Frameless, transparent** BrowserWindow (Electron)
- **Size**: ~200px tall, width scaled to image aspect ratio
- **Position**: Bottom-right corner on launch
- **Always on top**: Normal windows only (not fullscreen, not taskbar)
- **Draggable**: Entire pet area via mousedown + mousemove
- **Not resizable**, skip taskbar

## Hit Zone

- Oval-shaped head zone defined by: `(x - cx)² / rx² + (y - cy)² / ry² ≤ 1`
- `cx, cy` = center of the oval (configurable % of image dimensions)
- `rx, ry` = radii (configurable % of image dimensions)
- Default: oval centered at upper portion of the image, covering ~35% of height

## Speech Bubble

- Triggered on click (BOUNCING state)
- Content: "520，我爱你"
- Style: Gradient pink (#ff6b9d → #ff8a65), white text, rounded corners
- Position: above the pet as a positioned HTML div
- Animation: fade in, auto-fade out after 2s

## Assets

| File | State | Size |
|---|---|---|
| assets/base.png (端坐.png) | IDLE, BOUNCING | 853 KB |
| assets/tongue.png (吐舌.png) | LICKING | 1.79 MB |
| assets/lie.png (躺倒.png) | LYING DOWN | 2.02 MB |

## Project Structure

```
pet2/
├── main.js              — Electron main: window creation, config
├── package.json          — Dependencies: electron, electron-builder
├── assets/
│   ├── base.png
│   ├── tongue.png
│   └── lie.png
└── renderer/
    ├── index.html        — Single page with <canvas>
    ├── app.js            — Entry: wires modules together
    ├── state-machine.js  — States, transitions, idle timer (setTimeout)
    ├── renderer.js       — Canvas draw loop (requestAnimationFrame)
    ├── interactions.js   — Mouse drag, oval hit-test, click detection
    └── bubble.js         — Speech bubble DOM element, fade in/out
```

## Component Responsibilities

### main.js
- Create frameless transparent BrowserWindow
- Set always-on-top at floating level
- Position at bottom-right of primary display
- Load renderer/index.html

### state-machine.js
- Track current state, expose `transition(newState)`
- Manage idle timer: 30s setTimeout, reset on interaction
- Emit state-change events for renderer

### renderer.js
- requestAnimationFrame loop clearing and drawing canvas
- Draw current image based on state
- Apply CSS transform offsets (translateY for bounce, rotate for wag)
- Crossfade transition on image swap

### interactions.js
- Mouse drag: mousedown → track → mousemove → IPC window.moveBy
- Oval hit-test on mousemove for head zone detection
- Click detection (click without significant drag distance)
- Notify state machine of interaction events

### bubble.js
- Create speech bubble as DOM div element
- Position above pet
- Fade-in animation, auto-remove after 2s

## IPC

Minimal IPC surface:
- Renderer → Main: `window-move` (dx, dy) for drag
- Main → Renderer: none needed

## Error Handling

- Missing images: fallback to a colored placeholder rectangle with text label
- Window off-screen: clamp position to visible display area on move

## Out of Scope

- Auto-start with Windows
- Tray icon / right-click menu
- Multiple pets
- Persistence of position between launches
- Audio
