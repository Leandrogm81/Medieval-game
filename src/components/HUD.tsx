import React, { useState } from 'react';
import { GameState, Province, Realm, ActionType } from '../types';
import { Coins, Shield, Swords, Users, Mountain, TreePine, Map as MapIcon, ArrowRight, PlusCircle, Handshake, X, Wheat, Hammer, Pickaxe, Factory, Tractor, ShoppingCart, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface HUDProps {
  gameState: GameState;
  selectedProvinceId: string | null;
  actionState: ActionType;
  actionSourceId: string | null;
  onAction: (action: 'recruit' | 'move' | 'attack' | 'improve' | 'diplomacy' | 'fortify' | 'build_farm' | 'build_mine' | 'build_workshop' | 'buy_food' | 'sell_food' | 'buy_materials' | 'sell_materials' | 'trade_route' | 'send_gift' | 'propose_pact' | 'propose_alliance', amount?: number) => void;
  onEndTurn: () => void;
  onCancelAction: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  selectedProvinceId,
  actionState,
  actionSourceId,
  onAction,
  onEndTurn,
  onCancelAction
}) => {
  const [recruitAmount, setRecruitAmount] = useState(100);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [activeTab, setActiveTab] = useState<'province' | 'market' | 'diplomacy'>('province');

  const playerRealm = gameState.realms[gameState.playerRealmId];
  const selectedProv = selectedProvinceId ? gameState.provinces[selectedProvinceId] : null;
  
  const totalTroops = (Object.values(gameState.provinces) as Province[])
    .filter(p => p.ownerId === playerRealm.id)
    .reduce((sum, p) => sum + p.troops, 0);
    
  const goldIncome = (Object.values(gameState.provinces) as Province[])
    .filter(p => p.ownerId === playerRealm.id)
    .reduce((sum, p) => sum + p.wealth + (p.buildings.mines * 5), 0);
    
  const foodIncome = (Object.values(gameState.provinces) as Province[])
    .filter(p => p.ownerId === playerRealm.id)
    .reduce((sum, p) => sum + p.foodProduction + (p.buildings.farms * 10), 0);

  const goldMaintenance = Math.floor(totalTroops / 20);
  const foodMaintenance = Math.floor(totalTroops / 10);
  
  const netGold = goldIncome - goldMaintenance;
  const netFood = foodIncome - foodMaintenance;

  const maxRecruit = Math.floor(playerRealm.gold / 0.1); // 1 gold = 10 troops -> 0.1 gold = 1 troop

  const handleRecruitConfirm = () => {
    onAction('recruit', recruitAmount);
    setIsRecruiting(false);
    setRecruitAmount(100);
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
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              gameState.currentEvent.type === 'positive' ? 'text-green-400' : 
              gameState.currentEvent.type === 'negative' ? 'text-red-400' : 
              'text-slate-400'
            }`}>
              {gameState.currentEvent.name}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {gameState.currentEvent.description}
          </p>
        </div>
      )}

      {/* Top Bar Info */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h1 className="text-2xl font-serif font-bold text-amber-500 mb-2">{playerRealm.name}</h1>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-yellow-400" />
            <span title="Gold">{playerRealm.gold} <span className={netGold >= 0 ? 'text-green-400' : 'text-red-400'}>({netGold >= 0 ? '+' : ''}{netGold})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Wheat size={16} className="text-green-400" />
            <span title="Food">{playerRealm.food} <span className={netFood >= 0 ? 'text-green-400' : 'text-red-400'}>({netFood >= 0 ? '+' : ''}{netFood})</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Hammer size={16} className="text-slate-400" />
            <span title="Materials">{playerRealm.materials}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <span title="Total Troops">{totalTroops}</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setActiveTab('province')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'province' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MapIcon size={14} /> Province
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'market' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ShoppingCart size={14} /> Market
          </button>
          <button 
            onClick={() => setActiveTab('diplomacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'diplomacy' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Handshake size={14} /> Diplomacy
          </button>
        </div>
      </div>

      {/* Selected Province Info */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'market' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-slate-100 border-b border-slate-700 pb-2 flex items-center gap-2">
              <ShoppingCart size={20} className="text-amber-500" /> Global Market
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="flex items-center gap-2 font-bold text-green-400"><Wheat size={18} /> Food</span>
                  <span className="text-xs text-slate-500">Stock: {playerRealm.food}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Buy 50 (20G)
                  </button>
                  <button 
                    onClick={() => onAction('sell_food')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Sell 50 (10G)
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="flex items-center gap-2 font-bold text-slate-300"><Hammer size={18} /> Materials</span>
                  <span className="text-xs text-slate-500">Stock: {playerRealm.materials}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onAction('buy_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Buy 25 (30G)
                  </button>
                  <button 
                    onClick={() => onAction('sell_materials')}
                    className="py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                  >
                    Sell 25 (15G)
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Active Trade Routes</h3>
              {playerRealm.tradeRoutes.length > 0 ? (
                <div className="space-y-2">
                  {playerRealm.tradeRoutes.map((route, i) => (
                    <div key={i} className="bg-slate-800/50 p-2 rounded text-xs flex justify-between items-center border border-slate-700/50">
                      <span className="text-slate-300">{gameState.provinces[route.from].name}</span>
                      <TrendingUp size={12} className="text-amber-500" />
                      <span className="text-slate-300">{gameState.provinces[route.to].name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">No active trade routes. Establish them via province actions.</p>
              )}
            </div>
          </div>
        ) : activeTab === 'diplomacy' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-slate-100 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Handshake size={20} className="text-purple-500" /> Diplomacy
            </h2>
            
            <div className="space-y-3">
              {(Object.values(gameState.realms) as Realm[]).filter(r => r.id !== playerRealm.id).map(realm => {
                const relations = playerRealm.relations[realm.id] || 0;
                const isAlly = playerRealm.alliances.includes(realm.id);
                const hasPact = playerRealm.pacts.includes(realm.id);
                
                return (
                  <div key={realm.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold" style={{ color: realm.color }}>{realm.name}</span>
                      <div className="flex gap-1">
                        {isAlly && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded uppercase font-bold">Ally</span>}
                        {hasPact && <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded uppercase font-bold">Pact</span>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Relations</span>
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
                            transform: relations >= 0 ? 'none' : 'none'
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
            <h2 className="text-xl font-serif font-bold text-slate-100 border-b border-slate-700 pb-2">
              {selectedProv.name}
            </h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Owner</span>
                <span className="font-bold" style={{ color: gameState.realms[selectedProv.ownerId].color }}>
                  {gameState.realms[selectedProv.ownerId].name}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Users size={14} /> Troops</span>
                <span className="font-bold">{selectedProv.troops}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Coins size={14} /> Gold Prod.</span>
                <span className="font-bold text-yellow-400">+{selectedProv.wealth + (selectedProv.buildings.mines * 5)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Wheat size={14} /> Food Prod.</span>
                <span className="font-bold text-green-400">+{selectedProv.foodProduction + (selectedProv.buildings.farms * 10)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Hammer size={14} /> Mat. Prod.</span>
                <span className="font-bold text-slate-300">+{selectedProv.materialProduction + (selectedProv.buildings.workshops * 5)}</span>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buildings</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Tractor size={16} className="mx-auto text-green-500 mb-1" />
                    <span className="text-xs block">Farms</span>
                    <span className="font-bold">{selectedProv.buildings.farms}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Pickaxe size={16} className="mx-auto text-yellow-500 mb-1" />
                    <span className="text-xs block">Mines</span>
                    <span className="font-bold">{selectedProv.buildings.mines}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded text-center">
                    <Factory size={16} className="mx-auto text-slate-400 mb-1" />
                    <span className="text-xs block">Workshops</span>
                    <span className="font-bold">{selectedProv.buildings.workshops}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1"><Shield size={14} /> Defense</span>
                  <span className="font-bold">+{selectedProv.defense * 10}%</span>
                </div>
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
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  {selectedProv.terrain === 'plains' && <MapIcon size={14} />}
                  {selectedProv.terrain === 'forest' && <TreePine size={14} />}
                  {selectedProv.terrain === 'mountain' && <Mountain size={14} />}
                  Terrain
                </span>
                <span className="font-bold capitalize">{selectedProv.terrain}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {actionState !== 'idle' ? (
                <div className="bg-slate-800 p-3 rounded-lg border border-amber-500/50">
                  <p className="text-sm text-amber-400 mb-2 font-medium">
                    {actionState === 'moving' ? 'Select target province to move to...' : 'Select adjacent province to trade with...'}
                  </p>
                  <button 
                    onClick={onCancelAction}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {selectedProv.ownerId === playerRealm.id ? (
                    <div className="space-y-2">
                      {isRecruiting ? (
                        <div className="bg-slate-800 p-3 rounded-lg border border-blue-500/50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-400">Recruit Troops</span>
                            <button onClick={() => setIsRecruiting(false)} className="text-slate-500 hover:text-white">
                              <X size={16} />
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-400">Amount</span>
                                <input 
                                  type="number"
                                  min="0"
                                  max={maxRecruit}
                                  value={recruitAmount}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setRecruitAmount(Math.min(val, maxRecruit));
                                  }}
                                  className="w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Cost</span>
                                <span className="text-yellow-400 font-bold">{Math.ceil(recruitAmount / 10)} Gold</span>
                              </div>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max={Math.max(10, maxRecruit)} 
                              step="10"
                              value={recruitAmount}
                              onChange={(e) => setRecruitAmount(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>

                          <button 
                            onClick={handleRecruitConfirm}
                            disabled={recruitAmount <= 0 || Math.ceil(recruitAmount / 10) > playerRealm.gold}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded text-sm font-bold transition-colors"
                          >
                            Confirm Recruitment
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsRecruiting(true)}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium transition-colors"
                        >
                          <PlusCircle size={16} /> Recruit Troops
                        </button>
                      )}
                      
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Construction</span>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <button 
                            onClick={() => onAction('build_farm')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2"><Tractor size={14} className="text-green-500" /> Farm</span>
                            <span className="text-xs text-slate-400">100G, 50M</span>
                          </button>
                          <button 
                            onClick={() => onAction('build_mine')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2"><Pickaxe size={14} className="text-yellow-500" /> Mine</span>
                            <span className="text-xs text-slate-400">150G, 75M</span>
                          </button>
                          <button 
                            onClick={() => onAction('build_workshop')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2"><Factory size={14} className="text-slate-400" /> Workshop</span>
                            <span className="text-xs text-slate-400">120G, 60M</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Military & Trade</span>
                        <div className="space-y-2 mt-1">
                          <button 
                            onClick={() => onAction('move')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors"
                          >
                            <ArrowRight size={16} /> Move Troops
                          </button>
                          <button 
                            onClick={() => onAction('trade_route')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-700 hover:bg-amber-600 rounded font-medium transition-colors"
                          >
                            <TrendingUp size={16} /> Establish Trade Route (50G)
                          </button>
                          <button 
                            onClick={() => onAction('fortify')}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 rounded font-medium transition-colors"
                          >
                            <Shield size={16} /> Fortify (75 Gold)
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => onAction('attack')}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors"
                      >
                        <Swords size={16} /> Attack
                      </button>
                      <button 
                        onClick={() => onAction('diplomacy')}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 rounded font-medium transition-colors"
                      >
                        <Handshake size={16} /> Diplomacy
                      </button>

                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center block">Diplomatic Actions</span>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <button 
                            onClick={() => onAction('send_gift')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2 text-yellow-500">Send Gift</span>
                            <span className="text-xs text-slate-400">100G (+25 Rel)</span>
                          </button>
                          <button 
                            onClick={() => onAction('propose_pact')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2 text-blue-400">Propose Pact</span>
                            <span className="text-xs text-slate-400">Req: 20 Rel</span>
                          </button>
                          <button 
                            onClick={() => onAction('propose_alliance')}
                            className="flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700"
                          >
                            <span className="flex items-center gap-2 text-purple-400">Propose Alliance</span>
                            <span className="text-xs text-slate-400">Req: 60 Rel</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
            <MapIcon size={48} className="mb-4 opacity-50" />
            <p>Select a province on the map to view details and take actions.</p>
          </div>
        )}
      </div>

      {/* End Turn Button */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <button 
          onClick={onEndTurn}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
        >
          End Turn
        </button>
      </div>
    </div>
  );
};
