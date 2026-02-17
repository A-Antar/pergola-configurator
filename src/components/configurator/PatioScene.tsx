import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import PatioMesh from "./PatioMesh";
import DebugOverlay from "./DebugOverlay";
import type { PatioConfig } from "@/types/configurator";
import type { Part } from "@/lib/patio-engine";
import { useRef, useCallback, useState } from "react";
import { Camera, RotateCcw, Sun, Moon, Lightbulb, Eye } from "lucide-react";

interface PatioSceneProps {
  config: PatioConfig;
  onPartClick?: (part: string) => void;
  debugMode?: boolean;
  debugParts?: Part[];
  showDebugLabels?: boolean;
}

type LightingPreset = 'day' | 'dusk' | 'studio';
type CameraPreset = 'iso' | 'front' | 'left' | 'right' | 'under';

const LIGHTING: Record<LightingPreset, { ambient: number; dir1: number; dir2: number; env: string; fogColor: string }> = {
  day: { ambient: 0.3, dir1: 1.5, dir2: 0.4, env: 'city', fogColor: '#b0a898' },
  dusk: { ambient: 0.15, dir1: 0.8, dir2: 0.2, env: 'sunset', fogColor: '#8a7560' },
  studio: { ambient: 0.5, dir1: 2.0, dir2: 0.6, env: 'studio', fogColor: '#c0b8ac' },
};

export default function PatioScene({ config, onPartClick, debugMode, debugParts, showDebugLabels }: PatioSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const [lighting, setLighting] = useState<LightingPreset>('day');
  const [showDims, setShowDims] = useState(false);

  const camDist = Math.max(config.width, config.depth) * 1.1 + 3;
  const light = LIGHTING[lighting];

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
  }, []);

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const d = camDist;
    const targets: Record<CameraPreset, [number, number, number]> = {
      iso: [d, d * 0.6, d],
      front: [0, config.height * 0.5, d * 1.5],
      left: [-d * 1.5, config.height * 0.5, 0],
      right: [d * 1.5, config.height * 0.5, 0],
      under: [d * 0.3, 0.3, d * 0.3],
    };
    const pos = targets[preset];
    controls.object.position.set(...pos);
    controls.target.set(0, preset === 'under' ? config.height * 0.8 : config.height / 2, 0);
    controls.update();
  }, [camDist, config.height]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        ref={canvasRef}
        shadows
        camera={{ position: [camDist, camDist * 0.6, camDist], fov: 35 }}
        className="w-full h-full"
        gl={{ preserveDrawingBuffer: true }}
        style={{ background: 'linear-gradient(180deg, #d4cfc7 0%, #a89f93 100%)' }}
      >
        <fog attach="fog" args={[light.fogColor, camDist * 2.5, camDist * 5]} />
        <ambientLight intensity={light.ambient} />
        <directionalLight position={[8, 12, 6]} intensity={light.dir1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-5, 8, -3]} intensity={light.dir2} />

        <PatioMesh config={config} onPartClick={onPartClick} />

        {/* Debug overlay */}
        {debugMode && debugParts && (
          <DebugOverlay parts={debugParts} showLabels={showDebugLabels} showBoundingBoxes />
        )}

        {/* Dimension overlays */}
        {showDims && (
          <group>
            {/* Width line */}
            <mesh position={[0, 0.05, config.depth / 2 + 0.5]}>
              <boxGeometry args={[config.width, 0.01, 0.01]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
            {/* Depth line */}
            <mesh position={[config.width / 2 + 0.5, 0.05, 0]}>
              <boxGeometry args={[0.01, 0.01, config.depth]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
            {/* Height line */}
            <mesh position={[config.width / 2 + 0.5, config.height / 2, -config.depth / 2]}>
              <boxGeometry args={[0.01, config.height, 0.01]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>
          </group>
        )}

        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={25} blur={2.5} far={12} />

        <OrbitControls
          ref={controlsRef}
          enablePan enableZoom enableRotate
          minDistance={2} maxDistance={25}
          maxPolarAngle={Math.PI * 0.85}
          target={[0, config.height / 2, 0]}
        />

        <Environment preset={light.env as any} />
      </Canvas>

      {/* Camera presets */}
      <div className="absolute top-4 left-4 flex gap-1.5">
        {(['iso', 'front', 'left', 'right', 'under'] as CameraPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setCameraPreset(p)}
            className="px-2 py-1 rounded bg-card/80 backdrop-blur border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors capitalize"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* Lighting presets */}
        <div className="flex gap-1 mr-2">
          {([
            { key: 'day' as const, icon: Sun },
            { key: 'dusk' as const, icon: Moon },
            { key: 'studio' as const, icon: Lightbulb },
          ]).map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setLighting(key)}
              className={`flex items-center gap-1 px-2 py-2 rounded border text-xs transition-colors ${
                lighting === key
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowDims(!showDims)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded border text-xs transition-colors ${
            showDims
              ? 'bg-primary/20 border-primary text-primary'
              : 'bg-card/80 backdrop-blur border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Dims
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-card/80 backdrop-blur border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={handleScreenshot}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-card/80 backdrop-blur border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Screenshot
        </button>
      </div>

      <p className="absolute bottom-4 left-4 text-[10px] text-muted-foreground/60">
        Drag to rotate · Scroll to zoom · Shift+drag to pan
      </p>
    </div>
  );
}
