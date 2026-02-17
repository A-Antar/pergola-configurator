/**
 * Profile-based geometry helpers.
 * Converts 2D mm profiles into THREE.js ExtrudeGeometry.
 *
 * Usage:
 *   const geo = buildExtrudedProfile('probeam-150', 5.0); // 5m long beam
 *   <mesh geometry={geo} material={frameMat} />
 */

import * as THREE from 'three';
import { PROFILES, type Profile2D } from '@/data/profiles/beam-profiles';

/** mm → metres */
const mm = (v: number) => v / 1000;

/**
 * Build a THREE.ExtrudeGeometry from a named profile.
 * The extrusion runs along the Z axis (length).
 * Profile is centered on its bounding box.
 *
 * @param profileId - key in PROFILES map
 * @param lengthMetres - extrusion length in metres
 * @returns THREE.ExtrudeGeometry centered at origin
 */
export function buildExtrudedProfile(profileId: string, lengthMetres: number): THREE.BufferGeometry {
  const profile = PROFILES[profileId];
  if (!profile) {
    console.warn(`Profile "${profileId}" not found, falling back to box`);
    return new THREE.BoxGeometry(0.15, 0.15, lengthMetres);
  }

  return extrudeFromPoints(profile.points, lengthMetres);
}

/**
 * Build extrusion from raw 2D points (mm) and length (metres).
 */
export function extrudeFromPoints(pointsMm: [number, number][], lengthMetres: number): THREE.ExtrudeGeometry {
  // Find bounding box for centering
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pointsMm) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // Create shape centered at origin, converted to metres
  const shape = new THREE.Shape();
  pointsMm.forEach(([x, y], i) => {
    const mx = mm(x - cx);
    const my = mm(y - cy);
    if (i === 0) shape.moveTo(mx, my);
    else shape.lineTo(mx, my);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: lengthMetres,
    bevelEnabled: false,
  });

  // Center the extrusion along Z
  geo.translate(0, 0, -lengthMetres / 2);

  return geo;
}

/**
 * Get profile dimensions in metres (for bounding box calculations).
 */
export function getProfileDimensions(profileId: string): { width: number; height: number } {
  const profile = PROFILES[profileId];
  if (!profile) return { width: 0.15, height: 0.15 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of profile.points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { width: mm(maxX - minX), height: mm(maxY - minY) };
}
