import type { PhysicsInput } from '../types/index.js';

export interface InputManager {
  getState(): PhysicsInput;
  dispose(): void;
}

function shouldPreventDefault(code: string): boolean {
  return code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight';
}

export function createInputManager(): InputManager {
  const keys: Record<string, boolean> = {};

  function onKeyDown(event: KeyboardEvent): void {
    keys[event.code] = true;

    if (shouldPreventDefault(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    keys[event.code] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    getState(): PhysicsInput {
      return {
        forward: !!(keys.KeyW || keys.ArrowUp),
        backward: !!(keys.KeyS || keys.ArrowDown),
        left: !!(keys.KeyA || keys.ArrowLeft),
        right: !!(keys.KeyD || keys.ArrowRight),
        drift: !!(keys.ShiftLeft || keys.ShiftRight),
        boost: !!keys.Space,
      };
    },
    dispose(): void {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
