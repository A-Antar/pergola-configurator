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

/* ── helpers ────────────────────────────────────────────────── */

/** mm → metres */
const mm = (v: number) => v / 1000;

function mat(hex: string, metalness = 0.3, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), metalness, roughness });
}

const groundMat = mat('#a09a8c', 0, 0.95);
const wallMat = mat('#c8c0b4', 0, 0.9);
const bracketMat = mat('#555555', 0.6, 0.4);

/* ── component sub-builders (one per build-order stage) ───── */

/** Stage 1 — base plates / footings at each post position */
function BasePlates({ positions, colSize, frameMat }: {
  positions: [number, number][]; colSize: number; frameMat: THREE.Material;
}) {
  const plateW = mm(BRACKETS.postBracket.width);
  const plateH = mm(BRACKETS.postBracket.height);
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={`bp-${i}`} position={[x, plateH / 2, z]} material={bracketMat}>
          <boxGeometry args={[plateW, plateH, plateW]} />
        </mesh>
      ))}
    </>
  );
}

/** Stage 2 — columns (posts) */
function Columns({ positions, height, colSize, frameMat, decorative }: {
  positions: [number, number][]; height: number; colSize: number; frameMat: THREE.Material; decorative: boolean;
}) {
  const s = mm(colSize);
  return (
    <>
      {positions.map(([x, z], i) => (
        <group key={`col-${i}`}>
          <mesh position={[x, height / 2, z]} material={frameMat} castShadow>
            <boxGeometry args={[s, height, s]} />
          </mesh>
          {/* Post cap */}
          <mesh position={[x, height, z]} material={bracketMat}>
            <boxGeometry args={[s + 0.01, mm(BRACKETS.postCap.height), s + 0.01]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Stage 3 — wall brackets on attached sides */
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
    // Wall brackets spaced along back wall
    const count = Math.max(2, Math.ceil(width / 1.8));
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + (width / (count - 1)) * i;
      brackets.push(
        <mesh key={`wb-b-${i}`} position={[x, height - mm(beam.profileHeight) / 2, -depth / 2 - bd / 2]} material={bracketMat}>
          <boxGeometry args={[bw, bh, bd]} />
        </mesh>
      );
    }
  }
  if (hasLeft) {
    brackets.push(
      <mesh key="wb-l" position={[-width / 2 - bd / 2, height - mm(beam.profileHeight) / 2, 0]} material={bracketMat}>
        <boxGeometry args={[bd, bh, bw]} />
      </mesh>
    );
  }
  if (hasRight) {
    brackets.push(
      <mesh key="wb-r" position={[width / 2 + bd / 2, height - mm(beam.profileHeight) / 2, 0]} material={bracketMat}>
        <boxGeometry args={[bd, bh, bw]} />
      </mesh>
    );
  }
  return <>{brackets}</>;
}

/** Stage 4 — beams (back → sides → front, following real build order) */
function Beams({ config, beam, patioType, frameMat }: {
  config: PatioConfig; beam: BeamSpec; patioType: PatioTypeSpec; frameMat: THREE.Material;
}) {
  const { width, depth, height } = config;
  const bH = mm(beam.profileHeight);
  // Visual width: real Pro-beams appear stubby/chunky — use 100mm face width for true-to-eye feel
  const bW = mm(Math.max(beam.profileWidth, 100));
  const beamY = height - bH / 2;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;

  return (
    <>
      {/* Back beam */}
      <mesh position={[0, beamY, -depth / 2]} material={frameMat} castShadow>
        <boxGeometry args={[width + bW, bH, bW]} />
      </mesh>
      {/* Left side beam */}
      <mesh position={[-width / 2, beamY, 0]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth]} />
      </mesh>
      {/* Right side beam */}
      <mesh position={[width / 2, beamY, 0]} material={frameMat} castShadow>
        <boxGeometry args={[bW, bH, depth]} />
      </mesh>
      {/* Front beam */}
      <mesh position={[0, beamY, depth / 2 + overhang]} material={frameMat} castShadow>
        <boxGeometry args={[width + bW, bH, bW]} />
      </mesh>

      {/* Pro-beam flutes — decorative grooves along beams */}
      {beam.fluted && (
        <>
          {/* Flutes on front beam (3 lines) */}
          {[0.25, 0.5, 0.75].map((t, fi) => (
            <mesh key={`flute-f-${fi}`}
              position={[0, height - bH * t, depth / 2 + overhang + bW / 2 + 0.002]}
              material={bracketMat}
            >
              <boxGeometry args={[width + bW - 0.02, 0.004, 0.004]} />
            </mesh>
          ))}
        </>
      )}

      {/* Beam-to-beam brackets at corners */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2 + overhang],
        [width / 2, depth / 2 + overhang],
      ].map(([x, z], i) => (
        <mesh key={`bb-${i}`} position={[x, beamY, z]} material={bracketMat}>
          <boxGeometry args={[mm(BRACKETS.beamToBeamBracket.width), mm(BRACKETS.beamToBeamBracket.height), bW + 0.01]} />
        </mesh>
      ))}
    </>
  );
}

