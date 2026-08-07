import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, ViewMode, ActionType, Province } from '../types';
import { motion } from 'motion/react';
import { isPlayerFleetOrTerritory } from '../logic/game-constants';

interface MapProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  onProvinceClick: (id: string, isDoubleClick?: boolean) => void;
  viewMode: ViewMode;
  previewPath: string[];
  marchAnimations: { id: string; from: [number, number]; to: [number, number]; troops: { infantry: number; archers: number; cavalry: number; scouts: number }; kind?: 'move' | 'attack' | 'scout'; realmId?: string }[];
  triggerMarchAnimation: (from: [number, number], to: [number, number], troops: { infantry: number; archers: number; cavalry: number; scouts: number }, kind?: 'move' | 'attack' | 'scout', realmId?: string) => void;
  actionState: ActionType;
  actionSourceId: string | null;
  multiSelectedProvinceIds: string[];
  onMultiSelectChange: (ids: string[]) => void;
  playerRealmId: string;
  zoom?: number; // Nível de zoom (LOD): re-renderiza labels/escudos para legibilidade
  onQuickAction?: (action: 'move' | 'attack' | 'disband', provinceId: string) => void;
  campaignWaypoints?: string[];
  isCampaignMode?: boolean;
}

function getHeatColor(value: number, hue: number): string {
  const saturation = 60 + Math.min(40, value * 40);
  const lightness = 25 + Math.min(35, value * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getEconomicScore(prov: Province): number {
  const totalProduction = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
  const buildingBonus = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0);
  return Math.min(1, (totalProduction + buildingBonus * 5) / 20);
}

function getMilitaryScore(prov: Province): number {
  return Math.min(1, (prov.troops || 0) / 100);
}

// ===== Fase 2 — Scores dos 7 novos modos de mapa (PRD-FASE-2 §4) =====
function getPopulationScore(prov: Province): number {
  const max = prov.maxPopulation || 1;
  return Math.min(1, (prov.population || 0) / max);
}

function getDevelopmentScore(prov: Province): number {
  const buildings = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0) + (prov.buildings?.courts || 0);
  return Math.min(1, ((prov.wealth || 0) + buildings * 3) / 30);
}

function getIncomeScore(prov: Province): number {
  const production = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
  return Math.min(1, production / 25);
}

function getStabilityScore(prov: Province): number {
  return Math.min(1, (prov.stability ?? 70) / 100);
}

function getBuildingsScore(prov: Province): number {
  const buildings = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0) + (prov.buildings?.courts || 0);
  return Math.min(1, buildings / 8);
}

function getGrowthScore(prov: Province): number {
  const max = prov.maxPopulation || 1;
  const ratio = (prov.population || 0) / max;
  // Maior crescimento quando há espaço para crescer e lealdade alta
  return Math.min(1, Math.max(0, (1 - ratio)) * ((prov.loyalty || 0) / 100));
}

function getMilitaryStrengthScore(prov: Province): number {
  return Math.min(1, (prov.troops || 0) / 150);
}

// Mapa de cores por modo: hue fixo por modo (0=vermelho, 120=verde, 200=azul, 45=amarelo...)
const MODE_HUES: Partial<Record<ViewMode, number>> = {
  population: 150,      // verde
  development: 210,     // azul
  income: 45,           // dourado
  stability: 0,         // vermelho (rebelde) → branco (leal) tratado separadamente
  buildings: 270,       // roxo
  growth: 190,          // ciano
  military_strength: 30 // laranja
};

function getModeScore(prov: Province, viewMode: ViewMode): number {
  switch (viewMode) {
    case 'population': return getPopulationScore(prov);
    case 'development': return getDevelopmentScore(prov);
    case 'income': return getIncomeScore(prov);
    case 'stability': return getStabilityScore(prov);
    case 'buildings': return getBuildingsScore(prov);
    case 'growth': return getGrowthScore(prov);
    case 'military_strength': return getMilitaryStrengthScore(prov);
    default: return 0;
  }
}

function getModeLabel(prov: Province, viewMode: ViewMode): string {
  switch (viewMode) {
    case 'population': return `${(prov.population || 0).toLocaleString('pt-BR')}`;
    case 'development': return `Dev: ${(prov.wealth || 0) + ((prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0) + (prov.buildings?.courts || 0))}`;
    case 'income': return `+${(prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0)}`;
    case 'stability': return `${prov.stability ?? 70}%`;
    case 'buildings': return `🏘️${(prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0) + (prov.buildings?.courts || 0)}`;
    case 'growth': return `+${Math.round(getGrowthScore(prov) * 100)}%`;
    case 'military_strength': return `⚔️${prov.troops || 0}`;
    default: return prov.name;
  }
}

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 720;
const LABEL_PADDING = 28;

function isSafeLabelPosition(center: [number, number]): boolean {
  const [x, y] = center;
  return x >= LABEL_PADDING && x <= MAP_WIDTH - LABEL_PADDING && y >= LABEL_PADDING && y <= MAP_HEIGHT - LABEL_PADDING;
}

