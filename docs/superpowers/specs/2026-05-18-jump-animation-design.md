# Jump Animation — 6-Frame Sprite Replacement for BOUNCING

## Overview

Replace the current BOUNCING state's sine-wave vertical bounce with a 6-frame jump sprite animation. Click the dog → play 6 frames twice → return to IDLE.

## Images

Already in `assets/`: `1右起跳.png`, `2右腾空.png`, `3右回头.png`, `4左起跳.png`, `5左腾空.png`, `6左回头.png`

## Animation

| Parameter | Value |
|-----------|-------|
| Frames per image | 8 (~0.13s at 60fps) |
| Images per loop | 6 |
| Play count | 2 |
| Total frames | 96 (~1.6s) |

## Files Changed

### renderer.js
- `setImages()` extended to accept 6 jump frame images
- BOUNCING case: iterate through jumpFrames array, 8 frames each, play twice then transition to IDLE
- Remove old sine-wave bounceOffset logic

### app.js
- Load 6 new jump images
- Pass them to `renderer.setImages()`

### interactions.js
- BOUNCING timeout changed from 2000ms to 1600ms (matches 96 frames)

## State Machine

No state changes. BOUNCING state kept. Interactions.js triggers BOUNCING on click, setTimeout transitions back to IDLE after animation completes.
