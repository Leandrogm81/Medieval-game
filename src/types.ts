export type StrategicResource = 'none' | 'iron' | 'wood' | 'horse' | 'stone';
export type PersonalityType = 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
export type StrategicObjective = 'regional_dominance' | 'destroy_rival' | 'wealth' | 'resource_control' | 'defensive_block';
export type Terrain = 'plains' | 'forest' | 'mountain';
export type ActionType = 'idle' | 'moving' | 'attacking' | 'recruit' | 'build' | 'diplomacy' | 'scouting' | 'dispatching_scouts' | 'routing';
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources';
export type UnitType = 'infantry' | 'archers' | 'cavalry' | 'scouts';

export interface Army {
  infantry: number;
  archers: number;
  cavalry: number;
  scouts: number;
}

export interface Province {
  id: string;
  name: string;
  ownerId: string;
  population: number;
  maxPopulation: number;
  wealth: number;
  foodProduction: number;
  materialProduction: number;
  strategicResource: StrategicResource;
  buildings: {
    farms: number;
    mines: number;
    workshops: number;
    courts: number;
  };
  army: Army;
  troops: number;
  defense: number;
  terrain: Terrain;
  neighbors: string[];
  polygon: [number, number][];
  center: [number, number];
  recentlyConquered: number;
  loyalty: number;
  siegeDamage?: number;
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
  capitalId?: string;
  wars: string[];
  pacts: string[];
  alliances: string[];
  vassals: string[];
  vassalOf?: string;
  tradeRoutes: { fromProvinceId: string; toProvinceId: string }[];
  overextension: number;
  personality: PersonalityType;
  objective: StrategicObjective;
  relations: Record<string, number>;
  memory: Record<string, {
    betrayal: number;
    help: number;
    aggression: number;
    lastWarTurn: number;
    warExhaustion: number;
    truces: Record<string, number>;
  }>;
  goldIncome?: number;
  goldMaintenance?: number;
  foodIncome?: number;
  foodMaintenance?: number;
  materialsIncome?: number;
  isCoalitionMember?: string;
}

export interface MarchOrder {
  id: string;
  realmId: string;
  currentProvId: string;
  remainingPath: string[];
  troops: Army;
  isScoutMission: boolean;
}

export interface War {
  id: string;
  attackerId: string;
  defenderId: string;
  startedAtTurn: number;
  warScore: number;
  attackerExhaustion: number;
  defenderExhaustion: number;
}

export interface GameSettings {
  numProvinces: number;
  numRealms: number;
  aiDifficulty: 'easy' | 'normal' | 'hard';
  resourceDensity: 'low' | 'normal' | 'high';
  victoryCondition: 'conquest' | 'economic' | 'diplomatic' | 'vassalage' | 'sandbox';
}

export interface GameState {
  turn: number;
  realms: Record<string, Realm>;
  provinces: Record<string, Province>;
  playerRealmId: string;
  logs: string[];
  currentEvent: { name: string; description: string; type: 'positive' | 'negative' } | null;
  visualEffects: VisualEffect[];
  coalitions: { targetId: string; members: string[] }[];
  visibleProvinces: string[];
  marchOrders: MarchOrder[];
  activeWars: War[];
  settings: GameSettings;
  gameOver?: { winnerId: string; reason: string };
  lastTurnMovements?: { fromId: string; toId: string; realmId: string }[];
}

export interface VisualEffect {
  id: string;
  type: 'battle' | 'conquest' | 'trade';
  x: number;
  y: number;
  duration: number;
  startTime: number;
}

export interface SaveData {
  id: string;
  name: string;
  date: string;
  state: GameState;
}

export interface TurnSummaryData {
  goldIncome: number;
  goldMaintenance: number;
  goldNet: number;
  foodIncome: number;
  foodMaintenance: number;
  foodNet: number;
  materialsIncome: number;
  provincesGained: string[];
  provincesLost: string[];
  newWars: string[];
  newTreaties: string[];
  events: string[];
  rebellionRisk: string[];
}

export interface BattleResult {
  won: boolean;
  attackerRemaining: Army;
  defenderRemaining: Army;
  attackerLosses: Army;
  defenderLosses: Army;
}
