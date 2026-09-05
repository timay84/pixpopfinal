function createInteractions(canvas, stateMachine, renderer, bubble, size) {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let mouseMoved = false;

  // Head oval zone (proportional to image size)
  const headZone = { cx: size * 0.5, cy: size * 0.30, rx: size * 0.35, ry: size * 0.25 };

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
        }, 16000);
      }
    }
    isDragging = false;
    mouseMoved = false;
  });
}
