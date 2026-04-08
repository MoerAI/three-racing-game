import { describe, it, expect } from 'vitest';
import {
  createGameState, startRace, startPlaying, crossCheckpoint,
  completeLap, updateTimer, pauseGame, resumeGame, finishRace, resetRace,
} from '../game/gameState.js';

describe('GameState', () => {
  it('creates initial menu state', () => {
    const s = createGameState({ totalLaps: 3, checkpointCount: 4 });
    expect(s.status).toBe('menu');
    expect(s.currentLap).toBe(1);
    expect(s.raceTime).toBe(0);
    expect(s.nextCheckpoint).toBe(0);
  });

  it('transitions menu → countdown on startRace', () => {
    const s = createGameState({ totalLaps: 3, checkpointCount: 4 });
    expect(startRace(s).status).toBe('countdown');
  });

  it('transitions countdown → playing on startPlaying', () => {
    const s = startRace(createGameState({ totalLaps: 3, checkpointCount: 4 }));
    expect(startPlaying(s).status).toBe('playing');
  });

  it('accepts checkpoint in correct order', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 3, checkpointCount: 4 })));
    s = crossCheckpoint(s, 0);
    expect(s.nextCheckpoint).toBe(1);
    expect(s.checkpointsCrossed).toBe(1);
  });

  it('ignores checkpoint out of order', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 3, checkpointCount: 4 })));
    s = crossCheckpoint(s, 2);
    expect(s.nextCheckpoint).toBe(0);
    expect(s.checkpointsCrossed).toBe(0);
  });

  it('completes lap after all checkpoints', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 3, checkpointCount: 4 })));
    s = crossCheckpoint(s, 0);
    s = crossCheckpoint(s, 1);
    s = crossCheckpoint(s, 2);
    s = crossCheckpoint(s, 3);
    s = completeLap(s);
    expect(s.currentLap).toBe(2);
    expect(s.nextCheckpoint).toBe(0);
  });

  it('finishes race after totalLaps', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 1, checkpointCount: 4 })));
    s = crossCheckpoint(s, 0);
    s = crossCheckpoint(s, 1);
    s = crossCheckpoint(s, 2);
    s = crossCheckpoint(s, 3);
    s = completeLap(s);
    s = finishRace(s);
    expect(s.status).toBe('finished');
  });

  it('timer only increments in playing state', () => {
    const s = createGameState({ totalLaps: 3, checkpointCount: 4 });
    const menu = updateTimer(s, 1 / 60);
    expect(menu.raceTime).toBe(0);
    const playing = updateTimer(startPlaying(startRace(s)), 1 / 60);
    expect(playing.raceTime).toBeGreaterThan(0);
  });

  it('resets state to initial', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 3, checkpointCount: 4 })));
    s = updateTimer(s, 5);
    s = resetRace(s);
    expect(s.status).toBe('menu');
    expect(s.raceTime).toBe(0);
    expect(s.currentLap).toBe(1);
  });

  it('pauses and resumes', () => {
    let s = startPlaying(startRace(createGameState({ totalLaps: 3, checkpointCount: 4 })));
    s = pauseGame(s);
    expect(s.status).toBe('paused');
    s = resumeGame(s);
    expect(s.status).toBe('playing');
  });
});
