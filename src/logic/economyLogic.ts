import { GameState, Realm, Province, UnitType, Army } from '../types';
import { UNIT_STATS, BUILDING_STATS } from './game-constants';

const TRADE_BASE_RATES: Record<'gold' | 'food' | 'materials', Record<'gold' | 'food' | 'materials', number>> = {
  gold: { gold: 1, food: 3, materials: 2 },
  food: { gold: 1 / 3, food: 1, materials: 1 / 2 },
  materials: { gold: 1 / 2, food: 2, materials: 1 }
};

const COMFORT_STOCK = 500;
const MAX_TRADES_PER_TURN = 3;
export const MAX_TRADE_AMOUNT = 10000;

export type MassActionType = 'assimilate' | 'invest' | 'buildFarms' | 'buildMines' | 'buildWorkshops' | 'buildCourts';

export interface MassActionCostEstimate {
  totalCostGold: number;
  totalCostMaterials: number;
  affectedCount: number;
}

interface MassActionConfig {
  goldCost: number;
  materialsCost: number;
  canApply: (province: Province) => boolean;
  apply: (province: Province, realm: Realm) => void;
}

export function normalizeNaturalAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function getProvinceDistances(state: GameState, startId?: string): Record<string, number> {
  if (!startId) return {};

  const distances: Record<string, number> = { [startId]: 0 };
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDist = distances[currentId];
    const province = state.provinces[currentId];
    if (!province) continue;

    (province.neighbors || []).forEach(neighborId => {
      if (distances[neighborId] !== undefined) return;
      distances[neighborId] = currentDist + 1;
      queue.push(neighborId);
    });
  }

  return distances;
}

function getOrderedOwnedProvinces(state: GameState, realmId: string): Province[] {
  const owned = Object.values(state.provinces).filter(province => province.ownerId === realmId);
  if (owned.length <= 1) return owned;

  const realm = state.realms[realmId];
  const fallbackStart = owned[0]?.id;
  const startId = realm?.capitalId && owned.some(province => province.id === realm.capitalId)
    ? realm.capitalId
    : fallbackStart;

  const distances = getProvinceDistances(state, startId);
  return [...owned].sort((a, b) => {
    const distanceA = distances[a.id] ?? Number.POSITIVE_INFINITY;
    const distanceB = distances[b.id] ?? Number.POSITIVE_INFINITY;
    if (distanceA !== distanceB) return distanceA - distanceB;
    return a.id.localeCompare(b.id);
  });
}

function runMassAction(state: GameState, realmId: string, config: MassActionConfig): { count: number; costGold: number; costMaterials: number } {
  const realm = state.realms[realmId];
  if (!realm) return { count: 0, costGold: 0, costMaterials: 0 };

  let count = 0;
  const orderedProvinces = getOrderedOwnedProvinces(state, realmId);

  for (const province of orderedProvinces) {
    if (!config.canApply(province)) continue;
    if (realm.gold < config.goldCost || realm.materials < config.materialsCost) break;

    config.apply(province, realm);
    realm.gold -= config.goldCost;
    realm.materials = normalizeNaturalAmount(realm.materials - config.materialsCost);
    count++;
  }

  return {
    count,
    costGold: count * config.goldCost,
    costMaterials: count * config.materialsCost
  };
}

function canMassBuildFarms(province: Province): boolean {
  return province.strategicResource !== 'none';
}

function canMassBuildMines(province: Province): boolean {
  return province.terrain === 'mountain';
}

function canMassBuildWorkshops(province: Province): boolean {
  return province.strategicResource === 'iron' || province.strategicResource === 'wood' || province.strategicResource === 'stone';
}

function canMassBuildCourts(_province: Province): boolean {
  return true;
}

export function estimateMassActionCost(
  state: GameState,
  realmId: string,
  costGold: number,
  costMaterials = 0
): MassActionCostEstimate {
  const affectedCount = Object.values(state.provinces).filter(province => province.ownerId === realmId).length;

  return {
    totalCostGold: affectedCount * costGold,
    totalCostMaterials: affectedCount * costMaterials,
    affectedCount
  };
}

