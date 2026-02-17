/**
 * 2D cross-section profiles for Stratco beams/columns/gutters.
 * Points are in mm, forming closed polygons.
 * Used for visual reference and future extrusion-based geometry.
 *
 * To add a new profile:
 * 1. Define points as [x, y] pairs in mm forming a closed polygon (CW winding)
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
 * Pro-beam 150 — simplified outline that captures the stubby/chunky feel.
 * Real profile has fluted face; we approximate with a rectangular section
 * plus decorative indents.
 *
 *   ┌──────────────┐
 *   │              │  150mm tall
 *   │   ┌──────┐   │
 *   │   │      │   │  flute indent
 *   │   └──────┘   │
 *   │              │
 *   └──────────────┘
 *        150mm wide (H2 standard)
 */
export const PROBEAM_150: Profile2D = {
  id: 'probeam-150',
  label: '150 Pro-beam',
  category: 'beam',
  points: [
    [0, 0], [150, 0], [150, 150], [0, 150], // outer rectangle
  ],
};

export const COLUMN_100: Profile2D = {
  id: 'column-100',
  label: '100×100 Steel Post',
  category: 'column',
  points: [
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

export const GUTTER_OUTBACK: Profile2D = {
  id: 'gutter-outback',
  label: 'Outback Gutter',
  category: 'gutter',
  points: [
    // Simplified L-shaped gutter profile
    [0, 0], [115, 0], [115, 75], [105, 75], [105, 10], [0, 10],
  ],
};

/** All profiles indexed by id */
export const PROFILES: Record<string, Profile2D> = {
  'probeam-150': PROBEAM_150,
  'column-100': COLUMN_100,
  'column-140': COLUMN_140,
  'gutter-outback': GUTTER_OUTBACK,
};
