import React, { useMemo } from 'react';
import { GameState, ViewMode, ActionType } from '../types';
import { motion } from 'motion/react';
import { BUILDING_PRODUCTION } from '../logic/game-constants';

interface MapProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  onProvinceClick: (id: string) => void;
  viewMode: ViewMode;
  previewPath: string[];
  marchAnimations: any[];
  triggerMarchAnimation: any;
  actionState: ActionType;
  actionSourceId: string | null;
}

// Helper to get a color based on a value (0-1) in a gradient
function getHeatColor(value: number, hue: number): string {
  const saturation = 60 + Math.min(40, value * 40);
  const lightness = 25 + Math.min(35, value * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Helper to get economic score for a province
function getEconomicScore(prov: any): number {
  const totalProduction = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
  const buildingBonus = (prov.buildings?.farms || 0) + (prov.buildings?.mines || 0) + (prov.buildings?.workshops || 0);
  return Math.min(1, (totalProduction + buildingBonus * 5) / 20);
}

// Helper to get military score for a province
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

export const Map: React.FC<MapProps> = ({
  gameState,
  selectedProvinceId,
  onProvinceClick,
  viewMode,
  previewPath,
  marchAnimations,
  triggerMarchAnimation,
  actionState,
  actionSourceId
}) => {
  const provinces = useMemo(() => Object.values(gameState.provinces), [gameState.provinces]);

  // Calculate max economic and military scores for normalization
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

  return (
    <svg 
      viewBox="0 0 1280 720" 
      className={`w-full h-full ${actionState !== 'idle' ? 'cursor-crosshair' : ''}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Background/Water */}
      <rect width="1280" height="720" fill="#1e293b" />
      
      {/* Provinces */}
      <g>
        {provinces.map(prov => {
          const owner = gameState.realms[prov.ownerId];
          const isSelected = selectedProvinceId === prov.id;
          const isSource = actionSourceId === prov.id;
          const isInPath = previewPath.includes(prov.id);
          const isValidTarget = isInPath && !isSource;
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          const isHighlighted = isSource || isInPath;
          
          // Determine fill color based on view mode
          let fillColor: string;
          
          if (!isVisible) {
            fillColor = '#1e293b';
          } else if (viewMode === 'economic') {
            const ecoScore = getEconomicScore(prov) / maxEco;
            fillColor = getHeatColor(ecoScore, 120); // Green heatmap
          } else if (viewMode === 'military') {
            const milScore = getMilitaryScore(prov) / maxMil;
            fillColor = getHeatColor(milScore, 0); // Red heatmap
          } else {
            // Political view (default)
            fillColor = prov.ownerId === 'neutral' ? '#475569' : (owner?.color || '#475569');
          }

          return (
            <motion.path
              key={prov.id}
              d={`M ${prov.polygon.map(p => p.join(',')).join(' L ')} Z`}
              fill={fillColor}
              stroke={isSelected ? '#fbbf24' : isSource ? '#f59e0b' : isValidTarget ? '#fcd34d' : '#1e293b'}
              strokeWidth={isSelected || isSource ? 4 : isValidTarget ? 3 : 1}
              initial={false}
              animate={{
                fill: fillColor,
                opacity: isVisible ? 1 : isValidTarget ? 1 : 0.5
              }}
              style={{
                filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' : 'none',
                strokeDasharray: isValidTarget ? '6 3' : undefined
              }}
              className={`cursor-pointer hover:brightness-110 transition-all ${actionState !== 'idle' ? 'cursor-crosshair' : ''} ${isSource ? 'animate-pulse-slow' : ''}`}
              onClick={(e) => { e.stopPropagation(); onProvinceClick(prov.id); }}
            />
          );
        })}
      </g>
      
      {/* Labels */}
      <g pointerEvents="none">
        {provinces.map(prov => {
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          if (!isVisible) return null;

          // Determine label content based on view mode
          let labelText = prov.name;
          let labelFontSize = 10;
          let labelFontWeight = 700;
          
          if (viewMode === 'economic') {
            const totalProd = (prov.wealth || 0) + (prov.foodProduction || 0) + (prov.materialProduction || 0);
            labelText = `${totalProd}`;
            labelFontSize = 12;
            labelFontWeight = 900;
          } else if (viewMode === 'military') {
            labelText = `${prov.troops || 0}`;
            labelFontSize = 12;
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
              strokeWidth="2"
              pointerEvents="none"
            >
              {labelText}
            </text>
          );
        })}
      </g>

      {/* Scout Icons for player provinces with scouts */}
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

      {/* Resource Icons for Resources view */}
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
      
      {/* March Orders - Visual indicators (persistent during march) */}
      <g>
        {(gameState.marchOrders || []).filter(o => o.realmId === gameState.playerRealmId).map(order => {
          const currentProv = gameState.provinces[order.currentProvId];
          const nextProvId = order.remainingPath[0];
          const nextProv = nextProvId ? gameState.provinces[nextProvId] : null;
          if (!currentProv || !nextProv) return null;

          const midX = (currentProv.center[0] + nextProv.center[0]) / 2;
          const midY = (currentProv.center[1] + nextProv.center[1]) / 2;
          const totalTroops = order.troops.infantry + order.troops.archers + order.troops.cavalry + order.troops.scouts;

          return (
            <g key={`order-${order.id}`}>
              {/* Arrow line from current to next */}
              <line
                x1={currentProv.center[0]}
                y1={currentProv.center[1]}
                x2={nextProv.center[0]}
                y2={nextProv.center[1]}
                stroke="#fbbf24"
                strokeWidth={3}
                strokeDasharray="8 4"
                opacity={0.8}
              />
              {/* Animated troop indicator */}
              <circle
                cx={midX}
                cy={midY}
                r={8}
                fill="#f59e0b"
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
                fill="#fbbf24"
                paintOrder="stroke"
                stroke="black"
                strokeWidth={1.5}
              >
                em marcha
              </text>
            </g>
          );
        })}
      </g>

      {/* Marching Animations */}
      <g>
        {marchAnimations.map(anim => {
          const [x1, y1] = anim.from;
          const [x2, y2] = anim.to;
          const totalTroops = anim.troops.infantry + anim.troops.archers + anim.troops.cavalry + anim.troops.scouts;
          return (
            <g key={anim.id}>
              {/* Animated march line */}
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="8 4"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, times: [0, 0.1, 0.8, 1] }}
              />
              {/* Troop count badge moving along path */}
              <motion.circle
                cx={x1}
                cy={y1}
                r="12"
                fill="#f59e0b"
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
    </svg>
  );
};
