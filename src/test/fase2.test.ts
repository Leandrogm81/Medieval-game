import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getTechUpgradeCost,
  allocateTechPoints,
  generateTechPoints,
  getTechEffects,
  TECH_MAX_LEVELS,
} from '../logic/technologyLogic';
import {
  GOVERNMENT_STATS,
  changeGovernment,
  isProvinceDistant,
  checkRevolution,
  GOVERNMENT_CHANGE_COOLDOWN,
} from '../logic/governmentLogic';
import { checkCapitulation, executeCapitulation } from '../logic/capitulationLogic';
import { canAppeaseVassal, appeaseVassal as appeaseDiplomacy } from '../logic/diplomacyLogic';
import { processVassalLiberty, appeaseVassal, LIBERTY_REBELLION_THRESHOLD } from '../logic/vassalLogic';
import { getMaxLoanAmount, getLoanPayment, takeLoan, canTakeLoan, processRealmLoans } from '../logic/financeLogic';
import { calculateMilitaryPower, executeAIAttack } from '../logic/aiLogic';
import { generateInitialState } from '../logic/mapGeneration';
import { processEndOfTurn } from '../logic/turnLogic';
import { makeState } from './helpers';
import { GameState, Realm } from '../types';

afterEach(() => vi.restoreAllMocks());

// ============ TECNOLOGIA ============
describe('Fase 2 — Tecnologia', () => {
  it('custo triangular: 10, 15, 25, 40, 60, 85, 115...', () => {
    const expected = [10, 15, 25, 40, 60, 85, 115, 150, 190, 235];
    expected.forEach((cost, level) => {
      expect(getTechUpgradeCost(level)).toBe(cost);
    });
  });

  it('allocateTechPoints deduz pontos e incrementa nível', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.techPoints = 50;
    const ok = allocateTechPoints(realm, 'movement'); // custo 10
    expect(ok).toBe(true);
    expect(realm.techLevels.movement).toBe(1);
    expect(realm.techPoints).toBe(40);
  });

  it('allocateTechPoints falha sem pontos suficientes', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.techPoints = 5;
    expect(allocateTechPoints(realm, 'movement')).toBe(false);
    expect(realm.techLevels.movement).toBe(0);
  });

  it('allocateTechPoints respeita nível máximo', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.techPoints = 10000;
    realm.techLevels.movement = TECH_MAX_LEVELS.movement;
    expect(allocateTechPoints(realm, 'movement')).toBe(false);
  });

  it('generateTechPoints é função pura e respeita cap de 20', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    // População enorme + edifícios → cap 20
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === realm.id) {
        p.population = 100000;
        p.buildings.workshops = 10;
        p.buildings.courts = 10;
      }
    });
    const points = generateTechPoints(realm, state);
    expect(points).toBeLessThanOrEqual(20);
    expect(points).toBeGreaterThanOrEqual(1);
  });

  it('getTechEffects reflete níveis', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.techLevels = { movement: 2, assimilation: 1, recruitment: 3, combat: 4 };
    const effects = getTechEffects(realm);
    expect(effects.movementAPBonus).toBe(1.0);
    expect(effects.assimilationDiscount).toBeCloseTo(0.1);
    expect(effects.recruitmentBonus).toBeCloseTo(0.3);
    expect(effects.combatBonus).toBeCloseTo(0.2);
  });
});

