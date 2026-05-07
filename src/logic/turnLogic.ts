import { GameState, Realm, Province, War } from '../types';
import { ACTION_COSTS, UNIT_STATS, BUILDING_PRODUCTION } from './game-constants';
import { handleResourceDeficit, normalizeNaturalAmount } from './economyLogic';
import { calculateRetreat, getRetreatDestination, resolveCombat } from './combatLogic';
import { playConquestSound } from './sfxLogic';
import { declareWar, isWarBetween } from './diplomacyLogic';
import { deepClone } from '../utils/deepClone';

export function calculateVisibility(state: GameState): string[] {
  const visible = new Set<string>();
  const playerProvinces = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
  
  playerProvinces.forEach(p => {
    visible.add(p.id);
    (p.neighbors || []).forEach(nId => visible.add(nId));
  });
  
  // Scouts reveal adjacent provinces (even hidden ones) + neighbors of neighbors
  playerProvinces.forEach(p => {
    if (p.army.scouts > 0) {
      p.neighbors.forEach(nId => {
        visible.add(nId);
        const neighbor = state.provinces[nId];
        if (neighbor) {
          neighbor.neighbors.forEach(nnId => visible.add(nnId));
        }
      });
    }
  });
  
  (state.marchOrders || []).filter(o => o.realmId === state.playerRealmId).forEach(o => {
    visible.add(o.currentProvId);
    const prov = state.provinces[o.currentProvId];
    if (prov && o.kind !== 'scout') (prov.neighbors || []).forEach(nId => visible.add(nId));
  });
  
  return Array.from(visible);
}

