import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import PergolaMesh from "./PergolaMesh";

interface PergolaSceneProps {
  config: {
    width: number;
    depth: number;
    height: number;
    postCount: number;
    mountType: "freestanding" | "wall-mounted";
    rafterCount: number;
  };
}

export default function PergolaScene({ config }: PergolaSceneProps) {
  const camDistance = Math.max(config.width, config.depth) * 1.2 + 2;

  return (
    <Canvas
      shadows
      camera={{ position: [camDistance, camDistance * 0.7, camDistance], fov: 40 }}
      className="w-full h-full"
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 8, -4]} intensity={0.3} />

      <PergolaMesh config={config} />

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, config.height / 2, 0]}
      />

      <Environment preset="city" />
    </Canvas>
  );
}
