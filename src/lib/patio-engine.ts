/**
 * Deterministic Patio Build Pipeline
 * ===================================
 * InputConfig → Validate/Clamp → DeriveLayout → GeneratePartsList → RenderParts
 *
 * All dimensions in METRES (world units). Raw catalog data in mm is converted at boundaries.
 * Coordinate system: X = width, Y = up, Z = depth (projection from house).
 */

import type { PatioConfig, AttachmentSide } from '@/types/configurator';
import {
  selectPatioType,
  selectBeamForSpan,
  selectSheet,
  BRACKETS,
  DOWNPIPE,
  type PatioTypeSpec,
  type BeamSpec,
  type SheetSpec,
} from '@/data/stratco-catalog';

// ─── mm → m helper ──────────────────────────────────────────
const mm = (v: number) => v / 1000;

// ─── Types ──────────────────────────────────────────────────

export type PartKind =
  | 'base-plate'
  | 'column'
  | 'post-cap'
  | 'wall-bracket'
  | 'beam'
  | 'beam-bracket'
  | 'purlin'
  | 'roof-sheet'
  | 'rib'
  | 'underside-panel'
  | 'underside-joint'
  | 'gutter'
  | 'downpipe'
  | 'downpipe-strap'
  | 'designer-beam'
  | 'light'
  | 'fan-rod'
  | 'fan-motor'
  | 'fan-blade'
  | 'gable-slope'
  | 'gable-ridge'
  | 'gable-ridge-cap'
  | 'gable-infill'
  | 'gable-trim'
  | 'skyline-sheet'
  | 'skylight-strip'
  | 'decorative-column'
  | 'flute-line'
  | 'ground'
  | 'wall';

export interface Part {
  id: string;
  kind: PartKind;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number]; // [width, height, depth] of bounding box
  color: string;
  metalness: number;
  roughness: number;
  geometry: 'box' | 'cylinder' | 'plane' | 'triangle' | 'torus';
  geometryArgs?: number[];
  metadata?: Record<string, any>;
}

export interface DerivedLayout {
  // Clamped config
  width: number;
  depth: number;
  height: number;
  // Derived Stratco selections
  patioType: PatioTypeSpec;
  beam: BeamSpec;
  sheet: SheetSpec;
  // Derived measurements (metres)
  beamProfileH: number;
  beamProfileW: number;
  colSize: number;
  overhang: number;
  totalDepth: number;
  slopeAngle: number;
  // Flags
  isFreestanding: boolean;
  isGable: boolean;
  hasBack: boolean;
  hasLeft: boolean;
  hasRight: boolean;
  // Post positions
  postPositions: [number, number][];
}

// ─── Step 1: Validate & Clamp ───────────────────────────────

export function validateConfig(raw: PatioConfig): PatioConfig {
  return {
    ...raw,
    width: Math.max(2, Math.min(12, raw.width)),
    depth: Math.max(2, Math.min(8, raw.depth)),
    height: Math.max(2.4, Math.min(4.5, raw.height)),
    attachedSides: raw.attachedSides?.length ? raw.attachedSides : ['back'],
  };
}

// ─── Step 2: Derive Layout ──────────────────────────────────

export function deriveLayout(config: PatioConfig): DerivedLayout {
  const c = validateConfig(config);
  const isFreestanding = c.style === 'free-standing';
  const hasBack = c.attachedSides.includes('back');
  const hasLeft = c.attachedSides.includes('left');
  const hasRight = c.attachedSides.includes('right');

  const spanMm = c.depth * 1000;
  const patioType = selectPatioType(spanMm, isFreestanding);
  const beam = selectBeamForSpan(spanMm);
  const sheet = selectSheet(c.material, c.colorbondType);

  const beamProfileH = mm(beam.profileHeight);
  const beamProfileW = mm(150); // H2 standard 150mm
  const colSize = c.accessories.columns ? 140 : 100;
  const overhang = patioType.hasOverhang ? mm(patioType.overhangDistance) : 0;
  const totalDepth = c.depth + overhang;
  const slopeAngle = c.style === 'skillion' ? 0.06 : 0.025;
  const isGable = c.shape === 'gable';

  // Post positions
  const postPositions = computePostPositions(c, patioType, beam, isFreestanding, hasBack, hasLeft, hasRight, overhang);

  return {
    width: c.width,
    depth: c.depth,
    height: c.height,
    patioType,
    beam,
    sheet,
    beamProfileH,
    beamProfileW,
    colSize,
    overhang,
    totalDepth,
    slopeAngle,
    isFreestanding,
    isGable,
    hasBack,
    hasLeft,
    hasRight,
    postPositions,
  };
}

