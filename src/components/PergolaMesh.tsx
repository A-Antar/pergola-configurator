import { useMemo } from "react";
import * as THREE from "three";

interface PergolaConfig {
  width: number;
  depth: number;
  height: number;
  postCount: number;
  mountType: "freestanding" | "wall-mounted";
  rafterCount: number;
}

const POST_SIZE = 0.12;
const BEAM_HEIGHT = 0.15;
const BEAM_DEPTH = 0.08;
const RAFTER_HEIGHT = 0.1;
const RAFTER_WIDTH = 0.06;

const woodMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color("hsl(28, 50%, 45%)"),
  roughness: 0.8,
  metalness: 0.05,
});

const wallMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color("hsl(30, 8%, 75%)"),
  roughness: 0.9,
  metalness: 0,
});

const mountBracketMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color("hsl(0, 0%, 35%)"),
  roughness: 0.4,
  metalness: 0.8,
});

const groundMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color("hsl(30, 12%, 82%)"),
  roughness: 1,
  metalness: 0,
});

export default function PergolaMesh({ config }: { config: PergolaConfig }) {
  const { width, depth, height, postCount, mountType, rafterCount } = config;

  const posts = useMemo(() => {
    const arr: { x: number; z: number; side: "front" | "back" }[] = [];
    const isWallMounted = mountType === "wall-mounted";

    // Front posts (always present)
    const frontPosts = Math.max(2, Math.ceil(postCount / (isWallMounted ? 1 : 2)));
    for (let i = 0; i < frontPosts; i++) {
      const x = frontPosts === 1 ? 0 : -width / 2 + (width / (frontPosts - 1)) * i;
      arr.push({ x, z: depth / 2, side: "front" });
    }

    // Back posts (only for freestanding)
    if (!isWallMounted) {
      const backPosts = Math.max(2, postCount - frontPosts);
      for (let i = 0; i < backPosts; i++) {
        const x = backPosts === 1 ? 0 : -width / 2 + (width / (backPosts - 1)) * i;
        arr.push({ x, z: -depth / 2, side: "back" });
      }
    }

    return arr;
  }, [width, depth, postCount, mountType]);

  const rafters = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < rafterCount; i++) {
      arr.push(-width / 2 + (width / (rafterCount - 1)) * i);
    }
    return arr;
  }, [width, rafterCount]);

  const isWallMounted = mountType === "wall-mounted";

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={groundMaterial}>
        <planeGeometry args={[width + 3, depth + 3]} />
      </mesh>

      {/* Wall (if wall-mounted) */}
      {isWallMounted && (
        <mesh position={[0, height / 2, -depth / 2 - 0.1]} material={wallMaterial}>
          <boxGeometry args={[width + 1, height + 0.5, 0.2]} />
        </mesh>
      )}

      {/* Posts */}
      {posts.map((post, i) => (
        <group key={`post-${i}`}>
          <mesh position={[post.x, height / 2, post.z]} material={woodMaterial}>
            <boxGeometry args={[POST_SIZE, height, POST_SIZE]} />
          </mesh>
          {/* Base plate */}
          <mesh position={[post.x, 0.01, post.z]} material={mountBracketMaterial}>
            <boxGeometry args={[0.2, 0.02, 0.2]} />
          </mesh>
          {/* Anchor bolts visual */}
          {[[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]].map(([dx, dz], j) => (
            <mesh key={j} position={[post.x + dx, 0.025, post.z + dz]} material={mountBracketMaterial}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Wall mounting brackets */}
      {isWallMounted && (
        <>
          {[- width / 2 + 0.2, width / 2 - 0.2].map((x, i) => (
            <group key={`bracket-${i}`}>
              <mesh position={[x, height - 0.1, -depth / 2 + 0.02]} material={mountBracketMaterial}>
                <boxGeometry args={[0.15, 0.15, 0.04]} />
              </mesh>
              <mesh position={[x, height - 0.1, -depth / 2 + 0.12]} material={mountBracketMaterial}>
                <boxGeometry args={[0.04, 0.12, 0.2]} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Side beams (run along depth on both sides) */}
      <mesh position={[-width / 2, height - BEAM_HEIGHT / 2, 0]} material={woodMaterial}>
        <boxGeometry args={[BEAM_DEPTH, BEAM_HEIGHT, depth]} />
      </mesh>
      <mesh position={[width / 2, height - BEAM_HEIGHT / 2, 0]} material={woodMaterial}>
        <boxGeometry args={[BEAM_DEPTH, BEAM_HEIGHT, depth]} />
      </mesh>

      {/* Front beam */}
      <mesh position={[0, height - BEAM_HEIGHT / 2, depth / 2]} material={woodMaterial}>
        <boxGeometry args={[width + BEAM_DEPTH, BEAM_HEIGHT, BEAM_DEPTH]} />
      </mesh>

      {/* Back beam */}
      <mesh position={[0, height - BEAM_HEIGHT / 2, -depth / 2]} material={woodMaterial}>
        <boxGeometry args={[width + BEAM_DEPTH, BEAM_HEIGHT, BEAM_DEPTH]} />
      </mesh>

      {/* Rafters (run along depth) */}
      {rafters.map((x, i) => (
        <mesh key={`rafter-${i}`} position={[x, height + RAFTER_HEIGHT / 2, 0]} material={woodMaterial}>
          <boxGeometry args={[RAFTER_WIDTH, RAFTER_HEIGHT, depth + 0.3]} />
        </mesh>
      ))}

      {/* Cross slats on top of rafters */}
      {Array.from({ length: Math.ceil(depth / 0.3) }).map((_, i) => {
        const z = -depth / 2 + i * 0.3;
        return (
          <mesh key={`slat-${i}`} position={[0, height + RAFTER_HEIGHT + 0.015, z]} material={woodMaterial}>
            <boxGeometry args={[width + 0.3, 0.03, 0.04]} />
          </mesh>
        );
      })}
    </group>
  );
}
