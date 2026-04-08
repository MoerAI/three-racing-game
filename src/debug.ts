import type { DebugState } from './types/index.js';

export const debugState: DebugState = {
  carPosition: { x: 0, y: 0, z: 0 },
  carSpeed: 0,
  currentLap: 1,
  checkpointsCrossed: 0,
  fps: 0,
  gameState: 'menu',
  isColliding: false,
  isDrifting: false,
  isBoosting: false,
  boostMeter: 100,
  raceTime: 0,
  audioContextActive: false,
  obstacleCount: 0,
  carParts: [],
};

window.__DEBUG__ = debugState;
