import React, { useMemo } from 'react';
import { GameState, ViewMode, ActionType, UnitType, Province, Realm, MarchOrder } from '../types';
import { 
  Shield, Swords, Crown, Scroll, Play, Info, Handshake, Home,
  Coins, Carrot, Construction, Users, TrendingUp, TrendingDown,
  Hammer, Map as MapIcon, Eye, Zap, Landmark, X, ChevronDown, ChevronUp,
  Settings, Maximize2, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ACTION_COSTS, BUILDING_PRODUCTION, BUILDING_STATS, UNIT_STATS } from '../logic/game-constants';

interface HUDProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  onAction: (type: ActionType, provinceId: string, extra?: any) => void;
  onEndTurn: () => void;
  onToggleMode: (mode: ViewMode) => void;
  viewMode: ViewMode;
  onSave: () => void;
  onMenu: () => void;
  onToggleChronicles: () => void;
  actionState: ActionType;
  onCancelAction: () => void;
  onToggleHud: () => void;
  isHudOpen: boolean;
  onMapAction?: (type: 'move' | 'attack' | 'scout') => void;
  marchOrders: MarchOrder[];
  onCancelMarchOrder: (id: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  moveComposition: any;
  onMoveCompositionChange: (army: any) => void;
  onDispatchScouts?: () => void;
  onRoute?: () => void;
  onToggleFullScreen: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  selectedProvinceId,
  onAction,
  onEndTurn,
  onToggleMode,
  viewMode,
  onSave,
  onMenu,
  onToggleChronicles,
  actionState,
  onCancelAction,
  onToggleHud,
  isHudOpen,
  onMapAction,
  marchOrders,
  onCancelMarchOrder,
  zoom,
  onZoomChange,
  moveComposition,
  onMoveCompositionChange,
  onDispatchScouts,
  onRoute,
  onToggleFullScreen
}) => {
  const playerRealm = gameState.realms[gameState.playerRealmId];
  if (!playerRealm) return null;

  const selectedProvince = selectedProvinceId ? gameState.provinces[selectedProvinceId] : null;

  // Calculando lucros líquidos estimados (idêntico ao logicTurn.ts)
  const playerProvinces = useMemo(() => Object.values(gameState.provinces).filter(p => p.ownerId === gameState.playerRealmId), [gameState.provinces, gameState.playerRealmId]);
  
  const baseGoldIncome = playerProvinces.reduce((sum, p) => {
    const loyaltyFactor = 0.5 + (p.loyalty / 200);
    const efficiency = ((0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor);
    return sum + ((p.wealth || 0) + ((p.buildings?.mines || 0) * BUILDING_PRODUCTION.mines)) * efficiency;
  }, 0);

  const baseFoodIncome = playerProvinces.reduce((sum, p) => {
    const loyaltyFactor = 0.5 + (p.loyalty / 200);
    const efficiency = ((0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor);
    let income = ((p.foodProduction || 0) + ((p.buildings?.farms || 0) * BUILDING_PRODUCTION.farms)) * efficiency;
    if (p.strategicResource === 'horse') income += 5 * efficiency;
    return income + sum;
  }, 0);

  const baseMaterialsIncome = playerProvinces.reduce((sum, p) => {
    const loyaltyFactor = 0.5 + (p.loyalty / 200);
    const efficiency = ((0.5 + (p.population / p.maxPopulation) * 0.5) * loyaltyFactor);
    let income = ((p.materialProduction || 0) + ((p.buildings?.workshops || 0) * BUILDING_PRODUCTION.workshops)) * efficiency;
    if (p.strategicResource === 'iron' || p.strategicResource === 'wood' || p.strategicResource === 'stone') income += 5 * efficiency;
    return income + sum;
  }, 0);

  const goldMaintenance = playerProvinces.reduce((sum, p) => {
    return sum + (p.army.infantry * UNIT_STATS.infantry.maintenance.gold) +
                 (p.army.archers * UNIT_STATS.archers.maintenance.gold) +
                 (p.army.cavalry * UNIT_STATS.cavalry.maintenance.gold) +
                 (p.army.scouts * UNIT_STATS.scouts.maintenance.gold);
  }, 0);

  const netGold = Math.floor(baseGoldIncome - goldMaintenance);
  const netFood = Math.floor(baseFoodIncome);
  const netMaterials = Math.floor(baseMaterialsIncome);

  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-stone-900/95 border-l border-amber-900/30 shadow-2xl transition-all duration-500 hud-docked`}>
      {/* Top Bar - Recurso */}
      <div className="p-2 md:p-4 bg-black/40 border-b border-amber-900/20">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center`} style={{ backgroundColor: playerRealm.color }}>
               <Crown size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-black text-amber-50 tracking-widest uppercase">{playerRealm.name}</h2>
              <p className="text-[8px] md:text-[10px] text-amber-500/60 font-serif italic">Turno {gameState.turn}</p>
            </div>
          </div>
          <div className="flex gap-1">
             <button onClick={onSave} className="p-1 px-2 border border-stone-700 bg-stone-800 text-[8px] font-bold uppercase rounded hover:bg-stone-700 transition-colors">Salvar</button>
             <button onClick={onMenu} className="p-1 px-2 border border-stone-700 bg-stone-800 text-[8px] font-bold uppercase rounded hover:bg-stone-700 transition-colors">Menu</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 md:gap-2">
          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm relative group">
            <div className="flex items-center gap-1 mb-0.5">
              <Coins size={12} className="text-amber-500" />
              <span className="text-[8px] md:text-[10px] text-stone-400 font-bold uppercase">Tesouro</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.gold}</p>
            <span className={`text-[8px] font-bold ${netGold >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netGold >= 0 ? '+' : ''}{netGold}
            </span>
          </div>
          
          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm">
            <div className="flex items-center gap-1 mb-0.5">
              <Carrot size={12} className="text-orange-500" />
              <span className="text-[8px] md:text-[10px] text-stone-400 font-bold uppercase">Grãos</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.food}</p>
            <span className="text-[8px] text-green-500 font-bold">+{netFood}</span>
          </div>

          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm">
            <div className="flex items-center gap-1 mb-0.5">
              <Hammer size={12} className="text-blue-500" />
              <span className="text-[8px] md:text-[10px] text-stone-400 font-bold uppercase">Obra</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.materials}</p>
            <span className="text-[8px] text-green-400 font-bold">+{netMaterials}</span>
          </div>

          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[8px] md:text-[10px] text-stone-400 font-bold uppercase">Ação</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.actionPoints}/{playerRealm.maxActionPoints}</p>
            <div className="w-full bg-stone-700 h-1 mt-1 rounded-full overflow-hidden">
               <div className="bg-amber-400 h-full" style={{ width: `${(playerRealm.actionPoints/playerRealm.maxActionPoints)*100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4">
        {selectedProvince ? (
          <div className="space-y-4">
             {/* Province Details */}
             <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <p className="text-[8px] md:text-[10px] text-amber-500/60 font-bold uppercase tracking-widest">{selectedProvince.ownerId === 'neutral' ? 'Terra Neutra' : gameState.realms[selectedProvince.ownerId]?.name}</p>
                      <h3 className="text-lg md:text-2xl font-black text-amber-100 uppercase tracking-tighter">{selectedProvince.name}</h3>
                   </div>
                   <div className="bg-stone-900 px-2 py-1 rounded border border-stone-700">
                      <p className="text-[8px] text-stone-500 uppercase font-black">Terreno</p>
                      <p className="text-[8px] md:text-[10px] uppercase font-bold text-amber-200">{selectedProvince.terrain === 'plains' ? 'Planície' : selectedProvince.terrain === 'forest' ? 'Floresta' : 'Montanha'}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                   <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                      <Users size={16} className="text-stone-400" />
                      <div>
                         <p className="text-[8px] text-stone-500 font-bold uppercase">População</p>
                         <p className="text-xs md:text-sm font-black text-amber-50">{selectedProvince.population}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                      <Shield size={16} className="text-amber-600" />
                      <div>
                         <p className="text-[8px] text-stone-500 font-bold uppercase">Defesa</p>
                         <p className="text-xs md:text-sm font-black text-amber-50">Nível {selectedProvince.defense}</p>
                      </div>
                   </div>
                </div>

                {/* Military Actions */}
                {selectedProvince.ownerId === gameState.playerRealmId && (
                  <div className="mt-4 space-y-2">
                     <p className="text-[8px] md:text-[10px] text-stone-500 font-black uppercase border-b border-stone-700 pb-1 mb-2">Comandos Militares</p>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => onMapAction?.('move')}
                          className="flex items-center justify-center gap-2 py-2 bg-stone-800 border border-stone-700 hover:bg-amber-600/10 hover:border-amber-600/50 rounded-sm text-[10px] font-bold uppercase transition-all"
                        >
                           <Swords size={14} className="text-amber-500" /> Marchar
                        </button>
                        <button 
                          onClick={() => onMapAction?.('attack')}
                          className="flex items-center justify-center gap-2 py-2 bg-stone-800 border border-stone-700 hover:bg-red-600/10 hover:border-red-600/50 rounded-sm text-[10px] font-bold uppercase transition-all"
                        >
                           <Zap size={14} className="text-red-500" /> Atacar
                        </button>
                     </div>
                  </div>
                )}
             </div>

             {/* Recruitment / Building Sections (Simplified) */}
             {selectedProvince.ownerId === gameState.playerRealmId && (
               <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
                  <p className="text-[8px] md:text-[10px] text-stone-500 font-black uppercase mb-3">Administração Regional</p>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[8px] font-bold uppercase text-amber-200">Recrutamento</span>
                           <span className="text-[8px] text-stone-500 italic">Custo: {ACTION_COSTS.recruit} AP</span>
                        </div>
                        <button 
                           onClick={() => onAction('recruit', selectedProvince.id)}
                           className="w-full py-2 bg-amber-600/20 border border-amber-600 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-600/30 transition-all rounded-sm flex items-center justify-center gap-2"
                        >
                           <PlusCircle size={14} /> Recrutar Batalhão
                        </button>
                     </div>

                     <div>
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-[8px] font-bold uppercase text-amber-200">Projetos</span>
                           <span className="text-[8px] text-stone-500 italic">Custo: {ACTION_COSTS.build} AP</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                           {['farms', 'mines', 'workshops', 'courts'].map(b => (
                            <button
                              key={b}
                              onClick={() => onAction('build', selectedProvince.id, b)}
                              className="text-[8px] font-bold uppercase py-1 bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-sm text-stone-400 hover:text-amber-200 transition-all"
                            >
                               {b === 'farms' ? 'Fazendas' : b === 'mines' ? 'Minas' : b === 'workshops' ? 'Oficinas' : 'Corte'}
                            </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
             <MapIcon size={48} className="text-stone-700 mb-4" />
             <p className="text-[10px] md:text-sm font-serif italic text-stone-500">Selecione uma província no mapa<br />para ver detalhes e emitir ordens.</p>
          </div>
        )}
      </div>

      {/* Actions Bottom */}
      <div className="p-4 bg-black/60 border-t border-amber-900/30 space-y-2">
         <button 
           onClick={onEndTurn}
           className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-sm md:text-lg uppercase tracking-widest transition-all rounded-sm shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-[0.98] flex items-center justify-center gap-3"
         >
            <Play size={20} className="fill-stone-950" /> Encerrar Turno
         </button>
         
         <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => onToggleMode('political')}
              className={`flex flex-col items-center justify-center py-2 rounded-sm border transition-all ${viewMode === 'political' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
            >
               <MapIcon size={16} />
               <span className="text-[8px] font-bold uppercase mt-1">Político</span>
            </button>
            <button 
              onClick={() => onToggleMode('economic')}
              className={`flex flex-col items-center justify-center py-2 rounded-sm border transition-all ${viewMode === 'economic' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
            >
               <Landmark size={16} />
               <span className="text-[8px] font-bold uppercase mt-1">Economia</span>
            </button>
            <button 
              onClick={onToggleChronicles}
              className="flex flex-col items-center justify-center py-2 bg-stone-800/40 border border-stone-700 text-stone-500 hover:text-amber-200 rounded-sm transition-all"
            >
               <Scroll size={16} />
               <span className="text-[8px] font-bold uppercase mt-1">Crônicas</span>
            </button>
         </div>
      </div>
    </div>
  );
};
