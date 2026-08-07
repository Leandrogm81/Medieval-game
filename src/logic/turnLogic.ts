import { GameState, Realm, Province, War } from '../types';
import { ACTION_COSTS, UNIT_STATS, BUILDING_PRODUCTION } from './game-constants';
import { handleResourceDeficit, normalizeNaturalAmount } from './economyLogic';
import { calculateRetreat, getRetreatDestination, resolveCombat } from './combatLogic';
import { playConquestSound } from './sfxLogic';
import { declareWar, isWarBetween } from './diplomacyLogic';
import { deepClone } from '../utils/deepClone';
import { generateTechPoints } from './technologyLogic';
import { GOVERNMENT_STATS, checkRevolution } from './governmentLogic';
import { isProvinceDistant } from './governmentLogic';
import { checkCapitulation, executeCapitulation } from './capitulationLogic';
import { getTechBonus } from './techLogic';
import { processRealmLoans } from './financeLogic';
import { processVassalLiberty } from './vassalLogic';

export function calculateVisibility(state: GameState): string[] {
  const visible = new Set<string>();
  const playerProvinces = Object.values(state.provinces).filter(p => 
    p.ownerId === state.playerRealmId || (p.occupantRealmId === state.playerRealmId && p.troops > 0)
  );
  
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
    if (prov) (prov.neighbors || []).forEach(nId => visible.add(nId));
  });

  if (state.recentlyScoutedProvinceIds) {
    state.recentlyScoutedProvinceIds.forEach(id => visible.add(id));
  }
  
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
      if (realmId === 'neutral') continue;
      const realm = state.realms[realmId];
      if (!realm) continue;
      if (provinceCounts[realmId] >= totalProvinces * 0.7) {
        return {
          winnerId: realmId,
          reason: `${realm.name} conquistou hegemonia militar com 70% do território!`
        };
      }
    }
  }

  if (state.settings.victoryCondition === 'economic') {
    for (const realmId in realmWealth) {
      const realm = state.realms[realmId];
      if (!realm) continue; // FIX: reino eliminado não pode vencer
      if (realmWealth[realmId] >= 10000) {
        return {
          winnerId: realmId,
          reason: `${realm.name} alcançou a vitória econômica com um tesouro de 10.000 de ouro!`
        };
      }
    }
  }

  const activeRealms = Object.keys(provinceCounts).filter(id => id !== 'neutral');
  if (activeRealms.length === 1) {
    const lastRealm = state.realms[activeRealms[0]];
    if (lastRealm) {
      return {
        winnerId: activeRealms[0],
        reason: `${lastRealm.name} é o último reino soberano.`
      };
    }
  }

  // Fase 2 — Derrota do jogador: eliminado (sem províncias) → game over
  const playerProvinces = provinceCounts[state.playerRealmId] || 0;
  if (playerProvinces === 0 && activeRealms.length > 1) {
    // Vencedor = reino com mais províncias
    let topRealmId = activeRealms[0];
    for (const id of activeRealms) {
      if ((provinceCounts[id] || 0) > (provinceCounts[topRealmId] || 0)) topRealmId = id;
    }
    const winner = state.realms[topRealmId];
    if (winner) {
      return {
        winnerId: topRealmId,
        reason: `${state.realms[state.playerRealmId]?.name || 'Seu reino'} foi eliminado. ${winner.name} domina agora.`
      };
    }
  }

  return null;
}

