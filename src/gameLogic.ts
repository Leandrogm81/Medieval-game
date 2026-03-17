import * as d3 from 'd3';
import { GameState, Province, Realm, Terrain, GameEvent, Army, StrategicResource, PersonalityType, StrategicObjective, DiplomaticMemory, Coalition, GameSettings, VictoryCondition, UnitType } from './types';

const REALM_NAMES = ["Avalon", "Eldoria", "Thalassa", "Gondor", "Rohan", "Mercia", "Wessex", "Northumbria"];
const REALM_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];
const PROVINCE_NAMES = [
  "Aethelgard", "Blythe", "Cairn", "Dunwich", "Eversong", "Falkreath", "Glimmer", "Hearth",
  "Ilium", "Jorvik", "Kaelen", "Lothian", "Mourn", "Nessa", "Oakhaven", "Prydwen",
  "Qarth", "Riven", "Storms End", "Tarn", "Ulthuan", "Valeria", "Winterfell", "Xanadu",
  "Ysgard", "Zendikar", "Aldor", "Bael", "Cormyr", "Dalaran"
];
const STRATEGIC_RESOURCES: StrategicResource[] = ['none', 'iron', 'wood', 'horse', 'stone'];

export const UNIT_STATS = {
  infantry: { 
    cost: { gold: 10, food: 5, materials: 2, pop: 10 }, 
    maintenance: { gold: 1, food: 1 },
    attack: 1.0, defense: 1.5, speed: 1 
  },
  archers: { 
    cost: { gold: 15, food: 5, materials: 10, pop: 10 }, 
    maintenance: { gold: 1, food: 1 },
    attack: 1.2, defense: 1.2, speed: 1,
    requires: 'wood' as StrategicResource
  },
  cavalry: { 
    cost: { gold: 30, food: 15, materials: 15, pop: 15 }, 
    maintenance: { gold: 3, food: 2 },
    attack: 2.0, defense: 1.0, speed: 2,
    requires: 'horse' as StrategicResource
  }
};

export const ACTION_COSTS = {
  move: 2,
  recruit: 1,
  attack: 4,
  build: 2,
  diplomacy: 2
};

const PERSONALITIES: PersonalityType[] = ['expansionist', 'defensive', 'diplomatic', 'opportunistic', 'commercial'];
const OBJECTIVES: StrategicObjective[] = ['regional_dominance', 'destroy_rival', 'wealth', 'resource_control', 'defensive_block'];

export function calculateVisibility(state: GameState): string[] {
  const visible = new Set<string>();
  const playerProvinces = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
  
  playerProvinces.forEach(p => {
    visible.add(p.id);
    p.neighbors.forEach(nId => visible.add(nId));
  });
  
  return Array.from(visible);
}

