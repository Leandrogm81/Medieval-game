// ============================================================
// worldMap.ts — Mapa Mundi procedural (continentes estilo Terra)
// Coordenadas no espaço do mapa (1280x720).
// A máscara define onde é TERRA. Tudo fora dela é oceano.
// ============================================================

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export interface ContinentDef {
  name: string;
  points: [number, number][];
}

// Continentes aproximados (silhueta estilizada do nosso mundo)
const CONTINENTS: ContinentDef[] = [
  {
    name: 'north_america',
    points: [
      [42, 120], [70, 100], [100, 110], [130, 95], [160, 110], [185, 90], [215, 100], [240, 115],
      [262, 130], [280, 145], [292, 165], [305, 185], [320, 205], [330, 225], [338, 250], [332, 270],
      [318, 285], [300, 292], [285, 305], [278, 320], [275, 340], [265, 355], [255, 370], [245, 380],
      [228, 385], [215, 372], [205, 360], [195, 348], [185, 340], [172, 335], [160, 325], [150, 312],
      [140, 300], [132, 288], [125, 275], [118, 258], [108, 240], [98, 222], [88, 205], [75, 188],
      [62, 172], [50, 152], [42, 135],
    ],
  },
  {
    name: 'south_america',
    points: [
      [262, 380], [278, 375], [295, 372], [310, 380], [322, 395], [330, 415], [335, 438], [336, 462],
      [330, 485], [320, 505], [308, 522], [295, 540], [282, 558], [270, 575], [262, 595], [258, 615],
      [252, 635], [244, 655], [238, 672], [230, 685], [222, 668], [228, 645], [232, 620], [234, 595],
      [235, 570], [238, 545], [240, 520], [238, 498], [234, 478], [230, 458], [228, 438], [230, 418],
      [238, 400], [248, 388],
    ],
  },
  {
    name: 'europe',
    points: [
      [492, 108], [520, 92], [552, 90], [582, 96], [610, 108], [632, 122], [648, 140], [658, 158],
      [660, 178], [652, 196], [640, 210], [625, 222], [608, 230], [590, 236], [572, 238], [555, 240],
      [540, 245], [528, 258], [520, 275], [508, 290], [495, 300], [482, 292], [472, 278], [464, 262],
      [458, 246], [452, 230], [448, 214], [446, 198], [448, 182], [454, 168], [462, 154], [472, 140],
      [482, 124],
    ],
  },
  {
    name: 'africa',
    points: [
      [470, 300], [488, 292], [508, 290], [528, 296], [548, 305], [566, 318], [580, 335], [590, 355],
      [596, 378], [598, 402], [596, 428], [590, 452], [582, 475], [570, 496], [556, 515], [540, 530],
      [522, 542], [505, 552], [490, 560], [478, 555], [466, 542], [456, 525], [448, 505], [442, 485],
      [438, 462], [436, 440], [436, 418], [438, 396], [442, 376], [448, 358], [456, 340], [462, 320],
    ],
  },
  {
    name: 'asia',
    points: [
      [660, 160], [680, 140], [705, 128], [730, 120], [760, 118], [790, 122], [820, 130], [848, 142],
      [872, 158], [892, 178], [908, 200], [918, 225], [924, 250], [926, 275], [922, 300], [914, 322],
      [902, 342], [888, 358], [872, 372], [855, 384], [838, 394], [822, 405], [808, 418], [796, 435],
      [788, 455], [782, 478], [775, 500], [762, 515], [745, 525], [728, 530], [712, 528], [698, 518],
      [686, 502], [676, 482], [668, 460], [662, 438], [656, 418], [650, 398], [646, 378], [642, 358],
      [638, 338], [634, 318], [630, 298], [626, 278], [622, 258], [618, 238], [614, 218], [636, 192],
    ],
  },
  {
    name: 'india',
    points: [
      [700, 420], [720, 412], [740, 418], [752, 435], [758, 458], [756, 482], [748, 505], [735, 522],
      [720, 532], [705, 528], [694, 515], [688, 498], [684, 478], [682, 458], [684, 440],
    ],
  },
  {
    name: 'southeast_asia',
    points: [
      [815, 430], [835, 420], [855, 425], [868, 442], [872, 462], [865, 480], [850, 492], [832, 496],
      [818, 490], [810, 472],
    ],
  },
  {
    name: 'australia',
    points: [
      [970, 475], [1000, 462], [1035, 458], [1070, 462], [1100, 475], [1120, 492], [1128, 515],
      [1122, 540], [1105, 560], [1082, 572], [1055, 578], [1028, 575], [1005, 565], [985, 550],
      [970, 530], [962, 505],
    ],
  },
  {
    name: 'greenland',
    points: [
      [400, 40], [425, 32], [452, 30], [475, 38], [490, 52], [495, 68], [488, 84], [472, 95],
      [450, 100], [428, 98], [410, 88], [398, 70],
    ],
  },
  {
    name: 'britain',
    points: [
      [472, 95], [484, 88], [498, 90], [506, 100], [502, 112], [492, 120], [480, 118], [472, 108],
    ],
  },
  {
    name: 'japan',
    points: [
      [930, 190], [938, 175], [950, 168], [962, 172], [968, 185], [962, 200], [950, 208], [938, 204],
    ],
  },
  {
    name: 'madagascar',
    points: [
      [560, 565], [570, 555], [582, 552], [590, 560], [588, 575], [578, 585], [566, 582],
    ],
  },
  {
    name: 'indonesia',
    points: [
      [880, 505], [895, 495], [915, 492], [935, 498], [948, 510], [940, 522], [920, 525], [900, 520],
    ],
  },
];

