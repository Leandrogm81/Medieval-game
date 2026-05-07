export type StrategicResource = 'none' | 'iron' | 'wood' | 'horse' | 'stone';
export type PersonalityType = 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
export type StrategicObjective = 'regional_dominance' | 'destroy_rival' | 'wealth' | 'resource_control' | 'defensive_block';
export type Terrain = 'plains' | 'forest' | 'mountain';
export type ActionType = 'idle' | 'moving' | 'attacking' | 'recruit' | 'build' | 'diplomacy' | 'scouting' | 'dispatching_scouts' | 'routing' | 'disband' | 'trade';
export type DiplomacyAction =
  | 'alliance'
  | 'nonAggressionPact'
  | 'defensivePact'
  | 'improveRelations'
  | 'sendInsult'
  | 'offerTribute'
  | 'demandTribute'
  | 'declareWar';
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade';
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
  stability: number;
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
  tradesThisTurn?: number;
  overextension: number;
  personality: PersonalityType;
  objective: StrategicObjective;
  relations: Record<string, number>;
  nonAggressionPacts: string[];
  defensivePacts: string[];
  tributeFrom: Record<string, number>;
  tributeTo: Record<string, number>;
  napExpiryTurn: Record<string, number>;
  memory: Record<string, RealmMemory>;
  goldIncome?: number;
  goldMaintenance?: number;
  foodIncome?: number;
  foodMaintenance?: number;
  materialsIncome?: number;
  isCoalitionMember?: string;
}

export interface RealmMemory {
  betrayal: number;
  help: number;
  aggression: number;
  lastWarTurn: number;
  warExhaustion: number;
}

export interface MarchOrder {
  id: string;
  realmId: string;
  currentProvId: string;
  destinationId: string;
  remainingPath: string[];
  troops: Army;
  kind: 'move' | 'attack' | 'scout';
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
  pendingBattleResults?: {
    attackerName: string;
    defenderName: string;
    provinceName: string;
    conquered: boolean;
    result: BattleResult;
    retreatInfo?: RetreatInfo;
  }[];
  gameOver?: { winnerId: string; reason: string };
  lastTurnMovements?: { fromId: string; toId: string; realmId: string }[];
}

export interface VisualEffect {
  id: string;
  type: 'battle' | 'conquest' | 'trade' | 'battle_particles' | 'conquest_particles' | 'build_particles';
  provinceId?: string;
  x?: number;
  y?: number;
  duration: number;
  startTime: number;
  particleCount?: number;
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
  materialsNet: number;
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

export interface RetreatInfo {
  count: number;
  destinationName: string;
  composition: Army;
}

export interface CallToArmsRequest {
  id: string;
  defenderId: string;
  aggressorId: string;
  calledRealmId: string;
  pactType: 'alliance' | 'defensivePact';
  resolved: boolean;
}
