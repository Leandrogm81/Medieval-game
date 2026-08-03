import { GameState, Realm } from '../types';
import { declareWar } from './diplomacyLogic';

/**
 * Fase 2 — Liberty Desire dos Vassalos (PRD-FASE-2 §9)
 * Fatores que aumentam: +2 base, +5 overlord em guerra, +10 overextension >80,
 *   +3 vassalo maior que overlord
 * Fatores que diminuem: -5 apaziguar, -3 overlord mais forte, -2 pacto defensivo
 * Rebelião: >=100 → vassalo declara independência (guerra via declareWar canônica)
 */

export const LIBERTY_BASE = 2;
export const LIBERTY_OVERLORD_WAR = 5;
export const LIBERTY_OVEREXTENSION = 10;
export const LIBERTY_VASSAL_LARGER = 3;
export const LIBERTY_APPEASE = -5;
export const LIBERTY_OVERLORD_STRONGER = -3;
export const LIBERTY_DEFENSIVE_PACT = -2;
export const LIBERTY_REBELLION_THRESHOLD = 100;
export const LIBERTY_WARNING_THRESHOLD = 70;

/**
 * Processa o liberty desire de todos os vassalos no fim do turno.
 * NOTA: state já é um deep clone (chamado dentro de processEndOfTurn).
 */
export function processVassalLiberty(state: GameState): void {
  Object.values(state.realms).forEach(overlord => {
    if (!overlord.vassals || overlord.vassals.length === 0) return;

    overlord.vassals.forEach(vassalId => {
      const vassal = state.realms[vassalId];
      if (!vassal) return;

      // Inicializar liberty se não existir
      if (!overlord.vassalLiberty) overlord.vassalLiberty = {};
      if (overlord.vassalLiberty[vassalId] === undefined) {
        overlord.vassalLiberty[vassalId] = 0;
      }

      let delta = LIBERTY_BASE;

      const overlordAtWar = state.activeWars.some(
        w => w.attackerId === overlord.id || w.defenderId === overlord.id
      );
      if (overlordAtWar) delta += LIBERTY_OVERLORD_WAR;
      if ((overlord.overextension || 0) > 80) delta += LIBERTY_OVEREXTENSION;

      const vassalProvinces = Object.values(state.provinces).filter(p => p.ownerId === vassalId).length;
      const overlordProvinces = Object.values(state.provinces).filter(p => p.ownerId === overlord.id).length;
      if (vassalProvinces > overlordProvinces) delta += LIBERTY_VASSAL_LARGER;

      // Fatores que diminuem
      const overlordPower = countTroops(state, overlord.id);
      const vassalPower = countTroops(state, vassalId);
      if (overlordPower > vassalPower) delta += LIBERTY_OVERLORD_STRONGER;

      if (vassal.defensivePacts?.includes(overlord.id)) delta += LIBERTY_DEFENSIVE_PACT;

      overlord.vassalLiberty[vassalId] = Math.max(0, Math.min(100, overlord.vassalLiberty[vassalId] + delta));

      if (overlord.vassalLiberty[vassalId] >= LIBERTY_REBELLION_THRESHOLD) {
        // Rebelião! declareWar canônica (vassalo ataca o overlord)
        vassal.vassalOf = undefined;
        overlord.vassals = overlord.vassals.filter(v => v !== vassalId);
        delete overlord.vassalLiberty[vassalId];

        const warResult = declareWar(state, vassalId, overlord.id);
        // callsToResolve não usados (independência unilateral)
        if (warResult.newState.activeWars.some(w => w.attackerId === vassalId && w.defenderId === overlord.id)) {
          state.logs.push(`REBELIÃO: ${vassal.name} declarou independência de ${overlord.name}!`);
        } else {
          state.logs.push(`REBELIÃO: ${vassal.name} tenta declarar independência de ${overlord.name}!`);
        }
      } else if (overlord.vassalLiberty[vassalId] >= LIBERTY_WARNING_THRESHOLD && overlord.isPlayer) {
        state.logs.push(
          `⚠️ ${vassal.name} está inquieto sob seu domínio (Liberty: ${overlord.vassalLiberty[vassalId]}%).`
        );
      }
    });
  });
}

function countTroops(state: GameState, realmId: string): number {
  let total = 0;
  Object.values(state.provinces).forEach(p => {
    if (p.ownerId === realmId) {
      total += (p.army?.infantry || 0) + (p.army?.archers || 0) + (p.army?.cavalry || 0) + (p.army?.scouts || 0);
    }
  });
  return total;
}

/**
 * Ação diplomática "Apaziguar Vassalo": reduz liberty em 5.
 */
export function appeaseVassal(overlord: Realm, vassalId: string): boolean {
  if (!overlord.vassalLiberty || overlord.vassalLiberty[vassalId] === undefined) return false;
  overlord.vassalLiberty[vassalId] = Math.max(0, overlord.vassalLiberty[vassalId] + LIBERTY_APPEASE);
  return true;
}
