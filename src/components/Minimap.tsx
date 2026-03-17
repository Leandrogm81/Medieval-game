import React from 'react';
import { GameState, Province } from '../types';

interface MinimapProps {
  gameState: GameState;
  width: number;
  height: number;
  onProvinceClick: (id: string) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ gameState, width, height, onProvinceClick }) => {
  const mapWidth = 1000; // Updated map width
  const mapHeight = 750; // Updated map height
  const scaleX = width / mapWidth;
  const scaleY = height / mapHeight;

  return (
    <div 
      className="absolute bottom-4 left-4 bg-black/60 backdrop-blur border border-slate-700 rounded-lg overflow-hidden shadow-2xl pointer-events-auto"
      style={{ width, height }}
    >
      <svg width={width} height={height} className="pointer-events-none">
        {(Object.values(gameState.provinces) as Province[]).map(prov => {
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          const owner = gameState.realms[prov.ownerId];
          
          const scaledPolygon = prov.polygon.map(([x, y]) => [x * scaleX, y * scaleY]);
          const pathData = `M${scaledPolygon.map(p => p.join(',')).join('L')}Z`;
          
          return (
            <path
              key={prov.id}
              d={pathData}
              fill={isVisible ? (owner?.color || '#cbd5e1') : '#1a1a1a'}
              fillOpacity={isVisible ? 0.8 : 0.5}
              stroke="#000"
              strokeWidth={0.5}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="absolute top-1 left-1 text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Minimapa</div>
    </div>
  );
};
