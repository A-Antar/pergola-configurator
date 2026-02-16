import { useMemo } from "react";
import * as THREE from "three";
import type { PatioConfig, AttachmentSide } from "@/types/configurator";

const POST_SIZE = 0.1;
const BEAM_H = 0.12;
const BEAM_W = 0.06;
const RAFTER_H = 0.08;
const RAFTER_W = 0.05;
const ROOF_THICKNESS = 0.04;
const GUTTER_SIZE = 0.08;
const INSULATED_THICKNESS = 0.07;

function makeMat(hex: string, metalness = 0.3, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness, roughness });
}

const groundMat = makeMat('#8a8474', 0, 0.95);
const wallMat = makeMat('#c8c0b4', 0, 0.9);
const glassMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#88ccff'),
  transparent: true,
  opacity: 0.15,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.9,
});

export default function PatioMesh({ config }: { config: PatioConfig }) {
  const { width, depth, height, shape, style, frameColor, accessories, material, colorbondType, attachedSides = ['back'] } = config;
  const frameMat = useMemo(() => makeMat(frameColor), [frameColor]);
  const roofMat = useMemo(() => {
    if (material === 'insulated') {
      return makeMat('#e8e0d0', 0.1, 0.7); // cream/white insulated panel look
    }
    return makeMat(frameColor, 0.5, 0.4); // colorbond matches frame
  }, [frameColor, material]);

  const isFreestanding = style === 'free-standing';
  const isGable = shape === 'gable';
  const isSkyline = style === 'skyline';
  const slopeAngle = style === 'skillion' ? 0.08 : 0.03;
  const gableHeight = isGable ? Math.min(width, depth) * 0.2 : 0;
  const hasBack = attachedSides.includes('back');
  const hasLeft = attachedSides.includes('left');
  const hasRight = attachedSides.includes('right');

  // Post positions - skip posts on attached sides
  const posts = useMemo(() => {
    const arr: [number, number][] = [];
    const corners: { pos: [number, number]; onBack: boolean; onLeft: boolean; onRight: boolean }[] = [
      { pos: [-width / 2, depth / 2], onBack: false, onLeft: true, onRight: false },   // front-left
      { pos: [width / 2, depth / 2], onBack: false, onLeft: false, onRight: true },    // front-right
      { pos: [-width / 2, -depth / 2], onBack: true, onLeft: true, onRight: false },   // back-left
      { pos: [width / 2, -depth / 2], onBack: true, onLeft: false, onRight: true },    // back-right
    ];

    // Add mid posts for wide spans
    if (width > 5) {
      corners.push({ pos: [0, depth / 2], onBack: false, onLeft: false, onRight: false }); // front-mid
      if (isFreestanding && !hasBack) {
        corners.push({ pos: [0, -depth / 2], onBack: true, onLeft: false, onRight: false }); // back-mid
      }
    }

    for (const c of corners) {
      // Skip posts on attached (wall) sides, unless freestanding
      if (isFreestanding) {
        arr.push(c.pos);
      } else {
        const isOnAttachedWall =
          (c.onBack && hasBack) ||
          (c.onLeft && hasLeft && !c.onBack) ||
          (c.onRight && hasRight && !c.onBack);
        if (!isOnAttachedWall) {
          arr.push(c.pos);
        }
      }
    }

    return arr;
  }, [width, depth, isFreestanding, hasBack, hasLeft, hasRight]);

  const rafterCount = Math.max(4, Math.round(width / 0.6));
  const roofY = height;
  const roofThick = material === 'insulated' ? INSULATED_THICKNESS : ROOF_THICKNESS;

  // Superdek vs Flatdek: superdek has corrugated ridges
  const superdekRidges = useMemo(() => {
    if (material !== 'colorbond' || colorbondType !== 'superdek') return [];
    const ridges: number[] = [];
    const spacing = 0.18;
    const count = Math.floor(depth / spacing);
    for (let i = 0; i <= count; i++) {
      ridges.push(-depth / 2 + i * spacing);
    }
    return ridges;
  }, [material, colorbondType, depth]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={groundMat} receiveShadow>
        <planeGeometry args={[width + 4, depth + 4]} />
      </mesh>

      {/* Walls for attached sides */}
      {!isFreestanding && hasBack && (
        <mesh position={[0, height / 2 + 0.5, -depth / 2 - 0.1]} material={wallMat} receiveShadow>
          <boxGeometry args={[width + 2, height + 1.5, 0.2]} />
        </mesh>
      )}
      {!isFreestanding && hasLeft && (
        <mesh position={[-width / 2 - 0.1, height / 2 + 0.5, 0]} material={wallMat} receiveShadow>
          <boxGeometry args={[0.2, height + 1.5, depth + 2]} />
        </mesh>
      )}
      {!isFreestanding && hasRight && (
        <mesh position={[width / 2 + 0.1, height / 2 + 0.5, 0]} material={wallMat} receiveShadow>
          <boxGeometry args={[0.2, height + 1.5, depth + 2]} />
        </mesh>
      )}

      {/* Posts */}
      {posts.map(([x, z], i) => (
        <group key={`post-${i}`}>
          <mesh position={[x, height / 2, z]} material={frameMat} castShadow>
            <boxGeometry args={[POST_SIZE, height, POST_SIZE]} />
          </mesh>
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
      <mesh position={[-width / 2, roofY - BEAM_H / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[BEAM_W, BEAM_H, depth]} />
      </mesh>
      <mesh position={[width / 2, roofY - BEAM_H / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[BEAM_W, BEAM_H, depth]} />
      </mesh>
      <mesh position={[0, roofY - BEAM_H / 2, depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width + BEAM_W, BEAM_H, BEAM_W]} />
      </mesh>
      <mesh position={[0, roofY - BEAM_H / 2, -depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width + BEAM_W, BEAM_H, BEAM_W]} />
      </mesh>

      {/* Designer beam */}
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
        <GableRoof width={width} depth={depth} roofY={roofY} gableHeight={gableHeight} roofThick={roofThick} roofMat={roofMat} />
      ) : isSkyline ? (
        <>
          <mesh position={[-width / 4 - 0.05, roofY + roofThick / 2, 0]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow>
            <boxGeometry args={[width / 2 + 0.05, roofThick, depth + 0.15]} />
          </mesh>
          <mesh position={[width / 4 + 0.05, roofY + roofThick / 2 + 0.15, 0]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow>
            <boxGeometry args={[width / 2 + 0.05, roofThick, depth + 0.15]} />
          </mesh>
          <mesh position={[0, roofY + 0.1, 0]} material={glassMat}>
            <boxGeometry args={[0.3, 0.02, depth + 0.15]} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, roofY + roofThick / 2, 0]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow receiveShadow>
          <boxGeometry args={[width + 0.2, roofThick, depth + 0.15]} />
        </mesh>
      )}

      {/* Superdek corrugation ridges */}
      {superdekRidges.map((z, i) => (
        <mesh key={`ridge-${i}`} position={[0, roofY + roofThick + 0.008, z]} material={roofMat}>
          <boxGeometry args={[width + 0.15, 0.015, 0.04]} />
        </mesh>
      ))}

      {/* Insulated panel underside detail (visible ribs) */}
      {material === 'insulated' && Array.from({ length: Math.ceil(width / 0.5) }).map((_, i) => {
        const x = -width / 2 + 0.25 + i * 0.5;
        if (x > width / 2) return null;
        return (
          <mesh key={`ins-rib-${i}`} position={[x, roofY + 0.005, 0]} material={roofMat}>
            <boxGeometry args={[0.02, 0.01, depth + 0.1]} />
          </mesh>
        );
      })}

      {/* Gutters */}
      {accessories.gutters && (
        <>
          <mesh position={[0, roofY - 0.02, depth / 2 + GUTTER_SIZE / 2]} material={frameMat}>
            <boxGeometry args={[width + 0.2, GUTTER_SIZE, GUTTER_SIZE]} />
          </mesh>
          {[-width / 2, width / 2].map((x, i) => (
            <mesh key={`dp-${i}`} position={[x, height / 2, depth / 2 + GUTTER_SIZE]} material={frameMat}>
              <cylinderGeometry args={[0.025, 0.025, height, 8]} />
            </mesh>
          ))}
        </>
      )}

      {/* Lighting - follows gable slope */}
      {accessories.lighting && Array.from({ length: Math.ceil(width / 1.5) }).map((_, i) => {
        const x = -width / 2 + 0.5 + (i * (width - 1)) / Math.max(1, Math.ceil(width / 1.5) - 1);
        const gableOffset = isGable ? gableHeight * (1 - Math.abs(x) / (width / 2)) : 0;
        const lightY = roofY - 0.15 + gableOffset;
        return (
          <group key={`light-${i}`}>
            <mesh position={[x, lightY, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.03, 12]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <pointLight position={[x, lightY - 0.05, 0]} intensity={0.3} distance={3} color="#ffd699" />
          </group>
        );
      })}

      {/* Fans - follow gable slope */}
      {accessories.fans && (() => {
        const gableOffset = isGable ? gableHeight * (1 - 0 / (width / 2)) : 0;
        const fanY = roofY - 0.2 + gableOffset;
        return (
          <group>
            <mesh position={[0, fanY, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
              <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <mesh
                key={`blade-${i}`}
                position={[Math.cos(i * Math.PI / 2) * 0.25, fanY - 0.15, Math.sin(i * Math.PI / 2) * 0.25]}
                rotation={[0, i * Math.PI / 2, 0]}
              >
                <boxGeometry args={[0.4, 0.01, 0.08]} />
                <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
          </group>
        );
      })()}
    </group>
  );
}

/** Gable roof component with no gaps */
function GableRoof({ width, depth, roofY, gableHeight, roofThick, roofMat }: {
  width: number; depth: number; roofY: number; gableHeight: number; roofThick: number; roofMat: THREE.Material;
}) {
  const halfW = width / 2;
  const angle = Math.atan2(gableHeight, halfW);
  const slopeLen = Math.sqrt(halfW * halfW + gableHeight * gableHeight);

  return (
    <>
      {/* Left slope */}
      <mesh
        position={[-halfW / 2, roofY + roofThick / 2 + gableHeight / 2, 0]}
        rotation={[0, 0, angle]}
        material={roofMat}
        castShadow receiveShadow
      >
        <boxGeometry args={[slopeLen + 0.05, roofThick, depth + 0.15]} />
      </mesh>
      {/* Right slope */}
      <mesh
        position={[halfW / 2, roofY + roofThick / 2 + gableHeight / 2, 0]}
        rotation={[0, 0, -angle]}
        material={roofMat}
        castShadow receiveShadow
      >
        <boxGeometry args={[slopeLen + 0.05, roofThick, depth + 0.15]} />
      </mesh>
      {/* Ridge cap */}
      <mesh position={[0, roofY + gableHeight + roofThick, 0]} material={roofMat}>
        <boxGeometry args={[0.08, 0.03, depth + 0.2]} />
      </mesh>
    </>
  );
}
