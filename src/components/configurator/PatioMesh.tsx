import { useMemo } from "react";
import * as THREE from "three";
import type { PatioConfig, AttachmentSide } from "@/types/configurator";
import type { FoundationType } from "@/types/decking";
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
 * The beam slides into the channel formed by the bracket flanges.
 * Screwed with 10x25 hex self-tappers through bracket into beam flute.
 *
 *  Side view:
 *   ┌─────────┐  ← top flange (sits under beam)
 *   │         │
 *   │  │   │  │  ← vertical flanges (screw into beam sides)
 *   │  │   │  │
 *   └──┘   └──┘
 *      POST
 */
function PostBracket({ position, colSize, beamH, beamW }: {
  position: [number, number, number];
  colSize: number;
  beamH: number;
  beamW: number;
}) {
  const flangeThick = 0.004; // 4mm steel
  const flangeHeight = beamH * 0.7; // bracket wraps 70% of beam height
  const bracketWidth = mm(colSize) + 0.024; // slightly wider than post

  return (
    <group position={position}>
      {/* Base plate — sits on top of post */}
      <mesh material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeThick, bracketWidth]} />
      </mesh>
      {/* Left vertical flange */}
      <mesh position={[-bracketWidth / 2 + flangeThick / 2, flangeHeight / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[flangeThick, flangeHeight, bracketWidth]} />
      </mesh>
      {/* Right vertical flange */}
      <mesh position={[bracketWidth / 2 - flangeThick / 2, flangeHeight / 2, 0]} material={MATERIALS.bracket}>
        <boxGeometry args={[flangeThick, flangeHeight, bracketWidth]} />
      </mesh>
      {/* Front vertical flange */}
      <mesh position={[0, flangeHeight / 2, bracketWidth / 2 - flangeThick / 2]} material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeHeight, flangeThick]} />
      </mesh>
      {/* Back vertical flange */}
      <mesh position={[0, flangeHeight / 2, -bracketWidth / 2 + flangeThick / 2]} material={MATERIALS.bracket}>
        <boxGeometry args={[bracketWidth, flangeHeight, flangeThick]} />
      </mesh>
      {/* Tek screws — 2 per side (left/right flanges into beam) */}
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
          {/* Post — stops below beam connection */}
          <mesh position={[x, postH / 2, z]} material={frameMat} castShadow>
            <boxGeometry args={[s, postH, s]} />
          </mesh>
          {/* Post cap — fills gap between post top and beam */}
          <mesh position={[x, postH + gap + capH / 2, z]} material={MATERIALS.postCap}>
            <boxGeometry args={[s + 0.012, capH, s + 0.012]} />
          </mesh>
          {/* Post bracket — L-shaped bracket on top where beam connects */}
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

/**
 * Beam-to-beam bracket — L-shaped connector at corners.
 * One flange slides INSIDE the incoming beam end.
 * The other flange is screwed to the face of the through beam.
 *
 *  Top-down view (corner):
 *
 *   THROUGH BEAM (continuous)
 *   ═══════════════════════
 *         ┌──┐
 *         │  │ ← bracket flange screwed to through beam face
 *         │  │
 *         │  │ ← bracket flange inside incoming beam
 *         │  │
 *   ══════╧══╧═══
 *   INCOMING BEAM
 */
