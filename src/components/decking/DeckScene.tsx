import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import DeckMesh from "./DeckMesh";
import type { DeckingConfig } from "@/types/decking";

interface DeckSceneProps {
  config: DeckingConfig;
}

export default function DeckScene({ config }: DeckSceneProps) {
  const maxDim = Math.max(config.length, config.width, config.height * 2);

  return (
    <Canvas
      shadows
      camera={{ position: [maxDim * 1.1, maxDim * 0.8, maxDim * 1.1], fov: 40 }}
      gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.1 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <DeckMesh config={config} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#b5ada0" roughness={0.95} />
      </mesh>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        blur={2}
        far={10}
        resolution={512}
      />

      <Environment preset="city" />
      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={25}
        target={[0, config.height / 2, 0]}
      />
    </Canvas>
  );
}
