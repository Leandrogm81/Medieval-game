import * as d3 from 'd3';
import { GameState, Realm, Province, Terrain, GameSettings } from '../types';
import { REALM_NAMES, REALM_COLORS, STRATEGIC_RESOURCES, PERSONALITIES, OBJECTIVES } from './game-constants';
import { calculateVisibility } from './turnLogic';
import { isLand, generateProvinceName, WORLD_WIDTH, WORLD_HEIGHT } from './worldMap';

export function generateInitialState(width: number, height: number, settings: GameSettings): GameState {
  console.log("Generating initial state...");
  try {
    const MAP_PADDING = 32;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const clampCenter = (center: [number, number]): [number, number] => ([
      clamp(center[0], MAP_PADDING, width - MAP_PADDING),
      clamp(center[1], MAP_PADDING, height - MAP_PADDING)
    ]);

    const numRealms = Math.max(1, settings.numRealms || 1);
    const numProvinces = Math.max(numRealms, settings.numProvinces || 5);
    const { resourceDensity } = settings;

    // ============================================================
    // MEGA MAPA MUNDI: amostragem de pontos apenas em TERRA.
    // Rejection sampling sobre a máscara de continentes (worldMap).
    // ============================================================
    let points: [number, number][] = [];
    const maxAttempts = numProvinces * 60;
    let attempts = 0;
    while (points.length < numProvinces && attempts < maxAttempts) {
      attempts++;
      const x = Math.random() * width;
      const y = Math.random() * height;
      if (isLand(x, y)) {
        points.push([x, y]);
      }
    }
    // Fallback: se a máscara não preencheu tudo (configuração mínima), completa no oceano
    while (points.length < numProvinces) {
      points.push([Math.random() * width, Math.random() * height]);
    }

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
        nonAggressionPacts: [],
        defensivePacts: [],
        tributeFrom: {},
        tributeTo: {},
        napExpiryTurn: {},
        tradeRoutes: [],
        tradesThisTurn: 0,
        personality: PERSONALITIES[i % PERSONALITIES.length],
        objective: OBJECTIVES[i % OBJECTIVES.length],
        vassals: [],
        techPoints: 0,
        unlockedTechs: [],
        loans: [],
        warExhaustion: 0,
        // Fase 2 — Tecnologia e Governos
        techLevels: { movement: 0, assimilation: 0, recruitment: 0, combat: 0 },
        government: 'monarchy',
        governmentChangeCooldown: 0,
        vassalLiberty: {},
        // Fase 2 — Estatísticas de tracking
        battlesWon: 0,
        realmsDefeated: 0,
        cumulativeGold: 0,
        maxProvincesHeld: 0
      };
    }

    // Initialize relations and memory
    const createMemory = () => ({
      betrayal: 0,
      help: 0,
      aggression: 0,
      lastWarTurn: 0,
      warExhaustion: 0
    });

    for (let i = 0; i < numRealms; i++) {
      for (let j = 0; j < numRealms; j++) {
        if (i !== j) {
          realms[`realm_${i}`].relations[`realm_${j}`] = 0;
          realms[`realm_${i}`].memory[`realm_${j}`] = createMemory();
        }
      }
    }

    const provinces: Record<string, Province> = {};
    for (let i = 0; i < numProvinces; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;

      const neighbors = Array.from(voronoi.neighbors(i)).map(n => `prov_${n}`);
      const centerPoint = clampCenter(points[i]);
      // Mega mapa: célula é oceano se o centro NÃO está em terra
      const isWater = !isLand(centerPoint[0], centerPoint[1]);

      // Terreno apenas para terra; oceano não tem produção
      let terrain: Terrain = 'plains';
      if (!isWater) {
        const terrainRand = Math.random();
        terrain = terrainRand < 0.5 ? 'plains' : terrainRand < 0.8 ? 'forest' : 'mountain';
      }

      let wealth = 0;
      let foodProduction = 0;
      let materialProduction = 0;

      if (!isWater) {
        wealth = Math.floor(Math.random() * 3) + 1;
        foodProduction = Math.floor(Math.random() * 3) + 1;
        materialProduction = Math.floor(Math.random() * 2) + 1;

        if (terrain === 'plains') foodProduction += 3;
        if (terrain === 'mountain') {
          wealth += 2;
          materialProduction += 2;
        }
        if (terrain === 'forest') materialProduction += 3;
      }

      const pop = isWater ? 0 : Math.floor(Math.random() * 500) + 500;
      const army = {
        infantry: isWater ? 0 : Math.floor(Math.random() * 10) + 5,
        archers: isWater ? 0 : Math.floor(Math.random() * 3) + 1,
        cavalry: 0,
        scouts: 0
      };

      provinces[`prov_${i}`] = {
        id: `prov_${i}`,
        name: isWater ? 'Oceano' : generateProvinceName(i, centerPoint[0], centerPoint[1]),
        ownerId: isWater ? 'neutral' : 'neutral',
        army,
        troops: army.infantry + army.archers + army.cavalry + army.scouts,
        population: pop,
        maxPopulation: pop + (isWater ? 0 : 500),
        strategicResource: !isWater && Math.random() < (resourceDensity === 'high' ? 0.6 : resourceDensity === 'low' ? 0.2 : 0.4) 
          ? STRATEGIC_RESOURCES[Math.floor(Math.random() * (STRATEGIC_RESOURCES.length - 1)) + 1] 
          : 'none',
        wealth,
        foodProduction,
        materialProduction,
        defense: isWater ? 0 : Math.floor(Math.random() * 2),
        terrain,
        neighbors,
        polygon: polygon.map(p => [p[0], p[1]] as [number, number]),
        center: centerPoint,
        buildings: { farms: 0, mines: 0, workshops: 0, courts: 0 },
        siegeDamage: 0,
        loyalty: 100,
        stability: 70,
        recentlyConquered: 0,
        isWater
      };
    }

    // ============================================================
    // Contiguous Distribution — apenas em TERRA (pulos de oceano)
    // ============================================================
    const unassigned = new Set(Object.keys(provinces).filter(id => !provinces[id].isWater));
    const frontier: { provinceId: string; realmId: string }[] = [];
    const landIds = [...unassigned].sort(() => Math.random() - 0.5);

    // Seeds dos reinos: espalhados entre continentes (evita 2 reinos no mesmo canto)
    const realmSeeds: string[] = [];
    const seedPool = [...landIds];
    for (let i = 0; i < numRealms && seedPool.length > 0; i++) {
      // Pega o ponto de terra mais distante dos seeds já escolhidos (farthest-point)
      let bestId = seedPool[Math.floor(Math.random() * seedPool.length)];
      let bestDist = -1;
      for (const candidateId of seedPool) {
        const c = provinces[candidateId].center;
        let minDist = Infinity;
        for (const seedId of realmSeeds) {
          const s = provinces[seedId].center;
          const d = Math.hypot(c[0] - s[0], c[1] - s[1]);
          if (d < minDist) minDist = d;
        }
        if (minDist > bestDist) {
          bestDist = minDist;
          bestId = candidateId;
        }
      }
      realmSeeds.push(bestId);
      seedPool.splice(seedPool.indexOf(bestId), 1);
    }

    realmSeeds.forEach((seedId, i) => {
      provinces[seedId].ownerId = `realm_${i}`;
      unassigned.delete(seedId);
      provinces[seedId].neighbors.forEach(nId => {
        const nProv = provinces[nId];
        if (nProv && !nProv.isWater && unassigned.has(nId)) frontier.push({ provinceId: nId, realmId: `realm_${i}` });
      });
    });

    while (unassigned.size > 0 && frontier.length > 0) {
      const index = Math.floor(Math.random() * frontier.length);
      const { provinceId, realmId } = frontier.splice(index, 1)[0];
      if (unassigned.has(provinceId)) {
        provinces[provinceId].ownerId = realmId;
        unassigned.delete(provinceId);
        provinces[provinceId].neighbors.forEach(nId => {
          const nProv = provinces[nId];
          if (nProv && !nProv.isWater && unassigned.has(nId)) frontier.push({ provinceId: nId, realmId });
        });
      }
    }

    unassigned.forEach(pId => {
      const nId = provinces[pId].neighbors.find(n => provinces[n] && !provinces[n].isWater && provinces[n].ownerId !== 'neutral');
      provinces[pId].ownerId = nId ? provinces[nId].ownerId : `realm_${Math.floor(Math.random() * numRealms)}`;
    });

    Object.values(realms).forEach(realm => {
      const owned = Object.values(provinces).filter(p => p.ownerId === realm.id && !p.isWater);
      if (owned.length > 0) {
        realm.capitalId = owned[Math.floor(owned.length / 2)].id;
        provinces[realm.capitalId].loyalty = 100;
        provinces[realm.capitalId].stability = 80;
        provinces[realm.capitalId].buildings.courts = 1;
      }
    });

    const playerRealmId = 'realm_0';
    const initialState: GameState = {
      schemaVersion: 2,
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
