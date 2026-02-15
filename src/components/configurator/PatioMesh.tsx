import { useMemo } from "react";
import * as THREE from "three";
import type { PatioConfig } from "@/types/configurator";

const POST_SIZE = 0.1;
const BEAM_H = 0.12;
const BEAM_W = 0.06;
const RAFTER_H = 0.08;
const RAFTER_W = 0.05;
const ROOF_THICKNESS = 0.04;
const GUTTER_SIZE = 0.08;

function makeMat(hex: string, metalness = 0.3, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness, roughness });
}

const groundMat = makeMat('#2a2a2a', 0, 1);
const wallMat = makeMat('#3a3a3a', 0, 0.95);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#88ccff'),
  transparent: true,
  opacity: 0.15,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.9,
});

export default function PatioMesh({ config }: { config: PatioConfig }) {
  const { width, depth, height, shape, style, frameColor, accessories } = config;
  const frameMat = useMemo(() => makeMat(frameColor), [frameColor]);
  const roofMat = useMemo(
    () => makeMat(frameColor, 0.4, 0.5),
    [frameColor]
  );

  const isFreestanding = style === 'free-standing';
  const isGable = shape === 'gable';
  const isSkyline = style === 'skyline';
  const slopeAngle = style === 'skillion' ? 0.08 : 0.03;
  const gableHeight = isGable ? Math.min(width, depth) * 0.2 : 0;

  // Post positions
  const posts = useMemo(() => {
    const arr: [number, number][] = [];
    // Front posts
    arr.push([-width / 2, depth / 2]);
    arr.push([width / 2, depth / 2]);
    if (width > 5) arr.push([0, depth / 2]);

    if (isFreestanding) {
      arr.push([-width / 2, -depth / 2]);
      arr.push([width / 2, -depth / 2]);
      if (width > 5) arr.push([0, -depth / 2]);
    }
    return arr;
  }, [width, depth, isFreestanding]);

  const rafterCount = Math.max(4, Math.round(width / 0.6));
  const roofY = height;

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={groundMat} receiveShadow>
        <planeGeometry args={[width + 4, depth + 4]} />
      </mesh>

      {/* Wall (attached styles) */}
      {!isFreestanding && (
        <mesh position={[0, height / 2 + 0.5, -depth / 2 - 0.1]} material={wallMat} receiveShadow>
          <boxGeometry args={[width + 2, height + 1.5, 0.2]} />
        </mesh>
      )}

      {/* Posts */}
      {posts.map(([x, z], i) => (
        <group key={`post-${i}`}>
          <mesh position={[x, height / 2, z]} material={frameMat} castShadow>
            <boxGeometry args={[POST_SIZE, height, POST_SIZE]} />
          </mesh>
          {/* Base plate */}
          <mesh position={[x, 0.005, z]} material={frameMat}>
            <boxGeometry args={[0.18, 0.01, 0.18]} />
          </mesh>
        </group>
      ))}

      {/* Decorative columns */}
      {accessories.columns && posts.map(([x, z], i) => (
        <mesh key={`col-${i}`} position={[x, height * 0.35, z]} material={frameMat} castShadow>
          <cylinderGeometry args={[0.06, 0.08, height * 0.7, 12]} />
        </mesh>
      ))}

      {/* Beams */}
      {/* Side beams */}
      <mesh position={[-width / 2, roofY - BEAM_H / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[BEAM_W, BEAM_H, depth]} />
      </mesh>
      <mesh position={[width / 2, roofY - BEAM_H / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[BEAM_W, BEAM_H, depth]} />
      </mesh>
      {/* Front beam */}
      <mesh position={[0, roofY - BEAM_H / 2, depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width + BEAM_W, BEAM_H, BEAM_W]} />
      </mesh>
      {/* Back beam */}
      <mesh position={[0, roofY - BEAM_H / 2, -depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width + BEAM_W, BEAM_H, BEAM_W]} />
      </mesh>

      {/* Designer beam (thicker decorative beam) */}
      {accessories.designerBeam && (
        <mesh position={[0, roofY - BEAM_H * 1.8, depth / 2]} material={frameMat} castShadow>
          <boxGeometry args={[width + BEAM_W, BEAM_H * 0.6, BEAM_W * 2]} />
        </mesh>
      )}

      {/* Rafters */}
      {Array.from({ length: rafterCount }).map((_, i) => {
        const x = -width / 2 + (width / (rafterCount - 1)) * i;
        const slopeOffset = slopeAngle * depth;
        const midY = roofY + RAFTER_H / 2;

        if (isGable) {
          const t = Math.abs(x) / (width / 2);
          const gableY = gableHeight * (1 - t);
          return (
            <mesh key={`r-${i}`} position={[x, midY + gableY, 0]} material={frameMat} castShadow>
              <boxGeometry args={[RAFTER_W, RAFTER_H, depth + 0.15]} />
            </mesh>
          );
        }

        return (
          <group key={`r-${i}`}>
            <mesh
              position={[x, midY + slopeOffset / 2, 0]}
              rotation={[slopeAngle, 0, 0]}
              material={frameMat}
              castShadow
            >
              <boxGeometry args={[RAFTER_W, RAFTER_H, depth + 0.15]} />
            </mesh>
          </group>
        );
      })}

      {/* Roof panels */}
      {isGable ? (
        <>
          {/* Left slope */}
          <mesh
            position={[-width / 4, roofY + ROOF_THICKNESS / 2 + gableHeight / 2, 0]}
            rotation={[0, 0, Math.atan2(gableHeight, width / 2)]}
            material={roofMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width / 2 + 0.1, ROOF_THICKNESS, depth + 0.1]} />
          </mesh>
          {/* Right slope */}
          <mesh
            position={[width / 4, roofY + ROOF_THICKNESS / 2 + gableHeight / 2, 0]}
            rotation={[0, 0, -Math.atan2(gableHeight, width / 2)]}
            material={roofMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width / 2 + 0.1, ROOF_THICKNESS, depth + 0.1]} />
          </mesh>
        </>
      ) : isSkyline ? (
        <>
          {/* Two panels with gap */}
          <mesh
            position={[-width / 4 - 0.15, roofY + ROOF_THICKNESS / 2, 0]}
            rotation={[slopeAngle, 0, 0]}
            material={roofMat}
            castShadow
          >
            <boxGeometry args={[width / 2 - 0.2, ROOF_THICKNESS, depth + 0.1]} />
          </mesh>
          <mesh
            position={[width / 4 + 0.15, roofY + ROOF_THICKNESS / 2 + 0.15, 0]}
            rotation={[slopeAngle, 0, 0]}
            material={roofMat}
            castShadow
          >
            <boxGeometry args={[width / 2 - 0.2, ROOF_THICKNESS, depth + 0.1]} />
          </mesh>
          {/* Skylight glass strip */}
          <mesh position={[0, roofY + 0.1, 0]} material={glassMat}>
            <boxGeometry args={[0.3, 0.02, depth + 0.1]} />
          </mesh>
        </>
      ) : (
        <mesh
          position={[0, roofY + ROOF_THICKNESS / 2, 0]}
          rotation={[slopeAngle, 0, 0]}
          material={roofMat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width + 0.15, ROOF_THICKNESS, depth + 0.1]} />
        </mesh>
      )}

      {/* Gutters */}
      {accessories.gutters && (
        <>
          <mesh position={[0, roofY - 0.02, depth / 2 + GUTTER_SIZE / 2]} material={frameMat}>
            <boxGeometry args={[width + 0.2, GUTTER_SIZE, GUTTER_SIZE]} />
          </mesh>
          {/* Downpipes */}
          {[-width / 2, width / 2].map((x, i) => (
            <mesh key={`dp-${i}`} position={[x, height / 2, depth / 2 + GUTTER_SIZE]} material={frameMat}>
              <cylinderGeometry args={[0.025, 0.025, height, 8]} />
            </mesh>
          ))}
        </>
      )}

      {/* Lighting */}
      {accessories.lighting && Array.from({ length: Math.ceil(width / 1.5) }).map((_, i) => {
        const x = -width / 2 + 0.5 + (i * (width - 1)) / Math.max(1, Math.ceil(width / 1.5) - 1);
        return (
          <group key={`light-${i}`}>
            <mesh position={[x, roofY - 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.03, 12]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <pointLight position={[x, roofY - 0.2, 0]} intensity={0.3} distance={3} color="#ffd699" />
          </group>
        );
      })}

      {/* Fans */}
      {accessories.fans && (
        <group>
          <mesh position={[0, roofY - 0.2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
            <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={`blade-${i}`}
              position={[Math.cos(i * Math.PI / 2) * 0.25, roofY - 0.35, Math.sin(i * Math.PI / 2) * 0.25]}
              rotation={[0, i * Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.4, 0.01, 0.08]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