export function generateInitialState(width: number, height: number, settings: GameSettings): GameState {
  console.log("Generating initial state...");
  try {
    const { numProvinces, numRealms, resourceDensity } = settings;
    // Generate random points
    let points = Array.from({ length: numProvinces }, () => [Math.random() * width, Math.random() * height] as [number, number]);

    // Lloyd's relaxation for better province shapes
    for (let i = 0; i < 3; i++) {
      const delaunay = d3.Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      points = points.map((_, j) => {
        const polygon = voronoi.cellPolygon(j);
        if (!polygon) return points[j];
        return [d3.polygonCentroid(polygon)[0], d3.polygonCentroid(polygon)[1]] as [number, number];
      });
    }

    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    const realms: Record<string, Realm> = {};
    for (let i = 0; i < numRealms; i++) {
      realms[`realm_${i}`] = {
        id: `realm_${i}`,
        name: REALM_NAMES[i],
        color: REALM_COLORS[i],
        gold: 200,
        food: 200,
        materials: 100,
        isPlayer: i === 0,
        actionPoints: 10,
        maxActionPoints: 10,
        overextension: 0,
        relations: {},
        memory: {},
        alliances: [],
        wars: [],
        pacts: [],
        tradeRoutes: [],
        personality: PERSONALITIES[i % PERSONALITIES.length],
        objective: OBJECTIVES[i % OBJECTIVES.length],
        vassals: []
      };
    }

    // Initialize relations and memory
    for (let i = 0; i < numRealms; i++) {
      for (let j = 0; j < numRealms; j++) {
        if (i !== j) {
          realms[`realm_${i}`].relations[`realm_${j}`] = 0;
          realms[`realm_${i}`].memory[`realm_${j}`] = {
            betrayal: 0,
            help: 0,
            aggression: 0,
            lastWarTurn: -1
          };
        }
      }
    }

    const provinces: Record<string, Province> = {};
    for (let i = 0; i < numProvinces; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;
      
      const neighbors = Array.from(voronoi.neighbors(i)).map(n => `prov_${n}`);
      const terrainRand = Math.random();
      const terrain: Terrain = terrainRand < 0.5 ? 'plains' : terrainRand < 0.8 ? 'forest' : 'mountain';
      
      // Base production based on terrain
      let wealth = Math.floor(Math.random() * 3) + 1;
      let foodProduction = Math.floor(Math.random() * 3) + 1;
      let materialProduction = Math.floor(Math.random() * 2) + 1;

      if (terrain === 'plains') foodProduction += 3;
      if (terrain === 'mountain') {
        wealth += 2;
        materialProduction += 2;
      }
      if (terrain === 'forest') materialProduction += 3;

      const pop = Math.floor(Math.random() * 500) + 500;
      const army: Army = {
        infantry: Math.floor(Math.random() * 30) + 20,
        archers: Math.floor(Math.random() * 15) + 5,
        cavalry: Math.floor(Math.random() * 5)
      };

      provinces[`prov_${i}`] = {
        id: `prov_${i}`,
        name: PROVINCE_NAMES[i % PROVINCE_NAMES.length],
        ownerId: `realm_${i % numRealms}`, // Distribute evenly initially
        army,
        troops: army.infantry + army.archers + army.cavalry,
        population: pop,
        maxPopulation: pop + 500,
        strategicResource: Math.random() < (resourceDensity === 'high' ? 0.6 : resourceDensity === 'low' ? 0.2 : 0.4) 
          ? STRATEGIC_RESOURCES[Math.floor(Math.random() * (STRATEGIC_RESOURCES.length - 1)) + 1] 
          : 'none',
        wealth,
        foodProduction,
        materialProduction,
        defense: Math.floor(Math.random() * 2),
        terrain,
        neighbors,
        polygon: polygon.map(p => [p[0], p[1]] as [number, number]),
        center: points[i],
        buildings: {
          farms: 0,
          mines: 0,
          workshops: 0
        }
      };
    }

    const initialState: GameState = {
      turn: 1,
      realms,
      provinces,
      playerRealmId: 'realm_0',
      logs: ["Bem-vindo ao Medieval Realms!", "Sua jornada rumo à glória começa agora."],
      currentEvent: null,
      visualEffects: [],
      coalitions: [],
      visibleProvinces: [],
      settings
    };

    initialState.visibleProvinces = calculateVisibility(initialState);
    console.log("Initial state generated successfully.");
    return initialState;
  } catch (error) {
    console.error("Error in generateInitialState:", error);
    throw error;
  }
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

  // Military Victory (Conquest)
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

  // Economic Victory
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

  // Vassalage Victory
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

  // Diplomatic Victory
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

export function resolveCombat(attackerArmy: Army, defenderArmy: Army, terrain: Terrain, defense: number): { attackerRemaining: Army, defenderRemaining: Army, won: boolean } {
  const calculatePower = (army: Army, isAttacker: boolean) => {
    let power = 0;
    power += army.infantry * (isAttacker ? UNIT_STATS.infantry.attack : UNIT_STATS.infantry.defense);
    power += army.archers * (isAttacker ? UNIT_STATS.archers.attack : UNIT_STATS.archers.defense);
    power += army.cavalry * (isAttacker ? UNIT_STATS.cavalry.attack : UNIT_STATS.cavalry.defense);
    return power;
  };

  let attackerPower = calculatePower(attackerArmy, true);
  let defenderPower = calculatePower(defenderArmy, false);

  // Terrain & Defense Bonuses
  let terrainBonus = 1.0;
  if (terrain === 'forest') {
    terrainBonus += 0.2;
    // Archers get extra bonus in forest
    defenderPower += defenderArmy.archers * 0.3;
  }
  if (terrain === 'mountain') {
    terrainBonus += 0.5;
    defenderPower += defenderArmy.archers * 0.5;
  }
  
  // Cavalry penalty in mountains/forest
  if (terrain !== 'plains') {
    attackerPower -= attackerArmy.cavalry * 0.5;
  } else {
    // Cavalry bonus in plains
    attackerPower += attackerArmy.cavalry * 0.5;
  }

  const defenseBonus = 1.0 + (defense * 0.15);
  const totalDefenderPower = defenderPower * terrainBonus * defenseBonus;
  
  // Random variation (±15%)
  const variation = () => 0.85 + Math.random() * 0.3;
  const finalAttackerPower = attackerPower * variation();
  const finalDefenderPower = totalDefenderPower * variation();

  if (finalAttackerPower > finalDefenderPower) {
    // Attacker wins
    const ratio = finalDefenderPower / finalAttackerPower;
    const attackerRemaining: Army = {
      infantry: Math.floor(attackerArmy.infantry * (1 - ratio * 0.8)),
      archers: Math.floor(attackerArmy.archers * (1 - ratio * 0.6)),
      cavalry: Math.floor(attackerArmy.cavalry * (1 - ratio * 0.7))
    };
    return { attackerRemaining, defenderRemaining: { infantry: 0, archers: 0, cavalry: 0 }, won: true };
  } else {
    // Defender wins
    const ratio = finalAttackerPower / finalDefenderPower;
    const defenderRemaining: Army = {
      infantry: Math.floor(defenderArmy.infantry * (1 - ratio * 0.5)),
      archers: Math.floor(defenderArmy.archers * (1 - ratio * 0.4)),
      cavalry: Math.floor(defenderArmy.cavalry * (1 - ratio * 0.3))
    };
    return { attackerRemaining: { infantry: 0, archers: 0, cavalry: 0 }, defenderRemaining, won: false };
  }
}

export function processAITurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    if (realm.isPlayer) return;
    if (realm.vassalOf) {
      // Vassals have limited autonomy
      // They mostly defend and recruit
      processVassalTurn(newState, realm);
      return;
    }
    
    let availableAPs = realm.actionPoints;
    
    // Difficulty scaling
    const difficulty = newState.settings.aiDifficulty;
    if (difficulty === 'easy') {
      availableAPs = Math.floor(availableAPs * 0.6);
    } else if (difficulty === 'hard') {
      availableAPs = Math.floor(availableAPs * 1.5);
    }
    
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    
    // 1. Strategic Assessment
    const totalMilitary = ownedProvinces.reduce((sum, p) => sum + p.troops, 0);
    const avgMilitaryPerProvince = totalMilitary / ownedProvinces.length;
    
    // 2. Personality-based Decision Making
    switch (realm.personality) {
      case 'expansionist':
        handleExpansionistAI(newState, realm, ownedProvinces, availableAPs);
        break;
      case 'defensive':
        handleDefensiveAI(newState, realm, ownedProvinces, availableAPs);
        break;
      case 'diplomatic':
        handleDiplomaticAI(newState, realm, ownedProvinces, availableAPs);
        break;
      case 'opportunistic':
        handleOpportunisticAI(newState, realm, ownedProvinces, availableAPs);
        break;
      case 'commercial':
        handleCommercialAI(newState, realm, ownedProvinces, availableAPs);
        break;
    }
  });
  
  return newState;
}

