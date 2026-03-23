export type Terrain = 'plains' | 'forest' | 'mountain';
export type UnitType = 'infantry' | 'archers' | 'cavalry' | 'scouts';
export type StrategicResource = 'none' | 'iron' | 'wood' | 'horse' | 'stone';

export interface Army {
  infantry: number;
  archers: number;
  cavalry: number;
  scouts: number;
}

export type PersonalityType = 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
export type StrategicObjective = 'regional_dominance' | 'destroy_rival' | 'wealth' | 'resource_control' | 'defensive_block';

export interface BattleResult {
  won: boolean;
  attackerRemaining: Army;
  defenderRemaining: Army;
  attackerLosses: Army;
  defenderLosses: Army;
  attackerInitial: Army;
  defenderInitial: Army;
  terrain: Terrain;
  defenseLevel: number;
  rounds: number;
}

export interface War {
  id: string;
  attackerId: string;
  defenderId: string;
  startedAtTurn: number;
  warScore: number; // -100 to 100 (positive favors attacker)
  attackerExhaustion: number; // 0-100
  defenderExhaustion: number; // 0-100
}

export interface StrategicAssessment {
  threatenedBorders: Province[];
  offensiveTargets: Province[];
  wealthState: 'rich' | 'stable' | 'poor';
  militaryState: 'strong' | 'stable' | 'weak';
  safeInternal: Province[];
  strategicResourceTargets: Province[];
  rivalProvinces: Province[];
}

export interface DiplomaticMemory {
  betrayal: number; // 0-100
  help: number; // 0-100
  aggression: number; // 0-100
  lastWarTurn: number;
  warExhaustion: number; // 0-100, measures fatigue from losses and duration of wars
  truces: Record<string, number>; // Maps realm ID to turn when truce expires
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
  tradeRoutes: { fromProvinceId: string; toProvinceId: string }[];
  personality: PersonalityType;
  objective: StrategicObjective;
  vassalOf?: string; // Overlord ID
  vassals: string[]; // Vassal IDs
  isCoalitionMember?: string; // Target ID
  capitalId?: string; // ID of the capital province
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
    courts: number; // Administrative buildings
  };
  siegeDamage: number; // Damage to defense from sieges
  loyalty: number; // 0-100, local stability
  recentlyConquered: number; // Number of turns remaining with conquest penalty
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
  marchOrders: MarchOrder[];
  activeWars: War[];
  lastTurnMovements?: { fromId: string; toId: string; realmId: string }[];
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

export type ActionType = 'idle' | 'moving' | 'routing' | 'dispatching_scouts' | 'attacking' | 'trading' | 'diplomacy' | 'send_gift' | 'propose_pact' | 'propose_alliance' | 'demand_tribute' | 'demand_vassalage' | 'declare_war' | 'offer_peace' | 'break_pact';

/** Ordem de marcha: um exército viajando autonomamente pelo mapa */
export interface MarchOrder {
  id: string;
  realmId: string;
  /** Onde as tropas estão agora (última província que pisaram) */
  currentProvId: string;
  /** Caminho restante (IDs de províncias a visitar, excluindo currentProv) */
  remainingPath: string[];
  /** Composição do exército em marcha */
  troops: Army;
  /** Se true, são batedores — não entram em combate nem causam guerra */
  isScoutMission: boolean;
}

export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources';

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
  rebellionRisk: string[]; // Province names
}
