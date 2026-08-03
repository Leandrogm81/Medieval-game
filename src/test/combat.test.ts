import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveCombat, calculateRetreat, getRetreatDestination } from '../logic/combatLogic';
import { makeState } from './helpers';
import { Army, Terrain } from '../types';

// resolveCombat usa Math.random() para variação 0.9-1.1.
// Para determinismo, fixamos Math.random em 0.5 → fator exatamente 1.0.
function deterministicCombat() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
}

afterEach(() => {
  vi.restoreAllMocks();
});

const bigArmy: Army = { infantry: 100, archers: 0, cavalry: 0, scouts: 0 };
const smallArmy: Army = { infantry: 10, archers: 0, cavalry: 0, scouts: 0 };

describe('combatLogic — resolveCombat', () => {
  it('atacante muito superior vence em planície', () => {
    deterministicCombat();
    const result = resolveCombat(bigArmy, smallArmy, 'plains', 0);
    expect(result.won).toBe(true);
    expect(result.attackerRemaining.infantry).toBeGreaterThan(0);
    // Perdedor sofre baixas pesadas
    expect(result.defenderRemaining.infantry).toBeLessThan(10);
  });

  it('defensor em montanha com vantagem vence', () => {
    deterministicCombat();
    // 50 inf vs 40 inf em montanha: defesa x1.5
    const result = resolveCombat(
      { infantry: 50, archers: 0, cavalry: 0, scouts: 0 },
      { infantry: 40, archers: 0, cavalry: 0, scouts: 0 },
      'mountain',
      0
    );
    expect(result.won).toBe(false);
  });

  it('bônus tecnológico do atacante pode virar a batalha', () => {
    deterministicCombat();
    // 50 inf sem tech vs 50 inf com +50%: atk=75 vs def=75 → empate; com +100%: atk=100 > 75
    const result = resolveCombat(
      { infantry: 50, archers: 0, cavalry: 0, scouts: 0 },
      { infantry: 50, archers: 0, cavalry: 0, scouts: 0 },
      'plains',
      0,
      undefined,
      undefined,
      1.0, // +100% ataque por tech
      0
    );
    expect(result.won).toBe(true);
  });

  it('nível de defesa (fortificações) aumenta poder defensivo', () => {
    deterministicCombat();
    // Sem defesa: 50v50 em plains é empate técnico com fator 1.0 → atk = 50*1.0, def = 50*1.5... 
    // (infantaria: atk 1.0, def 1.5) — defesa base já é maior; com defenseLevel 5 (x2) fica evidente
    const result = resolveCombat(
      { infantry: 100, archers: 0, cavalry: 0, scouts: 0 },
      { infantry: 60, archers: 0, cavalry: 0, scouts: 0 },
      'plains',
      5 // +100% defesa
    );
    expect(result.won).toBe(false);
  });

  it('não muta os exércitos de entrada', () => {
    deterministicCombat();
    const attacker: Army = { infantry: 100, archers: 10, cavalry: 5, scouts: 2 };
    const defender: Army = { infantry: 80, archers: 5, cavalry: 3, scouts: 1 };
    const attackerCopy = JSON.parse(JSON.stringify(attacker));
    const defenderCopy = JSON.parse(JSON.stringify(defender));
    resolveCombat(attacker, defender, 'plains', 0);
    expect(attacker).toEqual(attackerCopy);
    expect(defender).toEqual(defenderCopy);
  });

  it('scouts não sofrem baixas', () => {
    deterministicCombat();
    const result = resolveCombat(
      { infantry: 100, archers: 0, cavalry: 0, scouts: 5 },
      { infantry: 10, archers: 0, cavalry: 0, scouts: 0 },
      'plains',
      0
    );
    expect(result.attackerRemaining.scouts).toBe(5);
  });
});

describe('combatLogic — retirada', () => {
  it('calculateRetreat preserva uma fração do exército', () => {
    const army: Army = { infantry: 100, archers: 50, cavalry: 20, scouts: 5 };
    const retreated = calculateRetreat(army, 0.3);
    expect(retreated.infantry).toBe(30); // floor(100*0.3)
    expect(retreated.archers).toBe(15);  // floor(50*0.3)
    expect(retreated.cavalry).toBe(6);   // floor(20*0.3)
    expect(retreated.scouts).toBe(1);    // floor(5*0.3), mínimo 1 se > 0
  });

  it('calculateRetreat retorna exército vazio se não há tropas', () => {
    const empty: Army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
    expect(calculateRetreat(empty, 0.3)).toEqual({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
  });

  it('getRetreatDestination retorna vizinho amigo ou null', () => {
    const state = makeState();
    const playerRealmId = state.playerRealmId;
    const prov = Object.values(state.provinces).find(p => p.ownerId === playerRealmId)!;
    const dest = getRetreatDestination(state, prov.id, playerRealmId);
    if (dest) {
      const destProv = state.provinces[dest];
      expect(destProv.ownerId).toBe(playerRealmId);
      expect(prov.neighbors).toContain(dest);
    } else {
      // Sem vizinho amigo: retorno null é aceitável (exército destruído)
      expect(dest).toBeNull();
    }
  });
});