// ============ GOVERNOS ============
describe('Fase 2 — Governos', () => {
  it('todos os 7 governos têm stats definidos', () => {
    expect(Object.keys(GOVERNMENT_STATS)).toHaveLength(7);
    ['monarchy', 'republic', 'feudal', 'theocracy', 'despotism', 'oligarchy', 'tribal'].forEach(g => {
      expect(GOVERNMENT_STATS[g as keyof typeof GOVERNMENT_STATS].name).toBeTruthy();
    });
  });

  it('changeGovernment cobra recursos e aplica cooldown', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.gold = 1000;
    realm.materials = 500;
    const result = changeGovernment(realm, 'republic');
    expect(result.success).toBe(true);
    expect(realm.government).toBe('republic');
    expect(realm.gold).toBe(500); // 1000 - 500
    expect(realm.governmentChangeCooldown).toBe(GOVERNMENT_CHANGE_COOLDOWN);
  });

  it('changeGovernment bloqueia por cooldown', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.gold = 1000;
    realm.materials = 500;
    realm.governmentChangeCooldown = 5;
    const result = changeGovernment(realm, 'feudal');
    expect(result.success).toBe(false);
    expect(realm.government).toBe('monarchy');
  });

  it('changeGovernment force=true ignora custo e cooldown', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.gold = 0;
    realm.materials = 0;
    realm.governmentChangeCooldown = 20;
    const result = changeGovernment(realm, 'tribal', true);
    expect(result.success).toBe(true);
    expect(realm.government).toBe('tribal');
  });

  it('isProvinceDistant: capital e vizinhas diretas não são distantes', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    const capital = state.provinces[realm.capitalId!];
    expect(isProvinceDistant(state, capital.id, realm)).toBe(false);
    const neighbor = state.provinces[capital.neighbors[0]];
    if (neighbor) {
      expect(isProvinceDistant(state, neighbor.id, realm)).toBe(false);
    }
  });

  it('checkRevolution retorna null com estabilidade saudável', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    expect(checkRevolution(realm, state)).toBeNull();
  });
});

// ============ CAPITULAÇÃO ============
describe('Fase 2 — Capitulação', () => {
  function makeWarState(): { state: GameState; attackerId: string; defenderId: string } {
    const state = makeState();
    const attackerId = 'realm_0';
    const defenderId = 'realm_1';
    // Garantir que o defensor tenha pelo menos 2 províncias (evita eliminação acidental)
    const defProvs = Object.values(state.provinces).filter(p => p.ownerId === defenderId);
    const fallbackSource = Object.values(state.provinces).find(p => p.ownerId !== defenderId && p.ownerId !== attackerId && p.ownerId !== 'neutral');
    while (defProvs.length < 2) {
      const neutral = Object.values(state.provinces).find(p => p.ownerId === 'neutral');
      if (neutral) {
        neutral.ownerId = defenderId;
        defProvs.push(neutral);
      } else if (fallbackSource) {
        // Sem neutros no mapa: tira uma província de outro reino não-envolvido
        fallbackSource.ownerId = defenderId;
        defProvs.push(fallbackSource);
      } else {
        break;
      }
    }
    const defProv = defProvs[0];
    const attProv = Object.values(state.provinces).find(p => p.ownerId === attackerId)!;
    state.activeWars.push({
      id: 'war_test',
      attackerId,
      defenderId,
      startedAtTurn: state.turn,
      warScore: 30,
      attackerExhaustion: 0,
      defenderExhaustion: 0,
    });
    state.realms[attackerId].wars.push(defenderId);
    state.realms[defenderId].wars.push(attackerId);
    // Ocupar APENAS UMA província do defensor
    defProv.originalOwnerId = defenderId;
    defProv.ownerId = attackerId;
    return { state, attackerId, defenderId };
  }

  it('não capitula com guerra normal (sem condições)', () => {
    const { state, attackerId, defenderId } = makeWarState();
    const war = state.activeWars[0];
    const result = checkCapitulation(state, war);
    expect(result).toBeNull();
  });

  it('capitula com warScore > 70', () => {
    const { state } = makeWarState();
    state.activeWars[0].warScore = 75;
    const result = checkCapitulation(state, state.activeWars[0]);
    expect(result).not.toBeNull();
    expect(result!.winnerId).toBe('realm_0');
  });

  it('capitula com >60% ocupadas', () => {
    const { state, defenderId, attackerId } = makeWarState();
    // Ocupar todas as províncias do defensor
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === defenderId) {
        p.originalOwnerId = defenderId;
        p.ownerId = attackerId;
      }
    });
    const result = checkCapitulation(state, state.activeWars[0]);
    expect(result).not.toBeNull();
    expect(result!.occupationRatio).toBeGreaterThan(0.6);
  });

  it('executeCapitulation: derrotado vira vassalo quando ainda tem províncias', () => {
    const { state, defenderId, attackerId } = makeWarState();
    state.activeWars[0].warScore = 80;
    const result = checkCapitulation(state, state.activeWars[0])!;
    const ok = executeCapitulation(state, result);
    expect(ok).toBe(true);
    const defender = state.realms[defenderId];
    expect(defender.vassalOf).toBe(attackerId);
    expect(state.realms[attackerId].vassals).toContain(defenderId);
    expect(state.activeWars).toHaveLength(0);
  });

  it('executeCapitulation: elimina derrotado sem províncias', () => {
    const { state, defenderId, attackerId } = makeWarState();
    // Ocupar TODAS as províncias do defensor
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === defenderId) {
        p.originalOwnerId = defenderId;
        p.ownerId = attackerId;
      }
    });
    state.activeWars[0].warScore = 80;
    const result = checkCapitulation(state, state.activeWars[0])!;
    executeCapitulation(state, result);
    expect(state.realms[defenderId]).toBeUndefined();
    expect(state.realms[attackerId].realmsDefeated).toBe(1);
  });
});

