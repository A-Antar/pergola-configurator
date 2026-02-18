import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import PatioMesh from "./PatioMesh";
import WallEditorMesh from "./WallEditorMesh";
import DebugOverlay from "./DebugOverlay";
import type { PatioConfig, WallSide } from "@/types/configurator";
import type { Part } from "@/lib/patio-engine";
import { QUALITY_PRESETS, type QualityLevel } from "@/lib/materials";
import { useRef, useCallback, useState, useEffect } from "react";
import {
  Camera, RotateCcw, Sun, Moon, Lightbulb, Eye,
  Maximize2, RotateCw, Sparkles, Gauge,
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

type LightingPreset = 'day' | 'dusk' | 'studio';
type CameraPreset = 'iso' | 'front' | 'left' | 'right' | 'under' | 'top';

const LIGHTING: Record<LightingPreset, {
  ambient: number; dir1: number; dir2: number; dir1Color: string; dir2Color: string;
  env: string; fogColor: string; bgGradient: string;
}> = {
  day: {
    ambient: 0.25, dir1: 1.8, dir2: 0.5,
    dir1Color: '#fff5e6', dir2Color: '#c4d4ff',
    env: 'city', fogColor: '#b8b0a4',
    bgGradient: 'linear-gradient(180deg, #c8c2b8 0%, #a89f93 60%, #8a8278 100%)',
  },
  dusk: {
    ambient: 0.12, dir1: 1.0, dir2: 0.25,
    dir1Color: '#ffccaa', dir2Color: '#6677aa',
    env: 'sunset', fogColor: '#8a7560',
    bgGradient: 'linear-gradient(180deg, #9a7a60 0%, #6b5848 60%, #4a3a30 100%)',
  },
  studio: {
    ambient: 0.4, dir1: 2.2, dir2: 0.8,
    dir1Color: '#ffffff', dir2Color: '#e8e0d8',
    env: 'studio', fogColor: '#c8c0b4',
    bgGradient: 'linear-gradient(180deg, #d8d2cc 0%, #c0b8ac 60%, #a8a098 100%)',
  },
};

/* ── Smooth camera animator ──────────────────────────────── */
function CameraAnimator({ targetPos, targetLookAt, enabled, onComplete }: {
  targetPos: THREE.Vector3 | null;
  targetLookAt: THREE.Vector3 | null;
  enabled: boolean;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const progress = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    if (enabled && targetPos && targetLookAt) {
      startPos.current.copy(camera.position);
      // Get current target from orbit controls or default
      startTarget.current.set(0, 1.4, 0);
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
  const [lighting, setLighting] = useState<LightingPreset>('day');
  const [showDims, setShowDims] = useState<'off' | 'key' | 'all'>('off');
  const [autoRotate, setAutoRotate] = useState(false);
  const [internalQuality, setInternalQuality] = useState<QualityLevel>('balanced');
  const quality = externalQuality ?? internalQuality;
  const qSettings = QUALITY_PRESETS[quality];

  // Camera animation state
  const [camTarget, setCamTarget] = useState<{ pos: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);
  const [animating, setAnimating] = useState(false);

  const camDist = Math.max(config.width, config.depth) * 1.1 + 3;
  const light = LIGHTING[lighting];

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
        style={{ background: light.bgGradient }}
      >
        <fog attach="fog" args={[light.fogColor, camDist * 3, camDist * 6]} />

        {/* Ambient fill */}
        <ambientLight intensity={light.ambient} />

        {/* Key light — warm directional */}
        <directionalLight
          position={[8, 14, 6]}
          intensity={light.dir1}
          color={light.dir1Color}
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

        {/* Fill light — cool */}
        <directionalLight
          position={[-5, 8, -3]}
          intensity={light.dir2}
          color={light.dir2Color}
        />

        {/* Step 2: Multi-directional rim/bounce lights for realistic aluminium reflections */}
        <directionalLight position={[-8, 3, 8]} intensity={0.7} color="#d4dce8" />
        <directionalLight position={[6, 2, -6]} intensity={0.5} color="#e0d8cc" />
        <directionalLight position={[0, 10, 0]} intensity={0.4} color="#ffffff" />
        <pointLight position={[0, 1.5, 0]} intensity={0.3} color="#f0e8d8" distance={15} />

        <PatioMesh config={config} onPartClick={onPartClick} />

        {/* Debug overlay */}
        {debugMode && debugParts && (
          <DebugOverlay parts={debugParts} showLabels={showDebugLabels} showBoundingBoxes />
        )}

        {/* Wall Editor overlay (when in wall edit mode or dimensions shown) */}
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

        {/* Camera animator */}
        <CameraAnimator
          targetPos={camTarget?.pos ?? null}
          targetLookAt={camTarget?.lookAt ?? null}
          enabled={animating}
          onComplete={onAnimComplete}
        />

        {/* Auto rotate */}
        <AutoRotate enabled={autoRotate} />

        {/* Step 3: Strong hemisphere light acts as environment reflection source */}
        <hemisphereLight args={['#d8e4f4', '#a09080', 0.8]} />
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
        {/* Lighting */}
        <div className="flex gap-0.5 bg-background/70 backdrop-blur-md border border-border/50 rounded-lg p-0.5">
          {([
            { key: 'day' as const, icon: Sun, label: 'Day' },
            { key: 'dusk' as const, icon: Moon, label: 'Dusk' },
            { key: 'studio' as const, icon: Lightbulb, label: 'Studio' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setLighting(key)}
              title={label}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all duration-200 ${
                lighting === key
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

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
