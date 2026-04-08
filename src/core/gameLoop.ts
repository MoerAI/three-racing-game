import { debugState } from '../debug.js';

const FIXED_STEP = 1 / 60;

export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export function startGameLoop(update: UpdateFn, render: RenderFn): void {
  let lastTime = performance.now();
  let accumulator = 0;
  let frameCount = 0;
  let fpsTimer = 0;

  let paused = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      paused = true;
    } else {
      paused = false;
      lastTime = performance.now();
      accumulator = 0;
    }
  });

  const isDebug = new URLSearchParams(window.location.search).has('debug');
  if (isDebug) {
    import('stats.js').then(({ default: Stats }) => {
      const stats = new Stats();
      stats.showPanel(0);
      document.body.appendChild(stats.dom);
      window.__stats = stats;
    });
  }

  function loop(currentTime: number): void {
    requestAnimationFrame(loop);

    if (paused) return;

    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (dt > 0.1) dt = 0.1;

    if (window.__stats) window.__stats.begin();

    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }

    render();

    if (window.__stats) window.__stats.end();

    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1) {
      debugState.fps = Math.round(frameCount / fpsTimer);
      frameCount = 0;
      fpsTimer = 0;
    }
  }

  requestAnimationFrame(loop);
}
