import { StrategicResource, PersonalityType, StrategicObjective, DiplomacyAction, UnitType } from '../types';

export const ACTION_COSTS = {
  move: 1,
  recruit: 1,
  attack: 2,
  build: 1,
  diplomacy: 2
};

export interface UnitStats {
  cost: { gold: number; food: number; materials: number; pop: number };
  maintenance: { gold: number; food: number };
  attack: number;
  defense: number;
  speed: number;
  requires?: StrategicResource;
  vision?: boolean;
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  infantry: {
    cost: { gold: 5, food: 3, materials: 1, pop: 10 },
    maintenance: { gold: 0.3, food: 0.2 },
    attack: 1.0, defense: 1.5, speed: 1
  },
  archers: {
    cost: { gold: 8, food: 3, materials: 5, pop: 10 },
    maintenance: { gold: 0.4, food: 0.2 },
    attack: 1.5, defense: 1.0, speed: 1,
    requires: 'wood' as StrategicResource
  },
  cavalry: {
    cost: { gold: 15, food: 8, materials: 8, pop: 15 },
    maintenance: { gold: 0.8, food: 0.3 },
    attack: 2.5, defense: 1.2, speed: 2,
    requires: 'horse' as StrategicResource
  },
  scouts: {
    cost: { gold: 10, food: 5, materials: 2, pop: 5 },
    maintenance: { gold: 0.2, food: 0.1 },
    attack: 0.2, defense: 0.2, speed: 3,
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

export const DIPLOMACY_ACTION_COSTS: Record<DiplomacyAction, number> = {
  alliance: 2,
  nonAggressionPact: 1,
  defensivePact: 1,
  improveRelations: 1,
  sendInsult: 1,
  offerTribute: 1,
  demandTribute: 1,
  declareWar: 2
};

export const DIPLOMACY_FLAVOR_TEXTS: Record<DiplomacyAction, { accepted: string; rejected?: string }> = {
  alliance: {
    accepted: '{from} e {to} selam uma aliança sagrada.',
    rejected: '{to} rejeita a proposta de aliança de {from}.'
  },
  nonAggressionPact: {
    accepted: '{from} e {to} firmam um pacto de não agressão.',
    rejected: '{to} recusa o pacto de não agressão de {from}.'
  },
  defensivePact: {
    accepted: '{from} e {to} juram proteger-se mutuamente.',
    rejected: '{to} rejeita o pacto defensivo de {from}.'
  },
  improveRelations: {
    accepted: '{from} envia uma oferta de conciliação a {to}.'
  },
  sendInsult: {
    accepted: '{from} ofende publicamente {to}.'
  },
  offerTribute: {
    accepted: '{from} oferece tributo a {to}.',
    rejected: '{to} recusa o tributo enviado por {from}.'
  },
  demandTribute: {
    accepted: '{from} exige tributo de {to}.',
    rejected: '{to} desafia a exigência de tributo feita por {from}.'
  },
  declareWar: {
    accepted: '{from} declara guerra contra {to}.'
  }
};

export const TECH_TREE: Record<string, any> = {
  MILITARY: [
    {
      id: 'iron_weapons',
      name: 'Armas de Ferro',
      description: 'Melhora a qualidade das armas, aumentando o poder de ataque.',
      cost: 100,
      prerequisites: [],
      bonus: { type: 'military', value: 0.1 }
    },
    {
      id: 'professional_training',
      name: 'Treinamento Profissional',
      description: 'Reduz o custo de recrutamento de tropas.',
      cost: 150,
      prerequisites: ['iron_weapons'],
      bonus: { type: 'recruitment', value: 0.15 }
    },
    {
      id: 'advanced_fortifications',
      name: 'Fortificações Avançadas',
      description: 'Melhora as defesas das províncias.',
      cost: 200,
      prerequisites: [],
      bonus: { type: 'construction', value: 0.2 }
    }
  ],
  ECONOMY: [
    {
      id: 'crop_rotation',
      name: 'Rotação de Culturas',
      description: 'Aumenta a produção de comida em todas as províncias.',
      cost: 100,
      prerequisites: [],
      bonus: { type: 'economy', value: 0.15 }
    },
    {
      id: 'deep_mining',
      name: 'Mineração Profunda',
      description: 'Aumenta a produção de materiais.',
      cost: 150,
      prerequisites: [],
      bonus: { type: 'economy', value: 0.15 }
    },
    {
      id: 'guild_system',
      name: 'Sistema de Guildas',
      description: 'Aumenta a renda de ouro global.',
      cost: 200,
      prerequisites: ['crop_rotation', 'deep_mining'],
      bonus: { type: 'economy', value: 0.1 }
    }
  ],
  ADMINISTRATION: [
    {
      id: 'bureaucracy',
      name: 'Burocracia Centralizada',
      description: 'Reduz o custo de assimilação de províncias.',
      cost: 100,
      prerequisites: [],
      bonus: { type: 'administration', value: 0.2 }
    },
    {
      id: 'legal_code',
      name: 'Código de Leis',
      description: 'Aumenta a lealdade base das províncias.',
      cost: 150,
      prerequisites: ['bureaucracy'],
      bonus: { type: 'loyalty', value: 0.1 }
    }
  ]
};

export const LOAN_CONSTANTS = {
  MAX_LOANS: 3,
  INTEREST_RATE: 0.05, // 5% por turno
  DURATION: 20, // turnos
  LOAN_AMOUNT_FACTOR: 500 // Ouro base por província possuída
};
