import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, ViewMode, ActionType } from '../types';
import { motion } from 'motion/react';

interface MapProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  onProvinceClick: (id: string) => void;
  viewMode: ViewMode;
  previewPath: string[];
  marchAnimations: { id: string; from: [number, number]; to: [number, number]; troops: { infantry: number; archers: number; cavalry: number; scouts: number }; kind?: 'move' | 'attack' | 'scout'; realmId?: string }[];
  triggerMarchAnimation: any;
  actionState: ActionType;
  actionSourceId: string | null;
  multiSelectedProvinceIds: string[];
  onMultiSelectChange: (ids: string[]) => void;
  playerRealmId: string;
}

function getHeatColor(value: number, hue: number): string {
  const saturation = 60 + Math.min(40, value * 40);
  const lightness = 25 + Math.min(35, value * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getEconomicScore(prov: any): number {
  const totalProduction = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
  const buildingBonus = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0);
  return Math.min(1, (totalProduction + buildingBonus * 5) / 20);
}

function getMilitaryScore(prov: any): number {
  return Math.min(1, (prov.troops || 0) / 100);
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
  playerRealmId
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const provinces = useMemo(() => Object.values(gameState.provinces), [gameState.provinces]);
  const multiSelectedSet = useMemo(() => new Set(multiSelectedProvinceIds), [multiSelectedProvinceIds]);

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
      updateSelection(event.clientX, event.clientY);
      setSelectionRect(current => {
        if (!current) return current;
        const left = Math.min(current.startX, current.endX);
        const right = Math.max(current.startX, current.endX);
        const top = Math.min(current.startY, current.endY);
        const bottom = Math.max(current.startY, current.endY);

        const inside = provinces
          .filter(prov => prov.ownerId === playerRealmId)
          .filter(prov => prov.center[0] >= left && prov.center[0] <= right && prov.center[1] >= top && prov.center[1] <= bottom)
          .map(prov => prov.id);

        onMultiSelectChange(inside);
        return null;
      });
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

  const handleProvinceClick = (provId: string, isShiftPressed: boolean) => {
    const province = gameState.provinces[provId];
    if (!province) return;

    if (isShiftPressed) {
      if (province.ownerId !== playerRealmId) return;
      const next = multiSelectedSet.has(provId)
        ? multiSelectedProvinceIds.filter(id => id !== provId)
        : [...multiSelectedProvinceIds, provId];
      onMultiSelectChange(next);
      return;
    }

    onMultiSelectChange([]);
    onProvinceClick(provId);
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
          particleCount: effect.particleCount || 8
        };
      })
      .filter(effect => !!effect.province);
  }, [gameState.provinces, gameState.visualEffects]);

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
        className={`block w-full h-full ${actionState !== 'idle' ? 'cursor-crosshair' : ''}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="1280" height="720" fill="#1e293b" />

        <g>
          {provinces.map(prov => {
            const owner = gameState.realms[prov.ownerId];
            const isSelected = selectedProvinceId === prov.id;
            const isSource = actionSourceId === prov.id;
            const isInPath = previewPath.includes(prov.id);
            const isValidTarget = isInPath && !isSource;
            const isVisible = gameState.visibleProvinces.includes(prov.id);
            const isHighlighted = isSource || isInPath || multiSelectedSet.has(prov.id);
            const isMultiSelected = multiSelectedSet.has(prov.id);

            let fillColor: string;
            if (!isVisible) {
              fillColor = '#1e293b';
            } else if (viewMode === 'economic') {
              const ecoScore = getEconomicScore(prov) / maxEco;
              fillColor = getHeatColor(ecoScore, 120);
            } else if (viewMode === 'military') {
              const milScore = getMilitaryScore(prov) / maxMil;
              fillColor = getHeatColor(milScore, 0);
            } else {
              fillColor = prov.ownerId === 'neutral' ? '#475569' : (owner?.color || '#475569');
            }

            return (
              <motion.path
                key={prov.id}
                d={`M ${prov.polygon.map(p => p.join(',')).join(' L ')} Z`}
                fill={fillColor}
                stroke={isMultiSelected ? '#fbbf24' : isSelected ? '#fbbf24' : isSource ? '#f59e0b' : isValidTarget ? '#fcd34d' : '#1e293b'}
                strokeWidth={isMultiSelected ? 2 : isSelected || isSource ? 4 : isValidTarget ? 3 : 1}
                initial={false}
                animate={{
                  fill: fillColor,
                  opacity: isVisible ? 1 : isValidTarget ? 1 : 0.5
                }}
                style={{
                  filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' : 'none',
                  strokeDasharray: isValidTarget ? '6 3' : undefined,
                  animation: isMultiSelected ? 'pulse-gold 1s infinite' : undefined
                }}
                className={`cursor-pointer hover:brightness-110 transition-all ${actionState !== 'idle' ? 'cursor-crosshair' : ''} ${isSource ? 'animate-pulse-slow' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProvinceClick(prov.id, e.shiftKey);
                }}
              />
            );
          })}
        </g>

        <g pointerEvents="none">
          {provinces.map(prov => {
            const isVisible = gameState.visibleProvinces.includes(prov.id);
            if (!isVisible) return null;

            let labelText = prov.name;
            let labelFontSize = 20;
            let labelFontWeight = 900;

            if (viewMode === 'economic') {
              const totalProd = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
              labelText = `${totalProd}`;
              labelFontSize = 24;
              labelFontWeight = 900;
            } else if (viewMode === 'military') {
              labelText = `${prov.troops || 0}`;
              labelFontSize = 24;
              labelFontWeight = 900;
            }

            if (!isSafeLabelPosition(prov.center)) return null;

            return (
              <text
                key={`label-${prov.id}`}
                x={prov.center[0]}
                y={prov.center[1]}
                textAnchor="middle"
                fontSize={labelFontSize}
                fontWeight={labelFontWeight}
                fontFamily="serif"
                fill="rgba(255,255,255,0.9)"
                paintOrder="stroke"
                stroke="rgba(0,0,0,0.6)"
                strokeWidth="3"
                pointerEvents="none"
              >
                {labelText}
              </text>
            );
          })}
        </g>

        <g pointerEvents="none">
          {provinces.map(prov => {
            const isVisible = gameState.visibleProvinces.includes(prov.id);
            if (!isVisible) return null;
            if (prov.army.scouts <= 0) return null;
            if (prov.ownerId !== gameState.playerRealmId) return null;
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
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  opacity={0.8}
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r={8}
                  fill={fillColor}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={900}
                  fill="white"
                  paintOrder="stroke"
                  stroke="black"
                  strokeWidth={2}
                >
                  {totalTroops}
                </text>
                <text
                  x={midX}
                  y={midY + 18}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={700}
                  fill={lineColor}
                  paintOrder="stroke"
                  stroke="black"
                  strokeWidth={1.5}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </g>

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
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, times: [0, 0.1, 0.8, 1] }}
                />
                <motion.circle
                  cx={x1}
                  cy={y1}
                  r="12"
                  fill={circleColor}
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
                  y={y1}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
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
              {Array.from({ length: effect.particleCount }).map((_, index) => {
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
                      ['--tx' as any]: `${tx}px`,
                      ['--ty' as any]: `${ty}px`,
                      opacity,
                      animationDelay: `${index * 20}ms`
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
