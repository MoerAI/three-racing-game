import * as THREE from 'three';
import { debugState } from '../debug.js';

export interface CarData {
  group: THREE.Group;
}

export function createCar(scene: THREE.Scene): CarData {
  const group = new THREE.Group();

  // Car body — main chassis
  const bodyGeo = new THREE.BoxGeometry(2, 0.5, 4);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2244ff });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'body';
  group.add(body);

  // Cabin on top of body
  const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 2);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x3355ff });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.name = 'cabin';
  cabin.position.set(0, 0.5, -0.5);
  group.add(cabin);

  // 4 wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const wheelPositions: [string, number, number, number][] = [
    ['wheelFL', 0.9, -0.1, 1.2],
    ['wheelFR', -0.9, -0.1, 1.2],
    ['wheelRL', 0.9, -0.1, -1.2],
    ['wheelRR', -0.9, -0.1, -1.2],
  ];

  for (const [name, x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.name = name;
    wheel.rotation.z = Math.PI / 2; // rotate to stand upright
    wheel.position.set(x, y, z);
    group.add(wheel);
  }

  // Initial position at track start area
  group.position.set(0, 0.25, 0);

  scene.add(group);

  // Update debug state
  debugState.carPosition = { x: 0, y: 0.25, z: 0 };
  debugState.carParts = ['body', 'cabin', 'wheelFL', 'wheelFR', 'wheelRL', 'wheelRR'];

  return { group };
}

export function updateWheels(car: CarData, speed: number, steerAngle: number, dt: number): void {
  const wheelFL = car.group.getObjectByName('wheelFL') as THREE.Mesh | null;
  const wheelFR = car.group.getObjectByName('wheelFR') as THREE.Mesh | null;
  const wheelRL = car.group.getObjectByName('wheelRL') as THREE.Mesh | null;
  const wheelRR = car.group.getObjectByName('wheelRR') as THREE.Mesh | null;

  // Rotation speed from forward speed
  const rotSpeed = speed * dt * 2;

  if (wheelFL) wheelFL.rotation.x += rotSpeed;
  if (wheelFR) wheelFR.rotation.x += rotSpeed;
  if (wheelRL) wheelRL.rotation.x += rotSpeed;
  if (wheelRR) wheelRR.rotation.x += rotSpeed;

  // Front wheel steering
  if (wheelFL) wheelFL.rotation.y = steerAngle * 0.4;
  if (wheelFR) wheelFR.rotation.y = steerAngle * 0.4;
}