/** Stage 5 — purlins (Type 3 & 4 only) */
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
    // Type 4: one mid-span purlin running depth-wise
    purlins.push(
      <mesh key="mid-purlin" position={[0, purlinY, 0]} material={frameMat} castShadow>
        <boxGeometry args={[purlinW, purlinH, depth + 0.05]} />
      </mesh>
    );
  }

  // Cross purlins along width
  const spacing = 1.2; // ~1.2m spacing
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

/** Stage 6 — roof sheets */
function RoofSheets({ config, beam, sheet, patioType, roofMat }: {
  config: PatioConfig; beam: BeamSpec; sheet: SheetSpec; patioType: PatioTypeSpec; roofMat: THREE.Material;
}) {
  const { width, depth, height, shape } = config;
  const bH = mm(beam.profileHeight);
  const sheetThick = sheet.insulated ? mm(sheet.thickness) : 0.004; // Colorbond is thin
  const roofY = height - bH + sheetThick / 2;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const totalDepth = depth + overhang;
  const slopeAngle = config.style === 'skillion' ? 0.06 : 0.025;

  const isGable = shape === 'gable';

  if (isGable) {
    const gableH = Math.min(width, depth) * 0.18;
    const gableFrameMat = mat(config.frameColor);
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
        {/* Skylight strip */}
        <mesh position={[0, roofY + 0.08, 0]}>
          <boxGeometry args={[0.25, 0.01, totalDepth + 0.1]} />
          <meshPhysicalMaterial color="#88ccff" transparent opacity={0.2} transmission={0.85} roughness={0.05} />
        </mesh>
      </>
    );
  }

  // Flat / skillion / fly-over
  return (
    <>
      <mesh position={[0, roofY, overhang / 2]} rotation={[slopeAngle, 0, 0]} material={roofMat} castShadow receiveShadow>
        <boxGeometry args={[width + 0.15, sheetThick, totalDepth + 0.1]} />
      </mesh>

      {/* Rib detail for superdek or insulated top profile */}
      {sheet.ribHeight > 0 && (
        <SheetRibs
          width={width}
          depth={totalDepth}
          roofY={roofY + sheetThick / 2}
          ribH={mm(sheet.ribHeight)}
          ribSpacing={mm(sheet.ribSpacing)}
          roofMat={roofMat}
          direction={patioType.sheetDirection}
          slopeAngle={slopeAngle}
          overhang={overhang}
        />
      )}

      {/* Insulated panel cream underside (clearly visible from below like H2 photos) */}
      {sheet.insulated && (
        <>
          <mesh position={[0, roofY - sheetThick / 2 - 0.002, overhang / 2]} rotation={[slopeAngle, 0, 0]}
            material={mat('#f5edd8', 0.05, 0.8)} receiveShadow>
            <boxGeometry args={[width + 0.12, 0.003, totalDepth + 0.08]} />
          </mesh>
          <InsulatedUnderside width={width} depth={totalDepth} roofY={roofY - sheetThick / 2} roofMat={mat('#f5edd8', 0.05, 0.8)} slopeAngle={slopeAngle} overhang={overhang} />
        </>
      )}
    </>
  );
}

