export type Terrain = 'plains' | 'forest' | 'mountain';

export interface Realm {
  id: string;
  name: string;
  color: string;
  gold: number;
  food: number;
  materials: number;
  isPlayer: boolean;
  relations: Record<string, number>; // -100 to 100
  alliances: string[];
  wars: string[];
  pacts: string[]; // Non-aggression pacts with other realm IDs
  tradeRoutes: { from: string; to: string }[];
}

export interface Province {
  id: string;
  name: string;
  ownerId: string;
  troops: number;
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

export interface GameState {
  turn: number;
  realms: Record<string, Realm>;
  provinces: Record<string, Province>;
  playerRealmId: string;
  logs: string[];
  currentEvent: GameEvent | null;
  visualEffects: VisualEffect[];
  gameOver?: {
    winnerId: string;
    reason: string;
  };
}

export type ActionType = 'idle' | 'moving' | 'attacking' | 'trading' | 'diplomacy' | 'send_gift' | 'propose_pact' | 'propose_alliance';
