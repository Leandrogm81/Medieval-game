export interface Province {
  id: string;
  name: string;
  ownerId: string;
  population: number;
  maxPopulation: number;
  terrain: 'plains' | 'forest' | 'mountains' | 'coastal';
  wealth: number;
  foodProduction: number;
  materialProduction: number;
  strategicResource?: 'iron' | 'horses' | 'wood' | 'stone';
  buildings: {
    farms: number;
    mines: number;
    workshops: number;
    courts: number;
  };
  army: Army;
  troops: Army;
  loyalty: number;
  defense: number;
  center: [number, number];
  polygon: [number, number][];
  neighbors: string[];
}

export interface Army {
  infantry: number;
  archers: number;
  cavalry: number;
  scouts: number;
}

export interface Realm {
  id: string;
  name: string;
  color: string;
  gold: number;
  food: number;
  materials: number;
  provinces: string[];
  isPlayer: boolean;
  isAI: boolean;
  objective?: string;
  capitalId?: string;
  overextension: number;
  actionPoints: number;
  maxActionPoints: number;
  wars: string[];
  relations: { [realmId: string]: number };
  pacts: string[];
  alliances: string[];
  vassals: string[];
  personality?: 'expansionist' | 'defensive' | 'diplomatic' | 'opportunistic' | 'commercial';
}

export interface MarchOrder {
  id: string;
  originId: string;
  destinationId: string;
  troops: Army;
  remainingPath: string[];
  isScoutMission: boolean;
}

export interface VisualEffect {
  id: string;
  type: 'battle' | 'move' | 'build' | 'recruit' | 'conquest';
  x: number;
  y: number;
  duration: number;
  startTime: number;
}

export interface GameState {
  turn: number;
  provinces: { [id: string]: Province };
  realms: { [id: string]: Realm };
  playerRealmId: string;
  selectedProvinceId: string | null;
  actionPoints: number;
  history: string[];
  logs: string[];
  marchOrders: MarchOrder[];
  visualEffects: VisualEffect[];
  gameOver: boolean;
  currentEvent: {
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
    name?: string; // Some parts use .name
  } | null;
  lastTurnMovements: {
    fromId?: string;
    toId?: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: string;
    realmId?: string;
  }[];
  visibleProvinces: string[];
}

export interface SaveData {
  id: string;
  name: string;
  date: string;
  state: GameState;
}

export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'map' | 'realm' | 'chronicles' | 'settings';
export type ActionType = 'recruit' | 'build' | 'move' | 'attack' | 'scout' | 'diplomacy' | 'trade_route' | 'demand_tribute' | 'demand_vassalage' | 'none' | 'idle' | 'moving' | 'attacking' | 'dispatching_scouts' | 'routing';
export type UnitType = 'infantry' | 'archers' | 'cavalry' | 'scouts';

export interface UIState {
  showMenu: boolean;
  showChronicles: boolean;
  showGameEnd: boolean;
  showSaveModal: boolean;
  showInstructionsModal: boolean;
  showTurnSummary: boolean;
  showCombatPreview: boolean;
  showBattleResult: boolean;
  viewMode: ViewMode;
  actionState: ActionType;
  actionSourceId: string | null;
  selectedProvinceId: string | null;
  previewPath: string[];
  isHudOpen: boolean;
  zoom: number;
  selectingMoveComposition: boolean;
  moveComposition: Army;
  autosave: SaveData | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  turnSummaryData: any;
  combatAttackerProvId: string | null;
  combatDefenderProvId: string | null;
  combatAttackingArmy: Army | null;
  battleResultData: any;
  battleResultMeta: any;
  gameSettings: { musicVolume: number; sfxVolume: number; numProvinces: number; numRealms: number };
  panOffset: { x: number; y: number };
  hasDragged: boolean;
  marchAnimations: any[];
}
