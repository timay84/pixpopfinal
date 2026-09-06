import { createGhostScene } from './lib/ghost-scene';
import { createInputController, type InputSample } from './lib/input-controller';
import { newMotion, type Mode, type Motion } from './lib/motion';
import './overlay.css';

declare global {
  interface Window {
    pixpop: {
      loadConfig: () => Promise<unknown>;
      onJoystickEvent: (callback: (event: OverlayEvent) => void) => void;
      onOverlayCommand: (callback: (command: { type: string; config?: ToyConfig }) => void) => void;
      onKeyboardActivity: (callback: () => void) => void;
      onOverlayHide: (callback: () => void) => void;
      onOverlayShow: (callback: () => void) => void;
      setOverlayMouseEvents: (interactive: boolean) => void;
    };
  }
}

type OverlaySample = InputSample & { pressed?: boolean };
type ToyConfig = { toy?: 'ghost' | 'radish' | 'squeeze'; actions?: Record<string, string> };
type OverlayEvent = { kind: 'sample' | 'action' | 'direction'; value: OverlaySample | string };

const root = document.getElementById('overlay-root');
if (!root) throw new Error('BooFloat overlay root is missing');

const stage = document.createElement('div');
stage.id = 'boo-stage';
root.append(stage);

const motion: { current: Motion } = { current: newMotion('idle') };
const lighting = { current: 'light' as const };
const driver = createInputController(motion);
let config: ToyConfig = { toy: 'ghost', actions: {} };
let hidden = false;
let inputActive = false;
let lastTick = performance.now();
let cleanupScene: (() => void) | undefined;
let dragging = false;
let dragMoved = false;
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let legacyArt: HTMLDivElement | undefined;
let cleanupLegacy: (() => void) | undefined;

function createLegacyToy(toy: 'radish' | 'squeeze') {
  const art = document.createElement('div');
  art.className = 'legacy-art float';
  const image = document.createElement('img');
  image.src = toy === 'radish' ? '../assets/radish-knife.png' : '../assets/squeeze-toy.png';
  image.alt = toy === 'radish' ? '萝卜刀' : '捏捏乐';
  art.append(image);
  stage.append(art);
  legacyArt = art;
  return () => {
    art.remove();
    if (legacyArt === art) legacyArt = undefined;
  };
}

function legacyEffect(mode: string) {
  if (!legacyArt) return;
  const effect = mode === 'tilt-left' ? 'tilt-left' : mode === 'tilt-right' ? 'tilt-right' :
    ['stretch'].includes(mode) ? 'stretch' : ['trail', 'comet'].includes(mode) ? 'dash' :
    ['orbit', 'twist'].includes(mode) ? 'spin' : ['press'].includes(mode) ? 'squish' :
    ['pulse'].includes(mode) ? 'pulse' : ['rebound', 'reform'].includes(mode) ? 'pop' :
    ['ripple'].includes(mode) ? 'wave' : ['echo'].includes(mode) ? 'echo' :
    ['sparkle', 'blink'].includes(mode) ? 'sparkle' : ['burst'].includes(mode) ? 'burst' : 'float';
  legacyArt.classList.remove('float', 'tilt-left', 'tilt-right', 'stretch', 'dash', 'spin', 'squish', 'pulse', 'pop', 'wave', 'echo', 'sparkle', 'burst');
  void legacyArt.offsetWidth;
  legacyArt.classList.add(effect);
}

function renderToy(next: ToyConfig) {
  config = next;
  cleanupScene?.();
  cleanupScene = undefined;
  cleanupLegacy?.();
  cleanupLegacy = undefined;
  if (config.toy === 'ghost') cleanupScene = createGhostScene(stage, motion, false, lighting);
  else cleanupLegacy = createLegacyToy(config.toy || 'radish');
}

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
    if (hidden || config.toy !== 'ghost') return;
    const sample = event.value;
    driver.set({ x: sample.x, y: sample.y, pressure: sample.pressure }, performance.now());
    inputActive = true;
    return;
  }

  if (event.kind === 'direction' && typeof event.value === 'string' && !hidden && config.toy !== 'ghost') {
    const mode = config.actions?.[event.value] || (event.value === 'S' ? 'press' : 'tilt-right');
    legacyEffect(mode);
    return;
  }

  if (event.kind === 'action' && typeof event.value === 'string') {
    if (event.value === 'DOUBLE') {
      setVisible(true);
      if (config.toy === 'ghost') play('reform');
      else legacyEffect(config.actions?.DOUBLE || 'reform');
    } else if (!hidden && event.value === 'SINGLE') {
      if (config.toy === 'ghost') play('sparkle');
      else legacyEffect(config.actions?.SINGLE || 'sparkle');
    } else if (!hidden && event.value === 'LONG') {
      if (config.toy === 'ghost') play('pulse');
      else legacyEffect('pulse');
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
  if (!dragMoved && !hidden) {
    if (config.toy === 'ghost') play('sparkle');
    else legacyEffect('sparkle');
  }
  dragMoved = false;
});

window.pixpop.onJoystickEvent((event: OverlayEvent) => handleInput(event));
window.pixpop.onKeyboardActivity(() => setVisible(false));
window.pixpop.onOverlayHide(() => setVisible(false));
window.pixpop.onOverlayShow(() => setVisible(true));
window.pixpop.onOverlayCommand((command) => {
  if (command.type === 'config' && command.config) {
    renderToy(command.config);
    setVisible(true);
  }
});

window.pixpop.loadConfig().then((loaded) => {
  renderToy(loaded as ToyConfig);
  setTimeout(() => setVisible(true), 700);
  requestAnimationFrame(tick);
});

window.addEventListener('beforeunload', () => cleanupScene?.());
