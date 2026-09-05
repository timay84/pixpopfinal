function createRenderer(ctx, size) {
  let baseImg = null;
  let tongueImg1 = null;
  let tongueImg2 = null;
  let lieImg1 = null;
  let lieImg2 = null;
  let jumpFrames = [];
  let butterfly = null;
  let currentFrame = 0;
  let animStartFrame = 0;

  const FPS = 12;
  const framesPerStep = Math.round(60 / FPS);

  function setImages(base, tongue1, tongue2, lie1, lie2, jumpImgs, bf) {
    baseImg = base;
    tongueImg1 = tongue1;
    tongueImg2 = tongue2;
    lieImg1 = lie1;
    lieImg2 = lie2;
    jumpFrames = jumpImgs || [];
    butterfly = bf || null;
  }

  function drawTwoFrame(img1, img2, fps) {
    const fStep = fps ? Math.round(60 / fps) : framesPerStep;
    const step = Math.floor(currentFrame / fStep);
    const sub = currentFrame % fStep;
    const idx = step % 2;
    const cur = idx === 0 ? img1 : img2;
    const nxt = idx === 0 ? img2 : img1;
    if (sub < fStep - 2 || fStep <= 2) {
      return [cur, null, 1];
    }
    const t = (sub - (fStep - 2)) / 2;
    return [cur, nxt, 1 - t];
  }

  function draw(state) {
    ctx.clearRect(0, 0, size, size);
    currentFrame++;

    let imageToDraw = baseImg;
    let imageToDraw2 = null;
    let alpha = 1;
    let ox = 0;
    let oy = 0;
    let animationDone = false;

    switch (state) {
      case 'IDLE':
        imageToDraw = baseImg;
        break;

      case 'LICKING':
        [imageToDraw, imageToDraw2, alpha] = drawTwoFrame(tongueImg1, tongueImg2, 1.5);
        break;

      case 'LYING_DOWN':
        [imageToDraw, imageToDraw2, alpha] = drawTwoFrame(lieImg1, lieImg2, 3);
        break;

      case 'BOUNCING':
        if (!animStartFrame) animStartFrame = currentFrame;
        const jumpFPS = 1.5;
        const jumpStep = Math.round(60 / jumpFPS);
        const elapsedStep = Math.floor((currentFrame - animStartFrame) / jumpStep);
        const totalSteps = jumpFrames.length * 4;
        if (elapsedStep < totalSteps && jumpFrames.length >= 6) {
          const step = elapsedStep;
          const sub = (currentFrame - animStartFrame) % jumpStep;
          const idx = step % jumpFrames.length;
          const nxtIdx = (idx + 1) % jumpFrames.length;
          imageToDraw = jumpFrames[idx];
          if (sub >= jumpStep - 2 && jumpStep > 2 && elapsedStep < totalSteps - 1) {
            imageToDraw2 = jumpFrames[nxtIdx];
            alpha = 1 - (sub - (jumpStep - 2)) / 2;
          }
        } else if (elapsedStep >= totalSteps) {
          animationDone = true;
          imageToDraw = baseImg;
        } else {
          imageToDraw = baseImg;
        }
        break;

      default:
        imageToDraw = baseImg;
    }

    if (state !== 'BOUNCING' || animationDone) animStartFrame = 0;

    if (imageToDraw2) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imageToDraw, ox, oy, size, size);
      ctx.globalAlpha = 1 - alpha;
      ctx.drawImage(imageToDraw2, ox, oy, size, size);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(imageToDraw, ox, oy, size, size);
    }

    // Static butterfly overlay during lying down
    if (state === 'LYING_DOWN' && butterfly) {
      const bx = size * 0.04;
      const by = size * 0.20;
      const bSize = size * 0.27;
      ctx.drawImage(butterfly, bx, by, bSize, bSize);
    }
  }

  return { setImages, draw };
}
