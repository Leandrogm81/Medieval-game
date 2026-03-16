import * as d3 from 'd3';
import { GameState, Province, Realm, Terrain, GameEvent } from './types';

const REALM_NAMES = ["Avalon", "Eldoria", "Thalassa", "Gondor", "Rohan", "Mercia", "Wessex", "Northumbria"];
const REALM_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];
const PROVINCE_NAMES = [
  "Aethelgard", "Blythe", "Cairn", "Dunwich", "Eversong", "Falkreath", "Glimmer", "Hearth",
  "Ilium", "Jorvik", "Kaelen", "Lothian", "Mourn", "Nessa", "Oakhaven", "Prydwen",
  "Qarth", "Riven", "Storms End", "Tarn", "Ulthuan", "Valeria", "Winterfell", "Xanadu",
  "Ysgard", "Zendikar", "Aldor", "Bael", "Cormyr", "Dalaran"
];

export function generateInitialState(width: number, height: number, numProvinces: number, numRealms: number): GameState {
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
      gold: 100,
      food: 100,
      materials: 50,
      isPlayer: i === 0,
      relations: {},
      alliances: [],
      wars: [],
      pacts: [],
      tradeRoutes: []
    };
  }

  // Initialize relations
  for (let i = 0; i < numRealms; i++) {
    for (let j = 0; j < numRealms; j++) {
      if (i !== j) {
        realms[`realm_${i}`].relations[`realm_${j}`] = 0;
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

    provinces[`prov_${i}`] = {
      id: `prov_${i}`,
      name: PROVINCE_NAMES[i % PROVINCE_NAMES.length],
      ownerId: `realm_${i % numRealms}`, // Distribute evenly initially
      troops: Math.floor(Math.random() * 50) + 50,
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

  return {
    turn: 1,
    realms,
    provinces,
    playerRealmId: 'realm_0',
    logs: ["Welcome to Medieval Realms!"],
    currentEvent: null,
    visualEffects: []
  };
}

export function checkGameOver(state: GameState): { winnerId: string, reason: string } | null {
  const provinceCounts: Record<string, number> = {};
  const totalProvinces = Object.keys(state.provinces).length;

  Object.values(state.provinces).forEach(p => {
    provinceCounts[p.ownerId] = (provinceCounts[p.ownerId] || 0) + 1;
  });

  for (const realmId in provinceCounts) {
    if (provinceCounts[realmId] >= totalProvinces * 0.7) {
      return {
        winnerId: realmId,
        reason: `${state.realms[realmId].name} has conquered over 70% of the known world!`
      };
    }
  }

  const activeRealms = Object.keys(provinceCounts);
  if (activeRealms.length === 1) {
    return {
      winnerId: activeRealms[0],
      reason: `${state.realms[activeRealms[0]].name} is the last realm standing.`
    };
  }

  return null;
}

export function resolveCombat(attackerTroops: number, defenderTroops: number, terrain: Terrain, defense: number): { attackerRemaining: number, defenderRemaining: number, won: boolean } {
  let terrainBonus = 0;
  if (terrain === 'forest') terrainBonus = 0.2;
  if (terrain === 'mountain') terrainBonus = 0.5;
  
  const defenseBonus = defense * 0.1;
  const defenderPower = defenderTroops * (1 + terrainBonus + defenseBonus);
  
  if (attackerTroops > defenderPower) {
    // Attacker wins
    const losses = Math.floor(defenderPower);
    return { attackerRemaining: attackerTroops - losses, defenderRemaining: 0, won: true };
  } else {
    // Defender wins
    const losses = Math.floor(attackerTroops / (1 + terrainBonus + defenseBonus));
    return { attackerRemaining: 0, defenderRemaining: defenderTroops - losses, won: false };
  }
}

export function processAITurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    if (realm.isPlayer) return;
    
    // AI Logic
    // 1. Collect income (already done at end of turn, but AI needs to know current gold)
    // Actually, income is processed globally at the end of the turn.
    // AI just uses its current gold.
    
    let availableGold = realm.gold;
    
    // Find owned provinces
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    
    // Simple AI:
    // 1. If bordering enemy and has more troops, attack.
    // 2. If bordering enemy and weak, recruit.
    // 3. If safe, move troops towards borders.
    
    for (const prov of ownedProvinces) {
      const enemyNeighbors = prov.neighbors
        .map(nId => newState.provinces[nId])
        .filter(n => {
          if (!n || n.ownerId === realm.id) return false;
          
          const targetRealmId = n.ownerId;
          if (realm.alliances.includes(targetRealmId)) return false;
          if (realm.pacts.includes(targetRealmId)) return false;
          
          // Less likely to consider as "enemy" if relations are high
          const relations = realm.relations[targetRealmId] || 0;
          if (relations > 50) return Math.random() > 0.9; // 10% chance to consider enemy
          if (relations > 20) return Math.random() > 0.7; // 30% chance
          
          return true;
        });
        
      if (enemyNeighbors.length > 0) {
        // Border province
        const weakestEnemy = enemyNeighbors.sort((a, b) => a.troops - b.troops)[0];
        
        if (prov.troops > weakestEnemy.troops * 1.5) {
          // Consider increasing defense first if bordering enemy and defense is low
          if (prov.defense < 3 && availableGold >= 75) {
            prov.defense += 1;
            availableGold -= 75;
            newState.logs.push(`${realm.name} fortified ${prov.name} to level ${prov.defense}.`);
          } else {
            // Attack!
            const attackingTroops = Math.floor(prov.troops * 0.8);
            prov.troops -= attackingTroops;
            
            const result = resolveCombat(attackingTroops, weakestEnemy.troops, weakestEnemy.terrain, weakestEnemy.defense);
            
            // Add battle effect
            newState.visualEffects.push({
              id: `effect_${Date.now()}_${Math.random()}`,
              type: 'battle',
              x: weakestEnemy.center[0],
              y: weakestEnemy.center[1],
              duration: 2000,
              startTime: Date.now()
            });

            if (result.won) {
              weakestEnemy.ownerId = realm.id;
              weakestEnemy.troops = result.attackerRemaining;
              newState.logs.push(`${realm.name} conquered ${weakestEnemy.name}!`);
              
              // Conquest effect
              newState.visualEffects.push({
                id: `effect_conq_${Date.now()}_${Math.random()}`,
                type: 'conquest',
                x: weakestEnemy.center[0],
                y: weakestEnemy.center[1],
                duration: 2000,
                startTime: Date.now() + 500
              });

              // Attacking someone lowers relations
              realm.relations[weakestEnemy.ownerId] -= 50;
            } else {
              weakestEnemy.troops = result.defenderRemaining;
              prov.troops += result.attackerRemaining; // retreat
              
              // Siege effect: if attacker was strong but lost, reduce defense
              if (attackingTroops > weakestEnemy.troops * 1.2 && weakestEnemy.defense > 0) {
                weakestEnemy.defense -= 1;
                newState.logs.push(`${realm.name} failed to capture ${weakestEnemy.name}, but damaged its defenses.`);
              }
              
              realm.relations[weakestEnemy.ownerId] -= 25;
            }
          }
        } else if (availableGold >= 10) {
          // Recruit
          const recruitAmount = Math.floor(availableGold / 10) * 10;
          prov.troops += recruitAmount;
          availableGold -= (recruitAmount / 10);
        }
      } else {
        // Safe province, move troops to border
        if (prov.troops > 10) {
          const borderNeighbors = prov.neighbors
            .map(nId => newState.provinces[nId])
            .filter(n => n && n.ownerId === realm.id && n.neighbors.some(nnId => newState.provinces[nnId]?.ownerId !== realm.id));
            
          if (borderNeighbors.length > 0) {
            const target = borderNeighbors[0];
            const movingTroops = Math.floor(prov.troops * 0.8);
            prov.troops -= movingTroops;
            target.troops += movingTroops;
          }
        }
      }
    }
    
    realm.gold = availableGold;
  });
  
  return newState;
}

