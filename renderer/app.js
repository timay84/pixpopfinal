(function () {
  const canvas = document.getElementById('pet-canvas');
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const size = 150;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const stateMachine = createStateMachine();
  const renderer = createRenderer(ctx, size);
  const bubble = createBubble(document.getElementById('bubble-container'));

  createInteractions(canvas, stateMachine, renderer, bubble, size);

  loadImages([
    '../assets/base.png',
    '../assets/tongue.png',
    '../assets/tongue2.png',
    '../assets/lie1.png',
    '../assets/lie2.png',
    '../assets/jump1.png',
    '../assets/jump2.png',
    '../assets/jump3.png',
    '../assets/jump4.png',
    '../assets/jump5.png',
    '../assets/jump6.png',
    '../assets/butterfly.png'
  ])
    .then(images => {
      console.log('images loaded OK');
      renderer.setImages(
        images[0], images[1], images[2],
        images[3], images[4],
        images.slice(5, 11),
        images[11]
      );
      stateMachine.transition('IDLE');
      startLoop();
    })
    .catch(err => {
      console.error('IMAGE LOAD FAILED:', err.message);
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
        img.onload = () => {
          console.log('loaded:', p);
          resolve(img);
        };
        img.onerror = () => {
          console.error('FAILED to load:', p);
          reject(new Error('Failed to load ' + p));
        };
        img.src = p;
      });
    }));
  }
})();
