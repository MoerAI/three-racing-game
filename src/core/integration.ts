import * as THREE from 'three';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  updatePhysics,
} from './physics.js';
import type { PhysicsState, PhysicsConfig } from '../types/index.js';
import type { CarData } from '../game/car.js';
import type { ChaseCamera } from './camera.js';
import { updateChaseCamera } from './camera.js';
import type { InputManager } from './input.js';
import type { CollisionSystem } from './collision.js';
import { checkCollisions, applyCollisionResponse } from './collision.js';

export interface IntegrationState {
  physicsState: PhysicsState;
  physicsConfig: PhysicsConfig;
}

export function createIntegration(): IntegrationState {
  return {
    physicsState: createDefaultPhysicsState(),
    physicsConfig: createDefaultPhysicsConfig(),
  };
}

export function updateIntegration(
  integrationState: IntegrationState,
  inputManager: InputManager,
  carData: CarData,
  chaseCamera: ChaseCamera,
  collisionSystem: CollisionSystem,
  dt: number,
): void {
  const input = inputManager.getState();

  integrationState.physicsState = updatePhysics(
    integrationState.physicsState,
    input,
    integrationState.physicsConfig,
    dt,
  );

  const carWorldPosition = new THREE.Vector3(
    integrationState.physicsState.position.x,
    0.25,
    integrationState.physicsState.position.z,
  );
  const collisionResults = checkCollisions(
    collisionSystem,
    carWorldPosition,
    integrationState.physicsState.rotation,
  );

  if (collisionResults.length > 0) {
    const correctedState = applyCollisionResponse(
      integrationState.physicsState,
      collisionResults,
    );
    integrationState.physicsState.speed = correctedState.speed;
    integrationState.physicsState.position = correctedState.position;
    integrationState.physicsState.rotation = correctedState.rotation;
  }

  window.__DEBUG__.isColliding = collisionResults.length > 0;

  const { physicsState } = integrationState;

  carData.group.position.set(physicsState.position.x, 0.25, physicsState.position.z);
  carData.group.rotation.y = physicsState.rotation;

  updateChaseCamera(chaseCamera, carData.group.position, carData.group.rotation.y);

  window.__DEBUG__.carSpeed = physicsState.speed;
  window.__DEBUG__.carPosition = {
    x: physicsState.position.x,
    y: 0.25,
    z: physicsState.position.z,
  };
  window.__DEBUG__.isDrifting = input.drift && physicsState.speed > 5;
  window.__DEBUG__.isBoosting = input.boost && physicsState.boostMeter > 0;
  window.__DEBUG__.boostMeter = physicsState.boostMeter;
}