function processVassalTurn(state: GameState, realm: Realm) {
  // Vassals focus on defense and providing tribute (handled in end turn)
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  let availableGold = realm.gold;
  let availableAPs = realm.actionPoints;

  ownedProvinces.forEach(prov => {
    if (availableAPs >= ACTION_COSTS.recruit && availableGold >= 50) {
      // Simple recruitment for defense
      const amount = Math.min(Math.floor(availableGold / UNIT_STATS.infantry.cost.gold), 5);
      if (amount > 0) {
        prov.army.infantry += amount;
        prov.troops += amount;
        realm.gold -= amount * UNIT_STATS.infantry.cost.gold;
        availableAPs -= ACTION_COSTS.recruit;
      }
    }
  });
  realm.actionPoints = availableAPs;
}

function handleExpansionistAI(state: GameState, realm: Realm, provinces: Province[], ap: number) {
  // Expansionists prioritize attacking neighbors and recruiting
  let currentAp = ap;
  
  // Sort provinces by military strength
  const strongProvinces = [...provinces].sort((a, b) => b.troops - a.troops);
  
  for (const prov of strongProvinces) {
    if (currentAp <= 0) break;

    // Look for weak neighbors
    const targets = prov.neighbors
      .map(nId => state.provinces[nId])
      .filter(n => n && n.ownerId !== realm.id && !realm.alliances.includes(n.ownerId) && !realm.pacts.includes(n.ownerId))
      .sort((a, b) => a.troops - b.troops);

    if (targets.length > 0 && prov.troops > targets[0].troops * 1.2 && currentAp >= ACTION_COSTS.attack) {
      // Attack!
      executeAttack(state, realm, prov, targets[0]);
      currentAp -= ACTION_COSTS.attack;
    } else if (realm.gold > 100 && currentAp >= ACTION_COSTS.recruit) {
      // Recruit
      executeRecruitment(state, realm, prov);
      currentAp -= ACTION_COSTS.recruit;
    }
  }
  realm.actionPoints = currentAp;
}