/**
 * Testa se um ponto (x, y) está dentro de um polígono (ray casting).
 */
function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const INLAND_LAKES: [number, number][][] = [
  // Caspian Sea
  [[630, 240], [645, 230], [658, 242], [652, 268], [638, 270], [628, 255]],
  // Black Sea
  [[570, 220], [592, 215], [608, 222], [598, 238], [576, 234]],
  // Great Lakes
  [[210, 180], [228, 175], [238, 188], [222, 198], [205, 190]],
  // Lake Victoria
  [[535, 410], [550, 405], [558, 420], [542, 428]]
];

/**
 * True se o ponto é TERRA (dentro de algum continente e fora de lagos continentais).
 */
export function isLand(x: number, y: number): boolean {
  // Margem oceânica
  if (x < 30 || x > WORLD_WIDTH - 30 || y < 25 || y > WORLD_HEIGHT - 25) return false;
  const inContinent = CONTINENTS.some(c => pointInPolygon(x, y, c.points));
  if (!inContinent) return false;
  if (INLAND_LAKES.some(lake => pointInPolygon(x, y, lake))) return false;
  return true;
}

export function isLakeArea(x: number, y: number): boolean {
  return INLAND_LAKES.some(lake => pointInPolygon(x, y, lake));
}

/**
 * Determina o bioma geograficamente realista com base em coordenadas reais da Terra.
 */
export function getBiomeForCoordinate(x: number, y: number, isWater: boolean, isCoastal: boolean): import('../types').Terrain {
  if (isWater) return 'plains';
  if (isLakeArea(x, y) && !isCoastal) return 'lake';

  // Desertos: Saara, Arábia, Gobi, Outback Australiano
  if ((x >= 450 && x <= 630 && y >= 280 && y <= 370) ||
      (x >= 630 && x <= 720 && y >= 290 && y <= 360) ||
      (x >= 750 && x <= 880 && y >= 220 && y <= 310) ||
      (x >= 990 && x <= 1090 && y >= 490 && y <= 550)) {
    return 'desert';
  }

  // Estepes: Estepes da Eurásia, Grandes Planícies, Savana Africana
  if ((x >= 640 && x <= 860 && y >= 150 && y <= 230) ||
      (x >= 120 && x <= 220 && y >= 200 && y <= 320) ||
      (x >= 480 && x <= 580 && y >= 430 && y <= 530)) {
    return 'steppe';
  }

  // Montanhas: Himalaia, Alpes, Andes, Rochosas
  if ((x >= 700 && x <= 850 && y >= 260 && y <= 350) ||
      (x >= 490 && x <= 570 && y >= 170 && y <= 210) ||
      (x >= 230 && x <= 265 && y >= 390 && y <= 620) ||
      (x >= 100 && x <= 150 && y >= 140 && y <= 280)) {
    return 'mountain';
  }

  // Florestas: Amazônia, Congo, Taiga, Selva Asiática
  if ((x >= 250 && x <= 330 && y >= 390 && y <= 510) ||
      (x >= 460 && x <= 560 && y >= 350 && y <= 450) ||
      (x >= 500 && x <= 850 && y >= 100 && y <= 165) ||
      (x >= 800 && x <= 920 && y >= 380 && y <= 490)) {
    return 'forest';
  }

  // Litoral / Praias
  if (isCoastal) return 'coastal';

  return 'plains';
}

/**
 * Nome do continente que contém o ponto (para nomes de províncias).
 */
export function continentAt(x: number, y: number): string | null {
  for (const c of CONTINENTS) {
    if (pointInPolygon(x, y, c.points)) return c.name;
  }
  return null;
}