export function massAssimilate(state: GameState, realmId: string): { count: number; cost: number } {
  const result = runMassAction(state, realmId, {
    goldCost: 50,
    materialsCost: 0,
    canApply: province => province.loyalty < 100,
    apply: province => {
      province.loyalty = Math.min(100, province.loyalty + 5);
    }
  });

  return { count: result.count, cost: result.costGold };
}

export function assimilateProvince(state: GameState, realmId: string, provinceId: string): { success: boolean; cost: number } {
  const realm = state.realms[realmId];
  const province = state.provinces[provinceId];
  if (!realm || !province || province.ownerId !== realmId) return { success: false, cost: 0 };
  const cost = 50;
  if (realm.gold < cost || province.loyalty >= 100) return { success: false, cost: 0 };

  realm.gold = normalizeNaturalAmount(realm.gold - cost);
  province.loyalty = Math.min(100, province.loyalty + 5);
  if (realm.isPlayer) {
    state.logs.push(`ASSIMILAÇÃO: ${province.name} recebeu reforço administrativo.`);
  }

  return { success: true, cost };
}

export function massInvest(state: GameState, realmId: string): { count: number; cost: number } {
  const result = runMassAction(state, realmId, {
    goldCost: 100,
    materialsCost: 0,
    canApply: province => province.loyalty >= 0,
    apply: province => {
      province.wealth += 10;
    }
  });

  return { count: result.count, cost: result.costGold };
}

export function investProvince(state: GameState, realmId: string, provinceId: string): { success: boolean; cost: number } {
  const realm = state.realms[realmId];
  const province = state.provinces[provinceId];
  if (!realm || !province || province.ownerId !== realmId) return { success: false, cost: 0 };
  const cost = 100;
  if (realm.gold < cost) return { success: false, cost: 0 };

  realm.gold = normalizeNaturalAmount(realm.gold - cost);
  province.wealth += 10;
  if (realm.isPlayer) {
    state.logs.push(`INVESTIMENTO: ${province.name} recebeu apoio econômico.`);
  }

  return { success: true, cost };
}

export function massBuildFarms(state: GameState, realmId: string): { count: number; costGold: number; costMaterials: number } {
  return runMassAction(state, realmId, {
    goldCost: 100,
    materialsCost: 50,
    canApply: canMassBuildFarms,
    apply: province => {
      province.buildings.farms += 1;
    }
  });
}

export function massBuildMines(state: GameState, realmId: string): { count: number; costGold: number; costMaterials: number } {
  return runMassAction(state, realmId, {
    goldCost: 150,
    materialsCost: 75,
    canApply: canMassBuildMines,
    apply: province => {
      province.buildings.mines += 1;
    }
  });
}

export function massBuildWorkshops(state: GameState, realmId: string): { count: number; costGold: number; costMaterials: number } {
  return runMassAction(state, realmId, {
    goldCost: 200,
    materialsCost: 100,
    canApply: canMassBuildWorkshops,
    apply: province => {
      province.buildings.workshops += 1;
    }
  });
}

export function massBuildCourts(state: GameState, realmId: string): { count: number; costGold: number; costMaterials: number } {
  return runMassAction(state, realmId, {
    goldCost: 300,
    materialsCost: 150,
    canApply: canMassBuildCourts,
    apply: province => {
      province.buildings.courts += 1;
    }
  });
}

export function getTradeRate(
  realm: Realm,
  from: 'gold' | 'food' | 'materials',
  to: 'gold' | 'food' | 'materials'
): number {
  if (from === to) return 1;

  const baseRate = TRADE_BASE_RATES[from][to] || 1;
  const targetStock = realm[to] || 0;
  const scarcity = Math.max(0, Math.min(1, 1 - (targetStock / COMFORT_STOCK)));
  const adjustedRate = baseRate * (1 + (scarcity * 0.2));

  return Math.max(1, adjustedRate);
}

