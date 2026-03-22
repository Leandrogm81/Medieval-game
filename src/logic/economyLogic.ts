import { GameState, Realm, Province, UnitType } from '../types';
import { UNIT_STATS, BUILDING_STATS } from './gameConstants';

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

export function executeRecruitment(state: GameState, realm: Realm, prov: Province) {
  const unitTypes: UnitType[] = ['infantry', 'archers', 'cavalry', 'scouts'];
  
  for (const type of unitTypes) {
    const stats = UNIT_STATS[type];
    const statsWithReq = stats as any;
    
    if (statsWithReq.requires) {
      const hasResource = Object.values(state.provinces).some(p => p.ownerId === realm.id && p.strategicResource === statsWithReq.requires);
      if (!hasResource) continue;
    }
    
    const maxByGold = stats.cost.gold > 0 ? Math.floor(realm.gold / stats.cost.gold) : Infinity;
    const maxByFood = stats.cost.food > 0 ? Math.floor(realm.food / stats.cost.food) : Infinity;
    const maxByMaterials = stats.cost.materials > 0 ? Math.floor(realm.materials / stats.cost.materials) : Infinity;
    const maxByPop = stats.cost.pop > 0 ? Math.floor(prov.population / stats.cost.pop) : Infinity;
    
    let amount = Math.min(maxByGold, maxByFood, maxByMaterials, maxByPop, 5);
    
    if (amount > 0) {
      prov.army[type] += amount;
      prov.troops += amount;
      prov.population -= amount * stats.cost.pop;
      realm.gold -= amount * stats.cost.gold;
      realm.food -= amount * stats.cost.food;
      realm.materials -= amount * stats.cost.materials;
      break;
    }
  }
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
        realm.materials -= matCost;
        return true;
      }
    } else {
      prov.buildings[type] += 1;
      realm.gold -= goldCost;
      realm.materials -= matCost;
      return true;
    }
  }
  return false;
}