// Nomes medievais por região (sufixos por continente)
const REGION_NAME_PARTS: Record<string, { prefixes: string[]; suffixes: string[] }> = {
  north_america: {
    prefixes: ['Novo', 'Alto', 'Baixo', 'Grande', 'Vale de', 'Costa de', 'Monte', 'Ilha de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Colina', 'Planície', 'Serra', 'Bosque', 'Castelo', 'Vila', 'Forte', 'Torre', 'Feudo', 'Condado'],
  },
  south_america: {
    prefixes: ['Sul', 'Novo', 'Grande', 'Costa de', 'Vale de', 'Selva de', 'Monte', 'Rio de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Selva', 'Serra', 'Castelo', 'Vila', 'Forte', 'Condado', 'Marquês'],
  },
  europe: {
    prefixes: ['Norte', 'Sul', 'Leste', 'Oeste', 'Alto', 'Baixo', 'Novo', 'Velho', 'Grande', 'Pequeno', 'Vale de', 'Monte', 'Costa de', 'Santo'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Colina', 'Planície', 'Serra', 'Bosque', 'Alcácer', 'Castelo', 'Vila', 'Burgos', 'Forte', 'Torre', 'Mosteiro', 'Feudo', 'Condado', 'Ducado', 'Baronia', 'Abadia', 'Cidadela'],
  },
  africa: {
    prefixes: ['Grande', 'Novo', 'Costa de', 'Vale de', 'Deserto de', 'Oásis de', 'Rio de', 'Monte'],
    suffixes: ['Reino', 'Vale', 'Oásis', 'Planície', 'Deserto', 'Serra', 'Castelo', 'Vila', 'Forte', 'Condado', 'Cidadela', 'Feudo'],
  },
  asia: {
    prefixes: ['Grande', 'Alto', 'Novo', 'Vale de', 'Monte', 'Rio de', 'Lago de', 'Deserto de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Serra', 'Bosque', 'Castelo', 'Vila', 'Burgos', 'Forte', 'Cidadela', 'Feudo', 'Ducado', 'Mosteiro'],
  },
  india: {
    prefixes: ['Grande', 'Sagrado', 'Novo', 'Vale de', 'Rio de', 'Monte'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Serra', 'Castelo', 'Vila', 'Forte', 'Cidadela', 'Feudo'],
  },
  southeast_asia: {
    prefixes: ['Grande', 'Novo', 'Vale de', 'Rio de', 'Costa de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Floresta', 'Serra', 'Castelo', 'Vila', 'Forte', 'Feudo'],
  },
  australia: {
    prefixes: ['Grande', 'Novo', 'Vale de', 'Rio de', 'Deserto de', 'Costa de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Deserto', 'Serra', 'Castelo', 'Vila', 'Forte', 'Feudo'],
  },
  greenland: {
    prefixes: ['Alto', 'Grande', 'Costa de', 'Geleira de'],
    suffixes: ['Reino', 'Vale', 'Fiorde', 'Planície', 'Serra', 'Castelo', 'Vila', 'Forte'],
  },
  britain: {
    prefixes: ['Norte', 'Sul', 'Alto', 'Baixo', 'Vale de', 'Costa de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Colina', 'Planície', 'Bosque', 'Castelo', 'Vila', 'Burgos', 'Forte', 'Condado', 'Ducado', 'Baronia', 'Abadia'],
  },
  japan: {
    prefixes: ['Grande', 'Alto', 'Novo', 'Vale de', 'Monte', 'Costa de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Serra', 'Bosque', 'Castelo', 'Vila', 'Forte', 'Feudo', 'Ducado'],
  },
  madagascar: {
    prefixes: ['Grande', 'Novo', 'Costa de', 'Vale de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Planície', 'Serra', 'Castelo', 'Vila', 'Forte'],
  },
  indonesia: {
    prefixes: ['Grande', 'Novo', 'Costa de', 'Ilha de', 'Vale de'],
    suffixes: ['Reino', 'Vale', 'Riacho', 'Floresta', 'Serra', 'Castelo', 'Vila', 'Forte', 'Feudo'],
  },
};

const DEFAULT_PARTS = REGION_NAME_PARTS.europe;

/**
 * Gera um nome de província determinístico (estável por índice) usando o
 * continente do ponto. Combinação variada prefixo × sufixo × numeral.
 */
export function generateProvinceName(index: number, x: number, y: number): string {
  const continent = continentAt(x, y);
  const parts = (continent && REGION_NAME_PARTS[continent]) || DEFAULT_PARTS;

  const numPrefixes = parts.prefixes.length;
  const numSuffixes = parts.suffixes.length;

  // Mistura determinística: índice saltado para variar prefixo/sufixo
  const pIdx = (index * 5 + Math.floor(index / numSuffixes)) % numPrefixes;
  const sIdx = (index * 3 + Math.floor(index / numPrefixes)) % numSuffixes;

  const prefix = parts.prefixes[pIdx];
  const suffix = parts.suffixes[sIdx];

  // Numeral romano quando o ciclo completo se repete
  const cycle = Math.floor(index / (numPrefixes * numSuffixes));
  const roman = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'][cycle] || ` ${cycle + 1}`;

  return `${prefix} ${suffix}${roman}`.trim();
}
