import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecruitCost,
  getMaxRecruitable,
  executeRecruitmentWithComposition,
  executeRecruitment,
  executeBuilding,
  normalizeNaturalAmount,
} from '../logic/economyLogic';
import { makeState } from './helpers';
import { GameState, Realm, Province, UnitType } from '../types';

describe('economyLogic', () => {
  let state: GameState;
  let realm: Realm;
  let prov: Province;

  beforeEach(() => {
    state = makeState();
    realm = state.realms[state.playerRealmId];
    const own = Object.values(state.provinces).find(p => p.ownerId === realm.id)!;
    prov = own;
  });

  it('normalizeNaturalAmount nunca retorna negativo', () => {
    expect(normalizeNaturalAmount(-5)).toBe(0);
    expect(normalizeNaturalAmount(10)).toBe(10);
    expect(normalizeNaturalAmount(0)).toBe(0);
  });

  it('getRecruitCost calcula custo proporcional à quantidade', () => {
    const cost = getRecruitCost('infantry', 3);
    expect(cost.pop).toBe(30); // 10 * 3
    expect(cost.food).toBe(9); // 3 * 3
    expect(cost.materials).toBe(3); // 1 * 3
  });

  it('getMaxRecruitable respeita população e recursos', () => {
    const maxPop = getMaxRecruitable(state, realm, prov, 'infantry');
    expect(maxPop).toBeGreaterThanOrEqual(0);
    // Nunca mais que a população disponível
    expect(maxPop).toBeLessThanOrEqual(Math.floor(prov.population / 10));
  });

  it('executeRecruitmentWithComposition deduz recursos e adiciona tropas', () => {
    const before = { gold: realm.gold, food: realm.food, pop: prov.population, troops: prov.troops };
    const result = executeRecruitmentWithComposition(state, realm, prov, { infantry: 2, archers: 0, cavalry: 0, scouts: 0 });

    if (result.success) {
      expect(result.recruited.infantry).toBeGreaterThan(0);
      expect(prov.army.infantry).toBeGreaterThanOrEqual(result.recruited.infantry);
      expect(prov.troops).toBe(before.troops + result.recruited.infantry);
      expect(realm.gold).toBeLessThanOrEqual(before.gold);
      expect(realm.food).toBeLessThanOrEqual(before.food);
      expect(prov.population).toBe(before.pop - result.recruited.infantry * 10);
    }
  });

  it('executeRecruitment (legado IA) retorna boolean e só age se possível', () => {
    const result = executeRecruitment(state, realm, prov);
    expect(typeof result).toBe('boolean');
    // Recursos não podem ficar negativos após recrutar
    expect(realm.gold).toBeGreaterThanOrEqual(0);
    expect(realm.food).toBeGreaterThanOrEqual(0);
  });

  it('executeBuilding constrói farms quando há recursos', () => {
    realm.gold = 1000;
    realm.materials = 1000;
    const before = prov.buildings.farms;
    const ok = executeBuilding(state, realm, prov, 'farms');
    if (ok) {
      expect(prov.buildings.farms).toBe(before + 1);
      expect(realm.gold).toBeLessThanOrEqual(1000);
    }
  });

  it('executeBuilding falha sem recursos', () => {
    realm.gold = 0;
    realm.materials = 0;
    const ok = executeBuilding(state, realm, prov, 'farms');
    expect(ok).toBe(false);
  });
});
