import { GameState, GovernmentType, TechCategory } from '../types';
import { REALM_COLORS, getUniqueRealmColor } from './game-constants';

export const SCHEMA_VERSION = 2;

const TECH_LEVELS_DEFAULT: Record<TechCategory, number> = { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };

/**
 * REGRA INQUEBRÁVEL: Nenhum reino rival/inimigo pode compartilhar a mesma cor do jogador.
 * Audita todos os reinos e reatribui cores 100% únicas caso haja colisão com a cor do jogador ou duplicação.
 */
export function fixRealmColorCollisions(state: GameState): void {
  if (!state || !state.realms) return;

  const playerRealm = state.realms[state.playerRealmId] || Object.values(state.realms).find(r => r.isPlayer);
  if (!playerRealm) return;

  const playerColor = (playerRealm.color || REALM_COLORS[0]).toLowerCase();
  const usedColors = new Set<string>([playerColor]);
  const totalRealms = Object.keys(state.realms).length;

  let colorIndex = 1;
  Object.values(state.realms).forEach(realm => {
    if (realm.id === playerRealm.id || realm.isPlayer || realm.id === 'neutral') return;

    let realmColor = (realm.color || '').toLowerCase();
    
    // Se o reino tiver a MESMA cor que o jogador OU tiver cor duplicada de outro reino:
    if (!realmColor || realmColor === playerColor || usedColors.has(realmColor)) {
      let newColor = getUniqueRealmColor(colorIndex, totalRealms);
      while (newColor.toLowerCase() === playerColor || usedColors.has(newColor.toLowerCase())) {
        colorIndex++;
        newColor = getUniqueRealmColor(colorIndex, totalRealms + colorIndex + 10);
      }
      realm.color = newColor;
      realmColor = newColor.toLowerCase();
      colorIndex++;
    }
    usedColors.add(realmColor);
  });

  Object.values(state.provinces || {}).forEach(prov => {
    const armyTroops = prov.army ? (prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts) : 0;
    const totalTroops = Math.max(prov.troops || 0, armyTroops);
    if (prov.isWater && totalTroops > 0 && !prov.occupantRealmId) {
      prov.occupantRealmId = state.playerRealmId;
    }
  });
}

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

  // Garantir a Regra Inquebrável de cores em TODOS os saves carregados (antigos ou atuais)
  fixRealmColorCollisions(state);

  return state;
}
