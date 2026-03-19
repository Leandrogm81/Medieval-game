import * as d3 from 'd3';
import { GameState, Province, Realm, Terrain, GameEvent, Army, StrategicResource, PersonalityType, StrategicObjective, DiplomaticMemory, Coalition, GameSettings, VictoryCondition, UnitType, MarchOrder } from './types';

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
    cost: { gold: 0, food: 3, materials: 1, pop: 10 }, 
    maintenance: { gold: 0.1, food: 0.1 },
    attack: 1.0, defense: 1.5, speed: 1 
  },
  archers: { 
    cost: { gold: 0, food: 3, materials: 5, pop: 10 }, 
    maintenance: { gold: 0.1, food: 0.1 },
    attack: 1.2, defense: 1.2, speed: 1,
    requires: 'wood' as StrategicResource
  },
  cavalry: { 
    cost: { gold: 0, food: 8, materials: 8, pop: 15 }, 
    maintenance: { gold: 0.2, food: 0.1 },
    attack: 2.0, defense: 1.0, speed: 2,
    requires: 'horse' as StrategicResource
  },
  scouts: {
    cost: { gold: 50, food: 5, materials: 5, pop: 5 },
    maintenance: { gold: 0.3, food: 0.1 },
    attack: 0.1, defense: 0.1, speed: 3,
    vision: true // Special property for clarity
  }
};

export const ACTION_COSTS = {
  move: 2,
  recruit: 1,
  attack: 4,
  build: 2,
  diplomacy: 2
};

export const BUILDING_STATS = {
  farms: { gold: 25, materials: 15 },
  mines: { gold: 40, materials: 20 },
  workshops: { gold: 35, materials: 15 },
  courts: { gold: 60, materials: 30 },
  fortify: { gold: 20, materials: 10 }
};

// Production bonus per building level
export const BUILDING_PRODUCTION = {
  farms: 18,      // +18 food per farm
  mines: 20,      // +20 gold per mine
  workshops: 12,   // +12 materials per workshop
  courts: 10      // +10 loyalty stabilization
};

const PERSONALITIES: PersonalityType[] = ['expansionist', 'defensive', 'diplomatic', 'opportunistic', 'commercial'];
const OBJECTIVES: StrategicObjective[] = ['regional_dominance', 'destroy_rival', 'wealth', 'resource_control', 'defensive_block'];

export function calculateVisibility(state: GameState): string[] {
  const visible = new Set<string>();
  const playerProvinces = Object.values(state.provinces).filter(p => p.ownerId === state.playerRealmId);
  
  // Check if player has any scouts in provinces
  const hasScouts = playerProvinces.some(p => (p.army?.scouts || 0) > 0);
  
  // Check if player has scout march orders
  const hasScoutOrders = (state.marchOrders || []).some(
    o => o.realmId === state.playerRealmId && o.isScoutMission
  );
  
  if (hasScouts || hasScoutOrders) {
    // Scouts reveal everything
    return Object.keys(state.provinces);
  }
  
  playerProvinces.forEach(p => {
    visible.add(p.id);
    (p.neighbors || []).forEach(nId => visible.add(nId));
  });
  
  // Regular march orders also reveal current position
  (state.marchOrders || []).filter(o => o.realmId === state.playerRealmId).forEach(o => {
    visible.add(o.currentProvId);
    const prov = state.provinces[o.currentProvId];
    if (prov) (prov.neighbors || []).forEach(nId => visible.add(nId));
  });
  
  return Array.from(visible);
}

