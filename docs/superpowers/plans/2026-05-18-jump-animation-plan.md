# Jump Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BOUNCING state sine-wave bounce with 6-frame jump sprite animation played twice.

**Architecture:** Modify renderer.js to iterate through jump frames array (8 frames each, 2 loops), update app.js to load 6 new images, adjust interactions.js timeout to match 96-frame animation duration.

**Tech Stack:** HTML5 Canvas, vanilla JS

---

### Task 1: Update renderer.js — BOUNCING frame animation

**Files:**
- Modify: `renderer/renderer.js`

- [ ] **Step 1: Extend setImages to accept jump frames**

Change the `setImages` function to accept a 7th parameter `jumpFrames` (array of 6 images):

```js
function createRenderer(ctx, size) {
  let baseImg = null;
  let tongueImg1 = null;
  let tongueImg2 = null;
  let lieImg = null;
  let jumpFrames = [];
  let currentFrame = 0;
  let animStartFrame = 0;

  function setImages(base, tongue1, tongue2, lie, jumpImgs) {
    baseImg = base;
    tongueImg1 = tongue1;
    tongueImg2 = tongue2;
    lieImg = lie;
    jumpFrames = jumpImgs || [];
  }

  function draw(state) {
    ctx.clearRect(0, 0, size, size);
    currentFrame++;

    let imageToDraw = baseImg;
    let ox = 0;
    let oy = 0;

    switch (state) {
      case 'IDLE':
        imageToDraw = baseImg;
        break;

      case 'LICKING':
        const tongueFrame = Math.floor(currentFrame / 12) % 2;
        imageToDraw = tongueFrame === 0 ? tongueImg1 : tongueImg2;
        break;

      case 'LYING_DOWN':
        imageToDraw = lieImg;
        break;

      case 'BOUNCING':
        if (!animStartFrame) animStartFrame = currentFrame;
        const elapsed = currentFrame - animStartFrame;
        const framesPerImage = 8;
        const totalImages = 6;
        const playCount = 2;
        const maxFrames = framesPerImage * totalImages * playCount;
        if (elapsed < maxFrames && jumpFrames.length >= totalImages) {
          const idx = Math.min(
            Math.floor(elapsed / framesPerImage) % totalImages,
            totalImages - 1
          );
          imageToDraw = jumpFrames[idx];
        } else {
          animStartFrame = 0;
          imageToDraw = baseImg;
        }
        break;

      default:
        imageToDraw = baseImg;
    }

    if (state !== 'BOUNCING') animStartFrame = 0;

    ctx.drawImage(imageToDraw, ox, oy, size, size);
  }

  return { setImages, draw };
}
```

Key changes:
- Removed `bounceOffset`, `wagAngle` variables
- `setImages(base, tongue1, tongue2, lie, jumpImgs)` — 7th param is array
- BOUNCING case: iterate `jumpFrames[0..5]`, 8 frames each, loop twice, then fall back to baseImg
- Removed `ctx.save()/restore()` and rotation block (no longer needed)
- Removed obsolete guard clauses for LICKING/BOUNCING at end

- [ ] **Step 2: Commit**

```bash
git add renderer/renderer.js
git commit -m "feat: replace BOUNCING sine bounce with 6-frame jump animation"
```

---

### Task 2: Update app.js — load 6 jump images

**Files:**
- Modify: `renderer/app.js`

- [ ] **Step 1: Add jump image paths and update setImages call**

```js
loadImages([
  '../assets/base.png',
  '../assets/tongue.png',
  '../assets/tongue2.png',
  '../assets/lie.png',
  '../assets/1右起跳.png',
  '../assets/2右腾空.png',
  '../assets/3右回头.png',
  '../assets/4左起跳.png',
  '../assets/5左腾空.png',
  '../assets/6左回头.png'
])
  .then(images => {
    console.log('images loaded OK');
    renderer.setImages(images[0], images[1], images[2], images[3], images.slice(4));
    stateMachine.transition('IDLE');
    startLoop();
  })
```

- [ ] **Step 2: Commit**

```bash
git add renderer/app.js
git commit -m "feat: load 6 jump animation frames, pass to renderer"
```

---

### Task 3: Update interactions.js — match timeout to animation

**Files:**
- Modify: `renderer/interactions.js`

- [ ] **Step 1: Change BOUNCING timeout from 2000ms to 1600ms**

In the `mouseup` handler (around line 65), change:
```js
setTimeout(() => {
  stateMachine.transition(stateMachine.STATES.IDLE);
}, 2000);
```
to:
```js
setTimeout(() => {
  stateMachine.transition(stateMachine.STATES.IDLE);
}, 1600);
```

- [ ] **Step 2: Commit**

```bash
git add renderer/interactions.js
git commit -m "fix: match BOUNCING timeout to 96-frame jump animation (1600ms)"
```

---

### Verification

1. `npm start` — app launches
2. Click the dog — 6-frame jump animation plays twice smoothly
3. After animation ends — returns to IDLE
4. Check console — all 10 images loaded OK
5. Drag still works, hover lick still works, lie-down still works
