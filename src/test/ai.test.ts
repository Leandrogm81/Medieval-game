import { describe, it, expect, vi, afterEach } from 'vitest';
import { processAI } from '../logic/aiLogic';
import { makeState } from './helpers';
import { GameState } from '../types';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('aiLogic — processAI', () => {
  it('roda sem exceção com estado normal', () => {
    const state = makeState();
    expect(() => processAI(state)).not.toThrow();
  });

  it('não age para o jogador (isPlayer)', () => {
    const state = makeState();
    const playerBefore = JSON.parse(JSON.stringify(state.realms[state.playerRealmId]));
    processAI(state);
    // O jogador não deve ter AP consumido pela IA
    expect(state.realms[state.playerRealmId].actionPoints).toBe(playerBefore.actionPoints);
  });

  it('não quebra com reinos sem províncias', () => {
    const state = makeState();
    // Eliminar todas as províncias de um reino IA
    const aiRealm = Object.values(state.realms).find(r => !r.isPlayer)!;
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === aiRealm.id) p.ownerId = 'neutral';
    });
    expect(() => processAI(state)).not.toThrow();
  });

  it('roda 10 vezes consecutivas sem exceção (estabilidade)', () => {
    const state = makeState(); // gera com random real (mapa válido)
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // só então fixa para IA determinística
    for (let i = 0; i < 10; i++) {
      expect(() => processAI(state)).not.toThrow();
    }
    // Recursos não ficam negativos após IA agir
    Object.values(state.realms).forEach(realm => {
      if (realm.id === 'neutral') return;
      expect(realm.gold).toBeGreaterThanOrEqual(0);
      expect(realm.food).toBeGreaterThanOrEqual(0);
      expect(realm.materials).toBeGreaterThanOrEqual(0);
    });
  });
});