export function processEndOfTurn(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Calculate income and maintenance for all realms
  (Object.values(newState.realms) as Realm[]).forEach(realm => {
    const ownedProvinces = (Object.values(newState.provinces) as Province[]).filter(p => p.ownerId === realm.id);
    
    // Production
    const goldIncome = ownedProvinces.reduce((sum, p) => sum + p.wealth + (p.buildings.mines * 5), 0);
    const foodIncome = ownedProvinces.reduce((sum, p) => sum + p.foodProduction + (p.buildings.farms * 10), 0);
    const materialIncome = ownedProvinces.reduce((sum, p) => sum + p.materialProduction + (p.buildings.workshops * 5), 0);
    
    // Trade Income
    const tradeIncome = realm.tradeRoutes.reduce((sum, route) => {
      const p1 = newState.provinces[route.from];
      const p2 = newState.provinces[route.to];
      if (!p1 || !p2) return sum;
      return sum + Math.floor((p1.wealth + p2.wealth) * 0.5);
    }, 0);

    // Maintenance
    const totalTroops = ownedProvinces.reduce((sum, p) => sum + p.troops, 0);
    const goldMaintenance = Math.floor(totalTroops / 20); // 1 gold per 20 troops
    const foodMaintenance = Math.floor(totalTroops / 10); // 1 food per 10 troops
    
    realm.gold += goldIncome + tradeIncome - goldMaintenance;
    realm.food += foodIncome - foodMaintenance;
    realm.materials += materialIncome;

    // Handle Gold Deficit (Desertion)
    if (realm.gold < 0) {
      const deficit = -realm.gold;
      realm.gold = 0;
      let troopsToLose = deficit * 20;
      
      for (const prov of ownedProvinces) {
        if (troopsToLose <= 0) break;
        if (prov.troops > 0) {
          const loss = Math.min(prov.troops, troopsToLose);
          prov.troops -= loss;
          troopsToLose -= loss;
        }
      }
      if (realm.isPlayer && deficit > 0) {
        newState.logs.push(`Treasury empty! Troops deserted due to lack of pay.`);
      }
    }

    // Handle Food Deficit (Starvation - more severe)
    if (realm.food < 0) {
      const deficit = -realm.food;
      realm.food = 0;
      let troopsToLose = deficit * 10; // 1 food deficit = 10 troops lost
      
      for (const prov of ownedProvinces) {
        if (troopsToLose <= 0) break;
        if (prov.troops > 0) {
          const loss = Math.min(prov.troops, troopsToLose);
          prov.troops -= loss;
          troopsToLose -= loss;
        }
      }
      if (realm.isPlayer && deficit > 0) {
        newState.logs.push(`Famine! Troops starving due to lack of food.`);
      }
    }

    // Relationship Changes
    Object.keys(realm.relations).forEach(otherId => {
      // Decay towards 0
      if (realm.relations[otherId] > 0) realm.relations[otherId] -= 1;
      if (realm.relations[otherId] < 0) realm.relations[otherId] += 1;

      // Bonus for trade routes
      const hasTrade = realm.tradeRoutes.some(r => {
        const p1 = newState.provinces[r.from];
        const p2 = newState.provinces[r.to];
        return (p1.ownerId === realm.id && p2.ownerId === otherId) || 
               (p1.ownerId === otherId && p2.ownerId === realm.id);
      });
      if (hasTrade) realm.relations[otherId] += 3;

      // Clamp relations
      realm.relations[otherId] = Math.max(-100, Math.min(100, realm.relations[otherId]));
    });
  });
  
  newState.turn += 1;

  // Random Events
  newState.currentEvent = null;
  if (Math.random() < 0.2) { // 20% chance of an event
    const events: GameEvent[] = [
      { name: "Bountiful Harvest", description: "A season of perfect weather has boosted food production across the land.", type: 'positive' },
      { name: "Plague", description: "A mysterious sickness is spreading, weakening garrisons in several provinces.", type: 'negative' },
      { name: "Gold Rush", description: "New veins of gold have been discovered in the mountains.", type: 'positive' },
      { name: "Peasant Revolt", description: "High taxes have driven peasants in a random province to take up arms.", type: 'negative' },
      { name: "Diplomatic Breakthrough", description: "A grand feast has improved relations between all realms.", type: 'positive' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    newState.currentEvent = event;
    newState.logs.push(`EVENT: ${event.name} - ${event.description}`);

    // Apply event effects
    if (event.name === "Bountiful Harvest") {
      Object.values(newState.realms).forEach(r => { r.food += 100; });
    } else if (event.name === "Plague") {
      Object.values(newState.provinces).forEach(p => {
        if (Math.random() < 0.3) p.troops = Math.floor(p.troops * 0.8);
      });
    } else if (event.name === "Gold Rush") {
      Object.values(newState.realms).forEach(r => { r.gold += 150; });
    } else if (event.name === "Peasant Revolt") {
      const provIds = Object.keys(newState.provinces);
      const randomProv = newState.provinces[provIds[Math.floor(Math.random() * provIds.length)]];
      randomProv.troops = Math.max(0, randomProv.troops - 20);
      if (randomProv.buildings.farms > 0) randomProv.buildings.farms--;
      newState.logs.push(`Revolt in ${randomProv.name}! 20 troops lost and a farm destroyed.`);
    } else if (event.name === "Diplomatic Breakthrough") {
      Object.values(newState.realms).forEach(r => {
        Object.keys(r.relations).forEach(otherId => {
          r.relations[otherId] = Math.min(100, r.relations[otherId] + 10);
        });
      });
    }
  }
  
  const gameOver = checkGameOver(newState);
  if (gameOver) {
    newState.gameOver = gameOver;
    newState.logs.push(`GAME OVER: ${gameOver.reason}`);
  }

  return newState;
}