export function checkGameOver(state: GameState): { winnerId: string, reason: string } | null {
  if (state.settings.victoryCondition === 'sandbox') return null;

  const provinceCounts: Record<string, number> = {};
  const totalProvinces = Object.keys(state.provinces).length;
  const realmWealth: Record<string, number> = {};
  const realmVassals: Record<string, number> = {};

  Object.values(state.provinces).forEach(p => {
    provinceCounts[p.ownerId] = (provinceCounts[p.ownerId] || 0) + 1;
  });

  Object.values(state.realms).forEach(r => {
    realmWealth[r.id] = r.gold;
    realmVassals[r.id] = r.vassals.length;
  });

  if (state.settings.victoryCondition === 'conquest') {
    for (const realmId in provinceCounts) {
      if (provinceCounts[realmId] >= totalProvinces * 0.7) {
        return {
          winnerId: realmId,
          reason: `${state.realms[realmId].name} conquistou hegemonia militar com 70% do território!`
        };
      }
    }
  }

  if (state.settings.victoryCondition === 'economic') {
    for (const realmId in realmWealth) {
      if (realmWealth[realmId] >= 10000) {
        return {
          winnerId: realmId,
          reason: `${state.realms[realmId].name} alcançou a vitória econômica com um tesouro de 10.000 de ouro!`
        };
      }
    }
  }

  const activeRealms = Object.keys(provinceCounts).filter(id => id !== 'neutral');
  if (activeRealms.length === 1) {
    return {
      winnerId: activeRealms[0],
      reason: `${state.realms[activeRealms[0]].name} é o último reino soberano.`
    };
  }

  return null;
}
export function findPath(
  state: GameState,
  fromId: string,
  toId: string,
  realmId: string,
  isScout = false,
  allowEnemyDestination = false
): string[] {

  if (fromId === toId) return [];
  const fromProv = state.provinces[fromId];
  if (!fromProv) return [];

  // Check if target is adjacent - allow direct march to neighboring enemy/neutral
  const isAdjacent = fromProv.neighbors.includes(toId);

  // Simplified: if target is a direct neighbor, allow 1-hop march
  // This enables marching to adjacent enemy/neutral territories
  if (isAdjacent) {
    const targetProv = state.provinces[toId];
    if (!targetProv) return [];
    // Scouts can traverse anything; regular troops can only march to their own land
    if (isScout || targetProv.ownerId === realmId || allowEnemyDestination) {
      return [toId];
    }
    return [];
  }

  // For non-adjacent targets, use BFS but still allow traversing to adjacent enemies
  const visited = new Set<string>([fromId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const prov = state.provinces[id];
    if (!prov) continue;

    for (const nId of prov.neighbors) {
      if (visited.has(nId)) continue;
      const neighbor = state.provinces[nId];
      if (!neighbor) continue;

      // Scouts can traverse anything
      if (isScout) {
        const newPath = [...path, nId];
        if (nId === toId) return newPath;
        visited.add(nId);
        queue.push({ id: nId, path: newPath });
        continue;
      }

      // For non-scouts: allow if friendly, neutral, or if it's the destination
      const canTraverse = neighbor.ownerId === realmId || (allowEnemyDestination && nId === toId);
      if (!canTraverse) continue;

      const newPath = [...path, nId];
      if (nId === toId) return newPath;

      visited.add(nId);
      queue.push({ id: nId, path: newPath });
    }
  }

  return [];
}

function processMarchOrders(state: GameState) {
  if (!state.marchOrders) { state.marchOrders = []; return; }
  state.lastTurnMovements = [];
  state.pendingBattleResults = [];
  const toRemove = new Set<string>();
  const arrivedOrders: { order: (typeof state.marchOrders)[number]; prov: Province }[] = [];
  const recalcTroops = (army: { infantry: number; archers: number; cavalry: number; scouts: number }) =>
    army.infantry + army.archers + army.cavalry + army.scouts;

  const finishMove = (order: (typeof state.marchOrders)[number], prov: Province) => {
    if (prov.ownerId === 'neutral') {
      prov.ownerId = order.realmId;
      prov.loyalty = 50;
      prov.army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
    }

    if (prov.ownerId === order.realmId) {
      prov.army.infantry += order.troops.infantry;
      prov.army.archers += order.troops.archers;
      prov.army.cavalry += order.troops.cavalry;
      prov.army.scouts += order.troops.scouts;
      prov.troops = recalcTroops(prov.army);
      if (order.realmId === state.playerRealmId) {
        state.logs.push(`Tropas chegaram em ${prov.name}.`);
      }
    }
  };

  const finishScout = (order: (typeof state.marchOrders)[number], prov: Province) => {
    const friendlyNeighbor = prov.neighbors
      .map(nId => state.provinces[nId])
      .find(n => n && n.ownerId === order.realmId);
    const fallbackHome = order.originProvinceId ? state.provinces[order.originProvinceId] : null;
    const depositProv = friendlyNeighbor || fallbackHome || prov;
    if (depositProv.ownerId === order.realmId) {
      depositProv.army.scouts += order.troops.scouts;
      depositProv.troops = recalcTroops(depositProv.army);
    } else if (depositProv === prov) {
      prov.army.scouts += order.troops.scouts;
      prov.troops = recalcTroops(prov.army);
    }
    if (order.realmId === state.playerRealmId) {
      state.logs.push(`Batedores completaram missao de reconhecimento.`);
    }
  };

  state.marchOrders.forEach(order => {
    const nextProvId = order.remainingPath[0];
    const nextProv = nextProvId ? state.provinces[nextProvId] : state.provinces[order.currentProvId];

    if (!nextProv) {
      toRemove.add(order.id);
      return;
    }

    if (order.remainingPath.length > 0) {
      const fromProvId = order.currentProvId;
      order.currentProvId = nextProvId;
      order.remainingPath.shift();
      state.lastTurnMovements.push({ fromId: fromProvId, toId: nextProvId, realmId: order.realmId });
    }

    if (order.currentProvId === order.destinationId) {
      arrivedOrders.push({ order, prov: nextProv });
    }
  });

  const attackGroups = new Map<string, { orders: (typeof state.marchOrders)[number][]; prov: Province }>();
  const applyRetreat = (realmId: string, provinceId: string, remainingArmy: { infantry: number; archers: number; cavalry: number; scouts: number }) => {
    const retreatDest = getRetreatDestination(state, provinceId, realmId);
    if (!retreatDest) return null;

    const retreating = calculateRetreat(remainingArmy);
    const retreatCount = recalcTroops(retreating);
    if (retreatCount <= 0) return null;

    const destProv = state.provinces[retreatDest];
    if (!destProv) return null;

    destProv.army.infantry += retreating.infantry;
    destProv.army.archers += retreating.archers;
    destProv.army.cavalry += retreating.cavalry;
    destProv.army.scouts += retreating.scouts;
    destProv.troops = recalcTroops(destProv.army);

    if (realmId === state.playerRealmId) {
      state.logs.push(`DERROTA! ${retreatCount} tropas recuaram para ${destProv.name}.`);
    }

    return {
      count: retreatCount,
      destinationName: destProv.name,
      composition: retreating
    };
  };

  arrivedOrders.forEach(({ order, prov }) => {
    if (order.kind === 'attack') {
      const key = `${order.realmId}:${order.destinationId}`;
      const existing = attackGroups.get(key);
      if (existing) {
        existing.orders.push(order);
      } else {
        attackGroups.set(key, { orders: [order], prov });
      }
      return;
    }

    if (order.kind === 'scout') finishScout(order, prov);
    else finishMove(order, prov);
    toRemove.add(order.id);
  });

  attackGroups.forEach(({ orders, prov }) => {
    const baseOrder = orders[0];
    const defenderRealmId = prov.ownerId;
    const defenderName = state.realms[defenderRealmId]?.name || 'Neutral';
    const attackerName = state.realms[baseOrder.realmId]?.name || 'Reino';

    if (defenderRealmId !== 'neutral' && !isWarBetween(state, baseOrder.realmId, defenderRealmId)) {
      declareWar(state, baseOrder.realmId, defenderRealmId);
    }

    const combinedTroops = orders.reduce((army, current) => ({
      infantry: army.infantry + current.troops.infantry,
      archers: army.archers + current.troops.archers,
      cavalry: army.cavalry + current.troops.cavalry,
      scouts: army.scouts + current.troops.scouts
    }), { infantry: 0, archers: 0, cavalry: 0, scouts: 0 });

    const result = resolveCombat(combinedTroops, prov.army, prov.terrain, prov.defense, state, prov.id);
    let retreatInfo = null;

    if (result.won) {
      retreatInfo = applyRetreat(defenderRealmId, prov.id, result.defenderRemaining);
      prov.ownerId = baseOrder.realmId;
      prov.loyalty = 40;
      prov.recentlyConquered = 3;
      prov.army = result.attackerRemaining;
      prov.troops = recalcTroops(prov.army);
      playConquestSound();
      state.visualEffects = state.visualEffects || [];
      state.visualEffects.push({
        id: `conquest_fx_${Date.now()}_${Math.random()}`,
        type: 'conquest_particles',
        provinceId: prov.id,
        particleCount: 12,
        startTime: Date.now(),
        duration: 1200
      });
      if (baseOrder.realmId === state.playerRealmId) {
        state.logs.push(`VITORIA! Suas tropas conquistaram ${prov.name}!`);
      }
    } else {
      retreatInfo = applyRetreat(baseOrder.realmId, prov.id, result.attackerRemaining);
      prov.army = result.defenderRemaining;
      prov.troops = recalcTroops(prov.army);
      if (baseOrder.realmId === state.playerRealmId) {
        state.logs.push(`DERROTA! Seu exercito foi destruido em ${prov.name}!`);
      }
    }

    state.pendingBattleResults?.push({
      attackerName,
      defenderName,
      provinceName: prov.name,
      conquered: result.won,
      result,
      retreatInfo: retreatInfo || undefined
    });

    orders.forEach(order => toRemove.add(order.id));
  });

  state.marchOrders = state.marchOrders.filter(o => !toRemove.has(o.id));
}

function getStabilityFactor(stability: number): number {
  if (stability >= 80) return 1;
  if (stability >= 50) return 0.85;
  if (stability >= 20) return 0.65;
  return 0.4;
}

function calculateStabilityDelta(province: any, realm: Realm, state: GameState): number {
  let delta = 0;

  if ((province.recentlyConquered || 0) > 0) delta -= 10;
  if (realm.overextension > 80) delta -= 2;
  if ((province.loyalty || 0) < 30) delta -= 5;
  if ((province.buildings?.courts || 0) > 0) delta += 5;
  if ((province.loyalty || 0) > 70) delta += 3;
  if (province.id === realm.capitalId) delta += 5;

  const atWar = (state.activeWars || []).some(w =>
    w.attackerId === realm.id || w.defenderId === realm.id
  );
  if (atWar) delta -= 3;

  const noWarTurns = (province as any).turnsWithoutWar || 0;
  if (noWarTurns >= 3) delta += 4;

  return Math.max(-20, Math.min(20, delta));
}

function calculateDistancesFromCapital(state: GameState, capitalId?: string): Record<string, number> {
  if (!capitalId) return {};
  const distances: Record<string, number> = { [capitalId]: 0 };
  const queue = [capitalId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDist = distances[currentId];
    const province = state.provinces[currentId];
    if (province && province.neighbors) {
      province.neighbors.forEach(neighborId => {
        if (distances[neighborId] === undefined) {
          distances[neighborId] = currentDist + 1;
          queue.push(neighborId);
        }
      });
    }
  }
  return distances;
}

function processCoalitions(state: GameState) {
  const totalProvinces = Object.keys(state.provinces).length;
  const expansionists = Object.values(state.realms).filter(r => {
    if (r.id === 'neutral') return false;
    const ownedCount = Object.values(state.provinces).filter(p => p.ownerId === r.id).length;
    return r.overextension > 100 || ownedCount > totalProvinces * 0.4;
  });

  state.coalitions = [];
  expansionists.forEach(target => {
    const members = Object.values(state.realms)
      .filter(r => r.id !== 'neutral' && r.id !== target.id && (target.relations?.[r.id] || 0) < -50)
      .map(r => r.id);
    
    if (members.length >= 2) {
      state.coalitions.push({ targetId: target.id, members });
      if (target.isPlayer) {
        state.logs.push(`ALERTA: Uma coalizão de reinos vizinhos se formou contra seu domínio expansionista!`);
      }
    }
  });
}

function processActiveWars(state: GameState) {
  state.activeWars = state.activeWars || [];
  const warsToFinish: string[] = [];

  state.activeWars.forEach(war => {
    // Each turn increases exhaustion
    war.attackerExhaustion += 2 + Math.floor(Math.random() * 3);
    war.defenderExhaustion += 2 + Math.floor(Math.random() * 3);

    // Capital capture check
    const attacker = state.realms[war.attackerId];
    const defender = state.realms[war.defenderId];
    if (!attacker || !defender) {
      warsToFinish.push(war.id);
      return;
    }

    const defenderCapital = state.provinces[defender.capitalId || ''];
    if (defenderCapital && defenderCapital.ownerId === war.attackerId) {
      war.warScore += 40;
      war.defenderExhaustion += 20;
    }

    const attackerCapital = state.provinces[attacker.capitalId || ''];
    if (attackerCapital && attackerCapital.ownerId === war.defenderId) {
      war.warScore -= 40;
      war.attackerExhaustion += 20;
    }

    // Peace detection
    const isAttackerExhausted = war.attackerExhaustion >= 100;
    const isDefenderExhausted = war.defenderExhaustion >= 100;

    if (isAttackerExhausted || isDefenderExhausted || Math.abs(war.warScore) > 70) {
      warsToFinish.push(war.id);
      
      // Update realm relations and memory
      if (attacker.memory?.[war.defenderId]) {
        attacker.memory[war.defenderId].lastWarTurn = state.turn;
      }
      if (defender.memory?.[war.attackerId]) {
        defender.memory[war.attackerId].lastWarTurn = state.turn;
      }

      attacker.wars = (attacker.wars || []).filter(id => id !== war.defenderId);
      defender.wars = (defender.wars || []).filter(id => id !== war.attackerId);

      if (war.attackerId === state.playerRealmId || war.defenderId === state.playerRealmId) {
        state.logs.push(`TRÉGUA: A guerra entre ${attacker.name} e ${defender.name} chegou ao fim por exaustão mútua.`);
      }
    }
  });

  state.activeWars = state.activeWars.filter(w => !warsToFinish.includes(w.id));
}

function handleRandomEvents(state: GameState) {
  state.currentEvent = null;
  if (Math.random() > 0.15) return; // 15% chance of event

  const events: { name: string; description: string; type: 'positive' | 'negative'; action: (s: GameState) => void }[] = [
    {
      name: "Boa Colheita",
      description: "Um ano de clima perfeito resultou em colheitas abundantes por todo o reino.",
      type: "positive",
      action: (s) => {
        const player = s.realms[s.playerRealmId];
        if (player) player.food += 300;
      }
    },
    {
      name: "Explosão Econômica",
      description: "Novas rotas comerciais e prosperidade aumentaram o tesouro real.",
      type: "positive",
      action: (s) => {
        const player = s.realms[s.playerRealmId];
        if (player) player.gold += 400;
      }
    },
    {
      name: "Praga",
      description: "Uma doença misteriosa se espalhou por algumas províncias, reduzindo a população.",
      type: "negative",
      action: (s) => {
        const provs = Object.values(s.provinces).filter(p => p.ownerId === s.playerRealmId);
        provs.slice(0, 3).forEach(p => {
          p.population = Math.floor(p.population * 0.9);
        });
      }
    },
    {
      name: "Incêndio no Arsenal",
      description: "Um acidente destruiu estoques de materiais em suas oficinas.",
      type: "negative",
      action: (s) => {
        const player = s.realms[s.playerRealmId];
        if (player) player.materials = normalizeNaturalAmount(player.materials - 150);
      }
    }
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  state.currentEvent = { name: event.name, description: event.description, type: event.type };
  event.action(state);
  state.logs.push(`EVENTO: ${event.name} - ${event.description}`);
}

export function processEndOfTurn(state: GameState): GameState {
  const newState = deepClone(state);

  Object.values(newState.realms).forEach(realm => {
    if (realm.id === 'neutral') return;

    realm.tradesThisTurn = 0;

    const ownedProvinces = Object.values(newState.provinces).filter(p => p.ownerId === realm.id);
    const distances = calculateDistancesFromCapital(newState, realm.capitalId);

    // Diplomacy & Internal maintenance
    if (realm.overextension > 0) {
      realm.overextension = Math.max(0, realm.overextension - 5);
    }

    Object.values(realm.memory || {}).forEach(mem => {
      mem.betrayal = Math.max(0, (mem.betrayal || 0) - 2);
      mem.aggression = Math.max(0, (mem.aggression || 0) - 2);
      mem.help = Math.max(0, (mem.help || 0) - 1);
    });

    let goldIncome = 0;
    let foodIncome = 0;
    let materialIncome = 0;
    let goldMaintenance = 0;
    let foodMaintenance = 0;

    ownedProvinces.forEach(p => {
      let loyaltyChange = 0;
      if (p.loyalty > 55) loyaltyChange -= 1;
      else if (p.loyalty < 45) loyaltyChange += 1;

      const atWar = (newState.activeWars || []).some(w => w.attackerId === realm.id || w.defenderId === realm.id);
      if (atWar) {
        (p as any).turnsWithoutWar = 0;
      } else {
        (p as any).turnsWithoutWar = ((p as any).turnsWithoutWar || 0) + 1;
      }

      const dist = distances[p.id] || 0;
      const adminPenalty = Math.max(0, (dist * 2) - (p.buildings.courts || 0));
      loyaltyChange -= adminPenalty;
      
      loyaltyChange -= Math.floor(realm.overextension / 10);

      if (p.id === realm.capitalId) loyaltyChange += 10;
      
      if (p.recentlyConquered > 0) {
        loyaltyChange -= 5;
        p.recentlyConquered--;
      }
      if (realm.gold <= 0 || realm.food <= 0) loyaltyChange -= 10;

      p.loyalty = Math.max(0, Math.min(100, p.loyalty + loyaltyChange));
      
      if (p.loyalty < 10 && Math.random() < 0.15) {
        newState.logs.push(`REBELIÃO: Instabilidade política levou à queda do governo em ${p.name}!`);
        p.ownerId = 'neutral';
        p.loyalty = 40;
        p.stability = Math.max(5, (p.stability || 70) - 20);
        p.army.infantry = Math.floor(p.army.infantry * 0.4) + 10;
        p.army.archers = Math.floor(p.army.archers * 0.4);
        p.army.cavalry = Math.floor(p.army.cavalry * 0.4);
        p.troops = p.army.infantry + p.army.archers + p.army.cavalry + (p.army.scouts || 0);
      }

      const stabilityDelta = calculateStabilityDelta(p, realm, newState);
      const nextStability = Math.max(5, Math.min(100, (p.stability ?? 70) + stabilityDelta));
      if (nextStability < 30 && (p.stability ?? 70) >= 30) {
        newState.logs.push(`ALERTA: A estabilidade de ${p.name} caiu para ${nextStability}.`);
      }
      p.stability = nextStability;

      const loyaltyFactor = 0.5 + (p.loyalty / 200);
      const stabilityFactor = getStabilityFactor(p.stability);
      const efficiency = (0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor * stabilityFactor;
      
      goldIncome += (p.wealth + (p.buildings.mines * BUILDING_PRODUCTION.mines)) * efficiency;
      foodIncome += (p.foodProduction + (p.buildings.farms * BUILDING_PRODUCTION.farms)) * efficiency;
      materialIncome += (p.materialProduction + (p.buildings.workshops * BUILDING_PRODUCTION.workshops)) * efficiency;

      // Strategic bonuses
      if (p.strategicResource === 'iron') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'wood') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'horse') foodIncome += 5 * efficiency;
      if (p.strategicResource === 'stone') materialIncome += 5 * efficiency;

      if (p.population < p.maxPopulation) {
        const growth = Math.floor(p.population * 0.07 * efficiency);
        p.population = Math.min(p.maxPopulation, p.population + growth);
      }

      goldMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.gold;
      goldMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.gold;
      goldMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.gold;
      goldMaintenance += p.army.scouts * UNIT_STATS.scouts.maintenance.gold;

      foodMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.food;
      foodMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.food;
      foodMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.food;
      foodMaintenance += p.army.scouts * UNIT_STATS.scouts.maintenance.food;
    });
    
    if (realm.vassals.length > 0) {
      realm.vassals.forEach(vassalId => {
        const vassal = newState.realms[vassalId];
        if (vassal) {
          const tribute = Math.floor(vassal.gold * 0.15);
          vassal.gold -= tribute;
          goldIncome += tribute;
        }
      });
    }

    const oePenalty = 1 - (realm.overextension / 200);
    const tradeIncome = realm.tradeRoutes.reduce((sum, route) => {
      const p1 = newState.provinces[route.fromProvinceId];
      const p2 = newState.provinces[route.toProvinceId];
      if (!p1 || !p2) return sum;
      return sum + Math.floor((p1.wealth + p2.wealth) * 0.5);
    }, 0);

    const goldRevenue = Math.floor((goldIncome + tradeIncome) * oePenalty);
    const foodRevenue = Math.floor(foodIncome * oePenalty);
    const materialRevenue = Math.floor(materialIncome * oePenalty);

    realm.gold = normalizeNaturalAmount(realm.gold + goldRevenue);
    realm.food = normalizeNaturalAmount(realm.food + foodRevenue);
    realm.materials = normalizeNaturalAmount(realm.materials + materialRevenue);

    Object.entries({ ...realm.tributeTo }).forEach(([targetId, rawAmount]) => {
      const amount = Number(rawAmount) || 0;
      const targetRealm = newState.realms[targetId];
      if (!targetRealm) {
        delete realm.tributeTo[targetId];
        return;
      }

      if (realm.gold >= amount) {
        realm.gold -= amount;
        targetRealm.gold += amount;
        return;
      }

      delete realm.tributeTo[targetId];
      delete targetRealm.tributeFrom[realm.id];
      realm.relations[targetId] = Math.max(-100, (realm.relations[targetId] || 0) - 10);
      targetRealm.relations[realm.id] = realm.relations[targetId];
      newState.logs.push(`Tributo a ${targetRealm.name} cancelado por falta de fundos.`);
    });

    Object.entries({ ...realm.napExpiryTurn }).forEach(([targetId, expiryTurn]) => {
      const targetRealm = newState.realms[targetId];
      const expiry = Number(expiryTurn) || 0;
      if (!targetRealm) {
        delete realm.napExpiryTurn[targetId];
        return;
      }
      if (expiry > newState.turn || realm.id > targetId) return;

      realm.nonAggressionPacts = realm.nonAggressionPacts.filter(id => id !== targetId);
      targetRealm.nonAggressionPacts = targetRealm.nonAggressionPacts.filter(id => id !== realm.id);
      delete realm.napExpiryTurn[targetId];
      delete targetRealm.napExpiryTurn[realm.id];
      newState.logs.push(`O Pacto de Não-Agressão com ${targetRealm.name} expirou.`);
    });

    realm.gold = normalizeNaturalAmount(realm.gold - goldMaintenance);
    realm.food = normalizeNaturalAmount(realm.food - foodMaintenance);

    realm.goldIncome = goldIncome + tradeIncome;
    realm.goldMaintenance = goldMaintenance;
    realm.foodIncome = foodIncome;
    realm.foodMaintenance = foodMaintenance;
    realm.materialsIncome = Math.floor(materialIncome);
    
    // Reset action points
    realm.actionPoints = realm.maxActionPoints;

    if (realm.gold < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.gold * 10), 'gold', newState);
    }
    if (realm.food < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.food * 5), 'food', newState);
    }
  });

  processMarchOrders(newState);
  processCoalitions(newState);
  processActiveWars(newState);
  newState.turn += 1;
  newState.visibleProvinces = calculateVisibility(newState);
  handleRandomEvents(newState);
  
  const gameOver = checkGameOver(newState);
  if (gameOver) {
    newState.gameOver = gameOver;
    newState.logs.push(`FIM DE JOGO: ${gameOver.reason}`);
  }

  return newState;
}