export function generateInitialState(width: number, height: number, settings: GameSettings): GameState {
  console.log("Generating initial state...");
  try {
    const numRealms = Math.max(1, settings.numRealms || 1);
    const numProvinces = Math.max(numRealms, settings.numProvinces || 5);
    const { resourceDensity } = settings;
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
        gold: 400,
        food: 300,
        materials: 150,
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
            lastWarTurn: -1,
            warExhaustion: 0,
            truces: {}
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
        cavalry: Math.floor(Math.random() * 5),
        scouts: 0 // No scouts at start
      };

      provinces[`prov_${i}`] = {
        id: `prov_${i}`,
        name: PROVINCE_NAMES[i % PROVINCE_NAMES.length],
        ownerId: 'neutral', // Initially unowned for contiguous distribution
        army,
        troops: army.infantry + army.archers + army.cavalry + army.scouts,
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
          workshops: 0,
          courts: 0
        },
        siegeDamage: 0,
        loyalty: 100,
        recentlyConquered: 0
      };
    }

    // Contiguous Province Distribution
    const unassigned = new Set(Object.keys(provinces));
    const frontier: { provinceId: string; realmId: string }[] = [];
    
    // Pick seeds
    const provinceIds = Array.from(unassigned);
    const shuffledIds = [...provinceIds].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numRealms; i++) {
        const seedId = shuffledIds[i];
        provinces[seedId].ownerId = `realm_${i}`;
        unassigned.delete(seedId);
        
        // Add neighbors of seed to frontier
        provinces[seedId].neighbors.forEach(nId => {
            if (unassigned.has(nId)) {
                frontier.push({ provinceId: nId, realmId: `realm_${i}` });
            }
        });
    }
    
    // Expand reinos
    while (unassigned.size > 0 && frontier.length > 0) {
        // Pick a random edge from the frontier
        const index = Math.floor(Math.random() * frontier.length);
        const { provinceId, realmId } = frontier.splice(index, 1)[0];
        
        if (unassigned.has(provinceId)) {
            provinces[provinceId].ownerId = realmId;
            unassigned.delete(provinceId);
            
            // Add new unassigned neighbors to frontier
            provinces[provinceId].neighbors.forEach(nId => {
                if (unassigned.has(nId)) {
                    frontier.push({ provinceId: nId, realmId });
                }
            });
        }
    }
    
    // Any remaining (due to isolation) assign to neutral or random neighbor
    unassigned.forEach(pId => {
        const neighbors = provinces[pId].neighbors;
        const assignedNeighbor = neighbors.find(nId => provinces[nId].ownerId !== 'neutral');
        if (assignedNeighbor) {
            provinces[pId].ownerId = provinces[assignedNeighbor].ownerId;
        } else {
            // Truly isolated? Pick random realm
            provinces[pId].ownerId = `realm_${Math.floor(Math.random() * numRealms)}`;
        }
    });

    // Assign Capitals
    Object.values(realms).forEach(realm => {
      const owned = Object.values(provinces).filter(p => p.ownerId === realm.id);
      if (owned.length > 0) {
        // Pick the most central province among owned (optional, for now just first)
        realm.capitalId = owned[Math.floor(owned.length / 2)].id;
        provinces[realm.capitalId].loyalty = 100;
        provinces[realm.capitalId].buildings.courts = 1;
      }
    });

    const playerRealmId = 'realm_0';
    const initialState: GameState = {
      turn: 1,
      realms,
      provinces,
      playerRealmId,
      logs: [
        "Bem-vindo ao Medieval Realms!", 
        realms[playerRealmId]?.capitalId 
          ? `Sua capital foi estabelecida em ${provinces[realms[playerRealmId].capitalId!].name}.`
          : "Sua jornada começa em terras desconhecidas.",
        "Sua jornada rumo à glória começa agora."
      ],
      currentEvent: null,
      visualEffects: [],
      coalitions: [],
      visibleProvinces: [],
      marchOrders: [],
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

export interface BattleResult {
  won: boolean;
  attackerRemaining: Army;
  defenderRemaining: Army;
  attackerLosses: Army;
  defenderLosses: Army;
  attackerInitial: Army;
  defenderInitial: Army;
  terrain: Terrain;
  defenseLevel: number;
  rounds: number;
}

export function resolveCombat(attackerArmy: Army, defenderArmy: Army, terrain: Terrain, defense: number): BattleResult {
  // Scouts don't fight — strip them from armies before combat
  const atk = { ...attackerArmy, scouts: 0 };
  const def = { ...defenderArmy, scouts: 0 };
  const atkInitial = { ...atk };
  const defInitial = { ...def };

  // Terrain modifiers
  let terrainDefBonus = 1.0;
  let cavAtkMod = 1.0;
  let archerDefMod = 1.0;
  
  if (terrain === 'forest') {
    terrainDefBonus = 1.2;
    archerDefMod = 1.4;   // Archers excel defending in forest
    cavAtkMod = 0.6;      // Cavalry hindered in forest
  } else if (terrain === 'mountain') {
    terrainDefBonus = 1.5;
    archerDefMod = 1.6;   // High ground advantage for archers
    cavAtkMod = 0.4;      // Cavalry terrible in mountains
  } else {
    cavAtkMod = 1.5;      // Cavalry shines in plains
  }

  const fortBonus = 1.0 + (defense * 0.2); // Each fort level = 20% def bonus

  // Simulate combat in rounds (max 5) - scouts excluded from calculation
  let rounds = 0;
  for (let r = 0; r < 5; r++) {
    rounds++;
    const atkTotal = atk.infantry + atk.archers + atk.cavalry; // no scouts
    const defTotal = def.infantry + def.archers + def.cavalry; // no scouts
    if (atkTotal <= 0 || defTotal <= 0) break;

    // Calculate attack power with unit counters
    // Cavalry > Archers, Archers > Infantry, Infantry > Cavalry
    const atkPower = 
      atk.infantry * 1.0 +
      atk.archers * 1.3 +
      atk.cavalry * 2.0 * cavAtkMod;

    const defPower = (
      def.infantry * 1.5 +
      def.archers * 1.2 * archerDefMod +
      def.cavalry * 1.0
    ) * terrainDefBonus * fortBonus;

    // Random variation per round (±10%)
    const atkRoll = atkPower * (0.9 + Math.random() * 0.2);
    const defRoll = defPower * (0.9 + Math.random() * 0.2);

    // Damage ratio: stronger side deals proportionally more
    const totalPower = atkRoll + defRoll;
    const atkDmgRatio = defRoll / totalPower; // Damage attacker takes
    const defDmgRatio = atkRoll / totalPower; // Damage defender takes

    // Casualties per round (20-40% of losing side, 10-20% of winning)
    const baseCasualtyRate = 0.25;
    
    // Attacker casualties (proportional to how strong defense is)
    const atkCasualtyRate = baseCasualtyRate * atkDmgRatio * 2;
    atk.infantry = Math.max(0, atk.infantry - Math.ceil(atk.infantry * atkCasualtyRate));
    atk.archers = Math.max(0, atk.archers - Math.ceil(atk.archers * atkCasualtyRate * 0.8));
    atk.cavalry = Math.max(0, atk.cavalry - Math.ceil(atk.cavalry * atkCasualtyRate));

    // Defender casualties
    const defCasualtyRate = baseCasualtyRate * defDmgRatio * 2;
    def.infantry = Math.max(0, def.infantry - Math.ceil(def.infantry * defCasualtyRate));
    def.archers = Math.max(0, def.archers - Math.ceil(def.archers * defCasualtyRate * 0.7));
    def.cavalry = Math.max(0, def.cavalry - Math.ceil(def.cavalry * defCasualtyRate));
  }

  const atkSurvivors = atk.infantry + atk.archers + atk.cavalry; // scouts excluded from victory check
  const defSurvivors = def.infantry + def.archers + def.cavalry;
  
  const won = atkSurvivors > defSurvivors;

  return {
    won,
    attackerRemaining: atk,
    defenderRemaining: def,
    attackerLosses: {
      infantry: atkInitial.infantry - atk.infantry,
      archers: atkInitial.archers - atk.archers,
      cavalry: atkInitial.cavalry - atk.cavalry,
      scouts: atkInitial.scouts - atk.scouts,
    },
    defenderLosses: {
      infantry: defInitial.infantry - def.infantry,
      archers: defInitial.archers - def.archers,
      cavalry: defInitial.cavalry - def.cavalry,
      scouts: defInitial.scouts - def.scouts,
    },
    attackerInitial: atkInitial,
    defenderInitial: defInitial,
    terrain,
    defenseLevel: defense,
    rounds,
  };
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
    
    // Evaluate Medium-Term Strategy
    const assessment = analyzeRealmStrategy(newState, realm, ownedProvinces);
    
    // Periodically log strategic focus
    if (Math.random() < 0.05 && ownedProvinces.length > 0) {
       switch (realm.objective) {
         case 'resource_control':
           newState.logs.push(`RUMORES: A coroa de ${realm.name} prioriza dominar ricas províncias produtoras de minérios, madeira ou cavalos para encorpar sua reserva de Guerra.`);
           break;
         case 'regional_dominance':
           newState.logs.push(`TENSÃO: O reino agressivo de ${realm.name} visa se mostrar soberano no território local, e não tolerará vizinhos fracos à beira do seu muro.`);
           break;
         case 'destroy_rival':
           if (assessment.primaryTargetRealm) {
              const rival = newState.realms[assessment.primaryTargetRealm];
              newState.logs.push(`INTRIGAS: Espiões confirmam o inevitável, um plano de subjugar seu principal rival militar, ${rival?.name}, agora rege as leis de ${realm.name}.`);
           }
           break;
         case 'wealth':
           newState.logs.push(`CARTAS DE CORTESÃOS: Em ${realm.name}, a busca engenhosa por moedas e sólidas rotas tem moldado ministros para evitar grandes atritos e atrair a riqueza.`);
           break;
         case 'defensive_block':
           newState.logs.push(`ESTRATÉGIA: ${realm.name} adota severa doutrina de escudo militar, cimentando baluartes onde a fronteira é ameaçada para firmar grandes redes da defesa conjunta.`);
           break;
       }
    }

    if (Math.random() < 0.03 && assessment.safeInternal.length > 0 && assessment.threatenedBorders.length > 0) {
       newState.logs.push(`MOVIMENTO TÁTICO: Carroças de suprimento e exércitos em repouso de ${realm.name} estão massivamente se reposicionando para as fronteiras de atrito.`);
    }
    
    // 2. Personality-based Decision Making
    switch (realm.personality) {
      case 'expansionist':
        handleExpansionistAI(newState, realm, ownedProvinces, availableAPs, assessment);
        break;
      case 'defensive':
        handleDefensiveAI(newState, realm, ownedProvinces, availableAPs, assessment);
        break;
      case 'diplomatic':
        handleDiplomaticAI(newState, realm, ownedProvinces, availableAPs, assessment);
        break;
      case 'opportunistic':
        handleOpportunisticAI(newState, realm, ownedProvinces, availableAPs, assessment);
        break;
      case 'commercial':
        handleCommercialAI(newState, realm, ownedProvinces, availableAPs, assessment);
        break;
    }

    // 3. Shared Internal Management (using residual APs)
    manageInternalAffairsAI(newState, realm, assessment);
  });
  
  return newState;
}