function computePostPositions(
  config: PatioConfig,
  patioType: PatioTypeSpec,
  beam: BeamSpec,
  isFreestanding: boolean,
  hasBack: boolean,
  hasLeft: boolean,
  hasRight: boolean,
  overhang: number,
): [number, number][] {
  const { width, depth } = config;
  const arr: [number, number][] = [];

  const corners: { pos: [number, number]; onBack: boolean; onLeft: boolean; onRight: boolean }[] = [
    { pos: [-width / 2, depth / 2 + overhang], onBack: false, onLeft: true, onRight: false },
    { pos: [width / 2, depth / 2 + overhang], onBack: false, onLeft: false, onRight: true },
    { pos: [-width / 2, -depth / 2], onBack: true, onLeft: true, onRight: false },
    { pos: [width / 2, -depth / 2], onBack: true, onLeft: false, onRight: true },
  ];

  // Mid posts for wide spans
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
}

// ─── Step 3: Generate Parts List ────────────────────────────

let partCounter = 0;
function pid(kind: string) { return `${kind}-${partCounter++}`; }

export function generateParts(config: PatioConfig, layout: DerivedLayout): Part[] {
  partCounter = 0;
  const parts: Part[] = [];
  const { width, depth, height } = layout;
  const { beamProfileH: bH, beamProfileW: bW, overhang, totalDepth, slopeAngle, postPositions } = layout;
  const colS = mm(layout.colSize);

  // ── Ground ──
  parts.push({
    id: pid('ground'), kind: 'ground',
    position: [0, -0.01, 0], rotation: [-Math.PI / 2, 0, 0],
    dimensions: [width + 4, depth + 4, 0.01],
    color: '#a09a8c', metalness: 0, roughness: 0.95,
    geometry: 'plane',
  });

  // ── Walls ──
  if (!layout.isFreestanding) {
    if (layout.hasBack) {
      parts.push({
        id: pid('wall'), kind: 'wall',
        position: [0, height / 2 + 0.5, -depth / 2 - 0.1], rotation: [0, 0, 0],
        dimensions: [width + 2, height + 1.5, 0.2],
        color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box',
      });
    }
    if (layout.hasLeft) {
      parts.push({
        id: pid('wall'), kind: 'wall',
        position: [-width / 2 - 0.1, height / 2 + 0.5, 0], rotation: [0, 0, 0],
        dimensions: [0.2, height + 1.5, depth + 2],
        color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box',
      });
    }
    if (layout.hasRight) {
      parts.push({
        id: pid('wall'), kind: 'wall',
        position: [width / 2 + 0.1, height / 2 + 0.5, 0], rotation: [0, 0, 0],
        dimensions: [0.2, height + 1.5, depth + 2],
        color: '#c8c0b4', metalness: 0, roughness: 0.9, geometry: 'box',
      });
    }
  }

  // ── 1. Base plates ──
  const plateW = mm(BRACKETS.postBracket.width);
  const plateH = mm(BRACKETS.postBracket.height);
  for (const [x, z] of postPositions) {
    parts.push({
      id: pid('base-plate'), kind: 'base-plate',
      position: [x, plateH / 2, z], rotation: [0, 0, 0],
      dimensions: [plateW, plateH, plateW],
      color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
    });
  }

  // ── 2. Columns ──
  for (const [x, z] of postPositions) {
    parts.push({
      id: pid('column'), kind: 'column',
      position: [x, height / 2, z], rotation: [0, 0, 0],
      dimensions: [colS, height, colS],
      color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    });
    parts.push({
      id: pid('post-cap'), kind: 'post-cap',
      position: [x, height, z], rotation: [0, 0, 0],
      dimensions: [colS + 0.01, mm(BRACKETS.postCap.height), colS + 0.01],
      color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
    });
  }

  // ── 3. Wall brackets ──
  if (!layout.isFreestanding) {
    const bkW = mm(BRACKETS.wallBracket.width);
    const bkH = mm(BRACKETS.wallBracket.height);
    const bkD = mm(BRACKETS.wallBracket.depth);
    if (layout.hasBack) {
      const count = Math.max(2, Math.ceil(width / 1.8));
      for (let i = 0; i < count; i++) {
        const x = -width / 2 + (width / (count - 1)) * i;
        parts.push({
          id: pid('wall-bracket'), kind: 'wall-bracket',
          position: [x, height - bH / 2, -depth / 2 - bkD / 2], rotation: [0, 0, 0],
          dimensions: [bkW, bkH, bkD],
          color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
        });
      }
    }
    if (layout.hasLeft) {
      parts.push({
        id: pid('wall-bracket'), kind: 'wall-bracket',
        position: [-width / 2 - bkD / 2, height - bH / 2, 0], rotation: [0, 0, 0],
        dimensions: [bkD, bkH, bkW],
        color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
      });
    }
    if (layout.hasRight) {
      parts.push({
        id: pid('wall-bracket'), kind: 'wall-bracket',
        position: [width / 2 + bkD / 2, height - bH / 2, 0], rotation: [0, 0, 0],
        dimensions: [bkD, bkH, bkW],
        color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
      });
    }
  }

  // ── 4. Beams ──
  const beamY = height - bH / 2;
  // Back beam
  parts.push({
    id: pid('beam'), kind: 'beam',
    position: [0, beamY, -depth / 2], rotation: [0, 0, 0],
    dimensions: [width + bW, bH, bW],
    color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    metadata: { label: 'Back Beam' },
  });
  // Left side beam
  parts.push({
    id: pid('beam'), kind: 'beam',
    position: [-width / 2, beamY, 0], rotation: [0, 0, 0],
    dimensions: [bW, bH, depth],
    color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    metadata: { label: 'Left Beam' },
  });
  // Right side beam
  parts.push({
    id: pid('beam'), kind: 'beam',
    position: [width / 2, beamY, 0], rotation: [0, 0, 0],
    dimensions: [bW, bH, depth],
    color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    metadata: { label: 'Right Beam' },
  });
  // Front beam
  parts.push({
    id: pid('beam'), kind: 'beam',
    position: [0, beamY, depth / 2 + overhang], rotation: [0, 0, 0],
    dimensions: [width + bW, bH, bW],
    color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    metadata: { label: 'Front Beam' },
  });

  // Beam-to-beam brackets
  for (const [x, z] of [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2 + overhang],
    [width / 2, depth / 2 + overhang],
  ]) {
    parts.push({
      id: pid('beam-bracket'), kind: 'beam-bracket',
      position: [x, beamY, z], rotation: [0, 0, 0],
      dimensions: [mm(BRACKETS.beamToBeamBracket.width), mm(BRACKETS.beamToBeamBracket.height), bW + 0.01],
      color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
    });
  }

  // Flute lines
  if (layout.beam.fluted) {
    for (const t of [0.25, 0.5, 0.75]) {
      parts.push({
        id: pid('flute-line'), kind: 'flute-line',
        position: [0, height - bH * t, depth / 2 + overhang + bW / 2 + 0.002], rotation: [0, 0, 0],
        dimensions: [width + bW - 0.02, 0.004, 0.004],
        color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'box',
      });
    }
  }

  // ── 5. Purlins ──
  if (layout.patioType.hasPurlins) {
    const purlinH = bH * 0.6;
    const purlinW = mm(layout.beam.profileWidth) * 0.8;
    const purlinY = height - bH - purlinH / 2;

    if (layout.patioType.hasMidPurlin) {
      parts.push({
        id: pid('purlin'), kind: 'purlin',
        position: [0, purlinY, 0], rotation: [0, 0, 0],
        dimensions: [purlinW, purlinH, depth + 0.05],
        color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
      });
    }
    const spacing = 1.2;
    const count = Math.max(2, Math.floor(depth / spacing));
    for (let i = 0; i <= count; i++) {
      const z = -depth / 2 + (depth / count) * i;
      parts.push({
        id: pid('purlin'), kind: 'purlin',
        position: [0, purlinY, z], rotation: [0, 0, 0],
        dimensions: [width - 0.02, purlinH, purlinW],
        color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
      });
    }
  }

  // ── 6. Roof sheets (flat/skillion/fly-over only — gable & skyline handled in renderer) ──
  if (!layout.isGable && config.style !== 'skyline') {
    const sheetThick = layout.sheet.insulated ? mm(layout.sheet.thickness) : 0.004;
    const roofY = height - bH + sheetThick / 2;
    const sheetCenterZ = overhang / 2;
    const isInsulated = layout.sheet.insulated;

    const roofRotation = isInsulated ? 0 : slopeAngle;
    parts.push({
      id: pid('roof-sheet'), kind: 'roof-sheet',
      position: [0, roofY, sheetCenterZ], rotation: [roofRotation, 0, 0],
      dimensions: [width - 0.02, sheetThick, totalDepth - 0.02],
      color: isInsulated ? '#e8e0d0' : config.frameColor,
      metalness: isInsulated ? 0.1 : 0.5,
      roughness: isInsulated ? 0.7 : 0.4,
      geometry: 'box',
    });

    // Ribs
    if (layout.sheet.ribHeight > 0) {
      const ribH = mm(layout.sheet.ribHeight);
      const ribSpacing = mm(layout.sheet.ribSpacing);
      if (layout.patioType.sheetDirection === 'depth') {
        const count = Math.floor(width / ribSpacing);
        for (let i = 0; i <= count; i++) {
          const x = -width / 2 + i * ribSpacing;
          parts.push({
            id: pid('rib'), kind: 'rib',
            position: [x, roofY + sheetThick / 2 + ribH / 2, sheetCenterZ],
            rotation: [roofRotation, 0, 0],
            dimensions: [0.015, ribH, totalDepth - 0.02],
            color: isInsulated ? '#e8e0d0' : config.frameColor,
            metalness: isInsulated ? 0.1 : 0.5,
            roughness: isInsulated ? 0.7 : 0.4,
            geometry: 'box',
          });
        }
      } else {
        const count = Math.floor(totalDepth / ribSpacing);
        for (let i = 0; i <= count; i++) {
          const z = -totalDepth / 2 + i * ribSpacing;
          parts.push({
            id: pid('rib'), kind: 'rib',
            position: [0, roofY + sheetThick / 2 + ribH / 2, z],
            rotation: [0, 0, 0],
            dimensions: [width + 0.08, ribH, 0.015],
            color: isInsulated ? '#e8e0d0' : config.frameColor,
            metalness: isInsulated ? 0.1 : 0.5,
            roughness: isInsulated ? 0.7 : 0.4,
            geometry: 'box',
          });
        }
      }
    }

    // Insulated underside
    if (isInsulated) {
      const sheetCZ = overhang / 2;
      parts.push({
        id: pid('underside-panel'), kind: 'underside-panel',
        position: [0, height - bH - 0.008, sheetCZ], rotation: [0, 0, 0],
        dimensions: [width - 0.04, 0.003, totalDepth - 0.04],
        color: '#f5edd8', metalness: 0.05, roughness: 0.8, geometry: 'box',
      });
      // Panel joints
      const panelW = 1.0;
      const count = Math.floor(width / panelW);
      for (let i = 1; i < count; i++) {
        const x = -width / 2 + i * panelW;
        parts.push({
          id: pid('underside-joint'), kind: 'underside-joint',
          position: [x, height - bH - 0.010, sheetCZ], rotation: [0, 0, 0],
          dimensions: [0.015, 0.008, totalDepth - 0.04],
          color: '#f5edd8', metalness: 0.05, roughness: 0.8, geometry: 'box',
        });
      }
    }
  }

  // ── 7. Gutters & downpipes ──
  if (config.accessories.gutters) {
    const gutterW = 0.115;
    const gutterH = 0.075;
    const frontZ = depth / 2 + overhang;
    const gutterY = height - bH - gutterH / 2;

    parts.push({
      id: pid('gutter'), kind: 'gutter',
      position: [0, gutterY, frontZ + gutterW / 2], rotation: [0, 0, 0],
      dimensions: [width + 0.15, gutterH, gutterW],
      color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    });

    for (const x of [-width / 2, width / 2]) {
      const dpR = mm(DOWNPIPE.diameter) / 2;
      parts.push({
        id: pid('downpipe'), kind: 'downpipe',
        position: [x, height / 2 - bH / 2, frontZ + gutterW], rotation: [0, 0, 0],
        dimensions: [dpR * 2, height - bH, dpR * 2],
        color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'cylinder',
        geometryArgs: [dpR, dpR, height - bH, 8],
      });
      parts.push({
        id: pid('downpipe-strap'), kind: 'downpipe-strap',
        position: [x, height * 0.4, frontZ + gutterW], rotation: [0, 0, 0],
        dimensions: [dpR * 2, dpR * 2, dpR * 2],
        color: '#555555', metalness: 0.6, roughness: 0.4, geometry: 'torus',
        geometryArgs: [dpR + 0.005, 0.003, 6, 12],
      });
    }
  }

  // ── 8. Designer beam ──
  if (config.accessories.designerBeam) {
    parts.push({
      id: pid('designer-beam'), kind: 'designer-beam',
      position: [0, height - bH * 1.5, depth / 2 + overhang + 0.01], rotation: [0, 0, 0],
      dimensions: [width + 0.08, bH * 0.5, mm(layout.beam.profileWidth) * 1.5],
      color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'box',
    });
  }

  // ── 9. Lights ──
  if (config.accessories.lighting) {
    const gableH = layout.isGable ? Math.min(width, depth) * 0.18 : 0;
    const count = Math.max(2, Math.ceil(width / 1.5));
    for (let i = 0; i < count; i++) {
      const x = -width / 2 + 0.4 + (i * (width - 0.8)) / Math.max(1, count - 1);
      const gableOffset = layout.isGable ? gableH * (1 - Math.abs(x) / (width / 2)) : 0;
      const lightY = height - bH - 0.05 + gableOffset;
      parts.push({
        id: pid('light'), kind: 'light',
        position: [x, lightY, 0], rotation: [0, 0, 0],
        dimensions: [0.13, 0.025, 0.13],
        color: '#333333', metalness: 0.8, roughness: 0.3, geometry: 'cylinder',
        geometryArgs: [0.05, 0.065, 0.025, 12],
        metadata: { emitLight: true, lightColor: '#ffd699', lightIntensity: 0.25 },
      });
    }
  }

  // ── 10. Fan ──
  if (config.accessories.fans) {
    const gableH = layout.isGable ? Math.min(width, depth) * 0.18 : 0;
    const fanY = height - bH - 0.15 + gableH;
    parts.push({
      id: pid('fan-rod'), kind: 'fan-rod',
      position: [0, fanY + 0.06, 0], rotation: [0, 0, 0],
      dimensions: [0.03, 0.12, 0.03],
      color: '#444444', metalness: 0.7, roughness: 0.3, geometry: 'cylinder',
      geometryArgs: [0.015, 0.015, 0.12, 8],
    });
    parts.push({
      id: pid('fan-motor'), kind: 'fan-motor',
      position: [0, fanY, 0], rotation: [0, 0, 0],
      dimensions: [0.08, 0.04, 0.08],
      color: '#444444', metalness: 0.7, roughness: 0.3, geometry: 'cylinder',
      geometryArgs: [0.04, 0.04, 0.04, 12],
    });
    for (let i = 0; i < 5; i++) {
      parts.push({
        id: pid('fan-blade'), kind: 'fan-blade',
        position: [Math.cos(i * Math.PI * 2 / 5) * 0.22, fanY - 0.02, Math.sin(i * Math.PI * 2 / 5) * 0.22],
        rotation: [0, i * Math.PI * 2 / 5, 0],
        dimensions: [0.35, 0.008, 0.06],
        color: '#555555', metalness: 0.5, roughness: 0.4, geometry: 'box',
      });
    }
  }

  // ── Decorative columns ──
  if (config.accessories.columns) {
    for (const [x, z] of postPositions) {
      parts.push({
        id: pid('decorative-column'), kind: 'decorative-column',
        position: [x, height * 0.35, z], rotation: [0, 0, 0],
        dimensions: [0.15, height * 0.7, 0.15],
        color: config.frameColor, metalness: 0.3, roughness: 0.6, geometry: 'cylinder',
        geometryArgs: [0.055, 0.075, height * 0.7, 12],
      });
    }
  }

  return parts;
}

// ─── Full pipeline function ─────────────────────────────────

export function buildPatioPipeline(config: PatioConfig) {
  const validated = validateConfig(config);
  const layout = deriveLayout(validated);
  const parts = generateParts(validated, layout);
  return { config: validated, layout, parts };
}
