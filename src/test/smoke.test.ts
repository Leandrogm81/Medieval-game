import { describe, it, expect } from 'vitest';
import { generateInitialState } from '../logic/mapGeneration';
import { processAI } from '../logic/aiLogic';
import { processEndOfTurn } from '../logic/turnLogic';
import { makeState } from './helpers';

describe('Smoke test — geração e turno completo', () => {
  it('gera estado inicial válido', () => {
    const state = makeState();
    expect(state.turn).toBe(1);
    expect(Object.keys(state.realms).length).toBe(4);
    expect(Object.keys(state.provinces).length).toBeGreaterThanOrEqual(4);
    expect(state.playerRealmId).toBe('realm_0');
    expect(state.visibleProvinces.length).toBeGreaterThan(0);
  });

  it('roda 30 turnos completos sem exceção (IA + fim de turno)', () => {
    let state = makeState();
    for (let i = 0; i < 30; i++) {
      expect(() => {
        processAI(state); // IA age sobre o estado atual (padrão do projeto)
        state = processEndOfTurn(state); // clona internamente e processa
      }).not.toThrow();
      expect(state.turn).toBe(i + 2);
      // Recursos dos reinos nunca ficam negativos (normalizeNaturalAmount)
      Object.values(state.realms).forEach(realm => {
        if (realm.id === 'neutral') return;
        expect(realm.gold).toBeGreaterThanOrEqual(0);
        expect(realm.food).toBeGreaterThanOrEqual(0);
        expect(realm.materials).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('march orders chegam ao destino no fim do turno', () => {
    const state = makeState();
    // Encontrar uma província do jogador com vizinho amigo para marchar
    const player = state.realms[state.playerRealmId];
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === player.id);
    const source = playerProvs[0];
    const target = source.neighbors
      .map(id => state.provinces[id])
      .find(p => p && p.ownerId === player.id);

    if (!source || !target) return; // mapa pequeno pode não ter vizinho amigo

    const troops = { infantry: 2, archers: 0, cavalry: 0, scouts: 0 };
    state.marchOrders.push({
      id: 'march_test_1',
      realmId: player.id,
      currentProvId: source.id,
      destinationId: target.id,
      originProvinceId: source.id,
      remainingPath: [target.id],
      troops,
      kind: 'move',
    });
    source.army.infantry -= 2;
    source.troops -= 2;

    const next = processEndOfTurn(state);
    const arrived = next.marchOrders.find(o => o.id === 'march_test_1');
    expect(arrived).toBeUndefined(); // ordem consumida
    const targetAfter = next.provinces[target.id];
    expect(targetAfter.army.infantry).toBeGreaterThanOrEqual(2);
  });
});
