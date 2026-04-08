import * as THREE from 'three';

export interface ChaseCamera {
  camera: THREE.PerspectiveCamera;
  offset: THREE.Vector3;       // (0, 5, -10) — behind and above
  lerpFactor: number;          // 0.05
  idealPosition: THREE.Vector3; // scratch vector, reused each frame
}

export function createChaseCamera(camera: THREE.PerspectiveCamera): ChaseCamera {
  return {
    camera,
    offset: new THREE.Vector3(0, 5, -10),
    lerpFactor: 0.05,
    idealPosition: new THREE.Vector3(),
  };
}

export function updateChaseCamera(
  chaseCamera: ChaseCamera,
  carPosition: THREE.Vector3,
  carRotationY: number,
): void {
  // Rotate offset by car's Y rotation
  const rotatedOffset = chaseCamera.offset.clone();
  rotatedOffset.applyEuler(new THREE.Euler(0, carRotationY, 0));

  // Ideal camera position = car position + rotated offset
  chaseCamera.idealPosition.copy(carPosition).add(rotatedOffset);

  // Lerp camera toward ideal position
  chaseCamera.camera.position.lerp(chaseCamera.idealPosition, chaseCamera.lerpFactor);

  // Look at car position
  chaseCamera.camera.lookAt(carPosition);
}
