import { GameState, GovernmentType, TechCategory } from '../types';

export const SCHEMA_VERSION = 2;

const TECH_LEVELS_DEFAULT: Record<TechCategory, number> = { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };

/**
 * Migra um save antigo (schemaVersion < 2) para o schema atual.
 * Aplica defaults a TODOS os campos novos da Fase 2.
 * É idempotente: saves já na versão 2 passam intactos.
 */
export function migrateSaveGame(data: unknown): GameState {
  if (!data || typeof data !== 'object') {
    throw new Error('Save inválido: dados não são um objeto.');
  }

  const state = data as GameState;

  if (!state.schemaVersion || state.schemaVersion < 2) {
    // Migrar realms (Fase 2 — tecnologia, governos, vassalos, estatísticas)
    Object.values(state.realms || {}).forEach(realm => {
      realm.techLevels = realm.techLevels ?? { ...TECH_LEVELS_DEFAULT };
      realm.government = (realm.government as GovernmentType) ?? 'monarchy';
      realm.governmentChangeCooldown = realm.governmentChangeCooldown ?? 0;
      realm.vassalLiberty = realm.vassalLiberty ?? {};
      realm.battlesWon = realm.battlesWon ?? 0;
      realm.realmsDefeated = realm.realmsDefeated ?? 0;
      realm.cumulativeGold = realm.cumulativeGold ?? 0;
      if (realm.maxProvincesHeld === undefined) {
        realm.maxProvincesHeld = Object.values(state.provinces || {}).filter(p => p.ownerId === realm.id).length;
      }
    });

    // Migrar províncias (Fase 2 — originalOwnerId para capitulação)
    Object.values(state.provinces || {}).forEach(prov => {
      prov.originalOwnerId = prov.originalOwnerId ?? undefined;
    });

    state.schemaVersion = 2;
  }

  return state;
}
