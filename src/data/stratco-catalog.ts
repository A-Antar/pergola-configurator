/**
 * Stratco Outback product catalog — real dimensions and specs
 * sourced from Stratco product documentation and span tables.
 *
 * All measurements in metres unless noted.
 */

// ─── Beams (Pro-beam) ───────────────────────────────────────────
export interface BeamSpec {
  id: string;
  label: string;
  /** mm profile height (visual depth of beam face) */
  profileHeight: number;
  /** mm profile width */
  profileWidth: number;
  /** mm base metal thickness */
  thickness: number;
  /** kg per metre */
  mass: number;
  /** max unsupported span in mm for N2 wind region */
  maxSpan: number;
  /** is this a fluted (Pro-beam) profile? */
  fluted: boolean;
}

export const BEAMS: BeamSpec[] = [
  {
    id: 'probeam-120',
    label: '120 Pro-beam',
    profileHeight: 120,
    profileWidth: 50,
    thickness: 1.0,
    mass: 3.68,
    maxSpan: 4500,
    fluted: true,
  },
  {
    id: 'probeam-150',
    label: '150 Pro-beam',
    profileHeight: 150,
    profileWidth: 50,
    thickness: 1.2,
    mass: 5.0,
    maxSpan: 8400,
    fluted: true,
  },
];

// ─── Columns / Posts ────────────────────────────────────────────
export interface ColumnSpec {
  id: string;
  label: string;
  /** mm square dimension or diameter */
  size: number;
  shape: 'square' | 'round';
  /** includes a decorative wrap? */
  decorative: boolean;
}

export const COLUMNS: ColumnSpec[] = [
  { id: 'col-75', label: '75×75 Steel', size: 75, shape: 'square', decorative: false },
  { id: 'col-100', label: '100×100 Steel', size: 100, shape: 'square', decorative: false },
  { id: 'col-140', label: '140×140 Timber-print Aluminium', size: 140, shape: 'square', decorative: true },
];

// ─── Roof Sheets ────────────────────────────────────────────────
export interface SheetSpec {
  id: string;
  label: string;
  /** mm thickness of sheet/panel */
  thickness: number;
  /** effective cover width in mm */
  coverWidth: number;
  /** max unsupported span mm */
  maxSpan: number;
  /** is insulated (Cooldek) */
  insulated: boolean;
  /** rib height for corrugated profiles (0 for flat) */
  ribHeight: number;
  /** rib spacing mm (centre to centre) */
  ribSpacing: number;
}

export const SHEETS: SheetSpec[] = [
  {
    id: 'outback-deck',
    label: 'Outback Deck (Flatdek)',
    thickness: 0.42,
    coverWidth: 680,
    maxSpan: 4500,
    insulated: false,
    ribHeight: 0,
    ribSpacing: 0,
  },
  {
    id: 'outback-superdek',
    label: 'Outback Superdek',
    thickness: 0.42,
    coverWidth: 700,
    maxSpan: 4500,
    insulated: false,
    ribHeight: 18,
    ribSpacing: 180,
  },
  {
    id: 'cooldek-50',
    label: 'Cooldek 50mm',
    thickness: 50,
    coverWidth: 1000,
    maxSpan: 4500,
    insulated: true,
    ribHeight: 17,
    ribSpacing: 200,
  },
  {
    id: 'cooldek-75',
    label: 'Cooldek 75mm',
    thickness: 75,
    coverWidth: 1000,
    maxSpan: 4500,
    insulated: true,
    ribHeight: 17,
    ribSpacing: 200,
  },
];

// ─── Gutter ─────────────────────────────────────────────────────
export interface GutterSpec {
  id: string;
  label: string;
  /** mm width */
  width: number;
  /** mm height */
  height: number;
}

export const GUTTERS: GutterSpec[] = [
  { id: 'outback-gutter', label: 'Outback Gutter', width: 115, height: 75 },
  { id: 'edge-gutter', label: 'Edge Gutter (Evolution)', width: 90, height: 55 },
];

// ─── Downpipe ───────────────────────────────────────────────────
export const DOWNPIPE = {
  diameter: 65, // mm
};

