import React, { useMemo } from 'react';
import { GameState, ViewMode, ActionType } from '../types';
import { motion } from 'motion/react';

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

  return (
    <svg 
      viewBox="0 0 1280 720" 
      className="w-full h-full"
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
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          
          let fillColor = prov.ownerId === 'neutral' ? '#475569' : (owner?.color || '#475569');
          if (!isVisible) fillColor = '#1e293b';

          return (
            <motion.path
              key={prov.id}
              d={`M ${prov.polygon.map(p => p.join(',')).join(' L ')} Z`}
              fill={fillColor}
              stroke={isSelected ? '#fbbf24' : '#1e293b'}
              strokeWidth={isSelected ? 4 : 1}
              initial={false}
              animate={{
                fill: fillColor,
                opacity: isVisible ? 1 : 0.5
              }}
              className="cursor-pointer hover:brightness-110 transition-all"
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

          return (
            <text
              key={`label-${prov.id}`}
              x={prov.center[0]}
              y={prov.center[1]}
              textAnchor="middle"
              className="text-[10px] fill-white/80 font-serif pointer-events-none drop-shadow-md"
            >
              {prov.name}
            </text>
          );
        })}
      </g>
      
      {/* Marching Animations etc would go here */}
    </svg>
  );
};