function handleDefensiveAI(state: GameState, realm: Realm, provinces: Province[], ap: number) {
  // Defensive AI prioritizes building defenses and keeping troops at home
  let currentAp = ap;
  
  for (const prov of provinces) {
    if (currentAp <= 0) break;

    const isBorder = prov.neighbors.some(nId => state.provinces[nId].ownerId !== realm.id);
    
    if (isBorder && prov.defense < 3 && realm.materials >= 50 && currentAp >= ACTION_COSTS.build) {
      prov.defense += 1;
      realm.materials -= 50;
      currentAp -= ACTION_COSTS.build;
      state.logs.push(`${realm.name} reforçou as defesas em ${prov.name}.`);
    } else if (realm.gold > 150 && currentAp >= ACTION_COSTS.recruit) {
      executeRecruitment(state, realm, prov);
      currentAp -= ACTION_COSTS.recruit;
    }
  }
  realm.actionPoints = currentAp;
}

function handleDiplomaticAI(state: GameState, realm: Realm, provinces: Province[], ap: number) {
  // Diplomatic AI prioritizes alliances and trade
  let currentAp = ap;
  
  // Try to improve relations or form pacts
  const otherRealms = Object.values(state.realms).filter(r => r.id !== realm.id);
  for (const other of otherRealms) {
    if (currentAp < ACTION_COSTS.diplomacy) break;
    
    const relations = realm.relations[other.id] || 0;
    if (relations > 20 && !realm.pacts.includes(other.id)) {
      realm.pacts.push(other.id);
      other.pacts.push(realm.id);
      currentAp -= ACTION_COSTS.diplomacy;
      state.logs.push(`${realm.name} e ${other.name} assinaram um pacto de não-agressão.`);
    } else if (relations < 0 && realm.gold > 100) {
      // Send gift
      realm.gold -= 50;
      realm.relations[other.id] += 15;
      currentAp -= ACTION_COSTS.diplomacy;
    }
  }
  
  // Also recruit a bit for safety
  if (currentAp >= ACTION_COSTS.recruit && provinces.length > 0) {
    executeRecruitment(state, realm, provinces[0]);
    currentAp -= ACTION_COSTS.recruit;
  }
  
  realm.actionPoints = currentAp;
}

function handleOpportunisticAI(state: GameState, realm: Realm, provinces: Province[], ap: number) {
  // Opportunistic AI attacks when neighbors are in wars or weak
  let currentAp = ap;
  
  for (const prov of provinces) {
    if (currentAp <= 0) break;

    const targets = prov.neighbors
      .map(nId => state.provinces[nId])
      .filter(n => {
        if (!n || n.ownerId === realm.id) return false;
        const targetRealm = state.realms[n.ownerId];
        // Target is weak or already at war
        return n.troops < prov.troops * 0.7 || targetRealm.wars.length > 0;
      });

    if (targets.length > 0 && currentAp >= ACTION_COSTS.attack) {
      executeAttack(state, realm, prov, targets[0]);
      currentAp -= ACTION_COSTS.attack;
    }
  }
  realm.actionPoints = currentAp;
}

