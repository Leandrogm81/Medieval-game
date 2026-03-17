import React, { useState } from 'react';
import { GameState, Province, Realm, ActionType, UnitType, ViewMode } from '../types';
import { Coins, Shield, Swords, Users, Mountain, TreePine, Map as MapIcon, ArrowRight, PlusCircle, Handshake, X, Wheat, Hammer, Pickaxe, Factory, Tractor, ShoppingCart, TrendingUp, AlertTriangle, Info, Zap, Activity, Gem, Eye, BarChart3, Globe2, Crosshair, Save, Home, Crown } from 'lucide-react';
import { UNIT_STATS, ACTION_COSTS } from '../gameLogic';

interface HUDProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  actionState: ActionType;
  actionSourceId: string | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAction: (action: 'recruit' | 'move' | 'attack' | 'improve' | 'diplomacy' | 'fortify' | 'build_farm' | 'build_mine' | 'build_workshop' | 'build_courts' | 'buy_food' | 'sell_food' | 'buy_materials' | 'sell_materials' | 'trade_route' | 'send_gift' | 'propose_pact' | 'propose_alliance' | 'demand_tribute' | 'demand_vassalage' | 'declare_war' | 'offer_peace' | 'break_pact', unitType?: UnitType, amount?: number) => void;
  onEndTurn: () => void;
  onSave: () => void;
  onMenu: () => void;
  onCancelAction: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  selectedProvinceId,
  actionState,
  actionSourceId,
  viewMode,
  onViewModeChange,
  onAction,
  onEndTurn,
  onSave,
  onMenu,
  onCancelAction
}) => {
  const [recruitAmount, setRecruitAmount] = useState(10);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('infantry');
  const [activeTab, setActiveTab] = useState<'province' | 'market' | 'diplomacy'>('province');

  const playerRealm = gameState.realms[gameState.playerRealmId];
  const selectedProv = selectedProvinceId ? gameState.provinces[selectedProvinceId] : null;
  
  const playerProvinces = (Object.values(gameState.provinces) as Province[]).filter(p => p.ownerId === playerRealm.id);
  
  const totalTroops = playerProvinces.reduce((sum, p) => sum + p.troops, 0);
    
  const baseGoldIncome = playerProvinces.reduce((sum, p) => {
    const efficiency = p.population / p.maxPopulation;
    return sum + (p.wealth + (p.buildings.mines * 5)) * efficiency;
  }, 0);
    
  const baseFoodIncome = playerProvinces.reduce((sum, p) => {
    const efficiency = p.population / p.maxPopulation;
    return sum + (p.foodProduction + (p.buildings.farms * 10)) * efficiency;
  }, 0);

  const oePenalty = playerRealm.overextension > 20 ? (playerRealm.overextension - 20) / 100 : 0;
  const goldIncome = Math.floor(baseGoldIncome * (1 - oePenalty));
  const foodIncome = Math.floor(baseFoodIncome * (1 - oePenalty));

  const goldMaintenance = Math.floor(totalTroops / 15);
  const foodMaintenance = Math.floor(totalTroops / 8);
  
  const netGold = goldIncome - goldMaintenance;
  const netFood = foodIncome - foodMaintenance;

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
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-80 shadow-2xl border-l border-slate-700">
      {/* Event Banner */}
      {gameState.currentEvent && (
        <div className={`p-4 border-b ${
          gameState.currentEvent.type === 'positive' ? 'bg-green-900/30 border-green-500/50' : 
          gameState.currentEvent.type === 'negative' ? 'bg-red-900/30 border-red-500/50' : 
          'bg-slate-800 border-slate-600'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {gameState.currentEvent.type === 'positive' ? <TrendingUp size={16} className="text-green-400" /> : 
             gameState.currentEvent.type === 'negative' ? <AlertTriangle size={16} className="text-red-400" /> : 
             <Info size={16} className="text-slate-400" />}
            <span className={`text-xs font-bold uppercase tracking-widest ${
              gameState.currentEvent.type === 'positive' ? 'text-green-400' : 
              gameState.currentEvent.type === 'negative' ? 'text-red-400' : 
              'text-slate-400'
            }`}>
              {gameState.currentEvent.name}
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {gameState.currentEvent.description}
          </p>
        </div>
      )}

      {/* Top Bar Info */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-serif font-bold text-amber-500 medieval-title drop-shadow-md">{playerRealm.name}</h1>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
              <Zap size={14} /> {playerRealm.actionPoints}/{playerRealm.maxActionPoints} AP
            </div>
            {playerRealm.overextension > 0 && (
              <div className={`text-[10px] font-bold uppercase ${playerRealm.overextension > 50 ? 'text-red-500' : 'text-amber-500'}`}>
                OE: {playerRealm.overextension}%
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-base medieval-text">
          <div className="flex items-center gap-2">
            <Coins size={20} className="text-yellow-400" />
            <span title="Ouro" className="font-bold">{playerRealm.gold} <span className={`text-sm ${netGold >= 0 ? 'text-green-400' : 'text-red-400'}`}>({netGold >= 0 ? '+' : ''}{netGold})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Wheat size={20} className="text-green-400" />
            <span title="Comida" className="font-bold">{playerRealm.food} <span className={`text-sm ${netFood >= 0 ? 'text-green-400' : 'text-red-400'}`}>({netFood >= 0 ? '+' : ''}{netFood})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Hammer size={20} className="text-slate-400" />
            <span title="Materiais" className="font-bold">{playerRealm.materials}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-400" />
            <span title="Total de Tropas" className="font-bold">{totalTroops}</span>
          </div>
        </div>

        {/* View Mode Overlays */}
        <div className="grid grid-cols-5 gap-1 mt-4">
          <button 
            onClick={() => onViewModeChange('political')}
            className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all ${viewMode === 'political' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            title="Visão Política"
          >
            <Globe2 size={18} />
            <span className="text-[10px] font-bold uppercase">Pol</span>
          </button>
          <button 
            onClick={() => onViewModeChange('economic')}
            className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all ${viewMode === 'economic' ? 'bg-green-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            title="Visão Econômica"
          >
            <BarChart3 size={18} />
            <span className="text-[10px] font-bold uppercase">Eco</span>
          </button>
          <button 
            onClick={() => onViewModeChange('military')}
            className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all ${viewMode === 'military' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            title="Visão Militar"
          >
            <Crosshair size={18} />
            <span className="text-[10px] font-bold uppercase">Mil</span>
          </button>
          <button 
            onClick={() => onViewModeChange('diplomatic')}
            className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all ${viewMode === 'diplomatic' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            title="Visão Diplomática"
          >
            <Handshake size={18} />
            <span className="text-[10px] font-bold uppercase">Dip</span>
          </button>
          <button 
            onClick={() => onViewModeChange('resources')}
            className={`p-1.5 rounded flex flex-col items-center gap-1 transition-all ${viewMode === 'resources' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
            title="Visão de Recursos"
          >
            <Gem size={18} />
            <span className="text-[10px] font-bold uppercase">Rec</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button 
            id="tab-province"
            onClick={() => setActiveTab('province')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold transition-all ${activeTab === 'province' ? 'bg-amber-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MapIcon size={16} /> Província
          </button>
          <button 
            id="tab-market"
            onClick={() => setActiveTab('market')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-amber-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShoppingCart size={16} /> Mercado
          </button>
          <button 
            id="tab-diplomacy"
            onClick={() => setActiveTab('diplomacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold transition-all ${activeTab === 'diplomacy' ? 'bg-amber-600 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Handshake size={16} /> Diplomacia
          </button>
        </div>
      </div>

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
                  <span className="text-xs text-slate-500">Estoque: {playerRealm.food}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Comprar 50 (20O)
                  </button>
                  <button 
                    onClick={() => onAction('sell_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Vender 50 (10O)
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="flex items-center gap-2 font-bold text-slate-300"><Hammer size={18} /> Materiais</span>
                  <span className="text-xs text-slate-500">Estoque: {playerRealm.materials}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Comprar 25 (30O)
                  </button>
                  <button 
                    onClick={() => onAction('sell_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Vender 25 (15O)
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
              {(Object.values(gameState.realms) as Realm[]).filter(r => r.id !== playerRealm.id).map(realm => {
                const relations = playerRealm.relations[realm.id] || 0;
                const isAlly = playerRealm.alliances.includes(realm.id);
                const hasPact = playerRealm.pacts.includes(realm.id);
                const isVassal = realm.vassalOf === playerRealm.id;
                const isOurSuzerain = playerRealm.vassalOf === realm.id;
                
                const personalityNames = {
                  expansionist: 'Expansionista',
                  defensive: 'Defensivo',
                  diplomatic: 'Diplomático',
                  opportunistic: 'Oportunista',
                  commercial: 'Comercial'
                };

                const objectiveNames = {
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
              <h2 className="text-xl font-serif font-bold text-slate-100">
                {selectedProv.name}
              </h2>
              {selectedProv.strategicResource && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] font-bold uppercase text-slate-300">
                  {getResourceIcon(selectedProv.strategicResource)}
                  {getResourceName(selectedProv.strategicResource)}
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Dono</span>
                <span className="font-bold flex items-center gap-2" style={{ color: gameState.realms[selectedProv.ownerId].color }}>
                  {gameState.realms[selectedProv.ownerId].name}
                  {gameState.realms[selectedProv.ownerId].capitalId === selectedProv.id && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase">
                       <Crown size={12} /> Sede
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
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <span className="text-xs block text-slate-400">Infantaria</span>
                    <span className="font-bold text-base">{selectedProv.army.infantry}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <span className="text-xs block text-slate-400">Arqueiros</span>
                    <span className="font-bold text-base">{selectedProv.army.archers}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <span className="text-xs block text-slate-400">Cavalaria</span>
                    <span className="font-bold text-base">{selectedProv.army.cavalry}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1 text-xs"><Coins size={12} /> Ouro</span>
                  <span className="font-bold text-yellow-400 text-xs">+{Math.floor((selectedProv.wealth + (selectedProv.buildings.mines * 5)) * (selectedProv.population / selectedProv.maxPopulation))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1 text-xs"><Wheat size={12} /> Comida</span>
                  <span className="font-bold text-green-400 text-xs">+{Math.floor((selectedProv.foodProduction + (selectedProv.buildings.farms * 10)) * (selectedProv.population / selectedProv.maxPopulation))}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Construções</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Tractor size={20} className="mx-auto text-green-500 mb-1" />
                    <span className="text-xs block">Fazendas</span>
                    <span className="font-bold text-base">{selectedProv.buildings.farms}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Pickaxe size={20} className="mx-auto text-yellow-500 mb-1" />
                    <span className="text-xs block">Minas</span>
                    <span className="font-bold text-base">{selectedProv.buildings.mines}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Factory size={20} className="mx-auto text-slate-400 mb-1" />
                    <span className="text-xs block">Oficinas</span>
                    <span className="font-bold text-base">{selectedProv.buildings.workshops}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center col-span-3 mt-1">
                    <Home size={18} className="mx-auto text-blue-400 mb-1 inline" />
                    <span className="text-xs ml-2">Tribunais: {selectedProv.buildings.courts || 0}</span>
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
                          
                          <div className="grid grid-cols-3 gap-1">
                            {(['infantry', 'archers', 'cavalry'] as UnitType[]).map(type => (
                              <button
                                key={type}
                                onClick={() => setSelectedUnitType(type)}
                                className={`py-1 text-[10px] font-bold uppercase rounded border transition-all ${
                                  selectedUnitType === type 
                                    ? 'bg-blue-600 border-blue-400 text-white' 
                                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {type === 'infantry' ? 'Infantaria' : type === 'archers' ? 'Arqueiros' : 'Cavalaria'}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400">Quantidade</span>
                                <input 
                                  type="number"
                                  min="1"
                                  value={recruitAmount}
                                  onChange={(e) => setRecruitAmount(parseInt(e.target.value) || 0)}
                                  className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="text-right text-[10px] space-y-0.5">
                                <div className="text-yellow-400 font-bold">{UNIT_STATS[selectedUnitType].cost.gold * recruitAmount} Ouro</div>
                                <div className="text-green-400 font-bold">{UNIT_STATS[selectedUnitType].cost.food * recruitAmount} Comida</div>
                                <div className="text-slate-300 font-bold">{UNIT_STATS[selectedUnitType].cost.materials * recruitAmount} Materiais</div>
                                <div className="text-blue-400 font-bold">{UNIT_STATS[selectedUnitType].cost.pop * recruitAmount} Pop</div>
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
                      
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Construção ({ACTION_COSTS.build} AP)</span>
                        <div className="grid grid-cols-1 gap-1 mt-1">
                          <button onClick={() => onAction('build_farm')} className="flex items-center justify-between px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors border border-slate-700">
                            <span className="flex items-center gap-2"><Tractor size={12} className="text-green-500" /> Fazenda</span>
                            <span className="text-[10px] text-slate-400">100O, 50M</span>
                          </button>
                          <button onClick={() => onAction('build_mine')} className="flex items-center justify-between px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors border border-slate-700">
                            <span className="flex items-center gap-2"><Pickaxe size={12} className="text-yellow-500" /> Mina</span>
                            <span className="text-[10px] text-slate-400">150O, 75M</span>
                          </button>
                          <button onClick={() => onAction('build_workshop')} className="flex items-center justify-between px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors border border-slate-700">
                            <span className="flex items-center gap-2"><Factory size={12} className="text-slate-400" /> Oficina</span>
                            <span className="text-[10px] text-slate-400">120O, 60M</span>
                          </button>
                          <button onClick={() => onAction('build_courts')} className="flex items-center justify-between px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors border border-slate-700">
                            <span className="flex items-center gap-2"><Home size={12} className="text-blue-400" /> Tribunal</span>
                            <span className="text-[10px] text-slate-400">200O, 100M</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => onAction('move')} className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors text-xs">
                            <ArrowRight size={14} /> Mover ({ACTION_COSTS.move} AP)
                          </button>
                          <button onClick={() => onAction('attack')} className="flex items-center justify-center gap-2 py-2 bg-red-700 hover:bg-red-600 rounded font-medium transition-colors text-xs">
                            <Swords size={14} /> Atacar ({ACTION_COSTS.attack} AP)
                          </button>
                        </div>
                        <div className="grid grid-cols-1 mt-2">
                          <button onClick={() => onAction('fortify')} className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors text-xs">
                            <Shield size={14} /> Fortificar ({ACTION_COSTS.build} AP)
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
                          
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button 
                              onClick={() => onAction('send_gift')}
                              className="flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 rounded font-medium transition-colors text-xs"
                            >
                              <Handshake size={14} /> Presente
                            </button>
                            <button 
                              onClick={playerRealm.pacts.includes(selectedProv.ownerId) ? () => onAction('break_pact') : () => onAction('propose_pact')}
                              className={`flex items-center justify-center gap-2 py-2 rounded font-medium transition-colors text-xs ${playerRealm.pacts.includes(selectedProv.ownerId) ? 'bg-orange-700 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                            >
                              <Shield size={14} /> {playerRealm.pacts.includes(selectedProv.ownerId) ? 'Quebrar Pacto' : 'Pacto'}
                            </button>
                            <button 
                              onClick={() => onAction('propose_alliance')}
                              className="flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 rounded font-medium transition-colors text-xs"
                            >
                              <Zap size={14} /> Aliança
                            </button>
                            <button 
                              onClick={() => onAction('trade_route')}
                              className="flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-medium transition-colors text-xs"
                            >
                              <TrendingUp size={14} /> Rota Com.
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button 
                              onClick={() => onAction('demand_tribute')}
                              className="flex items-center justify-center gap-2 py-2 bg-amber-700 hover:bg-amber-600 rounded font-medium transition-colors text-xs"
                            >
                              <Coins size={14} /> Tributo
                            </button>
                            <button 
                              onClick={() => onAction('demand_vassalage')}
                              className="flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors text-xs"
                            >
                              <Gem size={14} /> Vassalagem
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

      {/* End Turn Button */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 flex gap-2">
        <button 
          onClick={onMenu}
          className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center"
          title="Menu Principal"
        >
          <Home size={18} />
        </button>
        <button 
          onClick={onSave}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salvar
        </button>
        <button 
          onClick={onEndTurn}
          className="flex-[2] py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
        >
          Finalizar Turno
        </button>
      </div>
    </div>
  );
};
