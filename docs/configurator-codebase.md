# Patio Configurator — Full Codebase Reference

## Table of Contents
1. [Types & Config](#types--config)
2. [3D Scene](#3d-scene)
3. [Patio Mesh (812 lines)](#patio-mesh)
4. [Debug Overlay](#debug-overlay)
5. [Wall Editor Mesh](#wall-editor-mesh)
6. [Materials Library](#materials-library)
7. [Patio Engine](#patio-engine)
8. [Profile Geometry](#profile-geometry)
9. [Beam Profiles](#beam-profiles)
10. [Stratco Catalog](#stratco-catalog)
11. [Config Wizard](#config-wizard)
12. [Wall Editor Panel](#wall-editor-panel)
13. [Quote Panel](#quote-panel)
14. [Lead Capture Dialog](#lead-capture-dialog)
15. [Patio Configurator Page](#patio-configurator-page)
16. [Index CSS (Theme)](#index-css)
17. [App Router](#app-router)

---

## Types & Config
**File: `src/types/configurator.ts`**

```typescript
export type ProductLine = 'patios' | 'louvre' | 'carports' | 'sunrooms' | 'decking' | 'ezi-slat';

export type AttachmentSide = 'back' | 'left' | 'right';
export type WallSide = 'back' | 'left' | 'right' | 'front';

export interface WallConfig {
  enabled: boolean;
  /** Wall height in mm */
  height: number;
  /** Wall thickness in mm */
  thickness: number;
  /** Offset from default position in mm (positive = outward) */
  offset: number;
  /** Wall length in mm (auto-calculated from patio dims, user can override) */
  length: number;
}

export type WallsConfig = Record<WallSide, WallConfig>;

export type FrameFinish = 'matte' | 'satin' | 'gloss' | 'mirror';
export type HdriPreset = 'day' | 'studio';

export interface PatioConfig {
  material: 'insulated' | 'colorbond';
  colorbondType: 'superdek' | 'flatdek';
  shape: 'flat' | 'gable';
  style: 'skillion' | 'fly-over' | 'free-standing' | 'skyline' | 'timber-look';
  width: number;
  depth: number;
  height: number;
  frameColor: string;
  frameFinish: FrameFinish;
  reflectionStrength: number;
  hdriPreset: HdriPreset;
  attachedSides: AttachmentSide[];
  walls: WallsConfig;
  accessories: {
    lighting: boolean;
    fans: boolean;
    gutters: boolean;
    designerBeam: boolean;
    columns: boolean;
  };
}

export function createDefaultWall(lengthMm: number): WallConfig {
  return { enabled: false, height: 2800, thickness: 200, offset: 0, length: lengthMm };
}

export function createDefaultWalls(widthM: number, depthM: number): WallsConfig {
  return {
    back: { enabled: true, height: 2800, thickness: 200, offset: 0, length: Math.round(widthM * 1000) },
    left: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(depthM * 1000) },
    right: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(depthM * 1000) },
    front: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(widthM * 1000) },
  };
}

export const FRAME_COLORS: { name: string; hex: string }[] = [
  { name: 'Surfmist', hex: '#e8e4da' },
  { name: 'Monument', hex: '#2d2c2b' },
  { name: 'Night Sky', hex: '#1a1a1a' },
  { name: 'Shale Grey', hex: '#b0a99f' },
  { name: 'Basalt', hex: '#6b6860' },
  { name: 'Woodland Grey', hex: '#4d4f47' },
  { name: 'Ironstone', hex: '#3c3228' },
  { name: 'Pale Eucalypt', hex: '#6b8c5a' },
];

export const DEFAULT_PATIO_CONFIG: PatioConfig = {
  material: 'insulated',
  colorbondType: 'superdek',
  shape: 'flat',
  style: 'fly-over',
  width: 5,
  depth: 3.5,
  height: 2.8,
  frameColor: '#2d2c2b',
  frameFinish: 'gloss',
  reflectionStrength: 2.2,
  hdriPreset: 'day',
  attachedSides: ['back'],
  walls: createDefaultWalls(5, 3.5),
  accessories: {
    lighting: false,
    fans: false,
    gutters: true,
    designerBeam: false,
    columns: false,
  },
};

export interface PricingProfile {
  id: string;
  productLine: ProductLine;
  profileName: string;
  minCharge: number;
  minSize: number;
  ratePerM2: number;
  optionAdders: Record<string, number>;
}

export interface LeadData {
  serviceType: ProductLine;
  configJson: PatioConfig;
  estimateMin: number;
  estimateMax: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  suburb: string;
  jobRequirements: string;
  estimatedSize: number;
}

export const PATIO_PRICING: Record<string, PricingProfile> = {
  insulated: {
    id: 'insulated',
    productLine: 'patios',
    profileName: 'Insulated Panel',
    minCharge: 6500,
    minSize: 9,
    ratePerM2: 420,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1800,
    },
  },
  colorbond_superdek: {
    id: 'colorbond_superdek',
    productLine: 'patios',
    profileName: 'Colorbond Superdek',
    minCharge: 4800,
    minSize: 9,
    ratePerM2: 310,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1500,
    },
  },
  colorbond_flatdek: {
    id: 'colorbond_flatdek',
    productLine: 'patios',
    profileName: 'Colorbond Flatdek',
    minCharge: 4200,
    minSize: 9,
    ratePerM2: 280,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1400,
    },
  },
};
```

---

## 3D Scene
**File: `src/components/configurator/PatioScene.tsx`**

```tsx
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import PatioMesh from "./PatioMesh";
import WallEditorMesh from "./WallEditorMesh";
import DebugOverlay from "./DebugOverlay";
import type { PatioConfig, WallSide, HdriPreset } from "@/types/configurator";
import type { Part } from "@/lib/patio-engine";
import { QUALITY_PRESETS, type QualityLevel } from "@/lib/materials";
import { useRef, useCallback, useState, useEffect } from "react";
import {
  Camera, RotateCcw, RotateCw, Eye, Sun, Warehouse,
} from "lucide-react";
import * as THREE from "three";

interface PatioSceneProps {
  config: PatioConfig;
  onPartClick?: (part: string) => void;
  debugMode?: boolean;
  debugParts?: Part[];
  showDebugLabels?: boolean;
  quality?: QualityLevel;
  onQualityChange?: (q: QualityLevel) => void;
  wallEditMode?: boolean;
  selectedWall?: WallSide | null;
  onSelectWall?: (side: WallSide | null) => void;
  onConfigChange?: (config: PatioConfig) => void;
}

type CameraPreset = 'iso' | 'front' | 'left' | 'right' | 'under' | 'top';
type SceneMode = 'studio' | 'environment';

const HDRI_FILES: Record<HdriPreset, string> = {
  day: '/hdr/bright_day_2k.hdr',
  studio: '/hdr/studio_soft_2k.hdr',
};

/* ── Smooth camera animator ──────────────────────────────── */
function CameraAnimator({ targetPos, targetLookAt, enabled, onComplete }: {
  targetPos: THREE.Vector3 | null;
  targetLookAt: THREE.Vector3 | null;
  enabled: boolean;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const progress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    if (enabled && targetPos && targetLookAt) {
      startPos.current.copy(camera.position);
      progress.current = 0;
      animating.current = true;
    }
  }, [enabled, targetPos, targetLookAt, camera]);

  useFrame((_, delta) => {
    if (!animating.current || !targetPos || !targetLookAt) return;
    progress.current = Math.min(1, progress.current + delta * 2.5);
    const t = easeInOutCubic(progress.current);
    camera.position.lerpVectors(startPos.current, targetPos, t);
    if (progress.current >= 1) {
      animating.current = false;
      onComplete();
    }
  });

  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── Auto-rotate component ───────────────────────────────── */
function AutoRotate({ enabled, speed = 0.3 }: { enabled: boolean; speed?: number }) {
  const { camera } = useThree();
  const angle = useRef(0);
  const radius = useRef(0);
  const centerY = useRef(0);

  useEffect(() => {
    if (enabled) {
      const pos = camera.position;
      radius.current = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      angle.current = Math.atan2(pos.z, pos.x);
      centerY.current = pos.y;
    }
  }, [enabled, camera]);

  useFrame((_, delta) => {
    if (!enabled) return;
    angle.current += delta * speed;
    camera.position.x = Math.cos(angle.current) * radius.current;
    camera.position.z = Math.sin(angle.current) * radius.current;
    camera.lookAt(0, centerY.current * 0.5, 0);
  });

  return null;
}

export default function PatioScene({
  config, onPartClick, debugMode, debugParts, showDebugLabels,
  quality: externalQuality, onQualityChange,
  wallEditMode, selectedWall, onSelectWall, onConfigChange,
}: PatioSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const [showDims, setShowDims] = useState<'off' | 'key' | 'all'>('off');
  const [autoRotate, setAutoRotate] = useState(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>('studio');
  const [internalQuality, setInternalQuality] = useState<QualityLevel>('balanced');
  const quality = externalQuality ?? internalQuality;
  const qSettings = QUALITY_PRESETS[quality];

  // Camera animation state
  const [camTarget, setCamTarget] = useState<{ pos: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);
  const [animating, setAnimating] = useState(false);

  const camDist = Math.max(config.width, config.depth) * 1.1 + 3;
  const hdriFile = HDRI_FILES[config.hdriPreset ?? 'day'];

  const handleQualityChange = useCallback((q: QualityLevel) => {
    setInternalQuality(q);
    onQualityChange?.(q);
  }, [onQualityChange]);

  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'h2-patio-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleReset = useCallback(() => {
    controlsRef.current?.reset();
    setAutoRotate(false);
  }, []);

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const d = camDist;
    const positions: Record<CameraPreset, [number, number, number]> = {
      iso: [d, d * 0.6, d],
      front: [0, config.height * 0.5, d * 1.5],
      left: [-d * 1.5, config.height * 0.5, 0],
      right: [d * 1.5, config.height * 0.5, 0],
      under: [d * 0.3, 0.3, d * 0.3],
      top: [0, d * 1.8, 0.01],
    };
    const lookAts: Record<CameraPreset, [number, number, number]> = {
      iso: [0, config.height / 2, 0],
      front: [0, config.height / 2, 0],
      left: [0, config.height / 2, 0],
      right: [0, config.height / 2, 0],
      under: [0, config.height * 0.8, 0],
      top: [0, 0, 0],
    };
    const pos = positions[preset];
    const look = lookAts[preset];
    setCamTarget({ pos: new THREE.Vector3(...pos), lookAt: new THREE.Vector3(...look) });
    setAnimating(true);
    setAutoRotate(false);
  }, [camDist, config.height]);

  const onAnimComplete = useCallback(() => {
    setAnimating(false);
    if (camTarget && controlsRef.current) {
      controlsRef.current.target.copy(camTarget.lookAt);
      controlsRef.current.update();
    }
  }, [camTarget]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        shadows={qSettings.shadows ? 'soft' : false}
        camera={{ position: [camDist, camDist * 0.6, camDist], fov: 35, near: 0.1, far: 100 }}
        className="w-full h-full"
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: sceneMode === 'studio'
          ? 'linear-gradient(180deg, #4a90d9 0%, #7ec8e3 25%, #a8dce0 40%, #8cc63f 55%, #5da832 70%, #4a9a2b 100%)'
          : 'transparent'
        }}
      >
        {sceneMode === 'studio' && (
          <fog attach="fog" args={['#b8b0a4', camDist * 3, camDist * 6]} />
        )}

        {/* ── HDRI Environment ── */}
        <Environment
          files={hdriFile}
          background={sceneMode === 'environment'}
          backgroundBlurriness={sceneMode === 'environment' ? 0.03 : 0}
        />

        {/* Sun directional (shadow caster) */}
        <directionalLight
          position={[8, 14, 6]}
          intensity={1.8}
          color="#fff5e6"
          castShadow={qSettings.shadows}
          shadow-mapSize-width={qSettings.shadowMapSize}
          shadow-mapSize-height={qSettings.shadowMapSize}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />

        {/* Soft fill (low) */}
        <directionalLight
          position={[-5, 8, -3]}
          intensity={0.3}
          color="#c4d4ff"
        />

        {/* Ambient minimum — HDRI does the heavy lifting */}
        <ambientLight intensity={0.15} />

        <PatioMesh config={config} onPartClick={onPartClick} />

        {/* Debug overlay */}
        {debugMode && debugParts && (
          <DebugOverlay parts={debugParts} showLabels={showDebugLabels} showBoundingBoxes />
        )}

        {/* Wall Editor overlay */}
        {(wallEditMode || showDims !== 'off') && onConfigChange && (
          <WallEditorMesh
            config={config}
            onChange={onConfigChange}
            selectedWall={wallEditMode ? (selectedWall ?? null) : null}
            onSelectWall={onSelectWall ?? (() => {})}
            showDimensions={showDims}
          />
        )}

        {/* Shadow catcher ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial transparent opacity={0.35} />
        </mesh>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={qSettings.contactShadowOpacity}
          scale={30}
          blur={qSettings.contactShadowBlur}
          far={12}
          resolution={quality === 'high' ? 512 : 256}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan enableZoom enableRotate
          minDistance={1.5} maxDistance={30}
          maxPolarAngle={Math.PI * 0.88}
          target={[0, config.height / 2, 0]}
          enableDamping
          dampingFactor={0.08}
          enabled={!animating && !autoRotate}
        />

        <CameraAnimator
          targetPos={camTarget?.pos ?? null}
          targetLookAt={camTarget?.lookAt ?? null}
          enabled={animating}
          onComplete={onAnimComplete}
        />

        <AutoRotate enabled={autoRotate} />
      </Canvas>

      {/* ── Camera presets ─────────────────────────────────── */}
      <div className="absolute top-3 left-3 flex gap-1">
        {(['iso', 'front', 'left', 'right', 'under', 'top'] as CameraPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setCameraPreset(p)}
            className="px-2 py-1 rounded-md bg-background/70 backdrop-blur-md border border-border/50 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all duration-200 capitalize"
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Bottom toolbar ─────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {/* Quality */}
        <div className="flex gap-0.5 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg p-0.5">
          {(['high', 'balanced', 'low'] as QualityLevel[]).map((q) => (
            <button
              key={q}
              onClick={() => handleQualityChange(q)}
              className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
                quality === q
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {q === 'high' ? '✦' : q === 'balanced' ? '◆' : '○'} {q.charAt(0).toUpperCase() + q.slice(1)}
            </button>
          ))}
        </div>

        {/* Actions */}
        {/* Scene mode */}
        <div className="flex gap-0.5 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg p-0.5">
          <button
            onClick={() => setSceneMode('studio')}
            title="Studio mode"
            className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
              sceneMode === 'studio' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Warehouse className="w-3 h-3" />
          </button>
          <button
            onClick={() => setSceneMode('environment')}
            title="Environment mode"
            className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
              sceneMode === 'environment' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sun className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-0.5 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg p-0.5">
          <button
            onClick={() => setShowDims(prev => prev === 'off' ? 'key' : prev === 'key' ? 'all' : 'off')}
            title={`Dimensions: ${showDims}`}
            className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
              showDims !== 'off' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-3 h-3" />
            {showDims !== 'off' && <span className="ml-1 text-[8px]">{showDims}</span>}
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="Auto-rotate"
            className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
              autoRotate ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            onClick={handleReset}
            title="Reset camera"
            className="px-2 py-1.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={handleScreenshot}
            title="Screenshot"
            className="px-2 py-1.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="absolute bottom-3 left-3 text-[9px] text-muted-foreground/50 hidden sm:block">
        Drag to orbit · Scroll to zoom · Shift+drag to pan
      </p>
    </div>
  );
}
```

---

## Patio Mesh
**File: `src/components/configurator/PatioMesh.tsx`**

```tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { PatioConfig, AttachmentSide } from "@/types/configurator";
import {
  selectPatioType,
  selectBeamForSpan,
  selectSheet,
  BRACKETS,
  DOWNPIPE,
  type PatioTypeSpec,
  type BeamSpec,
  type SheetSpec,
} from "@/data/stratco-catalog";
import {
  createFrameMaterial,
  createRoofMaterial,
  MATERIALS,
} from "@/lib/materials";

/* ── helpers ────────────────────────────────────────────────── */

const mm = (v: number) => v / 1000;

/* ── component sub-builders (one per build-order stage) ───── */

function BasePlates({ positions, colSize, frameMat }: {
  positions: [number, number][]; colSize: number; frameMat: THREE.Material;
}) {
  const plateW = mm(BRACKETS.postBracket.width);
  const plateH = mm(BRACKETS.postBracket.height);
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={`bp-${i}`} position={[x, plateH / 2, z]} material={MATERIALS.bracket}>
          <boxGeometry args={[plateW, plateH, plateW]} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Hex-head self-tapping screw visual (10mm head, short cylinder + hex cap)
 */
function TekScrew({ position, rotation, material }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Screw head — hex washer head */}
      <mesh material={material}>
        <cylinderGeometry args={[0.006, 0.006, 0.004, 6]} />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, -0.006, 0]} material={material}>
        <cylinderGeometry args={[0.003, 0.003, 0.012, 6]} />
      </mesh>
    </group>
  );
}

/**
 * Post bracket — L-shaped steel bracket that clips onto post top.
 */
function PostBracket({ position, colSize, beamH, beamW }: {
  position: [number, number, number];
  colSize: number;
  beamH: number;
  beamW: number;
}) {
  const flangeThick = 0.004;
  const flangeHeight = beamH * 0.7;
  const bracketWidth = mm(colSize) + 0.024;

  return (
    <group position={position}>
      <mesh material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeThick, bracketWidth]} />
      </mesh>
      <mesh position={[-bracketWidth / 2 + flangeThick / 2, flangeHeight / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[flangeThick, flangeHeight, bracketWidth]} />
      </mesh>
      <mesh position={[bracketWidth / 2 - flangeThick / 2, flangeHeight / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[flangeThick, flangeHeight, bracketWidth]} />
      </mesh>
      <mesh position={[0, flangeHeight / 2, bracketWidth / 2 - flangeThick / 2]} material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeHeight, flangeThick]} />
      </mesh>
      <mesh position={[0, flangeHeight / 2, -bracketWidth / 2 + flangeThick / 2]} material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeHeight, flangeThick]} />
      </mesh>
      {[-1, 1].map((side) => (
        [0.3, 0.6].map((t, si) => (
          <TekScrew
            key={`screw-${side}-${si}`}
            position={[side * (bracketWidth / 2 + 0.001), flangeHeight * t, 0]}
            rotation={[0, 0, side * Math.PI / 2]}
            material={MATERIALS.bracket}
          />
        ))
      ))}
    </group>
  );
}

function Columns({ positions, height, colSize, frameMat, decorative, beamH, beamW }: {
  positions: [number, number][]; height: number; colSize: number;
  frameMat: THREE.Material; decorative: boolean;
  beamH: number; beamW: number;
}) {
  const s = mm(colSize);
  const capH = mm(BRACKETS.postCap.height);
  const gap = 0.003;
  const postH = height - capH - gap;
  return (
    <>
      {positions.map(([x, z], i) => (
        <group key={`col-${i}`}>
          <mesh position={[x, postH / 2, z]} material={frameMat} castShadow>
            <boxGeometry args={[s, postH, s]} />
          </mesh>
          <mesh position={[x, postH + gap + capH / 2, z]} material={MATERIALS.postCap}>
            <boxGeometry args={[s + 0.012, capH, s + 0.012]} />
          </mesh>
          <PostBracket
            position={[x, height - beamH, z]}
            colSize={colSize}
            beamH={beamH}
            beamW={beamW}
          />
        </group>
      ))}
    </>
  );
}

function WallBrackets({ config, beam, frameMat }: {
  config: PatioConfig; beam: BeamSpec; frameMat: THREE.Material;
}) {
  const { width, depth, height, attachedSides = ['back'] } = config;
  const hasBack = attachedSides.includes('back');
  const hasLeft = attachedSides.includes('left');
  const hasRight = attachedSides.includes('right');
  const bw = mm(BRACKETS.wallBracket.width);
  const bh = mm(BRACKETS.wallBracket.height);
  const bd = mm(BRACKETS.wallBracket.depth);
  const brackets: JSX.Element[] = [];

  if (hasBack) {
    const count = Math.max(2, Math.ceil(width / 1.8));
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + (width / (count - 1)) * i;
      brackets.push(
        <mesh key={`wb-b-${i}`} position={[x, height - mm(beam.profileHeight) / 2, -depth / 2 - bd / 2]} material={MATERIALS.bracket}>
          <boxGeometry args={[bw, bh, bd]} />
        </mesh>
      );
    }
  }
  if (hasLeft) {
    brackets.push(
      <mesh key="wb-l" position={[-width / 2 - bd / 2, height - mm(beam.profileHeight) / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[bd, bh, bw]} />
      </mesh>
    );
  }
  if (hasRight) {
    brackets.push(
      <mesh key="wb-r" position={[width / 2 + bd / 2, height - mm(beam.profileHeight) / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[bd, bh, bw]} />
      </mesh>
    );
  }
  return <>{brackets}</>;
}

function BeamToBeamBracket({ position, rotation, beamH, beamW }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  beamH: number;
  beamW: number;
}) {
  const flangeThick = 0.004;
  const flangeDepthInBeam = beamW * 0.6;
  const flangeH = beamH * 0.85;

  return (
    <group position={position} rotation={rotation}>
      <mesh material={MATERIALS.beamBracket}>
        <boxGeometry args={[flangeThick, flangeH, beamW + 0.01]} />
      </mesh>
      <mesh position={[flangeDepthInBeam / 2, 0, 0]} material={MATERIALS.beamBracket}>
        <boxGeometry args={[flangeDepthInBeam, flangeH, flangeThick]} />
      </mesh>
      {[-1, 1].map((vSide) =>
        [-1, 1].map((hSide) => (
          <TekScrew
            key={`bb-screw-${vSide}-${hSide}`}
            position={[-0.003, vSide * flangeH * 0.25, hSide * beamW * 0.25]}
            rotation={[0, 0, Math.PI / 2]}
            material={MATERIALS.bracket}
          />
        ))
      )}
    </group>
  );
}

function Beams({ config, beam, patioType, frameMat }: {
  config: PatioConfig; beam: BeamSpec; patioType: PatioTypeSpec; frameMat: THREE.Material;
}) {
  const { width, depth, height } = config;
  const bH = mm(beam.profileHeight);
  const bW = mm(150);
  const beamY = height - bH / 2;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const gap = 0.006;

  return (
    <>
      <mesh position={[0, beamY, -depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width - bW - gap * 2, bH, bW]} />
      </mesh>
      <mesh position={[-width / 2, beamY, overhang / 2]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth + overhang]} />
      </mesh>
      <mesh position={[width / 2, beamY, overhang / 2]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth + overhang]} />
      </mesh>
      <mesh position={[0, beamY, depth / 2 + overhang]} material={frameMat} castShadow>
        <boxGeometry args={[width - bW - gap * 2, bH, bW]} />
      </mesh>

      {beam.fluted && (
        <>
          {[0.25, 0.5, 0.75].map((t, fi) => (
            <mesh key={`flute-f-${fi}`}
              position={[0, height - bH * t, depth / 2 + overhang + bW / 2 + 0.002]}
              material={MATERIALS.beamBracket}
            >
              <boxGeometry args={[width + bW - 0.02, 0.004, 0.004]} />
            </mesh>
          ))}
        </>
      )}

      <BeamToBeamBracket position={[-width / 2 + bW / 2 + 0.002, beamY, -depth / 2]} rotation={[0, 0, 0]} beamH={bH} beamW={bW} />
      <BeamToBeamBracket position={[width / 2 - bW / 2 - 0.002, beamY, -depth / 2]} rotation={[0, Math.PI, 0]} beamH={bH} beamW={bW} />
      <BeamToBeamBracket position={[-width / 2 + bW / 2 + 0.002, beamY, depth / 2 + overhang]} rotation={[0, 0, 0]} beamH={bH} beamW={bW} />
      <BeamToBeamBracket position={[width / 2 - bW / 2 - 0.002, beamY, depth / 2 + overhang]} rotation={[0, Math.PI, 0]} beamH={bH} beamW={bW} />
    </>
  );
}

function Purlins({ config, beam, patioType, frameMat }: {
  config: PatioConfig; beam: BeamSpec; patioType: PatioTypeSpec; frameMat: THREE.Material;
}) {
  if (!patioType.hasPurlins) return null;
  const { width, depth, height } = config;
  const bH = mm(beam.profileHeight);
  const purlinH = bH * 0.6;
  const purlinW = mm(beam.profileWidth) * 0.8;
  const purlinY = height - bH - purlinH / 2;

  const purlins: JSX.Element[] = [];

  if (patioType.hasMidPurlin) {
    purlins.push(
      <mesh key="mid-purlin" position={[0, purlinY, 0]} material={frameMat} castShadow>
        <boxGeometry args={[purlinW, purlinH, depth + 0.05]} />
      </mesh>
    );
  }

  const spacing = 1.2;
  const count = Math.max(2, Math.floor(depth / spacing));
  for (let i = 0; i <= count; i++) {
    const z = -depth / 2 + (depth / count) * i;
    purlins.push(
      <mesh key={`purlin-${i}`} position={[0, purlinY, z]} material={frameMat} castShadow>
        <boxGeometry args={[width - 0.02, purlinH, purlinW]} />
      </mesh>
    );
  }

  return <>{purlins}</>;
}

function RoofSheets({ config, beam, sheet, patioType, roofMat }: {
  config: PatioConfig; beam: BeamSpec; sheet: SheetSpec; patioType: PatioTypeSpec; roofMat: THREE.Material;
}) {
  const { width, depth, height, shape } = config;
  const bH = mm(beam.profileHeight);
  const sheetThick = sheet.insulated ? mm(sheet.thickness) : 0.004;
  const roofY = height - bH + sheetThick / 2;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const totalDepth = depth + overhang;
  const slopeAngle = config.style === 'skillion' ? 0.06 : 0.025;

  const isGable = shape === 'gable';

  if (isGable) {
    const gableH = Math.min(width, depth) * 0.18;
    const gableFrameMat = createFrameMaterial(config.frameColor, config.frameFinish, config.reflectionStrength);
    return <GableRoof width={width} depth={totalDepth} roofY={roofY} gableHeight={gableH} sheetThick={sheetThick} roofMat={roofMat} frameMat={gableFrameMat} />;
  }

  if (config.style === 'skyline') {
    return (
      <>
        <mesh position={[-width / 4 - 0.03, roofY, 0]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow>
          <boxGeometry args={[width / 2 + 0.03, sheetThick, totalDepth + 0.1]} />
        </mesh>
        <mesh position={[width / 4 + 0.03, roofY + 0.15, 0]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow>
          <boxGeometry args={[width / 2 + 0.03, sheetThick, totalDepth + 0.1]} />
        </mesh>
        <mesh position={[0, roofY + 0.08, 0]}>
          <boxGeometry args={[0.25, 0.01, totalDepth + 0.1]} />
          <meshPhysicalMaterial color="#88ccff" transparent opacity={0.2} transmission={0.85} roughness={0.05} />
        </mesh>
      </>
    );
  }

  const sheetCenterZ = overhang / 2;
  const bW = mm(150);
  const roofW = width - bW;
  const roofD = totalDepth - bW;
  const roofRotation = sheet.insulated ? 0 : slopeAngle;
  return (
    <>
      <mesh position={[0, roofY, sheetCenterZ]} rotation={[roofRotation, 0, 0]} material={roofMat} castShadow receiveShadow>
        <boxGeometry args={[roofW, sheetThick, roofD]} />
      </mesh>

      {sheet.ribHeight > 0 && (
        <SheetRibs
          width={roofW}
          depth={roofD}
          roofY={roofY + sheetThick / 2}
          ribH={mm(sheet.ribHeight)}
          ribSpacing={mm(sheet.ribSpacing)}
          roofMat={roofMat}
          direction={patioType.sheetDirection}
          slopeAngle={roofRotation}
          overhang={overhang}
        />
      )}

      {sheet.insulated && (
        <>
          <mesh position={[0, roofY - sheetThick / 2 - 0.008, sheetCenterZ]} rotation={[0, 0, 0]}
            material={MATERIALS.insulatedUnderside} receiveShadow>
            <boxGeometry args={[roofW - 0.02, 0.003, roofD - 0.02]} />
          </mesh>
          <InsulatedUnderside width={roofW - 0.02} depth={roofD - 0.02} roofY={roofY - sheetThick / 2 - 0.008} roofMat={MATERIALS.insulatedUnderside} slopeAngle={0} overhang={overhang} />
        </>
      )}
    </>
  );
}

function SheetRibs({ width, depth, roofY, ribH, ribSpacing, roofMat, direction, slopeAngle, overhang }: {
  width: number; depth: number; roofY: number; ribH: number; ribSpacing: number;
  roofMat: THREE.Material; direction: 'depth' | 'width'; slopeAngle: number; overhang: number;
}) {
  const ribs: JSX.Element[] = [];
  if (direction === 'depth') {
    const count = Math.floor(width / ribSpacing);
    for (let i = 0; i <= count; i++) {
      const x = -width / 2 + i * ribSpacing;
      ribs.push(
        <mesh key={`rib-${i}`} position={[x, roofY + ribH / 2, overhang / 2]} rotation={[slopeAngle, 0, 0]} material={roofMat}>
          <boxGeometry args={[0.015, ribH, depth]} />
        </mesh>
      );
    }
  } else {
    const count = Math.floor(depth / ribSpacing);
    for (let i = 0; i <= count; i++) {
      const z = -depth / 2 + i * ribSpacing;
      ribs.push(
        <mesh key={`rib-${i}`} position={[0, roofY + ribH / 2, z + overhang / 2]} material={roofMat}>
          <boxGeometry args={[width, ribH, 0.015]} />
        </mesh>
      );
    }
  }
  return <>{ribs}</>;
}

function InsulatedUnderside({ width, depth, roofY, roofMat, slopeAngle, overhang }: {
  width: number; depth: number; roofY: number; roofMat: THREE.Material; slopeAngle: number; overhang: number;
}) {
  const joints: JSX.Element[] = [];
  const panelWidth = 1.0;
  const count = Math.floor(width / panelWidth);
  for (let i = 1; i < count; i++) {
    const x = -width / 2 + i * panelWidth;
    joints.push(
      <mesh key={`ins-j-${i}`} position={[x, roofY - 0.002, overhang / 2]} rotation={[slopeAngle, 0, 0]} material={roofMat}>
        <boxGeometry args={[0.015, 0.008, depth]} />
      </mesh>
    );
  }
  return <>{joints}</>;
}

function createTriangleGeo(baseWidth: number, peakHeight: number): THREE.BufferGeometry {
  const hw = baseWidth / 2;
  const vertices = new Float32Array([
    -hw, 0, 0,
     hw, 0, 0,
     0, peakHeight, 0,
  ]);
  const normals = new Float32Array([0,0,1, 0,0,1, 0,0,1]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex([0, 1, 2]);
  return geo;
}

function GableRoof({ width, depth, roofY, gableHeight, sheetThick, roofMat, frameMat }: {
  width: number; depth: number; roofY: number; gableHeight: number; sheetThick: number;
  roofMat: THREE.Material; frameMat: THREE.Material;
}) {
  const halfW = width / 2;
  const angle = Math.atan2(gableHeight, halfW);
  const slopeLen = Math.sqrt(halfW * halfW + gableHeight * gableHeight);
  const pivotXL = -halfW;
  const pivotXR = halfW;
  const midSlopeX = slopeLen / 2;

  return (
    <>
      <group position={[pivotXL, roofY, 0]} rotation={[0, 0, angle]}>
        <mesh position={[midSlopeX, sheetThick / 2, 0]} material={roofMat} castShadow receiveShadow>
          <boxGeometry args={[slopeLen, sheetThick, depth]} />
        </mesh>
      </group>
      <group position={[pivotXR, roofY, 0]} rotation={[0, 0, Math.PI - angle]}>
        <mesh position={[midSlopeX, sheetThick / 2, 0]} material={roofMat} castShadow receiveShadow>
          <boxGeometry args={[slopeLen, sheetThick, depth]} />
        </mesh>
      </group>

      <mesh position={[0, roofY + gableHeight + 0.015, 0]} material={frameMat}>
        <boxGeometry args={[0.08, 0.04, depth + 0.06]} />
      </mesh>
      <mesh position={[0, roofY + gableHeight + 0.038, 0]} material={frameMat}>
        <boxGeometry args={[0.2, 0.006, depth + 0.08]} />
      </mesh>

      {[-1, 1].map((side) => {
        const triGeo = createTriangleGeo(width, gableHeight);
        return (
          <mesh key={`gable-tri-${side}`} geometry={triGeo} position={[0, roofY, (depth / 2 + 0.005) * side]} material={roofMat} />
        );
      })}

      {[-1, 1].map((side) => {
        const z = (depth / 2 + 0.01) * side;
        return (
          <group key={`gable-trim-${side}`}>
            <group position={[-halfW, roofY, z]} rotation={[0, 0, angle]}>
              <mesh position={[slopeLen / 2, 0.015, 0]} material={frameMat}>
                <boxGeometry args={[slopeLen, 0.03, 0.04]} />
              </mesh>
            </group>
            <group position={[halfW, roofY, z]} rotation={[0, 0, Math.PI - angle]}>
              <mesh position={[slopeLen / 2, 0.015, 0]} material={frameMat}>
                <boxGeometry args={[slopeLen, 0.03, 0.04]} />
              </mesh>
            </group>
            <mesh position={[0, roofY, z]} material={frameMat}>
              <boxGeometry args={[width, 0.03, 0.04]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function GuttersAndDownpipes({ config, beam, patioType, frameMat }: {
  config: PatioConfig; beam: BeamSpec; patioType: PatioTypeSpec; frameMat: THREE.Material;
}) {
  if (!config.accessories.gutters) return null;
  const { width, depth, height } = config;
  const bH = mm(beam.profileHeight);
  const gutterW = 0.115;
  const gutterH = 0.075;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const frontZ = depth / 2 + overhang;
  const gutterY = height - bH - gutterH / 2;

  return (
    <>
      <mesh position={[0, gutterY, frontZ + gutterW / 2]} material={frameMat}>
        <boxGeometry args={[width + 0.15, gutterH, gutterW]} />
      </mesh>
      {[-width / 2, width / 2].map((x, i) => (
        <group key={`dp-${i}`}>
          <mesh position={[x, height / 2 - bH / 2, frontZ + gutterW]} material={frameMat}>
            <cylinderGeometry args={[mm(DOWNPIPE.diameter) / 2, mm(DOWNPIPE.diameter) / 2, height - bH, 8]} />
          </mesh>
          <mesh position={[x, height * 0.4, frontZ + gutterW]} material={MATERIALS.bracket}>
            <torusGeometry args={[mm(DOWNPIPE.diameter) / 2 + 0.005, 0.003, 6, 12]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function DesignerBeam({ config, beam, patioType, frameMat }: {
  config: PatioConfig; beam: BeamSpec; patioType: PatioTypeSpec; frameMat: THREE.Material;
}) {
  if (!config.accessories.designerBeam) return null;
  const { width, height } = config;
  const bH = mm(beam.profileHeight);
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  return (
    <mesh position={[0, height - bH * 1.5, config.depth / 2 + overhang + 0.01]} material={frameMat} castShadow>
      <boxGeometry args={[width + 0.08, bH * 0.5, mm(beam.profileWidth) * 1.5]} />
    </mesh>
  );
}

function Lights({ config, beam, frameMat }: {
  config: PatioConfig; beam: BeamSpec; frameMat: THREE.Material;
}) {
  if (!config.accessories.lighting) return null;
  const { width, depth, height, shape } = config;
  const bH = mm(beam.profileHeight);
  const isGable = shape === 'gable';
  const gableH = isGable ? Math.min(width, depth) * 0.18 : 0;
  const count = Math.max(2, Math.ceil(width / 1.5));

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x = -width / 2 + 0.4 + (i * (width - 0.8)) / Math.max(1, count - 1);
        const gableOffset = isGable ? gableH * (1 - Math.abs(x) / (width / 2)) : 0;
        const lightY = height - bH - 0.05 + gableOffset;
        return (
          <group key={`light-${i}`}>
            <mesh position={[x, lightY, 0]} castShadow material={MATERIALS.lightFixture}>
              <cylinderGeometry args={[0.05, 0.065, 0.025, 12]} />
            </mesh>
            <pointLight position={[x, lightY - 0.04, 0]} intensity={0.25} distance={3} color="#ffd699" />
          </group>
        );
      })}
    </>
  );
}

function Fan({ config, beam }: {
  config: PatioConfig; beam: BeamSpec;
}) {
  if (!config.accessories.fans) return null;
  const { width, depth, height, shape } = config;
  const bH = mm(beam.profileHeight);
  const isGable = shape === 'gable';
  const gableH = isGable ? Math.min(width, depth) * 0.18 : 0;
  const fanY = height - bH - 0.15 + gableH;

  return (
    <group>
      <mesh position={[0, fanY + 0.06, 0]} material={MATERIALS.fanMetal}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
      </mesh>
      <mesh position={[0, fanY, 0]} material={MATERIALS.fanMetal}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 12]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`blade-${i}`}
          position={[Math.cos(i * Math.PI * 2 / 5) * 0.22, fanY - 0.02, Math.sin(i * Math.PI * 2 / 5) * 0.22]}
          rotation={[0, i * Math.PI * 2 / 5, 0]}
          material={MATERIALS.fanMetal}
        >
          <boxGeometry args={[0.35, 0.008, 0.06]} />
        </mesh>
      ))}
    </group>
  );
}

function DecorativeColumns({ positions, height, frameMat }: {
  positions: [number, number][]; height: number; frameMat: THREE.Material;
}) {
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={`dec-col-${i}`} position={[x, height * 0.35, z]} material={frameMat} castShadow>
          <cylinderGeometry args={[0.055, 0.075, height * 0.7, 12]} />
        </mesh>
      ))}
    </>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function PatioMesh({ config, onPartClick }: { config: PatioConfig; onPartClick?: (part: string) => void }) {
  const { width, depth, height, style, frameColor, material, colorbondType, attachedSides = ['back'], accessories, shape, walls } = config;

  const isFreestanding = style === 'free-standing';
  const hasBack = attachedSides.includes('back');
  const hasLeft = attachedSides.includes('left');
  const hasRight = attachedSides.includes('right');

  const spanMm = depth * 1000;
  const patioType = useMemo(() => selectPatioType(spanMm, isFreestanding), [spanMm, isFreestanding]);
  const beam = useMemo(() => selectBeamForSpan(spanMm), [spanMm]);
  const sheet = useMemo(() => selectSheet(material, colorbondType), [material, colorbondType]);

  const frameFinish = config.frameFinish ?? 'gloss';
  const reflectionStrength = config.reflectionStrength ?? 2.2;
  const frameMat = useMemo(() => createFrameMaterial(frameColor, frameFinish, reflectionStrength), [frameColor, frameFinish, reflectionStrength]);
  const roofMat = useMemo(() => createRoofMaterial(material, frameColor), [frameColor, material]);

  const colSize = accessories.columns ? 140 : 100;

  const posts = useMemo(() => {
    const arr: [number, number][] = [];
    const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
    const corners: { pos: [number, number]; onBack: boolean; onLeft: boolean; onRight: boolean }[] = [
      { pos: [-width / 2, depth / 2 + overhang], onBack: false, onLeft: true, onRight: false },
      { pos: [width / 2, depth / 2 + overhang], onBack: false, onLeft: false, onRight: true },
      { pos: [-width / 2, -depth / 2], onBack: true, onLeft: true, onRight: false },
      { pos: [width / 2, -depth / 2], onBack: true, onLeft: false, onRight: true },
    ];

    if (width > mm(beam.maxSpan)) {
      const midPostCount = Math.ceil(width / mm(beam.maxSpan)) - 1;
      for (let i = 1; i <= midPostCount; i++) {
        const x = -width / 2 + (width / (midPostCount + 1)) * i;
        corners.push({ pos: [x, depth / 2 + overhang], onBack: false, onLeft: false, onRight: false });
        if (isFreestanding || !hasBack) {
          corners.push({ pos: [x, -depth / 2], onBack: true, onLeft: false, onRight: false });
        }
      }
    }

    for (const c of corners) {
      if (isFreestanding) {
        arr.push(c.pos);
      } else {
        const onAttached =
          (c.onBack && hasBack) ||
          (c.onLeft && hasLeft && !c.onBack) ||
          (c.onRight && hasRight && !c.onBack);
        if (!onAttached) arr.push(c.pos);
      }
    }
    return arr;
  }, [width, depth, isFreestanding, hasBack, hasLeft, hasRight, beam, patioType]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={MATERIALS.ground} receiveShadow>
        <planeGeometry args={[width + 4, depth + 4]} />
      </mesh>

      {!isFreestanding && hasBack && (
        <mesh
          position={[0, mm(walls?.back?.height ?? 2800) / 2, -depth / 2 - mm(walls?.back?.thickness ?? 200) / 2 - mm(walls?.back?.offset ?? 0)]}
          material={MATERIALS.wall}
          receiveShadow
        >
          <boxGeometry args={[mm(walls?.back?.length ?? width * 1000), mm(walls?.back?.height ?? 2800), mm(walls?.back?.thickness ?? 200)]} />
        </mesh>
      )}
      {!isFreestanding && hasLeft && (
        <mesh
          position={[-width / 2 - mm(walls?.left?.thickness ?? 200) / 2 - mm(walls?.left?.offset ?? 0), mm(walls?.left?.height ?? 2800) / 2, 0]}
          material={MATERIALS.wall}
          receiveShadow
        >
          <boxGeometry args={[mm(walls?.left?.thickness ?? 200), mm(walls?.left?.height ?? 2800), mm(walls?.left?.length ?? depth * 1000)]} />
        </mesh>
      )}
      {!isFreestanding && hasRight && (
        <mesh
          position={[width / 2 + mm(walls?.right?.thickness ?? 200) / 2 + mm(walls?.right?.offset ?? 0), mm(walls?.right?.height ?? 2800) / 2, 0]}
          material={MATERIALS.wall}
          receiveShadow
        >
          <boxGeometry args={[mm(walls?.right?.thickness ?? 200), mm(walls?.right?.height ?? 2800), mm(walls?.right?.length ?? depth * 1000)]} />
        </mesh>
      )}
      {walls?.front?.enabled && (
        <mesh
          position={[0, mm(walls.front.height) / 2, depth / 2 + mm(walls.front.thickness) / 2 + mm(walls.front.offset)]}
          material={MATERIALS.wall}
          receiveShadow
        >
          <boxGeometry args={[mm(walls.front.length), mm(walls.front.height), mm(walls.front.thickness)]} />
        </mesh>
      )}

      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('columns'); }}>
        <BasePlates positions={posts} colSize={colSize} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('columns'); }}>
        <Columns positions={posts} height={height} colSize={colSize} frameMat={frameMat} decorative={accessories.columns} beamH={mm(beam.profileHeight)} beamW={mm(150)} />
        {accessories.columns && <DecorativeColumns positions={posts} height={height} frameMat={frameMat} />}
      </group>
      {!isFreestanding && <WallBrackets config={config} beam={beam} frameMat={frameMat} />}
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('beams'); }}>
        <Beams config={config} beam={beam} patioType={patioType} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('beams'); }}>
        <Purlins config={config} beam={beam} patioType={patioType} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('roof'); }}>
        <RoofSheets config={config} beam={beam} sheet={sheet} patioType={patioType} roofMat={roofMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('accessories'); }}>
        <GuttersAndDownpipes config={config} beam={beam} patioType={patioType} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('accessories'); }}>
        <DesignerBeam config={config} beam={beam} patioType={patioType} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('accessories'); }}>
        <Lights config={config} beam={beam} frameMat={frameMat} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); onPartClick?.('accessories'); }}>
        <Fan config={config} beam={beam} />
      </group>
    </group>
  );
}
```

---

## Debug Overlay
**File: `src/components/configurator/DebugOverlay.tsx`**

```tsx
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Part } from '@/lib/patio-engine';

const wireframeMat = new THREE.MeshBasicMaterial({
  color: '#00ff88',
  wireframe: true,
  transparent: true,
  opacity: 0.6,
});

const labelColor = '#ffffff';
const labelBg = '#000000';

interface DebugOverlayProps {
  parts: Part[];
  showLabels?: boolean;
  showBoundingBoxes?: boolean;
}

export default function DebugOverlay({ parts, showLabels = true, showBoundingBoxes = true }: DebugOverlayProps) {
  const structural = parts.filter(p => !['ground', 'wall'].includes(p.kind));

  return (
    <group>
      {structural.map((part) => {
        const [dx, dy, dz] = part.dimensions;
        const longest = Math.max(dx, dz);
        const alongX = dx >= dz;

        return (
          <group key={part.id} position={part.position} rotation={part.rotation}>
            {showBoundingBoxes && (
              <mesh material={wireframeMat}>
                <boxGeometry args={part.dimensions} />
              </mesh>
            )}

            {showLabels && (
              <Text
                position={[0, dy / 2 + 0.05, 0]}
                rotation={alongX ? [0, 0, 0] : [0, Math.PI / 2, 0]}
                fontSize={Math.min(0.12, longest * 0.35)}
                color={labelColor}
                outlineColor={labelBg}
                outlineWidth={0.012}
                anchorX="center"
                anchorY="bottom"
                fontWeight="bold"
              >
                {part.metadata?.label || `${part.kind} ${part.id.split('-').pop()}`}
              </Text>
            )}

            <axesHelper args={[0.15]} />
          </group>
        );
      })}
    </group>
  );
}
```

---

## Wall Editor Mesh
**File: `src/components/configurator/WallEditorMesh.tsx`**

```tsx
import { useRef, useState, useMemo, useCallback } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import type { PatioConfig, WallSide, WallConfig } from "@/types/configurator";

interface WallEditorMeshProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  selectedWall: WallSide | null;
  onSelectWall: (side: WallSide | null) => void;
  showDimensions: 'off' | 'key' | 'all';
}

const mm = (v: number) => v / 1000;

interface WallFace {
  side: WallSide;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  dimLabelPos: [number, number, number];
  dimLabelRotation: [number, number, number];
  lengthDir: 'x' | 'z';
}

function WallOutline({ position, rotation, size, isSelected, isHovered }: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  isSelected: boolean;
  isHovered: boolean;
}) {
  const color = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#888';
  const [w, h] = size;
  const hw = w / 2;
  const hh = h / 2;

  const points = useMemo(() => [
    new THREE.Vector3(-hw, -hh, 0),
    new THREE.Vector3(hw, -hh, 0),
    new THREE.Vector3(hw, hh, 0),
    new THREE.Vector3(-hw, hh, 0),
    new THREE.Vector3(-hw, -hh, 0),
  ], [hw, hh]);

  if (!isSelected && !isHovered) return null;

  return (
    <group position={position} rotation={rotation}>
      <Line points={points} color={color} lineWidth={2} />
    </group>
  );
}

function DragHandle({ position, axis, onDrag, snapMm = 100 }: {
  position: [number, number, number];
  axis: 'x' | 'z';
  onDrag: (deltaMm: number) => void;
  snapMm?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<THREE.Vector3 | null>(null);
  const { camera, raycaster, gl } = useThree();
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setDragging(true);
    dragStart.current = new THREE.Vector3(...position);
    const normal = new THREE.Vector3(0, 1, 0);
    plane.current.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(...position));
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !dragStart.current) return;
    e.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);
    
    if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
      const delta = axis === 'x'
        ? intersection.current.x - dragStart.current.x
        : intersection.current.z - dragStart.current.z;
      
      const deltaMm = delta * 1000;
      const snapped = e.shiftKey ? deltaMm : Math.round(deltaMm / snapMm) * snapMm;
      
      if (Math.abs(snapped) >= snapMm * 0.5 || e.shiftKey) {
        onDrag(snapped);
        if (axis === 'x') dragStart.current.x = intersection.current.x;
        else dragStart.current.z = intersection.current.z;
      }
    }
  }, [dragging, axis, camera, raycaster, gl, onDrag, snapMm]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => { setHovered(false); if (!dragging) setDragging(false); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshPhysicalMaterial
        color={dragging ? '#f59e0b' : hovered ? '#3b82f6' : '#60a5fa'}
        emissive={dragging ? '#f59e0b' : hovered ? '#3b82f6' : '#60a5fa'}
        emissiveIntensity={dragging ? 0.8 : hovered ? 0.5 : 0.3}
        transparent
        opacity={0.9}
        roughness={0.3}
      />
    </mesh>
  );
}

function DimensionLabel({ start, end, label, offsetDir, color = '#00ff88' }: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offsetDir: [number, number, number];
  color?: string;
}) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2 + offsetDir[0],
    (start[1] + end[1]) / 2 + offsetDir[1],
    (start[2] + end[2]) / 2 + offsetDir[2],
  ];

  const linePoints = useMemo((): [number, number, number][] => [start, end], [start, end]);
  const arrowSize = 0.08;

  return (
    <group>
      <Line points={linePoints} color={color} lineWidth={1} transparent opacity={0.7} />
      <mesh position={start}>
        <sphereGeometry args={[arrowSize * 0.4, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[arrowSize * 0.4, 6, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={midpoint}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
        renderOrder={999}
      >
        {label}
      </Text>
    </group>
  );
}

export default function WallEditorMesh({
  config, onChange, selectedWall, onSelectWall, showDimensions,
}: WallEditorMeshProps) {
  const [hoveredWall, setHoveredWall] = useState<WallSide | null>(null);
  const { width, depth, height, walls } = config;

  const wallFaces = useMemo((): WallFace[] => {
    const faces: WallFace[] = [];
    const wallH = (side: WallSide) => mm(walls[side].height);
    const wallT = (side: WallSide) => mm(walls[side].thickness);
    const wallO = (side: WallSide) => mm(walls[side].offset);
    const wallL = (side: WallSide) => mm(walls[side].length);

    faces.push({
      side: 'back',
      position: [0, wallH('back') / 2, -depth / 2 - wallT('back') / 2 - wallO('back')],
      rotation: [0, 0, 0],
      size: [wallL('back') / 1000 || width + 2, wallH('back')],
      dimLabelPos: [0, wallH('back') + 0.2, -depth / 2 - wallO('back')],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'x',
    });

    faces.push({
      side: 'left',
      position: [-width / 2 - wallT('left') / 2 - wallO('left'), wallH('left') / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [wallL('left') / 1000 || depth + 2, wallH('left')],
      dimLabelPos: [-width / 2 - wallO('left'), wallH('left') + 0.2, 0],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'z',
    });

    faces.push({
      side: 'right',
      position: [width / 2 + wallT('right') / 2 + wallO('right'), wallH('right') / 2, 0],
      rotation: [0, Math.PI / 2, 0],
      size: [wallL('right') / 1000 || depth + 2, wallH('right')],
      dimLabelPos: [width / 2 + wallO('right'), wallH('right') + 0.2, 0],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'z',
    });

    faces.push({
      side: 'front',
      position: [0, wallH('front') / 2, depth / 2 + wallT('front') / 2 + wallO('front')],
      rotation: [0, 0, 0],
      size: [wallL('front') / 1000 || width + 2, wallH('front')],
      dimLabelPos: [0, wallH('front') + 0.2, depth / 2 + wallO('front')],
      dimLabelRotation: [0, 0, 0],
      lengthDir: 'x',
    });

    return faces;
  }, [width, depth, height, walls]);

  const updateWall = useCallback((side: WallSide, partial: Partial<WallConfig>) => {
    const newWalls = { ...config.walls, [side]: { ...config.walls[side], ...partial } };
    const attachedSides = (['back', 'left', 'right'] as const).filter(s => newWalls[s].enabled);
    onChange({
      ...config,
      walls: newWalls,
      attachedSides: attachedSides.length > 0 ? attachedSides : ['back'],
    });
  }, [config, onChange]);

  return (
    <group>
      {wallFaces.map(face => {
        const wall = walls[face.side];
        const isHovered = hoveredWall === face.side;
        const isSelected = selectedWall === face.side;
        const showFace = wall.enabled || isHovered || isSelected;

        return (
          <group key={face.side}>
            <mesh
              position={face.position}
              rotation={face.rotation}
              onPointerEnter={(e) => { e.stopPropagation(); setHoveredWall(face.side); }}
              onPointerLeave={() => setHoveredWall(null)}
              onClick={(e) => { e.stopPropagation(); onSelectWall(face.side); }}
            >
              <planeGeometry args={[face.size[0], face.size[1]]} />
              <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
            </mesh>

            {showFace && (
              <mesh position={face.position} rotation={face.rotation}>
                <planeGeometry args={[face.size[0], face.size[1]]} />
                <meshPhysicalMaterial
                  color={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  transparent
                  opacity={isSelected ? 0.2 : isHovered ? 0.1 : 0.05}
                  emissive={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#94a3b8'}
                  emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.15 : 0.05}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            <WallOutline
              position={face.position}
              rotation={face.rotation}
              size={face.size}
              isSelected={isSelected}
              isHovered={isHovered}
            />

            {isSelected && wall.enabled && (
              <>
                {face.lengthDir === 'x' ? (
                  <>
                    <DragHandle
                      position={[face.position[0] - face.size[0] / 2, face.position[1], face.position[2]]}
                      axis="x"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                    <DragHandle
                      position={[face.position[0] + face.size[0] / 2, face.position[1], face.position[2]]}
                      axis="x"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <DragHandle
                      position={[face.position[0], face.position[1], face.position[2] - face.size[0] / 2]}
                      axis="z"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length - deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                    <DragHandle
                      position={[face.position[0], face.position[1], face.position[2] + face.size[0] / 2]}
                      axis="z"
                      onDrag={(deltaMm) => {
                        const newLen = Math.max(1000, wall.length + deltaMm);
                        updateWall(face.side, { length: newLen });
                      }}
                    />
                  </>
                )}
              </>
            )}
          </group>
        );
      })}

      {showDimensions !== 'off' && (
        <group>
          <DimensionLabel
            start={[-width / 2, 0.05, depth / 2 + 0.8]}
            end={[width / 2, 0.05, depth / 2 + 0.8]}
            label={`${Math.round(width * 1000)} mm`}
            offsetDir={[0, 0.15, 0]}
            color="#00ff88"
          />
          <DimensionLabel
            start={[width / 2 + 0.8, 0.05, -depth / 2]}
            end={[width / 2 + 0.8, 0.05, depth / 2]}
            label={`${Math.round(depth * 1000)} mm`}
            offsetDir={[0.15, 0.15, 0]}
            color="#00ff88"
          />
          <DimensionLabel
            start={[width / 2 + 0.8, 0, -depth / 2]}
            end={[width / 2 + 0.8, height, -depth / 2]}
            label={`${Math.round(height * 1000)} mm`}
            offsetDir={[0.15, 0, 0]}
            color="#00aaff"
          />
          {showDimensions === 'all' && (
            <>
              {wallFaces.filter(f => walls[f.side].enabled).map(face => {
                const wall = walls[face.side];
                return (
                  <DimensionLabel
                    key={`wall-h-${face.side}`}
                    start={[face.dimLabelPos[0] + 0.3, 0, face.dimLabelPos[2]]}
                    end={[face.dimLabelPos[0] + 0.3, mm(wall.height), face.dimLabelPos[2]]}
                    label={`${wall.height} mm`}
                    offsetDir={[0.15, 0, 0]}
                    color="#ff8844"
                  />
                );
              })}
            </>
          )}
        </group>
      )}
    </group>
  );
}
```

---

## Materials Library
**File: `src/lib/materials.ts`**

```typescript
import * as THREE from "three";
import type { FrameFinish } from "@/types/configurator";

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

export function createFrameMaterial(
  hex: string,
  finish: FrameFinish = 'gloss',
  reflectionStrength?: number,
): THREE.MeshPhysicalMaterial {
  const preset = FINISH_PRESETS[finish];
  const envIntensity = reflectionStrength ?? preset.envMapIntensity;

  return createPBRMaterial({
    color: hex,
    metalness: 0.1,
    roughness: preset.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: preset.clearcoatRoughness,
    ior: 1.45,
    specularIntensity: 1.0,
    envMapIntensity: Math.min(envIntensity, 3.2),
  });
}

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
  return createPBRMaterial({
    color: frameColor,
    metalness: 0.6,
    roughness: 0.35,
    envMapIntensity: 1.5,
    clearcoat: 0.15,
    clearcoatRoughness: 0.3,
  });
}

export const MATERIALS = {
  ground: createPBRMaterial({ color: '#b5ada0', metalness: 0, roughness: 0.95, envMapIntensity: 0.3 }),
  wall: createPBRMaterial({ color: '#d4ccc0', metalness: 0, roughness: 0.85, envMapIntensity: 0.4 }),
  bracket: createPBRMaterial({ color: '#2c2c2c', metalness: 0.85, roughness: 0.15, envMapIntensity: 2.5, clearcoat: 0.8, clearcoatRoughness: 0.05 }),
  beamBracket: createPBRMaterial({ color: '#383838', metalness: 0.9, roughness: 0.12, envMapIntensity: 2.8, clearcoat: 0.9, clearcoatRoughness: 0.04 }),
  postCap: createPBRMaterial({ color: '#222222', metalness: 0.8, roughness: 0.2, envMapIntensity: 2.2, clearcoat: 0.7, clearcoatRoughness: 0.08 }),
  insulatedUnderside: createPBRMaterial({ color: '#f5edd8', metalness: 0.05, roughness: 0.75, envMapIntensity: 0.5 }),
  skylight: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#88ccff'), transparent: true, opacity: 0.2, transmission: 0.85, roughness: 0.05, envMapIntensity: 1.0 }),
  lightFixture: createPBRMaterial({ color: '#2a2a2a', metalness: 0.85, roughness: 0.25, envMapIntensity: 2.0 }),
  fanMetal: createPBRMaterial({ color: '#3a3a3a', metalness: 0.75, roughness: 0.3, envMapIntensity: 1.8 }),
  chromeSphere: createPBRMaterial({ color: '#ffffff', metalness: 1.0, roughness: 0.0, envMapIntensity: 3.0, clearcoat: 0 }),
};

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
  high: { shadows: true, shadowMapSize: 2048, envMapIntensity: 1.0, contactShadowBlur: 3, contactShadowOpacity: 0.6, maxLights: 8 },
  balanced: { shadows: true, shadowMapSize: 1024, envMapIntensity: 0.8, contactShadowBlur: 2, contactShadowOpacity: 0.45, maxLights: 4 },
  low: { shadows: false, shadowMapSize: 512, envMapIntensity: 0.5, contactShadowBlur: 1.5, contactShadowOpacity: 0.3, maxLights: 2 },
};
```

---

## Patio Engine
**File: `src/lib/patio-engine.ts`**

```typescript
/**
 * Deterministic Patio Build Pipeline
 * InputConfig → Validate/Clamp → DeriveLayout → GeneratePartsList → RenderParts
 * All dimensions in METRES. Raw catalog data in mm is converted at boundaries.
 * Coordinate system: X = width, Y = up, Z = depth.
 */

import type { PatioConfig, AttachmentSide } from '@/types/configurator';
import {
  selectPatioType, selectBeamForSpan, selectSheet, BRACKETS, DOWNPIPE,
  type PatioTypeSpec, type BeamSpec, type SheetSpec,
} from '@/data/stratco-catalog';

const mm = (v: number) => v / 1000;

export type PartKind =
  | 'base-plate' | 'column' | 'post-cap' | 'wall-bracket' | 'beam' | 'beam-bracket'
  | 'purlin' | 'roof-sheet' | 'rib' | 'underside-panel' | 'underside-joint'
  | 'gutter' | 'downpipe' | 'downpipe-strap' | 'designer-beam'
  | 'light' | 'fan-rod' | 'fan-motor' | 'fan-blade'
  | 'gable-slope' | 'gable-ridge' | 'gable-ridge-cap' | 'gable-infill' | 'gable-trim'
  | 'skyline-sheet' | 'skylight-strip' | 'decorative-column' | 'flute-line'
  | 'ground' | 'wall';

export interface Part {
  id: string;
  kind: PartKind;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  geometry: 'box' | 'cylinder' | 'plane' | 'triangle' | 'torus';
  geometryArgs?: number[];
  metadata?: Record<string, any>;
}

export interface DerivedLayout {
  width: number;
  depth: number;
  height: number;
  patioType: PatioTypeSpec;
  beam: BeamSpec;
  sheet: SheetSpec;
  beamProfileH: number;
  beamProfileW: number;
  colSize: number;
  overhang: number;
  totalDepth: number;
  slopeAngle: number;
  isFreestanding: boolean;
  isGable: boolean;
  hasBack: boolean;
  hasLeft: boolean;
  hasRight: boolean;
  postPositions: [number, number][];
}

export function validateConfig(raw: PatioConfig): PatioConfig {
  return {
    ...raw,
    width: Math.max(2, Math.min(12, raw.width)),
    depth: Math.max(2, Math.min(8, raw.depth)),
    height: Math.max(2.4, Math.min(4.5, raw.height)),
    attachedSides: raw.attachedSides?.length ? raw.attachedSides : ['back'],
  };
}

export function deriveLayout(config: PatioConfig): DerivedLayout {
  const c = validateConfig(config);
  const isFreestanding = c.style === 'free-standing';
  const hasBack = c.attachedSides.includes('back');
  const hasLeft = c.attachedSides.includes('left');
  const hasRight = c.attachedSides.includes('right');

  const spanMm = c.depth * 1000;
  const patioType = selectPatioType(spanMm, isFreestanding);
  const beam = selectBeamForSpan(spanMm);
  const sheet = selectSheet(c.material, c.colorbondType);

  const beamProfileH = mm(beam.profileHeight);
  const beamProfileW = mm(150);
  const colSize = c.accessories.columns ? 140 : 100;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const totalDepth = c.depth + overhang;
  const slopeAngle = c.style === 'skillion' ? 0.06 : 0.025;
  const isGable = c.shape === 'gable';

  const postPositions = computePostPositions(c, patioType, beam, isFreestanding, hasBack, hasLeft, hasRight, overhang);

  return {
    width: c.width, depth: c.depth, height: c.height,
    patioType, beam, sheet, beamProfileH, beamProfileW, colSize,
    overhang, totalDepth, slopeAngle, isFreestanding, isGable,
    hasBack, hasLeft, hasRight, postPositions,
  };
}

function computePostPositions(
  config: PatioConfig, patioType: PatioTypeSpec, beam: BeamSpec,
  isFreestanding: boolean, hasBack: boolean, hasLeft: boolean, hasRight: boolean, overhang: number,
): [number, number][] {
  const { width, depth } = config;
  const arr: [number, number][] = [];

  const corners: { pos: [number, number]; onBack: boolean; onLeft: boolean; onRight: boolean }[] = [
    { pos: [-width / 2, depth / 2 + overhang], onBack: false, onLeft: true, onRight: false },
    { pos: [width / 2, depth / 2 + overhang], onBack: false, onLeft: false, onRight: true },
    { pos: [-width / 2, -depth / 2], onBack: true, onLeft: true, onRight: false },
    { pos: [width / 2, -depth / 2], onBack: true, onLeft: false, onRight: true },
  ];

  if (width > mm(beam.maxSpan)) {
    const midPostCount = Math.ceil(width / mm(beam.maxSpan)) - 1;
    for (let i = 1; i <= midPostCount; i++) {
      const x = -width / 2 + (width / (midPostCount + 1)) * i;
      corners.push({ pos: [x, depth / 2 + overhang], onBack: false, onLeft: false, onRight: false });
      if (isFreestanding || !hasBack) {
        corners.push({ pos: [x, -depth / 2], onBack: true, onLeft: false, onRight: false });
      }
    }
  }

  for (const c of corners) {
    if (isFreestanding) {
      arr.push(c.pos);
    } else {
      const onAttached =
        (c.onBack && hasBack) ||
        (c.onLeft && hasLeft && !c.onBack) ||
        (c.onRight && hasRight && !c.onBack);
      if (!onAttached) arr.push(c.pos);
    }
  }
  return arr;
}

let partCounter = 0;
function pid(kind: string) { return `${kind}-${partCounter++}`; }

export function generateParts(config: PatioConfig, layout: DerivedLayout): Part[] {
  partCounter = 0;
  const parts: Part[] = [];
  const { width, depth, height } = layout;
  const { beamProfileH: bH, beamProfileW: bW, overhang, totalDepth, slopeAngle, postPositions } = layout;
  const colS = mm(layout.colSize);

  // Ground
  parts.push({
    id: pid('ground'), kind: 'ground',
    position: [0, -0.01, 0], rotation: [-Math.PI / 2, 0, 0],
    dimensions: [width + 4, depth + 4, 0.01],
    color: '#a09a8c', metalness: 0, roughness: 0.95, geometry: 'plane',
  });

  // Walls
  if (!layout.isFreestanding) {
    if (layout.hasBack) {
      parts.push({ id: pid('wall'), kind: 'wall', position: [0, height / 2 + 0.5, -depth / 2 - 0.1], rotation: [0, 0, 0], dimensions: [width + 2, height + 1.5, 0.2], color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box' });
    }
    if (layout.hasLeft) {
      parts.push({ id: pid('wall'), kind: 'wall', position: [-width / 2 - 0.1, height / 2 + 0.5, 0], rotation: [0, 0, 0], dimensions: [0.2, height + 1.5, depth + 2], color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box' });
    }
    if (layout.hasRight) {
      parts.push({ id: pid('wall'), kind: 'wall', position: [width / 2 + 0.1, height / 2 + 0.5, 0], rotation: [0, 0, 0], dimensions: [0.2, height + 1.5, depth + 2], color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box' });
    }
  }

  // Base plates
  const plateW = mm(BRACKETS.postBracket.width);
  const plateH = mm(BRACKETS.postBracket.height);
  for (const [x, z] of postPositions) {
    parts.push({ id: pid('base-plate'), kind: 'base-plate', position: [x, plateH / 2, z], rotation: [0, 0, 0], dimensions: [plateW, plateH, plateW], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
  }

  // Columns
  for (const [x, z] of postPositions) {
    parts.push({ id: pid('column'), kind: 'column', position: [x, height / 2, z], rotation: [0, 0, 0], dimensions: [colS, height, colS], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box' });
    parts.push({ id: pid('post-cap'), kind: 'post-cap', position: [x, height, z], rotation: [0, 0, 0], dimensions: [colS + 0.01, mm(BRACKETS.postCap.height), colS + 0.01], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
  }

  // Wall brackets
  if (!layout.isFreestanding) {
    const bkW = mm(BRACKETS.wallBracket.width);
    const bkH = mm(BRACKETS.wallBracket.height);
    const bkD = mm(BRACKETS.wallBracket.depth);
    if (layout.hasBack) {
      const count = Math.max(2, Math.ceil(width / 1.8));
      for (let i = 0; i < count; i++) {
        const x = -width / 2 + (width / (count - 1)) * i;
        parts.push({ id: pid('wall-bracket'), kind: 'wall-bracket', position: [x, height - bH / 2, -depth / 2 - bkD / 2], rotation: [0, 0, 0], dimensions: [bkW, bkH, bkD], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
      }
    }
    if (layout.hasLeft) {
      parts.push({ id: pid('wall-bracket'), kind: 'wall-bracket', position: [-width / 2 - bkD / 2, height - bH / 2, 0], rotation: [0, 0, 0], dimensions: [bkD, bkH, bkW], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
    }
    if (layout.hasRight) {
      parts.push({ id: pid('wall-bracket'), kind: 'wall-bracket', position: [width / 2 + bkD / 2, height - bH / 2, 0], rotation: [0, 0, 0], dimensions: [bkD, bkH, bkW], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
    }
  }

  // Beams
  const beamY = height - bH / 2;
  parts.push({ id: pid('beam'), kind: 'beam', position: [0, beamY, -depth / 2], rotation: [0, 0, 0], dimensions: [width + bW, bH, bW], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box', metadata: { label: 'Back Beam' } });
  parts.push({ id: pid('beam'), kind: 'beam', position: [-width / 2, beamY, 0], rotation: [0, 0, 0], dimensions: [bW, bH, depth], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box', metadata: { label: 'Left Beam' } });
  parts.push({ id: pid('beam'), kind: 'beam', position: [width / 2, beamY, 0], rotation: [0, 0, 0], dimensions: [bW, bH, depth], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box', metadata: { label: 'Right Beam' } });
  parts.push({ id: pid('beam'), kind: 'beam', position: [0, beamY, depth / 2 + overhang], rotation: [0, 0, 0], dimensions: [width + bW, bH, bW], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box', metadata: { label: 'Front Beam' } });

  // Beam brackets
  for (const [x, z] of [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2 + overhang], [width / 2, depth / 2 + overhang]]) {
    parts.push({ id: pid('beam-bracket'), kind: 'beam-bracket', position: [x, beamY, z], rotation: [0, 0, 0], dimensions: [mm(BRACKETS.beamToBeamBracket.width), mm(BRACKETS.beamToBeamBracket.height), bW + 0.01], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
  }

  // Flute lines
  if (layout.beam.fluted) {
    for (const t of [0.25, 0.5, 0.75]) {
      parts.push({ id: pid('flute-line'), kind: 'flute-line', position: [0, height - bH * t, depth / 2 + overhang + bW / 2 + 0.002], rotation: [0, 0, 0], dimensions: [width + bW - 0.02, 0.004, 0.004], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box' });
    }
  }

  // Purlins
  if (layout.patioType.hasPurlins) {
    const purlinH = bH * 0.6;
    const purlinW = mm(layout.beam.profileWidth) * 0.8;
    const purlinY = height - bH - purlinH / 2;
    if (layout.patioType.hasMidPurlin) {
      parts.push({ id: pid('purlin'), kind: 'purlin', position: [0, purlinY, 0], rotation: [0, 0, 0], dimensions: [purlinW, purlinH, depth + 0.05], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box' });
    }
    const spacing = 1.2;
    const count = Math.max(2, Math.floor(depth / spacing));
    for (let i = 0; i <= count; i++) {
      const z = -depth / 2 + (depth / count) * i;
      parts.push({ id: pid('purlin'), kind: 'purlin', position: [0, purlinY, z], rotation: [0, 0, 0], dimensions: [width - 0.02, purlinH, purlinW], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box' });
    }
  }

  // Roof sheets (flat/skillion/fly-over only)
  if (!layout.isGable && config.style !== 'skyline') {
    const sheetThick = layout.sheet.insulated ? mm(layout.sheet.thickness) : 0.004;
    const roofY = height - bH + sheetThick / 2;
    const sheetCenterZ = overhang / 2;
    const isInsulated = layout.sheet.insulated;
    const roofRotation = isInsulated ? 0 : slopeAngle;
    const roofW = width - bW;
    const roofD = totalDepth - bW;
    parts.push({ id: pid('roof-sheet'), kind: 'roof-sheet', position: [0, roofY, sheetCenterZ], rotation: [roofRotation, 0, 0], dimensions: [roofW, sheetThick, roofD], color: isInsulated ? '#e8e0d0' : config.frameColor, metalness: isInsulated ? 0.1 : 0.5, roughness: isInsulated ? 0.7 : 0.4, geometry: 'box' });

    // Ribs
    if (layout.sheet.ribHeight > 0) {
      const ribH = mm(layout.sheet.ribHeight);
      const ribSpacing = mm(layout.sheet.ribSpacing);
      if (layout.patioType.sheetDirection === 'depth') {
        const innerLeft = -roofW / 2;
        const count = Math.floor(roofW / ribSpacing);
        for (let i = 0; i <= count; i++) {
          const x = innerLeft + i * ribSpacing;
          parts.push({ id: pid('rib'), kind: 'rib', position: [x, roofY + sheetThick / 2 + ribH / 2, sheetCenterZ], rotation: [roofRotation, 0, 0], dimensions: [0.015, ribH, roofD], color: isInsulated ? '#e8e0d0' : config.frameColor, metalness: isInsulated ? 0.1 : 0.5, roughness: isInsulated ? 0.7 : 0.4, geometry: 'box' });
        }
      } else {
        const count = Math.floor(roofD / ribSpacing);
        for (let i = 0; i <= count; i++) {
          const z = -roofD / 2 + i * ribSpacing;
          parts.push({ id: pid('rib'), kind: 'rib', position: [0, roofY + sheetThick / 2 + ribH / 2, z + sheetCenterZ], rotation: [0, 0, 0], dimensions: [roofW, ribH, 0.015], color: isInsulated ? '#e8e0d0' : config.frameColor, metalness: isInsulated ? 0.1 : 0.5, roughness: isInsulated ? 0.7 : 0.4, geometry: 'box' });
        }
      }
    }

    // Insulated underside
    if (isInsulated) {
      const sheetCZ = overhang / 2;
      parts.push({ id: pid('underside-panel'), kind: 'underside-panel', position: [0, height - bH - 0.008, sheetCZ], rotation: [0, 0, 0], dimensions: [width - bW - 0.02, 0.003, totalDepth - bW - 0.02], color: '#f5edd8', metalness: 0.05, roughness: 0.8, geometry: 'box' });
      const panelW = 1.0;
      const panelArea = width - bW - 0.02;
      const count = Math.floor(panelArea / panelW);
      for (let i = 1; i < count; i++) {
        const x = -panelArea / 2 + i * panelW;
        parts.push({ id: pid('underside-joint'), kind: 'underside-joint', position: [x, height - bH - 0.010, sheetCZ], rotation: [0, 0, 0], dimensions: [0.015, 0.008, totalDepth - bW - 0.02], color: '#f5edd8', metalness: 0.05, roughness: 0.8, geometry: 'box' });
      }
    }
  }

  // Gutters & downpipes
  if (config.accessories.gutters) {
    const gutterW = 0.115;
    const gutterH = 0.075;
    const frontZ = depth / 2 + overhang;
    const gutterY = height - bH - gutterH / 2;
    parts.push({ id: pid('gutter'), kind: 'gutter', position: [0, gutterY, frontZ + gutterW / 2], rotation: [0, 0, 0], dimensions: [width + 0.15, gutterH, gutterW], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box' });
    for (const x of [-width / 2, width / 2]) {
      const dpR = mm(DOWNPIPE.diameter) / 2;
      parts.push({ id: pid('downpipe'), kind: 'downpipe', position: [x, height / 2 - bH / 2, frontZ + gutterW], rotation: [0, 0, 0], dimensions: [dpR * 2, height - bH, dpR * 2], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'cylinder', geometryArgs: [dpR, dpR, height - bH, 8] });
      parts.push({ id: pid('downpipe-strap'), kind: 'downpipe-strap', position: [x, height * 0.4, frontZ + gutterW], rotation: [0, 0, 0], dimensions: [dpR * 2, dpR * 2, dpR * 2], color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'torus', geometryArgs: [dpR + 0.005, 0.003, 6, 12] });
    }
  }

  // Designer beam
  if (config.accessories.designerBeam) {
    parts.push({ id: pid('designer-beam'), kind: 'designer-beam', position: [0, height - bH * 1.5, depth / 2 + overhang + 0.01], rotation: [0, 0, 0], dimensions: [width + 0.08, bH * 0.5, mm(layout.beam.profileWidth) * 1.5], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box' });
  }

  // Lights
  if (config.accessories.lighting) {
    const gableH = layout.isGable ? Math.min(width, depth) * 0.18 : 0;
    const count = Math.max(2, Math.ceil(width / 1.5));
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + 0.4 + (i * (width - 0.8)) / Math.max(1, count - 1);
      const gableOffset = layout.isGable ? gableH * (1 - Math.abs(x) / (width / 2)) : 0;
      const lightY = height - bH - 0.05 + gableOffset;
      parts.push({ id: pid('light'), kind: 'light', position: [x, lightY, 0], rotation: [0, 0, 0], dimensions: [0.13, 0.025, 0.13], color: '#333333', metalness: 0.8, roughness: 0.3, geometry: 'cylinder', geometryArgs: [0.05, 0.065, 0.025, 12], metadata: { emitLight: true, lightColor: '#ffd699', lightIntensity: 0.25 } });
    }
  }

  // Fan
  if (config.accessories.fans) {
    const gableH = layout.isGable ? Math.min(width, depth) * 0.18 : 0;
    const fanY = height - bH - 0.15 + gableH;
    parts.push({ id: pid('fan-rod'), kind: 'fan-rod', position: [0, fanY + 0.06, 0], rotation: [0, 0, 0], dimensions: [0.03, 0.12, 0.03], color: '#444444', metalness: 0.7, roughness: 0.3, geometry: 'cylinder', geometryArgs: [0.015, 0.015, 0.12, 8] });
    parts.push({ id: pid('fan-motor'), kind: 'fan-motor', position: [0, fanY, 0], rotation: [0, 0, 0], dimensions: [0.08, 0.04, 0.08], color: '#444444', metalness: 0.7, roughness: 0.3, geometry: 'cylinder', geometryArgs: [0.04, 0.04, 0.04, 12] });
    for (let i = 0; i < 5; i++) {
      parts.push({ id: pid('fan-blade'), kind: 'fan-blade', position: [Math.cos(i * Math.PI * 2 / 5) * 0.22, fanY - 0.02, Math.sin(i * Math.PI * 2 / 5) * 0.22], rotation: [0, i * Math.PI * 2 / 5, 0], dimensions: [0.35, 0.008, 0.06], color: '#555555', metalness: 0.5, roughness: 0.4, geometry: 'box' });
    }
  }

  // Decorative columns
  if (config.accessories.columns) {
    for (const [x, z] of postPositions) {
      parts.push({ id: pid('decorative-column'), kind: 'decorative-column', position: [x, height * 0.35, z], rotation: [0, 0, 0], dimensions: [0.15, height * 0.7, 0.15], color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'cylinder', geometryArgs: [0.055, 0.075, height * 0.7, 12] });
    }
  }

  return parts;
}

export function buildPatioPipeline(config: PatioConfig) {
  const validated = validateConfig(config);
  const layout = deriveLayout(validated);
  const parts = generateParts(validated, layout);
  return { config: validated, layout, parts };
}
```

---

## Profile Geometry
**File: `src/lib/profile-geometry.ts`**

```typescript
import * as THREE from 'three';
import { PROFILES, type Profile2D } from '@/data/profiles/beam-profiles';

const mm = (v: number) => v / 1000;

export function buildExtrudedProfile(profileId: string, lengthMetres: number): THREE.BufferGeometry {
  const profile = PROFILES[profileId];
  if (!profile) {
    console.warn(`Profile "${profileId}" not found, falling back to box`);
    return new THREE.BoxGeometry(0.15, 0.15, lengthMetres);
  }
  return extrudeFromPoints(profile.points, lengthMetres);
}

export function extrudeFromPoints(pointsMm: [number, number][], lengthMetres: number): THREE.ExtrudeGeometry {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pointsMm) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const shape = new THREE.Shape();
  pointsMm.forEach(([x, y], i) => {
    const mx = mm(x - cx);
    const my = mm(y - cy);
    if (i === 0) shape.moveTo(mx, my);
    else shape.lineTo(mx, my);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: lengthMetres, bevelEnabled: false });
  geo.translate(0, 0, -lengthMetres / 2);
  return geo;
}

export function getProfileDimensions(profileId: string): { width: number; height: number } {
  const profile = PROFILES[profileId];
  if (!profile) return { width: 0.15, height: 0.15 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of profile.points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { width: mm(maxX - minX), height: mm(maxY - minY) };
}
```

---

## Beam Profiles
**File: `src/data/profiles/beam-profiles.ts`**

```typescript
export interface Profile2D {
  id: string;
  label: string;
  points: [number, number][];
  category: 'beam' | 'column' | 'gutter' | 'sheet';
}

export const PROBEAM_150: Profile2D = {
  id: 'probeam-150', label: '150 Pro-beam', category: 'beam',
  points: [[0, 0], [150, 0], [150, 150], [0, 150]],
};

export const COLUMN_100: Profile2D = {
  id: 'column-100', label: '100×100 Steel Post', category: 'column',
  points: [[0, 0], [100, 0], [100, 100], [0, 100]],
};

export const COLUMN_140: Profile2D = {
  id: 'column-140', label: '140×140 Timber-print Aluminium', category: 'column',
  points: [[0, 0], [140, 0], [140, 140], [0, 140]],
};

export const GUTTER_OUTBACK: Profile2D = {
  id: 'gutter-outback', label: 'Outback Gutter', category: 'gutter',
  points: [[0, 0], [115, 0], [115, 75], [105, 75], [105, 10], [0, 10]],
};

export const PROFILES: Record<string, Profile2D> = {
  'probeam-150': PROBEAM_150,
  'column-100': COLUMN_100,
  'column-140': COLUMN_140,
  'gutter-outback': GUTTER_OUTBACK,
};
```

---

## Stratco Catalog
**File: `src/data/stratco-catalog.ts`**

```typescript
export interface BeamSpec {
  id: string; label: string; profileHeight: number; profileWidth: number;
  thickness: number; mass: number; maxSpan: number; fluted: boolean;
}

export const BEAMS: BeamSpec[] = [
  { id: 'probeam-120', label: '120 Pro-beam', profileHeight: 120, profileWidth: 50, thickness: 1.0, mass: 3.68, maxSpan: 4500, fluted: true },
  { id: 'probeam-150', label: '150 Pro-beam', profileHeight: 150, profileWidth: 50, thickness: 1.2, mass: 5.0, maxSpan: 8400, fluted: true },
];

export interface ColumnSpec {
  id: string; label: string; size: number; shape: 'square' | 'round'; decorative: boolean;
}

export const COLUMNS: ColumnSpec[] = [
  { id: 'col-75', label: '75×75 Steel', size: 75, shape: 'square', decorative: false },
  { id: 'col-100', label: '100×100 Steel', size: 100, shape: 'square', decorative: false },
  { id: 'col-140', label: '140×140 Timber-print Aluminium', size: 140, shape: 'square', decorative: true },
];

export interface SheetSpec {
  id: string; label: string; thickness: number; coverWidth: number;
  maxSpan: number; insulated: boolean; ribHeight: number; ribSpacing: number;
}

export const SHEETS: SheetSpec[] = [
  { id: 'outback-deck', label: 'Outback Deck (Flatdek)', thickness: 0.42, coverWidth: 680, maxSpan: 4500, insulated: false, ribHeight: 0, ribSpacing: 0 },
  { id: 'outback-superdek', label: 'Outback Superdek', thickness: 0.42, coverWidth: 700, maxSpan: 4500, insulated: false, ribHeight: 18, ribSpacing: 180 },
  { id: 'cooldek-50', label: 'Cooldek 50mm', thickness: 50, coverWidth: 1000, maxSpan: 4500, insulated: true, ribHeight: 17, ribSpacing: 200 },
  { id: 'cooldek-75', label: 'Cooldek 75mm', thickness: 75, coverWidth: 1000, maxSpan: 4500, insulated: true, ribHeight: 17, ribSpacing: 200 },
];

export interface GutterSpec { id: string; label: string; width: number; height: number; }
export const GUTTERS: GutterSpec[] = [
  { id: 'outback-gutter', label: 'Outback Gutter', width: 115, height: 75 },
  { id: 'edge-gutter', label: 'Edge Gutter (Evolution)', width: 90, height: 55 },
];

export const DOWNPIPE = { diameter: 65 };

export const BRACKETS = {
  wallBracket: { width: 120, height: 80, depth: 50 },
  beamEndBracket: { width: 50, height: 80 },
  beamToBeamBracket: { width: 100, height: 120 },
  postBracket: { width: 100, height: 20 },
  postCap: { width: 100, height: 15 },
};

export interface PatioTypeSpec {
  id: 'type1' | 'type2' | 'type3' | 'type4';
  label: string; description: string; maxSpan: number;
  hasOverhang: boolean; overhangDistance: number;
  hasPurlins: boolean; hasMidPurlin: boolean;
  sheetDirection: 'depth' | 'width'; defaultBeam: string;
}

export const PATIO_TYPES: PatioTypeSpec[] = [
  { id: 'type1', label: 'Type 1', description: 'Standard flat — up to 4.5m span', maxSpan: 4500, hasOverhang: false, overhangDistance: 0, hasPurlins: false, hasMidPurlin: false, sheetDirection: 'depth', defaultBeam: 'probeam-120' },
  { id: 'type2', label: 'Type 2', description: 'Flat with front overhang — up to 5.4m', maxSpan: 5400, hasOverhang: true, overhangDistance: 900, hasPurlins: false, hasMidPurlin: false, sheetDirection: 'depth', defaultBeam: 'probeam-120' },
  { id: 'type3', label: 'Type 3', description: 'Cross-purlin support — sheets run horizontally', maxSpan: 8400, hasOverhang: false, overhangDistance: 0, hasPurlins: true, hasMidPurlin: false, sheetDirection: 'width', defaultBeam: 'probeam-150' },
  { id: 'type4', label: 'Type 4', description: 'Mid-span purlin — up to 8.4m span', maxSpan: 8400, hasOverhang: false, overhangDistance: 0, hasPurlins: true, hasMidPurlin: true, sheetDirection: 'depth', defaultBeam: 'probeam-150' },
];

export function selectPatioType(spanMm: number, isFreestanding: boolean): PatioTypeSpec {
  if (spanMm <= 4500) return PATIO_TYPES[0];
  if (spanMm <= 5400 && !isFreestanding) return PATIO_TYPES[1];
  if (spanMm <= 6000) return PATIO_TYPES[2];
  return PATIO_TYPES[3];
}

export function selectBeamForSpan(spanMm: number): BeamSpec {
  return BEAMS[1]; // 150 Pro-beam
}

export function selectSheet(material: 'insulated' | 'colorbond', colorbondType: 'superdek' | 'flatdek'): SheetSpec {
  if (material === 'insulated') return SHEETS[2];
  if (colorbondType === 'superdek') return SHEETS[1];
  return SHEETS[0];
}

export const BUILD_ORDER = [
  '1. Footings & base plates', '2. Columns (posts)', '3. Wall brackets (if attached)',
  '4. Beams — back beam first, then side beams, then front beam',
  '5. Beam-to-beam brackets at intersections', '6. Purlins (Type 3/4 only)',
  '7. Roof sheets — laid from back to front', '8. Gutters', '9. Downpipes',
  '10. Post caps & trim', '11. Accessories (lights, fans)',
] as const;
```

---

## Config Wizard
**File: `src/components/configurator/ConfigWizard.tsx`**

```tsx
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { PatioConfig, AttachmentSide, WallSide, FrameFinish, HdriPreset } from "@/types/configurator";
import { FRAME_COLORS } from "@/types/configurator";
import WallEditorPanel from "./WallEditorPanel";

interface ConfigWizardProps {
  config: PatioConfig;
  onChange: (config: PatioConfig) => void;
  onGetQuote: () => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  selectedWall?: WallSide | null;
  onSelectWall?: (side: WallSide | null) => void;
}

const STEPS = ['Material', 'Style', 'Dimensions', 'Colour', 'Walls', 'Accessories'];

export default function ConfigWizard({ config, onChange, onGetQuote, activeStep, onStepChange, selectedWall, onSelectWall }: ConfigWizardProps) {
  const [internalStep, setInternalStep] = useState(0);
  const step = activeStep ?? internalStep;
  const setStep = (s: number) => { setInternalStep(s); onStepChange?.(s); };

  const update = (partial: Partial<PatioConfig>) =>
    onChange({ ...config, ...partial });

  const updateAccessory = (key: keyof PatioConfig['accessories'], val: boolean) =>
    onChange({ ...config, accessories: { ...config.accessories, [key]: val } });

  const canNext = step < STEPS.length - 1;
  const canPrev = step > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-5 pt-5 pb-3">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 text-center py-1.5 text-[10px] font-medium rounded transition-colors ${
              i === step ? 'bg-primary text-primary-foreground'
                : i < step ? 'bg-primary/20 text-primary'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {i < step ? <span className="flex items-center justify-center gap-1"><Check className="w-3 h-3" />{s}</span> : s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Roof Material</h3>
            <div className="grid grid-cols-1 gap-2">
              {(['insulated', 'colorbond'] as const).map((mat) => (
                <button key={mat} onClick={() => update({ material: mat })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    config.material === mat ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                  }`}>
                  <span className="font-medium text-foreground capitalize">{mat === 'insulated' ? 'Insulated Panel' : 'Colorbond'}</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mat === 'insulated' ? 'Stratco insulated panels — superior thermal performance' : 'Classic Colorbond steel — lightweight & durable'}
                  </p>
                </button>
              ))}
            </div>
            {config.material === 'colorbond' && (
              <div className="space-y-2 mt-3">
                <span className="text-sm text-muted-foreground">Profile</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['superdek', 'flatdek'] as const).map((t) => (
                    <button key={t} onClick={() => update({ colorbondType: t })}
                      className={`px-3 py-2 rounded border text-sm transition-all ${
                        config.colorbondType === t ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}>
                      {t === 'superdek' ? 'Superdek' : 'Flatdek'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Roof Shape</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['flat', 'gable'] as const).map((s) => (
                  <button key={s} onClick={() => update({ shape: s })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      config.shape === s ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}>
                    {s === 'flat' ? 'Flat' : 'Gable'}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-display text-lg font-semibold text-foreground">Style</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['skillion', 'fly-over', 'free-standing', 'skyline', 'timber-look'] as const).map((s) => (
                  <button key={s} onClick={() => update({ style: s })}
                    className={`px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                      config.style === s ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                    }`}>
                    <span className="font-medium text-foreground capitalize">{s.replace('-', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
            {config.style !== 'free-standing' && (
              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                <p className="text-xs text-muted-foreground">
                  Configure wall attachments in the <button onClick={() => setStep(4)} className="text-primary font-medium hover:underline">Walls</button> step.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-foreground">Dimensions</h3>
            {[
              { label: 'Width', key: 'width' as const, min: 2, max: 12, step: 0.5, unit: 'm' },
              { label: 'Depth', key: 'depth' as const, min: 2, max: 8, step: 0.5, unit: 'm' },
              { label: 'Height', key: 'height' as const, min: 2.4, max: 4.5, step: 0.1, unit: 'm' },
            ].map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{dim.label}</span>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {config[dim.key].toFixed(1)}{dim.unit}
                  </Badge>
                </div>
                <Slider value={[config[dim.key]]} onValueChange={([v]) => update({ [dim.key]: v })} min={dim.min} max={dim.max} step={dim.step} />
              </div>
            ))}
            <div className="bg-secondary/50 rounded p-3 text-xs text-muted-foreground">
              Area: <span className="text-foreground font-medium">{(config.width * config.depth).toFixed(1)} m²</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Frame Colour</h3>
            <div className="grid grid-cols-4 gap-3">
              {FRAME_COLORS.map((c) => (
                <button key={c.hex} onClick={() => update({ frameColor: c.hex })} className="flex flex-col items-center gap-1.5 group">
                  <div className={`w-10 h-10 rounded-full border-2 transition-all ${
                    config.frameColor === c.hex ? 'border-primary scale-110' : 'border-border group-hover:border-primary/50'
                  }`} style={{ backgroundColor: c.hex }} />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Aluminium Finish</span>
              <div className="grid grid-cols-4 gap-2">
                {(['matte', 'satin', 'gloss', 'mirror'] as FrameFinish[]).map((f) => (
                  <button key={f} onClick={() => update({ frameFinish: f })}
                    className={`px-2 py-2 rounded border text-xs font-medium capitalize transition-all ${
                      (config.frameFinish ?? 'gloss') === f ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Reflection Strength</span>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{(config.reflectionStrength ?? 2.2).toFixed(1)}</Badge>
              </div>
              <Slider value={[config.reflectionStrength ?? 2.2]} onValueChange={([v]) => update({ reflectionStrength: v })} min={0.8} max={3.2} step={0.1} />
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Environment</span>
              <div className="grid grid-cols-2 gap-2">
                {([{ key: 'day' as HdriPreset, label: 'Bright Day' }, { key: 'studio' as HdriPreset, label: 'Studio' }]).map(({ key, label }) => (
                  <button key={key} onClick={() => update({ hdriPreset: key })}
                    className={`px-3 py-2 rounded border text-sm transition-all ${
                      (config.hdriPreset ?? 'day') === key ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <WallEditorPanel config={config} onChange={onChange} selectedWall={selectedWall ?? null} onSelectWall={onSelectWall ?? (() => {})} />
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Accessories</h3>
            {([
              { key: 'lighting' as const, label: 'LED Downlights', desc: 'Recessed ceiling lights' },
              { key: 'fans' as const, label: 'Ceiling Fan', desc: 'Outdoor-rated ceiling fan' },
              { key: 'gutters' as const, label: 'Gutters & Downpipes', desc: 'Integrated water management' },
              { key: 'designerBeam' as const, label: 'Designer Beam', desc: 'Decorative front fascia beam' },
              { key: 'columns' as const, label: 'Decorative Columns', desc: 'Cylindrical post wraps' },
            ]).map((acc) => (
              <div key={acc.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-foreground">{acc.label}</span>
                  <p className="text-xs text-muted-foreground">{acc.desc}</p>
                </div>
                <Switch checked={config.accessories[acc.key]} onCheckedChange={(v) => updateAccessory(acc.key, v)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-border flex gap-2">
        {canPrev && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        {canNext ? (
          <Button onClick={() => setStep(step + 1)} className="flex-1">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onGetQuote} className="flex-1">Get Free Quote</Button>
        )}
      </div>
    </div>
  );
}
```

---

## Wall Editor Panel
**File: `src/components/configurator/WallEditorPanel.tsx`**

*(See full contents in Wall Editor Mesh section above — this is the 2D panel UI with sliders)*

---

## Quote Panel
**File: `src/components/configurator/QuotePanel.tsx`**

*(See full contents above)*

---

## Lead Capture Dialog
**File: `src/components/configurator/LeadCaptureDialog.tsx`**

*(See full contents above)*

---

## Patio Configurator Page
**File: `src/pages/PatioConfigurator.tsx`**

*(See full contents above)*

---

## Index CSS
**File: `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Archivo:wght@400;500;600;700;800&display=swap');

@layer base {
  :root {
    --background: 0 0% 5%;
    --foreground: 40 10% 92%;
    --card: 0 0% 9%;
    --card-foreground: 40 10% 92%;
    --popover: 0 0% 9%;
    --popover-foreground: 40 10% 92%;
    --primary: 40 52% 56%;
    --primary-foreground: 0 0% 5%;
    --secondary: 0 0% 14%;
    --secondary-foreground: 40 10% 85%;
    --muted: 0 0% 14%;
    --muted-foreground: 0 0% 55%;
    --accent: 40 52% 56%;
    --accent-foreground: 0 0% 5%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --border: 0 0% 16%;
    --input: 0 0% 16%;
    --ring: 40 52% 56%;
    --radius: 0.5rem;
    --gold: 40 52% 56%;
    --gold-light: 40 60% 72%;
    --gold-dark: 38 45% 38%;
    --sidebar-background: 0 0% 7%;
    --sidebar-foreground: 40 10% 85%;
    --sidebar-primary: 40 52% 56%;
    --sidebar-primary-foreground: 0 0% 5%;
    --sidebar-accent: 0 0% 14%;
    --sidebar-accent-foreground: 40 10% 85%;
    --sidebar-border: 0 0% 16%;
    --sidebar-ring: 40 52% 56%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; font-family: 'Inter', sans-serif; }
  h1, h2, h3, h4 { font-family: 'Archivo', sans-serif; }
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: hsl(var(--background)); }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }
```

---

## App Router
**File: `src/App.tsx`**

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PatioConfigurator from "./pages/PatioConfigurator";
import QATestPanel from "./pages/QATestPanel";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AppLayout from "./components/app/AppLayout";
import ProjectsPage from "./pages/app/ProjectsPage";
import ProjectDetailPage from "./pages/app/ProjectDetailPage";
import AdminPage from "./pages/app/AdminPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";
import SharePage from "./pages/SharePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/configure/patios" element={<PatioConfigurator />} />
          <Route path="/embed/patios" element={<PatioConfigurator />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route path="/app" element={<AppLayout />}>
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="/dev/qa" element={<QATestPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```