/** Corrugation / rib lines on roof sheets */
function SheetRibs({ width, depth, roofY, ribH, ribSpacing, roofMat, direction, slopeAngle, overhang }: {
  width: number; depth: number; roofY: number; ribH: number; ribSpacing: number;
  roofMat: THREE.Material; direction: 'depth' | 'width'; slopeAngle: number; overhang: number;
}) {
  const ribs: JSX.Element[] = [];
  if (direction === 'depth') {
    // Ribs run along depth (standard)
    const count = Math.floor(width / ribSpacing);
    for (let i = 0; i <= count; i++) {
      const x = -width / 2 + i * ribSpacing;
      ribs.push(
        <mesh key={`rib-${i}`} position={[x, roofY + ribH / 2, overhang / 2]} rotation={[slopeAngle, 0, 0]} material={roofMat}>
          <boxGeometry args={[0.015, ribH, depth + 0.08]} />
        </mesh>
      );
    }
  } else {
    // Ribs run along width (Type 3 horizontal sheets)
    const count = Math.floor(depth / ribSpacing);
    for (let i = 0; i <= count; i++) {
      const z = -depth / 2 + i * ribSpacing;
      ribs.push(
        <mesh key={`rib-${i}`} position={[0, roofY + ribH / 2, z]} material={roofMat}>
          <boxGeometry args={[width + 0.08, ribH, 0.015]} />
        </mesh>
      );
    }
  }
  return <>{ribs}</>;
}

/** Smooth underside joints for insulated (Cooldek) panels */
function InsulatedUnderside({ width, depth, roofY, roofMat, slopeAngle, overhang }: {
  width: number; depth: number; roofY: number; roofMat: THREE.Material; slopeAngle: number; overhang: number;
}) {
  const joints: JSX.Element[] = [];
  const panelWidth = 1.0; // ~1m Cooldek panels
  const count = Math.floor(width / panelWidth);
  for (let i = 1; i < count; i++) {
    const x = -width / 2 + i * panelWidth;
    joints.push(
      <mesh key={`ins-j-${i}`} position={[x, roofY - 0.002, overhang / 2]} rotation={[slopeAngle, 0, 0]} material={roofMat}>
        <boxGeometry args={[0.015, 0.008, depth + 0.08]} />
      </mesh>
    );
  }
  return <>{joints}</>;
}

