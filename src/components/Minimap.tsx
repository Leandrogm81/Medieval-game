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
      className="absolute bottom-4 left-4 bg-black/70 backdrop-blur border border-slate-600 rounded-lg overflow-hidden shadow-2xl pointer-events-auto"
      style={{ width, height }}
    >
      <svg width={width} height={height} className="pointer-events-auto">
        {(Object.values(gameState.provinces) as Province[]).map(prov => {
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          const owner = gameState.realms[prov.ownerId];
          const isSelected = prov.id === selectedProvinceId;
          const isOwned = prov.ownerId === playerRealm.id;
          const isAtWar = playerRealm.wars.includes(prov.ownerId);
          const isLowLoyalty = isOwned && prov.loyalty < 30;
          
          const scaledPolygon = prov.polygon.map(([x, y]) => [x * (width / mapWidth), y * (height / mapHeight)]);
          const pathData = `M${scaledPolygon.map(p => p.join(',')).join('L')}Z`;
          
          let strokeColor = '#000';
          let strokeWidth = 0.5;
          let fillOpacity = isVisible ? 0.8 : 0.4;

          if (isSelected) {
            strokeColor = '#fff';
            strokeWidth = 2;
          } else if (isAtWar && isVisible) {
            strokeColor = '#ef4444';
            strokeWidth = 1.5;
          }

          let fillColor = isVisible ? (owner?.color || '#cbd5e1') : '#1a1a1a';
          if (isLowLoyalty && isVisible) {
            fillColor = '#dc2626'; // Red for low loyalty
            fillOpacity = 0.6;
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
              className="cursor-pointer hover:stroke-white hover:stroke-[1.5]"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="absolute top-1 left-1 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Minimapa</div>
      
      {/* Legend */}
      <div className="absolute bottom-1 right-1 flex gap-1.5 text-[6px] font-bold">
        <span className="flex items-center gap-0.5 text-red-400">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" /> Guerra
        </span>
        <span className="flex items-center gap-0.5 text-white">
          <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" /> Seleção
        </span>
      </div>
    </div>
  );
};
