import React, { useMemo, useState } from 'react';
import { GameState, ViewMode, ActionType, UnitType, MarchOrder } from '../types';
import {
  Shield, Swords, Crown, Scroll, Play, Handshake,
  Coins, Carrot, Users,
  Hammer, Map as MapIcon, Eye, Zap, Landmark,
  PlusCircle, HelpCircle, ChevronLeft, ChevronRight,
  Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ACTION_COSTS, BUILDING_PRODUCTION, BUILDING_STATS, REALM_COLORS, UNIT_STATS } from '../logic/game-constants';
import { estimateMassActionCost, getTradeRate, MassActionType, MAX_TRADE_AMOUNT } from '../logic/economyLogic';
import { getSfxEnabled, toggleSfx } from '../logic/sfxLogic';

const RESOURCE_META: Record<string, { label: string; icon: string }> = {
  none: { label: 'Sem recurso', icon: '◌' },
  iron: { label: 'Ferro', icon: '⛏' },
  wood: { label: 'Madeira', icon: '🪓' },
  horse: { label: 'Cavalos', icon: '🐴' },
  stone: { label: 'Pedra', icon: '🪨' }
};

const TRADE_RESOURCES = ['gold', 'food', 'materials'] as const;
type TradeResource = (typeof TRADE_RESOURCES)[number];

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
  onToggleInstructions: () => void;
  actionState: ActionType;
  onCancelAction: () => void;
  onToggleHud: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  isHudOpen: boolean;
  onMapAction?: (type: 'move' | 'attack' | 'scout') => void;
  marchOrders: MarchOrder[];
  onCancelMarchOrder: (id: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  moveComposition: any;
  onMoveCompositionChange: (army: any) => void;
  selectingMoveComposition: boolean;
  recruitComposition: any;
  onRecruitCompositionChange: (army: any) => void;
  onDispatchScouts?: () => void;
  onRoute?: () => void;
  onDiplomacy?: (targetRealmId: string) => void;
  onMassAction: (actionType: MassActionType) => void;
  onToggleFullScreen: () => void;
  // Disband
  isDisbandMode?: boolean;
  onIsDisbandMode?: (v: boolean) => void;
  disbandComposition?: any;
  onDisbandCompositionChange?: (army: any) => void;
  onDisband?: (provinceId: string) => void;
  // Action state for Disband
  onActionState?: (v: ActionType) => void;
  onActionSourceId?: (v: string | null) => void;
  onPreviewPath?: (v: string[]) => void;
  onActionBannerMessage?: (v: string | null) => void;
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
  onToggleInstructions,
  actionState,
  onCancelAction,
  onToggleHud,
  showMinimap,
  onToggleMinimap,
  isHudOpen,
  onMapAction,
  marchOrders,
  onCancelMarchOrder,
  zoom,
  onZoomChange,
  moveComposition,
  onMoveCompositionChange,
  selectingMoveComposition,
  recruitComposition,
  onRecruitCompositionChange,
  onDispatchScouts,
  onRoute,
  onDiplomacy,
  onMassAction,
  onToggleFullScreen,
  // Disband
  isDisbandMode = false,
  onIsDisbandMode,
  disbandComposition,
  onDisbandCompositionChange,
  onDisband,
  // Action state for Disband
  onActionState,
  onActionSourceId,
  onPreviewPath,
  onActionBannerMessage,
}) => {
  const playerRealm = gameState.realms[gameState.playerRealmId];
  if (!playerRealm) return null;
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => getSfxEnabled());
  const playerRealmColorClass = (() => {
    switch (REALM_COLORS.indexOf(playerRealm.color)) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-blue-500';
      case 2: return 'bg-emerald-500';
      case 3: return 'bg-amber-500';
      case 4: return 'bg-violet-500';
      case 5: return 'bg-cyan-500';
      case 6: return 'bg-orange-500';
      case 7: return 'bg-pink-500';
      default: return 'bg-stone-500';
    }
  })();

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

  const foodMaintenance = playerProvinces.reduce((sum, p) => {
    return sum + (p.army.infantry * UNIT_STATS.infantry.maintenance.food) +
      (p.army.archers * UNIT_STATS.archers.maintenance.food) +
      (p.army.cavalry * UNIT_STATS.cavalry.maintenance.food) +
      (p.army.scouts * UNIT_STATS.scouts.maintenance.food);
  }, 0);

  const tradeIncome = playerRealm.tradeRoutes.reduce((sum, route) => {
    const p1 = gameState.provinces[route.fromProvinceId];
    const p2 = gameState.provinces[route.toProvinceId];
    if (!p1 || !p2) return sum;
    return sum + Math.floor((p1.wealth + p2.wealth) * 0.5);
  }, 0);

  const oePenalty = 1 - (playerRealm.overextension / 200);

  const netGold = Math.floor((baseGoldIncome + tradeIncome) * oePenalty - goldMaintenance);
  const netFood = Math.floor(baseFoodIncome * oePenalty - foodMaintenance);
  const netMaterials = Math.floor(baseMaterialsIncome * oePenalty);

  const selectedProvinceArmy = selectedProvince
    ? [
      { key: 'infantry', label: 'Inf', value: selectedProvince.army.infantry },
      { key: 'archers', label: 'Arq', value: selectedProvince.army.archers },
      { key: 'cavalry', label: 'Cav', value: selectedProvince.army.cavalry },
      { key: 'scouts', label: 'Bat', value: selectedProvince.army.scouts }
    ]
    : [];

  const selectedProvinceProduction = selectedProvince
    ? {
      gold: Math.floor((selectedProvince.wealth || 0) + (selectedProvince.buildings?.mines || 0) * BUILDING_PRODUCTION.mines),
      food: Math.floor((selectedProvince.foodProduction || 0) + (selectedProvince.buildings?.farms || 0) * BUILDING_PRODUCTION.farms + (selectedProvince.strategicResource === 'horse' ? 5 : 0)),
      materials: Math.floor((selectedProvince.materialProduction || 0) + (selectedProvince.buildings?.workshops || 0) * BUILDING_PRODUCTION.workshops + ((selectedProvince.strategicResource === 'iron' || selectedProvince.strategicResource === 'wood' || selectedProvince.strategicResource === 'stone') ? 5 : 0))
    }
    : null;

  const provinceLoyaltyState = selectedProvince
    ? selectedProvince.loyalty < 30
      ? 'Rebelde'
      : selectedProvince.loyalty > 70
        ? 'Leal'
        : 'Neutro'
    : 'Neutro';

  const provinceStability = selectedProvince?.stability ?? 70;
  const provinceStabilityState = provinceStability >= 80 ? 'Estável' : provinceStability >= 50 ? 'Resiliente' : provinceStability >= 20 ? 'Instável' : 'Crítica';
  const selectedProvinceGrowthPerTurn = selectedProvince
    ? (() => {
      const loyaltyFactor = 0.5 + (selectedProvince.loyalty / 200);
      const stabilityFactor = provinceStability >= 80 ? 1 : provinceStability >= 50 ? 0.85 : provinceStability >= 20 ? 0.65 : 0.4;
      const efficiency = (0.5 + (selectedProvince.population / selectedProvince.maxPopulation) * 0.5) * loyaltyFactor * stabilityFactor;
      return Math.floor(selectedProvince.population * 0.07 * efficiency);
    })()
    : 0;

  const [tradeFrom, setTradeFrom] = useState<TradeResource>('gold');
  const [tradeTo, setTradeTo] = useState<TradeResource>('food');
  const [tradeAmount, setTradeAmount] = useState(10);
  const [massActionsOpen, setMassActionsOpen] = useState(false);
  const tradeRate = getTradeRate(playerRealm, tradeFrom, tradeTo);
  const tradePreview = Math.floor(tradeAmount * tradeRate);
  const tradeAvailable = playerRealm[tradeFrom];
  const tradeCanConfirm = tradeAmount > 0 && tradeAmount <= MAX_TRADE_AMOUNT && tradeFrom !== tradeTo && tradeAmount <= tradeAvailable && (playerRealm.tradesThisTurn || 0) < 3 && playerRealm.actionPoints >= 1;
  const massActionOptions = [
    { key: 'assimilate', label: 'Assimilar Todas', action: 'assimilate' as MassActionType, costGold: 50, costMaterials: 0 },
    { key: 'invest', label: 'Investir em Todas', description: 'Aplica em todas as províncias do reino.', action: 'invest' as MassActionType, costGold: 100, costMaterials: 0 },
    { key: 'buildFarms', label: 'Construir Farms', action: 'buildFarms' as MassActionType, costGold: 100, costMaterials: 50 },
    { key: 'buildMines', label: 'Construir Mines', action: 'buildMines' as MassActionType, costGold: 150, costMaterials: 75 },
    { key: 'buildWorkshops', label: 'Construir Workshops', action: 'buildWorkshops' as MassActionType, costGold: 200, costMaterials: 100 },
    { key: 'buildCourts', label: 'Construir Courts', action: 'buildCourts' as MassActionType, costGold: 300, costMaterials: 150 }
  ] as const;

  return (
    <div className={`relative z-50 flex flex-col bg-stone-900/95 border-l border-amber-900/30 shadow-2xl transition-all duration-300 ease-out md:h-full max-md:border-l-0 max-md:border-t max-md:shadow-none max-md:rounded-t-2xl ${isHudOpen ? 'w-full md:w-[320px] lg:w-[clamp(280px,25vw,420px)] opacity-100 pointer-events-auto max-md:h-[58vh] max-md:max-h-[58vh] max-md:overflow-y-auto' : 'w-0 md:w-0 opacity-0 pointer-events-none overflow-hidden max-md:h-0'}`}>
      {/* Top Bar - Recurso */}
      <div className="p-1.5 md:p-4 bg-black/40 border-b border-amber-900/20">
        <div className="hidden md:flex justify-between items-center mb-1 md:mb-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${playerRealmColorClass}`}>
              <Crown size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-[11px] md:text-sm font-black text-amber-50 tracking-wide md:tracking-widest uppercase leading-tight">{playerRealm.name}</h2>
              <p className="text-[9px] md:text-[11px] text-amber-500/60 font-serif italic leading-tight">Turno {gameState.turn}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={onSave} title="Salvar [S]" className="px-1.5 py-0.5 md:p-1 md:px-2 border border-stone-700 bg-stone-800 text-[9px] md:text-[10px] font-bold uppercase rounded hover:bg-stone-700 transition-colors">Salvar</button>
            <button onClick={onMenu} className="px-1.5 py-0.5 md:p-1 md:px-2 border border-stone-700 bg-stone-800 text-[9px] md:text-[10px] font-bold uppercase rounded hover:bg-stone-700 transition-colors">Menu</button>
            <button
              onClick={() => {
                const next = toggleSfx();
                setSfxEnabled(next);
              }}
              title="Alternar SFX"
              className="px-1.5 py-0.5 md:p-1 md:px-2 border border-stone-700 bg-stone-800 text-[9px] md:text-[10px] font-bold uppercase rounded hover:bg-stone-700 transition-colors flex items-center gap-1"
            >
              {sfxEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              <span className="hidden md:inline">SFX</span>
            </button>
            <button onClick={onToggleInstructions} className="px-1.5 py-0.5 md:p-1 md:px-2 border border-stone-700 bg-stone-800 text-[9px] md:text-[10px] font-bold uppercase rounded hover:bg-stone-700 transition-colors flex items-center gap-1">
              <HelpCircle size={12} />
              <span className="hidden md:inline">Instruções</span>
            </button>

          </div>
        </div>

        {actionState !== 'idle' && (
          <button
            onClick={onCancelAction}
            title="Cancelar ação [Esc]"
            className="w-full mb-2 py-2 rounded-sm border border-amber-700/40 bg-amber-950/40 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-900/50 transition-colors"
          >
            Cancelar ação
          </button>
        )}

        <div className="grid grid-cols-4 gap-1 md:gap-2">
          {/* Tesouro */}
          <div className="bg-stone-800/50 p-1 md:p-2 border border-white/5 rounded-sm relative group">
            <div className="flex items-center gap-1 mb-0.5">
              <Coins size={12} className="text-amber-500" />
              <span className="text-[10px] md:text-[11px] text-stone-400 font-bold uppercase">Tesouro</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.gold}</p>
            <span className={`text-[10px] font-bold ${netGold >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netGold >= 0 ? '+' : ''}{netGold}
            </span>
            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-1 w-44 bg-stone-900 border border-stone-600 rounded-sm p-2 text-[9px] text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              <p className="font-bold text-amber-400 mb-1 border-b border-stone-700 pb-1">Tesouro</p>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span className="text-green-400">Renda base:</span><span>+{Math.floor(baseGoldIncome)}</span></div>
                <div className="flex justify-between"><span className="text-green-400">Rotas comerciais:</span><span>+{tradeIncome}</span></div>
                <div className="flex justify-between"><span className="text-red-400">Manutenção tropas:</span><span>-{Math.floor(goldMaintenance)}</span></div>
                <div className="flex justify-between"><span className="text-red-400">Overextension:</span><span>{oePenalty < 1 ? `-${Math.floor((1 - oePenalty) * 100)}%` : '0%'}</span></div>
                <div className="flex justify-between font-bold border-t border-stone-700 pt-1 mt-1"><span>Líquido:</span><span className={netGold >= 0 ? 'text-green-400' : 'text-red-400'}>{netGold >= 0 ? '+' : ''}{netGold}</span></div>
              </div>
            </div>
          </div>

          {/* Grãos */}
          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm relative group">
            <div className="flex items-center gap-1 mb-0.5">
              <Carrot size={12} className="text-orange-500" />
              <span className="text-[10px] md:text-[11px] text-stone-400 font-bold uppercase">Grãos</span>
            </div>
            <p className="text-xs md:text-lg font-black text-amber-50">{playerRealm.food}</p>
            <span className={`text-[10px] font-bold ${netFood >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netFood >= 0 ? '+' : ''}{netFood}
            </span>
            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-1 w-44 bg-stone-900 border border-stone-600 rounded-sm p-2 text-[9px] text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              <p className="font-bold text-orange-400 mb-1 border-b border-stone-700 pb-1">Grãos</p>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span className="text-green-400">Produção:</span><span>+{Math.floor(baseFoodIncome)}</span></div>
                <div className="flex justify-between"><span className="text-red-400">Manutenção tropas:</span><span>-{Math.floor(foodMaintenance)}</span></div>
                <div className="flex justify-between"><span className="text-red-400">Overextension:</span><span>{oePenalty < 1 ? `-${Math.floor((1 - oePenalty) * 100)}%` : '0%'}</span></div>
                <div className="flex justify-between font-bold border-t border-stone-700 pt-1 mt-1"><span>Líquido:</span><span className={netFood >= 0 ? 'text-green-400' : 'text-red-400'}>{netFood >= 0 ? '+' : ''}{netFood}</span></div>
              </div>
            </div>
          </div>

          {/* Obra */}
          <div className="bg-stone-800/50 p-1.5 md:p-2 border border-white/5 rounded-sm relative group">
            <div className="flex items-center gap-1 mb-0.5">
              <Hammer size={12} className="text-blue-500" />
              <span className="hidden md:inline text-[10px] md:text-[11px] text-stone-400 font-bold uppercase">Obra</span>
            </div>
            <p className="text-[11px] md:text-lg font-black text-amber-50">{playerRealm.materials}</p>
            <span className={`text-[10px] font-bold ${netMaterials >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {netMaterials >= 0 ? '+' : ''}{netMaterials}
            </span>
            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-1 w-44 bg-stone-900 border border-stone-600 rounded-sm p-2 text-[9px] text-stone-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
              <p className="font-bold text-blue-400 mb-1 border-b border-stone-700 pb-1">Obra</p>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span className="text-green-400">Produção:</span><span>+{Math.floor(baseMaterialsIncome)}</span></div>
                <div className="flex justify-between"><span className="text-red-400">Overextension:</span><span>{oePenalty < 1 ? `-${Math.floor((1 - oePenalty) * 100)}%` : '0%'}</span></div>
                <div className="flex justify-between font-bold border-t border-stone-700 pt-1 mt-1"><span>Líquido:</span><span className={netMaterials >= 0 ? 'text-green-400' : 'text-red-400'}>{netMaterials >= 0 ? '+' : ''}{netMaterials}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-stone-800/50 p-1 md:p-2 border border-white/5 rounded-sm">
            <div className="flex items-center gap-1 mb-0.5">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[10px] md:text-[11px] text-stone-400 font-bold uppercase">Ação</span>
            </div>
            <p className="text-[11px] md:text-lg font-black text-amber-50">{playerRealm.actionPoints}/{playerRealm.maxActionPoints}</p>
            <progress
              className="hud-meter hud-meter-amber hidden md:block mt-1"
              value={playerRealm.actionPoints}
              max={playerRealm.maxActionPoints}
              aria-label="Pontos de ação"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 space-y-4">
        {viewMode === 'trade' ? (
          <div className="space-y-4">
            <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] md:text-[11px] text-amber-500/60 font-bold uppercase tracking-widest">Comércio do Reino</p>
                  <h3 className="text-lg md:text-2xl font-black text-amber-100 uppercase tracking-tighter">Troca de Recursos</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-500 font-black uppercase">Transações restantes</p>
                  <p className="text-lg font-black text-amber-50">{Math.max(0, 3 - (playerRealm.tradesThisTurn || 0))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="bg-black/20 border border-stone-700/40 rounded-sm p-2">
                    <span className="block text-[10px] text-stone-500 font-black uppercase mb-1">Trocar de</span>
                    <select
                      className="w-full bg-stone-900 border border-stone-700 rounded-sm p-2 text-amber-50 text-sm"
                      value={tradeFrom}
                      onChange={(e) => {
                        const nextFrom = e.target.value as TradeResource;
                        setTradeFrom(nextFrom);
                        if (nextFrom === tradeTo) setTradeTo(nextFrom === 'gold' ? 'food' : 'gold');
                      }}
                    >
                      <option value="gold">Ouro</option>
                      <option value="food">Comida</option>
                      <option value="materials">Materiais</option>
                    </select>
                  </label>

                  <label className="bg-black/20 border border-stone-700/40 rounded-sm p-2">
                    <span className="block text-[10px] text-stone-500 font-black uppercase mb-1">Trocar para</span>
                    <select
                      className="w-full bg-stone-900 border border-stone-700 rounded-sm p-2 text-amber-50 text-sm"
                      value={tradeTo}
                      onChange={(e) => setTradeTo(e.target.value as TradeResource)}
                    >
                      {TRADE_RESOURCES.filter(r => r !== tradeFrom).map(resource => (
                        <option key={resource} value={resource}>
                          {resource === 'gold' ? 'Ouro' : resource === 'food' ? 'Comida' : 'Materiais'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="bg-black/20 border border-stone-700/40 rounded-sm p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-stone-500 font-black uppercase">Quantidade de origem</span>
                    <span className="text-[10px] text-stone-400 font-bold">Disponível: {tradeAvailable}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.min(MAX_TRADE_AMOUNT, Math.max(1, tradeAvailable))}
                    value={Math.min(tradeAmount, Math.max(1, tradeAvailable))}
                    onChange={(e) => setTradeAmount(parseInt(e.target.value))}
                    title="Quantidade de origem"
                    aria-label="Quantidade de origem"
                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-stone-400">
                    <span>1</span>
                    <span className="font-black text-amber-200">{tradeAmount}</span>
                    <span>{MAX_TRADE_AMOUNT}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase">Taxa estimada</p>
                    <p className="text-2xl font-black text-amber-50">{tradeRate.toFixed(2)}</p>
                    <p className="text-[10px] text-stone-400">1 {tradeFrom} gera {tradeRate.toFixed(2)} {tradeTo}</p>
                  </div>
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase">Resultado previsto</p>
                    <p className="text-2xl font-black text-amber-50">{tradePreview}</p>
                    <p className="text-[10px] text-stone-400">{tradeTo === 'gold' ? 'ouro' : tradeTo === 'food' ? 'comida' : 'materiais'} recebidos</p>
                  </div>
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase">Custo em AP</p>
                    <p className="text-2xl font-black text-amber-50">1</p>
                    <p className="text-[10px] text-stone-400">máx. 3 transações/turno</p>
                  </div>
                </div>

                <button
                  onClick={() => onAction('trade', gameState.playerRealmId, { from: tradeFrom, to: tradeTo, amount: tradeAmount })}
                  disabled={!tradeCanConfirm}
                  className={`w-full py-3 min-h-[44px] rounded-sm border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
                    ${tradeCanConfirm
                      ? 'bg-amber-600/20 border-amber-600 text-amber-200 hover:bg-amber-600/30'
                      : 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'}`}
                >
                  <Handshake size={14} /> Confirmar Comércio
                </button>
              </div>
            </div>
          </div>
        ) : selectedProvince ? (
          <div className="space-y-4">
            {viewMode === 'economic' && (
              <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[10px] md:text-[11px] text-amber-500/60 font-bold uppercase tracking-widest">Painel Econômico</p>
                    <h3 className="text-lg md:text-2xl font-black text-amber-100 uppercase tracking-tighter">Ações em Massa</h3>
                  </div>
                  <button
                    onClick={() => setMassActionsOpen(prev => !prev)}
                    className="px-3 py-2 min-h-[40px] rounded-sm border border-amber-700/40 bg-amber-950/30 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-900/40 transition-colors"
                  >
                    {massActionsOpen ? 'Fechar' : '⚡ Ações em Massa'}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {massActionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {massActionOptions.map(option => {
                          const estimate = estimateMassActionCost(gameState, gameState.playerRealmId, option.costGold, option.costMaterials);
                          const canAfford = playerRealm.gold >= estimate.totalCostGold && playerRealm.materials >= estimate.totalCostMaterials;
                          const costParts = [`${estimate.totalCostGold} ouro`];
                          if (estimate.totalCostMaterials > 0) costParts.push(`${estimate.totalCostMaterials} materiais`);

                          return (
                            <button
                              key={option.key}
                              onClick={() => onMassAction(option.action)}
                              disabled={!canAfford || estimate.affectedCount === 0}
                              className={`text-left rounded-sm border p-3 transition-all flex flex-col gap-1 min-h-[72px]
                                ${canAfford && estimate.affectedCount > 0
                                  ? 'bg-stone-900/50 border-stone-700 text-amber-100 hover:border-amber-500'
                                  : 'bg-stone-900/20 border-stone-800 text-stone-500 cursor-not-allowed'}`}
                            >
                              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{option.label}</span>
                              {'description' in option && option.description && (
                                <span className="text-[9px] text-amber-300/80">{option.description}</span>
                              )}
                              <span className="text-[9px] text-stone-400">{option.costGold} ouro/prov{option.costMaterials > 0 ? ` + ${option.costMaterials} materiais/prov` : ''}</span>
                              <span className="text-[9px] text-stone-500">Estimativa: {estimate.affectedCount} prov. | {costParts.join(' / ')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Province Details */}
            <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] md:text-[11px] text-amber-500/60 font-bold uppercase tracking-widest">{selectedProvince.ownerId === 'neutral' ? 'Terra Neutra' : gameState.realms[selectedProvince.ownerId]?.name}</p>
                  <h3 className="text-lg md:text-2xl font-black text-amber-100 uppercase tracking-tighter">{selectedProvince.name}</h3>
                </div>
                <div className="bg-stone-900 px-2 py-1 rounded border border-stone-700">
                  <p className="text-[10px] text-stone-500 uppercase font-black">Terreno</p>
                  <p className="text-[10px] md:text-[11px] uppercase font-bold text-amber-200">{selectedProvince.terrain === 'plains' ? 'Planície' : selectedProvince.terrain === 'forest' ? 'Floresta' : 'Montanha'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                  <Users size={16} className="text-stone-400" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-bold uppercase">População</p>
                    <p className="text-xs md:text-sm font-black text-amber-50">{selectedProvince.population}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                  <Shield size={16} className="text-amber-600" />
                  <div>
                    <p className="text-[10px] text-stone-500 font-bold uppercase">Defesa</p>
                    <p className="text-xs md:text-sm font-black text-amber-50">Nível {selectedProvince.defense}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-black/15 border border-stone-700/40 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-[11px] text-amber-500 font-black uppercase">Detalhes da Província</p>
                  <span className="text-[10px] text-stone-500 font-bold uppercase">{selectedProvince.population > 0 ? `${Math.floor(selectedProvince.population * 0.1)} recrutáveis` : '0 recrutáveis'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Exército</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                      {selectedProvinceArmy.map(unit => (
                        <div key={unit.key} className="flex items-center justify-between bg-black/20 rounded px-2 py-1">
                          <span className="font-bold uppercase text-amber-200">{unit.label}</span>
                          <span className="font-black text-amber-50">{unit.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Lealdade</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-stone-300">{provinceLoyaltyState}</span>
                      <span className="text-[10px] font-black text-amber-50">{selectedProvince.loyalty}%</span>
                    </div>
                    <progress
                      className={`hud-meter ${selectedProvince.loyalty < 30 ? 'hud-meter-red' : selectedProvince.loyalty > 70 ? 'hud-meter-emerald' : 'hud-meter-amber'}`}
                      value={Math.max(0, Math.min(100, selectedProvince.loyalty))}
                      max={100}
                      aria-label="Lealdade da província"
                    />
                  </div>

                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Estabilidade</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-stone-300">{provinceStabilityState}</span>
                      <span className="text-[10px] font-black text-amber-50">{provinceStability}%</span>
                    </div>
                    <progress
                      className={`hud-meter ${provinceStability >= 80 ? 'hud-meter-emerald' : provinceStability >= 50 ? 'hud-meter-amber' : provinceStability >= 20 ? 'hud-meter-orange' : 'hud-meter-red'}`}
                      value={Math.max(0, Math.min(100, provinceStability))}
                      max={100}
                      aria-label="Estabilidade da província"
                    />
                  </div>

                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Construções</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Farms</span><span className="font-black text-amber-50">{selectedProvince.buildings.farms}</span></div>
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Mines</span><span className="font-black text-amber-50">{selectedProvince.buildings.mines}</span></div>
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Works</span><span className="font-black text-amber-50">{selectedProvince.buildings.workshops}</span></div>
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Courts</span><span className="font-black text-amber-50">{selectedProvince.buildings.courts}</span></div>
                    </div>
                  </div>

                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Produtividade</p>
                    <div className="space-y-1 text-[10px] text-stone-300">
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Ouro</span><span className="font-black text-amber-50">+{selectedProvinceProduction?.gold}</span></div>
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Comida</span><span className="font-black text-amber-50">+{selectedProvinceProduction?.food}</span></div>
                      <div className="flex justify-between bg-black/20 rounded px-2 py-1"><span>Materiais</span><span className="font-black text-amber-50">+{selectedProvinceProduction?.materials}</span></div>
                    </div>
                  </div>

                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2">
                    <p className="text-[10px] text-stone-500 font-black uppercase mb-2">Crescimento populacional</p>
                    <div className="flex items-center justify-between bg-black/20 rounded px-2 py-2">
                      <span className="text-[10px] font-bold uppercase text-stone-300">Por turno</span>
                      <span className={`font-black ${selectedProvinceGrowthPerTurn >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {selectedProvinceGrowthPerTurn >= 0 ? '+' : ''}{selectedProvinceGrowthPerTurn}
                      </span>
                    </div>
                    <p className="mt-2 text-[9px] text-stone-500">Baseado em população, lealdade e estabilidade.</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-stone-500 font-black uppercase">Recurso estratégico</p>
                      <p className="text-[10px] text-stone-300 font-bold">{RESOURCE_META[selectedProvince.strategicResource]?.label}</p>
                    </div>
                    <span className="text-lg">{RESOURCE_META[selectedProvince.strategicResource]?.icon}</span>
                  </div>
                  <div className="bg-stone-900/40 border border-stone-700/40 rounded-sm p-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-stone-500 font-black uppercase">Recrutáveis</p>
                      <p className="text-[10px] text-stone-300 font-bold">10% da população</p>
                    </div>
                    <span className="text-lg font-black text-amber-50">{Math.floor(selectedProvince.population * 0.1)}</span>
                  </div>
                </div>
              </div>

              {/* Intelligence Report for Enemy Provinces with Adjacent Scouts */}
              {selectedProvince.ownerId !== gameState.playerRealmId && (() => {
                const playerProvsWithScouts = Object.values(gameState.provinces).filter(p =>
                  p.ownerId === gameState.playerRealmId &&
                  p.army.scouts > 0 &&
                  p.neighbors.includes(selectedProvince!.id)
                );

                if (playerProvsWithScouts.length === 0) return null;

                const scoutCount = playerProvsWithScouts.reduce((sum, p) => sum + p.army.scouts, 0);
                const isRevealed = scoutCount >= 2;

                return (
                  <div className="mt-3 p-3 bg-blue-950/20 border border-blue-700/30 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye size={12} className="text-blue-400" />
                      <p className="text-[10px] text-blue-400 font-black uppercase">Relatório de Inteligência</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-stone-300">
                        <span className="text-stone-500">Reino:</span> {gameState.realms[selectedProvince.ownerId]?.name}
                      </p>
                      <p className="text-[10px] text-stone-300">
                        <span className="text-stone-500">Batedores ativos:</span> {scoutCount}
                      </p>

                      {isRevealed ? (
                        <>
                          <p className="text-[10px] text-stone-300">
                            <span className="text-stone-500">Tropas inimigas:</span>
                            <span className="text-red-300 ml-1">
                              {selectedProvince.army.infantry > 0 && `${selectedProvince.army.infantry} inf. `}
                              {selectedProvince.army.archers > 0 && `${selectedProvince.army.archers} arq. `}
                              {selectedProvince.army.cavalry > 0 && `${selectedProvince.army.cavalry} cav. `}
                              {selectedProvince.army.scouts > 0 && `${selectedProvince.army.scouts} bat.`}
                            </span>
                          </p>
                          <p className="text-[10px] text-stone-300">
                            <span className="text-stone-500">Defesa:</span> Nível {selectedProvince.defense}
                          </p>
                          <p className="text-[10px] text-stone-300">
                            <span className="text-stone-500">Terreno:</span> {selectedProvince.terrain === 'plains' ? 'Planície' : selectedProvince.terrain === 'forest' ? 'Floresta' : 'Montanha'}
                          </p>
                          <p className="text-[10px] text-stone-300">
                            <span className="text-stone-500">Lealdade:</span> {selectedProvince.loyalty}%
                          </p>
                          {selectedProvince.strategicResource !== 'none' && (
                            <p className="text-[10px] text-stone-300">
                              <span className="text-stone-500">Recurso:</span> {selectedProvince.strategicResource}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-amber-400 italic">
                          Precisa de 2+ batedores adjacentes para reconhecimento completo.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Troop Composition Selector for March/Attack */}
              {selectingMoveComposition && selectedProvince.ownerId === gameState.playerRealmId && (
                <div className="mt-4 p-3 bg-amber-950/20 border border-amber-700/30 rounded-sm">
                  <p className="text-[10px] md:text-[11px] text-amber-500 font-black uppercase mb-3">Composição das Tropas</p>
                  {(['infantry', 'archers', 'cavalry', 'scouts'] as const).map(type => {
                    const maxAvailable = selectedProvince.army[type];
                    if (maxAvailable <= 0) return null;
                    const labels: Record<string, string> = { infantry: 'Infantaria', archers: 'Arqueiros', cavalry: 'Cavalaria', scouts: 'Batedores' };
                    return (
                      <div key={type} className="mb-2">
                        <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                          <span>{labels[type]}</span>
                          <span>{moveComposition[type]} / {maxAvailable}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxAvailable}
                          value={moveComposition[type]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            onMoveCompositionChange({ ...moveComposition, [type]: val });
                          }}
                          title={`Composição: ${labels[type]}`}
                          aria-label={`Composição: ${labels[type]}`}
                          className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-[10px] font-bold mt-2">
                    <span className="text-stone-400">Total:</span>
                    <span className="text-amber-200">{moveComposition.infantry + moveComposition.archers + moveComposition.cavalry + moveComposition.scouts}</span>
                  </div>
                </div>
              )}

              {selectedProvince.ownerId !== gameState.playerRealmId && selectedProvince.ownerId !== 'neutral' && onDiplomacy && (
                <div className="mt-4 rounded-sm border border-amber-900/20 bg-stone-800/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-[11px] font-black uppercase text-amber-200">Diplomacia</p>
                      <p className="text-[9px] text-stone-500">Abrir negociações com o reino selecionado</p>
                    </div>
                    <Handshake size={14} className="text-amber-500" />
                  </div>
                  <button
                    onClick={() => onDiplomacy(selectedProvince.ownerId)}
                    className="w-full rounded-sm border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all hover:bg-amber-600/20 hover:border-amber-500"
                  >
                    Diplomacia com {gameState.realms[selectedProvince.ownerId]?.name || 'Reino'}
                  </button>
                </div>
              )}

              {/* Military Actions */}
              {selectedProvince.ownerId === gameState.playerRealmId && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] md:text-[11px] text-stone-500 font-black uppercase border-b border-stone-700 pb-1 mb-2">Comandos Militares</p>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    <button
                      onClick={() => onMapAction?.('move')}
                      title="Marchar [W]"
                      className="flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 min-h-[36px] md:min-h-[44px] bg-stone-800 border border-stone-700 hover:bg-amber-600/10 hover:border-amber-600/50 rounded-sm text-[9px] md:text-[10px] font-bold uppercase transition-all"
                    >
                      <Swords size={12} className="text-amber-500 md:w-[14px] md:h-[14px]" /> Marchar
                    </button>
                    <button
                      onClick={() => onMapAction?.('attack')}
                      title="Atacar [A]"
                      className="flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 min-h-[36px] md:min-h-[44px] bg-stone-800 border border-stone-700 hover:bg-red-600/10 hover:border-red-600/50 rounded-sm text-[9px] md:text-[10px] font-bold uppercase transition-all"
                    >
                      <Zap size={12} className="text-red-500 md:w-[14px] md:h-[14px]" /> Atacar
                    </button>
                  </div>
                  {/* Disband Button */}
                  {selectedProvince.troops > 0 && (
                    <button
                      onClick={() => {
                        onIsDisbandMode?.(!isDisbandMode);
                        onActionState?.('idle');
                        onActionSourceId?.(null);
                        onPreviewPath?.([]);
                        onActionBannerMessage?.(null);
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 min-h-[36px] md:min-h-[44px] border rounded-sm text-[9px] md:text-[10px] font-bold uppercase transition-all
                           ${isDisbandMode ? 'bg-red-900/30 border-red-500 text-red-300' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-red-600/10 hover:border-red-600/50 hover:text-red-300'}`}
                    >
                      <Users size={12} className={`${isDisbandMode ? 'text-red-400' : 'text-stone-400'} md:w-[14px] md:h-[14px]`} />
                      {isDisbandMode ? 'Modo Dispensar' : 'Dispensar Tropas'}
                    </button>
                  )}
                  {/* Disband Mode UI */}
                  {isDisbandMode && selectedProvince && (
                    <div className="mt-3 p-3 bg-red-950/20 border border-red-700/30 rounded-sm">
                      <p className="text-[10px] text-red-400 font-black uppercase mb-2">Dispensar Tropas</p>
                      <p className="text-[9px] text-stone-500 mb-2">Custo: 1 AP • 50% recursos retornam</p>

                      {(['infantry', 'archers', 'cavalry', 'scouts'] as UnitType[]).map(type => {
                        const maxAvailable = selectedProvince.army[type];
                        if (maxAvailable <= 0) return null;
                        const labels: Record<string, string> = { infantry: 'Infantaria', archers: 'Arqueiros', cavalry: 'Cavalaria', scouts: 'Batedores' };
                        return (
                          <div key={type} className="mb-2">
                            <div className="flex justify-between text-[10px] text-stone-400 mb-1">
                              <span>{labels[type]}</span>
                              <span>{disbandComposition[type] || 0} / {maxAvailable}</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={maxAvailable}
                              value={disbandComposition[type] || 0}
                              onChange={(e) => onDisbandCompositionChange?.({ ...disbandComposition, [type]: parseInt(e.target.value) })}
                              title={`Dispensar: ${labels[type]}`}
                              aria-label={`Dispensar: ${labels[type]}`}
                              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                          </div>
                        );
                      })}

                      {(() => {
                        const total = (disbandComposition.infantry || 0) + (disbandComposition.archers || 0) +
                          (disbandComposition.cavalry || 0) + (disbandComposition.scouts || 0);
                        if (total <= 0) return null;
                        return (
                          <button
                            onClick={() => onDisband?.(selectedProvince.id)}
                            className="w-full py-2 mt-2 bg-red-600/20 border border-red-600 text-red-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-600/30 transition-all rounded-sm"
                          >
                            Dispensar {total} tropas
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Military Maintenance Breakdown */}
            {selectedProvince.ownerId === gameState.playerRealmId && selectedProvince.troops > 0 && (
              <div className="bg-stone-900/30 p-2 rounded-sm border border-stone-700/30">
                <p className="text-[10px] text-stone-500 font-bold uppercase mb-1">Manutenção Militar</p>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  {selectedProvince.army.infantry > 0 && (
                    <span className="text-stone-400">Inf: {selectedProvince.army.infantry} × {UNIT_STATS.infantry.maintenance.food}🌾/{UNIT_STATS.infantry.maintenance.gold}💰</span>
                  )}
                  {selectedProvince.army.archers > 0 && (
                    <span className="text-stone-400">Arq: {selectedProvince.army.archers} × {UNIT_STATS.archers.maintenance.food}🌾/{UNIT_STATS.archers.maintenance.gold}💰</span>
                  )}
                  {selectedProvince.army.cavalry > 0 && (
                    <span className="text-stone-400">Cav: {selectedProvince.army.cavalry} × {UNIT_STATS.cavalry.maintenance.food}🌾/{UNIT_STATS.cavalry.maintenance.gold}💰</span>
                  )}
                  {selectedProvince.army.scouts > 0 && (
                    <span className="text-stone-400">Bat: {selectedProvince.army.scouts} × {UNIT_STATS.scouts.maintenance.food}🌾/{UNIT_STATS.scouts.maintenance.gold}💰</span>
                  )}
                </div>
              </div>
            )}

            {/* Recruitment / Building Sections */}
            {selectedProvince.ownerId === gameState.playerRealmId && (
              <div className="bg-stone-800/30 border border-amber-900/20 p-3 rounded-sm">
                <p className="text-[10px] md:text-[11px] text-stone-500 font-black uppercase mb-3">Administração Regional</p>
                <div className="space-y-4">
                  {/* Recruitment Section with Sliders */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase text-amber-200">Recrutamento</span>
                      <span className="text-[10px] text-stone-500 italic">Custo: {ACTION_COSTS.recruit} AP</span>
                    </div>

                    {(['infantry', 'archers', 'cavalry', 'scouts'] as UnitType[]).map(type => {
                      const stats = UNIT_STATS[type];
                      const statsWithReq = stats as any;
                      const labels: Record<string, string> = {
                        infantry: 'Infantaria',
                        archers: 'Arqueiros',
                        cavalry: 'Cavalaria',
                        scouts: 'Batedores'
                      };

                      // Check if strategic resource is available
                      if (statsWithReq.requires) {
                        const hasResource = Object.values(gameState.provinces).some(p =>
                          p.ownerId === gameState.playerRealmId && p.strategicResource === statsWithReq.requires
                        );
                        if (!hasResource) return null;
                      }

                      const maxByGold = stats.cost.gold > 0 ? Math.floor(playerRealm.gold / stats.cost.gold) : Infinity;
                      const maxByFood = stats.cost.food > 0 ? Math.floor(playerRealm.food / stats.cost.food) : Infinity;
                      const maxByMaterials = stats.cost.materials > 0 ? Math.floor(playerRealm.materials / stats.cost.materials) : Infinity;
                      const maxByPop = stats.cost.pop > 0 ? Math.floor(selectedProvince.population / stats.cost.pop) : Infinity;
                      const maxAmount = Math.max(0, Math.min(maxByGold, maxByFood, maxByMaterials, maxByPop));

                      if (maxAmount <= 0) return null;

                      const currentValue = recruitComposition[type] || 0;
                      const costForCurrent = {
                        gold: stats.cost.gold * currentValue,
                        food: stats.cost.food * currentValue,
                        materials: stats.cost.materials * currentValue,
                        pop: stats.cost.pop * currentValue
                      };

                      return (
                        <div key={type} className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-amber-100">{labels[type]}</span>
                            <span className="text-[10px] text-stone-400">
                              {stats.cost.gold > 0 ? `${stats.cost.gold} ouro` : ''}
                              {stats.cost.food > 0 ? ` / ${stats.cost.food} comida` : ''}
                              {stats.cost.materials > 0 ? ` / ${stats.cost.materials} material` : ''}
                              {stats.cost.pop > 0 ? ` / ${stats.cost.pop} pop` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={Math.min(maxAmount, 20)}
                              value={currentValue}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                onRecruitCompositionChange({ ...recruitComposition, [type]: val });
                              }}
                              title={`Recrutar: ${labels[type]}`}
                              aria-label={`Recrutar: ${labels[type]}`}
                              className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <span className="text-xs font-black text-amber-200 w-8 text-right">{currentValue}</span>
                          </div>

                          {currentValue > 0 && (
                            <div className="mt-1 text-[10px] text-stone-400">
                              Custo: {costForCurrent.gold > 0 ? `${costForCurrent.gold} ouro` : ''}
                              {costForCurrent.food > 0 ? ` / ${costForCurrent.food} comida` : ''}
                              {costForCurrent.materials > 0 ? ` / ${costForCurrent.materials} material` : ''}
                              {costForCurrent.pop > 0 ? ` / ${costForCurrent.pop} pop` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Summary and Recruit Button */}
                    {(() => {
                      const totalUnits = (recruitComposition.infantry || 0) + (recruitComposition.archers || 0) +
                        (recruitComposition.cavalry || 0) + (recruitComposition.scouts || 0);
                      if (totalUnits <= 0) return null;

                      const totalCosts = { gold: 0, food: 0, materials: 0, pop: 0 };
                      (['infantry', 'archers', 'cavalry', 'scouts'] as UnitType[]).forEach(type => {
                        const amount = recruitComposition[type] || 0;
                        const stats = UNIT_STATS[type];
                        totalCosts.gold += stats.cost.gold * amount;
                        totalCosts.food += stats.cost.food * amount;
                        totalCosts.materials += stats.cost.materials * amount;
                        totalCosts.pop += stats.cost.pop * amount;
                      });

                      return (
                        <div className="pt-2 border-t border-stone-700">
                          <div className="text-[10px] text-stone-400 mb-2">
                            Total: {totalUnits} unidades — {totalCosts.gold > 0 ? `${totalCosts.gold} ouro` : ''}
                            {totalCosts.food > 0 ? ` / ${totalCosts.food} comida` : ''}
                            {totalCosts.materials > 0 ? ` / ${totalCosts.materials} material` : ''}
                            {totalCosts.pop > 0 ? ` / ${totalCosts.pop} pop` : ''}
                          </div>
                          <button
                            onClick={() => onAction('recruit', selectedProvince.id)}
                            className="w-full py-3 min-h-[44px] bg-amber-600/20 border border-amber-600 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-600/30 transition-all rounded-sm flex items-center justify-center gap-2"
                          >
                            <PlusCircle size={14} /> Recrutar
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Building Section with Costs */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase text-amber-200">Projetos</span>
                      <span className="text-[10px] text-stone-500 italic">Custo: {ACTION_COSTS.build} AP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {['farms', 'mines', 'workshops', 'courts'].map(b => {
                        const buildingStats = (BUILDING_STATS as any)[b];
                        const labels: Record<string, string> = {
                          farms: 'Fazendas',
                          mines: 'Minas',
                          workshops: 'Oficinas',
                          courts: 'Corte'
                        };
                        const costs: string[] = [];
                        if (buildingStats?.gold) costs.push(`${buildingStats.gold} ouro`);
                        if (buildingStats?.materials) costs.push(`${buildingStats.materials} materiais`);
                        const costStr = costs.join(' / ');

                        return (
                          <button
                            key={b}
                            onClick={() => onAction('build', selectedProvince.id, b)}
                            className="text-[10px] font-bold uppercase py-3 min-h-[44px] bg-stone-800 border border-stone-700 hover:border-amber-500 rounded-sm text-stone-400 hover:text-amber-200 transition-all flex flex-col items-center justify-center gap-1"
                            title={costStr}
                          >
                            {labels[b]}
                            <span className="text-[9px] text-stone-500 font-normal normal-case">{costStr}</span>
                          </button>
                        );
                      })}
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

      {/* Active Marches */}
      {marchOrders.length > 0 && (
        <div className="p-4 bg-black/40 border-t border-amber-900/20">
          <p className="text-[10px] md:text-[11px] text-stone-500 font-black uppercase mb-2">Marchas em Andamento</p>
          <div className="space-y-2">
            {marchOrders.filter(o => o.realmId === gameState.playerRealmId).map(order => {
              const destProv = gameState.provinces[order.remainingPath[order.remainingPath.length - 1] || order.currentProvId];
              const totalTroops = order.troops.infantry + order.troops.archers + order.troops.cavalry + order.troops.scouts;
              const turnsLeft = order.remainingPath.length;
              return (
                <div key={order.id} className="flex items-center justify-between bg-stone-800/50 p-2 rounded-sm border border-stone-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-amber-200 truncate">
                      {totalTroops} tropas → {destProv?.name || '???'}
                    </p>
                    <p className="text-[10px] text-stone-500">{turnsLeft} turno{turnsLeft !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => onCancelMarchOrder(order.id)}
                    className="ml-2 p-1 text-[10px] font-bold uppercase bg-red-900/30 border border-red-700/50 text-red-300 rounded hover:bg-red-800/50 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions Bottom */}
      <div className="p-2 md:p-4 bg-black/60 border-t border-amber-900/30 space-y-1.5 md:space-y-2">
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${playerRealmColorClass}`}>
              <Crown size={12} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-amber-50 uppercase leading-tight truncate">{playerRealm.name}</p>
              <p className="text-[8px] text-amber-500/70 italic leading-tight">Turno {gameState.turn}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onSave} title="Salvar [S]" className="h-7 px-1.5 border border-stone-700 bg-stone-800 text-[8px] font-bold uppercase rounded">Salvar</button>
            <button onClick={onMenu} className="h-7 px-1.5 border border-stone-700 bg-stone-800 text-[8px] font-bold uppercase rounded">Menu</button>
            <button
              onClick={() => {
                const next = toggleSfx();
                setSfxEnabled(next);
              }}
              title="Alternar SFX"
              aria-label="Alternar SFX"
              className="h-7 w-7 border border-stone-700 bg-stone-800 rounded flex items-center justify-center"
            >
              {sfxEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
            </button>
            <button onClick={onToggleInstructions} title="Instruções" aria-label="Instruções" className="h-7 w-7 border border-stone-700 bg-stone-800 rounded flex items-center justify-center">
              <HelpCircle size={10} />
            </button>
            <button
              onClick={onToggleMinimap}
              title={showMinimap ? 'Ocultar minimapa' : 'Mostrar minimapa'}
              aria-label={showMinimap ? 'Ocultar minimapa' : 'Mostrar minimapa'}
              className={`h-7 w-7 border rounded flex items-center justify-center ${showMinimap ? 'border-amber-500 bg-amber-600/20 text-amber-200' : 'border-stone-700 bg-stone-800 text-stone-400'}`}
            >
              <MapIcon size={10} />
            </button>
          </div>
          <button
            onClick={onEndTurn}
            title="Encerrar Turno [Enter]"
            className="h-8 px-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-[0.08em] rounded-sm border border-amber-700 active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Play size={12} className="fill-stone-950" /> Turno
          </button>
        </div>
        <button
          onClick={onEndTurn}
          title="Encerrar Turno [Enter]"
          className="hidden md:flex w-full h-10 md:h-12 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs md:text-lg uppercase tracking-[0.12em] md:tracking-widest transition-all rounded-sm shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-[0.98] items-center justify-center gap-2 md:gap-3"
        >
          <Play size={16} className="fill-stone-950 md:w-5 md:h-5" /> Encerrar Turno
        </button>

        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => onToggleMode('political')}
            title="Político [1]"
            className={`flex flex-col items-center justify-center py-1.5 md:py-2 rounded-sm border transition-all ${viewMode === 'political' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
          >
            <MapIcon size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase mt-0.5 md:mt-1">Político</span>
          </button>
          <button
            onClick={() => onToggleMode('economic')}
            title="Economia [2]"
            className={`flex flex-col items-center justify-center py-1.5 md:py-2 rounded-sm border transition-all ${viewMode === 'economic' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
          >
            <Landmark size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase mt-0.5 md:mt-1">Economia</span>
          </button>
          <button
            onClick={() => onToggleMode('military')}
            title="Militar [3]"
            className={`flex flex-col items-center justify-center py-1.5 md:py-2 rounded-sm border transition-all ${viewMode === 'military' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
          >
            <Shield size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase mt-0.5 md:mt-1">Militar</span>
          </button>
          <button
            onClick={() => onToggleMode('trade')}
            title="Diplomacia [4]"
            className={`flex flex-col items-center justify-center py-1.5 md:py-2 rounded-sm border transition-all ${viewMode === 'trade' ? 'bg-amber-600/20 border-amber-500 text-amber-200' : 'bg-stone-800/40 border-stone-700 text-stone-500'}`}
          >
            <Handshake size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase mt-0.5 md:mt-1">Comércio</span>
          </button>
          <button
            onClick={onToggleChronicles}
            title="Recursos [5]"
            className="flex flex-col items-center justify-center py-1.5 md:py-2 bg-stone-800/40 border border-stone-700 text-stone-500 hover:text-amber-200 rounded-sm transition-all"
          >
            <Scroll size={14} className="md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase mt-0.5 md:mt-1">Crônicas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