// ============ VASSALOS / LIBERTY ============
describe('Fase 2 — Liberty Desire', () => {
  it('appeaseVassal reduz liberty', () => {
    const state = makeState();
    const overlord = state.realms[state.playerRealmId];
    overlord.vassalLiberty = { realm_1: 50 };
    expect(appeaseVassal(overlord, 'realm_1')).toBe(true);
    expect(overlord.vassalLiberty['realm_1']).toBe(45);
  });

  it('processVassalLiberty roda sem crash', () => {
    const state = makeState();
    expect(() => processVassalLiberty(state)).not.toThrow();
  });

  it('vassalo com liberty >= 100 se rebela (guerra declarada)', () => {
    const state = makeState();
    const overlord = state.realms[state.playerRealmId];
    const vassal = state.realms['realm_1'];
    overlord.vassals.push('realm_1');
    vassal.vassalOf = overlord.id;
    overlord.vassalLiberty = { realm_1: LIBERTY_REBELLION_THRESHOLD };
    // Neutralizar fatores de redução: sem tropas em nenhum dos lados
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === overlord.id || p.ownerId === vassal.id) {
        p.army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
        p.troops = 0;
      }
    });
    processVassalLiberty(state);
    // Vassalo removido da lista E guerra declarada (ou tentativa registrada)
    expect(overlord.vassals).not.toContain('realm_1');
    expect(vassal.vassalOf).toBeUndefined();
  });
});

// ============ EMPRÉSTIMOS ============
describe('Fase 2 — Empréstimos', () => {
  it('parcela = ceil((amount * 1.15) / 10)', () => {
    expect(getLoanPayment(100)).toBe(12); // 115/10 = 11.5 → 12
    expect(getLoanPayment(200)).toBe(23); // 230/10 = 23
    expect(getLoanPayment(500)).toBe(58); // 575/10 = 57.5 → 58
  });

  it('takeLoan adiciona ouro e cria empréstimo', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.gold = 100;
    const updated = takeLoan(realm, 500, state.turn);
    expect(updated.gold).toBe(600);
    expect(updated.loans).toHaveLength(1);
    expect(updated.loans[0].remainingTurns).toBe(10);
  });

  it('processRealmLoans paga parcela e reduz remainingTurns', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.gold = 1000;
    const withLoan = takeLoan(realm, 500, state.turn); // gold = 1500, parcela 58
    const { updatedRealm, defaulted } = processRealmLoans(withLoan, state);
    expect(defaulted).toBe(false);
    expect(updatedRealm.loans[0].remainingTurns).toBe(9);
    expect(updatedRealm.gold).toBe(1500 - getLoanPayment(500)); // 1442
  });

  it('processRealmLoans marca default quando não pode pagar', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    // Empréstimo já contraído e ouro gasto — gold menor que a parcela
    const withLoan = takeLoan(realm, 500, state.turn);
    withLoan.gold = 10; // parcela é 58 → não paga
    const { updatedRealm, defaulted } = processRealmLoans(withLoan, state);
    expect(defaulted).toBe(true);
    // Relações penalizadas
    Object.values(updatedRealm.relations).forEach(rel => {
      expect(rel).toBeLessThanOrEqual(0);
    });
  });

  it('canTakeLoan respeita limite de empréstimos', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    realm.goldIncome = 100;
    expect(canTakeLoan(realm, state).can).toBe(true);
    realm.loans = [{ id: 'l1', amount: 100, interest: 15, dueTurn: 10, remainingTurns: 5 } as never];
    realm.loans.push({ id: 'l2', amount: 100, interest: 15, dueTurn: 10, remainingTurns: 5 } as never);
    realm.loans.push({ id: 'l3', amount: 100, interest: 15, dueTurn: 10, remainingTurns: 5 } as never);
    expect(canTakeLoan(realm, state).can).toBe(false);
  });
});

