import { describe, it, expect } from 'vitest';
import { makeState } from './helpers';
import { processEndOfTurn } from '../logic/turnLogic';
import { executeRecruitmentWithComposition } from '../logic/economyLogic';

describe('pop growth test', () => {
  it('checks pop changes after end of turn', () => {
    const state = makeState();

    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
    expect(playerProvs.length).toBeGreaterThan(0);

    const initialPop = playerProvs[0].population;
    console.log('Initial pop:', initialPop);

    const originalRandom = Math.random;
    Math.random = () => 0.99; // Evita eventos aleatórios e força previsibilidade
    try {
      const nextState = processEndOfTurn(state);
      const updatedProv = nextState.provinces[playerProvs[0].id];
      console.log('Next pop:', updatedProv.population);

      expect(updatedProv.population).toBeGreaterThan(initialPop);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('garante que populações pequenas (como 5 habitantes) crescem a cada turno', () => {
    const state = makeState();
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
    const prov = playerProvs[0];
    prov.population = 5;
    prov.maxPopulation = 1000;

    const originalRandom = Math.random;
    Math.random = () => 0.99;
    try {
      const nextState = processEndOfTurn(state);
      const updatedProv = nextState.provinces[prov.id];
      expect(updatedProv.population).toBeGreaterThan(5);
    } finally {
      Math.random = originalRandom;
    }
  });

  it('impede que o recrutamento resulte em população negativa mesmo com bônus de tecnologia', () => {
    const state = makeState();
    const playerRealm = state.realms[state.playerRealmId];
    playerRealm.techLevels = { movement: 0, assimilation: 0, recruitment: 10, combat: 0 }; // 100% bônus
    playerRealm.gold = 10000;
    playerRealm.food = 10000;
    playerRealm.materials = 10000;

    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
    const prov = playerProvs[0];
    prov.population = 10; // População pequena

    executeRecruitmentWithComposition(state, playerRealm, prov, { infantry: 100, archers: 0, cavalry: 0, scouts: 0 });

    expect(prov.population).toBeGreaterThanOrEqual(0);
  });
});
