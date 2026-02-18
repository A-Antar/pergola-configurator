/**
 * Centralized PBR Material Library
 * =================================
 * All materials for the 3D patio configurator.
 *
 * ## Adding a new material preset
 * 1. Add a new entry to the relevant category (frame, roof, etc.)
 * 2. Specify color (hex), metalness, roughness, and optional envMapIntensity
 * 3. The material will be created as a THREE.MeshPhysicalMaterial for best PBR results
 *
 * ## Adding a new environment preset
 * See PatioScene.tsx LIGHTING constant. Add a new key with ambient/dir1/dir2/env/fogColor.
 */

import * as THREE from "three";

// ─── Material Factory ──────────────────────────────────────

export interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
}

const materialCache = new Map<string, THREE.MeshPhysicalMaterial>();

export function createPBRMaterial(config: MaterialConfig): THREE.MeshPhysicalMaterial {
  const key = JSON.stringify(config);
  if (materialCache.has(key)) return materialCache.get(key)!;

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.color),
    metalness: config.metalness,
    roughness: config.roughness,
    envMapIntensity: config.envMapIntensity ?? 1.2,
    clearcoat: config.clearcoat ?? 0,
    clearcoatRoughness: config.clearcoatRoughness ?? 0.1,
  });

  materialCache.set(key, mat);
  return mat;
}

// ─── Frame Materials (Powdercoated Aluminum) ───────────────
// High envMapIntensity ensures dark colors reflect environment and stay visible

export function createFrameMaterial(hex: string): THREE.MeshPhysicalMaterial {
  // Detect if color is very dark
  const c = new THREE.Color(hex);
  const luminance = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  const isDark = luminance < 0.15;

  return createPBRMaterial({
    color: hex,
    metalness: 0.45,
    roughness: 0.55,
    // Dark colors get boosted env reflection to prevent black-on-black loss
    envMapIntensity: isDark ? 2.0 : 1.3,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
  });
}

// ─── Roof Sheet Materials ──────────────────────────────────

export function createRoofMaterial(
  material: 'insulated' | 'colorbond',
  frameColor: string,
): THREE.MeshPhysicalMaterial {
  if (material === 'insulated') {
    return createPBRMaterial({
      color: '#e8e0d0',
      metalness: 0.15,
      roughness: 0.65,
      envMapIntensity: 0.8,
    });
  }
  // Colorbond — metallic sheet
  return createPBRMaterial({
    color: frameColor,
    metalness: 0.6,
    roughness: 0.35,
    envMapIntensity: 1.5,
    clearcoat: 0.15,
    clearcoatRoughness: 0.3,
  });
}

// ─── Static Materials ──────────────────────────────────────

export const MATERIALS = {
  ground: createPBRMaterial({
    color: '#b5ada0',
    metalness: 0,
    roughness: 0.95,
    envMapIntensity: 0.3,
  }),

  wall: createPBRMaterial({
    color: '#d4ccc0',
    metalness: 0,
    roughness: 0.85,
    envMapIntensity: 0.4,
  }),

  bracket: createPBRMaterial({
    color: '#4a4a4a',
    metalness: 0.7,
    roughness: 0.35,
    envMapIntensity: 1.5,
  }),

  insulatedUnderside: createPBRMaterial({
    color: '#f5edd8',
    metalness: 0.05,
    roughness: 0.75,
    envMapIntensity: 0.5,
  }),

  skylight: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#88ccff'),
    transparent: true,
    opacity: 0.2,
    transmission: 0.85,
    roughness: 0.05,
    envMapIntensity: 1.0,
  }),

  lightFixture: createPBRMaterial({
    color: '#2a2a2a',
    metalness: 0.85,
    roughness: 0.25,
    envMapIntensity: 2.0,
  }),

  fanMetal: createPBRMaterial({
    color: '#3a3a3a',
    metalness: 0.75,
    roughness: 0.3,
    envMapIntensity: 1.8,
  }),
};

// ─── Quality Presets ───────────────────────────────────────

export type QualityLevel = 'high' | 'balanced' | 'low';

export interface QualitySettings {
  shadows: boolean;
  shadowMapSize: number;
  envMapIntensity: number;
  contactShadowBlur: number;
  contactShadowOpacity: number;
  maxLights: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    shadows: true,
    shadowMapSize: 2048,
    envMapIntensity: 1.0,
    contactShadowBlur: 3,
    contactShadowOpacity: 0.6,
    maxLights: 8,
  },
  balanced: {
    shadows: true,
    shadowMapSize: 1024,
    envMapIntensity: 0.8,
    contactShadowBlur: 2,
    contactShadowOpacity: 0.45,
    maxLights: 4,
  },
  low: {
    shadows: false,
    shadowMapSize: 512,
    envMapIntensity: 0.5,
    contactShadowBlur: 1.5,
    contactShadowOpacity: 0.3,
    maxLights: 2,
  },
};