/** Create a triangular BufferGeometry for gable end infills */
function createTriangleGeo(baseWidth: number, peakHeight: number): THREE.BufferGeometry {
  const hw = baseWidth / 2;
  const vertices = new Float32Array([
    -hw, 0, 0,   // bottom-left
     hw, 0, 0,   // bottom-right
     0, peakHeight, 0, // peak
  ]);
  const normals = new Float32Array([0,0,1, 0,0,1, 0,0,1]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex([0, 1, 2]);
  return geo;
}

/** Create a slope panel that stays within the gable triangle (no overshoot) */
function createSlopeGeo(halfW: number, gableH: number, depth: number, thick: number): THREE.BufferGeometry {
  // The slope is a flat quad tilted from the eave (bottom-outside) up to the ridge (top-center).
  // We build it as a box-like shape with 6 faces but clipped to the triangle.
  const slopeLen = Math.sqrt(halfW * halfW + gableH * gableH);
  const geo = new THREE.BoxGeometry(slopeLen, thick, depth);
  return geo;
}

/** Gable roof — two properly angled slopes clipped to triangle + real triangular infills + ridge beam */
function GableRoof({ width, depth, roofY, gableHeight, sheetThick, roofMat, frameMat }: {
  width: number; depth: number; roofY: number; gableHeight: number; sheetThick: number;
  roofMat: THREE.Material; frameMat: THREE.Material;
}) {
  const halfW = width / 2;
  const angle = Math.atan2(gableHeight, halfW);
  const slopeLen = Math.sqrt(halfW * halfW + gableHeight * gableHeight);

  // Offset each slope panel so it pivots from eave edge, not center
  // Left slope: pivot at (-halfW, roofY), rises to (0, roofY+gableH)
  const pivotXL = -halfW;
  const pivotXR = halfW;
  const midSlopeX = slopeLen / 2; // half the slope length along the slope axis

  return (
    <>
      {/* Left slope — pivots from left eave edge */}
      <group position={[pivotXL, roofY, 0]} rotation={[0, 0, angle]}>
        <mesh position={[midSlopeX, sheetThick / 2, 0]} material={roofMat} castShadow receiveShadow>
          <boxGeometry args={[slopeLen, sheetThick, depth]} />
        </mesh>
      </group>
      {/* Right slope — pivots from right eave edge */}
      <group position={[pivotXR, roofY, 0]} rotation={[0, 0, Math.PI - angle]}>
        <mesh position={[midSlopeX, sheetThick / 2, 0]} material={roofMat} castShadow receiveShadow>
          <boxGeometry args={[slopeLen, sheetThick, depth]} />
        </mesh>
      </group>

      {/* Ridge beam (runs along depth at the peak — dark frame color) */}
      <mesh position={[0, roofY + gableHeight + 0.015, 0]} material={frameMat}>
        <boxGeometry args={[0.08, 0.04, depth + 0.06]} />
      </mesh>

      {/* Ridge cap flashing */}
      <mesh position={[0, roofY + gableHeight + 0.038, 0]} material={frameMat}>
        <boxGeometry args={[0.2, 0.006, depth + 0.08]} />
      </mesh>

      {/* Gable end triangular infill panels (actual triangles) */}
      {[-1, 1].map((side) => {
        const triGeo = createTriangleGeo(width, gableHeight);
        return (
          <mesh
            key={`gable-tri-${side}`}
            geometry={triGeo}
            position={[0, roofY, (depth / 2 + 0.005) * side]}
            material={roofMat}
          />
        );
      })}

      {/* Gable end trim (triangular frame outline) */}
      {[-1, 1].map((side) => {
        const z = (depth / 2 + 0.01) * side;
        return (
          <group key={`gable-trim-${side}`}>
            {/* Left slope trim */}
            <group position={[-halfW, roofY, z]} rotation={[0, 0, angle]}>
              <mesh position={[slopeLen / 2, 0.015, 0]} material={frameMat}>
                <boxGeometry args={[slopeLen, 0.03, 0.04]} />
              </mesh>
            </group>
            {/* Right slope trim */}
            <group position={[halfW, roofY, z]} rotation={[0, 0, Math.PI - angle]}>
              <mesh position={[slopeLen / 2, 0.015, 0]} material={frameMat}>
                <boxGeometry args={[slopeLen, 0.03, 0.04]} />
              </mesh>
            </group>
            {/* Bottom beam trim */}
            <mesh position={[0, roofY, z]} material={frameMat}>
              <boxGeometry args={[width, 0.03, 0.04]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/** Stage 7 — gutters & downpipes */
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
      {/* Front gutter */}
      <mesh position={[0, gutterY, frontZ + gutterW / 2]} material={frameMat}>
        <boxGeometry args={[width + 0.15, gutterH, gutterW]} />
      </mesh>
      {/* Downpipes at corners */}
      {[-width / 2, width / 2].map((x, i) => (
        <group key={`dp-${i}`}>
          <mesh position={[x, height / 2 - bH / 2, frontZ + gutterW]} material={frameMat}>
            <cylinderGeometry args={[mm(DOWNPIPE.diameter) / 2, mm(DOWNPIPE.diameter) / 2, height - bH, 8]} />
          </mesh>
          {/* Downpipe strap */}
          <mesh position={[x, height * 0.4, frontZ + gutterW]} material={bracketMat}>
            <torusGeometry args={[mm(DOWNPIPE.diameter) / 2 + 0.005, 0.003, 6, 12]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Stage 8 — designer beam (decorative fascia) */
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

/** Stage 9 — LED lights (follow roof slope / gable) */
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
            <mesh position={[x, lightY, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.065, 0.025, 12]} />
              <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
            </mesh>
            <pointLight position={[x, lightY - 0.04, 0]} intensity={0.25} distance={3} color="#ffd699" />
          </group>
        );
      })}
    </>
  );
}

/** Stage 10 — ceiling fan (follows gable peak) */
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
      {/* Rod */}
      <mesh position={[0, fanY + 0.06, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Motor housing */}
      <mesh position={[0, fanY, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 12]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Blades */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={`blade-${i}`}
          position={[Math.cos(i * Math.PI * 2 / 5) * 0.22, fanY - 0.02, Math.sin(i * Math.PI * 2 / 5) * 0.22]}
          rotation={[0, i * Math.PI * 2 / 5, 0]}
        >
          <boxGeometry args={[0.35, 0.008, 0.06]} />
          <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Decorative column wraps */
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

export default function PatioMesh({ config }: { config: PatioConfig }) {
  const { width, depth, height, style, frameColor, material, colorbondType, attachedSides = ['back'], accessories, shape } = config;

  const isFreestanding = style === 'free-standing';
  const hasBack = attachedSides.includes('back');
  const hasLeft = attachedSides.includes('left');
  const hasRight = attachedSides.includes('right');

  // Select real Stratco components based on dimensions
  const spanMm = depth * 1000;
  const patioType = useMemo(() => selectPatioType(spanMm, isFreestanding), [spanMm, isFreestanding]);
  const beam = useMemo(() => selectBeamForSpan(spanMm), [spanMm]);
  const sheet = useMemo(() => selectSheet(material, colorbondType), [material, colorbondType]);

  const frameMat = useMemo(() => mat(frameColor), [frameColor]);
  const roofMat = useMemo(() => {
    if (material === 'insulated') return mat('#e8e0d0', 0.1, 0.7); // Cream top
    return mat(frameColor, 0.5, 0.4);
  }, [frameColor, material]);
  // Warm cream underside visible from below on insulated panels (as seen in H2 photos)
  const undersideMat = useMemo(() => mat('#f5edd8', 0.05, 0.8), []);

  // Column size (100mm standard, 140mm if decorative selected)
  const colSize = accessories.columns ? 140 : 100;

  // Post positions — skip attached sides
  const posts = useMemo(() => {
    const arr: [number, number][] = [];
    const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
    const corners: { pos: [number, number]; onBack: boolean; onLeft: boolean; onRight: boolean }[] = [
      { pos: [-width / 2, depth / 2 + overhang], onBack: false, onLeft: true, onRight: false },
      { pos: [width / 2, depth / 2 + overhang], onBack: false, onLeft: false, onRight: true },
      { pos: [-width / 2, -depth / 2], onBack: true, onLeft: true, onRight: false },
      { pos: [width / 2, -depth / 2], onBack: true, onLeft: false, onRight: true },
    ];

    // Mid posts for wide spans (beam max span check)
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
      {/* Ground */}
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

      {/* BUILD ORDER — following real Stratco assembly procedure */}

      {/* 1. Base plates */}
      <BasePlates positions={posts} colSize={colSize} frameMat={frameMat} />

      {/* 2. Columns */}
      <Columns positions={posts} height={height} colSize={colSize} frameMat={frameMat} decorative={accessories.columns} />
      {accessories.columns && <DecorativeColumns positions={posts} height={height} frameMat={frameMat} />}

      {/* 3. Wall brackets */}
      {!isFreestanding && <WallBrackets config={config} beam={beam} frameMat={frameMat} />}

      {/* 4. Beams */}
      <Beams config={config} beam={beam} patioType={patioType} frameMat={frameMat} />

      {/* 5. Purlins (Type 3/4) */}
      <Purlins config={config} beam={beam} patioType={patioType} frameMat={frameMat} />

      {/* 6. Roof sheets */}
      <RoofSheets config={config} beam={beam} sheet={sheet} patioType={patioType} roofMat={roofMat} />

      {/* 7. Gutters & downpipes */}
      <GuttersAndDownpipes config={config} beam={beam} patioType={patioType} frameMat={frameMat} />

      {/* 8. Designer beam */}
      <DesignerBeam config={config} beam={beam} patioType={patioType} frameMat={frameMat} />

      {/* 9. Lights */}
      <Lights config={config} beam={beam} frameMat={frameMat} />

      {/* 10. Fan */}
      <Fan config={config} beam={beam} />
    </group>
  );
}