function BeamToBeamBracket({ position, rotation, beamH, beamW }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  beamH: number;
  beamW: number;
}) {
  const flangeThick = 0.004;
  const flangeDepthInBeam = beamW * 0.6; // how far the flange goes inside beam
  const flangeH = beamH * 0.85;

  return (
    <group position={position} rotation={rotation}>
      {/* Vertical plate — screwed to face of through beam */}
      <mesh material={MATERIALS.beamBracket}>
        <boxGeometry args={[flangeThick, flangeH, beamW + 0.01]} />
      </mesh>
      {/* Horizontal flange — slides inside incoming beam */}
      <mesh position={[flangeDepthInBeam / 2, 0, 0]} material={MATERIALS.beamBracket}>
        <boxGeometry args={[flangeDepthInBeam, flangeH, flangeThick]} />
      </mesh>
      {/* Tek screws on the face plate — 2 rows of 2 */}
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
  const gap = 0.006; // gap at beam ends for bracket visibility

  return (
    <>
      {/* Back beam — runs full width between side beams */}
      <mesh position={[0, beamY, -depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width - bW - gap * 2, bH, bW]} />
      </mesh>
      {/* Left side beam — continuous "through" beam */}
      <mesh position={[-width / 2, beamY, overhang / 2]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth + overhang]} />
      </mesh>
      {/* Right side beam — continuous "through" beam */}
      <mesh position={[width / 2, beamY, overhang / 2]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth + overhang]} />
      </mesh>
      {/* Front beam — runs between side beams */}
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

      {/* Beam-to-beam brackets at corners — L-shaped, incoming beam butts into through beam */}
      {/* Back-left: back beam incoming from right, left beam is through */}
      <BeamToBeamBracket
        position={[-width / 2 + bW / 2 + 0.002, beamY, -depth / 2]}
        rotation={[0, 0, 0]}
        beamH={bH}
        beamW={bW}
      />
      {/* Back-right: back beam incoming from left, right beam is through */}
      <BeamToBeamBracket
        position={[width / 2 - bW / 2 - 0.002, beamY, -depth / 2]}
        rotation={[0, Math.PI, 0]}
        beamH={bH}
        beamW={bW}
      />
      {/* Front-left: front beam incoming from right, left beam is through */}
      <BeamToBeamBracket
        position={[-width / 2 + bW / 2 + 0.002, beamY, depth / 2 + overhang]}
        rotation={[0, 0, 0]}
        beamH={bH}
        beamW={bW}
      />
      {/* Front-right: front beam incoming from left, right beam is through */}
      <BeamToBeamBracket
        position={[width / 2 - bW / 2 - 0.002, beamY, depth / 2 + overhang]}
        rotation={[0, Math.PI, 0]}
        beamH={bH}
        beamW={bW}
      />
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

/* ── Foundation Base Visual ──────────────────────────────────── */

const FOUNDATION_MATERIALS = {
  grass: new THREE.MeshStandardMaterial({ color: new THREE.Color('#4a6b35'), roughness: 0.85, metalness: 0 }),
  concrete: new THREE.MeshStandardMaterial({ color: new THREE.Color('#b0aca6'), roughness: 0.75, metalness: 0.05 }),
  concreteCracked: new THREE.MeshStandardMaterial({ color: new THREE.Color('#a09a92'), roughness: 0.8, metalness: 0.03 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: new THREE.Color('#8a8580'), roughness: 0.85, metalness: 0.03, transparent: true, opacity: 0.5 }),
  crackLine: new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b6560'), roughness: 0.9, metalness: 0, depthWrite: false }),
  holeEdge: new THREE.MeshStandardMaterial({ color: new THREE.Color('#7a7570'), roughness: 0.7, metalness: 0.05, transparent: true, opacity: 0.5 }),
};

function FoundationBase({ foundationType, width, depth, postPositions, colSize }: {
  foundationType: FoundationType;
  width: number;
  depth: number;
  postPositions: [number, number][];
  colSize: number;
}) {
  const padW = width + 4;
  const padD = depth + 4;

  if (foundationType === 'landscape') {
    // Soil/grass ground with cylindrical excavation holes at post positions
    return (
      <group>
        {/* Grass layer */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={FOUNDATION_MATERIALS.grass} receiveShadow>
          <planeGeometry args={[padW, padD]} />
        </mesh>
        {/* Concrete-coloured area under the patio footprint */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} material={FOUNDATION_MATERIALS.concrete} receiveShadow>
          <planeGeometry args={[width + 0.6, depth + 0.6]} />
        </mesh>
        {/* Excavation holes (600mm diameter × 600mm deep) at each post */}
        {postPositions.map(([x, z], i) => (
          <group key={`hole-${i}`} position={[x, 0, z]}>
            <mesh position={[0, -0.3, 0]} material={FOUNDATION_MATERIALS.concreteDark}>
              <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
            </mesh>
            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} material={FOUNDATION_MATERIALS.holeEdge}>
              <ringGeometry args={[0.28, 0.34, 16]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (foundationType === 'concrete-thick') {
    // Thick concrete slab with bracket mounting points
    const slabThick = 0.15;
    return (
      <group>
        {/* Surrounding ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={FOUNDATION_MATERIALS.grass} receiveShadow>
          <planeGeometry args={[padW, padD]} />
        </mesh>
        {/* Concrete slab */}
        <mesh position={[0, -slabThick / 2, 0]} material={FOUNDATION_MATERIALS.concrete} receiveShadow castShadow>
          <boxGeometry args={[width + 1.0, slabThick, depth + 1.0]} />
        </mesh>
        {/* Bracket mounting points at each post */}
        {postPositions.map(([x, z], i) => (
          <group key={`bracket-${i}`} position={[x, 0.002, z]}>
            {/* Bracket base plate indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={FOUNDATION_MATERIALS.holeEdge}>
              <planeGeometry args={[mm(colSize) + 0.04, mm(colSize) + 0.04]} />
            </mesh>
            {/* Bolt holes (4 corners) */}
            {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([dx, dz], bi) => (
              <mesh key={`bolt-${bi}`} position={[dx * 0.04, 0.003, dz * 0.04]} rotation={[-Math.PI / 2, 0, 0]} material={FOUNDATION_MATERIALS.crackLine}>
                <circleGeometry args={[0.008, 8]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }

  // concrete-thin: Thin cracked slab with core-drilled holes
  const slabThick = 0.1;
  return (
    <group>
      {/* Surrounding ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} material={FOUNDATION_MATERIALS.grass} receiveShadow>
        <planeGeometry args={[padW, padD]} />
      </mesh>
      {/* Thin concrete slab */}
      <mesh position={[0, -slabThick / 2, 0]} material={FOUNDATION_MATERIALS.concreteCracked} receiveShadow castShadow>
        <boxGeometry args={[width + 1.0, slabThick, depth + 1.0]} />
      </mesh>
      {/* Simple crack lines embedded in slab top — offset Y above slab to avoid z-fight */}
      {[
        { x: -0.6, z: 0, angle: 20, len: 2.0 },
        { x: 0.4, z: -0.5, angle: 55, len: 1.8 },
        { x: -0.2, z: 0.6, angle: -30, len: 1.5 },
      ].map((c, i) => (
        <mesh key={`crack-${i}`} position={[c.x, 0.006, c.z]} rotation={[-Math.PI / 2, c.angle * Math.PI / 180, 0]} material={FOUNDATION_MATERIALS.crackLine} renderOrder={1}>
          <planeGeometry args={[0.012, c.len]} />
        </mesh>
      ))}
      {/* Core-drilled holes at each post (600mm diameter) */}
      {postPositions.map(([x, z], i) => (
        <group key={`core-${i}`} position={[x, 0, z]}>
          <mesh position={[0, -0.3, 0]} material={FOUNDATION_MATERIALS.concreteDark}>
            <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
          </mesh>
          <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={FOUNDATION_MATERIALS.holeEdge} renderOrder={1}>
            <ringGeometry args={[0.28, 0.34, 16]} />
          </mesh>
        </group>
      ))}
    </group>
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

  // Use PBR materials from centralized library
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
      {/* Foundation Base */}
      <FoundationBase
        foundationType={config.foundation?.type ?? 'landscape'}
        width={width}
        depth={depth}
        postPositions={posts}
        colSize={colSize}
      />

      {/* Walls for attached sides — use wall config for sizing */}
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
      {/* Front wall (context only, no structural attachment) */}
      {walls?.front?.enabled && (
        <mesh
          position={[0, mm(walls.front.height) / 2, depth / 2 + mm(walls.front.thickness) / 2 + mm(walls.front.offset)]}
          material={MATERIALS.wall}
          receiveShadow
        >
          <boxGeometry args={[mm(walls.front.length), mm(walls.front.height), mm(walls.front.thickness)]} />
        </mesh>
      )}

      {/* BUILD ORDER */}
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