function handleCommercialAI(state: GameState, realm: Realm, provinces: Province[], ap: number) {
  // Commercial AI prioritizes trade routes and wealth
  let currentAp = ap;
  
  // Try to establish trade routes
  if (currentAp >= ACTION_COSTS.diplomacy && realm.gold > 100) {
    const potentialPartners = Object.values(state.realms).filter(r => r.id !== realm.id && realm.relations[r.id] > 0);
    if (potentialPartners.length > 0) {
      const partner = potentialPartners[0];
      // Find provinces to connect
      const myProv = provinces[0];
      const theirProv = Object.values(state.provinces).find(p => p.ownerId === partner.id);
      if (myProv && theirProv) {
        realm.tradeRoutes.push({ fromProvinceId: myProv.id, toProvinceId: theirProv.id });
        currentAp -= ACTION_COSTS.diplomacy;
        realm.gold -= 50;
        state.logs.push(`${realm.name} estabeleceu uma rota comercial com ${partner.name}.`);
      }
    }
  }
  
  // Build workshops/mines
  for (const prov of provinces) {
    if (currentAp >= ACTION_COSTS.build && realm.materials >= 100) {
      prov.buildings.workshops += 1;
      realm.materials -= 100;
      currentAp -= ACTION_COSTS.build;
    }
  }
  
  realm.actionPoints = currentAp;
}

function executeAttack(state: GameState, realm: Realm, attackerProv: Province, targetProv: Province) {
  const attackingArmy: Army = {
    infantry: Math.floor(attackerProv.army.infantry * 0.7),
    archers: Math.floor(attackerProv.army.archers * 0.7),
    cavalry: Math.floor(attackerProv.army.cavalry * 0.7)
  };
  
  attackerProv.army.infantry -= attackingArmy.infantry;
  attackerProv.army.archers -= attackingArmy.archers;
  attackerProv.army.cavalry -= attackingArmy.cavalry;
  attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry;
  
  const result = resolveCombat(attackingArmy, targetProv.army, targetProv.terrain, targetProv.defense);
  
  state.visualEffects.push({
    id: `effect_${Date.now()}_${Math.random()}`,
    type: 'battle',
    x: targetProv.center[0],
    y: targetProv.center[1],
    duration: 2000,
    startTime: Date.now()
  });

  if (result.won) {
    const oldOwnerId = targetProv.ownerId;
    const oldOwnerName = state.realms[oldOwnerId].name;
    targetProv.ownerId = realm.id;
    targetProv.army = result.attackerRemaining;
    targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
    
    state.logs.push(`CONQUISTA: ${realm.name} tomou ${targetProv.name} de ${oldOwnerName}!`);
    realm.overextension = Math.min(100, realm.overextension + 15);
    
    // Check for realm fall
    const oldOwnerProvinces = Object.values(state.provinces).filter(p => p.ownerId === oldOwnerId);
    if (oldOwnerProvinces.length === 0) {
      state.logs.push(`QUEDA: O reino de ${oldOwnerName} foi destruído.`);
    }
    
    // Memory of aggression
    const targetRealm = state.realms[oldOwnerId];
    if (targetRealm.memory[realm.id]) {
      targetRealm.memory[realm.id].aggression += 30;
      targetRealm.memory[realm.id].lastWarTurn = state.turn;
    }
    targetRealm.relations[realm.id] -= 50;
  } else {
    targetProv.army = result.defenderRemaining;
    targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
    attackerProv.army.infantry += result.attackerRemaining.infantry;
    attackerProv.army.archers += result.attackerRemaining.archers;
    attackerProv.army.cavalry += result.attackerRemaining.cavalry;
    attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry;
  }
}

function executeRecruitment(state: GameState, realm: Realm, prov: Province) {
  // AI recruitment logic: try to balance or pick best available
  const unitTypes: UnitType[] = ['infantry', 'archers', 'cavalry'];
  
  for (const type of unitTypes) {
    const stats = UNIT_STATS[type];
    const statsWithReq = stats as { requires?: StrategicResource };
    
    // Check requirements (kingdom-wide)
    if (statsWithReq.requires) {
      const hasResource = Object.values(state.provinces).some(p => p.ownerId === realm.id && p.strategicResource === statsWithReq.requires);
      if (!hasResource) continue;
    }
    
    const maxByGold = Math.floor(realm.gold / stats.cost.gold);
    const maxByFood = Math.floor(realm.food / stats.cost.food);
    const maxByMaterials = Math.floor(realm.materials / stats.cost.materials);
    const maxByPop = Math.floor(prov.population / stats.cost.pop);
    
    let amount = Math.min(maxByGold, maxByFood, maxByMaterials, maxByPop, 5);
    
    if (amount > 0) {
      prov.army[type] += amount;
      prov.troops += amount;
      prov.population -= amount * stats.cost.pop;
      realm.gold -= amount * stats.cost.gold;
      realm.food -= amount * stats.cost.food;
      realm.materials -= amount * stats.cost.materials;
      
      // Only recruit one type per call to keep it simple for AI
      break;
    }
  }
}

