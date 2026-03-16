import React, { useState } from 'react';
import { GameState, Province, Realm, ActionType, VisualEffect } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Flag, TrendingUp, Wheat, Pickaxe, Hammer } from 'lucide-react';

interface MapProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  actionState: ActionType;
  actionSourceId: string | null;
  onProvinceClick: (id: string) => void;
  width: number;
  height: number;
}

export const Map: React.FC<MapProps> = ({
  gameState,
  selectedProvinceId,
  actionState,
  actionSourceId,
  onProvinceClick,
  width,
  height
}) => {
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const renderEffect = (effect: VisualEffect) => {
    const Icon = effect.type === 'battle' ? Swords : effect.type === 'conquest' ? Flag : TrendingUp;
    const color = effect.type === 'battle' ? 'text-red-500' : effect.type === 'conquest' ? 'text-amber-500' : 'text-green-500';

    return (
      <motion.div
        key={effect.id}
        initial={{ scale: 0, opacity: 0, y: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], y: -50 }}
        exit={{ opacity: 0 }}
        transition={{ duration: effect.duration / 1000 }}
        style={{
          position: 'absolute',
          left: effect.x,
          top: effect.y,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 50
        }}
        className={`flex flex-col items-center ${color}`}
      >
        <Icon size={32} className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
        {effect.type === 'battle' && <span className="text-[10px] font-bold bg-black/50 px-1 rounded text-white">BATTLE!</span>}
      </motion.div>
    );
  };

  return (
    <div 
      className="relative bg-blue-900/20 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800"
      style={{ width, height }}
      onMouseMove={handleMouseMove}
    >
      <svg width={width} height={height} className="cursor-pointer">
        <defs>
          <pattern id="forest" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="3" fill="rgba(0, 100, 0, 0.2)" />
          </pattern>
          <pattern id="mountain" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M0 20 L10 0 L20 20 Z" fill="rgba(100, 100, 100, 0.3)" />
          </pattern>
        </defs>
        {(Object.values(gameState.provinces) as Province[]).map(prov => {
          const owner = gameState.realms[prov.ownerId];
          const isSelected = selectedProvinceId === prov.id;
          const isSource = actionSourceId === prov.id;
          
          let strokeColor = '#1e293b';
          let strokeWidth = 1;
          
          if (isSelected) {
            strokeColor = '#facc15';
            strokeWidth = 3;
          } else if (isSource) {
            strokeColor = '#3b82f6';
            strokeWidth = 3;
          }

          const pathData = `M${prov.polygon.map(p => p.join(',')).join('L')}Z`;
          
          return (
            <g 
              key={prov.id} 
              onClick={() => onProvinceClick(prov.id)} 
              onMouseEnter={() => setHoveredProvinceId(prov.id)}
              onMouseLeave={() => setHoveredProvinceId(null)}
              className="transition-all duration-200 hover:opacity-90"
            >
              <path
                d={pathData}
                fill={owner?.color || '#cbd5e1'}
                fillOpacity={0.8}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                className="transition-colors duration-500"
              />
              {prov.terrain === 'forest' && (
                <path d={pathData} fill="url(#forest)" pointerEvents="none" />
              )}
              {prov.terrain === 'mountain' && (
                <path d={pathData} fill="url(#mountain)" pointerEvents="none" />
              )}
              {/* Province Name */}
              <text
                x={prov.center[0]}
                y={prov.center[1] - 6}
                textAnchor="middle"
                className="text-[7px] font-semibold fill-white pointer-events-none uppercase tracking-wider"
                style={{ textShadow: '1px 1px 2px black' }}
              >
                {prov.name}
              </text>
              {/* Troop Count */}
              <text
                x={prov.center[0]}
                y={prov.center[1] + 8}
                textAnchor="middle"
                className="text-[10px] font-bold fill-white pointer-events-none"
                style={{ textShadow: '1px 1px 2px black' }}
              >
                {prov.troops}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredProvinceId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              pointerEvents: 'none',
              zIndex: 60
            }}
            className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl min-w-[150px]"
          >
            <div className="text-xs font-bold text-slate-100 mb-2 border-b border-slate-700 pb-1">
              {gameState.provinces[hoveredProvinceId].name}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1"><Wheat size={10} /> Food</span>
                <span className="text-green-400">+{gameState.provinces[hoveredProvinceId].foodProduction + (gameState.provinces[hoveredProvinceId].buildings.farms * 10)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1"><Pickaxe size={10} /> Materials</span>
                <span className="text-blue-400">+{gameState.provinces[hoveredProvinceId].materialProduction + (gameState.provinces[hoveredProvinceId].buildings.workshops * 5)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={10} /> Gold</span>
                <span className="text-yellow-400">+{gameState.provinces[hoveredProvinceId].wealth + (gameState.provinces[hoveredProvinceId].buildings.mines * 5)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Effects Overlay */}
      <AnimatePresence>
        {gameState.visualEffects.map(renderEffect)}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur p-2 rounded border border-slate-700 text-[10px] text-slate-400">
        {(Object.values(gameState.realms) as Realm[]).map(r => (
          <div key={r.id} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></div> {r.name}
          </div>
        ))}
      </div>
    </div>
  );
};
