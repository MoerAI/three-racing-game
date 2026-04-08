import * as THREE from 'three';

export interface CollisionSystem {
  wallMeshes: THREE.Mesh[];
  obstacleMeshes: THREE.Mesh[];
  raycaster: THREE.Raycaster;
}

export interface CollisionResult {
  hit: boolean;
  normal: THREE.Vector3;
  distance: number;
  isObstacle: boolean;
}

export function createCollisionSystem(
  wallMeshes: THREE.Mesh[],
  obstacleMeshes: THREE.Mesh[],
): CollisionSystem {
  const raycaster = new THREE.Raycaster();
  return { wallMeshes, obstacleMeshes, raycaster };
}

export function checkCollisions(
  collisionSystem: CollisionSystem,
  carPosition: THREE.Vector3,
  carRotationY: number,
  rayDistance: number = 3,
): CollisionResult[] {
  const collisionResults: CollisionResult[] = [];
  const allMeshes = [...collisionSystem.wallMeshes, ...collisionSystem.obstacleMeshes];

  // 5 ray directions in car-local space (angles relative to car forward)
  const rayAngles = [0, Math.PI / 6, -Math.PI / 6, Math.PI / 2, -Math.PI / 2];
  // forward, fwd-right, fwd-left, right, left

  const rayOrigin = new THREE.Vector3(carPosition.x, 0.5, carPosition.z);

  for (const angleOffset of rayAngles) {
    const worldAngle = carRotationY + angleOffset;
    const direction = new THREE.Vector3(
      Math.sin(worldAngle),
      0,
      Math.cos(worldAngle),
    );

    collisionSystem.raycaster.set(rayOrigin, direction);
    collisionSystem.raycaster.far = rayDistance;

    const intersects = collisionSystem.raycaster.intersectObjects(allMeshes, false);

    if (intersects.length > 0) {
      const closestHit = intersects[0];
      const isObstacle = collisionSystem.obstacleMeshes.includes(closestHit.object as THREE.Mesh);
      const hitNormal = closestHit.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1);
      // Transform normal from object space to world space
      hitNormal.transformDirection(closestHit.object.matrixWorld);

      collisionResults.push({
        hit: true,
        normal: hitNormal,
        distance: closestHit.distance,
        isObstacle,
      });
    }
  }

  return collisionResults;
}

export function applyCollisionResponse(
  physicsState: { speed: number; rotation: number; position: { x: number; z: number } },
  collisionResults: CollisionResult[],
): { speed: number; rotation: number; position: { x: number; z: number } } {
  if (collisionResults.length === 0) return physicsState;

  let { speed, rotation, position } = physicsState;

  for (const collisionResult of collisionResults) {
    if (!collisionResult.hit) continue;

    if (collisionResult.isObstacle) {
      speed *= 0.3;
    } else {
      // Slide-along-wall: project velocity onto wall surface
      const velX = Math.sin(rotation) * speed;
      const velZ = Math.cos(rotation) * speed;
      const normalX = collisionResult.normal.x;
      const normalZ = collisionResult.normal.z;
      const dotProduct = velX * normalX + velZ * normalZ;
      const slideX = velX - dotProduct * normalX;
      const slideZ = velZ - dotProduct * normalZ;
      const slideMagnitude = Math.sqrt(slideX * slideX + slideZ * slideZ);
      speed = slideMagnitude * 0.8;
      if (slideMagnitude > 0.1) {
        rotation = Math.atan2(slideX, slideZ);
      }
      // Push car out of wall
      position = {
        x: position.x + normalX * 0.5,
        z: position.z + normalZ * 0.5,
      };
    }
  }

  return { speed, rotation, position };
}
