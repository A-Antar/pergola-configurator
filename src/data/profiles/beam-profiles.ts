/**
 * 2D cross-section profiles for Stratco beams/columns/gutters.
 * Points are in mm, forming closed polygons (CW winding).
 * Used for ExtrudeGeometry-based rendering.
 *
 * To add a new profile:
 * 1. Define points as [x, y] pairs in mm forming a closed polygon
 * 2. Add to PROFILES map with a unique id
 * 3. Use buildExtrudedProfile() to create THREE.js geometry from it
 */

export interface Profile2D {
  id: string;
  label: string;
  /** Closed polygon points [x, y] in mm */
  points: [number, number][];
  /** Profile category */
  category: 'beam' | 'column' | 'gutter' | 'sheet';
}

/**
 * Pro-beam 150 — C-channel profile with fluted face.
 * Realistic cross-section approximation:
 *
 *   ┌──────────────────┐  ← top flange (150 wide, 3mm thick)
 *   │                  │
 *   └──┐            ┌──┘
 *      │            │      ← web (50mm wide, 144mm tall)
 *      │            │
 *   ┌──┘            └──┐
 *   │                  │
 *   └──────────────────┘  ← bottom flange
 */
export const PROBEAM_150: Profile2D = {
  id: 'probeam-150',
  label: '150 Pro-beam',
  category: 'beam',
  points: [
    // Outer rectangle with C-channel cutouts
    // Bottom-left, going clockwise
    [0, 0],
    [150, 0],        // bottom edge
    [150, 3],        // bottom flange top-right
    [100, 3],        // inner step right
    [100, 147],      // web right inner
    [150, 147],      // top flange inner-right
    [150, 150],      // top-right corner
    [0, 150],        // top-left corner
    [0, 147],        // top flange inner-left
    [50, 147],       // web left inner top
    [50, 3],         // web left inner bottom
    [0, 3],          // bottom flange inner-left
  ],
};

/**
 * Pro-beam 120 — smaller C-channel
 */
export const PROBEAM_120: Profile2D = {
  id: 'probeam-120',
  label: '120 Pro-beam',
  category: 'beam',
  points: [
    [0, 0],
    [120, 0],
    [120, 3],
    [85, 3],
    [85, 117],
    [120, 117],
    [120, 120],
    [0, 120],
    [0, 117],
    [35, 117],
    [35, 3],
    [0, 3],
  ],
};

export const COLUMN_100: Profile2D = {
  id: 'column-100',
  label: '100×100 Steel Post',
  category: 'column',
  points: [
    // Hollow square tube: outer 100mm, wall thickness 3mm
    [0, 0], [100, 0], [100, 100], [0, 100],
  ],
};

export const COLUMN_140: Profile2D = {
  id: 'column-140',
  label: '140×140 Timber-print Aluminium',
  category: 'column',
  points: [
    [0, 0], [140, 0], [140, 140], [0, 140],
  ],
};

/**
 * Outback Gutter — L-shaped gutter profile
 *
 *   ┌───────────────────┐
 *   │                   │  75mm tall
 *   │   ┌───────────────┘
 *   │   │                  10mm base
 *   └───┘
 *     115mm wide
 */
export const GUTTER_OUTBACK: Profile2D = {
  id: 'gutter-outback',
  label: 'Outback Gutter',
  category: 'gutter',
  points: [
    [0, 0], [115, 0], [115, 75], [105, 75], [105, 10], [0, 10],
  ],
};

/**
 * Purlin profile — smaller C-channel
 */
export const PURLIN_PROFILE: Profile2D = {
  id: 'purlin',
  label: 'Purlin C-section',
  category: 'beam',
  points: [
    [0, 0], [40, 0], [40, 2], [28, 2], [28, 58], [40, 58], [40, 60], [0, 60], [0, 58], [12, 58], [12, 2], [0, 2],
  ],
};

/** All profiles indexed by id */
export const PROFILES: Record<string, Profile2D> = {
  'probeam-150': PROBEAM_150,
  'probeam-120': PROBEAM_120,
  'column-100': COLUMN_100,
  'column-140': COLUMN_140,
  'gutter-outback': GUTTER_OUTBACK,
  'purlin': PURLIN_PROFILE,
};