export function executeTradeExchange(
  state: GameState,
  realm: Realm,
  from: 'gold' | 'food' | 'materials',
  to: 'gold' | 'food' | 'materials',
  amount: number
): boolean {
  if (!realm || from === to) return false;
  if (amount <= 0 || amount > MAX_TRADE_AMOUNT) return false;
  if ((realm.actionPoints || 0) < 1) return false;
  if ((realm.tradesThisTurn || 0) >= MAX_TRADES_PER_TURN) return false;

  const rate = getTradeRate(realm, from, to);
  const sourceAvailable = realm[from] || 0;
  const targetGain = Math.floor(amount * rate);

  if (sourceAvailable < amount || targetGain <= 0) return false;

  realm[from] -= amount;
  realm[to] += targetGain;
  realm.materials = normalizeNaturalAmount(realm.materials);
  realm.actionPoints -= 1;
  realm.tradesThisTurn = (realm.tradesThisTurn || 0) + 1;

  if (realm.isPlayer) {
    state.logs.push(`COMÉRCIO: ${amount} ${from} trocados por ${targetGain} ${to}.`);
  }

  return true;
}

export function handleResourceDeficit(realm: Realm, provinces: Province[], troopsToLose: number, type: 'gold' | 'food', state: GameState) {
  realm[type] = 0;
  let remainingLoss = troopsToLose;
  for (const prov of provinces) {
    if (remainingLoss <= 0) break;
    if (prov.troops > 0) {
      const loss = Math.min(prov.troops, remainingLoss);
      const ratio = loss / prov.troops;
      prov.army.infantry -= Math.floor(prov.army.infantry * ratio);
      prov.army.archers -= Math.floor(prov.army.archers * ratio);
      prov.army.cavalry -= Math.floor(prov.army.cavalry * ratio);
      prov.army.scouts -= Math.floor(prov.army.scouts * ratio);
      prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts;
      remainingLoss -= loss;
    }
  }
  if (realm.isPlayer) {
    state.logs.push(type === 'gold' ? `Tesouro vazio! Tropas desertaram.` : `Fome! Tropas morrendo.`);
  }
}

// Calculate max recruitable units of a type given current resources
export function getMaxRecruitable(state: GameState, realm: Realm, prov: Province, type: UnitType): number {
  const stats = UNIT_STATS[type];
  const statsWithReq = stats as any;
  
  // Check strategic resource requirement
  if (statsWithReq.requires) {
    const hasResource = Object.values(state.provinces).some(p => p.ownerId === realm.id && p.strategicResource === statsWithReq.requires);
    if (!hasResource) return 0;
  }
  
  const maxByGold = stats.cost.gold > 0 ? Math.floor(realm.gold / stats.cost.gold) : Infinity;
  const maxByFood = stats.cost.food > 0 ? Math.floor(realm.food / stats.cost.food) : Infinity;
  const maxByMaterials = stats.cost.materials > 0 ? Math.floor(realm.materials / stats.cost.materials) : Infinity;
  const maxByPop = stats.cost.pop > 0 ? Math.floor(prov.population / stats.cost.pop) : Infinity;
  
  return Math.max(0, Math.min(maxByGold, maxByFood, maxByMaterials, maxByPop));
}

// Get cost breakdown for N units of a type
export function getRecruitCost(type: UnitType, amount: number): { gold: number; food: number; materials: number; pop: number } {
  const stats = UNIT_STATS[type];
  return {
    gold: stats.cost.gold * amount,
    food: stats.cost.food * amount,
    materials: stats.cost.materials * amount,
    pop: stats.cost.pop * amount
  };
}

