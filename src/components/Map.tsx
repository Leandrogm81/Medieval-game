import React, { useState } from 'react';
import { GameState, Province, Realm, ActionType, VisualEffect, ViewMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Flag, TrendingUp, Wheat, Pickaxe, Hammer, Users, Activity, Mountain, TreePine, Shield, Coins, Gem, Handshake, Crown } from 'lucide-react';

interface MapProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  actionState: ActionType;
  actionSourceId: string | null;
  viewMode: ViewMode;
  onProvinceClick: (id: string) => void;
  width?: number;
  height?: number;
  previewPath?: string[];
}

export const Map: React.FC<MapProps> = ({
  gameState,
  selectedProvinceId,
  actionState,
  actionSourceId,
  viewMode,
  onProvinceClick,
  width = 1000,
  height = 750,
  previewPath = []
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
        {effect.type === 'battle' && <span className="text-[10px] font-bold bg-black/50 px-1 rounded text-white">BATALHA!</span>}
      </motion.div>
    );
  };

  const getResourceIcon = (resource?: string) => {
    switch (resource) {
      case 'iron': return <Pickaxe size={10} className="text-slate-400" />;
      case 'wood': return <TreePine size={10} className="text-green-600" />;
      case 'horse': return <Activity size={10} className="text-amber-600" />;
      case 'stone': return <Mountain size={10} className="text-slate-500" />;
      default: return null;
    }
  };

  const getProvinceColor = (prov: Province, isVisible: boolean) => {
    if (!isVisible) return '#1a1a1a';
    const owner = gameState.realms[prov.ownerId];
    const playerRealm = gameState.realms[gameState.playerRealmId];

    switch (viewMode) {
      case 'political':
        return owner?.color || '#cbd5e1';
      case 'economic':
        const wealth = prov.wealth + prov.buildings.mines * 5;
        if (wealth > 15) return '#15803d'; // Rich
        if (wealth > 8) return '#16a34a'; // Medium
        return '#4ade80'; // Low
      case 'military':
        if (prov.troops > 100) return '#b91c1c'; // Strong
        if (prov.troops > 50) return '#dc2626'; // Medium
        return '#f87171'; // Weak
      case 'diplomatic':
        if (prov.ownerId === gameState.playerRealmId) return '#3b82f6';
        const rel = playerRealm.relations[prov.ownerId] || 0;
        if (rel > 50) return '#8b5cf6'; // Ally
        if (rel > 0) return '#a78bfa'; // Friendly
        if (rel < -50) return '#ef4444'; // Hostile
        return '#94a3b8'; // Neutral
      case 'resources':
        if (prov.strategicResource === 'iron') return '#94a3b8';
        if (prov.strategicResource === 'wood') return '#166534';
        if (prov.strategicResource === 'horse') return '#92400e';
        if (prov.strategicResource === 'stone') return '#475569';
        return '#e2e8f0';
      default:
        return owner?.color || '#cbd5e1';
    }
  };

  const renderArmyIcon = (prov: Province) => {
    const total = prov.troops;
    if (total === 0) return null;

    let size = 24;
    if (total > 100) size = 32;
    else if (total > 50) size = 28;

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1 bg-black/20 p-1 rounded-full backdrop-blur-sm border border-white/10">
          {prov.army.infantry > 0 && <Shield size={size/2} className="text-slate-100 drop-shadow-md" />}
          {prov.army.archers > 0 && <Swords size={size/2} className="text-slate-200 drop-shadow-md" />}
          {prov.army.cavalry > 0 && <Activity size={size/2} className="text-amber-400 drop-shadow-md" />}
        </div>
        <div className="bg-[#1a0f0a] px-2.5 py-1 rounded-full text-sm font-bold text-white leading-none border-2 border-amber-500/50 shadow-lg">
          {total}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none p-2 md:p-4">
      <div 
        className="relative parchment-bg rounded-xl overflow-hidden shadow-2xl border-4 md:border-8 border-[#2c1810] touch-none pointer-events-auto flex items-center justify-center"
        style={{ aspectRatio: '4 / 3', width: '100%', maxHeight: '100%' }}
        onMouseMove={handleMouseMove}
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full cursor-pointer"
        >
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <defs>
          <pattern id="forest" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="3" fill="rgba(0, 100, 0, 0.1)" />
          </pattern>
          <pattern id="mountain" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M0 20 L10 0 L20 20 Z" fill="rgba(100, 100, 100, 0.2)" />
          </pattern>
        </defs>
        {(Object.values(gameState.provinces) as Province[]).map(prov => {
          const isVisible = gameState.visibleProvinces.includes(prov.id);
          const owner = gameState.realms[prov.ownerId];
          const isSelected = selectedProvinceId === prov.id;
          const isSource = actionSourceId === prov.id;
          
          let strokeColor = isVisible ? '#2c1810' : '#000';
          let strokeWidth = 1;
          let strokeOpacity = 0.3;
          
          // Stronger borders between realms
          const hasDifferentOwnerNeighbor = prov.neighbors.some(nId => {
            const nProv = gameState.provinces[nId];
            return nProv && nProv.ownerId !== prov.ownerId;
          });
          if (hasDifferentOwnerNeighbor && isVisible) {
            strokeWidth = 2;
            strokeOpacity = 0.8;
          }

          if (isSelected) {
            strokeColor = '#facc15';
            strokeWidth = 3;
            strokeOpacity = 1;
          } else if (isSource) {
            strokeColor = '#3b82f6';
            strokeWidth = 3;
            strokeOpacity = 1;
          }

          const pathData = `M${prov.polygon.map(p => p.join(',')).join('L')}Z`;
          
          return (
            <g 
              key={prov.id} 
              onClick={() => isVisible && onProvinceClick(prov.id)} 
              onMouseEnter={() => isVisible && setHoveredProvinceId(prov.id)}
              onMouseLeave={() => setHoveredProvinceId(null)}
              className={`transition-all duration-200 ${isVisible ? 'hover:opacity-90' : 'opacity-40 cursor-default'}`}
            >
              <path
                d={pathData}
                fill={getProvinceColor(prov, isVisible)}
                fillOpacity={isVisible ? (viewMode === 'political' ? (gameState.visibleProvinces.length > 20 ? 0.9 : 0.6) : 0.8) : 0.9}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinejoin="round"
                filter={isSelected ? "url(#shadow)" : ""}
                className={`transition-colors duration-500 ${isSelected ? 'animate-pulse-slow' : ''}`}
              />
              {isVisible && prov.terrain === 'forest' && (
                <path d={pathData} fill="url(#forest)" pointerEvents="none" />
              )}
              {isVisible && prov.terrain === 'mountain' && (
                <path d={pathData} fill="url(#mountain)" pointerEvents="none" />
              )}
              
              {/* Strategic Resource Icon on Map */}
              {isVisible && prov.strategicResource && viewMode === 'resources' && (
                <foreignObject
                  x={prov.center[0] + 15}
                  y={prov.center[1] - 15}
                  width="16"
                  height="16"
                  className="pointer-events-none"
                >
                  <div className="bg-white/80 rounded-full p-0.5 shadow-sm border border-slate-300">
                    {getResourceIcon(prov.strategicResource)}
                  </div>
                </foreignObject>
              )}

              {/* Province Name */}
              {isVisible && (
                <g className="pointer-events-none">
                  <rect
                    x={prov.center[0] - 50}
                    y={prov.center[1] - 35}
                    width="100"
                    height="18"
                    rx="4"
                    fill="rgba(244, 234, 213, 0.9)"
                    stroke="rgba(26, 15, 10, 0.4)"
                    strokeWidth="1"
                  />
                  <text
                    x={prov.center[0]}
                    y={prov.center[1] - 22}
                    textAnchor="middle"
                    className="text-[14px] font-black fill-[#1a0f0a] uppercase tracking-[0.15em] medieval-title drop-shadow-[0_2px_1px_rgba(255,255,255,0.5)]"
                    style={{ paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.4)', strokeWidth: '3px' }}
                  >
                    {prov.name}
                  </text>
                  {owner && owner.capitalId === prov.id && (
                    <foreignObject
                      x={prov.center[0] - 8}
                      y={prov.center[1] - 52}
                      width="16"
                      height="16"
                    >
                      <Crown size={14} className="text-amber-600 drop-shadow-sm" />
                    </foreignObject>
                  )}
                </g>
              )}
              
              {/* Army Representation */}
              {isVisible && (
                <foreignObject
                  x={prov.center[0] - 30}
                  y={prov.center[1] - 5}
                  width="60"
                  height="60"
                  className="pointer-events-none"
                >
                  {renderArmyIcon(prov)}
                </foreignObject>
              )}
            </g>
          );
        })}
        
        {/* Movement and Attack Arrows */}
        {(actionState === 'moving' || actionState === 'attacking') && actionSourceId && (
          <g pointerEvents="none">
            {gameState.provinces[actionSourceId].neighbors.map(nId => {
              const target = gameState.provinces[nId];
              
              if (actionState === 'moving' && target.ownerId !== gameState.playerRealmId) return null;
              if (actionState === 'attacking' && target.ownerId === gameState.playerRealmId) return null;
              
              const source = gameState.provinces[actionSourceId];
              const arrowColor = actionState === 'attacking' ? '#ef4444' : '#3b82f6';
              
              return (
                <motion.line
                  key={`arrow-${nId}`}
                  x1={source.center[0]}
                  y1={source.center[1]}
                  x2={target.center[0]}
                  y2={target.center[1]}
                  stroke={arrowColor}
                  strokeWidth="4"
                  strokeDasharray="8 4"
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: -12 }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                  markerEnd={actionState === 'attacking' ? "url(#arrowhead_attack)" : "url(#arrowhead_move)"}
                />
              );
            })}
            <defs>
              <marker id="arrowhead_move" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
              <marker id="arrowhead_attack" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
          </g>
        )}

        {/* Path Preview (for long marches or scouts) */}
        {previewPath.length > 0 && actionSourceId && (
          <g pointerEvents="none">
            {(() => {
              const fullPath = [actionSourceId, ...previewPath];
              const lines = [];
              for (let i = 0; i < fullPath.length - 1; i++) {
                const s = gameState.provinces[fullPath[i]];
                const t = gameState.provinces[fullPath[i+1]];
                if (s && t) {
                  lines.push(
                    <motion.line
                      key={`preview-${i}`}
                      x1={s.center[0]} y1={s.center[1]}
                      x2={t.center[0]} y2={t.center[1]}
                      stroke="#facc15"
                      strokeWidth="3"
                      strokeDasharray="4 4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      strokeLinecap="round"
                    />
                  );
                }
              }
              return lines;
            })()}
          </g>
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredProvinceId && gameState.provinces[hoveredProvinceId] && (
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
            className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl min-w-[180px]"
          >
            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-1">
              <span className="text-xs font-bold text-slate-100">{gameState.provinces[hoveredProvinceId].name || 'Província'}</span>
              {gameState.provinces[hoveredProvinceId].strategicResource && gameState.provinces[hoveredProvinceId].strategicResource !== 'none' && (
                <span className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  {getResourceIcon(gameState.provinces[hoveredProvinceId].strategicResource)}
                  {gameState.provinces[hoveredProvinceId].strategicResource === 'iron' ? 'Ferro' : 
                   gameState.provinces[hoveredProvinceId].strategicResource === 'wood' ? 'Madeira' :
                   gameState.provinces[hoveredProvinceId].strategicResource === 'horse' ? 'Cavalo' : 
                   gameState.provinces[hoveredProvinceId].strategicResource === 'stone' ? 'Pedra' : ''}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1 text-[9px] text-center">
                <div className="bg-slate-800 p-1 rounded">
                  <div className="text-slate-500">Inf</div>
                  <div className="font-bold">{gameState.provinces[hoveredProvinceId].army?.infantry ?? 0}</div>
                </div>
                <div className="bg-slate-800 p-1 rounded">
                  <div className="text-slate-500">Arq</div>
                  <div className="font-bold">{gameState.provinces[hoveredProvinceId].army?.archers ?? 0}</div>
                </div>
                <div className="bg-slate-800 p-1 rounded">
                  <div className="text-slate-500">Cav</div>
                  <div className="font-bold">{gameState.provinces[hoveredProvinceId].army?.cavalry ?? 0}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1"><Users size={10} /> Pop</span>
                  <span className="text-slate-200">{Math.floor(gameState.provinces[hoveredProvinceId].population)} / {gameState.provinces[hoveredProvinceId].maxPopulation}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={10} /> Eficiência</span>
                  <span className="text-blue-400">{Math.floor((gameState.provinces[hoveredProvinceId].population / gameState.provinces[hoveredProvinceId].maxPopulation) * 100)}%</span>
                </div>
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
    </div>
  );
};
