// Tipos principais do AstroMap

export interface BirthData {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  longitude: number; // 0-360 graus eclípticos
  latitude: number;
  speed: number;
  sign: ZodiacSign;
  degree: number; // 0-29° no signo
  house: number; // Casa 1-12
  retrograde: boolean;
}

export interface HouseSystem {
  name: string;
  code: string; // 'P' = Placidus, 'W' = Whole Signs
}

export interface HouseCusp {
  number: number;
  longitude: number;
  sign: ZodiacSign;
  degree: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: AspectType;
  angle: number; // Ângulo exato
  orb: number; // Diferença do ângulo perfeito
  applying: boolean; // Se está se aproximando ou se afastando
}

export interface NatalChart {
  birthData: BirthData;
  planets: PlanetPosition[];
  housesPlacidus: HouseCusp[];
  housesWhole: HouseCusp[];
  aspects: Aspect[];
  ascendant: number;
  mc: number; // Medium Coeli
}

export interface SavedChart {
  id: string;
  name: string;
  birthData: BirthData;
  createdAt: string;
  chart: NatalChart;
  aiReport?: AIReport;
  solarReport?: AIReport;
  solarYear?: number;
  solarRevolution?: NatalChart;
}

export interface AIReportSection {
  title: string;
  content: string;
}

export interface AIReport {
  sections: AIReportSection[];
  summary: string;
  generatedAt: string;
}

export type ZodiacSign =
  | 'Áries'
  | 'Touro'
  | 'Gêmeos'
  | 'Câncer'
  | 'Leão'
  | 'Virgem'
  | 'Libra'
  | 'Escorpião'
  | 'Sagitário'
  | 'Capricórnio'
  | 'Aquário'
  | 'Peixes';

export type AspectType =
  | 'conjunction' // 0°
  | 'semisextile' // 30°
  | 'semisquare' // 45°
  | 'sextile' // 60°
  | 'quintile' // 72°
  | 'square' // 90°
  | 'trine' // 120°
  | 'sesquiquadrate' // 135°
  | 'biquintile' // 144°
  | 'quincunx' // 150°
  | 'opposition'; // 180°

export interface GeocodingResult {
  display_name: string;
  lat: number;
  lon: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

// Constantes astrológicas
export const ZODIAC_SIGNS: { name: ZodiacSign; symbol: string; element: 'fire' | 'earth' | 'air' | 'water'; start: number }[] = [
  { name: 'Áries', symbol: '♈', element: 'fire', start: 0 },
  { name: 'Touro', symbol: '♉', element: 'earth', start: 30 },
  { name: 'Gêmeos', symbol: '♊', element: 'air', start: 60 },
  { name: 'Câncer', symbol: '♋', element: 'water', start: 90 },
  { name: 'Leão', symbol: '♌', element: 'fire', start: 120 },
  { name: 'Virgem', symbol: '♍', element: 'earth', start: 150 },
  { name: 'Libra', symbol: '♎', element: 'air', start: 180 },
  { name: 'Escorpião', symbol: '♏', element: 'water', start: 210 },
  { name: 'Sagitário', symbol: '♐', element: 'fire', start: 240 },
  { name: 'Capricórnio', symbol: '♑', element: 'earth', start: 270 },
  { name: 'Aquário', symbol: '♒', element: 'air', start: 300 },
  { name: 'Peixes', symbol: '♓', element: 'water', start: 330 },
];

export const PLANETS = [
  { id: 'sun', name: 'Sol', symbol: '☉', sweId: 0 },
  { id: 'moon', name: 'Lua', symbol: '☽', sweId: 1 },
  { id: 'mercury', name: 'Mercúrio', symbol: '☿', sweId: 2 },
  { id: 'venus', name: 'Vênus', symbol: '♀', sweId: 3 },
  { id: 'mars', name: 'Marte', symbol: '♂', sweId: 4 },
  { id: 'jupiter', name: 'Júpiter', symbol: '♃', sweId: 5 },
  { id: 'saturn', name: 'Saturno', symbol: '♄', sweId: 6 },
  { id: 'uranus', name: 'Urano', symbol: '♅', sweId: 7 },
  { id: 'neptune', name: 'Netuno', symbol: '♆', sweId: 8 },
  { id: 'pluto', name: 'Plutão', symbol: '♇', sweId: 9 },
  { id: 'node', name: 'Nodo Norte', symbol: '☊', sweId: 10 }, // Mean node
  { id: 'chiron', name: 'Quíron', symbol: '⚷', sweId: 15 },
] as const;

export const ASPECT_ORBS: Record<AspectType, { angle: number; orb: number }> = {
  conjunction: { angle: 0, orb: 8 },
  semisextile: { angle: 30, orb: 2 },
  semisquare: { angle: 45, orb: 2 },
  sextile: { angle: 60, orb: 6 },
  quintile: { angle: 72, orb: 2 },
  square: { angle: 90, orb: 8 },
  trine: { angle: 120, orb: 8 },
  sesquiquadrate: { angle: 135, orb: 2 },
  biquintile: { angle: 144, orb: 2 },
  quincunx: { angle: 150, orb: 3 },
  opposition: { angle: 180, orb: 8 },
};
