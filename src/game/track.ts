import * as THREE from 'three';

export interface TrackData {
  spline: THREE.CatmullRomCurve3;
  wallMeshes: THREE.Mesh[];
  obstacleMeshes: THREE.Mesh[];
  trackWidth: number;
  trackMesh: THREE.Mesh;
}

export function getClosestPointOnSpline(
  position: THREE.Vector3,
  spline: THREE.CatmullRomCurve3,
): { point: THREE.Vector3; t: number; distance: number } {
  const coarseSamples = 100;
  let closestT = 0;
  let closestDist = Infinity;

  for (let i = 0; i <= coarseSamples; i++) {
    const sampleT = i / coarseSamples;
    const samplePoint = spline.getPointAt(sampleT);
    const sampleDist = position.distanceTo(samplePoint);
    if (sampleDist < closestDist) {
      closestDist = sampleDist;
      closestT = sampleT;
    }
  }

  let lowT = Math.max(0, closestT - 1 / coarseSamples);
  let highT = Math.min(1, closestT + 1 / coarseSamples);

  for (let iteration = 0; iteration < 10; iteration++) {
    const midT = (lowT + highT) / 2;
    const leftProbeT = (lowT + midT) / 2;
    const rightProbeT = (midT + highT) / 2;

    const leftDist = position.distanceTo(spline.getPointAt(leftProbeT));
    const rightDist = position.distanceTo(spline.getPointAt(rightProbeT));

    if (leftDist < rightDist) {
      highT = midT;
    } else {
      lowT = midT;
    }
  }

  const finalT = (lowT + highT) / 2;
  const finalPoint = spline.getPointAt(finalT);
  const finalDist = position.distanceTo(finalPoint);

  return { point: finalPoint, t: finalT, distance: finalDist };
}

function buildRoadSurface(
  spline: THREE.CatmullRomCurve3,
  trackWidth: number,
): THREE.Mesh {
  const halfWidth = trackWidth / 2;
  const numSegments = 200;
  const splinePoints = spline.getPoints(numSegments);

  const positions: number[] = [];
  const indices: number[] = [];
  const upVector = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < splinePoints.length; i++) {
    const segmentPoint = splinePoints[i];
    const paramT = i / numSegments;
    const tangent = spline.getTangent(paramT);
    const perpendicular = new THREE.Vector3()
      .crossVectors(tangent, upVector)
      .normalize();

    positions.push(
      segmentPoint.x - perpendicular.x * halfWidth,
      segmentPoint.y + 0.01, // +0.01 Y avoids z-fighting with ground plane at Y=0
      segmentPoint.z - perpendicular.z * halfWidth,
    );
    positions.push(
      segmentPoint.x + perpendicular.x * halfWidth,
      segmentPoint.y + 0.01,
      segmentPoint.z + perpendicular.z * halfWidth,
    );
  }

  // CCW winding: leftCurrent → rightCurrent → leftNext produces upward-facing normals
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const leftCurrent = i * 2;
    const rightCurrent = i * 2 + 1;
    const leftNext = (i + 1) * 2;
    const rightNext = (i + 1) * 2 + 1;

    indices.push(leftCurrent, rightCurrent, leftNext);
    indices.push(rightCurrent, rightNext, leftNext);
  }

  const roadGeometry = new THREE.BufferGeometry();
  roadGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  roadGeometry.setIndex(indices);
  roadGeometry.computeVertexNormals();

  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
  roadMesh.name = 'trackRoad';

  return roadMesh;
}