function seededRandom(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

type SelectionRect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

// Terrain base color per province type (rich medieval natural tones)
function getTerrainBaseColor(terrain: string): string {
  switch (terrain) {
    case 'forest': return '#163020'; // Rich deep woodland green
    case 'mountain': return '#2f2926'; // High mountain stone gray
    case 'coastal': return '#1d332d'; // Coastal tide green-amber
    case 'desert': return '#3a301d'; // Arid desert golden sand
    case 'steppe': return '#32331f'; // Steppe savanna bronze
    case 'lake': return '#0e2b44'; // Inland lake deep blue
    case 'plains': return '#252e1e'; // Fertile rolling plains
    default: return '#252e1e';
  }
}

export const Map: React.FC<MapProps> = ({
  gameState,
  selectedProvinceId,
  onProvinceClick,
  viewMode,
  previewPath,
  marchAnimations,
  triggerMarchAnimation,
  actionState,
  actionSourceId,
  multiSelectedProvinceIds,
  onMultiSelectChange,
  playerRealmId,
  zoom = 1,
  onQuickAction,
  campaignWaypoints,
  isCampaignMode
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [hoveredProvId, setHoveredProvId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // ===== LOD (Level of Detail): re-renderiza conforme o zoom =====
  // Counter-scale REAL com vector-effect="non-scaling-stroke":
  // O wrapper aplica scale(zoom) via CSS. Aplicamos scale(1/zoom) nos grupos de rótulos
  // para que o tamanho na tela fique 100% constante, nítido e sem sobreposição.
  const lod = {
    // Prioridade de labels (densidade progressiva):
    //   0 = capitais, seleção, hover, províncias com conflito/tropas (zoom < 0.65)
    //   1 = províncias com tropas ou de jogadores (zoom 0.65 - 0.95)
    //   2 = províncias desenvolvidas (zoom 0.95 - 1.3)
    //   3 = todas as províncias visíveis (zoom >= 1.3)
    labelLevel: zoom < 0.65 ? 0 : zoom < 0.95 ? 1 : zoom < 1.3 ? 2 : 3,
  };

  // Calcula prioridade de label por província
  const getLabelPriority = (prov: Province): number => {
    if (prov.isWater) return 99; // nunca mostra label de oceano
    if (selectedProvinceId === prov.id || hoveredProvId === prov.id) return 0;
    if (gameState.realms[prov.ownerId]?.capitalId === prov.id) return 0;
    if (prov.troops > 0) return 1;
    const hasBuildings = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0) + (prov.buildings?.courts || 0) > 0;
    if (hasBuildings) return 2;
    return 3;
  };

  const provinces = useMemo(() => Object.values(gameState.provinces), [gameState.provinces]);
  const multiSelectedSet = useMemo(() => new Set(multiSelectedProvinceIds), [multiSelectedProvinceIds]);
  const sourceProv = actionSourceId ? gameState.provinces[actionSourceId] : null;
  const selectedProvince = selectedProvinceId ? gameState.provinces[selectedProvinceId] : null;
  const isOwn = isPlayerFleetOrTerritory(selectedProvince, playerRealmId);

  const getSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * MAP_WIDTH,
      y: ((clientY - rect.top) / rect.height) * MAP_HEIGHT
    };
  };

  useEffect(() => {
    if (!selectionRect) return;

    const updateSelection = (clientX: number, clientY: number) => {
      const point = getSvgPoint(clientX, clientY);
      if (!point) return;
      setSelectionRect(prev => prev ? { ...prev, endX: point.x, endY: point.y } : prev);
    };

    const handleMove = (event: MouseEvent) => {
      updateSelection(event.clientX, event.clientY);
    };

    const finalizeSelection = (event: MouseEvent) => {
      const point = getSvgPoint(event.clientX, event.clientY);
      const endX = point ? point.x : selectionRect?.endX ?? 0;
      const endY = point ? point.y : selectionRect?.endY ?? 0;

      if (selectionRect) {
        const left = Math.min(selectionRect.startX, endX);
        const right = Math.max(selectionRect.startX, endX);
        const top = Math.min(selectionRect.startY, endY);
        const bottom = Math.max(selectionRect.startY, endY);

        const inside = provinces
          .filter(prov => prov.ownerId === playerRealmId)
          .filter(prov => prov.center[0] >= left && prov.center[0] <= right && prov.center[1] >= top && prov.center[1] <= bottom)
          .map(prov => prov.id);

        onMultiSelectChange(inside);
      }
      setSelectionRect(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', finalizeSelection);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', finalizeSelection);
    };
  }, [onMultiSelectChange, playerRealmId, provinces, selectionRect]);

  const { maxEco, maxMil } = useMemo(() => {
    let maxEco = 0;
    let maxMil = 0;
    provinces.forEach(prov => {
      const eco = getEconomicScore(prov);
      const mil = getMilitaryScore(prov);
      if (eco > maxEco) maxEco = eco;
      if (mil > maxMil) maxMil = mil;
    });
    return { maxEco: maxEco || 1, maxMil: maxMil || 1 };
  }, [provinces]);

  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<{ provId: string; time: number } | null>(null);

  const handleProvinceClick = (provId: string, isShiftPressed: boolean) => {
    const province = gameState.provinces[provId];
    if (!province) return;

    const now = Date.now();
    if (lastClickRef.current && lastClickRef.current.provId === provId && (now - lastClickRef.current.time) < 300) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastClickRef.current = null;
      onMultiSelectChange([]);
      onProvinceClick(provId, true);
      return;
    }

    lastClickRef.current = { provId, time: now };
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      lastClickRef.current = null;
      if (isShiftPressed) {
        if (province.ownerId !== playerRealmId) return;

        let currentList = [...multiSelectedProvinceIds];

        if (currentList.length === 0 && selectedProvinceId) {
          const prevSelected = gameState.provinces[selectedProvinceId];
          if (prevSelected && prevSelected.ownerId === playerRealmId) {
            if (selectedProvinceId === provId) {
              onMultiSelectChange([provId]);
              return;
            }
            currentList = [selectedProvinceId];
          }
        }

        const currentSet = new Set(currentList);
        const next = currentSet.has(provId)
          ? currentList.filter(id => id !== provId)
          : [...currentList, provId];

        onMultiSelectChange(next);
        return;
      }

      onMultiSelectChange([]);
      onProvinceClick(provId, false);
    }, 220);
  };

  const beginSelection = (clientX: number, clientY: number) => {
    const point = getSvgPoint(clientX, clientY);
    if (!point) return;
    setSelectionRect({
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y
    });
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 2) return;
    event.preventDefault();
    event.stopPropagation();
    beginSelection(event.clientX, event.clientY);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!selectionRect) return;
    event.preventDefault();
    event.stopPropagation();
    const point = getSvgPoint(event.clientX, event.clientY);
    if (!point) return;
    setSelectionRect(prev => prev ? { ...prev, endX: point.x, endY: point.y } : prev);
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (!selectionRect) return;
    event.preventDefault();
    const point = getSvgPoint(event.clientX, event.clientY);
    if (point) {
      setSelectionRect(prev => prev ? { ...prev, endX: point.x, endY: point.y } : prev);
    }
  };

  const selectionBounds = selectionRect
    ? {
        x: Math.min(selectionRect.startX, selectionRect.endX),
        y: Math.min(selectionRect.startY, selectionRect.endY),
        width: Math.abs(selectionRect.endX - selectionRect.startX),
        height: Math.abs(selectionRect.endY - selectionRect.startY)
      }
    : null;

  const activeVisualEffects = useMemo(() => {
    return [...(gameState.visualEffects || [])]
      .filter(effect =>
        effect.type === 'battle_particles' ||
        effect.type === 'conquest_particles' ||
        effect.type === 'build_particles'
      )
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 3)
      .map(effect => {
        const province = effect.provinceId ? gameState.provinces[effect.provinceId] : null;
        return {
          ...effect,
          province,
        };
      })
      .filter(effect => effect.province);
  }, [gameState.provinces, gameState.visualEffects]);

  // Stable, dynamic organic island continent path (adapted to 1280x720 viewBox)
  const continentPath = useMemo(() => {
    if (provinces.length === 0) return '';
    const xs = provinces.map(p => p.center[0]);
    const ys = provinces.map(p => p.center[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const widthX = maxX - minX;
    const heightY = maxY - minY;

    // Dynamic diameter covering all provinces safely with outer sea spacing
    const baseRadius = Math.max(widthX, heightY, 480) * 0.7;

    const numPoints = 120;
    const pathPoints: [number, number][] = [];
    const seed = provinces.length * 7.5 + 42.12;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      let r = baseRadius;

      // Multi-octave natural coastal harmonics
      r += Math.sin(angle * 3 + seed) * (baseRadius * 0.16);
      r += Math.cos(angle * 7 - seed * 2) * (baseRadius * 0.08);
      r += Math.sin(angle * 13 + seed * 3) * (baseRadius * 0.04);
      r += Math.cos(angle * 29) * (baseRadius * 0.015);

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      pathPoints.push([x, y]);
    }

    return 'M ' + pathPoints.map(pt => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' L ') + ' Z';
  }, [provinces]);

  return (
    <div
      className={`relative w-full h-full ${actionState !== 'idle' ? 'cursor-crosshair' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1280 720"
        className={`block w-full h-full select-none bg-[#090d16] ${actionState !== 'idle' ? 'cursor-crosshair' : ''}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow Filters for selected assets */}
          <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0.96  0 1 0 0 0.7  0 0 1 0 0.15  0 0 0 1 0" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="multi-select-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0.98  0 1 0 0 0.75  0 0 1 0 0.05  0 0 0 1 0" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="red-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0.9  0 1 0 0 0.1  0 0 1 0 0.1  0 0 0 1 0" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Land Clip Path to map organic boundaries */}
          <clipPath id="map-land-clip">
            <path d={continentPath} />
          </clipPath>

          {/* Natural land base gradient */}
          <radialGradient id="land-gradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1e281f" />
            <stop offset="70%" stopColor="#162017" />
            <stop offset="100%" stopColor="#101811" />
          </radialGradient>

          {/* Sleek Strategic Sea Atmosphere */}
          <radialGradient id="ocean-gradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Deep Ocean Ambient Background */}
        <rect width="1280" height="720" fill="url(#ocean-gradient)" />

        {/* Antique Nautical Grid lines */}
        <g opacity="0.08" stroke="#38bdf8" strokeWidth="1" pointerEvents="none">
          {[128, 256, 384, 512, 640, 768, 896, 1024, 1152].map(val => (
            <React.Fragment key={`v-${val}`}>
              <line x1={val} y1="0" x2={val} y2="720" />
            </React.Fragment>
          ))}
          {[72, 144, 216, 288, 360, 432, 504, 576, 648].map(val => (
            <React.Fragment key={`h-${val}`}>
              <line x1="0" y1={val} x2="1280" y2={val} />
            </React.Fragment>
          ))}
        </g>

        {/* Medieval Map Winds Rose/Compass in the Ocean */}
        {!isMobile && (
          <g transform="translate(150, 150) scale(0.72)" opacity="0.32" className="pointer-events-none">
            <circle cx="0" cy="0" r="140" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="8,6" />
            <circle cx="0" cy="0" r="120" fill="none" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="0" cy="0" r="114" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />

            <polygon points="0,-110 8,-20 -8,-20" fill="#f59e0b" />
            <polygon points="0,110 8,20 -8,20" fill="#d97706" />
            <polygon points="110,0 20,8 20,-8" fill="#f59e0b" />
            <polygon points="-110,0 -20,8 -20,-8" fill="#d97706" />

            <polygon points="70,-70 14,-14 6,-22" fill="#94a3b8" />
            <polygon points="-70,70 -14,14 -6,22" fill="#64748b" />
            <polygon points="-70,-70 -14,-14 -22,-6" fill="#94a3b8" />
            <polygon points="70,70 14,14 22,6" fill="#64748b" />

            <text x="0" y="-120" textAnchor="middle" fill="#f8fafc" fontSize="16" fontWeight="bold" fontFamily="Georgia, serif" letterSpacing="4">SEPTENTRIO</text>
            <text x="0" y="135" textAnchor="middle" fill="#cbd5e1" fontSize="16" fontWeight="bold" fontFamily="Georgia, serif" letterSpacing="4">MERIDIES</text>
          </g>
        )}

        {/* Sailing Ship Vintage Silhouette in the Ocean */}
        {!isMobile && (
          <g transform="translate(1120, 150) scale(1.0)" className="opacity-[0.25] pointer-events-none hover:opacity-40 transition-opacity">
            <path
              d="M10,40 C10,45 20,48 40,48 C60,48 70,45 70,40 C70,38 65,36 60,35 C62,30 65,20 68,10 C62,12 55,15 50,20 C48,15 45,5 40,0 C38,10 35,22 38,32 C30,28 20,25 15,30 C12,32 10,35 10,40 Z"
              fill="#38bdf8"
            />
            <line x1="40" y1="48" x2="40" y2="2" stroke="#38bdf8" strokeWidth="2" />
            <path d="M5,52 C15,50 25,54 35,52 C45,50 55,54 65,52 C75,50 85,54 95,52" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
          </g>
        )}

        {/* Sea waves illustrations */}
        {!isMobile && (
          <g stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.22" strokeLinecap="round" fill="none" className="pointer-events-none">
            <path d="M 320, 200 C 330, 195 340, 205 350, 200 M 335, 203 C 340, 200 345, 205 350, 203" />
            <path d="M 980, 300 C 990, 295 1000, 305 1010, 300 M 995, 303 C 1000, 300 1005, 305 1010, 303" />
            <path d="M 250, 560 C 260, 555 270, 565 280, 560 M 265, 563 C 270, 560 275, 565 280, 563" />
            <path d="M 1100, 580 C 1110, 575 1120, 585 1130, 580 M 1115, 583 C 1120, 580 1125, 585 1130, 583" />
          </g>
        )}

        {/* Coastline Shallow Water foam effects */}
        <path
          d={continentPath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="38"
          strokeOpacity="0.12"
          className="pointer-events-none"
        />
        <path
          d={continentPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="16"
          strokeOpacity="0.2"
          className="pointer-events-none"
        />
        <path
          d={continentPath}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="4"
          strokeOpacity="0.45"
          className="pointer-events-none"
        />

        {/* ======================================================== */}
        {/* CONTIGUOUS PROVINCE REGIONS (Clipped within the landmass) */}
        {/* ======================================================== */}
        <g clipPath="url(#map-land-clip)">
          {/* Base dark solid earth color to seal any micro SVG gaps */}
          <path d={continentPath} fill="url(#land-gradient)" />

          {/* Actual polygon cells for each province */}
          {provinces.map(prov => {
            const owner = gameState.realms[prov.ownerId];
            const factionColor = owner ? owner.color : '#374151';
            const isSelected = selectedProvinceId === prov.id;
            const isHovered = hoveredProvId === prov.id;
            const isSource = actionSourceId === prov.id;
            const isInPath = previewPath.includes(prov.id);
            const isValidTarget = isInPath && !isSource;
            const isVisible = gameState.visibleProvinces.includes(prov.id);
            const isMultiSelected = multiSelectedSet.has(prov.id);
            const isHighlighted = isSource || isInPath || isMultiSelected;

            // 1. Core Terrain Color Base
            let cellColor = getTerrainBaseColor(prov.terrain);

            // 2. Fill color per viewMode
            let fillColor: string;
            let overlayColor = 'transparent';
            let overlayOpacity = 0;

            if (prov.isWater) {
              // MEGA MAPA: oceano sempre azul, sem fog/overlay/facção
              fillColor = viewMode === 'economic' ? '#0c2c4a' : '#123f6d';
              overlayColor = 'transparent';
              overlayOpacity = 0;
            } else if (!isVisible) {
              // Fog of war: dark, subdued
              fillColor = '#131c2c';
              overlayColor = '#0f172a';
              overlayOpacity = 0.55;
            } else if (viewMode === 'economic') {
              const ecoScore = getEconomicScore(prov) / maxEco;
              fillColor = getHeatColor(ecoScore, 120);
            } else if (viewMode === 'military') {
              const milScore = getMilitaryScore(prov) / maxMil;
              fillColor = getHeatColor(milScore, 0);
            } else if (MODE_HUES[viewMode] !== undefined) {
              // Fase 2 — 7 novos modos com heatmap próprio
              const score = getModeScore(prov, viewMode);
              if (viewMode === 'stability') {
                // Leal (branco) → rebelde (vermelho)
                fillColor = score > 0.7 ? '#f8fafc' : score > 0.4 ? '#fbbf24' : '#dc2626';
              } else {
                fillColor = getHeatColor(score, MODE_HUES[viewMode]!);
              }
            } else if (viewMode === 'political') {
              overlayColor = factionColor;
              overlayOpacity = isSelected ? 0.92 : isHovered ? 0.8 : 0.6;
              if (prov.ownerId === 'neutral') {
                overlayColor = '#27272a';
                overlayOpacity = isSelected ? 0.85 : isHovered ? 0.7 : 0.5;
              }
              fillColor = cellColor;
            } else {
              // diplomatic / resources / trade — show faction color like political
              overlayColor = factionColor;
              overlayOpacity = isSelected ? 0.92 : isHovered ? 0.8 : 0.6;
              fillColor = cellColor;
            }

            const cellPath = prov.organicPath || `M ${prov.polygon.map(p => p.join(',')).join(' L ')} Z`;

            return (
              <g key={`cell-${prov.id}`}>
                {/* Base terrain color background */}
                <path
                  d={cellPath}
                  fill={fillColor}
                  stroke={fillColor}
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                  className="transition-all duration-300"
                  opacity={isVisible ? 1 : 0.6}
                />

                {/* View mode & faction overlay (interactive layer) */}
                <path
                  d={cellPath}
                  fill={isMultiSelected ? '#f59e0b' : overlayColor}
                  fillOpacity={isMultiSelected ? 0.75 : overlayOpacity}
                  opacity={isVisible ? 1 : isValidTarget ? 1 : 0.5}
                  stroke={
                    isMultiSelected ? '#fef08a' :
                    isSelected ? '#fbbf24' :
                    isSource ? '#f59e0b' :
                    isValidTarget ? '#fcd34d' : 'transparent'
                  }
                  strokeWidth={
                    isMultiSelected ? 2.5 :
                    isSelected || isSource ? 2.5 :
                    isValidTarget ? 1.5 : 0
                  }
                  vectorEffect="non-scaling-stroke"
                  filter={isHighlighted ? 'url(#gold-glow)' : 'none'}
                  style={{
                    strokeDasharray: isValidTarget ? '6 3' : undefined,
                  }}
                  className={`cursor-pointer transition-all duration-300 hover:brightness-125 ${actionState !== 'idle' ? 'cursor-crosshair' : ''} ${isSource ? 'animate-pulse-slow' : ''}`}
                  onMouseEnter={() => setHoveredProvId(prov.id)}
                  onMouseLeave={() => setHoveredProvId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProvinceClick(prov.id, e.shiftKey);
                  }}
                />

                {/* Royal international border outline (crisp faction-colored border) */}
                {isVisible && (
                  <path
                    d={cellPath}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : factionColor}
                    strokeWidth={isSelected ? '1.25' : isHovered ? '1' : '0.6'}
                    vectorEffect="non-scaling-stroke"
                    strokeOpacity={isSelected ? 1.0 : isHovered ? 0.95 : 0.85}
                    className="pointer-events-none transition-all duration-300"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Trade Routes / Connective Roads woven between province centroids */}
        <g pointerEvents="none">
          {provinces.map(prov =>
            prov.neighbors.map(neighborId => {
              const neighbor = gameState.provinces[neighborId];
              if (!neighbor) return null;
              if (prov.id > neighborId) return null; // Avoid duplicate renders

              const isPathHighlighted = (actionSourceId === prov.id && selectedProvinceId === neighborId) ||
                                        (actionSourceId === neighborId && selectedProvinceId === prov.id);
              const isSelectingPath = selectedProvinceId === prov.id || selectedProvinceId === neighborId;

              return (
                <g key={`road-${prov.id}-${neighborId}`} className="pointer-events-none">
                  <line
                    x1={prov.center[0]} y1={prov.center[1]}
                    x2={neighbor.center[0]} y2={neighbor.center[1]}
                    stroke="#090d16"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <line
                    x1={prov.center[0]} y1={prov.center[1]}
                    x2={neighbor.center[0]} y2={neighbor.center[1]}
                    stroke={isPathHighlighted ? '#f59e0b' : isSelectingPath ? '#facc15' : '#e2e8f0'}
                    strokeWidth={isPathHighlighted ? '1.0' : isSelectingPath ? '0.8' : '0.4'}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={isPathHighlighted ? 'none' : isSelectingPath ? 'none' : '4,4'}
                    strokeLinecap="round"
                    opacity={isPathHighlighted ? 1 : isSelectingPath ? 0.85 : 0.35}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })
          )}
        </g>

        {/* ======================================================== */}
        {/* FLOATING INDICATORS, LABELS & ARMED TROOPS BADGES OVERLAY */}
        {/* ======================================================== */}
        {provinces.map((prov) => {
          const occupant = prov.occupantRealmId ? gameState.realms[prov.occupantRealmId] : null;
          const owner = (prov.ownerId && prov.ownerId !== 'neutral') ? gameState.realms[prov.ownerId] : occupant;
          const factionColor = owner ? owner.color : '#0284c7';
          const isSelected = selectedProvinceId === prov.id;
          const isMultiSelected = multiSelectedSet.has(prov.id);
          const isHovered = hoveredProvId === prov.id;
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          if (!isVisible) return null;

          // Capital: province id matches realm's capitalId
          const isCapital = !!owner?.capitalId && owner.capitalId === prov.id;

          // Check if eligible target for actions to pulsate
          let isEligibleTarget = false;
          if (sourceProv && sourceProv.neighbors.includes(prov.id)) {
            if (actionState === 'moving') {
              isEligibleTarget = true;
            } else if (actionState === 'attacking' && prov.ownerId !== playerRealmId && !prov.isWater) {
              isEligibleTarget = true;
            } else if (actionState === 'dispatching_scouts') {
              isEligibleTarget = true;
            }
          }

          const totalTroops = prov.troops || 0;
          const labelScale = isMobile ? 0.75 : 1;

          return (
            <g
              key={`overlay-${prov.id}`}
              transform={`translate(${prov.center[0]}, ${prov.center[1]})`}
              className="pointer-events-none"
            >
              {/* Pulsating Ring indicator showing tactical range */}
              {isEligibleTarget && (
                <g>
                  <circle
                    cx="0" cy="0"
                    r="30"
                    fill="none"
                    stroke={actionState === 'attacking' ? '#f87171' : '#facc15'}
                    strokeWidth="1.0"
                    vectorEffect="non-scaling-stroke"
                    className="animate-ping opacity-50"
                  />
                  <circle
                    cx="0" cy="0"
                    r="15"
                    fill={actionState === 'attacking' ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.2)'}
                    stroke={actionState === 'attacking' ? '#ef4444' : '#fbbf24'}
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="2,2"
                  />
                </g>
              )}

              {/* Selected Indicator golden ring */}
              {isSelected && (
                <circle
                  cx="0" cy="0"
                  r="26"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.0"
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray="3,2"
                  filter="url(#gold-glow)"
                />
              )}

              {/* Multi-Selected Indicator: Clean Static Checkmark Badge */}
              {isMultiSelected && (
                <g transform={`translate(0, ${-20 / zoom}) scale(${0.85 / zoom})`}>
                  <circle cx="0" cy="0" r="9" fill="#b45309" stroke="#fef08a" strokeWidth="1.2" />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="9.5"
                    fontWeight="900"
                    className="font-sans font-black select-none"
                    filter="drop-shadow(0px 1px 1.5px rgba(0,0,0,0.9))"
                  >
                    ✓
                  </text>
                </g>
              )}

              {/* Hand-drawn Terrain vectors decorations to enrich empty spots */}
              {!isMobile && prov.terrain === 'mountain' && (
                <g transform="translate(-18, -32) scale(0.8)" opacity="0.85" stroke="#f8fafc" strokeWidth="1" fill="#44403c">
                  <polygon points="0,15 8,0 16,15" />
                  <polygon points="8,15 14,4 20,15" opacity="0.8" />
                </g>
              )}

              {!isMobile && prov.terrain === 'forest' && (
                <g transform="translate(14, -34) scale(0.8)" opacity="0.9" fill="#166534" stroke="#f8fafc" strokeWidth="1">
                  <polygon points="0,10 -5,10 -2,3" />
                  <polygon points="-2,3 -7,3 -3,-3" />
                  <rect x="-4" y="10" width="2" height="4" fill="#78350f" stroke="none" />

                  <g transform="translate(8, 4)">
                    <polygon points="0,10 -5,10 -2,3" />
                    <polygon points="-2,3 -7,3 -3,-3" />
                    <rect x="-4" y="10" width="2" height="4" fill="#78350f" stroke="none" />
                  </g>
                </g>
              )}

              {!isMobile && prov.terrain === 'coastal' && (
                <g transform="translate(15, -24) scale(0.8)" opacity="0.75" stroke="#67e8f9" strokeWidth="1" strokeLinecap="round" fill="none">
                  <line x1="-8" y1="4" x2="8" y2="4" />
                  <line x1="-12" y1="7" x2="4" y2="7" />
                  <path d="M-4,1 C-1,-2 1,-2 4,1" />
                </g>
              )}

              {!isMobile && prov.terrain === 'plains' && (
                <g transform="translate(-20, -22) scale(0.8)" opacity="0.5" stroke="#fef08a" strokeWidth="0.8" fill="none">
                  <line x1="-4" y1="-2" x2="-4" y2="6" />
                  <line x1="2" y1="0" x2="2" y2="8" />
                  <path d="M-6,2 L-4,0 L-2,2 M0,4 L2,2 L4,4" />
                </g>
              )}

              {!isMobile && prov.terrain === 'desert' && (
                <g transform="translate(-16, -26) scale(0.85)" opacity="0.8" fill="none" stroke="#fde047" strokeWidth="1" strokeLinecap="round">
                  <path d="M-10,4 C-5,-2 0,-2 5,4 C10,10 15,10 20,4" />
                  <path d="M-15,10 C-10,4 -5,4 0,10 C5,16 10,16 15,10" opacity="0.6" />
                </g>
              )}

              {!isMobile && prov.terrain === 'steppe' && (
                <g transform="translate(12, -26) scale(0.85)" opacity="0.75" fill="none" stroke="#eab308" strokeWidth="1" strokeLinecap="round">
                  <path d="M-6,8 L-4,-2 M-2,8 L0,-5 M2,8 L3,-3 M6,8 L7,-1" />
                </g>
              )}

              {!isMobile && prov.isWater && (
                <g transform="translate(0, -22) scale(0.85)" opacity="0.85" fill="none" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round">
                  <path d="M-10,0 C-5,-3 0,-3 5,0 C10,3 15,3 20,0" />
                  <path d="M-6,6 C-2,3 2,3 6,6 C10,9 14,9 18,6" opacity="0.6" />
                </g>
              )}

              {/* Royal Capital Banners — counter-scaled por 1/zoom */}
              {isCapital && (
                <g transform={`translate(0, ${-34 / zoom}) scale(${(isMobile ? 0.85 : 1.0) / zoom})`}>
                  <rect x="-10" y="-4" width="20" height="9" fill="#d97706" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" rx="1" />
                  <rect x="-10" y="-8" width="4" height="4" fill="#d97706" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <rect x="-2" y="-8" width="4" height="4" fill="#d97706" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <rect x="6" y="-8" width="4" height="4" fill="#d97706" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="-8" x2="0" y2="-17" stroke="#fff" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  <path d="M 0 -17 L 12 -21 L 0 -25 Z" fill={factionColor} stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <circle cx="0" cy="-4" r="2.5" fill="#fef08a" />
                </g>
              )}

              {/* Province Name / Value Banner Text — counter-scaled por 1/zoom para tamanho de tela fixo e sem sobreposição */}
              {!prov.isWater && getLabelPriority(prov) <= lod.labelLevel && isSafeLabelPosition(prov.center) && (
                <g transform={`translate(0, ${26 / zoom}) scale(${(isMobile ? 0.75 : 1.0) / zoom})`}>
                  <rect
                    x="-38"
                    y="-8"
                    width="76"
                    height="16"
                    rx="3"
                    fill="#090d16"
                    fillOpacity="0.95"
                    stroke={isSelected ? '#fbbf24' : isHovered ? '#ffffff' : '#4b5563'}
                    strokeWidth={isSelected ? '1.8' : '1.2'}
                    vectorEffect="non-scaling-stroke"
                    className="shadow-2xl"
                  />
                  <text
                    x="0"
                    y="2.5"
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="8"
                    fontWeight="900"
                    className="select-none uppercase font-serif tracking-wider"
                  >
                    {viewMode === 'economic'
                      ? `${(prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0)}`
                      : viewMode === 'military'
                        ? `${prov.troops || 0}`
                        : MODE_HUES[viewMode] !== undefined
                          ? getModeLabel(prov, viewMode)
                          : prov.name}
                  </text>
                </g>
              )}

              {/* Medieval Shield / Naval Fleet Badge with Troop strength figure — counter-scaled por 1/zoom */}
              {(totalTroops > 0) && (
                <g transform={`translate(0, ${-6 / zoom}) scale(${(isMobile ? 0.85 : 1.0) / zoom})`}>
                  <path
                    d="M -13 -15 L 13 -15 C 13 -15 13 5 0 15 C -13 5 -13 -15 -13 -15 Z"
                    fill="#000000"
                    opacity="0.6"
                    transform="translate(1.5, 2)"
                  />
                  <path
                    d="M -13 -15 L 13 -15 C 13 -15 13 5 0 15 C -13 5 -13 -15 -13 -15 Z"
                    fill={prov.isWater ? '#0284c7' : factionColor}
                    stroke={isSelected ? '#fef08a' : prov.isWater ? '#38bdf8' : '#f1f5f9'}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    vectorEffect="non-scaling-stroke"
                    opacity="0.98"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="900"
                    className="select-none font-sans font-black tracking-tight"
                    filter="drop-shadow(0px 1px 1.5px rgba(0,0,0,0.8))"
                  >
                    {prov.isWater ? `⚓ ${totalTroops}` : totalTroops}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Scout markers */}
        <g pointerEvents="none">
          {provinces.map(prov => {
            const isVisible = gameState.visibleProvinces.includes(prov.id);
            if (!isVisible) return null;
            if (prov.army.scouts <= 0) return null;
            if (prov.ownerId !== playerRealmId) return null;
            if (!isSafeLabelPosition(prov.center)) return null;

            return (
              <text
                key={`scout-${prov.id}`}
                x={prov.center[0]}
                y={prov.center[1] - 14}
                textAnchor="middle"
                fontSize={10}
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.8)"
                strokeWidth={2}
                pointerEvents="none"
              >
                👁
              </text>
            );
          })}
        </g>

        {viewMode === 'resources' && (
          <g pointerEvents="none">
            {provinces.map(prov => {
              const isVisible = gameState.visibleProvinces.includes(prov.id);
              if (!isVisible || !prov.strategicResource || prov.strategicResource === 'none') return null;
              if (!isSafeLabelPosition(prov.center)) return null;

              const resourceIcons: Record<string, string> = {
                iron: '⛏',
                wood: '🪓',
                horse: '🐴',
                stone: '🪨'
              };

              return (
                <text
                  key={`resource-${prov.id}`}
                  x={prov.center[0]}
                  y={prov.center[1] + 15}
                  textAnchor="middle"
                  fontSize="14"
                  pointerEvents="none"
                >
                  {resourceIcons[prov.strategicResource] || ''}
                </text>
              );
            })}
          </g>
        )}

        {/* March orders — troops in transit */}
        <g>
          {(gameState.marchOrders || []).filter(o => o.realmId === gameState.playerRealmId).map(order => {
            const currentProv = gameState.provinces[order.currentProvId];
            const nextProvId = order.remainingPath[0];
            const nextProv = nextProvId ? gameState.provinces[nextProvId] : null;
            if (!currentProv || !nextProv) return null;

            const midX = (currentProv.center[0] + nextProv.center[0]) / 2;
            const midY = (currentProv.center[1] + nextProv.center[1]) / 2;
            const totalTroops = order.troops.infantry + order.troops.archers + order.troops.cavalry + order.troops.scouts;
            const isAttack = order.kind === 'attack';
            const isScout = order.kind === 'scout';
            const lineColor = isAttack ? '#ef4444' : isScout ? '#38bdf8' : '#fbbf24';
            const fillColor = isAttack ? '#dc2626' : isScout ? '#0ea5e9' : '#f59e0b';
            const label = isAttack ? 'em ataque' : isScout ? 'reconhecimento' : 'em marcha';

            return (
              <g key={`order-${order.id}`}>
                <line
                  x1={currentProv.center[0]}
                  y1={currentProv.center[1]}
                  x2={nextProv.center[0]}
                  y2={nextProv.center[1]}
                  stroke={lineColor}
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.85}
                />
                <g transform={`translate(${midX}, ${midY}) scale(${0.75 / zoom})`}>
                  <circle
                    cx={0}
                    cy={0}
                    r={6}
                    fill={fillColor}
                    stroke="#1e293b"
                    strokeWidth={1.0}
                  />
                  <text
                    x={0}
                    y={2.5}
                    textAnchor="middle"
                    fontSize={7.5}
                    fontWeight={900}
                    fill="white"
                    paintOrder="stroke"
                    stroke="black"
                    strokeWidth={1.0}
                    className="select-none font-sans font-black tracking-tight"
                  >
                    {totalTroops}
                  </text>
                  <text
                    x={0}
                    y={13}
                    textAnchor="middle"
                    fontSize={6}
                    fontWeight={700}
                    fill={lineColor}
                    paintOrder="stroke"
                    stroke="black"
                    strokeWidth={0.8}
                    className="select-none font-sans font-bold"
                  >
                    {label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* March animations (flying army markers) */}
        <g>
          {marchAnimations.map(anim => {
            const [x1, y1] = anim.from;
            const [x2, y2] = anim.to;
            const totalTroops = anim.troops.infantry + anim.troops.archers + anim.troops.cavalry + anim.troops.scouts;
            const isAttack = anim.kind === 'attack';
            const lineColor = isAttack ? '#ef4444' : '#fbbf24';
            const circleColor = isAttack ? '#dc2626' : '#f59e0b';
            return (
              <g key={anim.id}>
                <motion.line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={lineColor}
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, times: [0, 0.1, 0.8, 1] }}
                />
                <motion.circle
                  cx={x1}
                  cy={y1}
                  r={6 / zoom}
                  fill={circleColor}
                  stroke="#1e293b"
                  strokeWidth={1 / zoom}
                  initial={{ opacity: 0 }}
                  animate={{
                    cx: [x1, x2],
                    cy: [y1, y2],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ duration: 1.5, ease: "linear" }}
                />
                <motion.text
                  x={x1}
                  y={y1 + 2.5 / zoom}
                  textAnchor="middle"
                  fontSize={7.5 / zoom}
                  fontWeight="bold"
                  fill="white"
                  paintOrder="stroke"
                  stroke="black"
                  strokeWidth={1.0 / zoom}
                  initial={{ opacity: 0 }}
                  animate={{
                    x: [x1, x2],
                    y: [y1, y2],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{ duration: 1.5, ease: "linear" }}
                >
                  {totalTroops}
                </motion.text>
              </g>
            );
          })}
        </g>

        {selectionBounds && (
          <rect
            x={selectionBounds.x}
            y={selectionBounds.y}
            width={Math.max(4, selectionBounds.width)}
            height={Math.max(4, selectionBounds.height)}
            fill="rgba(251, 191, 36, 0.18)"
            stroke="rgba(251, 191, 36, 0.9)"
            strokeWidth={2}
            strokeDasharray="8 4"
            pointerEvents="none"
          />
        )}

        {/* Campaign Waypoints Numbered Badges Overlay */}
        {campaignWaypoints && campaignWaypoints.length > 0 && (
          <g pointerEvents="none">
            {campaignWaypoints.map((wpId, idx) => {
              const prov = gameState.provinces[wpId];
              if (!prov) return null;

              return (
                <g
                  key={`campaign-wp-badge-${wpId}-${idx}`}
                  transform={`translate(${prov.center[0]}, ${prov.center[1] - 8 / zoom}) scale(${1.1 / zoom})`}
                >
                  <circle cx="0" cy="0" r="14" fill="#ef4444" opacity="0.35" className="animate-ping" />
                  <circle cx="0" cy="0" r="12" fill="#7f1d1d" stroke="#fde047" strokeWidth="2" />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="11"
                    fontWeight="900"
                    className="font-sans font-black select-none"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.9))"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        {activeVisualEffects.map(effect => {
          const province = effect.province!;
          const [centerX, centerY] = province.center;
          const left = `${(centerX / MAP_WIDTH) * 100}%`;
          const top = `${(centerY / MAP_HEIGHT) * 100}%`;

          return (
            <div
              key={effect.id}
              className="absolute"
              style={{
                left,
                top,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {Array.from({ length: effect.particleCount || 0 }).map((_, index) => {
                const seed = `${effect.id}:${index}`;
                const tx = Math.round((seededRandom(`${seed}:x`) * 60) - 30);
                const ty = Math.round((seededRandom(`${seed}:y`) * 60) - 30);
                const opacity = 0.75 + seededRandom(`${seed}:o`) * 0.25;
                const battleColor = index % 2 === 0 ? 'bg-orange-500' : 'bg-red-500';
                const className =
                  effect.type === 'battle_particles'
                    ? battleColor
                    : effect.type === 'conquest_particles'
                      ? 'bg-yellow-400'
                      : 'bg-gray-400';

                return (
                  <span
                    key={`${effect.id}-${index}`}
                    className={`particle ${effect.type === 'battle_particles' ? 'particle-battle' : effect.type === 'conquest_particles' ? 'particle-conquest' : 'particle-build'} ${className}`}
                    style={{
                      '--tx': `${tx}px`,
                      '--ty': `${ty}px`,
                      opacity,
                      animationDelay: `${index * 20}ms`
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Quick Action Popup Menu */}
        {selectedProvince && isOwn && !selectedProvince.isWater && (
          <div
            className="absolute pointer-events-auto z-30"
            style={{
              left: `${(selectedProvince.center[0] / MAP_WIDTH) * 100}%`,
              top: `${(selectedProvince.center[1] / MAP_HEIGHT) * 100}%`,
              transform: `translate(-50%, -135%) scale(${Math.max(0.3, Math.min(0.75, 0.5 / (zoom || 1)))})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.15s ease-out, left 0.2s ease-out, top 0.2s ease-out',
            }}
          >
            {/* Glassmorphic menu card */}
            <div className="flex items-center gap-1.5 p-1.5 bg-[#090d16]/95 border border-amber-500/50 rounded-lg shadow-2xl backdrop-blur-md">
              {/* March button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.('move', selectedProvince.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 transition-all border border-amber-500/20 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                🚀 Marchar
              </button>

              {/* Attack button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.('attack', selectedProvince.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-100 transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                ⚔️ Atacar
              </button>

              {selectedProvince.troops > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAction?.('disband', selectedProvince.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all border border-stone-600/30 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  🛡️ Dispensar
                </button>
              )}
            </div>
            {/* Small arrow pointing down to the province */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#090d16]/95 mx-auto mt-[-1px]" />
          </div>
        )}
      </div>
    </div>
  );
};
