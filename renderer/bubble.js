function createBubble(container) {
  let showing = false;
  let el = null;

  function show() {
    if (showing) return;
    showing = true;

    el = document.createElement('div');
    el.textContent = '小蝴蝶，520快乐！';
    el.style.cssText = `
      background: linear-gradient(135deg, #ff6b9d, #ff8a65);
      color: #fff;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(255,107,157,0.4);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      position: relative;
    `;

    // Tail triangle pointing down at the pet
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
