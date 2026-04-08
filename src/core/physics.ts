import type { PhysicsState, PhysicsConfig, PhysicsInput } from '../types/index.js';

export function createDefaultPhysicsState(): PhysicsState {
  return {
    speed: 0,
    lateralSpeed: 0,
    rotation: 0,
    position: { x: 0, z: 0 },
    driftDuration: 0,
    boostMeter: 100,
  };
}

export function createDefaultPhysicsConfig(): PhysicsConfig {
  return {
    maxSpeed: 88,
    acceleration: 40,
    braking: 65,
    friction: 15,
    steerSpeed: 2.0,
    lateralGrip: 1.0,
    driftGrip: 0.3,
    boostMultiplier: 2.0,
  };
}

export function applyAcceleration(state: PhysicsState, power: number, dt: number): PhysicsState {
  if (dt === 0) {
    return state;
  }

  const config = createDefaultPhysicsConfig();
  const nextSpeed = Math.max(
    -config.maxSpeed * 0.5,
    Math.min(config.maxSpeed, state.speed + power * dt),
  );

  return { ...state, speed: nextSpeed };
}

export function applyFriction(state: PhysicsState, friction: number, dt: number): PhysicsState {
  if (state.speed === 0 || dt === 0) {
    return state;
  }

  const sign = Math.sign(state.speed);
  const nextSpeed = state.speed - sign * friction * dt;

  if (Math.sign(nextSpeed) !== sign) {
    return { ...state, speed: 0 };
  }

  return { ...state, speed: nextSpeed };
}

export function applySteering(
  state: PhysicsState,
  steerAngle: number,
  grip: number,
  dt: number,
): PhysicsState {
  if (Math.abs(state.speed) < 0.1 || dt === 0) {
    return state;
  }

  const turnAmount = steerAngle * (state.speed / 30) * dt;
  const nextRotation = state.rotation + turnAmount;
  const lateralDecay = 1 - grip * dt * 10;
  const nextLateralSpeed = state.lateralSpeed * Math.max(0, lateralDecay);

  return { ...state, rotation: nextRotation, lateralSpeed: nextLateralSpeed };
}

export function updatePosition(state: PhysicsState, dt: number): PhysicsState {
  if (dt === 0 || state.speed === 0) {
    return state;
  }

  const dx = -Math.sin(state.rotation) * state.speed * dt;
  const dz = Math.cos(state.rotation) * state.speed * dt;

  return {
    ...state,
    position: {
      x: state.position.x + dx,
      z: state.position.z + dz,
    },
  };
}

export function updatePhysics(
  state: PhysicsState,
  input: PhysicsInput,
  config: PhysicsConfig,
  dt: number,
): PhysicsState {
  let next = { ...state };

  // Boost meter management
  const isBoosting = input.boost && state.boostMeter > 0;
  if (isBoosting) {
    // Drain: 25/sec
    next.boostMeter = Math.max(0, state.boostMeter - 25 * dt);
  } else {
    // Regen: 2/sec (only when not boosting)
    next.boostMeter = Math.min(100, state.boostMeter + 2 * dt);
  }

  let accelerationPower = 0;
  const effectiveAcceleration = isBoosting
    ? config.acceleration * config.boostMultiplier
    : config.acceleration;

  if (input.forward) {
    accelerationPower = effectiveAcceleration;
  } else if (input.backward) {
    accelerationPower = -config.braking;
  }

  if (accelerationPower !== 0) {
    next = applyAcceleration(next, accelerationPower, dt);
  } else {
    next = applyFriction(next, config.friction, dt);
  }

  const effectiveGrip = input.drift ? config.driftGrip : config.lateralGrip;

  let steerDirection = 0;
  if (input.left) {
    steerDirection = config.steerSpeed;
  } else if (input.right) {
    steerDirection = -config.steerSpeed;
  }

  next = applySteering(next, steerDirection, effectiveGrip, dt);

  // Track drift duration and apply boost when drift ends
  if (input.drift) {
    next.driftDuration += dt;
  } else if (state.driftDuration > 0.5) {
    // Drift ended after sustained duration — apply speed boost
    next.speed *= 1.1;
    next.driftDuration = 0;
  } else if (state.driftDuration > 0) {
    // Drift ended but too short for boost
    next.driftDuration = 0;
  }

  return updatePosition(next, dt);
}
