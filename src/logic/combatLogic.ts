import { Army, Terrain, BattleResult } from '../types';
import { UNIT_STATS } from './game-constants';

export function resolveCombat(attacker: Army, defender: Army, terrain: Terrain, defenseLevel: number): BattleResult {
  const atkPower = attacker.infantry * UNIT_STATS.infantry.attack + 
                   attacker.archers * UNIT_STATS.archers.attack + 
                   attacker.cavalry * UNIT_STATS.cavalry.attack;
  
  let defPower = defender.infantry * UNIT_STATS.infantry.defense + 
                   defender.archers * UNIT_STATS.archers.defense + 
                   defender.cavalry * UNIT_STATS.cavalry.defense;

  // Defenders bonuses
  if (terrain === 'mountain') defPower *= 1.5;
  if (terrain === 'forest') defPower *= 1.25;
  
  // Building defense bonus (+20% per level)
  defPower *= (1 + (defenseLevel * 0.2));

  // Random factor (+/- 10%)
  const rngAtk = 0.9 + Math.random() * 0.2;
  const rngDef = 0.9 + Math.random() * 0.2;
  
  const finalAtk = atkPower * rngAtk;
  const finalDef = defPower * rngDef;

  const won = finalAtk > finalDef;
  
  // Calculate losses
  const lossRate = 0.4; // Base loss rate
  const winnerLossRatio = won ? (finalDef / finalAtk) * 0.5 : 0.8;
  const loserLossRatio = won ? 0.8 : (finalAtk / finalDef) * 0.5;

  const attackerRemaining: Army = {
    infantry: Math.max(0, Math.floor(attacker.infantry * (1 - winnerLossRatio * (won ? 0.4 : 0.8)))),
    archers: Math.max(0, Math.floor(attacker.archers * (1 - winnerLossRatio * (won ? 0.3 : 0.7)))),
    cavalry: Math.max(0, Math.floor(attacker.cavalry * (1 - winnerLossRatio * (won ? 0.5 : 0.9)))),
    scouts: attacker.scouts || 0
  };

  const defenderRemaining: Army = {
    infantry: Math.max(0, Math.floor(defender.infantry * (1 - loserLossRatio * (won ? 0.8 : 0.4)))),
    archers: Math.max(0, Math.floor(defender.archers * (1 - loserLossRatio * (won ? 0.7 : 0.3)))),
    cavalry: Math.max(0, Math.floor(defender.cavalry * (1 - loserLossRatio * (won ? 0.9 : 0.5)))),
    scouts: defender.scouts || 0
  };

  return {
    won,
    attackerRemaining,
    defenderRemaining,
    attackerLosses: {
      infantry: attacker.infantry - attackerRemaining.infantry,
      archers: attacker.archers - attackerRemaining.archers,
      cavalry: attacker.cavalry - attackerRemaining.cavalry,
      scouts: 0
    },
    defenderLosses: {
      infantry: defender.infantry - defenderRemaining.infantry,
      archers: defender.archers - defenderRemaining.archers,
      cavalry: defender.cavalry - defenderRemaining.cavalry,
      scouts: 0
    }
  };
}
