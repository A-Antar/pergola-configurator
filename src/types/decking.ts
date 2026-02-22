// ─── Decking Configurator Types ────────────────────────────

export type DeckingMaterial = 'composite' | 'cedar' | 'pine' | 'merbau' | 'spotted-gum';
export type RailingStyle = 'none' | 'glass' | 'wire' | 'timber';
export type RailingPosition = 'front' | 'left' | 'right' | 'back';

export interface DeckingConfig {
  material: DeckingMaterial;
  length: number;    // metres
  width: number;     // metres
  height: number;    // metres (deck platform height from ground)
  boardDirection: 'lengthwise' | 'widthwise';
  color: string;
  railingStyle: RailingStyle;
  railingPositions: RailingPosition[];
  stairs: {
    enabled: boolean;
    position: 'front' | 'left' | 'right';
    width: number; // metres
  };
  accessories: {
    lighting: boolean;
    seating: boolean;
  };
}

export const DECKING_MATERIALS: { id: DeckingMaterial; name: string; desc: string }[] = [
  { id: 'composite', name: 'Composite', desc: 'Low maintenance, long-lasting composite boards' },
  { id: 'cedar', name: 'Western Red Cedar', desc: 'Natural beauty with warm tones' },
  { id: 'pine', name: 'Treated Pine', desc: 'Affordable & pressure-treated for durability' },
  { id: 'merbau', name: 'Merbau', desc: 'Rich dark hardwood, naturally durable' },
  { id: 'spotted-gum', name: 'Spotted Gum', desc: 'Premium Australian hardwood' },
];

export const DECKING_COLORS: Record<DeckingMaterial, { name: string; hex: string }[]> = {
  composite: [
    { name: 'Charcoal', hex: '#3a3a3a' },
    { name: 'Walnut', hex: '#5c3d2e' },
    { name: 'Teak', hex: '#8b6d4c' },
    { name: 'Silver Grey', hex: '#8c8c8c' },
    { name: 'Sandstone', hex: '#c4a96a' },
  ],
  cedar: [
    { name: 'Natural', hex: '#b5754a' },
    { name: 'Honey', hex: '#c49255' },
    { name: 'Amber', hex: '#9e6b3a' },
  ],
  pine: [
    { name: 'Natural Pine', hex: '#c9a96e' },
    { name: 'Jarrah Stain', hex: '#6e2d1e' },
    { name: 'Walnut Stain', hex: '#5a3e2b' },
    { name: 'Grey Wash', hex: '#9a9590' },
  ],
  merbau: [
    { name: 'Natural', hex: '#6b3325' },
    { name: 'Oiled', hex: '#7a3f2d' },
  ],
  'spotted-gum': [
    { name: 'Natural', hex: '#8c6e4a' },
    { name: 'Oiled', hex: '#7a5e3c' },
  ],
};

export const DEFAULT_DECKING_CONFIG: DeckingConfig = {
  material: 'composite',
  length: 5,
  width: 3.5,
  height: 0.6,
  boardDirection: 'lengthwise',
  color: '#5c3d2e',
  railingStyle: 'none',
  railingPositions: ['front', 'left', 'right'],
  stairs: { enabled: false, position: 'front', width: 1.2 },
  accessories: { lighting: false, seating: false },
};

// ─── Decking Pricing (linear metre / unit-based) ──────────

export interface DeckingPricingProfile {
  material: DeckingMaterial;
  label: string;
  boardRatePerLm: number;       // per linear metre of boards
  joistRatePerLm: number;       // per linear metre of joists
  bearerRatePerLm: number;      // per linear metre of bearers
  postCostEach: number;
  fixingsPerM2: number;
  labourPerM2: number;
  adders: Record<string, number>;
}

export const DECKING_PRICING: Record<DeckingMaterial, DeckingPricingProfile> = {
  composite: {
    material: 'composite',
    label: 'Composite Decking',
    boardRatePerLm: 18,
    joistRatePerLm: 8,
    bearerRatePerLm: 12,
    postCostEach: 45,
    fixingsPerM2: 6,
    labourPerM2: 85,
    adders: { stairs: 1200, glass: 380, wire: 260, timber: 180, lighting: 450, seating: 800 },
  },
  cedar: {
    material: 'cedar',
    label: 'Western Red Cedar',
    boardRatePerLm: 24,
    joistRatePerLm: 8,
    bearerRatePerLm: 12,
    postCostEach: 45,
    fixingsPerM2: 5,
    labourPerM2: 95,
    adders: { stairs: 1400, glass: 380, wire: 260, timber: 180, lighting: 450, seating: 900 },
  },
  pine: {
    material: 'pine',
    label: 'Treated Pine',
    boardRatePerLm: 10,
    joistRatePerLm: 6,
    bearerRatePerLm: 9,
    postCostEach: 35,
    fixingsPerM2: 5,
    labourPerM2: 70,
    adders: { stairs: 900, glass: 380, wire: 260, timber: 150, lighting: 450, seating: 650 },
  },
  merbau: {
    material: 'merbau',
    label: 'Merbau Hardwood',
    boardRatePerLm: 32,
    joistRatePerLm: 10,
    bearerRatePerLm: 14,
    postCostEach: 55,
    fixingsPerM2: 7,
    labourPerM2: 110,
    adders: { stairs: 1600, glass: 380, wire: 260, timber: 200, lighting: 450, seating: 1000 },
  },
  'spotted-gum': {
    material: 'spotted-gum',
    label: 'Spotted Gum',
    boardRatePerLm: 38,
    joistRatePerLm: 10,
    bearerRatePerLm: 14,
    postCostEach: 55,
    fixingsPerM2: 7,
    labourPerM2: 120,
    adders: { stairs: 1800, glass: 380, wire: 260, timber: 200, lighting: 450, seating: 1100 },
  },
};
