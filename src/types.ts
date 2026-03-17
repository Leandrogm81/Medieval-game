export type Terrain = 'plains' | 'forest' | 'mountain';
export type UnitType = 'infantry' | 'archers' | 'cavalry';
export type StrategicResource = 'none' | 'iron' | 'wood' | 'horse' | 'stone';

export interface Army {
  infantry: number;
  archers: number;
  cavalry: number;
}

export type PersonalityType = 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
export type StrategicObjective = 'regional_dominance' | 'destroy_rival' | 'wealth' | 'resource_control' | 'defensive_block';

export interface DiplomaticMemory {
  betrayal: number; // 0-100
  help: number; // 0-100
  aggression: number; // 0-100
  lastWarTurn: number;
}

export interface Realm {
  id: string;
  name: string;
  color: string;
  gold: number;
  food: number;
  materials: number;
  isPlayer: boolean;
  actionPoints: number;
  maxActionPoints: number;
  overextension: number; // 0-100, affects stability and income
  relations: Record<string, number>; // -100 to 100
  memory: Record<string, DiplomaticMemory>;
  alliances: string[];
  wars: string[];
  pacts: string[]; // Non-aggression pacts with other realm IDs
  tradeRoutes: { from: string; to: string }[];
  personality: PersonalityType;
  objective: StrategicObjective;
  vassalOf?: string; // Overlord ID
  vassals: string[]; // Vassal IDs
  isCoalitionMember?: string; // Target ID
}

export interface Province {
  id: string;
  name: string;
  ownerId: string;
  army: Army;
  troops: number; // Total troops (calculated)
  population: number;
  maxPopulation: number;
  strategicResource: StrategicResource;
  wealth: number; // Gold generated per turn
  foodProduction: number;
  materialProduction: number;
  defense: number; // Defense bonus level (0-5)
  terrain: Terrain;
  neighbors: string[];
  polygon: [number, number][];
  center: [number, number];
  buildings: {
    farms: number;
    mines: number;
    workshops: number;
  };
}

export interface GameEvent {
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface VisualEffect {
  id: string;
  type: 'battle' | 'conquest' | 'trade';
  x: number;
  y: number;
  duration: number; // in ms
  startTime: number;
}

export interface Coalition {
  targetId: string;
  members: string[];
}

export type VictoryCondition = 'conquest' | 'economic' | 'diplomatic' | 'vassalage' | 'sandbox';

export interface GameSettings {
  numProvinces: number;
  numRealms: number;
  aiDifficulty: 'easy' | 'normal' | 'hard';
  resourceDensity: 'low' | 'normal' | 'high';
  victoryCondition: VictoryCondition;
}

export interface GameState {
  turn: number;
  realms: Record<string, Realm>;
  provinces: Record<string, Province>;
  playerRealmId: string;
  logs: string[];
  currentEvent: GameEvent | null;
  visualEffects: VisualEffect[];
  coalitions: Coalition[];
  visibleProvinces: string[];
  settings: GameSettings;
  gameOver?: {
    winnerId: string;
    reason: string;
  };
}

export interface SaveData {
  id: string;
  name: string;
  date: string;
  state: GameState;
}

export type ActionType = 'idle' | 'moving' | 'attacking' | 'trading' | 'diplomacy' | 'send_gift' | 'propose_pact' | 'propose_alliance' | 'demand_tribute' | 'demand_vassalage';

export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources';
