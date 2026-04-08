export interface HUD {
  speedEl: HTMLElement;
  lapEl: HTMLElement;
  timerEl: HTMLElement;
  lapTimeEl: HTMLElement;
  boostBarEl: HTMLElement;
}

export function createHUD(): HUD {
  const hudDiv = document.createElement('div');
  hudDiv.id = 'hud';

  const speedEl = document.createElement('div');
  speedEl.id = 'speed';
  speedEl.textContent = '0 mph';

  const lapEl = document.createElement('div');
  lapEl.id = 'lap';
  lapEl.textContent = 'Lap 1/3';

  const timerEl = document.createElement('div');
  timerEl.id = 'timer';
  timerEl.textContent = '00:00.00';

  const lapTimeEl = document.createElement('div');
  lapTimeEl.id = 'lap-time';
  lapTimeEl.textContent = '';

  const boostContainer = document.createElement('div');
  boostContainer.id = 'boost';
  const boostBarEl = document.createElement('div');
  boostBarEl.id = 'boost-bar';
  boostContainer.appendChild(boostBarEl);

  hudDiv.appendChild(speedEl);
  hudDiv.appendChild(lapEl);
  hudDiv.appendChild(timerEl);
  hudDiv.appendChild(lapTimeEl);
  hudDiv.appendChild(boostContainer);
  document.body.appendChild(hudDiv);

  return { speedEl, lapEl, timerEl, lapTimeEl, boostBarEl };
}

export function updateHUD(
  hud: HUD,
  speed: number,
  currentLap: number,
  totalLaps: number,
  raceTime: number,
  boostMeter: number,
): void {
  hud.speedEl.textContent = `${Math.round(Math.abs(speed))} mph`;
  hud.lapEl.textContent = `Lap ${Math.min(currentLap, totalLaps)}/${totalLaps}`;
  hud.timerEl.textContent = formatTime(raceTime);
  hud.boostBarEl.style.width = `${boostMeter}%`;
  if (boostMeter > 60) {
    hud.boostBarEl.style.backgroundColor = '#00cc44';
  } else if (boostMeter > 30) {
    hud.boostBarEl.style.backgroundColor = '#ffcc00';
  } else {
    hud.boostBarEl.style.backgroundColor = '#cc2222';
  }
}

export function showLapTime(hud: HUD, lapNumber: number, lapTime: number): void {
  hud.lapTimeEl.textContent = `Lap ${lapNumber}: ${formatTime(lapTime)}`;
  hud.lapTimeEl.style.opacity = '1';
  setTimeout(() => {
    hud.lapTimeEl.style.opacity = '0';
  }, 3000);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
