import React from 'react';
import { GameState, Province, Realm } from '../types';

interface MinimapProps {
  gameState: GameState;
  width: number;
  height: number;
  selectedProvinceId: string | null;
  onProvinceClick: (id: string) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ gameState, width, height, selectedProvinceId, onProvinceClick }) => {
  const mapWidth = 1000;
  const mapHeight = 750;

  const playerRealm = gameState.realms[gameState.playerRealmId];

  return (
    <div 
      className="absolute bottom-4 left-4 bg-[#2c1810]/90 backdrop-blur border-2 border-[#d4af37]/40 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.6)] pointer-events-auto"
      style={{ width, height }}
    >
      <style>{`
        @keyframes pulse-red {
          0%, 100% { fill-opacity: 0.8; stroke-opacity: 1; }
          50% { fill-opacity: 0.3; stroke-opacity: 0.5; }
        }
        .animate-pulse-red {
          animation: pulse-red 2s infinite;
        }
      `}</style>
      <svg width={width} height={height} className="pointer-events-auto">
        {(Object.values(gameState.provinces) as Province[]).map(prov => {
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          const owner = gameState.realms[prov.ownerId];
          const isSelected = prov.id === selectedProvinceId;
          const isOwned = prov.ownerId === playerRealm.id;
          const isAtWar = playerRealm.wars.includes(prov.ownerId);
          const isLowLoyalty = isOwned && prov.loyalty < 30;
          const isRecentlyConquered = isOwned && prov.recentlyConquered > 0;
          
          const scaledPolygon = prov.polygon.map(([x, y]) => [x * (width / mapWidth), y * (height / mapHeight)]);
          const pathData = `M${scaledPolygon.map(p => p.join(',')).join('L')}Z`;
          
          let strokeColor = 'rgba(0,0,0,0.3)';
          let strokeWidth = 0.5;
          let fillOpacity = isVisible ? 0.8 : 0.3;
          let className = "cursor-pointer transition-all duration-300 ";

          if (isSelected) {
            strokeColor = '#fff';
            strokeWidth = 2;
          } else if (isAtWar && isVisible) {
            strokeColor = '#ff4444';
            strokeWidth = 1.2;
          }

          if (isLowLoyalty || isRecentlyConquered) {
            className += "animate-pulse-red";
          }

          let fillColor = isVisible ? (owner?.color || '#cbd5e1') : '#1a0f0a';
          if (isLowLoyalty && isVisible) {
            fillColor = '#ef4444'; 
          }

          return (
            <path
              key={prov.id}
              d={pathData}
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              onClick={() => onProvinceClick(prov.id)}
              className={className + " hover:fill-white/20"}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 bg-red-900/5 pointer-events-none" />
      <div className="absolute top-1 left-2 text-[7px] font-bold text-[#d4af37]/60 uppercase tracking-widest font-serif">O Mapa do Mundo</div>
      
      {/* Legend */}
      <div className="absolute bottom-1 right-2 flex gap-2 text-[6px] font-bold uppercase tracking-tighter">
        <span className="flex items-center gap-1 text-red-400">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Conflito
        </span>
        <span className="flex items-center gap-1 text-[#f5f2ed]/60">
          <span className="w-1.5 h-1.5 bg-white/40 rounded-full" /> Névoa
        </span>
      </div>
    </div>
  );
};
