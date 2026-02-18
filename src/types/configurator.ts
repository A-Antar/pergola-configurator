export type ProductLine = 'patios' | 'louvre' | 'carports' | 'sunrooms' | 'decking' | 'ezi-slat';

export type AttachmentSide = 'back' | 'left' | 'right';
export type WallSide = 'back' | 'left' | 'right' | 'front';

export interface WallConfig {
  enabled: boolean;
  /** Wall height in mm */
  height: number;
  /** Wall thickness in mm */
  thickness: number;
  /** Offset from default position in mm (positive = outward) */
  offset: number;
  /** Wall length in mm (auto-calculated from patio dims, user can override) */
  length: number;
}

export type WallsConfig = Record<WallSide, WallConfig>;

export interface PatioConfig {
  material: 'insulated' | 'colorbond';
  colorbondType: 'superdek' | 'flatdek';
  shape: 'flat' | 'gable';
  style: 'skillion' | 'fly-over' | 'free-standing' | 'skyline' | 'timber-look';
  width: number;
  depth: number;
  height: number;
  frameColor: string;
  attachedSides: AttachmentSide[];
  walls: WallsConfig;
  accessories: {
    lighting: boolean;
    fans: boolean;
    gutters: boolean;
    designerBeam: boolean;
    columns: boolean;
  };
}

export function createDefaultWall(lengthMm: number): WallConfig {
  return { enabled: false, height: 2800, thickness: 200, offset: 0, length: lengthMm };
}

export function createDefaultWalls(widthM: number, depthM: number): WallsConfig {
  return {
    back: { enabled: true, height: 2800, thickness: 200, offset: 0, length: Math.round(widthM * 1000) },
    left: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(depthM * 1000) },
    right: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(depthM * 1000) },
    front: { enabled: false, height: 2800, thickness: 200, offset: 0, length: Math.round(widthM * 1000) },
  };
}

export const FRAME_COLORS: { name: string; hex: string }[] = [
  { name: 'Surfmist', hex: '#e8e4da' },
  { name: 'Monument', hex: '#2d2c2b' },
  { name: 'Night Sky', hex: '#1a1a1a' },
  { name: 'Shale Grey', hex: '#b0a99f' },
  { name: 'Basalt', hex: '#6b6860' },
  { name: 'Woodland Grey', hex: '#4d4f47' },
  { name: 'Ironstone', hex: '#3c3228' },
  { name: 'Pale Eucalypt', hex: '#6b8c5a' },
];

export const DEFAULT_PATIO_CONFIG: PatioConfig = {
  material: 'insulated',
  colorbondType: 'superdek',
  shape: 'flat',
  style: 'fly-over',
  width: 5,
  depth: 3.5,
  height: 2.8,
  frameColor: '#2d2c2b',
  attachedSides: ['back'],
  walls: createDefaultWalls(5, 3.5),
  accessories: {
    lighting: false,
    fans: false,
    gutters: true,
    designerBeam: false,
    columns: false,
  },
};

export interface PricingProfile {
  id: string;
  productLine: ProductLine;
  profileName: string;
  minCharge: number;
  minSize: number;
  ratePerM2: number;
  optionAdders: Record<string, number>;
}

export interface LeadData {
  serviceType: ProductLine;
  configJson: PatioConfig;
  estimateMin: number;
  estimateMax: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  suburb: string;
  jobRequirements: string;
  estimatedSize: number;
}

export const PATIO_PRICING: Record<string, PricingProfile> = {
  insulated: {
    id: 'insulated',
    productLine: 'patios',
    profileName: 'Insulated Panel',
    minCharge: 6500,
    minSize: 9,
    ratePerM2: 420,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1800,
    },
  },
  colorbond_superdek: {
    id: 'colorbond_superdek',
    productLine: 'patios',
    profileName: 'Colorbond Superdek',
    minCharge: 4800,
    minSize: 9,
    ratePerM2: 310,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1500,
    },
  },
  colorbond_flatdek: {
    id: 'colorbond_flatdek',
    productLine: 'patios',
    profileName: 'Colorbond Flatdek',
    minCharge: 4200,
    minSize: 9,
    ratePerM2: 280,
    optionAdders: {
      lighting: 350,
      fans: 480,
      gutters: 280,
      designerBeam: 650,
      columns: 520,
      gable: 1400,
    },
  },
};