export interface StrategicAssessment {
  threatenedBorders: Province[];
  offensiveTargets: Province[];
  safeInternal: Province[];
  primaryTargetRealm: string | null;
}

function analyzeRealmStrategy(state: GameState, realm: Realm, ownedProvinces: Province[]): StrategicAssessment {
  const assessment: StrategicAssessment = {
    threatenedBorders: [],
    offensiveTargets: [],
    safeInternal: [],
    primaryTargetRealm: null
  };

  if (ownedProvinces.length === 0) return assessment;

  const realmTroops: Record<string, number> = {};
  Object.values(state.realms).forEach(r => {
     realmTroops[r.id] = Object.values(state.provinces).filter(p => p.ownerId === r.id).reduce((sum, p) => sum + p.troops, 0);
  });
  const myTroops = realmTroops[realm.id] || 0;

  ownedProvinces.forEach(prov => {
    let isBorder = false;
    let isThreatened = false;
    let isOffensiveFront = false;

    prov.neighbors.forEach(nId => {
      const nProv = state.provinces[nId];
      if (nProv && nProv.ownerId !== realm.id) {
        isBorder = true;
        const targetRealm = state.realms[nProv.ownerId];
        if (!targetRealm) return; // Skip provinces with invalid owners
        
        const isEnemy = realm.wars.includes(targetRealm.id);
        const isAllied = realm.alliances.includes(targetRealm.id) || realm.pacts.includes(targetRealm.id);

        if (isEnemy) {
          isThreatened = true;
          isOffensiveFront = true;
        } else if (!isAllied) {
          if (realmTroops[targetRealm.id] > myTroops * 1.5) {
            isThreatened = true;
          }

          if (realm.objective === 'resource_control' && nProv.strategicResource !== 'none') {
            isOffensiveFront = true;
          } else if (realm.objective === 'regional_dominance' && realmTroops[targetRealm.id] < myTroops * 0.8) {
            isOffensiveFront = true;
          } else if (realm.objective === 'destroy_rival') {
            if (!assessment.primaryTargetRealm || realmTroops[assessment.primaryTargetRealm] < realmTroops[targetRealm.id]) {
               assessment.primaryTargetRealm = targetRealm.id;
            }
            if (targetRealm.id === assessment.primaryTargetRealm) {
               isOffensiveFront = true;
            }
          }
        }
      }
    });

    if (!isBorder) {
      if (!assessment.safeInternal.includes(prov)) assessment.safeInternal.push(prov);
    } else {
      if (isThreatened && !assessment.threatenedBorders.includes(prov)) assessment.threatenedBorders.push(prov);
      if (isOffensiveFront && !assessment.offensiveTargets.includes(prov)) assessment.offensiveTargets.push(prov);
    }
  });

  return assessment;
}