export function findPath(
  state: GameState,
  fromId: string,
  toId: string,
  realmId: string,
  isScout: boolean = false,
  allowEnemyDestination: boolean = false
): string[] {
  if (fromId === toId) return [];

  const fromProv = state.provinces[fromId];
  if (!fromProv) return [];

  if (fromProv.neighbors.includes(toId)) {
    const targetProv = state.provinces[toId];
    if (!targetProv) return [];
    
    // Batedores têm passagem livre
    if (isScout) return [toId];

    // Oceanos e movimentações de/para oceanos têm passagem livre
    const isWater = !!targetProv.isWater;
    const isOwned = targetProv.ownerId === realmId;
    const isNeutral = targetProv.ownerId === 'neutral';
    const isFromWater = !!fromProv.isWater;
    const isAtWar = targetProv.ownerId !== realmId && targetProv.ownerId !== 'neutral' && isWarBetween(state, realmId, targetProv.ownerId);

    if (isWater || isOwned || isNeutral || allowEnemyDestination || isFromWater || isAtWar) {
      return [toId];
    }
    return [];
  }

  // For non-adjacent targets, use BFS
  const visited = new Set<string>([fromId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [] }];
  const isFromWater = !!fromProv.isWater;

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const prov = state.provinces[id];
    if (!prov) continue;

    for (const nId of prov.neighbors) {
      if (visited.has(nId)) continue;
      const neighbor = state.provinces[nId];
      if (!neighbor) continue;

      if (isScout) {
        const newPath = [...path, nId];
        if (nId === toId) return newPath;
        visited.add(nId);
        queue.push({ id: nId, path: newPath });
        continue;
      }

      const isWater = !!neighbor.isWater;
      const isOwned = neighbor.ownerId === realmId;
      const isNeutral = neighbor.ownerId === 'neutral';
      const isAtWar = neighbor.ownerId !== realmId && neighbor.ownerId !== 'neutral' && isWarBetween(state, realmId, neighbor.ownerId);

      const canTraverse = isWater || isOwned || isNeutral || isFromWater || (nId === toId ? (allowEnemyDestination || isAtWar) : isAtWar);
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

  // FIX: march orders de reinos eliminados são órfãs — cancelar
  state.marchOrders.forEach(o => {
    if (!state.realms[o.realmId]) toRemove.add(o.id);
  });

  const arrivedOrders: { order: (typeof state.marchOrders)[number]; prov: Province }[] = [];
  const recalcTroops = (army: { infantry: number; archers: number; cavalry: number; scouts: number }) =>
    army.infantry + army.archers + army.cavalry + army.scouts;

  const finishMove = (order: (typeof state.marchOrders)[number], prov: Province) => {
    if (prov.ownerId === 'neutral' && !prov.isWater) {
      prov.ownerId = order.realmId;
      prov.loyalty = 50;
      prov.army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
    }

    if (prov.ownerId === order.realmId || prov.isWater) {
      prov.army.infantry += order.troops.infantry;
      prov.army.archers += order.troops.archers;
      prov.army.cavalry += order.troops.cavalry;
      prov.army.scouts += order.troops.scouts;
      prov.troops = recalcTroops(prov.army);
      if (order.realmId === state.playerRealmId) {
        state.logs.push(prov.isWater ? `Tropas navegaram e posicionaram-se em ${prov.name}.` : `Tropas chegaram em ${prov.name}.`);
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

  // Pre-pass: Interceptar ordens inimigas cruzando províncias no mesmo turno (P1 -> P2 e P2 -> P1)
  const interceptedOrders = new Map<string, string>(); // orderId -> collisionProvinceId
  const allOrdersList = [...state.marchOrders];

  for (let i = 0; i < allOrdersList.length; i++) {
    const orderA = allOrdersList[i];
    if (orderA.kind === 'scout' || orderA.remainingPath.length === 0) continue;

    for (let j = i + 1; j < allOrdersList.length; j++) {
      const orderB = allOrdersList[j];
      if (orderB.kind === 'scout' || orderB.remainingPath.length === 0) continue;
      if (orderA.realmId === orderB.realmId) continue; // Aliados não se atacam em trânsito

      const fromA = orderA.currentProvId;
      const toA = orderA.remainingPath[0];
      const fromB = orderB.currentProvId;
      const toB = orderB.remainingPath[0];

      // Se A vai de P1->P2 e B vai de P2->P1: forçar confronto direto em P2
      if (fromA === toB && toA === fromB) {
        interceptedOrders.set(orderA.id, toA);
        interceptedOrders.set(orderB.id, toA);
        orderA.kind = 'attack';
        orderB.kind = 'attack';
      }
    }
  }

  const depositOrderTroopsToCurrentProv = (order: (typeof state.marchOrders)[number]) => {
    if (!order.troops) return;
    const count = recalcTroops(order.troops);
    if (count <= 0) return;

    let targetProv = state.provinces[order.currentProvId];
    if (!targetProv || (targetProv.ownerId !== order.realmId && !targetProv.isWater)) {
      const originP = order.originProvinceId ? state.provinces[order.originProvinceId] : null;
      if (originP && originP.ownerId === order.realmId) {
        targetProv = originP;
      } else {
        const friendlyNeighbor = (targetProv?.neighbors || [])
          .map(id => state.provinces[id])
          .find(n => n && n.ownerId === order.realmId);
        const capitalId = state.realms[order.realmId]?.capitalId;
        const capitalP = capitalId ? state.provinces[capitalId] : null;
        targetProv = friendlyNeighbor || (capitalP && capitalP.ownerId === order.realmId ? capitalP : null) ||
          Object.values(state.provinces).find(p => p.ownerId === order.realmId) || targetProv;
      }
    }

    if (targetProv) {
      targetProv.army.infantry += order.troops.infantry || 0;
      targetProv.army.archers += order.troops.archers || 0;
      targetProv.army.cavalry += order.troops.cavalry || 0;
      targetProv.army.scouts += order.troops.scouts || 0;
      targetProv.troops = recalcTroops(targetProv.army);
      if (targetProv.isWater && (!targetProv.occupantRealmId || targetProv.occupantRealmId === 'neutral')) {
        targetProv.occupantRealmId = order.realmId;
      }
    }
    order.troops = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
  };

  state.marchOrders.forEach(order => {
    if (order.kind === 'scout') {
      // Batedores têm movimentação livre instantânea: avançam todo o caminho restante no mesmo turno
      let hasError = false;
      while (order.remainingPath.length > 0) {
        const nextProvId = order.remainingPath[0];
        const nextProv = state.provinces[nextProvId];
        if (!nextProv) {
          depositOrderTroopsToCurrentProv(order);
          toRemove.add(order.id);
          hasError = true;
          break;
        }

        const currentProv = state.provinces[order.currentProvId];
        const isAdjacent = currentProv && currentProv.neighbors.includes(nextProvId);
        if (!isAdjacent) {
          depositOrderTroopsToCurrentProv(order);
          toRemove.add(order.id);
          hasError = true;
          break;
        }

        const fromProvId = order.currentProvId;
        order.currentProvId = nextProvId;
        order.remainingPath.shift();

        state.lastTurnMovements = state.lastTurnMovements || [];
        state.lastTurnMovements.push({ fromId: fromProvId, toId: nextProvId, realmId: order.realmId });

        if (order.realmId === state.playerRealmId) {
          state.recentlyScoutedProvinceIds = state.recentlyScoutedProvinceIds || [];
          if (!state.recentlyScoutedProvinceIds.includes(nextProvId)) {
            state.recentlyScoutedProvinceIds.push(nextProvId);
          }
          if (nextProv.neighbors) {
            nextProv.neighbors.forEach(nId => {
              if (!state.recentlyScoutedProvinceIds!.includes(nId)) {
                state.recentlyScoutedProvinceIds!.push(nId);
              }
            });
          }
        }
      }

      if (!hasError && order.currentProvId === order.destinationId) {
        arrivedOrders.push({ order, prov: state.provinces[order.destinationId] });
      }
    } else {
      // Tropas regulares movem-se apenas 1 província por turno
      const nextProvId = order.remainingPath[0];
      const nextProv = nextProvId ? state.provinces[nextProvId] : state.provinces[order.currentProvId];

      if (!nextProv) {
        depositOrderTroopsToCurrentProv(order);
        toRemove.add(order.id);
        return;
      }

      // REGRA: Se foi interceptada em rota de colisão cruzada, forçar parada e combate na província de confronto
      const interceptedDestId = interceptedOrders.get(order.id);
      if (interceptedDestId) {
        const targetProv = state.provinces[interceptedDestId] || nextProv;
        order.currentProvId = interceptedDestId;
        order.remainingPath = [];
        arrivedOrders.push({ order, prov: targetProv });
        return;
      }

      const currentProv = state.provinces[order.currentProvId];
      if (order.remainingPath.length > 0) {
        const isAdjacent = currentProv && currentProv.neighbors.includes(nextProvId);
        if (!isAdjacent) {
          if (order.realmId === state.playerRealmId) {
            state.logs.push(`Ordem de marcha cancelada: caminho para ${nextProv.name} não está mais disponível.`);
          }
          depositOrderTroopsToCurrentProv(order);
          toRemove.add(order.id);
          return;
        }

        // Se adentrar território de outra nação, exige guerra ativa (jogador NUNCA declara guerra automaticamente)
        const isOwnTerritory = nextProv.ownerId === order.realmId;
        const isNeutralOrWater = nextProv.ownerId === 'neutral' || nextProv.isWater;
        if (!isOwnTerritory && !isNeutralOrWater) {
          const isAtWar = isWarBetween(state, order.realmId, nextProv.ownerId);
          if (!isAtWar) {
            if (order.realmId === state.playerRealmId) {
              state.logs.push(`Marcha/Campanha interrompida em ${currentProv?.name || 'província'}: ${nextProv.name} pertence a ${state.realms[nextProv.ownerId]?.name || 'outro reino'} e não há guerra declarada. Declare guerra no painel de Diplomacia.`);
              depositOrderTroopsToCurrentProv(order);
              toRemove.add(order.id);
              return;
            } else {
              declareWar(state, order.realmId, nextProv.ownerId);
            }
          }
        }
      }

      if (order.remainingPath.length > 0) {
        const fromProvId = order.currentProvId;
        order.currentProvId = nextProvId;
        order.remainingPath.shift();
        state.lastTurnMovements = state.lastTurnMovements || [];
        state.lastTurnMovements.push({ fromId: fromProvId, toId: nextProvId, realmId: order.realmId });

        if (order.realmId === state.playerRealmId) {
          state.recentlyScoutedProvinceIds = state.recentlyScoutedProvinceIds || [];
          if (!state.recentlyScoutedProvinceIds.includes(nextProvId)) {
            state.recentlyScoutedProvinceIds.push(nextProvId);
          }
          if (nextProv && nextProv.neighbors) {
            nextProv.neighbors.forEach(nId => {
              if (!state.recentlyScoutedProvinceIds!.includes(nId)) {
                state.recentlyScoutedProvinceIds!.push(nId);
              }
            });
          }
        }
      }

      const isTargetEnemyOrNeutral = (order.kind === 'attack' || !!order.waypoints) && nextProv.ownerId !== order.realmId && !nextProv.isWater;
      if (order.currentProvId === order.destinationId || isTargetEnemyOrNeutral) {
        arrivedOrders.push({ order, prov: nextProv });
      }
    }
  });

  const attackGroups = new Map<string, { orders: (typeof state.marchOrders)[number][]; prov: Province }>();
  const applyRetreat = (
    realmId: string, 
    provinceId: string, 
    remainingArmy: { infantry: number; archers: number; cavalry: number; scouts: number },
    forbiddenProvinceId?: string
  ) => {
    let retreatDest = getRetreatDestination(state, provinceId, realmId, forbiddenProvinceId);
    if (!retreatDest) {
      retreatDest = forbiddenProvinceId || provinceId;
    }
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
      if (baseOrder.realmId === state.playerRealmId) {
        state.logs.push(`Ataque em ${prov.name} cancelado: não há guerra declarada com ${defenderName}. Declare guerra no painel de Diplomacia.`);
        orders.forEach(o => {
          depositOrderTroopsToCurrentProv(o);
          toRemove.add(o.id);
        });
        return;
      } else {
        declareWar(state, baseOrder.realmId, defenderRealmId);
      }
    }

    const combinedTroops = orders.reduce((army, current) => ({
      infantry: army.infantry + current.troops.infantry,
      archers: army.archers + current.troops.archers,
      cavalry: army.cavalry + current.troops.cavalry,
      scouts: army.scouts + current.troops.scouts
    }), { infantry: 0, archers: 0, cavalry: 0, scouts: 0 });

    const attackerRealm = state.realms[baseOrder.realmId];
    const defenderRealm = state.realms[defenderRealmId];
    const attackerGov = attackerRealm ? GOVERNMENT_STATS[attackerRealm.government || 'monarchy'] : null;
    const defenderGov = defenderRealm ? GOVERNMENT_STATS[defenderRealm.government || 'monarchy'] : null;
    const attackerTechBonus = attackerRealm ? ((attackerRealm.techLevels?.combat ?? 0) * 0.05) + (attackerGov ? attackerGov.attack - 1 : 0) : 0;
    const defenderTechBonus = defenderRealm ? ((defenderRealm.techLevels?.combat ?? 0) * 0.05) + (defenderGov ? defenderGov.defense - 1 : 0) : 0;

    const result = resolveCombat(
      combinedTroops, 
      prov.army, 
      prov.terrain, 
      prov.defense, 
      state, 
      prov.id,
      attackerTechBonus,
      defenderTechBonus
    );
    let retreatInfo = null;

    if (result.won) {
      // REGRA INQUEBRÁVEL: O defensor derrotado NÃO pode recuar para a província de origem do atacante
      retreatInfo = applyRetreat(
        defenderRealmId, 
        prov.id, 
        result.defenderRemaining,
        baseOrder.originProvinceId || baseOrder.currentProvId
      );
      if (prov.ownerId !== 'neutral') prov.originalOwnerId = prov.ownerId; // Fase 2: dono pré-guerra (capitulação)
      prov.ownerId = baseOrder.realmId;
      prov.loyalty = 40;
      prov.recentlyConquered = 3;

      const isCampaignInProgress = baseOrder.remainingPath.length > 0;
      baseOrder.currentProvId = prov.id;

      if (isCampaignInProgress) {
        baseOrder.troops = result.attackerRemaining;
        prov.army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
        prov.troops = 0;
        if (baseOrder.realmId === state.playerRealmId) {
          state.logs.push(`VITÓRIA! Suas tropas conquistaram ${prov.name} e continuam a marcha para o próximo objetivo!`);
        }
      } else {
        prov.army = result.attackerRemaining;
        prov.troops = recalcTroops(prov.army);
        if (baseOrder.realmId === state.playerRealmId) {
          state.logs.push(`VITÓRIA! Suas tropas conquistaram ${prov.name}!`);
        }
      }

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
    } else {
      retreatInfo = applyRetreat(
        baseOrder.realmId, 
        prov.id, 
        result.attackerRemaining,
        prov.id
      );
      prov.army = result.defenderRemaining;
      prov.troops = recalcTroops(prov.army);
      if (baseOrder.realmId === state.playerRealmId) {
        state.logs.push(`DERROTA! Seu exército foi derrotado em ${prov.name}!`);
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

    // Fase 2 — Estatísticas de tracking: batalhas vencidas
    if (result.won && attackerRealm) {
      attackerRealm.battlesWon = (attackerRealm.battlesWon || 0) + 1;
    }
    if (!result.won && defenderRealm) {
      defenderRealm.battlesWon = (defenderRealm.battlesWon || 0) + 1;
    }

    // Se a campanha ainda tiver caminho restante e o atacante venceu, preserva a ordem principal
    orders.forEach(order => {
      if (!result.won || order.remainingPath.length === 0 || order.id !== baseOrder.id) {
        toRemove.add(order.id);
      }
    });
  });

  toRemove.forEach(id => {
    const o = state.marchOrders.find(x => x.id === id);
    if (o) {
      depositOrderTroopsToCurrentProv(o);
    }
  });

  state.marchOrders = state.marchOrders.filter(o => !toRemove.has(o.id));
}

function getStabilityFactor(stability: number): number {
  if (stability >= 80) return 1;
  if (stability >= 50) return 0.85;
  if (stability >= 20) return 0.65;
  return 0.4;
}

function calculateStabilityDelta(province: Province, realm: Realm, state: GameState): number {
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

  const noWarTurns = province.turnsWithoutWar || 0;
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

    // Fase 2 — Capitulação: checada após war scores, antes da exaustão
    const capitulation = checkCapitulation(state, war);
    if (capitulation) {
      executeCapitulation(state, capitulation);
      if (war.attackerId === state.playerRealmId || war.defenderId === state.playerRealmId) {
        const winner = state.realms[capitulation.winnerId];
        const loserName = state.realms[capitulation.loserId]?.name || 'o reino derrotado';
        state.logs.push(`🏳️ ${loserName} se rendeu a ${winner?.name || 'seu oponente'}!`);
      }
      return; // guerra encerrada por capitulação
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

      // Fase 2 — Limpar originalOwnerId das províncias da guerra encerrada (lifecycle completo)
      Object.values(state.provinces).forEach(p => {
        if (p.originalOwnerId === war.attackerId || p.originalOwnerId === war.defenderId) {
          p.originalOwnerId = undefined;
        }
      });

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
  newState.recentlyScoutedProvinceIds = [];

  Object.values(newState.realms).forEach(realm => {
    if (realm.id === 'neutral') return;

    realm.tradesThisTurn = 0;

    const ownedProvinces = Object.values(newState.provinces).filter(p => p.ownerId === realm.id);
    const distances = calculateDistancesFromCapital(newState, realm.capitalId);

    // --- NOVO: Progressão Tecnológica ---
    realm.techPoints = (realm.techPoints || 0) + generateTechPoints(realm, newState);

    // --- NOVO: Finanças (Empréstimos) ---
    const { updatedRealm, defaulted } = processRealmLoans(realm, newState);
    Object.assign(realm, updatedRealm);
    if (defaulted && realm.id !== state.playerRealmId) {
      newState.logs.push(`⚠️ ${realm.name} não pagou suas parcelas de empréstimo!`);
    }

    // --- NOVO: Capitulação (Derrota Total) ---
    if (ownedProvinces.length === 0 && realm.id !== 'neutral') {
      newState.logs.push(`QUEDA: O reino ${realm.name} capitulou e deixou de existir.`);
      // Limpar memórias e diplomacia
      Object.values(newState.realms).forEach(r => {
        if (r.relations[realm.id] !== undefined) delete r.relations[realm.id];
        if (r.vassals.includes(realm.id)) r.vassals = r.vassals.filter(v => v !== realm.id);
      });
      return; 
    }

    // Diplomacy & Internal maintenance
    if (realm.overextension > 0) {
      realm.overextension = Math.max(0, realm.overextension - 5);
    }

    // Fase 2 — Governo: decrementar cooldown de reforma
    if ((realm.governmentChangeCooldown || 0) > 0) {
      realm.governmentChangeCooldown -= 1;
    }

    // Fase 2 — Governo: multiplicadores de economia
    const govStats = GOVERNMENT_STATS[realm.government || 'monarchy'];

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

      // Fase 2 — Instabilidade pós-capitulação: -4/turno durante 5 turnos (decay)
      if ((p.postWarInstability ?? 0) > 0) {
        p.postWarInstability = p.postWarInstability! - 1;
        loyaltyChange -= 4;
        if (p.postWarInstability === 0 && p.ownerId === state.playerRealmId) {
          newState.logs.push(`A instabilidade pós-guerra em ${p.name} diminuiu.`);
        }
      }

      const atWar = (newState.activeWars || []).some(w => w.attackerId === realm.id || w.defenderId === realm.id);
      if (atWar) {
        p.turnsWithoutWar = 0;
      } else {
        p.turnsWithoutWar = (p.turnsWithoutWar || 0) + 1;
      }

      const dist = distances[p.id] !== undefined ? distances[p.id] : 4;
      const courts = p.buildings?.courts || 0;
      // Cada corte protege 3 saltos de distância da capital e concede +1 de lealdade passiva por turno
      const effectiveDist = Math.max(0, dist - (courts * 3));
      const adminPenalty = Math.min(4, Math.floor(effectiveDist * 0.4));
      const courtLoyaltyBonus = courts * 1;

      loyaltyChange = loyaltyChange - adminPenalty + courtLoyaltyBonus;

      // Fase 2 — Governo: Republic penaliza estabilidade em províncias distantes (>=2 saltos)
      if ((realm.government === 'republic') && isProvinceDistant(newState, p.id, realm)) {
        p.stability = Math.max(5, (p.stability ?? 70) - 10);
      }
      
      loyaltyChange -= Math.floor(realm.overextension / 10);

      if (p.id === realm.capitalId) loyaltyChange += 10;
      
      if (p.recentlyConquered > 0) {
        loyaltyChange -= 5;
        p.recentlyConquered--;
      }
      if (realm.gold <= 0 || realm.food <= 0) loyaltyChange -= 10;

      p.loyalty = Math.max(0, Math.min(100, p.loyalty + loyaltyChange));
      
      if (p.loyalty < 10 && Math.random() < 0.15) {
        const loyalArmy = { ...p.army };
        const totalLoyalTroops = (loyalArmy.infantry || 0) + (loyalArmy.archers || 0) + (loyalArmy.cavalry || 0) + (loyalArmy.scouts || 0);

        if (totalLoyalTroops > 0) {
          const friendlyNeighbor = p.neighbors
            .map(nId => newState.provinces[nId])
            .find(n => n && n.ownerId === realm.id && n.id !== p.id);
          const capitalP = realm.capitalId ? newState.provinces[realm.capitalId] : null;
          const safeCapital = capitalP && capitalP.ownerId === realm.id && capitalP.id !== p.id ? capitalP : null;
          const fallbackProv = Object.values(newState.provinces).find(other => other.ownerId === realm.id && other.id !== p.id);

          const destProv = friendlyNeighbor || safeCapital || fallbackProv;

          if (destProv) {
            destProv.army.infantry += loyalArmy.infantry || 0;
            destProv.army.archers += loyalArmy.archers || 0;
            destProv.army.cavalry += loyalArmy.cavalry || 0;
            destProv.army.scouts += loyalArmy.scouts || 0;
            destProv.troops = destProv.army.infantry + destProv.army.archers + destProv.army.cavalry + (destProv.army.scouts || 0);

            if (realm.id === state.playerRealmId) {
              newState.logs.push(`RECUO DE TROPAS: ${totalLoyalTroops} soldados em ${p.name} recuaram com segurança para ${destProv.name} devido à rebelião.`);
            }
          } else if (realm.id === state.playerRealmId) {
            newState.logs.push(`REBELIÃO: As tropas de ${p.name} foram desmobilizadas pois o reino não possui mais territórios seguros.`);
          }
        }

        newState.logs.push(`REBELIÃO: Instabilidade política levou à queda do governo em ${p.name}!`);
        p.ownerId = 'neutral';
        p.loyalty = 40;
        p.stability = Math.max(5, (p.stability || 70) - 20);
        p.army = { infantry: 10, archers: 5, cavalry: 0, scouts: 0 };
        p.troops = 15;
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
      
      const techEconomyBonus = getTechBonus(realm, 'economy');
      goldIncome += (p.wealth + (p.buildings.mines * BUILDING_PRODUCTION.mines)) * efficiency * (1 + techEconomyBonus) * govStats.goldIncome;
      foodIncome += (p.foodProduction + (p.buildings.farms * BUILDING_PRODUCTION.farms)) * efficiency * (1 + techEconomyBonus) * govStats.foodProduction;
      materialIncome += (p.materialProduction + (p.buildings.workshops * BUILDING_PRODUCTION.workshops)) * efficiency * (1 + techEconomyBonus);

      // Strategic bonuses
      if (p.strategicResource === 'iron') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'wood') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'horse') foodIncome += 5 * efficiency;
      if (p.strategicResource === 'stone') materialIncome += 5 * efficiency;

      if (p.population < p.maxPopulation) {
        const potentialGrowth = Math.floor(p.population * 0.07 * efficiency * govStats.populationGrowth);
        const growth = Math.max(1, potentialGrowth);
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

    // Fase 2 — Estatísticas de tracking (tela de derrota)
    realm.cumulativeGold = (realm.cumulativeGold || 0) + realm.gold;
    realm.maxProvincesHeld = Math.max(realm.maxProvincesHeld || 0, ownedProvinces.length);

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
    
    // Reset action points (Fase 2 — governo Tribal: -1 AP; piso 2)
    realm.maxActionPoints = Math.max(2, 10 + (realm.techLevels?.movement ?? 0) * 0.5 + (realm.government === 'tribal' ? -1 : 0));
    realm.actionPoints = Math.floor(realm.maxActionPoints);

    if (realm.gold < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.gold * 10), 'gold', newState);
    }
    if (realm.food < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.food * 5), 'food', newState);
    }
  });

  // Fase 2 — Governo: revolução (estabilidade <20 em >50% das províncias)
  Object.values(newState.realms).forEach(r => {
    if (r.id === 'neutral' || r.isPlayer) return;
    const newGov = checkRevolution(r, newState);
    if (newGov) {
      r.government = newGov;
      newState.logs.push(`REVOLUÇÃO: ${r.name} adotou o governo ${GOVERNMENT_STATS[newGov].name}.`);
    }
  });

  processMarchOrders(newState);
  processCoalitions(newState);
  processVassalLiberty(newState); // Fase 2 — Liberty desire dos vassalos
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

export function buildCampaignFullPath(
  state: GameState,
  originId: string,
  waypoints: string[],
  playerRealmId: string
): string[] {
  let fullPath: string[] = [];
  let currentPos = originId;

  for (const wpId of waypoints) {
    const segment = findPath(state, currentPos, wpId, playerRealmId, false, true);
    if (segment.length > 0) {
      fullPath = [...fullPath, ...segment];
      currentPos = wpId;
    } else {
      const currentProv = state.provinces[currentPos];
      if (currentProv && currentProv.neighbors.includes(wpId)) {
        fullPath.push(wpId);
        currentPos = wpId;
      }
    }
  }

  return fullPath;
}

