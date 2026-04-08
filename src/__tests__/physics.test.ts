import { describe, it, expect } from 'vitest';
import {
  createDefaultPhysicsState,
  createDefaultPhysicsConfig,
  applyAcceleration,
  applyFriction,
  applySteering,
  updatePosition,
  updatePhysics,
} from '../core/physics.js';
import type { PhysicsState, PhysicsInput } from '../types/index.js';

describe('Physics Module', () => {
  describe('createDefaultPhysicsState', () => {
    it('creates zero initial state', () => {
      const state = createDefaultPhysicsState();
      expect(state.speed).toBe(0);
      expect(state.lateralSpeed).toBe(0);
      expect(state.rotation).toBe(0);
      expect(state.position.x).toBe(0);
      expect(state.position.z).toBe(0);
    });
  });

  describe('applyAcceleration', () => {
    it('increases speed when accelerating forward', () => {
      const state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const next = applyAcceleration(state, config.acceleration, 1 / 60);
      expect(next.speed).toBeGreaterThan(0);
    });

    it('decreases speed when braking', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 10 };
      const config = createDefaultPhysicsConfig();
      const next = applyAcceleration(s0, -config.braking, 1 / 60);
      expect(next.speed).toBeLessThan(10);
    });

    it('caps speed at maxSpeed', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 999 };
      const config = createDefaultPhysicsConfig();
      const next = applyAcceleration(s0, config.acceleration, 1 / 60);
      expect(next.speed).toBeLessThanOrEqual(config.maxSpeed);
    });

    it('does not change speed when dt is 0', () => {
      const state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const next = applyAcceleration(state, config.acceleration, 0);
      expect(next.speed).toBe(0);
    });
  });

  describe('applyFriction', () => {
    it('reduces speed toward zero', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 10 };
      const config = createDefaultPhysicsConfig();
      const next = applyFriction(s0, config.friction, 1 / 60);
      expect(next.speed).toBeLessThan(10);
      expect(next.speed).toBeGreaterThanOrEqual(0);
    });

    it('does not make speed negative from positive', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 0.001 };
      const config = createDefaultPhysicsConfig();
      const next = applyFriction(s0, config.friction, 1);
      expect(next.speed).toBeGreaterThanOrEqual(0);
    });

    it('returns zero speed when already stopped', () => {
      const s0 = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const next = applyFriction(s0, config.friction, 1 / 60);
      expect(next.speed).toBe(0);
    });
  });

  describe('applySteering', () => {
    it('changes rotation when moving and steering', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 10 };
      const config = createDefaultPhysicsConfig();
      const next = applySteering(s0, config.steerSpeed, config.lateralGrip, 1 / 60);
      expect(next.rotation).not.toBe(0);
    });

    it('does not change rotation when not moving', () => {
      const s0 = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const next = applySteering(s0, config.steerSpeed, config.lateralGrip, 1 / 60);
      expect(next.rotation).toBe(0);
    });
  });

  describe('updatePosition', () => {
    it('moves forward along rotation axis', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 10, rotation: 0 };
      const next = updatePosition(s0, 1 / 60);
      const moved =
        Math.abs(next.position.x - s0.position.x) + Math.abs(next.position.z - s0.position.z);
      expect(moved).toBeGreaterThan(0);
    });

    it('does not move when speed is zero', () => {
      const s0 = createDefaultPhysicsState();
      const next = updatePosition(s0, 1 / 60);
      expect(next.position.x).toBe(s0.position.x);
      expect(next.position.z).toBe(s0.position.z);
    });
  });

  describe('updatePhysics', () => {
    it('accelerates car when forward input is true', () => {
      const state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const input: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: false,
      };
      const next = updatePhysics(state, input, config, 1 / 60);
      expect(next.speed).toBeGreaterThan(0);
    });

    it('boost increases acceleration', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 0 };
      const config = createDefaultPhysicsConfig();
      const inputNormal: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: false,
      };
      const inputBoosted: PhysicsInput = { ...inputNormal, boost: true };
      const normalNext = updatePhysics(s0, inputNormal, config, 1 / 60);
      const boostedNext = updatePhysics(s0, inputBoosted, config, 1 / 60);
      expect(boostedNext.speed).toBeGreaterThan(normalNext.speed);
    });

    it('does not move if no input', () => {
      const state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const input: PhysicsInput = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: false,
      };
      const next = updatePhysics(state, input, config, 1 / 60);
      expect(next.speed).toBe(0);
      expect(next.position.x).toBe(0);
      expect(next.position.z).toBe(0);
    });
  });

  describe('Drift mechanics', () => {
    it('drift=true reduces lateral grip', () => {
      const s0: PhysicsState = {
        ...createDefaultPhysicsState(),
        speed: 10,
        lateralSpeed: 5,
      };
      const config = createDefaultPhysicsConfig();
      const inputNoDrift: PhysicsInput = {
        forward: false,
        backward: false,
        left: true,
        right: false,
        drift: false,
        boost: false,
      };
      const inputDrift: PhysicsInput = { ...inputNoDrift, drift: true };

      const noDriftNext = updatePhysics(s0, inputNoDrift, config, 1 / 60);
      const driftNext = updatePhysics(s0, inputDrift, config, 1 / 60);

      expect(driftNext.lateralSpeed).toBeGreaterThan(noDriftNext.lateralSpeed);
    });

    it('drift=false restores normal grip', () => {
      const s0: PhysicsState = {
        ...createDefaultPhysicsState(),
        speed: 10,
        lateralSpeed: 5,
      };
      const config = createDefaultPhysicsConfig();
      const inputNormal: PhysicsInput = {
        forward: false,
        backward: false,
        left: true,
        right: false,
        drift: false,
        boost: false,
      };

      const next = updatePhysics(s0, inputNormal, config, 1 / 60);

      expect(next.lateralSpeed).toBeLessThan(s0.lateralSpeed);
    });

    it('drift boost applies after sustained drift', () => {
      let state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const driftInput: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: true,
        boost: false,
      };
      const noDriftInput: PhysicsInput = { ...driftInput, drift: false };

      state = updatePhysics(state, driftInput, config, 1 / 60);
      expect(state.driftDuration).toBeGreaterThan(0);

      for (let i = 0; i < 31; i++) {
        state = updatePhysics(state, driftInput, config, 1 / 60);
      }

      expect(state.driftDuration).toBeGreaterThan(0.5);
      const speedBeforeBoost = state.speed;

      state = updatePhysics(state, noDriftInput, config, 1 / 60);

      expect(state.speed).toBeGreaterThan(speedBeforeBoost);
      expect(state.driftDuration).toBe(0);
    });

    it('drift boost does not apply for short drift', () => {
      let state: PhysicsState = {
        ...createDefaultPhysicsState(),
        speed: 20,
      };
      const config = createDefaultPhysicsConfig();
      const driftInput: PhysicsInput = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: true,
        boost: false,
      };
      const noDriftInput: PhysicsInput = { ...driftInput, drift: false };

      state = updatePhysics(state, driftInput, config, 1 / 60);
      expect(state.driftDuration).toBeGreaterThan(0);
      expect(state.driftDuration).toBeLessThan(0.5);
      const speedBeforeRelease = state.speed;

      state = updatePhysics(state, noDriftInput, config, 1 / 60);

      expect(state.speed).toBeLessThan(speedBeforeRelease);
      expect(state.driftDuration).toBe(0);
    });

    it('drift duration resets when drift ends', () => {
      let state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const driftInput: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: true,
        boost: false,
      };
      const noDriftInput: PhysicsInput = { ...driftInput, drift: false };

      for (let i = 0; i < 10; i++) {
        state = updatePhysics(state, driftInput, config, 1 / 60);
      }

      expect(state.driftDuration).toBeGreaterThan(0);

      state = updatePhysics(state, noDriftInput, config, 1 / 60);

      expect(state.driftDuration).toBe(0);
    });
  });

  describe('Boost mechanics', () => {
    it('boost increases acceleration', () => {
      const s0: PhysicsState = { ...createDefaultPhysicsState(), speed: 0 };
      const config = createDefaultPhysicsConfig();
      const inputNormal: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: false,
      };
      const inputBoosted: PhysicsInput = { ...inputNormal, boost: true };
      const normalNext = updatePhysics(s0, inputNormal, config, 1 / 60);
      const boostedNext = updatePhysics(s0, inputBoosted, config, 1 / 60);
      expect(boostedNext.speed).toBeGreaterThan(normalNext.speed);
    });

    it('boost meter drains while boosting', () => {
      let state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const boostInput: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: true,
      };

      state = updatePhysics(state, boostInput, config, 1);

      expect(state.boostMeter).toBeLessThan(100);
      expect(state.boostMeter).toBeCloseTo(75, 0);
    });

    it('boost meter does not go below 0', () => {
      let state = createDefaultPhysicsState();
      const config = createDefaultPhysicsConfig();
      const boostInput: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: true,
      };

      for (let i = 0; i < 10; i++) {
        state = updatePhysics(state, boostInput, config, 1);
      }

      expect(state.boostMeter).toBe(0);
      expect(state.boostMeter).toBeGreaterThanOrEqual(0);
    });

    it('boost meter regens when not boosting', () => {
      let state: PhysicsState = { ...createDefaultPhysicsState(), boostMeter: 0 };
      const config = createDefaultPhysicsConfig();
      const noBoostInput: PhysicsInput = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: false,
      };

      state = updatePhysics(state, noBoostInput, config, 1);

      expect(state.boostMeter).toBeGreaterThan(0);
      expect(state.boostMeter).toBeCloseTo(2, 0);
    });

    it('boost does not activate when meter is 0', () => {
      let state: PhysicsState = { ...createDefaultPhysicsState(), boostMeter: 0 };
      const config = createDefaultPhysicsConfig();
      const boostInput: PhysicsInput = {
        forward: true,
        backward: false,
        left: false,
        right: false,
        drift: false,
        boost: true,
      };
      const normalInput: PhysicsInput = { ...boostInput, boost: false };

      const boostedNext = updatePhysics(state, boostInput, config, 1 / 60);
      const normalNext = updatePhysics(state, normalInput, config, 1 / 60);

      expect(boostedNext.speed).toBe(normalNext.speed);
    });
  });
});
