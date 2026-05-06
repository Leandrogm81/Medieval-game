import { GameState } from '../types';
import { executeRecruitment, executeBuilding } from './economyLogic';
import { resolveCombat } from './combatLogic';
import { ACTION_COSTS } from './game-constants';

function declareWar(state: GameState, attackerId: string, defenderId: string) {
  const attacker = state.realms[attackerId];
  const defender = state.realms[defenderId];
  if (!attacker || !defender) return;

  if (!attacker.wars.includes(defenderId)) {
    attacker.wars.push(defenderId);
    defender.wars.push(attackerId);
    state.activeWars.push({
      id: `war_${attackerId}_${defenderId}_${state.turn}`,
      attackerId,
      defenderId,
      startedAtTurn: state.turn,
      warScore: 0,
      attackerExhaustion: 0,
      defenderExhaustion: 0,
    });
    if (attacker.isPlayer) {
      state.logs.push(`Você declarou guerra contra ${defender.name}!`);
    } else if (defender.isPlayer) {
      state.logs.push(`${attacker.name} declarou guerra contra você!`);
    } else {
      state.logs.push(`${attacker.name} declarou guerra contra ${defender.name}!`);
    }
  }
}

function executeAIAttack(
  state: GameState,
  attackerProvId: string,
  defenderProvId: string,
  realmId: string,
): boolean {
  const attackerProv = state.provinces[attackerProvId];
  const defenderProv = state.provinces[defenderProvId];
  const realm = state.realms[realmId];
  if (!attackerProv || !defenderProv || !realm) return false;
  if (realm.actionPoints < ACTION_COSTS.attack) return false;

  // Declare war if not already at war
  if (!realm.wars.includes(defenderProv.ownerId)) {
    declareWar(state, realmId, defenderProv.ownerId);
  }

  // Use the troops in the province as the attacking army
  const attackingArmy = { ...attackerProv.army, scouts: 0 };
  const result = resolveCombat(attackingArmy, defenderProv.army, defenderProv.terrain, defenderProv.defense);

  // Apply results
  attackerProv.army = result.attackerRemaining;
  attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry + attackerProv.army.scouts;

  defenderProv.army = result.defenderRemaining;
  defenderProv.troops = defenderProv.army.infantry + defenderProv.army.archers + defenderProv.army.cavalry + defenderProv.army.scouts;

  realm.actionPoints -= ACTION_COSTS.attack;

  const attackerName = realm.name;
  const defenderName = state.realms[defenderProv.ownerId]?.name || 'Neutral';

  if (result.won) {
    const oldOwner = state.realms[defenderProv.ownerId];
    defenderProv.ownerId = realmId;
    defenderProv.loyalty = 40;
    defenderProv.recentlyConquered = 3;
    realm.overextension += 10;
    state.logs.push(`${attackerName} conquistou ${defenderProv.name} de ${defenderName}!`);
  } else {
    state.logs.push(`${attackerName} falhou em conquistar ${defenderProv.name} de ${defenderName}.`);
  }

  return true;
}

export function processAI(state: GameState) {
  Object.values(state.realms).forEach(realm => {
    if (realm.isPlayer) return;

    const provinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
    if (provinces.length === 0) return;

    // Shuffle provinces to avoid bias towards low-index provinces
    const shuffled = [...provinces].sort(() => Math.random() - 0.5);

    shuffled.forEach(prov => {
      if (realm.actionPoints <= 0) return;

      if (Math.random() < 0.3) {
        const buildingTypes: ('farms' | 'mines' | 'workshops' | 'courts')[] = ['farms', 'mines', 'workshops', 'courts'];
        const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
        if (executeBuilding(state, realm, prov, type)) {
          realm.actionPoints -= ACTION_COSTS.build;
        }
      }

      if (Math.random() < 0.4 && realm.actionPoints > 0) {
        if (executeRecruitment(state, realm, prov)) {
          realm.actionPoints -= ACTION_COSTS.recruit;
        }
      }

      // Attack enemy provinces if we have sufficient troops and AP
      if (prov.troops > 25 && realm.actionPoints >= ACTION_COSTS.attack) {
        const neighbors = prov.neighbors
          .map(id => state.provinces[id])
          .filter(p => p && p.ownerId !== realm.id && p.ownerId !== 'neutral');
        if (neighbors.length > 0) {
          const target = neighbors[Math.floor(Math.random() * neighbors.length)];
          executeAIAttack(state, prov.id, target.id, realm.id);
        }
      }
    });
  });
}
