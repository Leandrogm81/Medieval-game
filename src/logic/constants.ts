import { StrategicResource, PersonalityType, StrategicObjective } from '../types';

export const ACTION_COSTS = {
  move: 2,
  recruit: 1,
  attack: 4,
  build: 2,
  diplomacy: 2
};

export const UNIT_STATS = {
  infantry: { 
    cost: { gold: 0, food: 3, materials: 1, pop: 10 }, 
    maintenance: { gold: 0.1, food: 0.1 },
    attack: 1.0, defense: 1.5, speed: 1 
  },
  archers: { 
    cost: { gold: 0, food: 3, materials: 5, pop: 10 }, 
    maintenance: { gold: 0.1, food: 0.1 },
    attack: 1.2, defense: 1.2, speed: 1,
    requires: 'wood' as StrategicResource
  },
  cavalry: { 
    cost: { gold: 0, food: 8, materials: 8, pop: 15 }, 
    maintenance: { gold: 0.2, food: 0.1 },
    attack: 2.0, defense: 1.0, speed: 2,
    requires: 'horse' as StrategicResource
  },
  scouts: {
    cost: { gold: 50, food: 5, materials: 5, pop: 5 },
    maintenance: { gold: 0.3, food: 0.1 },
    attack: 0.1, defense: 0.1, speed: 3,
    vision: true
  }
};

export const BUILDING_STATS = {
  farms: { gold: 25, materials: 15 },
  mines: { gold: 40, materials: 20 },
  workshops: { gold: 35, materials: 15 },
  courts: { gold: 60, materials: 30 },
  fortify: { gold: 20, materials: 10 }
};

export const BUILDING_PRODUCTION = {
  farms: 18,
  mines: 20,
  workshops: 12,
  courts: 10
};

export const REALM_NAMES = ["Avalon", "Eldoria", "Thalassa", "Gondor", "Rohan", "Mercia", "Wessex", "Northumbria"];
export const REALM_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];
export const PROVINCE_NAMES = [
  "Aethelgard", "Blythe", "Cairn", "Dunwich", "Eversong", "Falkreath", "Glimmer", "Hearth",
  "Ilium", "Jorvik", "Kaelen", "Lothian", "Mourn", "Nessa", "Oakhaven", "Prydwen",
  "Qarth", "Riven", "Storms End", "Tarn", "Ulthuan", "Valeria", "Winterfell", "Xanadu",
  "Ysgard", "Zendikar", "Aldor", "Bael", "Cormyr", "Dalaran"
];
export const STRATEGIC_RESOURCES: StrategicResource[] = ['none', 'iron', 'wood', 'horse', 'stone'];
export const PERSONALITIES: PersonalityType[] = ['expansionist', 'defensive', 'diplomatic', 'opportunistic', 'commercial'];
export const OBJECTIVES: StrategicObjective[] = ['regional_dominance', 'destroy_rival', 'wealth', 'resource_control', 'defensive_block'];