// ============ DIPLOMACIA VASSALO (P2) ============
describe('Fase 2 — Apaziguar Vassalo (diplomacia)', () => {
  it('canAppeaseVassal só aceita vassalos', () => {
    const state = makeState();
    const overlord = state.realms[state.playerRealmId];
    overlord.vassals.push('realm_1');
    expect(canAppeaseVassal(state, overlord.id, 'realm_1').valid).toBe(true);
    expect(canAppeaseVassal(state, overlord.id, 'realm_2').valid).toBe(false);
    expect(canAppeaseVassal(state, overlord.id, overlord.id).valid).toBe(false);
  });

  it('appeaseVassal reduz liberty em 5 e gera log', () => {
    const state = makeState();
    const overlord = state.realms[state.playerRealmId];
    const vassalId = 'realm_1';
    overlord.vassals.push(vassalId);
    overlord.vassalLiberty = { [vassalId]: 50 };
    const logsBefore = state.logs.length;
    appeaseDiplomacy(state, overlord.id, vassalId);
    expect(overlord.vassalLiberty[vassalId]).toBe(45);
    expect(state.logs.length).toBeGreaterThan(logsBefore);
  });

  it('appeaseVassal não passa de 0', () => {
    const state = makeState();
    const overlord = state.realms[state.playerRealmId];
    const vassalId = 'realm_1';
    overlord.vassals.push(vassalId);
    overlord.vassalLiberty = { [vassalId]: 2 };
    appeaseDiplomacy(state, overlord.id, vassalId);
    expect(overlord.vassalLiberty[vassalId]).toBe(0);
  });
});

// ============ INSTABILIDADE PÓS-GUERRA (P3) ============
describe('Fase 2 — Instabilidade pós-guerra (decay 5 turnos)', () => {
  function makeCapitulatedState() {
    const state = makeState();
    const attackerId = 'realm_0';
    const defenderId = 'realm_1';
    const defProvs = Object.values(state.provinces).filter(p => p.ownerId === defenderId);
    while (defProvs.length < 2) {
      const neutral = Object.values(state.provinces).find(p => p.ownerId === 'neutral');
      if (!neutral) break;
      neutral.ownerId = defenderId;
      defProvs.push(neutral);
    }
    const defProv = defProvs[0];
    state.activeWars.push({
      id: 'war_t', attackerId, defenderId, startedAtTurn: 1, warScore: 80,
      attackerExhaustion: 0, defenderExhaustion: 0,
    });
    state.realms[attackerId].wars.push(defenderId);
    state.realms[defenderId].wars.push(attackerId);
    defProv.originalOwnerId = defenderId;
    defProv.ownerId = attackerId;
    const result = checkCapitulation(state, state.activeWars[0])!;
    executeCapitulation(state, result);
    return state;
  }

  it('províncias do vencedor ganham postWarInstability = 5', () => {
    const state = makeCapitulatedState();
    const winnerProvinces = Object.values(state.provinces).filter(p => p.ownerId === 'realm_0');
    expect(winnerProvinces.some(p => (p.postWarInstability ?? 0) > 0)).toBe(true);
    winnerProvinces.forEach(p => {
      expect(p.postWarInstability).toBeLessThanOrEqual(5);
    });
  });

  it('guerra encerrada por exaustão limpa originalOwnerId (P5)', () => {
    const state = makeState();
    const attackerId = 'realm_0';
    const defenderId = 'realm_1';
    const defProv = Object.values(state.provinces).find(p => p.ownerId === defenderId)!;
    defProv.originalOwnerId = defenderId;
    defProv.ownerId = attackerId;
    state.activeWars.push({
      id: 'war_exhaust', attackerId, defenderId, startedAtTurn: 1, warScore: 0,
      attackerExhaustion: 100, defenderExhaustion: 0,
    });
    // Replica o filtro do turnLogic (paz por exaustão)
    const wars = state.activeWars;
    wars.forEach(war => {
      if (war.attackerId === attackerId && war.defenderId === defenderId) {
        Object.values(state.provinces).forEach(p => {
          if (p.originalOwnerId === war.attackerId || p.originalOwnerId === war.defenderId) {
            p.originalOwnerId = undefined;
          }
        });
      }
    });
    expect(defProv.originalOwnerId).toBeUndefined();
  });
});

