export interface PhysicsState {
  speed: number;
  lateralSpeed: number;
  rotation: number;
  position: { x: number; z: number };
  driftDuration: number;
  boostMeter: number;
}

export interface PhysicsConfig {
  maxSpeed: number;
  acceleration: number;
  braking: number;
  friction: number;
  steerSpeed: number;
  lateralGrip: number;
  driftGrip: number;
  boostMultiplier: number;
}

export interface PhysicsInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  boost: boolean;
}

export type GameStatus = 'menu' | 'countdown' | 'playing' | 'paused' | 'finished';

export interface GameState {
  status: GameStatus;
  currentLap: number;
  totalLaps: number;
  checkpointsCrossed: number;
  checkpointCount: number;
  nextCheckpoint: number;
  raceTime: number;
  countdownTime: number;
  bestLapTime: number;
  lapStartTime: number;
}

export interface GameConfig {
  totalLaps: number;
  checkpointCount: number;
}

export interface DebugState {
  carPosition: { x: number; y: number; z: number };
  carSpeed: number;
  currentLap: number;
  checkpointsCrossed: number;
  fps: number;
  gameState: GameStatus;
  isColliding: boolean;
  isDrifting: boolean;
  isBoosting: boolean;
  boostMeter: number;
  raceTime: number;
  audioContextActive: boolean;
  obstacleCount: number;
  carParts: string[];
}

declare global {
  interface Window {
    __DEBUG__: DebugState;
  }
}
