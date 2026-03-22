import * as d3 from 'd3';
import { GameState, Realm, Province, Terrain, GameSettings } from '../types';
import { REALM_NAMES, REALM_COLORS, PROVINCE_NAMES, STRATEGIC_RESOURCES, PERSONALITIES, OBJECTIVES } from './gameConstants';
import { calculateVisibility } from './turnLogic';

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
        name: REALM_NAMES[i % REALM_NAMES.length],
        color: REALM_COLORS[i % REALM_COLORS.length],
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
      const army = {
        infantry: Math.floor(Math.random() * 30) + 20,
        archers: Math.floor(Math.random() * 15) + 5,
        cavalry: Math.floor(Math.random() * 5),
        scouts: 0
      };

      provinces[`prov_${i}`] = {
        id: `prov_${i}`,
        name: PROVINCE_NAMES[i % PROVINCE_NAMES.length],
        ownerId: 'neutral',
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
        buildings: { farms: 0, mines: 0, workshops: 0, courts: 0 },
        siegeDamage: 0,
        loyalty: 100,
        recentlyConquered: 0
      };
    }

    // Contiguous Distribution
    const unassigned = new Set(Object.keys(provinces));
    const frontier: { provinceId: string; realmId: string }[] = [];
    const shuffledIds = [...Object.keys(provinces)].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numRealms; i++) {
        const seedId = shuffledIds[i];
        provinces[seedId].ownerId = `realm_${i}`;
        unassigned.delete(seedId);
        provinces[seedId].neighbors.forEach(nId => {
            if (unassigned.has(nId)) frontier.push({ provinceId: nId, realmId: `realm_${i}` });
        });
    }
    
    while (unassigned.size > 0 && frontier.length > 0) {
        const index = Math.floor(Math.random() * frontier.length);
        const { provinceId, realmId } = frontier.splice(index, 1)[0];
        if (unassigned.has(provinceId)) {
            provinces[provinceId].ownerId = realmId;
            unassigned.delete(provinceId);
            provinces[provinceId].neighbors.forEach(nId => {
                if (unassigned.has(nId)) frontier.push({ provinceId: nId, realmId });
            });
        }
    }
    
    unassigned.forEach(pId => {
        const nId = provinces[pId].neighbors.find(n => provinces[n].ownerId !== 'neutral');
        provinces[pId].ownerId = nId ? provinces[nId].ownerId : `realm_${Math.floor(Math.random() * numRealms)}`;
    });

    Object.values(realms).forEach(realm => {
      const owned = Object.values(provinces).filter(p => p.ownerId === realm.id);
      if (owned.length > 0) {
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
      activeWars: [],
      settings
    };

    initialState.visibleProvinces = calculateVisibility(initialState);
    return initialState;
  } catch (error) {
    console.error("Error in generateInitialState:", error);
    throw error;
  }
}
