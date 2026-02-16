import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import PatioMesh from "./PatioMesh";
import type { PatioConfig } from "@/types/configurator";
import { useRef, useCallback } from "react";
import { Camera, RotateCcw } from "lucide-react";

interface PatioSceneProps {
  config: PatioConfig;
}

export default function PatioScene({ config }: PatioSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);

  const camDist = Math.max(config.width, config.depth) * 1.1 + 3;

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
        <fog attach="fog" args={['#b0a898', camDist * 2.5, camDist * 5]} />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 8, -3]} intensity={0.4} />

        <PatioMesh config={config} />

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={25}
          blur={2.5}
          far={12}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          minDistance={2}
          maxDistance={25}
          maxPolarAngle={Math.PI * 0.85}
          target={[0, config.height / 2, 0]}
        />

        <Environment preset="city" />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2">
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
