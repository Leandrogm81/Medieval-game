import { GameState, GovernmentType, Realm } from '../types';

export interface GovernmentStats {
  name: string;
  defense: number;
  attack: number;
  goldIncome: number;
  foodProduction: number;
  diplomaticActions: number;
  techGeneration: number;
  recruitmentCost: number;
  populationGrowth: number;
  vassalGoldBonus: number;
  vassalLoyaltyBonus: number;
  strategicResourceBonus: number;
  stabilityInDistant: number;
  relationPenalty: number;
  flavor: string;
}

export const GOVERNMENT_STATS: Record<GovernmentType, GovernmentStats> = {
  monarchy: {
    name: 'Monarquia', defense: 1.1, attack: 1.0, goldIncome: 1.0, foodProduction: 1.0,
    diplomaticActions: -1, techGeneration: 1.0, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 0, strategicResourceBonus: 1.0, stabilityInDistant: 0, relationPenalty: 0,
    flavor: 'A coroa é absoluta. A diplomacia... nem tanto.'
  },
  republic: {
    name: 'República', defense: 1.0, attack: 1.0, goldIncome: 1.05, foodProduction: 1.0,
    diplomaticActions: 1, techGeneration: 1.0, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 0, strategicResourceBonus: 1.0, stabilityInDistant: -10, relationPenalty: 0,
    flavor: 'O senado debate enquanto o reino prospera.'
  },
  feudal: {
    name: 'Feudal', defense: 1.0, attack: 1.0, goldIncome: 0.95, foodProduction: 1.15,
    diplomaticActions: 0, techGeneration: 1.0, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 10, strategicResourceBonus: 1.0, stabilityInDistant: 0, relationPenalty: 0,
    flavor: 'Juramentos de lealdade, colheitas abundantes.'
  },
  theocracy: {
    name: 'Teocracia', defense: 1.0, attack: 1.0, goldIncome: 1.0, foodProduction: 1.0,
    diplomaticActions: 0, techGeneration: 0.9, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 0, strategicResourceBonus: 1.0, stabilityInDistant: 0, relationPenalty: 0,
    flavor: 'A fé move montanhas, mas não acelera a pesquisa.'
  },
  despotism: {
    name: 'Despotismo', defense: 1.0, attack: 1.15, goldIncome: 1.0, foodProduction: 1.0,
    diplomaticActions: 0, techGeneration: 1.0, recruitmentCost: 0.8, populationGrowth: 0.8,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 0, strategicResourceBonus: 1.0, stabilityInDistant: 0, relationPenalty: 0,
    flavor: 'O chicote recruta rápido, mas o povo sofre.'
  },
  oligarchy: {
    name: 'Oligarquia', defense: 1.0, attack: 1.0, goldIncome: 1.0, foodProduction: 1.0,
    diplomaticActions: 0, techGeneration: 1.0, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0.25, vassalLoyaltyBonus: 0, strategicResourceBonus: 1.0, stabilityInDistant: 0, relationPenalty: -10,
    flavor: 'Poucos governam. Muitos desconfiam.'
  },
  tribal: {
    name: 'Tribal', defense: 1.0, attack: 1.0, goldIncome: 1.0, foodProduction: 1.0,
    diplomaticActions: 0, techGeneration: 0.8, recruitmentCost: 1.0, populationGrowth: 1.0,
    vassalGoldBonus: 0, vassalLoyaltyBonus: 0, strategicResourceBonus: 2.0, stabilityInDistant: 0, relationPenalty: 0,
    flavor: 'A terra provê. O resto espera.'
  },
};

export const GOVERNMENT_CHANGE_COST = { gold: 500, materials: 200 };
export const GOVERNMENT_CHANGE_COOLDOWN = 20;
export const GOVERNMENT_CHANGE_LOYALTY_PENALTY = -30;
export const GOVERNMENT_CHANGE_LOYALTY_TURNS = 3;

/**
 * Verifica se uma província é "distante" da capital do reino.
 * Default threshold = 2 saltos BFS (capital + vizinhas diretas imunes).
 */
export function isProvinceDistant(
  state: GameState,
  provinceId: string,
  realm: Realm,
  threshold = 2
): boolean {
  const capitalId = realm.capitalId;
  if (!capitalId || capitalId === provinceId) return false;

  // BFS a partir da capital
  const visited = new Set<string>([capitalId]);
  const queue: { id: string; dist: number }[] = [{ id: capitalId, dist: 0 }];

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    if (id === provinceId) return dist >= threshold;
    const prov = state.provinces[id];
    if (!prov) continue;
    for (const nId of prov.neighbors || []) {
      if (!visited.has(nId)) {
        visited.add(nId);
        queue.push({ id: nId, dist: dist + 1 });
      }
    }
  }
  return true; // inalcançável = distante
}

/**
 * Muda o governo de um reino.
 * force=true (imposto via tratado): ignora custo e cooldown, mas ainda causa instabilidade.
 */
export function changeGovernment(
  realm: Realm,
  newType: GovernmentType,
  force = false
): { success: boolean; message: string } {
  if (realm.government === newType) {
    return { success: false, message: 'O reino já adota este governo.' };
  }

  if (!force) {
    if ((realm.governmentChangeCooldown || 0) > 0) {
      return { success: false, message: `Aguarde ${realm.governmentChangeCooldown} turnos para reformar o governo.` };
    }
    if (realm.gold < GOVERNMENT_CHANGE_COST.gold || realm.materials < GOVERNMENT_CHANGE_COST.materials) {
      return { success: false, message: 'Recursos insuficientes para a reforma (500 ouro + 200 obra).' };
    }
    realm.gold -= GOVERNMENT_CHANGE_COST.gold;
    realm.materials -= GOVERNMENT_CHANGE_COST.materials;
    realm.governmentChangeCooldown = GOVERNMENT_CHANGE_COOLDOWN;
  }

  realm.government = newType;
  return { success: true, message: `O reino agora é uma ${GOVERNMENT_STATS[newType].name}.` };
}

/**
 * Checa revolução: estabilidade < 20 em > 50% das províncias → 10% de chance por turno.
 * Retorna o novo governo (aleatório) ou null.
 */
export function checkRevolution(realm: Realm, state: GameState): GovernmentType | null {
  const owned = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  if (owned.length === 0) return null;

  const unstable = owned.filter(p => (p.stability ?? 0) < 20).length;
  const ratio = unstable / owned.length;
  if (ratio <= 0.5) return null;

  if (Math.random() < 0.1) {
    const options = (Object.keys(GOVERNMENT_STATS) as GovernmentType[]).filter(g => g !== realm.government);
    if (options.length === 0) return null;
    return options[Math.floor(Math.random() * options.length)];
  }
  return null;
}

export function getGovernmentFlavor(type: GovernmentType): string {
  return GOVERNMENT_STATS[type].flavor;
}
