import { GameState, Realm, Province, StrategicAssessment } from '../types';
import { ACTION_COSTS } from './constants';
import { executeAttack } from './combatLogic.ts';
import { executeBuilding, executeRecruitment } from './economyLogic.ts';

export function processAITurn(state: GameState, realmId: string) {
  const realm = state.realms[realmId];
  if (!realm || realm.isPlayer) return;

  const provinces = Object.values(state.provinces).filter(p => p.ownerId === realmId);
  if (provinces.length === 0) return;

  const assessment = analyzeRealmStrategy(state, realm, provinces);
  
  // Internal Affairs (Always important)
  manageInternalAffairsAI(state, realm, assessment);

  // Personality based logic
  switch (realm.personality) {
    case 'expansionist':
      handleExpansionistAI(state, realm, provinces, realm.actionPoints, assessment);
      break;
    case 'defensive':
      handleDefensiveAI(state, realm, provinces, realm.actionPoints, assessment);
      break;
    case 'diplomatic':
      handleDiplomaticAI(state, realm, provinces, realm.actionPoints, assessment);
      break;
    case 'opportunistic':
      handleOpportunisticAI(state, realm, provinces, realm.actionPoints, assessment);
      break;
    case 'commercial':
      handleCommercialAI(state, realm, provinces, realm.actionPoints, assessment);
      break;
  }
}

export function processVassalTurn(state: GameState, vassalId: string) {
  const realm = state.realms[vassalId];
  if (!realm) return;

  const provinces = Object.values(state.provinces).filter(p => p.ownerId === vassalId);
  if (provinces.length === 0) return;

  const assessment = analyzeRealmStrategy(state, realm, provinces);
  manageInternalAffairsAI(state, realm, assessment);
  handleDefensiveAI(state, realm, provinces, realm.actionPoints, assessment);
}

function analyzeRealmStrategy(state: GameState, realm: Realm, provinces: Province[]): StrategicAssessment {
  const assessment: StrategicAssessment = {
    threatenedBorders: [],
    offensiveTargets: [],
    wealthState: realm.gold > 500 ? 'rich' : realm.gold < 100 ? 'poor' : 'stable',
    militaryState: 'stable',
    safeInternal: [],
    strategicResourceTargets: [],
    rivalProvinces: []
  };

  const totalTroops = provinces.reduce((sum, p) => sum + p.troops, 0);
  const avgTroops = totalTroops / provinces.length;
  assessment.militaryState = avgTroops > 100 ? 'strong' : avgTroops < 40 ? 'weak' : 'stable';

  const rivalRealmId = realm.objective === 'destroy_rival' 
    ? (Object.keys(state.realms).find(id => id !== realm.id && !state.realms[id].isPlayer) || state.playerRealmId)
    : null;

  provinces.forEach(p => {
    let isBorder = false;
    let maxNeighborThreat = 0;

    p.neighbors.forEach(nId => {
      const n = state.provinces[nId];
      if (n.ownerId !== realm.id) {
        isBorder = true;
        
        // General Threats
        if (n.ownerId !== 'neutral') {
          const nRealm = state.realms[n.ownerId];
          if (nRealm && (realm.wars.includes(n.ownerId) || realm.relations[n.ownerId] < -20)) {
            maxNeighborThreat = Math.max(maxNeighborThreat, n.troops);
          }
        }

        // Objective: Resource Control
        if (realm.objective === 'resource_control' && n.strategicResource && n.strategicResource !== 'none') {
          assessment.strategicResourceTargets.push(n);
        }

        // Objective: Destroy Rival
        if (rivalRealmId && n.ownerId === rivalRealmId) {
          assessment.rivalProvinces.push(n);
        }

        // Offensive Targets
        if (n.ownerId !== realm.id && n.troops < p.troops * 0.7) {
          assessment.offensiveTargets.push(n);
        }
      }
    });

    if (isBorder) {
      if (maxNeighborThreat > p.troops * 1.1) assessment.threatenedBorders.push(p);
    } else {
      assessment.safeInternal.push(p);
    }
  });

  return assessment;
}

function handleExpansionistAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  
  // Decide target based on objective
  let targetProv: Province | undefined;
  if (realm.objective === 'destroy_rival' && assessment.rivalProvinces.length > 0) {
    targetProv = assessment.rivalProvinces[0];
  } else if (realm.objective === 'resource_control' && assessment.strategicResourceTargets.length > 0) {
    targetProv = assessment.strategicResourceTargets[0];
  } else {
    targetProv = assessment.offensiveTargets[0];
  }

  if (realm.objective === 'wealth' && currentAp >= ACTION_COSTS.attack) {
     // Wealth objective: Only attack if we are already at war, otherwise save AP for economy
     if (!realm.wars.includes(targetProv?.ownerId || '')) targetProv = undefined;
  }

  if (targetProv && currentAp >= ACTION_COSTS.attack) {
    const sourceProv = provinces.find(p => p.neighbors.includes(targetProv!.id) && p.troops > targetProv!.troops * 1.3);
    
    if (sourceProv) {
      if (!realm.wars.includes(targetProv.ownerId) && targetProv.ownerId !== 'neutral') {
        const targetRealm = state.realms[targetProv.ownerId];
        if (targetRealm) {
          // Declare Formal War logic handled here or in combatLogic
          realm.wars.push(targetProv.ownerId);
          targetRealm.wars.push(realm.id);
          
          if (!state.activeWars) state.activeWars = [];
          state.activeWars.push({
            id: `war_${Date.now()}_${realm.id}_${targetProv.ownerId}`,
            attackerId: realm.id,
            defenderId: targetProv.ownerId,
            startedAtTurn: state.turn,
            warScore: 0,
            attackerExhaustion: 0,
            defenderExhaustion: 0
          });

          state.logs.push(`GUERRA: ${realm.name} iniciou ofensiva contra ${targetRealm.name} por ${realm.objective === 'destroy_rival' ? 'vingança' : 'expansão'}.`);
        }
      }
      executeAttack(state, realm, sourceProv, targetProv);
      currentAp -= ACTION_COSTS.attack;
    }
  }

  if (currentAp >= ACTION_COSTS.recruit) {
    const recruitTarget = assessment.threatenedBorders[0] || provinces[0];
    executeRecruitment(state, realm, recruitTarget);
    currentAp -= ACTION_COSTS.recruit;
  }
  
  realm.actionPoints = currentAp;
}

function handleDefensiveAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  
  if (assessment.safeInternal.length > 0 && assessment.threatenedBorders.length > 0) {
     for (const safeProv of assessment.safeInternal) {
        if (currentAp < ACTION_COSTS.move) break;
        if (safeProv.troops > 30) {
           const validNeighbors = safeProv.neighbors.filter(nId => state.provinces[nId].ownerId === realm.id);
           const target = validNeighbors.find(nId => assessment.threatenedBorders.includes(state.provinces[nId])) || validNeighbors[0];
           if (target) {
              const targetProv = state.provinces[target];
              const t = { ...safeProv.army, scouts: 0 };
              const moveInf = Math.floor(t.infantry * 0.5);
              const moveArc = Math.floor(t.archers * 0.5);
              const moveCav = Math.floor(t.cavalry * 0.5);
              
              safeProv.army.infantry -= moveInf;
              safeProv.army.archers -= moveArc;
              safeProv.army.cavalry -= moveCav;
              safeProv.troops = safeProv.army.infantry + safeProv.army.archers + safeProv.army.cavalry;
              
              targetProv.army.infantry += moveInf;
              targetProv.army.archers += moveArc;
              targetProv.army.cavalry += moveCav;
              targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
              
              currentAp -= ACTION_COSTS.move;
           }
        }
     }
  }

  const priorityProvinces = assessment.threatenedBorders.length > 0 ? assessment.threatenedBorders : provinces;
  for (const prov of priorityProvinces) {
    if (currentAp <= 0) break;
    
    // Defensive Block objective: Prioritize fortification even if not threatened
    const needsFortify = (assessment.threatenedBorders.includes(prov) || realm.objective === 'defensive_block') && prov.defense < 5;
    
    if (needsFortify && currentAp >= ACTION_COSTS.build) {
       if (executeBuilding(state, realm, prov, 'fortify')) {
          currentAp -= ACTION_COSTS.build;
          state.logs.push(`${realm.name} reforçou as defesas em ${prov.name} seguindo seu plano defensivo.`);
       }
    } else if (currentAp >= ACTION_COSTS.recruit) {
      executeRecruitment(state, realm, prov);
      currentAp -= ACTION_COSTS.recruit;
    }
  }
  realm.actionPoints = currentAp;
}

function handleDiplomaticAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  const otherRealms = Object.values(state.realms).filter(r => r.id !== realm.id);
  
  for (const warEnemyId of realm.wars) {
    if (currentAp < ACTION_COSTS.diplomacy) break;
    
    // Find Formal War object
    const war = state.activeWars?.find(w => 
      (w.attackerId === realm.id && w.defenderId === warEnemyId) ||
      (w.attackerId === warEnemyId && w.defenderId === realm.id)
    );
    
    if (!war) continue;
    const isAttacker = war.attackerId === realm.id;
    const ourExhaustion = isAttacker ? war.attackerExhaustion : war.defenderExhaustion;
    const theirExhaustion = isAttacker ? war.defenderExhaustion : war.attackerExhaustion;
    const ourScore = isAttacker ? war.warScore : -war.warScore;
    
    // AI offers peace if:
    // 1. Exhaustion is very high (>70)
    // 2. WarScore is very low (<-50)
    // 3. Situation is desperate (exhaustion > 50 AND score < -20)
    const desperate = ourExhaustion > 70 || ourScore < -50 || (ourExhaustion > 50 && ourScore < -20);
    
    if (desperate) {
       const enemyRealm = state.realms[warEnemyId];
       if (enemyRealm) {
         // Formalize peace
         realm.wars = realm.wars.filter(id => id !== warEnemyId);
         enemyRealm.wars = enemyRealm.wars.filter(id => id !== realm.id);
         state.activeWars = state.activeWars.filter(w => w.id !== war.id);
         
         // Set truce
         if (!realm.memory[warEnemyId]) {
           realm.memory[warEnemyId] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: state.turn, warExhaustion: 0, truces: {} };
         }
         if (!enemyRealm.memory[realm.id]) {
           enemyRealm.memory[realm.id] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: state.turn, warExhaustion: 0, truces: {} };
         }
         
         realm.memory[warEnemyId].truces[warEnemyId] = state.turn + 15;
         enemyRealm.memory[realm.id].truces[realm.id] = state.turn + 15;
         
         state.logs.push(`PAZ: ${realm.name} implorou por cessar-fogo com ${enemyRealm.name} devido à exaustão.`);
         currentAp -= ACTION_COSTS.diplomacy;
       }
    }
  }

  for (const other of otherRealms) {
    if (currentAp < ACTION_COSTS.diplomacy) break;
    if (realm.wars.includes(other.id)) continue;
    
    const relations = realm.relations[other.id] || 0;
    if (relations > 20 && !realm.pacts.includes(other.id)) {
      realm.pacts.push(other.id);
      other.pacts.push(realm.id);
      currentAp -= ACTION_COSTS.diplomacy;
      state.logs.push(`${realm.name} teceu um pacto de não agressão com ${other.name}.`);
    } else if (relations > 50 && realm.objective === 'defensive_block' && !realm.alliances.includes(other.id)) {
      realm.alliances.push(other.id);
      other.alliances.push(realm.id);
      currentAp -= ACTION_COSTS.diplomacy;
      state.logs.push(`ALIANÇA: ${realm.name} formou uma forte aliança defensiva com ${other.name}.`);
    } else if (relations < 0 && realm.gold > 100) {
      realm.gold -= 50;
      realm.relations[other.id] += 15;
      currentAp -= ACTION_COSTS.diplomacy;
    }
  }
  
  if (currentAp >= ACTION_COSTS.recruit && assessment.threatenedBorders.length > 0) {
    executeRecruitment(state, realm, assessment.threatenedBorders[0]);
    currentAp -= ACTION_COSTS.recruit;
  }
  
  realm.actionPoints = currentAp;
}

function handleOpportunisticAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  const borders = [...assessment.offensiveTargets, ...assessment.threatenedBorders, ...provinces].filter((v, i, a) => a.indexOf(v) === i);
  
  for (const prov of borders) {
    if (currentAp <= 0) break;
    const targets = prov.neighbors.map(nId => state.provinces[nId]).filter(n => {
        if (!n || n.ownerId === realm.id) return false;
        const targetRealm = state.realms[n.ownerId];
        return n.troops < prov.troops * 0.7 || (targetRealm && targetRealm.wars.length > 0);
      });

    if (targets.length > 0 && currentAp >= ACTION_COSTS.attack) {
      const targetProv = targets[0];
      const targetRealmId = targetProv.ownerId;
      if (!realm.wars.includes(targetRealmId) && state.realms[targetRealmId]) {
         realm.wars.push(targetRealmId);
         state.realms[targetRealmId].wars.push(realm.id);
         state.logs.push(`OPORTUNISMO: ${realm.name} atacou ${state.realms[targetRealmId].name} abruptamente aproveitando de sua fraqueza!`);
      }
      executeAttack(state, realm, prov, targetProv);
      currentAp -= ACTION_COSTS.attack;
    }
  }
  realm.actionPoints = currentAp;
}

function handleCommercialAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  if (currentAp >= ACTION_COSTS.diplomacy && realm.gold > 100) {
    const potentialPartners = Object.values(state.realms).filter(r => r.id !== realm.id && realm.relations[r.id] > 0);
    if (potentialPartners.length > 0) {
      const partner = potentialPartners[0];
      const myProv = provinces[0];
      const theirProv = Object.values(state.provinces).find(p => p.ownerId === partner.id);
      if (myProv && theirProv) {
        realm.tradeRoutes.push({ fromProvinceId: myProv.id, toProvinceId: theirProv.id });
        currentAp -= ACTION_COSTS.diplomacy;
        realm.gold -= 50;
        state.logs.push(`${realm.name} expandiu comércio e ouro, traçando rotas com ${partner.name}.`);
      }
    }
  }
  realm.actionPoints = currentAp;
}

function manageInternalAffairsAI(state: GameState, realm: Realm, assessment: StrategicAssessment) {
  const owned = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  for (const prov of owned) {
    if (realm.actionPoints < ACTION_COSTS.build) break;
    
    // Wealth Objective: Extra focus on mines and workshops
    const isWealthObjective = realm.objective === 'wealth';
    const buildThreshold = isWealthObjective ? 200 : 100;

    if (prov.loyalty < 45) {
       if (executeBuilding(state, realm, prov, 'courts')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
    if ((realm.food < buildThreshold) && prov.population > prov.maxPopulation * 0.4) {
       if (executeBuilding(state, realm, prov, 'farms')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
    if (realm.gold < buildThreshold || isWealthObjective) {
       if (prov.buildings.mines < 5 && executeBuilding(state, realm, prov, 'mines')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
    if (realm.materials < buildThreshold) {
       if (executeBuilding(state, realm, prov, 'workshops')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
  }
}
