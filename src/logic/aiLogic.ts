import { GameState, Realm, Province } from '../types';
import { executeRecruitment, executeBuilding } from './economyLogic';
import { resolveCombat } from './combatLogic';
import { ACTION_COSTS } from './game-constants';
import { canUnlockTech, unlockTech } from './techLogic';
import { GOVERNMENT_STATS } from './governmentLogic';
import { canTakeLoan, takeLoan, getMaxLoanAmount } from './financeLogic';
import { TECH_TREE } from './game-constants';
import { declareWar } from './diplomacyLogic';

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
  const attackerGov = GOVERNMENT_STATS[realm.government || 'monarchy'];
  const attackerTechBonus = (realm.techLevels?.combat ?? 0) * 0.05 + (attackerGov.attack - 1);
  const defenderRealm = state.realms[defenderProv.ownerId];
  const defenderGov = defenderRealm ? GOVERNMENT_STATS[defenderRealm.government || 'monarchy'] : null;
  const defenderTechBonus = defenderRealm ? ((defenderRealm.techLevels?.combat ?? 0) * 0.05) + (defenderGov ? defenderGov.defense - 1 : 0) : 0;

  const result = resolveCombat(
    attackerProv.army, 
    defenderProv.army, 
    defenderProv.terrain, 
    defenderProv.defense,
    state,
    defenderProv.id,
    attackerTechBonus,
    defenderTechBonus
  );

  // Apply results
  attackerProv.army = result.attackerRemaining;
  attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry + attackerProv.army.scouts;

  defenderProv.army = result.defenderRemaining;
  defenderProv.troops = defenderProv.army.infantry + defenderProv.army.archers + defenderProv.army.cavalry + defenderProv.army.scouts;

  if (result.won) {
    if (defenderProv.ownerId !== 'neutral') defenderProv.originalOwnerId = defenderProv.ownerId;
    defenderProv.ownerId = realmId;
    defenderProv.recentlyConquered = 3;
    realm.overextension += 10;
    state.logs.push(`${realm.name} conquistou ${defenderProv.name} de ${defenderRealm?.name || 'um reino'}.`);
  } else {
    state.logs.push(`${realm.name} falhou em conquistar ${defenderProv.name}.`);
  }

  return true;
}

/**
 * Fase 2 — Poder militar: soma bruta de tropas × bônus de combat tech × governo.
 */
export function calculateMilitaryPower(realm: Realm, state: GameState): number {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);

  let totalTroops = 0;
  for (const prov of ownedProvinces) {
    totalTroops += (prov.army?.infantry || 0)
      + (prov.army?.archers || 0)
      + (prov.army?.cavalry || 0)
      + (prov.army?.scouts || 0);
  }

  totalTroops *= (1 + (realm.techLevels?.combat ?? 0) * 0.05);
  const govStats = GOVERNMENT_STATS[realm.government || 'monarchy'];
  totalTroops *= govStats.attack;

  return Math.round(totalTroops);
}

/**
 * Fase 2 — Decisão de ataque por personalidade.
 */
function shouldAIAttack(
  realm: Realm,
  target: Realm,
  prov: Province,
  targetProv: Province,
  state: GameState
): boolean {
  const myPower = calculateMilitaryPower(realm, state);
  const targetPower = calculateMilitaryPower(target, state);
  const powerRatio = targetPower > 0 ? myPower / targetPower : Infinity;

  const aggression = state.settings?.aiAggression ?? 50;
  const aggressionFactor = 1 - (aggression - 50) / 100; // 100 = 0.5x threshold

  const localTroops = (prov.army?.infantry || 0) + (prov.army?.archers || 0) + (prov.army?.cavalry || 0) + (prov.army?.scouts || 0);
  const targetLocalTroops = (targetProv.army?.infantry || 0) + (targetProv.army?.archers || 0) + (targetProv.army?.cavalry || 0) + (targetProv.army?.scouts || 0);

  switch (realm.personality) {
    case 'expansionist':
      return powerRatio > 1.5 * aggressionFactor;
    case 'opportunistic':
      return powerRatio > 1.0 * aggressionFactor && (target.wars.length > 0 || targetLocalTroops < 20);
    case 'defensive':
      return false; // nunca inicia guerra
    case 'diplomatic':
      return powerRatio > 3.0 * aggressionFactor;
    case 'commercial':
      return powerRatio > 2.5 * aggressionFactor && localTroops > 50;
    default:
      return powerRatio > 1.5 * aggressionFactor;
  }
}

