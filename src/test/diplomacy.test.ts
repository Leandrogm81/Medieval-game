import { describe, it, expect, beforeEach } from 'vitest';
import {
  canDeclareWar,
  declareWar,
  isWarBetween,
  canProposeAlliance,
  proposeAlliance,
  canProposeNAP,
  proposeNonAggressionPact,
  improveRelations,
  sendInsult,
  offerTribute,
  getDiplomacyFlavorText,
} from '../logic/diplomacyLogic';
import { makeState } from './helpers';
import { GameState } from '../types';

describe('diplomacyLogic — declareWar (imutabilidade)', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
  });

  it('declareWar NÃO muta o estado original quando recebe um clone', () => {
    // Convenção C-02: o chamador clona antes; declareWar muta o clone
    const original = JSON.parse(JSON.stringify(state));
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const attackerId = 'realm_0';
    const defenderId = 'realm_1';

    const result = declareWar(clone, attackerId, defenderId);
    expect(result.newState).toBe(clone); // mesma referência (convenção real)
    expect(isWarBetween(clone, attackerId, defenderId)).toBe(true);
    // Estado original intacto
    expect(isWarBetween(original, attackerId, defenderId)).toBe(false);
  });

  it('declareWar recusa guerra inválida (mesmo reino)', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const result = declareWar(clone, 'realm_0', 'realm_0');
    expect(isWarBetween(clone, 'realm_0', 'realm_0')).toBe(false);
  });

  it('canDeclareWar valida requisitos', () => {
    const validation = canDeclareWar(state, 'realm_0', 'realm_1');
    expect(validation).toHaveProperty('valid');
    expect(typeof validation.valid).toBe('boolean');
  });
});

describe('diplomacyLogic — pactos e relações', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
  });

  it('proposeAlliance cria aliança quando válido', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const from = 'realm_0';
    const to = 'realm_1';
    if (canProposeAlliance(clone, from, to).valid) {
      proposeAlliance(clone, from, to);
      expect(clone.realms[from].alliances).toContain(to);
    }
  });

  it('proposeNonAggressionPact cria NAP quando válido', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const from = 'realm_0';
    const to = 'realm_1';
    if (canProposeNAP(clone, from, to).valid) {
      proposeNonAggressionPact(clone, from, to);
      expect(clone.realms[from].nonAggressionPacts).toContain(to);
    }
  });

  it('improveRelations aumenta relações', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const before = clone.realms['realm_0'].relations['realm_1'] ?? 0;
    const result = improveRelations(clone, 'realm_0', 'realm_1');
    expect(result.newRelations).toBeGreaterThan(before);
  });

  it('sendInsult diminui relações', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const before = clone.realms['realm_0'].relations['realm_1'] ?? 0;
    const result = sendInsult(clone, 'realm_0', 'realm_1');
    expect(result.newRelations).toBeLessThan(before);
  });

  it('offerTribute transfere gold e melhora relações quando aceito', () => {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const from = clone.realms['realm_0'];
    const to = clone.realms['realm_1'];
    from.gold = 1000;
    // Relações altas garantem aceitação
    from.relations['realm_1'] = 80;
    to.relations['realm_0'] = 80;
    const goldBefore = from.gold;
    const relBefore = from.relations['realm_1'];
    const result = offerTribute(clone, 'realm_0', 'realm_1', 100);
    expect(result.realms['realm_0'].gold).toBeLessThan(goldBefore);
    expect((result.realms['realm_0'].relations['realm_1'] ?? 0)).toBeGreaterThanOrEqual(relBefore);
    expect(result.realms['realm_0'].tributeTo['realm_1']).toBe(100);
    expect(result.realms['realm_1'].tributeFrom['realm_0']).toBe(100);
  });

  it('getDiplomacyFlavorText retorna texto não vazio', () => {
    const text = getDiplomacyFlavorText('declareWar', 'Avalon', 'Eldoria', true);
    expect(text.length).toBeGreaterThan(0);
  });
});
