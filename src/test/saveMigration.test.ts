import { describe, it, expect } from 'vitest';
import { migrateSaveGame, SCHEMA_VERSION } from '../logic/saveMigration';
import { makeState } from './helpers';
import { GameState } from '../types';

// Simula um save da Fase 1 (sem schemaVersion e sem campos novos)
function makeLegacySave(): GameState {
  const state = makeState();
  const legacy = JSON.parse(JSON.stringify(state)) as GameState & { schemaVersion?: number };
  delete (legacy as unknown as Record<string, unknown>).schemaVersion;
  // Remover campos da Fase 2 para simular save antigo
  Object.values(legacy.realms).forEach((realm: any) => {
    delete realm.techLevels;
    delete realm.government;
    delete realm.governmentChangeCooldown;
    delete realm.vassalLiberty;
    delete realm.battlesWon;
    delete realm.realmsDefeated;
    delete realm.cumulativeGold;
    delete realm.maxProvincesHeld;
  });
  Object.values(legacy.provinces).forEach((prov: any) => {
    delete prov.originalOwnerId;
  });
  return legacy as GameState;
}

describe('saveMigration — v1 → v2', () => {
  it('migra save da Fase 1 aplicando defaults em todos os campos novos', () => {
    const legacy = makeLegacySave();
    const migrated = migrateSaveGame(legacy);

    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);

    Object.values(migrated.realms).forEach(realm => {
      expect(realm.techLevels).toEqual({ movement: 0, assimilation: 0, recruitment: 0, combat: 0 });
      expect(realm.government).toBe('monarchy');
      expect(realm.governmentChangeCooldown).toBe(0);
      expect(realm.vassalLiberty).toEqual({});
      expect(realm.battlesWon).toBe(0);
      expect(realm.realmsDefeated).toBe(0);
      expect(realm.cumulativeGold).toBe(0);
      expect(realm.maxProvincesHeld).toBeGreaterThanOrEqual(0);
    });

    Object.values(migrated.provinces).forEach(prov => {
      expect(prov.originalOwnerId).toBeUndefined();
    });
  });

  it('é idempotente — save já migrado passa intacto', () => {
    const state = makeState(); // schemaVersion 2 nativo
    const snapshot = JSON.parse(JSON.stringify(state));
    const migrated = migrateSaveGame(state);
    expect(migrated.schemaVersion).toBe(2);
    // Campos mantidos
    expect(migrated.realms['realm_0'].techLevels).toEqual({ movement: 0, assimilation: 0, recruitment: 0, combat: 0 });
    expect(JSON.stringify(migrated)).toBe(JSON.stringify(snapshot));
  });

  it('rejeita dados inválidos (não-objeto)', () => {
    expect(() => migrateSaveGame(null)).toThrow('Save inválido');
    expect(() => migrateSaveGame('string')).toThrow('Save inválido');
  });

  it('maxProvincesHeld é inicializado com a contagem atual de províncias', () => {
    const legacy = makeLegacySave();
    const realm0Provs = Object.values(legacy.provinces).filter(p => p.ownerId === 'realm_0').length;
    const migrated = migrateSaveGame(legacy);
    expect(migrated.realms['realm_0'].maxProvincesHeld).toBe(realm0Provs);
  });
});
