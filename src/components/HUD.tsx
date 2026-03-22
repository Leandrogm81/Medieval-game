import React, { useState } from 'react';
import { GameState, Province, Realm, ActionType, UnitType, ViewMode, Army, MarchOrder } from '../types';
import { Coins, Shield, Swords, Users, Mountain, TreePine, Map as MapIcon, ArrowRight, PlusCircle, Handshake, X, Wheat, Hammer, Pickaxe, Factory, Tractor, ShoppingCart, TrendingUp, AlertTriangle, Info, Zap, Activity, Gem, Eye, BarChart3, Globe2, Crosshair, Save, Home, Crown, Scroll, Navigation, Route } from 'lucide-react';
import { UNIT_STATS, ACTION_COSTS, BUILDING_STATS, BUILDING_PRODUCTION } from '../gameLogic';
import { motion, AnimatePresence } from 'motion/react';

interface HUDProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  onAction: (action: string, unitType?: UnitType, amount?: number) => void;
  onEndTurn: () => void;
  onToggleMode: () => void;
  viewMode: ViewMode;
  onSave: () => void;
  onMenu: () => void;
  onToggleChronicles: () => void;
  actionState: ActionType;
  onCancelAction: () => void;
  onToggleHud: () => void;
  isHudOpen: boolean;
  onMapAction: (type: 'move' | 'attack' | 'scout') => void;
  marchOrders: MarchOrder[];
  onCancelMarchOrder: (id: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  moveComposition: Army;
  onMoveCompositionChange: (comp: Army) => void;
  onDispatchScouts: () => void;
  onRoute: () => void;
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
  onToggleFullScreen,
}) => {
  const [recruitAmount, setRecruitAmount] = useState(10);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('infantry');
  const [activeTab, setActiveTab] = useState<'province' | 'market' | 'diplomacy'>('province');

  const playerRealm = gameState.realms[gameState.playerRealmId];
  const selectedProv = selectedProvinceId ? gameState.provinces[selectedProvinceId] : null;

  if (!playerRealm) return <div className="p-4 text-red-500 font-bold bg-slate-800 h-full">Erro: Reino do jogador não encontrado.</div>;
  
  const playerProvinces = (Object.values(gameState.provinces) as Province[]).filter(p => p.ownerId === playerRealm.id);
  
  const totalTroops = playerProvinces.reduce((sum, p) => sum + (p.troops ?? 0), 0);
    
  const baseGoldIncome = playerProvinces.reduce((sum, p) => {
    const efficiency = (p.population || 0) / (p.maxPopulation || 1);
    return sum + ((p.wealth || 0) + ((p.buildings?.mines || 0) * BUILDING_PRODUCTION.mines)) * efficiency;
  }, 0);
    
  const baseFoodIncome = playerProvinces.reduce((sum, p) => {
    const efficiency = (p.population || 0) / (p.maxPopulation || 1);
    return sum + ((p.foodProduction || 0) + ((p.buildings?.farms || 0) * BUILDING_PRODUCTION.farms)) * efficiency;
  }, 0);

  const oePenalty = (playerRealm.overextension || 0) > 20 ? ((playerRealm.overextension || 0) - 20) / 100 : 0;
  const goldIncome = Math.floor(baseGoldIncome * (1 - oePenalty));
  const foodIncome = Math.floor(baseFoodIncome * (1 - oePenalty));

  const goldMaintenance = playerProvinces.reduce((sum, p) => 
    sum + (p.army?.infantry || 0) * UNIT_STATS.infantry.maintenance.gold + 
    (p.army?.archers || 0) * UNIT_STATS.archers.maintenance.gold + 
    (p.army?.cavalry || 0) * UNIT_STATS.cavalry.maintenance.gold, 0);

  const foodMaintenance = playerProvinces.reduce((sum, p) => 
    sum + (p.army?.infantry || 0) * UNIT_STATS.infantry.maintenance.food + 
    (p.army?.archers || 0) * UNIT_STATS.archers.maintenance.food + 
    (p.army?.cavalry || 0) * UNIT_STATS.cavalry.maintenance.food, 0);
  
  const netGold = Math.floor(goldIncome - goldMaintenance);
  const netFood = Math.floor(foodIncome - foodMaintenance);

  const handleRecruitConfirm = () => {
    onAction('recruit', selectedUnitType, recruitAmount);
    setIsRecruiting(false);
    setRecruitAmount(10);
  };

  const getResourceIcon = (resource?: string) => {
    switch (resource) {
      case 'iron': return <Pickaxe size={14} className="text-slate-400" />;
      case 'wood': return <TreePine size={14} className="text-green-600" />;
      case 'horse': return <Activity size={14} className="text-amber-600" />;
      case 'stone': return <Mountain size={14} className="text-slate-500" />;
      default: return null;
    }
  };

  const getResourceName = (resource?: string) => {
    switch (resource) {
      case 'iron': return 'Ferro';
      case 'wood': return 'Madeira';
      case 'horse': return 'Cavalo';
      case 'stone': return 'Pedra';
      default: return resource;
    }
  };

  return (
    <>
      {/* HUD Toggle Button (visible when HUD is closed or on mobile) */}
      <button
        onClick={onToggleHud}
        className={`hud-toggle-btn fixed top-4 right-4 z-50 p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-full text-white shadow-xl transition-all active:scale-95 ${isHudOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title={isHudOpen ? "Fechar Menu" : "Abrir Menu"}
      >
        <BarChart3 size={20} />
      </button>

      <div 
        className={`hud-docked bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl z-40 transition-all duration-300 ease-in-out absolute right-0 top-0 h-[100dvh] w-[min(78vw,380px)] ${
          isHudOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
        }`}
      >
        {/* Toggle handle for desktop */}
        <button 
          onClick={onToggleHud}
          className="hud-toggle-btn absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-slate-800/90 text-slate-400 rounded-l-lg border-l border-t border-b border-white/10 flex items-center justify-center hover:text-white transition-colors"
        >
          {isHudOpen ? <ArrowRight size={20} /> : <BarChart3 size={20} />}
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain">
          <div className="p-4 md:p-6 space-y-6 pb-24">
            {/* Header with Fullscreen option */}
            <div className="flex justify-between items-center mb-2 gap-2">
               <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-100 flex items-center gap-2 min-w-0">
                 <Crown className="text-amber-500 shrink-0" /> <span className="truncate">{playerRealm.name}</span>
               </h1>
               <div className="flex gap-1">
                 <button 
                   onClick={onToggleFullScreen}
                   className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                   title="Tela Cheia"
                 >
                   <Globe2 size={16} />
                 </button>
                 <button onClick={onToggleChronicles} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors">
                   <Scroll size={16} />
                 </button>
               </div>
            </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-between h-12 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-tighter">
              <span className="flex items-center gap-1"><Coins size={12} className="text-amber-600" /> Ouro</span>
              <span className={netGold >= 0 ? 'text-green-500' : 'text-red-500'}>{netGold >= 0 ? '+' : ''}{netGold}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-amber-500 font-serif leading-none tracking-tight">{Math.floor(playerRealm.gold)}</div>
          </div>
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-between h-12 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-tighter">
              <span className="flex items-center gap-1"><Wheat size={12} className="text-green-600" /> Comida</span>
              <span className={netFood >= 0 ? 'text-green-500' : 'text-red-500'}>{netFood >= 0 ? '+' : ''}{netFood}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-green-500 font-serif leading-none tracking-tight">{Math.floor(playerRealm.food)}</div>
          </div>
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-between h-12 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-tighter">
              <span className="flex items-center gap-1"><Hammer size={12} className="text-slate-500" /> Materiais</span>
              <span className="text-xs text-slate-400 font-bold">{Math.floor(playerRealm.materials)}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-slate-300 font-serif leading-none tracking-tight">{Math.floor(playerRealm.materials)}</div>
          </div>
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-between h-12 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-500 uppercase font-black tracking-tighter">
              <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500" /> APs</span>
              <span className="text-xs text-blue-400/80 font-bold">{playerRealm.actionPoints}</span>
            </div>
            <div className="text-lg md:text-xl font-black text-blue-400 font-serif leading-none tracking-tight">{playerRealm.actionPoints}/{playerRealm.maxActionPoints}</div>
          </div>
        </div>

        {/* Action Controls: Zoom & OE */}
        <div className="flex items-center justify-between mt-3 gap-2">
           <div className="flex flex-col gap-0.5 min-w-[3.5rem]">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none">Mapa</span>
              <div className="flex gap-1">
                <button onClick={() => onZoomChange(Math.max(0.4, zoom - 0.2))} className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold transition-all">-</button>
                <button onClick={() => onZoomChange(1.0)} className="px-1.5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-[9px] font-black min-w-[2.2rem]">{Math.round(zoom * 100)}%</button>
                <button onClick={() => onZoomChange(Math.min(3.0, zoom + 0.2))} className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-xs font-bold transition-all">+</button>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-1 bg-slate-900/50 px-2 py-1 rounded border border-white/5 flex-1">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none">Tropas Reais</span>
              <div className="flex items-center gap-1.5 font-serif font-black text-amber-100 text-xs">
                 <Users size={10} className="text-amber-500/50" /> {totalTroops}
              </div>
           </div>

           {playerRealm.overextension > 0 && (
             <div className="flex flex-col items-end gap-0.5">
                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none">Expansão</span>
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${playerRealm.overextension > 40 ? 'bg-red-900/30 text-red-400 border-red-500/30 animate-pulse' : 'bg-amber-900/20 text-amber-500 border-amber-500/20'}`}>
                  {playerRealm.overextension}%
                </div>
             </div>
           )}
        </div>
      </div>

        {/* Main Nav (Tabs) */}
        <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700 shadow-inner">
            <button onClick={() => setActiveTab('province')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-3 rounded text-[10px] sm:text-xs md:text-sm font-black uppercase transition-all ${activeTab === 'province' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <MapIcon size={14} className="mb-0.5 sm:mb-0" /> Reinos
            </button>
            <button onClick={() => setActiveTab('market')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-3 rounded text-[10px] sm:text-xs md:text-sm font-black uppercase transition-all ${activeTab === 'market' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <ShoppingCart size={14} className="mb-0.5 sm:mb-0" /> Mercado
            </button>
            <button onClick={() => setActiveTab('diplomacy')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-3 rounded text-[10px] sm:text-xs md:text-sm font-black uppercase transition-all ${activeTab === 'diplomacy' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <Handshake size={14} className="mb-0.5 sm:mb-0" /> Política
            </button>
          </div>
        </div>

      {/* Map View Modes Overlay (Compact) */}
      <div className="px-2 sm:px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 flex flex-wrap gap-1 items-center justify-center">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter mr-1 w-full text-center sm:w-auto sm:text-left mb-1 sm:mb-0">Visão</span>
        {[
          { id: 'political', icon: <Globe2 size={14} />, color: 'blue', label: 'Pol' },
          { id: 'economic', icon: <BarChart3 size={14} />, color: 'green', label: 'Eco' },
          { id: 'military', icon: <Crosshair size={14} />, color: 'red', label: 'Mil' },
          { id: 'diplomatic', icon: <Handshake size={14} />, color: 'purple', label: 'Dip' },
          { id: 'resources', icon: <Gem size={14} />, color: 'amber', label: 'Res' },
        ].map(mode => (
          <button 
            key={mode.id}
            onClick={onToggleMode}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded border transition-all flex-1 justify-center sm:flex-none ${viewMode === mode.id ? `bg-${mode.color}-600/20 border-${mode.color}-500 text-${mode.color}-400 shadow-sm` : 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700'}`}
          >
            {mode.icon} <span className="text-[10px] sm:text-xs font-black uppercase">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Event Banner (Conditional) */}
      {gameState.currentEvent && (
        <div className={`p-3 border-b shrink-0 ${
          gameState.currentEvent.type === 'positive' ? 'bg-green-900/30 border-green-500/50' : 
          gameState.currentEvent.type === 'negative' ? 'bg-red-900/30 border-red-500/50' : 
          'bg-slate-800 border-slate-600 shadow-inner'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {gameState.currentEvent.type === 'positive' ? <TrendingUp size={14} className="text-green-400" /> : 
             gameState.currentEvent.type === 'negative' ? <AlertTriangle size={14} className="text-red-400" /> : 
             <Info size={14} className="text-slate-400" />}
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              gameState.currentEvent.type === 'positive' ? 'text-green-400' : 
              gameState.currentEvent.type === 'negative' ? 'text-red-400' : 
              'text-slate-400'
            }`}>
              {gameState.currentEvent.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-tight">
            {gameState.currentEvent.description}
          </p>
        </div>
      )}

      {/* Smart Alerts */}
      {(() => {
        const alerts: { icon: React.ReactNode; text: string; color: string }[] = [];
        
        // Rebellion risk
        playerProvinces.filter(p => p.loyalty < 30).forEach(p => {
          alerts.push({ icon: <AlertTriangle size={12} />, text: `${p.name || 'Província'} em risco de rebelião (${p.loyalty}%)`, color: 'text-red-400 bg-red-900/20 border-red-500/20' });
        });
        
        // Resource deficit
        if (netGold < -10) alerts.push({ icon: <Coins size={12} />, text: `Déficit de ouro: ${netGold}/turno`, color: 'text-amber-400 bg-amber-900/20 border-amber-500/20' });
        if (netFood < -10) alerts.push({ icon: <Wheat size={12} />, text: `Déficit de comida: ${netFood}/turno`, color: 'text-amber-400 bg-amber-900/20 border-amber-500/20' });
        
        // Threatened border
        const warEnemies = playerRealm.wars || [];
        if (warEnemies.length > 0) {
          const threatened = playerProvinces.filter(p => 
            (p.neighbors || []).some(nId => {
              const n = gameState.provinces[nId];
              return n && warEnemies.includes(n.ownerId) && (n.troops || 0) > (p.troops || 0);
            })
          );
          threatened.slice(0, 1).forEach(p => {
            alerts.push({ icon: <Shield size={12} />, text: `${p.name || 'Província'} ameaçada por inimigo superior`, color: 'text-orange-400 bg-orange-900/20 border-orange-500/20' });
          });
        }
        
        // Diplomatic opportunity
        const otherRealms = (Object.values(gameState.realms) as Realm[]).filter(r => r && r.id !== playerRealm.id && !playerRealm.wars?.includes(r.id));
        otherRealms.filter(r => (playerRealm.relations?.[r.id] || 0) > 40 && !playerRealm.pacts?.includes(r.id) && !playerRealm.alliances?.includes(r.id)).slice(0, 1).forEach(r => {
          alerts.push({ icon: <Handshake size={12} />, text: `${r.name || 'Reino'} aberto a pacto (relação ${Math.floor(playerRealm.relations?.[r.id] || 0)})`, color: 'text-green-400 bg-green-900/20 border-green-500/20' });
        });

        if (alerts.length === 0) return null;
        
        return (
          <div className="px-4 pt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {alerts.map((a, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-xs font-bold shadow-sm ${a.color} animate-pulse-subtle`}
              >
                <div className="shrink-0">{a.icon}</div>
                <span className="leading-tight">{a.text}</span>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* Selected Province Info */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'market' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-slate-100 border-b border-slate-700 pb-2 flex items-center gap-2">
              <ShoppingCart size={20} className="text-amber-500" /> Mercado Global
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="flex items-center gap-2 font-bold text-green-400"><Wheat size={18} /> Comida</span>
                  <span className="text-xs text-slate-500">Estoque: {playerRealm.food || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Comprar 50 (25O)
                  </button>
                  <button 
                    onClick={() => onAction('sell_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Vender 50 (15O)
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="flex items-center gap-2 font-bold text-slate-300"><Hammer size={18} /> Materiais</span>
                  <span className="text-xs text-slate-500">Estoque: {playerRealm.materials || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Comprar 25 (35O)
                  </button>
                  <button 
                    onClick={() => onAction('sell_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Vender 25 (20O)
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'diplomacy' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-slate-100 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Handshake size={20} className="text-purple-500" /> Diplomacia
            </h2>
            
            <div className="space-y-3">
              {(Object.values(gameState.realms) as Realm[]).filter(r => r && r.id !== playerRealm.id).map(realm => {
                const relations = playerRealm.relations?.[realm.id] || 0;
                const isAlly = playerRealm.alliances?.includes(realm.id);
                const hasPact = playerRealm.pacts?.includes(realm.id);
                const isVassal = realm.vassalOf === playerRealm.id;
                const isOurSuzerain = playerRealm.vassalOf === realm.id;
                
                const personalityNames: Record<string, string> = {
                  expansionist: 'Expansionista',
                  defensive: 'Defensivo',
                  diplomatic: 'Diplomático',
                  opportunistic: 'Oportunista',
                  commercial: 'Comercial'
                };

                const objectiveNames: Record<string, string> = {
                  regional_dominance: 'Domínio Regional',
                  destroy_rival: 'Destruir Rival',
                  wealth: 'Acumular Riqueza',
                  resource_control: 'Controle de Recursos',
                  defensive_block: 'Bloco Defensivo'
                };

                return (
                  <div key={realm.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold" style={{ color: realm.color }}>{realm.name}</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {isAlly && <span className="text-xs bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded uppercase font-bold">Aliado</span>}
                        {hasPact && <span className="text-xs bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded uppercase font-bold">Pacto</span>}
                        {isVassal && <span className="text-xs bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded uppercase font-bold">Vassalo</span>}
                        {isOurSuzerain && <span className="text-xs bg-red-900 text-red-200 px-1.5 py-0.5 rounded uppercase font-bold">Suserano</span>}
                        {realm.isCoalitionMember && <span className="text-xs bg-orange-900 text-orange-200 px-1.5 py-0.5 rounded uppercase font-bold">Coalizão</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-xs text-slate-400">
                        Perfil: <span className="text-slate-200">{personalityNames[realm.personality]}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Objetivo: <span className="text-slate-200">{objectiveNames[realm.objective]}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Relações</span>
                        <span className={relations > 0 ? 'text-green-400' : relations < 0 ? 'text-red-400' : 'text-slate-400'}>
                          {relations}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${relations > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ 
                            width: `${Math.abs(relations)}%`,
                            marginLeft: relations >= 0 ? '50%' : `${50 - Math.abs(relations)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedProv ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-100">
                {selectedProv.name}
              </h2>
              {selectedProv.strategicResource && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-xs font-bold uppercase text-slate-300">
                  {getResourceIcon(selectedProv.strategicResource)}
                  {getResourceName(selectedProv.strategicResource)}
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Dono</span>
                <span className="font-bold flex items-center gap-2" style={{ color: gameState.realms[selectedProv.ownerId]?.color || '#ffffff' }}>
                  {gameState.realms[selectedProv.ownerId]?.name || 'Desconhecido'}
                  {gameState.realms[selectedProv.ownerId]?.capitalId === selectedProv.id && (
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-bold uppercase px-1.5 py-0.5 bg-amber-950/20 rounded">
                       <Crown size={14} /> Sede
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Home size={14} /> Lealdade</span>
                <span className={`font-bold ${selectedProv.loyalty > 70 ? 'text-green-400' : selectedProv.loyalty > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {selectedProv.loyalty}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Users size={14} /> População</span>
                <span className="font-bold">{Math.floor(selectedProv.population)} / {selectedProv.maxPopulation}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Composição do Exército</span>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  <div className="bg-slate-800 p-3 rounded text-center border border-slate-700/50">
                    <span className="text-xs block text-slate-400 mb-1">Inf.</span>
                    <span className="font-bold text-base">{selectedProv.army?.infantry ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded text-center border border-slate-700/50">
                    <span className="text-xs block text-slate-400 mb-1">Arq.</span>
                    <span className="font-bold text-base">{selectedProv.army?.archers ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded text-center border border-slate-700/50">
                    <span className="text-xs block text-slate-400 mb-1">Cav.</span>
                    <span className="font-bold text-base">{selectedProv.army?.cavalry ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-3 rounded text-center ring-1 ring-blue-500/30 border border-blue-500/20">
                    <span className="text-xs block text-blue-400 flex items-center justify-center gap-0.5 mb-1"><Eye size={12} /> Bat.</span>
                    <span className="font-bold text-base text-blue-300">{selectedProv.army?.scouts ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1 text-xs"><Coins size={12} /> Ouro</span>
                  <span className="font-bold text-yellow-400 text-xs">+{Math.floor(((selectedProv.wealth || 0) + ((selectedProv.buildings?.mines || 0) * BUILDING_PRODUCTION.mines)) * ((selectedProv.population || 0) / (selectedProv.maxPopulation || 1)))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1 text-xs"><Wheat size={12} /> Comida</span>
                  <span className="font-bold text-green-400 text-xs">+{Math.floor(((selectedProv.foodProduction || 0) + ((selectedProv.buildings?.farms || 0) * BUILDING_PRODUCTION.farms)) * ((selectedProv.population || 0) / (selectedProv.maxPopulation || 1)))}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Construções</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Tractor size={20} className="mx-auto text-green-500 mb-1" />
                    <span className="text-xs block">Fazendas</span>
                    <span className="font-bold text-base">{selectedProv.buildings?.farms ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Pickaxe size={20} className="mx-auto text-yellow-500 mb-1" />
                    <span className="text-xs block">Minas</span>
                    <span className="font-bold text-base">{selectedProv.buildings?.mines ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Factory size={20} className="mx-auto text-slate-400 mb-1" />
                    <span className="text-xs block">Oficinas</span>
                    <span className="font-bold text-base">{selectedProv.buildings?.workshops ?? 0}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center col-span-3 mt-1">
                    <Home size={18} className="mx-auto text-blue-400 mb-1 inline" />
                    <span className="text-xs ml-2">Tribunais: {selectedProv.buildings?.courts ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1"><Shield size={14} /> Defesa</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Shield 
                      key={i} 
                      size={12} 
                      className={i < selectedProv.defense ? "text-blue-500 fill-blue-500" : "text-slate-700"} 
                    />
                  ))}
                </div>
              </div>

              {selectedProv.ownerId === playerRealm.id && (
                 <div className="flex justify-between items-center">
                   <span className="text-slate-400 text-xs">Distância da Capital</span>
                   <span className="text-slate-200 font-bold text-xs">
                     {selectedProv.id === playerRealm.capitalId ? 'Sede' : `${(Object.values(gameState.provinces) as Province[]).filter(p => p.ownerId === playerRealm.id).length > 0 ? 'Conectada' : 'Isolada'}`}
                   </span>
                 </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1 text-xs capitalize">
                  {selectedProv.terrain === 'plains' && <MapIcon size={12} />}
                  {selectedProv.terrain === 'forest' && <TreePine size={12} />}
                  {selectedProv.terrain === 'mountain' && <Mountain size={12} />}
                  Terreno: {selectedProv.terrain === 'plains' ? 'Planícies' : selectedProv.terrain === 'forest' ? 'Floresta' : 'Montanha'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {actionState !== 'idle' ? (
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-500/50">
                  <p className="text-sm text-amber-400 mb-2 font-medium">
                    {actionState === 'moving' ? 'Selecione a província alvo para mover...' : 
                     actionState === 'attacking' ? 'Selecione a província inimiga alvo para atacar...' : 
                     'Selecione a província adjacente para negociar...'}
                  </p>
                  <button 
                    onClick={onCancelAction}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {selectedProv.ownerId === playerRealm.id ? (
                    <div className="space-y-2">
                      {isRecruiting ? (
                        <div className="bg-slate-800 p-3 rounded-lg border border-blue-500/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-400">Recrutar Unidades</span>
                            <button onClick={() => setIsRecruiting(false)} className="text-slate-500 hover:text-white">
                              <X size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            {(['infantry', 'archers', 'cavalry', 'scouts'] as UnitType[]).map(type => (
                              <button
                                key={type}
                                onClick={() => setSelectedUnitType(type)}
                                title={type === 'scouts' ? 'Batedores: Revelam o mapa e removem fog' : ''}
                                className={`py-2 text-xs font-bold uppercase rounded border transition-all ${
                                  selectedUnitType === type 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {type === 'infantry' ? 'Inf.' : type === 'archers' ? 'Arq.' : type === 'cavalry' ? 'Cav.' : 'Bat.'}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-slate-400">Quantidade</span>
                                <input 
                                  type="number"
                                  min="1"
                                  value={recruitAmount}
                                  onChange={(e) => setRecruitAmount(parseInt(e.target.value) || 0)}
                                  className="w-24 bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="text-right text-xs space-y-1">
                                <div className="text-yellow-400 font-bold">{(UNIT_STATS[selectedUnitType]?.cost?.gold || 0) * recruitAmount} Ouro</div>
                                <div className="text-green-400 font-bold">{(UNIT_STATS[selectedUnitType]?.cost?.food || 0) * recruitAmount} Comida</div>
                                <div className="text-slate-300 font-bold">{(UNIT_STATS[selectedUnitType]?.cost?.materials || 0) * recruitAmount} Materiais</div>
                                <div className="text-blue-400 font-bold">{(UNIT_STATS[selectedUnitType]?.cost?.pop || 0) * recruitAmount} Pop</div>
                              </div>
                            </div>
                            
                            {(() => {
                              const stats = UNIT_STATS[selectedUnitType] as any;
                              if (!stats.requires) return null;
                              const hasResource = (Object.values(gameState.provinces) as Province[]).some(p => p.ownerId === playerRealm.id && p.strategicResource === stats.requires);
                              return (
                                <div className={`text-[10px] p-1.5 rounded border ${hasResource ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                                  Requer recurso: <span className="font-bold uppercase">{stats.requires}</span>
                                  {!hasResource && " (Não disponível no seu reino)"}
                                  {hasResource && selectedProv.strategicResource !== stats.requires && " (Disponível no reino)"}
                                </div>
                              );
                            })()}
                          </div>

                          <button 
                            onClick={handleRecruitConfirm}
                            disabled={(() => {
                              const stats = UNIT_STATS[selectedUnitType] as any;
                              if (!stats.requires) return false;
                              return !(Object.values(gameState.provinces) as Province[]).some(p => p.ownerId === playerRealm.id && p.strategicResource === stats.requires);
                            })()}
                            className={`w-full py-2 rounded text-xs font-bold transition-colors ${
                              (() => {
                                const stats = UNIT_STATS[selectedUnitType] as any;
                                if (!stats.requires) return false;
                                return !(Object.values(gameState.provinces) as Province[]).some(p => p.ownerId === playerRealm.id && p.strategicResource === stats.requires);
                              })()
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            Recrutar (Custo: {ACTION_COSTS.recruit} AP)
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsRecruiting(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium transition-colors text-sm"
                        >
                          <PlusCircle size={16} /> Recrutar Unidades
                        </button>
                      )}
                      
                      <div className="pt-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Construção ({ACTION_COSTS.build} AP)</span>
                        <div className="grid grid-cols-1 gap-1.5 mt-2">
                           <button onClick={() => onAction('build_farms')} className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700">
                             <span className="flex items-center gap-2"><Wheat size={14} className="text-green-500" /> Fazenda</span>
                             <span className="text-xs text-slate-400">{BUILDING_STATS.farms.gold}O, {BUILDING_STATS.farms.materials}M</span>
                           </button>
                           <button onClick={() => onAction('build_mines')} className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700">
                             <span className="flex items-center gap-2"><Pickaxe size={14} className="text-yellow-500" /> Mina</span>
                             <span className="text-xs text-slate-400">{BUILDING_STATS.mines.gold}O, {BUILDING_STATS.mines.materials}M</span>
                           </button>
                           <button onClick={() => onAction('build_workshops')} className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700">
                             <span className="flex items-center gap-2"><Factory size={14} className="text-slate-400" /> Oficina</span>
                             <span className="text-xs text-slate-400">{BUILDING_STATS.workshops.gold}O, {BUILDING_STATS.workshops.materials}M</span>
                           </button>
                           <button onClick={() => onAction('build_courts')} className="flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700">
                             <span className="flex items-center gap-2"><Home size={14} className="text-blue-400" /> Tribunal</span>
                             <span className="text-xs text-slate-400">{BUILDING_STATS.courts.gold}O, {BUILDING_STATS.courts.materials}M</span>
                           </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Movimentação ({ACTION_COSTS.move} AP)</span>
                        
                        {/* Troop Composition Selector */}
                        <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-2">
                          <span className="text-[10px] text-slate-400">Selecionar tropas para mover:</span>
                          <div className="grid grid-cols-4 gap-1 text-[10px]">
                            {(['infantry','archers','cavalry','scouts'] as const).map(type => {
                              const max = selectedProv.army[type] || 0;
                              const val = moveComposition[type] || 0;
                              const label = type === 'infantry' ? 'Inf' : type === 'archers' ? 'Arq' : type === 'cavalry' ? 'Cav' : 'Bat';
                              if (max === 0) return null;
                              return (
                                <div key={type} className="flex flex-col gap-0.5">
                                  <span className="text-slate-400 text-center">{label} (/{max})</span>
                                  <input
                                    type="number" min={0} max={max}
                                    value={val}
                                    onChange={e => {
                                      const v = Math.min(max, Math.max(0, parseInt(e.target.value) || 0));
                                      onMoveCompositionChange({ ...moveComposition, [type]: v });
                                    }}
                                    className="w-full bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-center text-white focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => onMoveCompositionChange({
                              infantry: selectedProv.army.infantry,
                              archers: selectedProv.army.archers,
                              cavalry: selectedProv.army.cavalry,
                              scouts: 0,
                            })}
                            className="w-full py-0.5 text-[10px] bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                          >
                            Selecionar todas (ex. batedores)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <button
                            onClick={() => onAction('move')}
                            className="flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors text-xs"
                          >
                            <ArrowRight size={13} /> Mover
                          </button>
                          <button
                            onClick={onRoute}
                            className="flex items-center justify-center gap-1 py-2 bg-indigo-700 hover:bg-indigo-600 rounded font-medium transition-colors text-xs"
                          >
                            <Route size={13} /> Rota
                          </button>
                        </div>
                        {/* Scout dispatch button if province has scouts */}
                        {(selectedProv.army.scouts || 0) > 0 && (
                          <button
                            onClick={onDispatchScouts}
                            className="w-full mt-1 flex items-center justify-center gap-1 py-2 bg-emerald-800 hover:bg-emerald-700 rounded font-medium transition-colors text-xs"
                          >
                            <Eye size={13} /> Despachar Batedores (qualquer território)
                          </button>
                        )}
                        <div className="grid grid-cols-1 mt-3">
                          <button onClick={() => onAction('attack')} className="flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-600 rounded font-medium transition-colors text-sm">
                            <Swords size={18} /> Atacar ({ACTION_COSTS.attack} AP)
                          </button>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <>
                      {playerRealm.wars.includes(selectedProv.ownerId) ? (
                        <>
                          <div className="p-2 mb-2 bg-red-900/40 border border-red-500/50 rounded-lg text-center">
                            <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Em Guerra</span>
                          </div>
                          <button 
                            onClick={() => onAction('offer_peace')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 rounded font-medium transition-colors text-sm mb-2"
                          >
                            <Handshake size={16} /> Oferecer Paz ({ACTION_COSTS.diplomacy} AP)
                          </button>
                          <p className="text-xs text-slate-400 text-center px-2 mt-2">
                            Ataques devem ser iniciados a partir de uma província sua. Selecione sua província primeiro.
                          </p>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => onAction('declare_war')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors text-sm mb-2 text-white"
                          >
                            <Swords size={16} /> Declarar Guerra ({ACTION_COSTS.diplomacy} AP)
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <button 
                              onClick={() => onAction('send_gift')}
                              className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 rounded font-medium transition-colors text-sm"
                            >
                              <Handshake size={16} /> Presente
                            </button>
                            <button 
                              onClick={playerRealm.pacts.includes(selectedProv.ownerId) ? () => onAction('break_pact') : () => onAction('propose_pact')}
                              className={`flex items-center justify-center gap-2 py-3 rounded font-medium transition-colors text-sm ${playerRealm.pacts.includes(selectedProv.ownerId) ? 'bg-orange-700 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                            >
                              <Shield size={16} /> {playerRealm.pacts.includes(selectedProv.ownerId) ? 'Quebrar Pacto' : 'Pacto'}
                            </button>
                            <button 
                              onClick={() => onAction('propose_alliance')}
                              className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded font-medium transition-colors text-sm"
                            >
                              <Zap size={16} /> Aliança
                            </button>
                            <button 
                              onClick={() => onAction('trade_route')}
                              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded font-medium transition-colors text-sm"
                            >
                              <TrendingUp size={16} /> Rota Com.
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button 
                              onClick={() => onAction('demand_tribute')}
                              className="flex items-center justify-center gap-2 py-3 bg-amber-700 hover:bg-amber-600 rounded font-medium transition-colors text-sm"
                            >
                              <Coins size={16} /> Tributo
                            </button>
                            <button 
                              onClick={() => onAction('demand_vassalage')}
                              className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors text-sm"
                            >
                              <Gem size={16} /> Vassalagem
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
            <MapIcon size={48} className="mb-4 opacity-50" />
            <p>Selecione uma província no mapa para ver detalhes e realizar ações.</p>
          </div>
        )}
      </div>
    </div>
    {/* Active March Orders Panel */}
      {marchOrders.length > 0 && (
        <div className="px-4 pb-3 border-t border-slate-700/30 pt-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
             <Navigation size={14} /> Ordens de Marcha Ativas
          </p>
          <div className="space-y-1.5">
            {marchOrders.map(order => {
              const dest = order.remainingPath[order.remainingPath.length - 1];
              const destName = dest ? gameState.provinces[dest]?.name : 'N/A';
              const turnsRem = order.remainingPath.length;
              const totalTroops = order.troops.infantry + order.troops.archers + order.troops.cavalry + order.troops.scouts;
              return (
                <div key={order.id} className="flex items-center justify-between bg-slate-800/80 border border-slate-700/50 rounded-lg p-2.5 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 font-bold">
                       {order.isScoutMission ? <Eye size={12} className="text-emerald-400" /> : <Swords size={12} className="text-indigo-400" />}
                       <span className={order.isScoutMission ? 'text-emerald-400' : 'text-slate-100'}>{totalTroops} {order.isScoutMission ? 'Batedores' : 'Soldados'}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] uppercase font-black">Destino: {destName} ({turnsRem}T restantes)</span>
                  </div>
                  <button
                    onClick={() => onCancelMarchOrder(order.id)}
                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-full transition-colors"
                    title="Cancelar ordem"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-2 sm:p-4 border-t border-slate-700 bg-slate-800/50 flex gap-2">
        <button 
          onClick={onMenu}
          className="p-2 sm:p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
          title="Menu Principal"
        >
          <Home size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
        <button 
          onClick={onSave}
          className="flex-1 py-2 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-base font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
        >
          <Save size={14} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Salvar</span><span className="sm:hidden">S.</span>
        </button>
        <button 
          onClick={onEndTurn}
          className="flex-[2] py-2 sm:py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-base font-bold rounded-lg shadow-lg transition-all active:scale-95"
        >
          Finalizar Turno
        </button>
      </div>
    </div>
    </>
  );
};
