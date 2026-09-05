# Desktop Pet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Electron desktop pet that floats on screen, responds to hover/click/drag, and animates through 4 states (idle, licking, lying down, bouncing).

**Architecture:** Electron main process creates a frameless transparent window. The renderer uses a Canvas + state machine pattern — interactions.js detects mouse events and drives state-machine.js, which tells renderer.js what to draw each frame. A preload script bridges IPC for window dragging.

**Tech Stack:** Electron (latest stable), vanilla JavaScript, HTML5 Canvas, CSS animations for the bubble.

---

### Task 1: Project scaffold and window

**Files:**
- Create: `package.json`
- Create: `main.js`
- Create: `preload.js`
- Create: `assets/.gitkeep`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "desktop-pet",
  "version": "1.0.0",
  "description": "Desktop pet — floating dog companion",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --win portable"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2 && npm install
```

Expected: Installs electron and electron-builder. Ignore peer dependency warnings if any.

- [ ] **Step 3: Write main.js**

```js
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winSize = 200; // ~200px tall, square image

  mainWindow = new BrowserWindow({
    width: winSize,
    height: winSize,
    x: screenWidth - winSize - 40,
    y: screenHeight - winSize - 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.on('move-window', (_event, dx, dy) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const newX = Math.max(0, Math.min(screenWidth - 200, x + dx));
  const newY = Math.max(0, Math.min(screenHeight - 200, y + dy));
  mainWindow.setPosition(newX, newY);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 4: Write preload.js**

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', dx, dy)
});
```

- [ ] **Step 5: Copy asset images**

```bash
cp /mnt/c/Users/Aofen/Desktop/Pet2/端坐.png /mnt/c/Users/Aofen/Desktop/Pet2/assets/base.png
cp /mnt/c/Users/Aofen/Desktop/Pet2/吐舌.png /mnt/c/Users/Aofen/Desktop/Pet2/assets/tongue.png
cp /mnt/c/Users/Aofen/Desktop/Pet2/躺倒.png /mnt/c/Users/Aofen/Desktop/Pet2/assets/lie.png
```

- [ ] **Step 6: Verify window launches**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2 && npx electron . &
sleep 3 && kill %1 2>/dev/null; true
```

Expected: No crash. A transparent square window appears briefly at bottom-right then closes.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json main.js preload.js assets/
git commit -m "feat: scaffold Electron window with transparent frameless config"
```

---

### Task 2: HTML page and canvas setup

**Files:**
- Create: `renderer/index.html`
- Create: `renderer/app.js`

- [ ] **Step 1: Write renderer/index.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    canvas { display: block; width: 100%; height: 100%; }
    #bubble-container {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%; pointer-events: none;
    }
  </style>
</head>
<body>
  <canvas id="pet-canvas"></canvas>
  <div id="bubble-container"></div>
  <script src="state-machine.js"></script>
  <script src="bubble.js"></script>
  <script src="renderer.js"></script>
  <script src="interactions.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write renderer/app.js (entry point)**

```js
(function () {
  const canvas = document.getElementById('pet-canvas');
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const size = 200;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const stateMachine = createStateMachine();
  const renderer = createRenderer(ctx, size);
  const bubble = createBubble(document.getElementById('bubble-container'));

  createInteractions(canvas, stateMachine, renderer, bubble);

  loadImages(['assets/base.png', 'assets/tongue.png', 'assets/lie.png'])
    .then(images => {
      renderer.setImages(images[0], images[1], images[2]);
      stateMachine.transition('IDLE');
      startLoop();
    });

  function startLoop() {
    function loop() {
      renderer.draw(stateMachine.getState());
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function loadImages(paths) {
    return Promise.all(paths.map(p => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Fallback: create a colored placeholder
          const c = document.createElement('canvas');
          c.width = 200; c.height = 200;
          const cx = c.getContext('2d');
          cx.fillStyle = '#f4c542';
          cx.fillRect(0, 0, 200, 200);
          cx.fillStyle = '#333';
          cx.font = '14px sans-serif';
          cx.fillText(p, 10, 100);
          resolve(c);
        };
        img.src = p;
      });
    }));
  }
})();
```

- [ ] **Step 3: Commit**

```bash
git add renderer/index.html renderer/app.js
git commit -m "feat: add HTML canvas page and app entry point"
```

---

### Task 3: State machine

**Files:**
- Create: `renderer/state-machine.js`

- [ ] **Step 1: Write renderer/state-machine.js**

```js
function createStateMachine() {
  const STATES = { IDLE: 'IDLE', LICKING: 'LICKING', LYING_DOWN: 'LYING_DOWN', BOUNCING: 'BOUNCING' };
  let currentState = 'IDLE';
  let idleTimer = null;
  let onChange = null;

  function transition(newState) {
    if (newState === currentState) return;

    // Guard: LICKING not allowed during LYING_DOWN
    if (currentState === STATES.LYING_DOWN && newState === STATES.LICKING) return;
    // Guard: BOUNCING blocks everything until it completes
    if (currentState === STATES.BOUNCING && newState !== STATES.IDLE) return;

    currentState = newState;
    resetIdleTimer();

    if (onChange) onChange(currentState);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (currentState === STATES.IDLE) {
      idleTimer = setTimeout(() => {
        transition(STATES.LYING_DOWN);
      }, 30000);
    }
  }

  function getState() {
    return currentState;
  }

  function onStateChange(cb) {
    onChange = cb;
  }

  function isIdle() {
    return currentState === STATES.IDLE;
  }

  function isLyingDown() {
    return currentState === STATES.LYING_DOWN;
  }

  return { transition, getState, onStateChange, isIdle, isLyingDown, STATES };
}
```

- [ ] **Step 2: Commit**

```bash
git add renderer/state-machine.js
git commit -m "feat: add state machine with 4 states and idle timer"
```

---

### Task 4: Canvas renderer

**Files:**
- Create: `renderer/renderer.js`

- [ ] **Step 1: Write renderer/renderer.js**

```js
function createRenderer(ctx, size) {
  let baseImg = null;
  let tongueImg = null;
  let lieImg = null;
  let currentFrame = 0;
  let bounceOffset = 0;
  let wagAngle = 0;
  let animStartFrame = 0;

  function setImages(base, tongue, lie) {
    baseImg = base;
    tongueImg = tongue;
    lieImg = lie;
  }

  function draw(state) {
    ctx.clearRect(0, 0, size, size);
    currentFrame++;

    let imageToDraw = baseImg;
    let ox = 0;
    let oy = 0;
    let rotation = 0;

    switch (state) {
      case 'IDLE':
        imageToDraw = baseImg;
        break;

      case 'LICKING':
        imageToDraw = tongueImg;
        wagAngle = Math.sin(currentFrame * 0.15) * 5;
        rotation = wagAngle;
        break;

      case 'LYING_DOWN':
        imageToDraw = lieImg;
        if (!animStartFrame) animStartFrame = currentFrame;
        break;

      case 'BOUNCING':
        if (!animStartFrame) animStartFrame = currentFrame;
        const elapsed = currentFrame - animStartFrame;
        const totalFrames = 120; // ~2s at 60fps
        const bounceCount = 3;
        const progress = Math.min(elapsed / totalFrames, 1);
        bounceOffset = Math.sin(progress * bounceCount * Math.PI * 2) * 12 * (1 - progress);
        if (progress >= 1) {
          bounceOffset = 0;
          animStartFrame = 0;
        }
        imageToDraw = baseImg;
        oy = bounceOffset;
        break;

      default:
        imageToDraw = baseImg;
    }

    if (state !== 'BOUNCING') animStartFrame = 0;
    if (state !== 'LICKING') wagAngle = 0;

    ctx.save();
    if (rotation !== 0) {
      ctx.translate(size / 2 + ox, size / 2 + oy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(imageToDraw, -size / 2, -size / 2, size, size);
    } else {
      ctx.drawImage(imageToDraw, ox, oy, size, size);
    }
    ctx.restore();
  }

  return { setImages, draw };
}
```

- [ ] **Step 2: Commit**

```bash
git add renderer/renderer.js
git commit -m "feat: add canvas renderer with bounce and wag animations"
```

---

### Task 5: Mouse interactions (drag, hover, click)

**Files:**
- Create: `renderer/interactions.js`

- [ ] **Step 1: Write renderer/interactions.js**

```js
function createInteractions(canvas, stateMachine, renderer, bubble) {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let mouseMoved = false;

  // Head oval zone (percentages of 200px image)
  const headZone = { cx: 100, cy: 60, rx: 70, ry: 50 };

  function isInHeadZone(mx, my) {
    const dx = (mx - headZone.cx) / headZone.rx;
    const dy = (my - headZone.cy) / headZone.ry;
    return dx * dx + dy * dy <= 1;
  }

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    mouseMoved = false;
    dragStartX = e.screenX;
    dragStartY = e.screenY;

    if (stateMachine.isLyingDown()) {
      stateMachine.transition(stateMachine.STATES.IDLE);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.screenX - dragStartX;
      const dy = e.screenY - dragStartY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        mouseMoved = true;
      }
      if (window.electronAPI) {
        window.electronAPI.moveWindow(e.movementX, e.movementY);
      }
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      return;
    }

    // Hover detection — get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height) {
      if (stateMachine.isLyingDown()) {
        stateMachine.transition(stateMachine.STATES.IDLE);
      } else if (isInHeadZone(mx, my) && stateMachine.isIdle()) {
        stateMachine.transition(stateMachine.STATES.LICKING);
      } else if (!isInHeadZone(mx, my) && stateMachine.getState() === stateMachine.STATES.LICKING) {
        stateMachine.transition(stateMachine.STATES.IDLE);
      }
    } else if (stateMachine.getState() === stateMachine.STATES.LICKING) {
      stateMachine.transition(stateMachine.STATES.IDLE);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (!mouseMoved && isDragging) {
      stateMachine.transition(stateMachine.STATES.BOUNCING);
      if (!bubble.isShowing()) {
        bubble.show();
        setTimeout(() => {
          stateMachine.transition(stateMachine.STATES.IDLE);
        }, 2000);
      }
    }
    isDragging = false;
    mouseMoved = false;
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add renderer/interactions.js
git commit -m "feat: add mouse drag, oval head hover, and click interactions"
```

---

### Task 6: Speech bubble

**Files:**
- Create: `renderer/bubble.js`

- [ ] **Step 1: Write renderer/bubble.js**

```js
function createBubble(container) {
  let showing = false;
  let el = null;

  function show() {
    if (showing) return;
    showing = true;

    el = document.createElement('div');
    el.textContent = '520，我爱你';
    el.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ff6b9d, #ff8a65);
      color: #fff;
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(255,107,157,0.4);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;

    // Tail triangle
    const tail = document.createElement('div');
    tail.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid #ff8a65;
    `;
    el.appendChild(tail);

    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
    });

    // Auto-hide after 2s
    setTimeout(() => hide(), 2000);
  }

  function hide() {
    if (!showing || !el) return;
    el.style.opacity = '0';
    el.addEventListener('transitionend', () => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      el = null;
      showing = false;
    }, { once: true });
  }

  function isShowing() {
    return showing;
  }

  return { show, hide, isShowing };
}
```

- [ ] **Step 2: Commit**

```bash
git add renderer/bubble.js
git commit -m "feat: add speech bubble with gradient style and auto-hide"
```

---

### Task 7: Integration and smoke test

- [ ] **Step 1: Initialize git repo (if not already)**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2 && git init
```

- [ ] **Step 2: Create .gitignore**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.superpowers/
GITIGNORE
```

- [ ] **Step 3: Stage and commit .gitignore**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2 && git add .gitignore && git commit -m "chore: add .gitignore"
```

- [ ] **Step 4: Launch the app for manual verification**

```bash
cd /mnt/c/Users/Aofen/Desktop/Pet2 && npx electron . &
```

Manual checks:
1. Pet appears at bottom-right corner, ~200px, always on top
2. Drag the pet around — it follows the cursor
3. Hover over the head area — switches to 吐舌.png with a slight wag
4. Wait 30 seconds — pet switches to 躺倒.png (lying down)
5. Click the pet — speech bubble "520，我爱你" appears, pet does 3 subtle hops
6. Speech bubble fades after ~2 seconds
7. Move mouse over a lying-down pet — it stands back up

- [ ] **Step 5: Kill the app after testing**

```bash
pkill -f "electron ." 2>/dev/null; true
```

- [ ] **Step 6: Commit final state**

```bash
git status
git commit -m "feat: complete desktop pet integration"
```
