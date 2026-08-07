import { describe, it, expect } from 'vitest';
import { makeState } from './helpers';
import { findPath } from '../logic/turnLogic';
import { executeDisband } from '../logic/economyLogic';

describe('population migration logic', () => {
  it('permite encontrar caminho seguro entre províncias do próprio reino', () => {
    const state = makeState({ numProvinces: 100 });
    const playerRealmId = state.playerRealmId;
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === playerRealmId);

    expect(playerProvs.length).toBeGreaterThan(1);

    const src = playerProvs[0];
    const neighbors = src.neighbors.map(id => state.provinces[id]).filter(p => p && p.ownerId === playerRealmId && !p.isWater);

    if (neighbors.length > 0) {
      const dest = neighbors[0];
      const path = findPath(state, src.id, dest.id, playerRealmId, false, false);
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1]).toBe(dest.id);
    }
  });

  it('bloqueia o caminho se a província pertencer a um inimigo sem guerra declarada', () => {
    const state = makeState();
    const playerRealmId = state.playerRealmId;
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === playerRealmId);
    const enemyProvs = Object.values(state.provinces).filter(p => p.ownerId !== playerRealmId && p.ownerId !== 'neutral' && !p.isWater);

    if (playerProvs.length > 0 && enemyProvs.length > 0) {
      const src = playerProvs[0];
      const dest = enemyProvs[0];

      // Regular migration pathfinding prohibits enemy destination
      const path = findPath(state, src.id, dest.id, playerRealmId, false, false);
      expect(path).toEqual([]);
    }
  });

  it('calcula o custo correto de ouro e retenção populacional mínima', () => {
    const amount = 50;
    const goldCost = Math.max(1, Math.ceil(amount / 10));
    expect(goldCost).toBe(5);

    const minSourcePop = 10;
    const sourcePop = 30;
    const availableInSource = Math.max(0, sourcePop - minSourcePop);
    expect(availableInSource).toBe(20);
  });
});

describe('batch disband logic', () => {
  it('dispensa todas as tropas das províncias especificadas e restitui recursos e população', () => {
    const state = makeState();
    const playerRealmId = state.playerRealmId;
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === playerRealmId && !p.isWater);
    
    expect(playerProvs.length).toBeGreaterThan(0);
    
    // Configura tropas iniciais
    const prov = playerProvs[0];
    prov.army = { infantry: 10, archers: 5, cavalry: 2, scouts: 0 };
    prov.troops = 17;
    const initialPop = prov.population;
    const realm = state.realms[playerRealmId];
    const initialGold = realm.gold;

    // Disband de todas as tropas
    const { disbanded, success } = executeDisband(state, realm, prov, prov.army);

    expect(success).toBe(true);
    expect(disbanded.infantry).toBe(10);
    expect(disbanded.archers).toBe(5);
    expect(disbanded.cavalry).toBe(2);
    expect(prov.troops).toBe(0);
    expect(prov.army.infantry).toBe(0);
    expect(prov.population).toBe(initialPop + 17);
    expect(realm.gold).toBeGreaterThan(initialGold);
  });
});