export function processEndOfTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Calculate income and maintenance for all realms
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    
    // Reset Action Points
    realm.actionPoints = realm.maxActionPoints;

    // Overextension decay
    if (realm.overextension > 0) {
      realm.overextension = Math.max(0, realm.overextension - 5);
    }

    // Memory decay
    Object.values(realm.memory).forEach(mem => {
      mem.betrayal = Math.max(0, mem.betrayal - 2);
      mem.aggression = Math.max(0, mem.aggression - 2);
      mem.help = Math.max(0, mem.help - 1);
    });

    // Production
    let goldIncome = 0;
    let foodIncome = 0;
    let materialIncome = 0;

    ownedProvinces.forEach(p => {
      const efficiency = p.population / p.maxPopulation;
      goldIncome += (p.wealth + (p.buildings.mines * 5)) * efficiency;
      foodIncome += (p.foodProduction + (p.buildings.farms * 10)) * efficiency;
      materialIncome += (p.materialProduction + (p.buildings.workshops * 5)) * efficiency;

      if (p.strategicResource === 'iron') materialIncome += 5;
      if (p.strategicResource === 'wood') materialIncome += 5;
      if (p.strategicResource === 'horse') foodIncome += 5;
      if (p.strategicResource === 'stone') materialIncome += 5;

      if (p.population < p.maxPopulation) {
        const growth = Math.floor(p.population * 0.05);
        p.population = Math.min(p.maxPopulation, p.population + growth);
      }
    });
    
    // Tribute handling
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
    
    // Difficulty scaling
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

    let goldMaintenance = 0;
    let foodMaintenance = 0;

    ownedProvinces.forEach(p => {
      goldMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.gold;
      goldMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.gold;
      goldMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.gold;

      foodMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.food;
      foodMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.food;
      foodMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.food;
    });
    
    realm.gold += Math.floor(goldIncome + tradeIncome - goldMaintenance);
    realm.food += Math.floor(foodIncome - foodMaintenance);
    realm.materials += Math.floor(materialIncome);

    // Handle Deficits
    if (realm.gold < 0) {
      handleResourceDeficit(realm, ownedProvinces, -realm.gold * 10, 'gold', newState);
    }
    if (realm.food < 0) {
      handleResourceDeficit(realm, ownedProvinces, -realm.food * 5, 'food', newState);
    }

    // Relationship Changes
    Object.keys(realm.relations).forEach(otherId => {
      if (realm.relations[otherId] > 0) realm.relations[otherId] -= 1;
      if (realm.relations[otherId] < 0) realm.relations[otherId] += 1;

      const hasTrade = realm.tradeRoutes.some(r => {
        const p1 = newState.provinces[r.fromProvinceId];
        const p2 = newState.provinces[r.toProvinceId];
        return (p1.ownerId === realm.id && p2.ownerId === otherId) || 
               (p1.ownerId === otherId && p2.ownerId === realm.id);
      });
      if (hasTrade) realm.relations[otherId] += 3;

      // Memory impact
      const mem = realm.memory[otherId];
      if (mem) {
        realm.relations[otherId] -= (mem.betrayal * 0.5 + mem.aggression * 0.3);
        realm.relations[otherId] += mem.help * 0.2;
      }

      realm.relations[otherId] = Math.max(-100, Math.min(100, realm.relations[otherId]));
    });
  });

  // Coalition Logic
  processCoalitions(newState);
  
  newState.turn += 1;
  newState.visibleProvinces = calculateVisibility(newState);

  // Random Events
  handleRandomEvents(newState);
  
  const gameOver = checkGameOver(newState);
  if (gameOver) {
    newState.gameOver = gameOver;
    newState.logs.push(`FIM DE JOGO: ${gameOver.reason}`);
  }

  return newState;
}