function buildWalls(
  spline: THREE.CatmullRomCurve3,
  scene: THREE.Scene,
): THREE.Mesh[] {
  const wallMeshes: THREE.Mesh[] = [];
  const wallBlockGeo = new THREE.BoxGeometry(1, 2, 2);
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xcc2222 });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const upVector = new THREE.Vector3(0, 1, 0);
  const splineLength = spline.getLength();
  const wallSpacing = 10;
  const wallCount = Math.floor(splineLength / wallSpacing);

  for (let i = 0; i < wallCount; i++) {
    const arcT = i / wallCount;
    const wallCenter = spline.getPointAt(arcT);
    const tangent = spline.getTangentAt(arcT);
    const perpendicular = new THREE.Vector3()
      .crossVectors(tangent, upVector)
      .normalize();

    const wallMaterial = i % 2 === 0 ? redMaterial : whiteMaterial;

    const innerWall = new THREE.Mesh(wallBlockGeo, wallMaterial);
    innerWall.position.set(
      wallCenter.x - perpendicular.x * 11,
      1,
      wallCenter.z - perpendicular.z * 11,
    );
    innerWall.lookAt(
      innerWall.position.x + tangent.x,
      1,
      innerWall.position.z + tangent.z,
    );
    innerWall.name = `wallInner_${i}`;
    scene.add(innerWall);
    wallMeshes.push(innerWall);

    const outerWall = new THREE.Mesh(wallBlockGeo, wallMaterial);
    outerWall.position.set(
      wallCenter.x + perpendicular.x * 11,
      1,
      wallCenter.z + perpendicular.z * 11,
    );
    outerWall.lookAt(
      outerWall.position.x + tangent.x,
      1,
      outerWall.position.z + tangent.z,
    );
    outerWall.name = `wallOuter_${i}`;
    scene.add(outerWall);
    wallMeshes.push(outerWall);
  }

  return wallMeshes;
}

function buildObstacles(
  spline: THREE.CatmullRomCurve3,
  scene: THREE.Scene,
): THREE.Mesh[] {
  const obstacleMeshes: THREE.Mesh[] = [];
  const obstacleGeo = new THREE.BoxGeometry(1, 1, 1);
  const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
  const upVector = new THREE.Vector3(0, 1, 0);

  const obstaclePlacements: [number, number][] = [
    [0.1, 3],
    [0.2, -3],
    [0.35, 3],
    [0.5, -3],
    [0.65, 3],
    [0.8, -3],
  ];

  for (const [arcT, lateralOffset] of obstaclePlacements) {
    const obstacleCenter = spline.getPointAt(arcT);
    const tangent = spline.getTangentAt(arcT);
    const perpendicular = new THREE.Vector3()
      .crossVectors(tangent, upVector)
      .normalize();

    const obstacle = new THREE.Mesh(obstacleGeo, obstacleMaterial);
    obstacle.position.set(
      obstacleCenter.x + perpendicular.x * lateralOffset,
      0.5,
      obstacleCenter.z + perpendicular.z * lateralOffset,
    );
    obstacle.name = `obstacle_${obstacleMeshes.length}`;
    scene.add(obstacle);
    obstacleMeshes.push(obstacle);
  }

  return obstacleMeshes;
}

export function createTrack(scene: THREE.Scene): TrackData {
  const controlPoints = [
    new THREE.Vector3(80, 0, 0),
    new THREE.Vector3(60, 0, -35),
    new THREE.Vector3(0, 0, -50),
    new THREE.Vector3(-60, 0, -35),
    new THREE.Vector3(-80, 0, 0),
    new THREE.Vector3(-60, 0, 35),
    new THREE.Vector3(0, 0, 50),
    new THREE.Vector3(60, 0, 35),
  ];

  const spline = new THREE.CatmullRomCurve3(controlPoints, true);
  const trackWidth = 20;

  const trackMesh = buildRoadSurface(spline, trackWidth);
  scene.add(trackMesh);

  const wallMeshes = buildWalls(spline, scene);
  const obstacleMeshes = buildObstacles(spline, scene);

  window.__DEBUG__.obstacleCount = obstacleMeshes.length;

  return {
    spline,
    wallMeshes,
    obstacleMeshes,
    trackWidth,
    trackMesh,
  };
}
