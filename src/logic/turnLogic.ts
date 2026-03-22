import { GameState, Realm, Province } from '../types';
import { ACTION_COSTS, UNIT_STATS, BUILDING_PRODUCTION } from './game-constants';
import { handleResourceDeficit } from './economyLogic';

export function calculateVisibility(state: GameState): string[] {
  const visible = new Set<string>();
  const playerProvinces = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
  
  const hasScouts = playerProvinces.some(p => (p.army?.scouts || 0) > 0);
  const hasScoutOrders = (state.marchOrders || []).some(
    o => o.realmId === state.playerRealmId && o.isScoutMission
  );
  
  if (hasScouts || hasScoutOrders) {
    return Object.keys(state.provinces);
  }
  
  playerProvinces.forEach(p => {
    visible.add(p.id);
    (p.neighbors || []).forEach(nId => visible.add(nId));
  });
  
  (state.marchOrders || []).filter(o => o.realmId === state.playerRealmId).forEach(o => {
    visible.add(o.currentProvId);
    const prov = state.provinces[o.currentProvId];
    if (prov) (prov.neighbors || []).forEach(nId => visible.add(nId));
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

  if (state.settings.victoryCondition === 'vassalage') {
    for (const realmId in realmVassals) {
      if (realmVassals[realmId] >= state.settings.numRealms / 2) {
        return {
          winnerId: realmId,
          reason: `${state.realms[realmId].name} unificou o reino através da vassalagem!`
        };
      }
    }
  }

  const activeRealms = Object.keys(provinceCounts);
  if (activeRealms.length === 1) {
    return {
      winnerId: activeRealms[0],
      reason: `${state.realms[activeRealms[0]].name} é o último reino soberano.`
    };
  }

  if (state.settings.victoryCondition === 'diplomatic') {
    for (const realmId in state.realms) {
      const realm = state.realms[realmId];
      const otherRealms = Object.keys(state.realms).filter(id => id !== realmId);
      const hasAlliancesWithAll = otherRealms.length > 0 && otherRealms.every(id => realm.alliances.includes(id));
      
      if (hasAlliancesWithAll) {
        return {
          winnerId: realmId,
          reason: `${realm.name} unificou o continente através da diplomacia!`
        };
      }
    }
  }

  return null;
}

export function findPath(
  state: GameState,
  fromId: string,
  toId: string,
  realmId: string,
  isScout = false
): string[] {
  if (fromId === toId) return [];
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

      const canTraverse = isScout || neighbor.ownerId === realmId || nId === toId;
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
  const toRemove: string[] = [];

  state.marchOrders.forEach(order => {
    if (order.remainingPath.length === 0) {
      const prov = state.provinces[order.currentProvId];
      if (prov) {
        if (!order.isScoutMission) {
          if (prov.ownerId === order.realmId) {
            prov.army.infantry += order.troops.infantry;
            prov.army.archers += order.troops.archers;
            prov.army.cavalry += order.troops.cavalry;
            prov.army.scouts += order.troops.scouts;
            prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts;
            if (order.realmId === state.playerRealmId) {
              state.logs.push(`Tropas chegaram em ${prov.name}.`);
            }
          }
        } else {
          const friendlyNeighbor = prov.neighbors
            .map(nId => state.provinces[nId])
            .find(n => n && n.ownerId === order.realmId);
          const depositProv = friendlyNeighbor || prov;
          if (depositProv.ownerId === order.realmId) {
            depositProv.army.scouts += order.troops.scouts;
            depositProv.troops += order.troops.scouts;
          }
          if (order.realmId === state.playerRealmId) {
            state.logs.push(`Batedores completaram missão de reconhecimento.`);
          }
        }
      }
      toRemove.push(order.id);
      return;
    }

    const nextProvId = order.remainingPath[0];
    const nextProv = state.provinces[nextProvId];

    if (!nextProv) {
      toRemove.push(order.id);
      return;
    }

    if (!order.isScoutMission && nextProv.ownerId !== order.realmId && nextProv.ownerId !== 'neutral') {
      const currentProv = state.provinces[order.currentProvId];
      if (currentProv && currentProv.ownerId === order.realmId) {
        currentProv.army.infantry += order.troops.infantry;
        currentProv.army.archers += order.troops.archers;
        currentProv.army.cavalry += order.troops.cavalry;
        currentProv.army.scouts += order.troops.scouts;
        currentProv.troops = currentProv.army.infantry + currentProv.army.archers + currentProv.army.cavalry + currentProv.army.scouts;
        if (order.realmId === state.playerRealmId) {
          state.logs.push(`Marcha interrompida: território inimigo bloqueou o caminho para ${nextProv.name}. Tropas retornaram.`);
        }
      }
      toRemove.push(order.id);
      return;
    }

    order.currentProvId = nextProvId;
    order.remainingPath = order.remainingPath.slice(1);
  });

  state.marchOrders = state.marchOrders.filter(o => !toRemove.includes(o.id));
}

function processCoalitions(state: GameState) {
  const totalProvinces = Object.keys(state.provinces).length;
  const realms = Object.values(state.realms);
  
  realms.forEach(threat => {
    const ownedCount = Object.values(state.provinces).filter(p => p.ownerId === threat.id).length;
    const isThreat = ownedCount > totalProvinces * 0.3;
    
    if (isThreat) {
      const existingCoalition = state.coalitions.find(c => c.targetId === threat.id);
      if (!existingCoalition) {
        const members = realms.filter(r => r.id !== threat.id && r.relations[threat.id] < 0).map(r => r.id);
        if (members.length >= 2) {
          state.coalitions.push({ targetId: threat.id, members });
          state.logs.push(`Uma coalizão defensiva foi formada contra ${threat.name}!`);
          members.forEach(mId => {
             const m = state.realms[mId];
             if(m) m.isCoalitionMember = threat.id;
          });
        }
      }
    } else {
      state.coalitions = state.coalitions.filter(c => c.targetId !== threat.id);
      realms.forEach(r => { if (r.isCoalitionMember === threat.id) delete r.isCoalitionMember; });
    }
  });
}

function processActiveWars(state: GameState) {
  if (!state.activeWars) state.activeWars = [];
  
  state.activeWars.forEach(war => {
    // Passive exhaustion from war duration
    war.attackerExhaustion = Math.min(100, war.attackerExhaustion + 1);
    war.defenderExhaustion = Math.min(100, war.defenderExhaustion + 1);
    
    // Low supply/famine adds extra exhaustion
    const attacker = state.realms[war.attackerId];
    const defender = state.realms[war.defenderId];
    
    if (attacker && (attacker.food <= 0 || attacker.gold <= 0)) {
      war.attackerExhaustion = Math.min(100, war.attackerExhaustion + 2);
    }
    if (defender && (defender.food <= 0 || defender.gold <= 0)) {
      war.defenderExhaustion = Math.min(100, war.defenderExhaustion + 2);
    }
    
    // Sync war state with Realm legacy arrays (for backward compatibility if needed)
    if (attacker && !attacker.wars.includes(war.defenderId)) attacker.wars.push(war.defenderId);
    if (defender && !defender.wars.includes(war.attackerId)) defender.wars.push(war.attackerId);
  });
}

function handleRandomEvents(state: GameState) {
  state.currentEvent = null;
  if (Math.random() < 0.25) {
    const events = [
      { name: "Colheita Farta", description: "Uma temporada de clima perfeito impulsionou a produção de alimentos.", type: 'positive' as const },
      { name: "Peste", description: "Uma doença misteriosa está se espalhando por regiões superpovoadas.", type: 'negative' as const },
      { name: "Corrida do Ouro", description: "Novos veios de ouro foram descobertos em terras estáveis.", type: 'positive' as const },
      { name: "Revolta Camponesa", description: "Impostos altos e abandono levaram camponeses a pegar em armas.", type: 'negative' as const },
      { name: "Avanço Diplomático", description: "Um grande banquete melhorou as relações.", type: 'positive' as const },
      { name: "Sede Administrativa", description: "A eficiência da capital inspira províncias vizinhas.", type: 'positive' as const }
    ];
    
    const provIds = Object.keys(state.provinces);
    const randomProv = state.provinces[provIds[Math.floor(Math.random() * provIds.length)]];
    const realm = state.realms[randomProv.ownerId];

    let event = events[Math.floor(Math.random() * events.length)];
    
    if (event.name === "Peste" && randomProv.population < randomProv.maxPopulation * 0.7) event = events[0];
    if (event.name === "Revolta Camponesa" && randomProv.loyalty > 40) event = events[4];
    if (event.name === "Sede Administrativa" && realm && realm.overextension > 30) {
       event = { name: "Crise de Gestão", description: "O peso do império está esmagando a burocracia central.", type: 'negative' as const };
    }

    state.currentEvent = event;
    state.logs.push(`EVENTO: ${event.name} - ${event.description}`);

    if (event.name === "Colheita Farta") {
      Object.values(state.realms).forEach(r => { r.food += 100; });
    } else if (event.name === "Peste") {
       randomProv.population = Math.floor(randomProv.population * 0.7);
       state.logs.push(`A peste atingiu severamente ${randomProv.name}.`);
    } else if (event.name === "Corrida do Ouro" && realm) {
      realm.gold += 200;
    } else if (event.name === "Revolta Camponesa") {
      randomProv.loyalty = Math.max(0, randomProv.loyalty - 30);
      randomProv.troops = Math.max(0, randomProv.troops - 10);
      state.logs.push(`Instabilidade cresce em ${randomProv.name}!`);
    } else if (event.name === "Avanço Diplomático") {
      Object.values(state.realms).forEach(r => {
        Object.keys(r.relations).forEach(otherId => {
          r.relations[otherId] = Math.min(100, r.relations[otherId] + 10);
        });
      });
    } else if (event.name === "Crise de Gestão" && realm) {
       realm.actionPoints = Math.max(0, realm.actionPoints - 5);
       realm.gold = Math.max(0, realm.gold - 100);
    }
  }
}

export function calculateAdminDistances(state: GameState, realmId: string): Record<string, number> {
  const distances: Record<string, number> = {};
  const realm = state.realms[realmId];
  if (!realm || !realm.capitalId) return distances;

  const queue: { id: string, dist: number }[] = [{ id: realm.capitalId, dist: 0 }];
  distances[realm.capitalId] = 0;

  while (queue.length > 0) {
    const { id, dist } = queue.shift()!;
    const prov = state.provinces[id];
    
    prov.neighbors.forEach(nId => {
      const neighbor = state.provinces[nId];
      if (neighbor && neighbor.ownerId === realmId && distances[nId] === undefined) {
        distances[nId] = dist + 1;
        queue.push({ id: nId, dist: dist + 1 });
      }
    });
  }

  return distances;
}

export function processEndOfTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    const distances = calculateAdminDistances(newState, realm.id);
    
    realm.actionPoints = realm.maxActionPoints;

    if (realm.overextension > 0) {
      realm.overextension = Math.max(0, realm.overextension - 5);
    }

    Object.values(realm.memory).forEach(mem => {
      mem.betrayal = Math.max(0, mem.betrayal - 2);
      mem.aggression = Math.max(0, mem.aggression - 2);
      mem.help = Math.max(0, mem.help - 1);
    });

    realm.wars.forEach(enemyId => {
      if (realm.memory[enemyId]) {
        realm.memory[enemyId].warExhaustion = Math.min(100, (realm.memory[enemyId].warExhaustion || 0) + 2);
      }
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

      const dist = distances[p.id] || 0;
      // Administrative Distance Penalty: -2 per node away from capital
      // Courts reduce this penalty
      const adminPenalty = Math.max(0, (dist * 2) - p.buildings.courts);
      loyaltyChange -= adminPenalty;
      
      // Overextension Penalty: -1 per 10 points
      loyaltyChange -= Math.floor(realm.overextension / 10);

      if (p.id === realm.capitalId) loyaltyChange += 10;
      
      if (p.recentlyConquered > 0) {
        loyaltyChange -= 5;
        p.recentlyConquered--;
      }
      if (realm.gold <= 0 || realm.food <= 0) loyaltyChange -= 10;

      p.loyalty = Math.max(0, Math.min(100, p.loyalty + loyaltyChange));
      
      // Rebellion Check (Systemic flipping)
      if (p.loyalty < 10 && Math.random() < 0.15) {
        newState.logs.push(`REBELIÃO: Instabilidade política levou à queda do governo em ${p.name}!`);
        p.ownerId = 'neutral';
        p.loyalty = 40;
        p.army.infantry = Math.floor(p.army.infantry * 0.4) + 10;
        p.army.archers = Math.floor(p.army.archers * 0.4);
        p.army.cavalry = Math.floor(p.army.cavalry * 0.4);
        p.troops = p.army.infantry + p.army.archers + p.army.cavalry + (p.army.scouts || 0);
      }

      const loyaltyFactor = 0.5 + (p.loyalty / 200);
      const efficiency = (0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor;
      
      goldIncome += (p.wealth + (p.buildings.mines * BUILDING_PRODUCTION.mines)) * efficiency;
      foodIncome += (p.foodProduction + (p.buildings.farms * BUILDING_PRODUCTION.farms)) * efficiency;
      materialIncome += (p.materialProduction + (p.buildings.workshops * BUILDING_PRODUCTION.workshops)) * efficiency;

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

      if (p.loyalty < 25 && Math.random() < 0.1) {
        const rebelPower = Math.floor(p.population * 0.05);
        if (rebelPower > p.troops) {
           p.army = { infantry: 0, archers: 0, cavalry: 0, scouts: 0 };
           p.troops = 0;
           p.population = Math.floor(p.population * 0.7);
           p.loyalty = 40;
           p.buildings.farms = Math.max(0, p.buildings.farms - 1);
           p.recentlyConquered = 5;
           newState.logs.push(`REBELIÃO: O povo de ${p.name} expulsou suas tropas!`);
        } else {
           p.population -= Math.floor(p.population * 0.05);
           p.army.infantry = Math.max(0, p.army.infantry - Math.floor(p.army.infantry * 0.2));
           p.troops = p.army.infantry + p.army.archers + p.army.cavalry;
           newState.logs.push(`MOTIM: Uma revolta em ${p.name} foi reprimida.`);
        }
      }
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
    const difficulty = newState.settings.aiDifficulty;
    let difficultyMultiplier = 1;
    if (!realm.isPlayer) {
      if (difficulty === 'easy') difficultyMultiplier = 0.8;
      if (difficulty === 'hard') difficultyMultiplier = 1.3;
    }

    goldIncome *= oePenalty * difficultyMultiplier;
    foodIncome *= oePenalty * difficultyMultiplier;
    materialIncome *= oePenalty * difficultyMultiplier;

    const tradeIncome = realm.tradeRoutes.reduce((sum, route) => {
      const p1 = newState.provinces[route.fromProvinceId];
      const p2 = newState.provinces[route.toProvinceId];
      if (!p1 || !p2) return sum;
      return sum + Math.floor((p1.wealth + p2.wealth) * 0.5);
    }, 0);

    realm.gold += Math.floor(goldIncome + tradeIncome - goldMaintenance);
    realm.food += Math.floor(foodIncome - foodMaintenance);
    realm.materials += Math.floor(materialIncome);

    if (realm.gold < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.gold * 10), 'gold', newState);
    }
    if (realm.food < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.food * 5), 'food', newState);
    }

    Object.keys(realm.relations).forEach(otherId => {
      if (realm.relations[otherId] > 0) realm.relations[otherId] -= 1;
      if (realm.relations[otherId] < 0) realm.relations[otherId] += 1;

      const hasTrade = realm.tradeRoutes.some(r => {
        const p1 = newState.provinces[r.fromProvinceId];
        const p2 = newState.provinces[r.toProvinceId];
        return (p1 && p2) && ((p1.ownerId === realm.id && p2.ownerId === otherId) || 
               (p1.ownerId === otherId && p2.ownerId === realm.id));
      });
      if (hasTrade) realm.relations[otherId] += 3;

      const mem = realm.memory[otherId];
      if (mem) {
        realm.relations[otherId] -= (mem.betrayal * 0.5 + mem.aggression * 0.3);
        realm.relations[otherId] += mem.help * 0.2;
      }

      realm.relations[otherId] = Math.max(-100, Math.min(100, realm.relations[otherId]));
    });
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