// Recruit exactly the specified composition (up to resource limits)
export function executeRecruitmentWithComposition(
  state: GameState,
  realm: Realm,
  prov: Province,
  desired: Army
): { recruited: Army; success: boolean } {
  const recruited: Army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
  let anySuccess = false;
  
  const types: UnitType[] = ['infantry', 'archers', 'cavalry', 'scouts'];
  
  for (const type of types) {
    const desiredAmount = desired[type] || 0;
    if (desiredAmount <= 0) continue;
    
    const maxCanRecruit = getMaxRecruitable(state, realm, prov, type);
    const actualAmount = Math.min(desiredAmount, maxCanRecruit);
    
    if (actualAmount > 0) {
      const cost = getRecruitCost(type, actualAmount);
      prov.army[type] += actualAmount;
      prov.troops += actualAmount;
      prov.population -= cost.pop;
      realm.gold -= cost.gold;
      realm.food -= cost.food;
      realm.materials = normalizeNaturalAmount(realm.materials - cost.materials);
      recruited[type] = actualAmount;
      anySuccess = true;
    }
  }
  
  return { recruited, success: anySuccess };
}

// Legacy function kept for AI compatibility
export function executeRecruitment(state: GameState, realm: Realm, prov: Province): boolean {
  const unitTypes: UnitType[] = ['infantry', 'archers', 'cavalry', 'scouts'];
  
  for (const type of unitTypes) {
    const maxCanRecruit = getMaxRecruitable(state, realm, prov, type);
    const amount = Math.min(maxCanRecruit, 5);
    
    if (amount > 0) {
      const cost = getRecruitCost(type, amount);
      prov.army[type] += amount;
      prov.troops += amount;
      prov.population -= cost.pop;
      realm.gold -= cost.gold;
      realm.food -= cost.food;
      realm.materials = normalizeNaturalAmount(realm.materials - cost.materials);
      return true;
    }
  }
  return false;
}

export function executeBuilding(state: GameState, realm: Realm, prov: Province, type: 'farms' | 'mines' | 'workshops' | 'courts' | 'fortify'): boolean {
  const stats = (BUILDING_STATS as any)[type];
  if (!stats) return false;

  const goldCost = stats.gold || 0;
  const matCost = stats.materials || 0;

  if (realm.gold >= goldCost && realm.materials >= matCost) {
    if (type === 'fortify') {
      if (prov.defense < 5) {
        prov.defense += 1;
        realm.gold -= goldCost;
        realm.materials = normalizeNaturalAmount(realm.materials - matCost);
        state.visualEffects = state.visualEffects || [];
        state.visualEffects.push({
          id: `build_fx_${Date.now()}_${Math.random()}`,
          type: 'build_particles',
          provinceId: prov.id,
          particleCount: 8,
          startTime: Date.now(),
          duration: 600
        });
        return true;
      }
    } else {
      prov.buildings[type] += 1;
      realm.gold -= goldCost;
      realm.materials = normalizeNaturalAmount(realm.materials - matCost);
      state.visualEffects = state.visualEffects || [];
      state.visualEffects.push({
        id: `build_fx_${Date.now()}_${Math.random()}`,
        type: 'build_particles',
        provinceId: prov.id,
        particleCount: 8,
        startTime: Date.now(),
        duration: 600
      });
      return true;
    }
  }
  return false;
}

// Disband troops - convert them back to population and refund 50% of resources
export function executeDisband(
  state: GameState,
  realm: Realm,
  prov: Province,
  composition: Army
): { disbanded: Army; success: boolean } {
  const disbanded: Army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
  let anySuccess = false;

  const types: UnitType[] = ['infantry', 'archers', 'cavalry', 'scouts'];

  for (const type of types) {
    const amount = Math.min(composition[type] || 0, prov.army[type]);
    if (amount <= 0) continue;

    // Return population (1:1)
    prov.population = Math.min(prov.maxPopulation, prov.population + amount);

    // Return 50% of resources spent on recruitment
    const cost = UNIT_STATS[type].cost;
    realm.gold += Math.floor(cost.gold * 0.5 * amount);
    realm.food += Math.floor(cost.food * 0.5 * amount);
    realm.materials = normalizeNaturalAmount(
      realm.materials + Math.floor(cost.materials * 0.5 * amount)
    );

    prov.army[type] -= amount;
    prov.troops -= amount;
    disbanded[type] = amount;
    anySuccess = true;
  }

  return { disbanded, success: anySuccess };
}
