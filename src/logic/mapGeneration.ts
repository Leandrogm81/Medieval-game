import * as d3 from 'd3';
import { GameState, Realm, Province, Terrain, GameSettings } from '../types';
import { REALM_NAMES, REALM_COLORS, getUniqueRealmColor, STRATEGIC_RESOURCES, PERSONALITIES, OBJECTIVES } from './game-constants';
import { calculateVisibility } from './turnLogic';
import { isLand, generateProvinceName, getBiomeForCoordinate, WORLD_WIDTH, WORLD_HEIGHT } from './worldMap';

/**
 * Transforma um polígono Voronoi rígido em um caminho SVG orgânico com curvaturas naturais e perturbação ondulada.
 * Utiliza ordenação canônica de vértices para garantir que províncias vizinhas compartilhem EXATAMENTE a mesma curva de borda.
 */
function createOrganicPath(polygon: [number, number][]): string {
  if (!polygon || polygon.length < 3) return '';

  const n = polygon.length;
  const smoothed: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    // Ordenação canônica baseada nas coordenadas para que arestas compartilhadas sejam idênticas
    const k1 = p1[0] * 10000 + p1[1];
    const k2 = p2[0] * 10000 + p2[1];
    const flipped = k1 > k2;

    const pa = flipped ? p2 : p1;
    const pb = flipped ? p1 : p2;

    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const len = Math.hypot(dx, dy);

    const nx = len > 0 ? -dy / len : 0;
    const ny = len > 0 ? dx / len : 0;

    const m1X = pa[0] * 0.66 + pb[0] * 0.34;
    const m1Y = pa[1] * 0.66 + pb[1] * 0.34;

    const m2X = pa[0] * 0.34 + pb[0] * 0.66;
    const m2Y = pa[1] * 0.34 + pb[1] * 0.66;

    const offset1 = (Math.sin(m1X * 0.08 + m1Y * 0.05) * 1.8) + (Math.cos(m1X * 0.15 - m1Y * 0.12) * 1.0);
    const offset2 = (Math.sin(m2X * 0.09 - m2Y * 0.06) * 1.6) + (Math.cos(m2X * 0.14 + m2Y * 0.11) * 0.9);

    const q1: [number, number] = [m1X + nx * offset1, m1Y + ny * offset1];
    const q2: [number, number] = [m2X + nx * offset2, m2Y + ny * offset2];

    smoothed.push([p1[0], p1[1]]);
    if (!flipped) {
      smoothed.push(q1);
      smoothed.push(q2);
    } else {
      smoothed.push(q2);
      smoothed.push(q1);
    }
  }

  if (smoothed.length === 0) return '';
  let d = `M ${smoothed[0][0].toFixed(1)},${smoothed[0][1].toFixed(1)}`;
  for (let i = 1; i < smoothed.length - 1; i += 2) {
    const cp = smoothed[i];
    const ep = smoothed[i + 1];
    d += ` Q ${cp[0].toFixed(1)},${cp[1].toFixed(1)} ${ep[0].toFixed(1)},${ep[1].toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

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
    const numProvinces = Math.max(numRealms, settings.numProvinces || 500);
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
      const baseName = REALM_NAMES[i % REALM_NAMES.length];
      const cycle = Math.floor(i / REALM_NAMES.length);
      const realmName = cycle > 0 ? `${baseName} ${['II', 'III', 'IV', 'V'][cycle - 1] || cycle + 1}` : baseName;

      realms[`realm_${i}`] = {
        id: `realm_${i}`,
        name: realmName,
        color: getUniqueRealmColor(i, numRealms),
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

    // REGRA INQUEBRÁVEL: Nenhum reino rival pode ter a mesma cor que o jogador
    const playerColor = (realms['realm_0']?.color || REALM_COLORS[0]).toLowerCase();
    const assignedColors = new Set<string>([playerColor]);

    Object.values(realms).forEach(r => {
      if (r.id !== 'realm_0') {
        let col = r.color.toLowerCase();
        let colorOffset = 1;
        while (col === playerColor || assignedColors.has(col)) {
          const nextColor = getUniqueRealmColor(numRealms + colorOffset, numRealms + colorOffset + 10);
          r.color = nextColor;
          col = nextColor.toLowerCase();
          colorOffset++;
        }
        assignedColors.add(col);
      }
    });

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
      const isCoastal = !isWater && neighbors.some(n => {
        const nIndex = parseInt(n.replace('prov_', ''));
        const np = points[nIndex];
        return np && !isLand(np[0], np[1]);
      });

      // Terreno realista baseado em geografia real da Terra; oceano não tem produção
      let terrain: Terrain = 'plains';
      if (!isWater) {
        terrain = getBiomeForCoordinate(centerPoint[0], centerPoint[1], isWater, isCoastal);
      }

      let wealth = 0;
      let foodProduction = 0;
      let materialProduction = 0;

      if (!isWater) {
        wealth = Math.floor(Math.random() * 3) + 1;
        foodProduction = Math.floor(Math.random() * 3) + 1;
        materialProduction = Math.floor(Math.random() * 2) + 1;

        if (terrain === 'plains' || terrain === 'coastal') foodProduction += 3;
        if (terrain === 'mountain' || terrain === 'desert') {
          wealth += 2;
          materialProduction += 2;
        }
        if (terrain === 'forest' || terrain === 'steppe') materialProduction += 3;
        if (terrain === 'lake') foodProduction += 4;
      }

      const pop = isWater ? 0 : Math.floor(Math.random() * 500) + 500;
      const army = {
        infantry: isWater ? 0 : Math.floor(Math.random() * 10) + 5,
        archers: isWater ? 0 : Math.floor(Math.random() * 3) + 1,
        cavalry: 0,
        scouts: 0
      };

      const polyPoints = polygon.map(p => [p[0], p[1]] as [number, number]);

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
        polygon: polyPoints,
        center: centerPoint,
        buildings: { farms: 0, mines: 0, workshops: 0, courts: 0 },
        siegeDamage: 0,
        loyalty: 100,
        stability: 70,
        recentlyConquered: 0,
        isWater,
        organicPath: createOrganicPath(polyPoints)
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
