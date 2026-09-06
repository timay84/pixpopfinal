import { createGhostScene } from './lib/ghost-scene';
import { createInputController, type InputSample } from './lib/input-controller';
import { newMotion, type Mode, type Motion } from './lib/motion';
import './overlay.css';

declare global {
  interface Window {
    pixpop: {
      loadConfig: () => Promise<unknown>;
      onJoystickEvent: (callback: (event: OverlayEvent) => void) => void;
      onKeyboardActivity: (callback: () => void) => void;
      onOverlayHide: (callback: () => void) => void;
      onOverlayShow: (callback: () => void) => void;
      setOverlayMouseEvents: (interactive: boolean) => void;
    };
  }
}

type OverlaySample = InputSample & { pressed?: boolean };
type OverlayEvent = { kind: 'sample' | 'action'; value: OverlaySample | string };

const root = document.getElementById('overlay-root');
if (!root) throw new Error('BooFloat overlay root is missing');

const stage = document.createElement('div');
stage.id = 'boo-stage';
root.append(stage);

const motion: { current: Motion } = { current: newMotion('idle') };
const lighting = { current: 'light' as const };
const driver = createInputController(motion);
let hidden = false;
let inputActive = false;
let lastTick = performance.now();
let cleanupScene: (() => void) | undefined;
let dragging = false;
let dragMoved = false;
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };

function setVisible(visible: boolean) {
  hidden = !visible;
  stage.style.visibility = visible ? 'visible' : 'hidden';
  if (!visible) {
    driver.reset();
    inputActive = false;
  }
}

function play(mode: Mode) {
  motion.current = newMotion(mode);
  inputActive = false;
}

function handleInput(event: OverlayEvent) {
  if (event.kind === 'sample' && typeof event.value !== 'string') {
    if (hidden) return;
    const sample = event.value;
    driver.set({ x: sample.x, y: sample.y, pressure: sample.pressure }, performance.now());
    inputActive = true;
    return;
  }

  if (event.kind === 'action' && typeof event.value === 'string') {
    if (event.value === 'DOUBLE') {
      setVisible(true);
      play('reform');
    } else if (!hidden && event.value === 'SINGLE') {
      play('sparkle');
    } else if (!hidden && event.value === 'LONG') {
      play('pulse');
    }
  }
}

function tick(now: number) {
  const elapsed = now - lastTick;
  lastTick = now;
  if (!hidden && inputActive) driver.tick(now);
  if (inputActive && elapsed > 500) driver.reset();
  requestAnimationFrame(tick);
}

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || hidden) return;
  dragging = true;
  dragMoved = false;
  dragStart = { x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
  window.pixpop.setOverlayMouseEvents(true);
  event.preventDefault();
});

stage.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  dragOffset.x += event.clientX - dragStart.x;
  dragOffset.y += event.clientY - dragStart.y;
  dragMoved = true;
  dragStart = { x: event.clientX, y: event.clientY };
  stage.style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
});

function stopDragging(event?: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  if (event) stage.releasePointerCapture?.(event.pointerId);
  window.pixpop.setOverlayMouseEvents(false);
}

stage.addEventListener('pointerup', stopDragging);
stage.addEventListener('pointercancel', stopDragging);
stage.addEventListener('click', () => {
  if (!dragMoved && !hidden) play('sparkle');
  dragMoved = false;
});

window.pixpop.onJoystickEvent((event: OverlayEvent) => handleInput(event));
window.pixpop.onKeyboardActivity(() => setVisible(false));
window.pixpop.onOverlayHide(() => setVisible(false));
window.pixpop.onOverlayShow(() => setVisible(true));

window.pixpop.loadConfig().then(() => {
  cleanupScene = createGhostScene(stage, motion, false, lighting);
  setTimeout(() => setVisible(true), 700);
  requestAnimationFrame(tick);
});

window.addEventListener('beforeunload', () => cleanupScene?.());
