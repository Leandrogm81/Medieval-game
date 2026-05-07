export const UNIT_STATS = {
  infantry: {
    name: 'Infantaria',
    cost: { gold: 50, food: 10, materials: 5, pop: 1 },
    maintenance: { gold: 2, food: 1 },
    attack: 10,
    defense: 10,
    speed: 1,
  },
  archers: {
    name: 'Arqueiros',
    cost: { gold: 75, food: 10, materials: 10, pop: 1 },
    maintenance: { gold: 3, food: 1 },
    attack: 15,
    defense: 5,
    speed: 1,
  },
  cavalry: {
    name: 'Cavalaria',
    cost: { gold: 150, food: 25, materials: 15, pop: 1 },
    maintenance: { gold: 8, food: 3 },
    attack: 25,
    defense: 15,
    speed: 2,
  },
};

export const ACTION_COSTS = {
  recruit: 1,
  build: 1,
  move: 1,
  attack: 2,
  scout: 1,
  diplomacy: 1,
};

export const BUILDING_STATS = {
  farms: { gold: 100, materials: 50 },
  mines: { gold: 150, materials: 75 },
  workshops: { gold: 200, materials: 100 },
  courts: { gold: 300, materials: 150 },
};

export const BUILDING_PRODUCTION = {
  farms: 20,
  mines: 15,
  workshops: 10,
  courts: 5,
};
