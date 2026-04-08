import * as THREE from 'three';

export interface Minimap {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  trackPoints: THREE.Vector3[];
  size: number;
  worldBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export function createMinimap(spline: THREE.CatmullRomCurve3): Minimap {
  const canvas = document.createElement('canvas');
  canvas.id = 'minimap';
  canvas.width = 150;
  canvas.height = 150;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const size = 150;

  // Pre-sample 100 points from spline for track outline
  const trackPoints = spline.getPoints(100);

  // Compute world bounds from track points
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const pt of trackPoints) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.z < minZ) minZ = pt.z;
    if (pt.z > maxZ) maxZ = pt.z;
  }
  // Add padding
  const padX = (maxX - minX) * 0.1;
  const padZ = (maxZ - minZ) * 0.1;
  minX -= padX;
  maxX += padX;
  minZ -= padZ;
  maxZ += padZ;

  return { canvas, ctx, trackPoints, size, worldBounds: { minX, maxX, minZ, maxZ } };
}

// Convert world XZ to minimap pixel coordinates
function worldToMinimap(
  worldX: number,
  worldZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  size: number,
): { px: number; py: number } {
  const px = ((worldX - bounds.minX) / (bounds.maxX - bounds.minX)) * size;
  const py = ((worldZ - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * size;
  return { px, py };
}

export function updateMinimap(
  minimap: Minimap,
  carPosition: THREE.Vector3,
  carRotationY: number,
): void {
  const { ctx, trackPoints, size, worldBounds } = minimap;

  // Clear
  ctx.clearRect(0, 0, size, size);

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw track outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < trackPoints.length; i++) {
    const { px, py } = worldToMinimap(trackPoints[i].x, trackPoints[i].z, worldBounds, size);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw car dot (red)
  const { px: carPx, py: carPy } = worldToMinimap(
    carPosition.x,
    carPosition.z,
    worldBounds,
    size,
  );
  ctx.fillStyle = '#ff3333';
  ctx.beginPath();
  ctx.arc(carPx, carPy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw direction arrow (short line from car in forward direction)
  const arrowLen = 8;
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(carPx, carPy);
  ctx.lineTo(
    carPx - Math.sin(carRotationY) * arrowLen,
    carPy + Math.cos(carRotationY) * arrowLen,
  );
  ctx.stroke();
}
