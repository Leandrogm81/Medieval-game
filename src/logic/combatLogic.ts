import { Army, GameState, Terrain, BattleResult } from '../types';
import { UNIT_STATS } from './game-constants';
import { playBattleSound } from './sfxLogic';

export function getRetreatDestination(
  state: GameState,
  defeatedProvinceId: string,
  realmId: string
): string | null {
  const defeatedProvince = state.provinces[defeatedProvinceId];
  if (!defeatedProvince) return null;

  const candidates = (defeatedProvince.neighbors || [])
    .map(neighborId => state.provinces[neighborId])
    .filter((province): province is NonNullable<typeof province> => !!province && province.ownerId === realmId);

  if (candidates.length === 0) return null;

  return candidates.reduce((best, current) => {
    if (current.troops > best.troops) return current;
    return best;
  }).id;
}

export function calculateRetreat(remainingArmy: Army, retreatRatio = 0.3): Army {
  const total = (remainingArmy.infantry || 0) + (remainingArmy.archers || 0) + (remainingArmy.cavalry || 0) + (remainingArmy.scouts || 0);
  if (total <= 0) {
    return { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
  }

  const calculateUnit = (count: number): number => {
    if (count <= 0) return 0;
    const retreated = Math.floor(count * retreatRatio);
    return retreated > 0 ? retreated : 1;
  };

  return {
    infantry: calculateUnit(remainingArmy.infantry || 0),
    archers: calculateUnit(remainingArmy.archers || 0),
    cavalry: calculateUnit(remainingArmy.cavalry || 0),
    scouts: calculateUnit(remainingArmy.scouts || 0),
  };
}

export function resolveCombat(
  attacker: Army,
  defender: Army,
  terrain: Terrain,
  defenseLevel: number,
  state?: GameState,
  provinceId?: string
): BattleResult {
  playBattleSound();

  const atkPower =
    attacker.infantry * UNIT_STATS.infantry.attack +
    attacker.archers * UNIT_STATS.archers.attack +
    attacker.cavalry * UNIT_STATS.cavalry.attack;

  let defPower =
    defender.infantry * UNIT_STATS.infantry.defense +
    defender.archers * UNIT_STATS.archers.defense +
    defender.cavalry * UNIT_STATS.cavalry.defense;

  if (terrain === 'mountain') defPower *= 1.5;
  if (terrain === 'forest') defPower *= 1.25;

  defPower *= 1 + defenseLevel * 0.2;

  const finalAtk = atkPower * (0.9 + Math.random() * 0.2);
  const finalDef = defPower * (0.9 + Math.random() * 0.2);
  const won = finalAtk > finalDef;

  const winnerLossRatio = won ? (finalDef / Math.max(finalAtk, 1)) * 0.5 : 0.8;
  const loserLossRatio = won ? 0.8 : (finalAtk / Math.max(finalDef, 1)) * 0.5;

  const attackerRemaining: Army = {
    infantry: Math.max(0, Math.floor(attacker.infantry * (1 - winnerLossRatio * (won ? 0.4 : 0.8)))),
    archers: Math.max(0, Math.floor(attacker.archers * (1 - winnerLossRatio * (won ? 0.3 : 0.7)))),
    cavalry: Math.max(0, Math.floor(attacker.cavalry * (1 - winnerLossRatio * (won ? 0.5 : 0.9)))),
    scouts: attacker.scouts || 0,
  };

  const defenderRemaining: Army = {
    infantry: Math.max(0, Math.floor(defender.infantry * (1 - loserLossRatio * (won ? 0.8 : 0.4)))),
    archers: Math.max(0, Math.floor(defender.archers * (1 - loserLossRatio * (won ? 0.7 : 0.3)))),
    cavalry: Math.max(0, Math.floor(defender.cavalry * (1 - loserLossRatio * (won ? 0.9 : 0.5)))),
    scouts: defender.scouts || 0,
  };

  const result = {
    won,
    attackerRemaining,
    defenderRemaining,
    attackerLosses: {
      infantry: attacker.infantry - attackerRemaining.infantry,
      archers: attacker.archers - attackerRemaining.archers,
      cavalry: attacker.cavalry - attackerRemaining.cavalry,
      scouts: 0,
    },
    defenderLosses: {
      infantry: defender.infantry - defenderRemaining.infantry,
      archers: defender.archers - defenderRemaining.archers,
      cavalry: defender.cavalry - defenderRemaining.cavalry,
      scouts: 0,
    },
  };

  if (state && provinceId) {
    state.visualEffects = state.visualEffects || [];
    state.visualEffects.push({
      id: `battle_fx_${Date.now()}_${Math.random()}`,
      type: 'battle_particles',
      provinceId,
      particleCount: 10,
      startTime: Date.now(),
      duration: 800
    });
  }

  return result;
}
