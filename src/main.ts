import './styles.css';
import { debugState } from './debug.js';
import { createRenderer } from './core/renderer.js';
import { createChaseCamera, updateChaseCamera } from './core/camera.js';
import { startGameLoop } from './core/gameLoop.js';
import { createCar, updateWheels } from './game/car.js';
import { createTrack } from './game/track.js';
import { createInputManager } from './core/input.js';
import { createIntegration, updateIntegration } from './core/integration.js';
import { createCollisionSystem } from './core/collision.js';
import { createCheckpointSystem, updateCheckpoints } from './game/checkpoints.js';
import {
  createGameState,
  startRace,
  startPlaying,
  updateTimer,
  pauseGame,
  resumeGame,
  resetRace,
} from './game/gameState.js';
import { createHUD, updateHUD, showLapTime } from './ui/hud.js';
import { createMinimap, updateMinimap } from './ui/minimap.js';
import {
  createAudioSystem,
  updateEngineSound,
  playCollisionSound,
  playBoostSound,
  playLapChime,
} from './core/audio.js';
import { createDefaultPhysicsState } from './core/physics.js';
import {
  createStartScreen,
  createCountdownOverlay,
  createPauseOverlay,
  createFinishScreen,
  showFinishScreen,
  runCountdown,
} from './ui/startScreen.js';

const { scene, camera, renderer } = createRenderer();
const trackData = createTrack(scene);
const carData = createCar(scene);
const chaseCamera = createChaseCamera(camera);
const inputManager = createInputManager();
const collisionSystem = createCollisionSystem(trackData.wallMeshes, trackData.obstacleMeshes);
const integrationState = createIntegration();

const trackStartPoint = trackData.spline.getPointAt(0);
const trackStartTangent = trackData.spline.getTangentAt(0);
const trackStartRotation = Math.atan2(trackStartTangent.x, trackStartTangent.z);
carData.group.position.set(trackStartPoint.x, 0.25, trackStartPoint.z);
carData.group.rotation.y = trackStartRotation;
integrationState.physicsState.position = { x: trackStartPoint.x, z: trackStartPoint.z };
integrationState.physicsState.rotation = trackStartRotation;

const hud = createHUD();
const minimap = createMinimap(trackData.spline);
const audioSystem = createAudioSystem();

const startScreenOverlay = createStartScreen();
const countdownOverlay = createCountdownOverlay();
const pauseOverlay = createPauseOverlay();
const finishScreenOverlay = createFinishScreen();

let gameState = createGameState({ totalLaps: 3, checkpointCount: 3 });
let checkpointSystem = createCheckpointSystem(scene, trackData.spline, gameState, trackData.trackWidth);
let prevIsColliding = false;
let prevIsBoosting = false;
let prevLap = 1;
let isGameRunning = false;
let lapStartTime = 0;

startGameLoop(update, render);

document.getElementById('start-btn')?.addEventListener('click', async () => {
  startScreenOverlay.el.style.display = 'none';
  await runCountdown(countdownOverlay);
  gameState = startRace(gameState);
  gameState = startPlaying(gameState);
  checkpointSystem.gameState = gameState;
  isGameRunning = true;
  prevLap = gameState.currentLap;
});

window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.code === 'Escape' && isGameRunning) {
    if (gameState.status === 'playing') {
      gameState = pauseGame(gameState);
      pauseOverlay.el.style.display = 'flex';
    } else if (gameState.status === 'paused') {
      gameState = resumeGame(gameState);
      pauseOverlay.el.style.display = 'none';
    }
  }
});

function setupRestartButton(): void {
  document.getElementById('restart-btn')?.addEventListener('click', () => {
    finishScreenOverlay.el.style.display = 'none';
    integrationState.physicsState = createDefaultPhysicsState();
    integrationState.physicsState.position = { x: trackStartPoint.x, z: trackStartPoint.z };
    integrationState.physicsState.rotation = trackStartRotation;
    carData.group.position.set(trackStartPoint.x, 0.25, trackStartPoint.z);
    carData.group.rotation.y = trackStartRotation;
    gameState = resetRace(createGameState({ totalLaps: 3, checkpointCount: 3 }));
    gameState = startRace(gameState);
    gameState = startPlaying(gameState);
    checkpointSystem = createCheckpointSystem(scene, trackData.spline, gameState, trackData.trackWidth);
    prevLap = gameState.currentLap;
    prevIsColliding = false;
    prevIsBoosting = false;
    lapStartTime = 0;
    isGameRunning = true;
  });
}

function update(dt: number): void {
  window.__DEBUG__.gameState = gameState.status;

  if (gameState.status !== 'playing') {
    updateChaseCamera(chaseCamera, carData.group.position, carData.group.rotation.y);
    return;
  }

  updateIntegration(integrationState, inputManager, carData, chaseCamera, collisionSystem, dt);
  updateWheels(
    carData,
    integrationState.physicsState.speed,
    integrationState.physicsState.rotation,
    dt,
  );

  gameState = updateTimer(gameState, dt);
  gameState = updateCheckpoints(checkpointSystem, carData.group.position, trackData.spline);

  window.__DEBUG__.currentLap = gameState.currentLap;
  window.__DEBUG__.checkpointsCrossed = gameState.checkpointsCrossed;
  window.__DEBUG__.raceTime = gameState.raceTime;

  updateHUD(
    hud,
    integrationState.physicsState.speed,
    gameState.currentLap,
    3,
    gameState.raceTime,
    integrationState.physicsState.boostMeter,
  );

  updateMinimap(minimap, carData.group.position, carData.group.rotation.y);
  updateEngineSound(audioSystem, integrationState.physicsState.speed);

  if (window.__DEBUG__.isColliding && !prevIsColliding) {
    playCollisionSound(audioSystem);
  }
  prevIsColliding = window.__DEBUG__.isColliding;

  if (window.__DEBUG__.isBoosting && !prevIsBoosting) {
    playBoostSound(audioSystem);
  }
  prevIsBoosting = window.__DEBUG__.isBoosting;

  if (gameState.currentLap > prevLap) {
    playLapChime(audioSystem);
    const lapTime = gameState.raceTime - lapStartTime;
    showLapTime(hud, prevLap, lapTime);
    lapStartTime = gameState.raceTime;
  }
  prevLap = gameState.currentLap;

  if (gameState.status === 'finished') {
    isGameRunning = false;
    showFinishScreen(finishScreenOverlay, gameState.raceTime);
    setupRestartButton();
  }
}

function render(): void {
  renderer.render(scene, camera);
}

if (new URLSearchParams(window.location.search).has('debug')) {
  import('lil-gui').then(({ GUI }) => {
    const gui = new GUI();
    const physicsFolder = gui.addFolder('Physics');
    physicsFolder.add(integrationState.physicsConfig, 'maxSpeed', 10, 200);
    physicsFolder.add(integrationState.physicsConfig, 'acceleration', 5, 100);
    physicsFolder.add(integrationState.physicsConfig, 'friction', 1, 50);
    physicsFolder.open();
  });
}

console.log('Racing Game initialized', debugState);
