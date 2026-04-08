import type { GameState, GameConfig } from '../types/index.js';

export function createGameState(config: GameConfig): GameState {
  return {
    status: 'menu',
    currentLap: 1,
    totalLaps: config.totalLaps,
    checkpointsCrossed: 0,
    checkpointCount: config.checkpointCount,
    nextCheckpoint: 0,
    raceTime: 0,
    countdownTime: 3,
    bestLapTime: 0,
    lapStartTime: 0,
  };
}

export function startRace(state: GameState): GameState {
  if (state.status !== 'menu') return state;
  return { ...state, status: 'countdown', countdownTime: 3 };
}

export function startPlaying(state: GameState): GameState {
  if (state.status !== 'countdown') return state;
  return { ...state, status: 'playing', raceTime: 0, lapStartTime: 0 };
}

export function crossCheckpoint(state: GameState, checkpointId: number): GameState {
  if (state.status !== 'playing') return state;
  if (checkpointId !== state.nextCheckpoint) return state;
  return {
    ...state,
    nextCheckpoint: state.nextCheckpoint + 1,
    checkpointsCrossed: state.checkpointsCrossed + 1,
  };
}

export function completeLap(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  if (state.nextCheckpoint < state.checkpointCount) return state;
  const newLap = state.currentLap + 1;
  return {
    ...state,
    currentLap: newLap,
    nextCheckpoint: 0,
    checkpointsCrossed: 0,
    lapStartTime: state.raceTime,
  };
}

export function finishRace(state: GameState): GameState {
  if (state.currentLap <= state.totalLaps) return state;
  return { ...state, status: 'finished' };
}

export function updateTimer(state: GameState, dt: number): GameState {
  if (state.status === 'playing') {
    return { ...state, raceTime: state.raceTime + dt };
  }
  if (state.status === 'countdown') {
    const newCountdown = state.countdownTime - dt;
    return { ...state, countdownTime: Math.max(0, newCountdown) };
  }
  return state;
}

export function pauseGame(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  return { ...state, status: 'paused' };
}

export function resumeGame(state: GameState): GameState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'playing' };
}

export function resetRace(state: GameState): GameState {
  return createGameState({ totalLaps: state.totalLaps, checkpointCount: state.checkpointCount });
}