export function executeMove(sourceProv: Province, targetProv: Province) {
  const moveInf = Math.floor(sourceProv.army.infantry / 2);
  const moveArc = Math.floor(sourceProv.army.archers / 2);
  const moveCav = Math.floor(sourceProv.army.cavalry / 2);
  const moveSco = Math.floor(sourceProv.army.scouts / 2);

  sourceProv.army.infantry -= moveInf;
  sourceProv.army.archers -= moveArc;
  sourceProv.army.cavalry -= moveCav;
  sourceProv.army.scouts -= moveSco;
  sourceProv.troops = sourceProv.army.infantry + sourceProv.army.archers + sourceProv.army.cavalry + sourceProv.army.scouts;

  targetProv.army.infantry += moveInf;
  targetProv.army.archers += moveArc;
  targetProv.army.cavalry += moveCav;
  targetProv.army.scouts += moveSco;
  targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry + targetProv.army.scouts;
}

function processVassalTurn(state: GameState, realm: Realm) {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  let availableGold = realm.gold;
  let availableAPs = realm.actionPoints;

  // Independence check
  if (realm.vassalOf) {
    const suzerain = state.realms[realm.vassalOf];
    if (suzerain) {
       const myTroops = ownedProvinces.reduce((sum, p) => sum + p.troops, 0);
       const suzerainTroops = Object.values(state.provinces).filter(p => p.ownerId === suzerain.id).reduce((sum, p) => sum + p.troops, 0);

       if (realm.relations[suzerain.id] < -50 || myTroops > suzerainTroops * 1.5) {
         realm.vassalOf = undefined;
         suzerain.vassals = suzerain.vassals.filter(id => id !== realm.id);
         realm.wars.push(suzerain.id);
         suzerain.wars.push(realm.id);
         state.logs.push(`REBELIÃO: Os governantes de ${realm.name} cortaram seus laços com ${suzerain.name} e declararam guerra!`);
         return;
       }
    }
  }

  const assessment = analyzeRealmStrategy(state, realm, ownedProvinces);
  
  const borderProvs = assessment.threatenedBorders.length > 0 ? assessment.threatenedBorders : ownedProvinces;

  for (const prov of borderProvs) {
    if (availableAPs >= ACTION_COSTS.recruit) {
       executeRecruitment(state, realm, prov);
       availableAPs -= ACTION_COSTS.recruit;
    }
  }
  
  realm.actionPoints = availableAPs;
}