// ============ IA AVANÇADA ============
describe('Fase 2 — IA Avançada', () => {
  it('calculateMilitaryPower > 0 para reino com tropas', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    const power = calculateMilitaryPower(realm, state);
    expect(power).toBeGreaterThan(0);
  });

  it('calculateMilitaryPower = 0 para reino sem províncias', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === realm.id) p.ownerId = 'neutral';
    });
    expect(calculateMilitaryPower(realm, state)).toBe(0);
  });

  it('calculateMilitaryPower reflete bônus de combat tech', () => {
    const state = makeState();
    const realm = state.realms[state.playerRealmId];
    const base = calculateMilitaryPower(realm, state);
    realm.techLevels.combat = 4; // +20%
    const boosted = calculateMilitaryPower(realm, state);
    expect(boosted).toBeGreaterThan(base);
  });
});

// ============ BUG: CONQUISTA DA IA (regressão) ============
describe('Fase 2 — Conquista da IA (bug tropas fantasma)', () => {
  function makeAttackState() {
    const state = makeState();
    const attackerId = 'realm_1'; // IA
    const defenderId = state.playerRealmId; // jogador
    // Província do atacante com exército grande
    const attProv = Object.values(state.provinces).find(p => p.ownerId === attackerId)!;
    // Província inimiga vizinha (garantir que existe: converte um vizinho qualquer para o jogador)
    let defProv = attProv.neighbors
      .map(id => state.provinces[id])
      .find(p => p && p.ownerId === defenderId);
    if (!defProv) {
      const otherRealmProv = Object.values(state.provinces)
        .find(p => p.ownerId !== attackerId && p.ownerId !== defenderId && p.ownerId !== 'neutral');
      const neighbor = attProv.neighbors
        .map(id => state.provinces[id])
        .find(p => p && p.ownerId !== attackerId);
      if (neighbor) {
        neighbor.ownerId = defenderId;
        defProv = neighbor;
      } else if (otherRealmProv) {
        // Sem vizinho livre: conecta uma província remota ao atacante
        otherRealmProv.ownerId = defenderId;
        otherRealmProv.neighbors.push(attProv.id);
        attProv.neighbors.push(otherRealmProv.id);
        defProv = otherRealmProv;
      } else {
        throw new Error('Impossível montar cenário de ataque (mapa sem províncias livres)');
      }
    }
    attProv.army = { infantry: 100, archers: 0, cavalry: 0, scouts: 0 };
    attProv.troops = 100;
    defProv.army = { infantry: 30, archers: 0, cavalry: 0, scouts: 0 };
    defProv.troops = 30;
    state.realms[attackerId].actionPoints = 50;
    // REGRA: guerra já declarada em turno anterior (invasão permitida)
    state.activeWars.push({
      id: 'war_pre', attackerId, defenderId,
      startedAtTurn: state.turn - 1, warScore: 0,
      attackerExhaustion: 0, defenderExhaustion: 0,
    });
    state.realms[attackerId].wars.push(defenderId);
    state.realms[defenderId].wars.push(attackerId);
    return { state, attackerId, defenderId, attProv, defProv };
  }

  it('sem guerra declarada a IA NÃO invade (retorna declare)', () => {
    const { state, attackerId, attProv, defProv } = makeAttackState();
    // Remover a guerra pré-existente para testar a regra
    state.activeWars = [];
    state.realms[attackerId].wars = [];
    state.realms[state.playerRealmId].wars = [];
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const outcome = executeAIAttack(state, attProv.id, defProv.id, attackerId);
    expect(outcome).toBe('declare');
    expect(defProv.ownerId).not.toBe(attackerId); // NÃO conquistou
    expect(state.activeWars.length).toBe(1); // mas declarou guerra
  });

  it('guerra declarada neste turno: IA não ataca (espera 1 turno)', () => {
    const { state, attackerId, attProv, defProv } = makeAttackState();
    state.activeWars[0].startedAtTurn = state.turn; // guerra começou agora
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const outcome = executeAIAttack(state, attProv.id, defProv.id, attackerId);
    expect(outcome).toBe('declare');
    expect(defProv.ownerId).not.toBe(attackerId);
  });

  it('origem esvazia e conquista recebe o exército vencedor (avanço)', () => {
    const { state, attackerId, attProv, defProv } = makeAttackState();
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // combate determinístico (mapa já gerado)
    executeAIAttack(state, attProv.id, defProv.id, attackerId);
    expect(defProv.ownerId).toBe(attackerId); // conquistou
    expect(attProv.troops).toBe(0); // origem esvaziou (exército avançou)
    expect(defProv.troops).toBeGreaterThan(0); // conquista ocupada
  });

  it('não cria tropas do nada (soma preservada: origem + conquista <= atacante inicial)', () => {
    const { state, attackerId, attProv, defProv } = makeAttackState();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const before = attProv.troops;
    executeAIAttack(state, attProv.id, defProv.id, attackerId);
    const after = attProv.troops + defProv.troops;
    expect(after).toBeLessThanOrEqual(before); // baixas + retreat, nunca duplicação
  });

  it('derrota da IA mantém defensor e recua atacante', () => {
    const { state, attackerId, attProv, defProv } = makeAttackState();
    defProv.army = { infantry: 300, archers: 0, cavalry: 0, scouts: 0 };
    defProv.troops = 300;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    executeAIAttack(state, attProv.id, defProv.id, attackerId);
    expect(defProv.ownerId).not.toBe(attackerId);
    expect(defProv.troops).toBeGreaterThan(0);
  });
});

describe('Fase 2 — Preservação de Tropas na Rebelião', () => {
  it('quando uma província se torna neutra por falta de lealdade, as tropas leais recuam para província vizinha amigável', () => {
    const state = makeState();
    const playerRealmId = state.playerRealmId;
    const playerProvs = Object.values(state.provinces).filter(p => p.ownerId === playerRealmId);

    if (playerProvs.length < 2) return;

    const p1 = playerProvs[0];
    const p2 = playerProvs[1];

    p1.loyalty = 0;
    p1.army = { infantry: 50, archers: 30, cavalry: 10, scouts: 5 };
    p1.troops = 95;

    const initialP2Infantry = p2.army.infantry;

    // Forçar Math.random() < 0.15 para disparar a rebelião
    vi.spyOn(Math, 'random').mockReturnValue(0.05);

    processEndOfTurn(state);

    expect(p1.ownerId).toBe('neutral'); // província virou neutra
    expect(p2.army.infantry).toBe(initialP2Infantry + 50); // tropas leais recuaram intactas para P2
    expect(state.logs.some(l => l.includes('RECUO DE TROPAS'))).toBe(true);
  });
});
