export type StrategicResource = 'none' | 'iron' | 'wood' | 'horse' | 'stone';
export type PersonalityType = 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
export type StrategicObjective = 'regional_dominance' | 'destroy_rival' | 'wealth' | 'resource_control' | 'defensive_block';
export type Terrain = 'plains' | 'forest' | 'mountain' | 'coastal' | 'desert' | 'steppe' | 'lake';
export type GovernmentType = 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal';
export type TechCategory = 'movement' | 'assimilation' | 'recruitment' | 'combat';
export type ActionType = 'idle' | 'move' | 'attack' | 'recruit' | 'build' | 'diplomacy' | 'dispatching_scouts' | 'trade' | 'routing' | 'disband' | 'moving' | 'attacking' | 'migrate';
export type DiplomacyAction = 
  | 'alliance' 
  | 'nonAggressionPact' 
  | 'defensivePact' 
  | 'improveRelations' 
  | 'sendInsult' 
  | 'offerTribute' 
  | 'demandTribute' 
  | 'declareWar'
  | 'appeaseVassal';

export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade'
  | 'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength';
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
  army: Army;
  troops: number;
  population: number;
  maxPopulation: number;
  strategicResource: StrategicResource;
  wealth: number;
  foodProduction: number;
  materialProduction: number;
  defense: number;
  terrain: Terrain;
  neighbors: string[];
  polygon: [number, number][];
  center: [number, number];
  buildings: {
    farms: number;
    mines: number;
    workshops: number;
    courts: number;
  };
  siegeDamage: number;
  loyalty: number;
  stability: number;
  recentlyConquered: number;
  turnsWithoutWar?: number;
  originalOwnerId?: string; // Fase 2: dono pré-guerra (capitulação)
  postWarInstability?: number; // Fase 2: turnos restantes de -4 loyalty (capitulação)
  isWater?: boolean; // Mega mapa: célula oceânica (não-jogável)
  occupantRealmId?: string; // Reino ocupante de tropas/frotas posicionadas (ex: oceano ou área neutra)
  organicPath?: string; // Caminho SVG suavizado com perturbação orgânica
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[];
  bonus: {
    type: 'military' | 'economy' | 'administration' | 'loyalty' | 'recruitment' | 'construction';
    value: number;
  };
}

export interface Loan {
  id: string;
  amount: number;
  interest: number;
  dueTurn: number;
  remainingTurns: number;
}

export interface Realm {
  id: string;
  name: string;
  color: string;
  gold: number;
  food: number;
  materials: number;
  isPlayer: boolean;
  capitalId?: string;
  personality: PersonalityType;
  objective: StrategicObjective;
  
  // HUD Info
  goldIncome?: number;
  goldMaintenance?: number;
  foodIncome?: number;
  foodMaintenance?: number;
  materialsIncome?: number;
  
  relations: Record<string, number>;
  wars: string[];
  alliances: string[];
  nonAggressionPacts: string[];
  defensivePacts: string[];
  tributeTo: Record<string, number>;
  tributeFrom: Record<string, number>;
  napExpiryTurn: Record<string, number>;
  
  actionPoints: number;
  maxActionPoints: number;
  memory: Record<string, RealmMemory>;
  overextension: number;
  
  tradeRoutes: { fromProvinceId: string; toProvinceId: string }[];
  tradesThisTurn: number;
  isCoalitionMember?: boolean;
  vassals: string[];
  pacts: string[];

  // Novos Sistemas
  techPoints: number;
  unlockedTechs: string[];
  loans: Loan[];
  warExhaustion: number;

  // Fase 2 — Tecnologia e Governos
  techLevels: Record<TechCategory, number>;
  government: GovernmentType;
  governmentChangeCooldown: number;
  vassalLiberty: Record<string, number>;
  vassalOf?: string;

  // Fase 2 — Estatísticas de tracking (tela de derrota)
  battlesWon: number;
  realmsDefeated: number;
  cumulativeGold: number;
  maxProvincesHeld: number;
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
  originProvinceId?: string;
  remainingPath: string[];
  troops: Army;
  kind: 'move' | 'attack' | 'scout';
  arrivalTurn?: number;
  waypoints?: string[];
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
  numRealms: number;
  numProvinces: number;
  resourceDensity: 'low' | 'medium' | 'high' | 'normal';
  aiDifficulty: 'easy' | 'normal' | 'hard';
  victoryCondition: 'conquest' | 'economic' | 'sandbox';
  aiAggression?: number; // 0-100, default 50 (Fase 2)
}

export interface GameState {
  schemaVersion: number; // 1 = Fase 1, 2 = Fase 2
  turn: number;
  realms: Record<string, Realm>;
  provinces: Record<string, Province>;
  playerRealmId: string;
  logs: string[];
  currentEvent: { name: string; description: string; type: 'positive' | 'negative' } | null;
  visualEffects: VisualEffect[];
  coalitions: { targetId: string; members: string[] }[];
  visibleProvinces: string[];
  recentlyScoutedProvinceIds?: string[];
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
  populationNet?: number;
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
