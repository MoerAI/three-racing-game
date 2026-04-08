export interface ScreenOverlay {
  el: HTMLElement;
}

export function createStartScreen(): ScreenOverlay {
  const el = document.createElement('div');
  el.id = 'start-screen';
  el.innerHTML = `
    <div class="screen-content">
      <h1>🏎️ Racing Game</h1>
      <p>WASD to drive · Shift to drift · Space to boost</p>
      <button id="start-btn">Click to Start</button>
    </div>
  `;
  document.body.appendChild(el);
  return { el };
}

export function createCountdownOverlay(): ScreenOverlay {
  const el = document.createElement('div');
  el.id = 'countdown';
  el.style.display = 'none';
  document.body.appendChild(el);
  return { el };
}

export function createPauseOverlay(): ScreenOverlay {
  const el = document.createElement('div');
  el.id = 'pause-overlay';
  el.innerHTML = '<div class="screen-content"><h2>PAUSED</h2><p>Press ESC to resume</p></div>';
  el.style.display = 'none';
  document.body.appendChild(el);
  return { el };
}

export function createFinishScreen(): ScreenOverlay {
  const el = document.createElement('div');
  el.id = 'finish-screen';
  el.style.display = 'none';
  document.body.appendChild(el);
  return { el };
}

export function showFinishScreen(overlay: ScreenOverlay, raceTime: number): void {
  const mins = Math.floor(raceTime / 60);
  const secs = Math.floor(raceTime % 60);
  const ms = Math.floor((raceTime % 1) * 100);
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  overlay.el.innerHTML = `
    <div class="screen-content">
      <h1>🏁 Race Complete!</h1>
      <p>Time: ${timeStr}</p>
      <button id="restart-btn">Play Again</button>
    </div>
  `;
  overlay.el.style.display = 'flex';
}

export async function runCountdown(overlay: ScreenOverlay): Promise<void> {
  overlay.el.style.display = 'flex';
  const steps = ['3', '2', '1', 'GO!'];
  for (const step of steps) {
    overlay.el.textContent = step;
    await new Promise<void>(resolve => setTimeout(resolve, 1000));
  }
  overlay.el.style.display = 'none';
}
