/**
 * Centralized PBR Material Library
 * =================================
 * All materials for the 3D patio configurator.
 *
 * ## Finish Modes
 * Matte / Satin / Gloss / Mirror — each maps to roughness + clearcoat presets.
 *
 * ## Reflection Strength
 * Controls envMapIntensity (0.8–3.2). Requires a real HDRI environment map on the scene.
 */

import * as THREE from "three";
import type { FrameFinish } from "@/types/configurator";

// ─── Material Factory ──────────────────────────────────────

export interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  ior?: number;
  specularIntensity?: number;
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
    ior: config.ior ?? 1.5,
    specularIntensity: config.specularIntensity ?? 1.0,
  });

  materialCache.set(key, mat);
  return mat;
}

// ─── Finish Presets ────────────────────────────────────────

interface FinishPreset {
  roughness: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

const FINISH_PRESETS: Record<FrameFinish, FinishPreset> = {
  matte:  { roughness: 0.45, clearcoatRoughness: 0.20, envMapIntensity: 1.4 },
  satin:  { roughness: 0.28, clearcoatRoughness: 0.12, envMapIntensity: 1.8 },
  gloss:  { roughness: 0.18, clearcoatRoughness: 0.06, envMapIntensity: 2.2 },
  mirror: { roughness: 0.06, clearcoatRoughness: 0.03, envMapIntensity: 2.8 },
};

// ─── Powder-Coated Aluminium (single source of truth) ─────

export function createFrameMaterial(
  hex: string,
  finish: FrameFinish = 'gloss',
  reflectionStrength?: number,
): THREE.MeshPhysicalMaterial {
  const preset = FINISH_PRESETS[finish];
  const envIntensity = reflectionStrength ?? preset.envMapIntensity;

  return createPBRMaterial({
    color: hex,
    metalness: 0.1,           // painted/clearcoated, not raw metal
    roughness: preset.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: preset.clearcoatRoughness,
    ior: 1.45,
    specularIntensity: 1.0,
    envMapIntensity: Math.min(envIntensity, 3.2), // clamp to avoid artifacts
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
    color: '#2c2c2c',
    metalness: 0.85,
    roughness: 0.15,
    envMapIntensity: 2.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05,
  }),

  /** Beam-to-beam bracket — slightly lighter to distinguish from post bracket */
  beamBracket: createPBRMaterial({
    color: '#383838',
    metalness: 0.9,
    roughness: 0.12,
    envMapIntensity: 2.8,
    clearcoat: 0.9,
    clearcoatRoughness: 0.04,
  }),

  /** Post cap — distinct dark gunmetal */
  postCap: createPBRMaterial({
    color: '#222222',
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 2.2,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
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

  /** Chrome sphere for QA reflection testing */
  chromeSphere: createPBRMaterial({
    color: '#ffffff',
    metalness: 1.0,
    roughness: 0.0,
    envMapIntensity: 3.0,
    clearcoat: 0,
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