function handleResourceDeficit(realm: Realm, provinces: Province[], troopsToLose: number, type: 'gold' | 'food', state: GameState) {
  realm[type] = 0;
  let remainingLoss = troopsToLose;
  for (const prov of provinces) {
    if (remainingLoss <= 0) break;
    if (prov.troops > 0) {
      const loss = Math.min(prov.troops, remainingLoss);
      const ratio = loss / prov.troops;
      prov.army.infantry -= Math.floor(prov.army.infantry * ratio);
      prov.army.archers -= Math.floor(prov.army.archers * ratio);
      prov.army.cavalry -= Math.floor(prov.army.cavalry * ratio);
      prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry;
      remainingLoss -= loss;
    }
  }
  if (realm.isPlayer) {
    state.logs.push(type === 'gold' ? `Tesouro vazio! Tropas desertaram.` : `Fome! Tropas morrendo.`);
  }
}

function processCoalitions(state: GameState) {
  // Check for threats (realms with many provinces or high military)
  const totalProvinces = Object.keys(state.provinces).length;
  const realms = Object.values(state.realms);
  
  realms.forEach(threat => {
    const ownedCount = Object.values(state.provinces).filter(p => p.ownerId === threat.id).length;
    const isThreat = ownedCount > totalProvinces * 0.3;
    
    if (isThreat) {
      // Potential coalition target
      const existingCoalition = state.coalitions.find(c => c.targetId === threat.id);
      if (!existingCoalition) {
        const members = realms.filter(r => r.id !== threat.id && r.relations[threat.id] < 0).map(r => r.id);
        if (members.length >= 2) {
          state.coalitions.push({ targetId: threat.id, members });
          state.logs.push(`Uma coalizão defensiva foi formada contra ${threat.name}!`);
          members.forEach(mId => state.realms[mId].isCoalitionMember = threat.id);
        }
      }
    } else {
      // Remove coalition if threat is gone
      state.coalitions = state.coalitions.filter(c => c.targetId !== threat.id);
      realms.forEach(r => { if (r.isCoalitionMember === threat.id) delete r.isCoalitionMember; });
    }
  });
}

function handleRandomEvents(state: GameState) {
  state.currentEvent = null;
  if (Math.random() < 0.2) {
    const events: GameEvent[] = [
      { name: "Colheita Farta", description: "Uma temporada de clima perfeito impulsionou a produção de alimentos.", type: 'positive' },
      { name: "Peste", description: "Uma doença misteriosa está se espalhando.", type: 'negative' },
      { name: "Corrida do Ouro", description: "Novos veios de ouro foram descobertos.", type: 'positive' },
      { name: "Revolta Camponesa", description: "Impostos altos levaram camponeses a pegar em armas.", type: 'negative' },
      { name: "Avanço Diplomático", description: "Um grande banquete melhorou as relações.", type: 'positive' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    state.currentEvent = event;
    state.logs.push(`EVENTO: ${event.name} - ${event.description}`);

    if (event.name === "Colheita Farta") {
      Object.values(state.realms).forEach(r => { r.food += 100; });
    } else if (event.name === "Peste") {
      Object.values(state.provinces).forEach(p => {
        if (Math.random() < 0.3) p.troops = Math.floor(p.troops * 0.8);
      });
    } else if (event.name === "Corrida do Ouro") {
      Object.values(state.realms).forEach(r => { r.gold += 150; });
    } else if (event.name === "Revolta Camponesa") {
      const provIds = Object.keys(state.provinces);
      const randomProv = state.provinces[provIds[Math.floor(Math.random() * provIds.length)]];
      randomProv.troops = Math.max(0, randomProv.troops - 20);
      if (randomProv.buildings.farms > 0) randomProv.buildings.farms--;
      state.logs.push(`Revolta em ${randomProv.name}!`);
    } else if (event.name === "Avanço Diplomático") {
      Object.values(state.realms).forEach(r => {
        Object.keys(r.relations).forEach(otherId => {
          r.relations[otherId] = Math.min(100, r.relations[otherId] + 10);
        });
      });
    }
  }
}