/**
 * Fase 2 — Diplomacia da IA por personalidade.
 */
function processAIDiplomacy(state: GameState, realm: Realm): void {
  if (realm.isPlayer || realm.id === 'neutral') return;

  const neighbors = new Set<string>();
  Object.values(state.provinces).forEach(p => {
    if (p.ownerId === realm.id) {
      p.neighbors.forEach(nId => {
        const nProv = state.provinces[nId];
        if (nProv && nProv.ownerId !== realm.id && nProv.ownerId !== 'neutral') {
          neighbors.add(nProv.ownerId);
        }
      });
    }
  });

  if (realm.personality === 'diplomatic' && realm.actionPoints >= 2) {
    // Busca alianças com vizinhos de relações positivas
    for (const nId of neighbors) {
      if ((realm.relations[nId] || 0) > 30 && Math.random() < 0.1) {
        if (!realm.alliances.includes(nId) && !realm.wars.includes(nId)) {
          realm.alliances.push(nId);
          if (state.realms[nId] && !state.realms[nId].alliances.includes(realm.id)) {
            state.realms[nId].alliances.push(realm.id);
          }
          state.logs.push(`🤝 ${realm.name} firmou aliança com ${state.realms[nId]?.name || nId}.`);
          realm.actionPoints -= 2;
        }
        break;
      }
    }
  }

  if (realm.personality === 'expansionist' && realm.actionPoints >= 2) {
    // Insulta vizinhos para provocar guerra
    for (const nId of neighbors) {
      if ((realm.relations[nId] || 0) > -20 && Math.random() < 0.08) {
        realm.relations[nId] = Math.max(-100, (realm.relations[nId] || 0) - 15);
        if (state.realms[nId]) state.realms[nId].relations[realm.id] = realm.relations[nId];
        state.logs.push(`💢 ${realm.name} insultou ${state.realms[nId]?.name || nId}.`);
        realm.actionPoints -= 2;
        break;
      }
    }
  }
}

/**
 * Fase 2 — Empréstimos da IA.
 */
function processAILoans(state: GameState, realm: Realm): void {
  if (realm.isPlayer || realm.id === 'neutral') return;
  const inWar = (state.activeWars || []).some(w => w.attackerId === realm.id || w.defenderId === realm.id);
  const needsRecruit = realm.gold < 100;

  if ((inWar && realm.gold < 0) || needsRecruit) {
    const validation = canTakeLoan(realm, state);
    if (validation.can && Math.random() < 0.3) {
      const maxAmount = getMaxLoanAmount(realm, state);
      const amount = Math.min(maxAmount, 500);
      if (amount >= 100) {
        const updated = takeLoan(realm, amount, state.turn);
        Object.assign(realm, updated);
        state.logs.push(`💰 ${realm.name} contraiu um empréstimo de ${amount} ouro.`);
      }
    }
  }
}

export function processAI(state: GameState) {
  Object.values(state.realms).forEach(realm => {
    if (realm.isPlayer) return;

    const provinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
    if (provinces.length === 0) return;

    // Diplomacia por personalidade
    processAIDiplomacy(state, realm);

    // Empréstimos
    processAILoans(state, realm);

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

      // Attack enemy provinces based on personality and military power
      if (prov.troops > 25 && realm.actionPoints >= ACTION_COSTS.attack) {
        const neighbors = prov.neighbors
          .map(id => state.provinces[id])
          .filter(p => p && p.ownerId !== realm.id && p.ownerId !== 'neutral');
        for (const target of neighbors) {
          const targetRealm = state.realms[target.ownerId];
          if (targetRealm && shouldAIAttack(realm, targetRealm, prov, target, state)) {
            executeAIAttack(state, prov.id, target.id, realm.id);
            realm.actionPoints -= ACTION_COSTS.attack;
            break;
          }
        }
      }
      // Decisão de Tecnologia
      if (realm.techPoints >= 50 && Math.random() < 0.2) {
        for (const category in TECH_TREE) {
          const tech = TECH_TREE[category].find((t: { id: string }) => canUnlockTech(realm, t.id).can);
          if (tech) {
            const updatedRealm = unlockTech(realm, tech.id);
            Object.assign(realm, updatedRealm);
            break;
          }
        }
      }

      // Decisão de Finanças (fallback antigo removido — processAILoans cobre)
    });
  });
}