function handleExpansionistAI(state: GameState, realm: Realm, provinces: Province[], ap: number, assessment: StrategicAssessment) {
  let currentAp = ap;
  
  if (assessment.safeInternal.length > 0 && assessment.offensiveTargets.length > 0) {
     for (const safeProv of assessment.safeInternal) {
        if (currentAp < ACTION_COSTS.move) break;
        if (safeProv.troops > 20) {
           const validNeighbors = safeProv.neighbors.filter(nId => state.provinces[nId].ownerId === realm.id);
           const target = validNeighbors.find(nId => assessment.offensiveTargets.includes(state.provinces[nId])) || validNeighbors[0];
           if (target) {
              executeMove(safeProv, state.provinces[target]);
              currentAp -= ACTION_COSTS.move;
           }
        }
     }
  }

  const attackProvinces = [...assessment.offensiveTargets, ...provinces].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b.troops - a.troops);
  
  for (const prov of attackProvinces) {
    if (currentAp <= 0) break;

    let targets = prov.neighbors
      .map(nId => state.provinces[nId])
      .filter(n => n && n.ownerId !== realm.id && realm.wars.includes(n.ownerId))
      .sort((a, b) => a.troops - b.troops);

    if (targets.length === 0) {
      targets = prov.neighbors
        .map(nId => state.provinces[nId])
        .filter(n => n && n.ownerId !== realm.id && !realm.alliances.includes(n.ownerId) && !realm.pacts.includes(n.ownerId))
        .sort((a, b) => a.troops - b.troops);
      
      if (realm.objective === 'resource_control') {
         targets = targets.filter(t => t.strategicResource !== 'none');
      } else if (realm.objective === 'destroy_rival' && assessment.primaryTargetRealm) {
         targets = targets.filter(t => t.ownerId === assessment.primaryTargetRealm);
      }
    }

    if (targets.length > 0 && prov.troops > targets[0].troops * 1.2 && currentAp >= ACTION_COSTS.attack) {
      const targetRealmId = targets[0].ownerId;
      if (!realm.wars.includes(targetRealmId) && state.realms[targetRealmId]) {
        realm.wars.push(targetRealmId);
        state.realms[targetRealmId].wars.push(realm.id);
        state.logs.push(`GUERRA: O reino expansionista de ${realm.name} declarou guerra a ${state.realms[targetRealmId].name}!`);
        if (realm.pacts.includes(targetRealmId)) {
           realm.pacts = realm.pacts.filter(id => id !== targetRealmId);
           state.realms[targetRealmId].pacts = state.realms[targetRealmId].pacts.filter(id => id !== realm.id);
           if (state.realms[targetRealmId].memory[realm.id]) state.realms[targetRealmId].memory[realm.id].betrayal += 50;
           realm.relations[targetRealmId] = -100;
           state.logs.push(`TRAIÇÃO: ${realm.name} quebrou covardemente o pacto de não agressão!`);
        }
      }
      executeAttack(state, realm, prov, targets[0]);
      currentAp -= ACTION_COSTS.attack;
    } 
    
    // Internal Politics Management for AI
    if (prov.loyalty < 50 && currentAp >= ACTION_COSTS.build) {
       if (executeBuilding(state, realm, prov, 'courts')) {
          currentAp -= ACTION_COSTS.build;
       }
    }

    if (currentAp >= ACTION_COSTS.recruit) {
      executeRecruitment(state, realm, prov);
      currentAp -= ACTION_COSTS.recruit;
    }
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
              executeMove(safeProv, state.provinces[target]);
              currentAp -= ACTION_COSTS.move;
           }
        }
     }
  }

  const priorityProvinces = assessment.threatenedBorders.length > 0 ? assessment.threatenedBorders : provinces;

  for (const prov of priorityProvinces) {
    if (currentAp <= 0) break;

    if (assessment.threatenedBorders.includes(prov) && prov.defense < 3 && currentAp >= ACTION_COSTS.build) {
       if (executeBuilding(state, realm, prov, 'fortify')) {
          currentAp -= ACTION_COSTS.build;
          state.logs.push(`${realm.name} ergueu mais defesas em ${prov.name}.`);
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
    const enemyMem = realm.memory[warEnemyId];
    if (enemyMem && enemyMem.warExhaustion > 40) {
       const enemyRealm = state.realms[warEnemyId];
       const ourMemOfThem = enemyRealm.memory[realm.id];
       if (!enemyRealm.isPlayer && ourMemOfThem && ourMemOfThem.warExhaustion > 30) {
         realm.wars = realm.wars.filter(id => id !== warEnemyId);
         enemyRealm.wars = enemyRealm.wars.filter(id => id !== realm.id);
         realm.memory[warEnemyId].warExhaustion = 0;
         enemyRealm.memory[realm.id].warExhaustion = 0;
         realm.memory[warEnemyId].truces[warEnemyId] = state.turn + 10;
         enemyRealm.memory[realm.id].truces[realm.id] = state.turn + 10;
         state.logs.push(`PAZ: ${realm.name} e ${enemyRealm.name} sentaram à mesa e assinaram um tratado de paz.`);
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

    const targets = prov.neighbors
      .map(nId => state.provinces[nId])
      .filter(n => {
        if (!n || n.ownerId === realm.id) return false;
        const targetRealm = state.realms[n.ownerId];
        return n.troops < prov.troops * 0.7 || targetRealm.wars.length > 0;
      });

    if (targets.length > 0 && currentAp >= ACTION_COSTS.attack) {
      const targetRealmId = targets[0].ownerId;
      if (!realm.wars.includes(targetRealmId) && state.realms[targetRealmId]) {
         realm.wars.push(targetRealmId);
         state.realms[targetRealmId].wars.push(realm.id);
         state.logs.push(`OPORTUNISMO: ${realm.name} atacou ${state.realms[targetRealmId].name} abruptamente aproveitando de sua fraqueza!`);
      }
      executeAttack(state, realm, prov, targets[0]);
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

    // 1. Loyalty check (Priority 1)
    if (prov.loyalty < 45) {
       if (executeBuilding(state, realm, prov, 'courts')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }

    // 2. Resource check (Priority 2)
    if (realm.food < 100 && prov.population > prov.maxPopulation * 0.5) {
       if (executeBuilding(state, realm, prov, 'farms')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
    
    if (realm.gold < 100) {
       if (executeBuilding(state, realm, prov, 'mines')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }

    if (realm.materials < 50) {
       if (executeBuilding(state, realm, prov, 'workshops')) {
          realm.actionPoints -= ACTION_COSTS.build;
          continue;
       }
    }
  }
}


export function executeAttack(state: GameState, realm: Realm, attackerProv: Province, targetProv: Province) {
  const attackingArmy: Army = {
    infantry: Math.floor(attackerProv.army.infantry * 0.7),
    archers: Math.floor(attackerProv.army.archers * 0.7),
    cavalry: Math.floor(attackerProv.army.cavalry * 0.7),
    scouts: Math.floor(attackerProv.army.scouts * 0.7)
  };
  
  attackerProv.army.infantry -= attackingArmy.infantry;
  attackerProv.army.archers -= attackingArmy.archers;
  attackerProv.army.cavalry -= attackingArmy.cavalry;
  attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry;
  
  const effectiveDefense = Math.max(0, targetProv.defense - (targetProv.siegeDamage || 0));
  const result = resolveCombat(attackingArmy, targetProv.army, targetProv.terrain, effectiveDefense);
  
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
    const oldOwner = state.realms[oldOwnerId];
    const oldOwnerName = oldOwner?.name || 'Desconhecido';
    targetProv.ownerId = realm.id;
    targetProv.army = result.attackerRemaining;
    targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
    targetProv.siegeDamage = 0; // Reset siege damage on conquest
    
    // Attempt to retreat surviving defenders
    const totalDefenderRemaining = result.defenderRemaining.infantry + result.defenderRemaining.archers + result.defenderRemaining.cavalry;
    if (totalDefenderRemaining > 0) {
      const retreatOptions = targetProv.neighbors.map(nId => state.provinces[nId]).filter(p => p.ownerId === oldOwnerId);
      if (retreatOptions.length > 0) {
        // Retreat to the strongest friendly neighbor to group forces
        const retreatProv = retreatOptions.sort((a, b) => b.troops - a.troops)[0];
        retreatProv.army.infantry += result.defenderRemaining.infantry;
        retreatProv.army.archers += result.defenderRemaining.archers;
        retreatProv.army.cavalry += result.defenderRemaining.cavalry;
        retreatProv.troops = retreatProv.army.infantry + retreatProv.army.archers + retreatProv.army.cavalry;
        state.logs.push(`RETIRADA: Os sobreviventes de ${targetProv.name} recuaram para ${retreatProv.name}.`);
      } else {
        state.logs.push(`ANIQUILAÇÃO: Sem ter para onde fugir, os últimos defensores de ${targetProv.name} foram destruídos.`);
      }
    }

    state.logs.push(`CONQUISTA: ${realm.name} tomou ${targetProv.name} de ${oldOwnerName}!`);
    realm.overextension = Math.min(100, realm.overextension + 15);
    targetProv.recentlyConquered = 10; // 10 turns of penalty
    targetProv.loyalty = 30; // Drops significantly on conquest
    
    // Choose new capital if needed
    if (state.realms[oldOwnerId].capitalId === targetProv.id) {
       const remaining = Object.values(state.provinces).filter(p => p.ownerId === oldOwnerId && p.id !== targetProv.id);
       if (remaining.length > 0) {
          state.realms[oldOwnerId].capitalId = remaining.sort((a, b) => b.population - a.population)[0].id;
          state.logs.push(`GOVERNO: ${oldOwnerName} moveu sua sede de poder para ${state.provinces[state.realms[oldOwnerId].capitalId!].name}.`);
       }
    }
    
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
    
    // Apply siege damage if defense is high
    if (targetProv.defense > (targetProv.siegeDamage || 0)) {
       targetProv.siegeDamage = (targetProv.siegeDamage || 0) + 1;
       state.logs.push(`CERCO: As fortificações de ${targetProv.name} sofreram danos no ataque.`);
    }
  }
}

function executeRecruitment(state: GameState, realm: Realm, prov: Province) {
  // AI recruitment logic: try to balance or pick best available
  const unitTypes: UnitType[] = ['infantry', 'archers', 'cavalry', 'scouts'];
  
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

export function executeBuilding(state: GameState, realm: Realm, prov: Province, type: 'farms' | 'mines' | 'workshops' | 'courts' | 'fortify'): boolean {
  const stats = (BUILDING_STATS as any)[type];
  if (!stats) return false;

  const goldCost = stats.gold || 0;
  const matCost = stats.materials || 0;

  if (realm.gold >= goldCost && realm.materials >= matCost) {
    if (type === 'fortify') {
      if (prov.defense < 5) {
        prov.defense += 1;
        realm.gold -= goldCost;
        realm.materials -= matCost;
        return true;
      }
    } else {
      prov.buildings[type] += 1;
      realm.gold -= goldCost;
      realm.materials -= matCost;
      return true;
    }
  }
  return false;
}

export function processEndOfTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Calculate income and maintenance for all realms
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    const distances = calculateAdminDistances(newState, realm.id);
    
    // Reset Action Points
    realm.actionPoints = realm.maxActionPoints;

    // Overextension decay
    if (realm.overextension > 0) {
      realm.overextension = Math.max(0, realm.overextension - 5);
    }

    // Memory and War decay/updates
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

    // Production & Politics
    let goldIncome = 0;
    let foodIncome = 0;
    let materialIncome = 0;
    let goldMaintenance = 0;
    let foodMaintenance = 0;

    ownedProvinces.forEach(p => {
      // 1. Update Loyalty
      let loyaltyChange = 0;
      if (p.loyalty > 55) loyaltyChange -= 1;
      else if (p.loyalty < 45) loyaltyChange += 1;

      const dist = distances[p.id] || 0;
      loyaltyChange -= dist * 1.5;
      loyaltyChange -= Math.floor(realm.overextension / 10);

      if (p.id === realm.capitalId) loyaltyChange += 10;
      loyaltyChange += p.buildings.courts * BUILDING_PRODUCTION.courts;
      loyaltyChange += Math.floor(p.troops / 50);

      if (p.recentlyConquered > 0) {
        loyaltyChange -= 5;
        p.recentlyConquered--;
      }
      if (realm.gold <= 0 || realm.food <= 0) loyaltyChange -= 10;

      p.loyalty = Math.max(0, Math.min(100, p.loyalty + loyaltyChange));

      // 2. Production
      const loyaltyFactor = 0.5 + (p.loyalty / 200);
      // Ensure even low-pop provinces produce at least 50% potential
      const efficiency = (0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor;
      
      goldIncome += (p.wealth + (p.buildings.mines * BUILDING_PRODUCTION.mines)) * efficiency;
      foodIncome += (p.foodProduction + (p.buildings.farms * BUILDING_PRODUCTION.farms)) * efficiency;
      materialIncome += (p.materialProduction + (p.buildings.workshops * BUILDING_PRODUCTION.workshops)) * efficiency;

      // Strategic Resources
      if (p.strategicResource === 'iron') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'wood') materialIncome += 5 * efficiency;
      if (p.strategicResource === 'horse') foodIncome += 5 * efficiency;
      if (p.strategicResource === 'stone') materialIncome += 5 * efficiency;

      // Population Growth
      if (p.population < p.maxPopulation) {
        const growth = Math.floor(p.population * 0.07 * efficiency);
        p.population = Math.min(p.maxPopulation, p.population + growth);
      }

      // 3. Maintenance
      goldMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.gold;
      goldMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.gold;
      goldMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.gold;
      goldMaintenance += p.army.scouts * UNIT_STATS.scouts.maintenance.gold;

      foodMaintenance += p.army.infantry * UNIT_STATS.infantry.maintenance.food;
      foodMaintenance += p.army.archers * UNIT_STATS.archers.maintenance.food;
      foodMaintenance += p.army.cavalry * UNIT_STATS.cavalry.maintenance.food;
      foodMaintenance += p.army.scouts * UNIT_STATS.scouts.maintenance.food;

      // 4. Rebellion check
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

    // Handle Deficits
    if (realm.gold < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.gold * 10), 'gold', newState);
    }
    if (realm.food < 0) {
      handleResourceDeficit(realm, ownedProvinces, -Math.floor(realm.food * 5), 'food', newState);
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

  // Process march orders — advance each by one province
  processMarchOrders(newState);

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
      prov.army.scouts -= Math.floor(prov.army.scouts * ratio);
      prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts;
      remainingLoss -= loss;
    }
  }
  if (realm.isPlayer) {
    state.logs.push(type === 'gold' ? `Tesouro vazio! Tropas desertaram.` : `Fome! Tropas morrendo.`);
  }
}


/** BFS pathfinding: find shortest path between two province IDs.
 *  If isScout=true, traverses any province (ignores ownership).
 *  If isScout=false, only travels through player-owned provinces (for regular movement). */
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

      // Regular armies can only travel through provinces they own until reaching destination
      // Scouts can go anywhere
      const canTraverse = isScout || neighbor.ownerId === realmId || nId === toId;
      if (!canTraverse) continue;

      const newPath = [...path, nId];
      if (nId === toId) return newPath;

      visited.add(nId);
      queue.push({ id: nId, path: newPath });
    }
  }

  return []; // No path found
}

/** Avança todas as ordens de marcha em uma província por turno */
function processMarchOrders(state: GameState) {
  if (!state.marchOrders) { state.marchOrders = []; return; }

  const toRemove: string[] = [];

  state.marchOrders.forEach(order => {
    if (order.remainingPath.length === 0) {
      // Arrived at destination; merge troops into current province
      const prov = state.provinces[order.currentProvId];
      if (prov) {
        if (!order.isScoutMission) {
          // Regular troops: merge into province if friendly
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
          // Scouts complete mission: they stay hidden, just provide vision
          // We merge them back to closest friendly territory
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

    // Advance one step
    const nextProvId = order.remainingPath[0];
    const nextProv = state.provinces[nextProvId];

    if (!nextProv) {
      toRemove.push(order.id);
      return;
    }

    // For regular armies: if the next province is enemy, cancel the march
    if (!order.isScoutMission && nextProv.ownerId !== order.realmId && nextProv.ownerId !== 'neutral') {
      // Return troops to current province
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
  if (Math.random() < 0.25) {
    const events: GameEvent[] = [
      { name: "Colheita Farta", description: "Uma temporada de clima perfeito impulsionou a produção de alimentos.", type: 'positive' },
      { name: "Peste", description: "Uma doença misteriosa está se espalhando por regiões superpovoadas.", type: 'negative' },
      { name: "Corrida do Ouro", description: "Novos veios de ouro foram descobertos em terras estáveis.", type: 'positive' },
      { name: "Revolta Camponesa", description: "Impostos altos e abandono levaram camponeses a pegar em armas.", type: 'negative' },
      { name: "Avanço Diplomático", description: "Um grande banquete melhorou as relações.", type: 'positive' },
      { name: "Sede Administrativa", description: "A eficiência da capital inspira províncias vizinhas.", type: 'positive' }
    ];
    
    // Conditional Selection
    const provIds = Object.keys(state.provinces);
    const randomProv = state.provinces[provIds[Math.floor(Math.random() * provIds.length)]];
    const realm = state.realms[randomProv.ownerId];

    let event = events[Math.floor(Math.random() * events.length)];
    
    // Refining event choice based on state
    if (event.name === "Peste" && randomProv.population < randomProv.maxPopulation * 0.7) {
       event = events[0]; // Fallback to harvest
    }
    if (event.name === "Revolta Camponesa" && randomProv.loyalty > 40) {
       event = events[4]; // Fallback to diplomatic
    }
    if (event.name === "Sede Administrativa" && realm.overextension > 30) {
       event = { name: "Crise de Gestão", description: "O peso do império está esmagando a burocracia central.", type: 'negative' };
    }

    state.currentEvent = event;
    state.logs.push(`EVENTO: ${event.name} - ${event.description}`);

    if (event.name === "Colheita Farta") {
      Object.values(state.realms).forEach(r => { r.food += 100; });
    } else if (event.name === "Peste") {
       randomProv.population = Math.floor(randomProv.population * 0.7);
       state.logs.push(`A peste atingiu severamente ${randomProv.name}.`);
    } else if (event.name === "Corrida do Ouro") {
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
    } else if (event.name === "Crise de Gestão") {
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