// ─── Brackets & fixings ─────────────────────────────────────────
export const BRACKETS = {
  wallBracket: { width: 120, height: 80, depth: 50 },
  beamEndBracket: { width: 50, height: 80 },
  beamToBeamBracket: { width: 100, height: 120 },
  postBracket: { width: 100, height: 20 },
  postCap: { width: 100, height: 15 },
};

// ─── Patio Types (Stratco Outback Flat configurations) ──────────
export interface PatioTypeSpec {
  id: 'type1' | 'type2' | 'type3' | 'type4';
  label: string;
  description: string;
  /** max span in mm (N2 wind region, 150 beam) */
  maxSpan: number;
  /** does it have a front overhang? */
  hasOverhang: boolean;
  /** mm overhang past front beam */
  overhangDistance: number;
  /** does it use cross purlins? */
  hasPurlins: boolean;
  /** does it have a mid-span purlin? */
  hasMidPurlin: boolean;
  /** sheets run direction */
  sheetDirection: 'depth' | 'width';
  /** recommended beam size id */
  defaultBeam: string;
}

export const PATIO_TYPES: PatioTypeSpec[] = [
  {
    id: 'type1',
    label: 'Type 1',
    description: 'Standard flat — up to 4.5m span',
    maxSpan: 4500,
    hasOverhang: false,
    overhangDistance: 0,
    hasPurlins: false,
    hasMidPurlin: false,
    sheetDirection: 'depth',
    defaultBeam: 'probeam-120',
  },
  {
    id: 'type2',
    label: 'Type 2',
    description: 'Flat with front overhang — up to 5.4m',
    maxSpan: 5400,
    hasOverhang: true,
    overhangDistance: 900,
    hasPurlins: false,
    hasMidPurlin: false,
    sheetDirection: 'depth',
    defaultBeam: 'probeam-120',
  },
  {
    id: 'type3',
    label: 'Type 3',
    description: 'Cross-purlin support — sheets run horizontally',
    maxSpan: 8400,
    hasOverhang: false,
    overhangDistance: 0,
    hasPurlins: true,
    hasMidPurlin: false,
    sheetDirection: 'width',
    defaultBeam: 'probeam-150',
  },
  {
    id: 'type4',
    label: 'Type 4',
    description: 'Mid-span purlin — up to 8.4m span',
    maxSpan: 8400,
    hasOverhang: false,
    overhangDistance: 0,
    hasPurlins: true,
    hasMidPurlin: true,
    sheetDirection: 'depth',
    defaultBeam: 'probeam-150',
  },
];

// ─── Auto-select patio type based on span ───────────────────────
export function selectPatioType(spanMm: number, isFreestanding: boolean): PatioTypeSpec {
  // Type 1: up to 4.5m
  if (spanMm <= 4500) return PATIO_TYPES[0];
  // Type 2: up to 5.4m (attached only — uses overhang)
  if (spanMm <= 5400 && !isFreestanding) return PATIO_TYPES[1];
  // Type 3: up to 8.4m with horizontal sheets
  if (spanMm <= 6000) return PATIO_TYPES[2];
  // Type 4: wide spans with mid-purlin
  return PATIO_TYPES[3];
}

// ─── Select beam for span ───────────────────────────────────────
export function selectBeamForSpan(spanMm: number): BeamSpec {
  if (spanMm <= 4500) return BEAMS[0]; // 120 Pro-beam
  return BEAMS[1]; // 150 Pro-beam
}

// ─── Select sheet from config ───────────────────────────────────
export function selectSheet(material: 'insulated' | 'colorbond', colorbondType: 'superdek' | 'flatdek'): SheetSpec {
  if (material === 'insulated') return SHEETS[2]; // Cooldek 50mm
  if (colorbondType === 'superdek') return SHEETS[1]; // Superdek
  return SHEETS[0]; // Flatdek (Outback Deck)
}

// ─── Component list for build order reference ───────────────────
export const BUILD_ORDER = [
  '1. Footings & base plates',
  '2. Columns (posts)',
  '3. Wall brackets (if attached)',
  '4. Beams — back beam first, then side beams, then front beam',
  '5. Beam-to-beam brackets at intersections',
  '6. Purlins (Type 3/4 only)',
  '7. Roof sheets — laid from back to front',
  '8. Gutters',
  '9. Downpipes',
  '10. Post caps & trim',
  '11. Accessories (lights, fans)',
] as const;
