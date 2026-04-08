import * as THREE from 'three';
import type { GameState } from '../types/index.js';
import { crossCheckpoint, completeLap, finishRace } from './gameState.js';
import { getClosestPointOnSpline } from './track.js';

interface Checkpoint {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  id: number;
  lastDot: number;
}

export interface CheckpointSystem {
  checkpoints: Checkpoint[];
  finishLine: THREE.Group;
  gameState: GameState;
  lastFinishDot: number;
  trackHalfWidth: number;
}

export function createCheckpointSystem(
  scene: THREE.Scene,
  spline: THREE.CatmullRomCurve3,
  initialGameState: GameState,
  trackWidth: number = 20,
): CheckpointSystem {
  const checkpointTs = [0.25, 0.5, 0.75];
  const checkpoints: Checkpoint[] = checkpointTs.map((t, index) => {
    const position = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t);
    return {
      position: position.clone(),
      normal: tangent.clone(),
      id: index,
      lastDot: 0,
    };
  });

  const finishLine = buildFinishLine(scene, spline);

  return {
    checkpoints,
    finishLine,
    gameState: initialGameState,
    lastFinishDot: 0,
    trackHalfWidth: trackWidth / 2,
  };
}

function buildFinishLine(
  scene: THREE.Scene,
  spline: THREE.CatmullRomCurve3,
): THREE.Group {
  const finishGroup = new THREE.Group();
  const finishPos = spline.getPointAt(0);
  const finishTangent = spline.getTangentAt(0);
  const upVector = new THREE.Vector3(0, 1, 0);
  const perpendicular = new THREE.Vector3()
    .crossVectors(finishTangent, upVector)
    .normalize();

  const squareSize = 2;
  const squaresAcross = 10;
  for (let i = 0; i < squaresAcross; i++) {
    const offset = (i - squaresAcross / 2 + 0.5) * squareSize;
    const squareGeo = new THREE.BoxGeometry(squareSize, 0.05, squareSize);
    const color = i % 2 === 0 ? 0x000000 : 0xffffff;
    const squareMat = new THREE.MeshStandardMaterial({ color });
    const square = new THREE.Mesh(squareGeo, squareMat);
    square.position.set(
      finishPos.x + perpendicular.x * offset,
      0.02,
      finishPos.z + perpendicular.z * offset,
    );
    finishGroup.add(square);
  }

  scene.add(finishGroup);
  return finishGroup;
}

export function updateCheckpoints(
  checkpointSystem: CheckpointSystem,
  carPosition: THREE.Vector3,
  spline: THREE.CatmullRomCurve3,
): GameState {
  let { gameState } = checkpointSystem;

  if (gameState.status !== 'playing') return gameState;

  const carPos2D = new THREE.Vector3(carPosition.x, 0, carPosition.z);

  const closest = getClosestPointOnSpline(carPos2D, spline);
  if (closest.distance > checkpointSystem.trackHalfWidth) return gameState;

  for (const checkpoint of checkpointSystem.checkpoints) {
    const toCarVec = carPos2D.clone().sub(checkpoint.position);
    const currentDot = toCarVec.dot(checkpoint.normal);

    if (checkpoint.lastDot < 0 && currentDot >= 0) {
      gameState = crossCheckpoint(gameState, checkpoint.id);
    }

    checkpoint.lastDot = currentDot;
  }

  const finishPos = spline.getPointAt(0);
  const finishNormal = spline.getTangentAt(0);
  const finishPos2D = new THREE.Vector3(finishPos.x, 0, finishPos.z);
  const toCarFinish = carPos2D.clone().sub(finishPos2D);
  const finishDot = toCarFinish.dot(finishNormal);

  if (checkpointSystem.lastFinishDot < 0 && finishDot >= 0) {
    const allCheckpointsCrossed =
      gameState.checkpointsCrossed >= checkpointSystem.checkpoints.length;
    if (allCheckpointsCrossed) {
      gameState = completeLap(gameState);
      if (gameState.currentLap > gameState.totalLaps) {
        gameState = finishRace(gameState);
      }
    }
  }
  checkpointSystem.lastFinishDot = finishDot;

  checkpointSystem.gameState = gameState;
  return gameState;
}
