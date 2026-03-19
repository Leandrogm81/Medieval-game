import React, { useState, useEffect, useCallback, Component } from 'react';
import { GameState, ActionType, Province, Realm, VisualEffect, Army, UnitType, StrategicResource, ViewMode, GameSettings, VictoryCondition, SaveData, TurnSummaryData } from './types';
import { generateInitialState, processAITurn, processEndOfTurn, resolveCombat, executeAttack, UNIT_STATS, ACTION_COSTS, BUILDING_STATS, BUILDING_PRODUCTION, BattleResult } from './gameLogic';
import { persistence } from './persistence';
import { Map } from './components/Map';
import { HUD } from './components/HUD';
import { ChroniclesModal } from './components/ChroniclesModal';
import { Minimap } from './components/Minimap';
import { GameOverModal } from './components/GameOverModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { InstructionsModal } from './components/InstructionsModal';
import { TurnSummaryModal } from './components/TurnSummaryModal';
import { CombatPreviewModal } from './components/CombatPreviewModal';
import { BattleResultModal } from './components/BattleResultModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, Crown, Scroll, Play, Info, Handshake, Settings, Save } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 750;

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionType>('idle');
  const [actionSourceId, setActionSourceId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('political');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);
  const [showTurnSummary, setShowTurnSummary] = useState<boolean>(false);
  const [turnSummaryData, setTurnSummaryData] = useState<TurnSummaryData | null>(null);
  const [showCombatPreview, setShowCombatPreview] = useState<boolean>(false);
  const [combatAttackerProvId, setCombatAttackerProvId] = useState<string | null>(null);
  const [combatDefenderProvId, setCombatDefenderProvId] = useState<string | null>(null);
  const [combatAttackingArmy, setCombatAttackingArmy] = useState<Army | null>(null);
  const [showBattleResult, setShowBattleResult] = useState<boolean>(false);
  const [battleResultData, setBattleResultData] = useState<BattleResult | null>(null);
  const [battleResultMeta, setBattleResultMeta] = useState<{ attackerName: string; defenderName: string; provinceName: string; conquered: boolean } | null>(null);
  const [autosave, setAutosave] = useState<SaveData | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    numProvinces: 25,
    numRealms: 6,
    aiDifficulty: 'normal',
    resourceDensity: 'normal',
    victoryCondition: 'conquest'
  });
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [showChronicles, setShowChronicles] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const wRatio = window.innerWidth / 1420;
      const hRatio = window.innerHeight / 850;
      // Base scale to fit window, then modified by user zoom
      const baseScale = (Math.min(wRatio, hRatio) || 1) * 0.99;
      setScale(baseScale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playSound = (type: 'click' | 'recruit' | 'build' | 'combat' | 'conquest' | 'turn') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      let freq = 440;
      let duration = 0.1;
      switch(type) {
        case 'click': freq = 880; duration = 0.05; break;
        case 'recruit': freq = 440; duration = 0.2; break;
        case 'build': freq = 220; duration = 0.3; break;
        case 'combat': freq = 110; duration = 0.4; break;
        case 'conquest': freq = 660; duration = 0.5; break;
        case 'turn': freq = 330; duration = 0.3; break;
      }
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const startNewGame = useCallback(() => {
    playSound('turn');
    try {
      const initialState = generateInitialState(MAP_WIDTH, MAP_HEIGHT, gameSettings);
      setGameState(initialState);
      setSelectedProvinceId(null);
      setActionState('idle');
      setActionSourceId(null);
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to start new game:", error);
      addLog("Erro ao iniciar novo jogo.");
    }
  }, [gameSettings]);

  const handleSave = (name: string) => {
    if (!gameState) return;
    persistence.saveGame(gameState, name);
    addLog(`Jogo salvo: ${name}`);
  };

  const handleLoad = (id: string) => {
    const loadedState = persistence.loadSave(id);
    if (loadedState) {
      setGameState(loadedState);
      setShowMenu(false);
      setShowSaveModal(false);
      addLog("Jogo carregado com sucesso.");
    }
  };

  const handleDeleteSave = (id: string) => {
    persistence.deleteSave(id);
  };

  const addLog = (msg: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, logs: [...prev.logs, msg] };
    });
  };

  // Cleanup visual effects
  useEffect(() => {
    setAutosave(persistence.loadAutoSave());
    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.visualEffects.length === 0) return prev;
        const now = Date.now();
        const filtered = prev.visualEffects.filter(e => now - e.startTime < e.duration);
        if (filtered.length === prev.visualEffects.length) return prev;
        return { ...prev, visualEffects: filtered };
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const addVisualEffect = (type: 'battle' | 'conquest' | 'trade', x: number, y: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newEffect = {
        id: `effect_${Date.now()}_${Math.random()}`,
        type,
        x,
        y,
        duration: 2000,
        startTime: Date.now()
      };
      return { ...prev, visualEffects: [...prev.visualEffects, newEffect] };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    if (Math.abs(newX - panOffset.x) > 5 || Math.abs(newY - panOffset.y) > 5) {
      setHasDragged(true);
    }
    
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleProvinceClick = (id: string) => {
    if (!gameState) return;
    if (hasDragged) return;
    setSelectedProvinceId(id);
    playSound('click');

    if (actionState === 'idle') {
      // setSelectedProvinceId(id); // This is now handled above
    } else if (actionState === 'moving') {
      if (actionSourceId) {
        const source = gameState.provinces[actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.move) {
          addLog("Pontos de Ação insuficientes para mover.");
          setActionState('idle');
          setActionSourceId(null);
          return;
        }
        
        if (source.neighbors.includes(id) && target.ownerId === gameState.playerRealmId) {
          playSound('click');
          // Move troops
          setGameState(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
            const s = next.provinces[actionSourceId];
            const t = next.provinces[id];
            
            // Move 80% (more intuitive)
            const moveInf = Math.floor(s.army.infantry * 0.8);
            const moveArc = Math.floor(s.army.archers * 0.8);
            const moveCav = Math.floor(s.army.cavalry * 0.8);

            s.army.infantry -= moveInf;
            s.army.archers -= moveArc;
            s.army.cavalry -= moveCav;
            s.troops = s.army.infantry + s.army.archers + s.army.cavalry;

            t.army.infantry += moveInf;
            t.army.archers += moveArc;
            t.army.cavalry += moveCav;
            t.troops = t.army.infantry + t.army.archers + t.army.cavalry;

            next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.move;
            return next;
          });
          addVisualEffect('conquest', target.center[0], target.center[1]);
          addLog(`Tropas movidas de ${source.name} para ${target.name}.`);
        } else {
          addLog("Alvo de movimento inválido. Deve ser uma província adjacente de sua propriedade.");
        }
      }
      setActionState('idle');
      setActionSourceId(null);
    } else if (actionState === 'trading') {
      if (actionSourceId) {
        const source = gameState.provinces[actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
          addLog("Pontos de Ação insuficientes para estabelecer rota comercial.");
          setActionState('idle');
          setActionSourceId(null);
          return;
        }
        
        if (source.neighbors.includes(id)) {
          // Establish trade route
          const cost = 50;
          if (playerRealm.gold >= cost) {
            setGameState(prev => {
              if (!prev) return prev;
              const next = { ...prev };
              next.realms[prev.playerRealmId].gold -= cost;
              next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
              next.realms[prev.playerRealmId].tradeRoutes.push({ from: actionSourceId, to: id });
              return next;
            });
            addLog(`Rota comercial estabelecida entre ${source.name} e ${target.name}.`);
          } else {
            addLog("Ouro insuficiente para estabelecer rota comercial.");
          }
        } else {
          addLog("Alvo comercial inválido. Deve ser uma província adjacente.");
        }
      }
      setActionState('idle');
      setActionSourceId(null);
    } else if (actionState === 'attacking') {
      if (actionSourceId) {
        const source = gameState.provinces[actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.attack) {
          addLog("Pontos de Ação insuficientes para atacar.");
          setActionState('idle');
          setActionSourceId(null);
          return;
        }

        if (source.neighbors.includes(id) && target.ownerId !== gameState.playerRealmId) {
          if (!playerRealm.wars.includes(target.ownerId)) {
             addLog(`Você precisa declarar guerra a ${gameState.realms[target.ownerId].name} antes de atacar!`);
          } else {
             const attackingArmy: Army = {
               infantry: Math.floor(source.army.infantry * 0.8),
               archers: Math.floor(source.army.archers * 0.8),
               cavalry: Math.floor(source.army.cavalry * 0.8)
             };
             const totalAttacking = attackingArmy.infantry + attackingArmy.archers + attackingArmy.cavalry;

             if (totalAttacking > 0) {
               // Show combat preview instead of attacking directly
               setCombatAttackerProvId(actionSourceId);
               setCombatDefenderProvId(id);
               setCombatAttackingArmy(attackingArmy);
               setShowCombatPreview(true);
             } else {
               addLog("Tropas insuficientes na província de origem para atacar.");
             }
          }
        } else {
          addLog("Alvo inválido! Deve ser uma província inimiga adjacente.");
        }
      }
      setActionState('idle');
      setActionSourceId(null);
    }
  };

  const confirmAttack = () => {
    if (!gameState || !combatAttackerProvId || !combatDefenderProvId || !combatAttackingArmy) return;
    playSound('combat');

    const source = gameState.provinces[combatAttackerProvId];
    const target = gameState.provinces[combatDefenderProvId];
    const playerRealm = gameState.realms[gameState.playerRealmId];
    const defenderRealm = gameState.realms[target.ownerId];

    addVisualEffect('battle', target.center[0], target.center[1]);

    // Resolve combat manually to capture result
    const effectiveDefense = Math.max(0, target.defense - (target.siegeDamage || 0));
    const result = resolveCombat(combatAttackingArmy, target.army, target.terrain, effectiveDefense);

    // Show battle result modal
    setBattleResultData(result);
    setBattleResultMeta({
      attackerName: playerRealm.name,
      defenderName: defenderRealm?.name || 'Desconhecido',
      provinceName: target.name,
      conquered: result.won,
    });
    setShowBattleResult(true);

    // Apply results to game state
    setGameState(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      const s = next.provinces[combatAttackerProvId];
      const t = next.provinces[combatDefenderProvId];
      const r = next.realms[prev.playerRealmId];

      // Remove attacking troops from source
      s.army.infantry -= combatAttackingArmy.infantry;
      s.army.archers -= combatAttackingArmy.archers;
      s.army.cavalry -= combatAttackingArmy.cavalry;
      s.troops = s.army.infantry + s.army.archers + s.army.cavalry;
      r.actionPoints -= ACTION_COSTS.attack;

      if (result.won) {
        const oldOwnerId = t.ownerId;
        const oldOwner = next.realms[oldOwnerId];
        t.ownerId = r.id;
        t.army = result.attackerRemaining;
        t.troops = t.army.infantry + t.army.archers + t.army.cavalry;
        t.siegeDamage = 0;

        // Retreat defenders
        const totalDefRem = result.defenderRemaining.infantry + result.defenderRemaining.archers + result.defenderRemaining.cavalry;
        if (totalDefRem > 0) {
          const retreatOptions = t.neighbors.map(nId => next.provinces[nId]).filter(p => p.ownerId === oldOwnerId);
          if (retreatOptions.length > 0) {
            const rp = retreatOptions.sort((a, b) => b.troops - a.troops)[0];
            rp.army.infantry += result.defenderRemaining.infantry;
            rp.army.archers += result.defenderRemaining.archers;
            rp.army.cavalry += result.defenderRemaining.cavalry;
            rp.troops = rp.army.infantry + rp.army.archers + rp.army.cavalry;
          }
        }

        next.logs.push(`CONQUISTA: ${r.name} tomou ${t.name}!`);
        r.overextension = Math.min(100, r.overextension + 15);
        t.recentlyConquered = 10;
        t.loyalty = 30;

        if (oldOwner && oldOwner.capitalId === t.id) {
          const remaining = (Object.values(next.provinces) as typeof t[]).filter(p => p.ownerId === oldOwnerId && p.id !== t.id);
          if (remaining.length > 0) {
            oldOwner.capitalId = remaining.sort((a, b) => b.population - a.population)[0].id;
          }
        }

        if (oldOwner && oldOwner.memory[r.id]) {
          oldOwner.memory[r.id].aggression += 30;
          oldOwner.memory[r.id].lastWarTurn = next.turn;
        }
        if (oldOwner) oldOwner.relations[r.id] -= 50;
      } else {
        // Defeat: return survivors to source
        t.army = result.defenderRemaining;
        t.troops = t.army.infantry + t.army.archers + t.army.cavalry;
        s.army.infantry += result.attackerRemaining.infantry;
        s.army.archers += result.attackerRemaining.archers;
        s.army.cavalry += result.attackerRemaining.cavalry;
        s.troops = s.army.infantry + s.army.archers + s.army.cavalry;

        if (t.defense > (t.siegeDamage || 0)) {
          t.siegeDamage = (t.siegeDamage || 0) + 1;
        }
      }

      return next;
    });
    setShowCombatPreview(false);
    setCombatAttackerProvId(null);
    setCombatDefenderProvId(null);
    setCombatAttackingArmy(null);
  };

  const handleAction = (action: 'recruit' | 'move' | 'attack' | 'improve' | 'diplomacy' | 'fortify' | 'build_farms' | 'build_mines' | 'build_workshops' | 'build_courts' | 'buy_food' | 'sell_food' | 'buy_materials' | 'sell_materials' | 'trade_route' | 'send_gift' | 'propose_pact' | 'propose_alliance' | 'demand_tribute' | 'demand_vassalage' | 'declare_war' | 'offer_peace' | 'break_pact', unitType?: UnitType, amount?: number) => {
    if (!gameState || !selectedProvinceId) return;
    
    const prov = gameState.provinces[selectedProvinceId];
    const playerRealm = gameState.realms[gameState.playerRealmId];

    if (action === 'recruit' && unitType) {
      playSound('recruit');
      const recruitAmount = amount || 10;
      const stats = UNIT_STATS[unitType];
      const goldCost = stats.cost.gold * recruitAmount;
      const foodCost = stats.cost.food * recruitAmount;
      const materialsCost = stats.cost.materials * recruitAmount;
      const popCost = stats.cost.pop * recruitAmount;
      
      if (playerRealm.actionPoints < ACTION_COSTS.recruit) {
        addLog("Pontos de Ação insuficientes para recrutar.");
        return;
      }

      if (playerRealm.gold < goldCost || playerRealm.food < foodCost || playerRealm.materials < materialsCost) {
        addLog("Recursos insuficientes para recrutar.");
        return;
      }

      if (prov.population < popCost) {
        addLog("População insuficiente para recrutar.");
        return;
      }

      // Strategic resource checks
      const statsWithReq = stats as { requires?: StrategicResource };
      if (statsWithReq.requires) {
        const hasResource = (Object.values(gameState.provinces) as Province[]).some(p => p.ownerId === gameState.playerRealmId && p.strategicResource === statsWithReq.requires);
        if (!hasResource) {
          addLog(`Você precisa de uma província com ${statsWithReq.requires.toUpperCase()} para recrutar ${unitType === 'archers' ? 'Arqueiros' : 'Cavalaria'}.`);
          return;
        }
      }

      setGameState(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
        const p = next.provinces[selectedProvinceId];
        const r = next.realms[prev.playerRealmId];

        r.gold -= goldCost;
        r.food -= foodCost;
        r.materials -= materialsCost;
        r.actionPoints -= ACTION_COSTS.recruit;
        p.population -= popCost;
        p.army[unitType] += recruitAmount;
        p.troops = p.army.infantry + p.army.archers + p.army.cavalry;
        return next;
      });
      addLog(`Recrutado ${recruitAmount} ${unitType === 'infantry' ? 'Infantaria' : unitType === 'archers' ? 'Arqueiros' : 'Cavalaria'} em ${prov.name}.`);
    } else if (action === 'build_farms' || action === 'build_mines' || action === 'build_workshops' || action === 'build_courts' || action === 'fortify') {
      playSound('build');
      if (playerRealm.actionPoints < ACTION_COSTS.build) {
        addLog(`Pontos de Ação insuficientes para ${action === 'fortify' ? 'fortificar' : 'construir'}.`);
        return;
      }

      const isFortify = action === 'fortify';
      const buildingType = isFortify ? 'fortify' : (action.replace('build_', '') as keyof typeof BUILDING_STATS);
      const stats = BUILDING_STATS[buildingType];
      const cost = stats.gold || 0;
      const matCost = (stats as any).materials || 0;

      if (playerRealm.gold >= cost && playerRealm.materials >= matCost) {
        if (isFortify && prov.defense >= 5) {
           addLog("Defesas já estão no nível máximo.");
           return;
        }

        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials -= matCost;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.build;
          
          if (buildingType === 'fortify') {
             next.provinces[selectedProvinceId].targetProvStatus = 'defend'; // irrelevant but matching logic if needed
             next.provinces[selectedProvinceId].defense += 1;
          } else {
             next.provinces[selectedProvinceId].buildings[buildingType as 'farms'] += 1;
          }
          return next;
        });
        const buildingNames: any = { farms: 'Fazenda', mines: 'Mina', workshops: 'Oficina', courts: 'Tribunal', fortify: 'Fortificação' };
        addLog(`Finalizado: ${buildingNames[buildingType] || 'Melhoria'} em ${prov.name}.`);
      } else {
        addLog("Recursos insuficientes.");
      }
    } else if (action === 'move') {
      setActionState('moving');
      setActionSourceId(selectedProvinceId);
      addLog("Selecione uma província adjacente de sua propriedade para mover as tropas.");
    } else if (action === 'attack') {
      if (playerRealm.actionPoints < ACTION_COSTS.attack) {
        addLog("Pontos de Ação insuficientes para atacar.");
        return;
      }
      setActionState('attacking');
      setActionSourceId(selectedProvinceId);
      addLog("Selecione a província inimiga alvo para atacar.");
    } else if (action === 'send_gift') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes para diplomacia.");
        return;
      }
      const cost = 100;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          const targetRealmId = prov.ownerId;
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          next.realms[prev.playerRealmId].relations[targetRealmId] = Math.min(100, (next.realms[prev.playerRealmId].relations[targetRealmId] || 0) + 25);
          
          // Memory of help
          if (next.realms[targetRealmId].memory[prev.playerRealmId]) {
            next.realms[targetRealmId].memory[prev.playerRealmId].help += 20;
          }
          return next;
        });
        addLog(`Enviado um presente para ${gameState.realms[prov.ownerId].name}.`);
      } else {
        addLog("Ouro insuficiente.");
      }
    } else if (action === 'propose_pact') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      const relations = playerRealm.relations[targetId] || 0;
      if (relations > 10) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          if (!next.realms[prev.playerRealmId].pacts.includes(targetId)) {
            next.realms[prev.playerRealmId].pacts.push(targetId);
            next.realms[targetId].pacts.push(prev.playerRealmId);
          }
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          return next;
        });
        addLog(`Pacto de não-agressão assinado com ${gameState.realms[targetId].name}.`);
      } else {
        addLog(`${gameState.realms[targetId].name} recusou o pacto.`);
      }
    } else if (action === 'propose_alliance') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      const relations = playerRealm.relations[targetId] || 0;
      if (relations > 50) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          if (!next.realms[prev.playerRealmId].alliances.includes(targetId)) {
            next.realms[prev.playerRealmId].alliances.push(targetId);
            next.realms[targetId].alliances.push(prev.playerRealmId);
          }
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          return next;
        });
        addLog(`Aliança militar formada com ${gameState.realms[targetId].name}!`);
      } else {
        addLog(`${gameState.realms[targetId].name} recusou a aliança.`);
      }
    } else if (action === 'demand_tribute') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      const targetRealm = gameState.realms[targetId];
      if (playerRealm.relations[targetId] < 0) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          const tribute = Math.floor(targetRealm.gold * 0.2);
          next.realms[targetId].gold -= tribute;
          next.realms[prev.playerRealmId].gold += tribute;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          next.realms[targetId].relations[prev.playerRealmId] -= 30;
          if (next.realms[targetId].memory[prev.playerRealmId]) {
            next.realms[targetId].memory[prev.playerRealmId].betrayal += 20;
          }
          return next;
        });
        addLog(`Exigimos tributo de ${targetRealm.name}. Eles pagaram a contragosto.`);
      } else {
        addLog(`${targetRealm.name} riu da nossa exigência.`);
      }
    } else if (action === 'declare_war') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      if (playerRealm.wars.includes(targetId)) {
        addLog("Você já está em guerra com este reino.");
        return;
      }
      const truceTurn = playerRealm.memory[targetId]?.truces?.[targetId] || 0;
      if (gameState.turn < truceTurn) {
         addLog(`Você tem uma trégua com ${gameState.realms[targetId].name} até o turno ${truceTurn}.`);
         return; // OR we can let them break truce with huge penalties. Let's strictly block for now to keep simple.
      }
      
      setGameState(prev => {
         if (!prev) return prev;
         const next = { ...prev };
         const r = next.realms[prev.playerRealmId];
         const tr = next.realms[targetId];
         r.actionPoints -= ACTION_COSTS.diplomacy;
         
         r.wars.push(targetId);
         tr.wars.push(r.id);
         
         // Penalty for breaking pacts
         if (r.pacts.includes(targetId)) {
           r.pacts = r.pacts.filter(id => id !== targetId);
           tr.pacts = tr.pacts.filter(id => id !== r.id);
           tr.memory[r.id].betrayal += 50;
           r.relations[targetId] = -100;
           addLog(`TRAIÇÃO: Quebramos o pacto e declaramos guerra a ${tr.name}!`);
         } else {
           r.relations[targetId] = -100;
           addLog(`GUERRA: Declarada guerra a ${tr.name}! As trombetas cobram sangue!`);
         }
         
         // Penalty for breaking alliances
         if (r.alliances.includes(targetId)) {
           r.alliances = r.alliances.filter(id => id !== targetId);
           tr.alliances = tr.alliances.filter(id => id !== r.id);
           tr.memory[r.id].betrayal += 80;
         }
         return next;
      });
    } else if (action === 'offer_peace') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      const targetRealm = gameState.realms[targetId];
      // Check if enemy accepts peace
      const enemyMem = targetRealm.memory[playerRealm.id];
      if (enemyMem && enemyMem.warExhaustion > 30) {
        // they accept
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          const r = next.realms[prev.playerRealmId];
          const tr = next.realms[targetId];
          
          r.actionPoints -= ACTION_COSTS.diplomacy;
          r.wars = r.wars.filter(id => id !== targetId);
          tr.wars = tr.wars.filter(id => id !== r.id);
          
          r.memory[targetId].warExhaustion = 0;
          tr.memory[r.id].warExhaustion = 0;
          
          r.memory[targetId].truces[targetId] = next.turn + 10;
          tr.memory[r.id].truces[r.id] = next.turn + 10;
          
          addLog(`PAZ NEGOCIADA: A paz foi firmada com ${tr.name}.`);
          return next;
        });
      } else {
        setGameState(prev => {
           if (!prev) return prev;
           const next = { ...prev };
           next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
           return next;
        });
        addLog(`${targetRealm.name} recusa nossas ofertas de paz. A guerra continua!`);
      }
    } else if (action === 'break_pact') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      setGameState(prev => {
         if (!prev) return prev;
         const next = { ...prev };
         const targetId = prov.ownerId;
         const r = next.realms[prev.playerRealmId];
         const tr = next.realms[targetId];
         
         r.pacts = r.pacts.filter(id => id !== targetId);
         tr.pacts = tr.pacts.filter(id => id !== r.id);
         tr.memory[r.id].betrayal += 30;
         r.relations[targetId] -= 40;
         r.actionPoints -= ACTION_COSTS.diplomacy;
         addLog(`Denunciamos nosso pacto com ${tr.name}. Eles se lembrarão dessa ofensa.`);
         return next;
      });
    } else if (action === 'demand_vassalage') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      const targetId = prov.ownerId;
      const targetRealm = gameState.realms[targetId];
      const myProvinces = (Object.values(gameState.provinces) as Province[]).filter(p => p.ownerId === gameState.playerRealmId).length;
      const theirProvinces = (Object.values(gameState.provinces) as Province[]).filter(p => p.ownerId === targetId).length;
      
      if (myProvinces > theirProvinces * 3 && playerRealm.relations[targetId] < -20) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          if (!next.realms[prev.playerRealmId].vassals.includes(targetId)) {
            next.realms[prev.playerRealmId].vassals.push(targetId);
            next.realms[targetId].vassalOf = prev.playerRealmId;
          }
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          return next;
        });
        addLog(`${targetRealm.name} agora é nosso vassalo!`);
      } else {
        addLog(`${targetRealm.name} recusa-se a dobrar o joelho.`);
      }
    } else if (action === 'buy_food') {
      const cost = 25;
      const amount = 50;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].food += amount;
          return next;
        });
        addLog(`Comprado ${amount} de comida por ${cost} ouro.`);
      } else {
        addLog("Ouro insuficiente.");
      }
    } else if (action === 'sell_food') {
      const price = 15;
      const amount = 50;
      if (playerRealm.food >= amount) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold += price;
          next.realms[prev.playerRealmId].food -= amount;
          return next;
        });
        addLog(`Vendido ${amount} de comida por ${price} ouro.`);
      } else {
        addLog("Comida insuficiente.");
      }
    } else if (action === 'buy_materials') {
      const cost = 35;
      const amount = 25;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials += amount;
          return next;
        });
        addLog(`Comprado ${amount} de materiais por ${cost} ouro.`);
      } else {
        addLog("Ouro insuficiente.");
      }
    } else if (action === 'sell_materials') {
      const price = 20;
      const amount = 25;
      if (playerRealm.materials >= amount) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold += price;
          next.realms[prev.playerRealmId].materials -= amount;
          return next;
        });
        addLog(`Vendido ${amount} de materiais por ${price} ouro.`);
      } else {
        addLog("Materiais insuficientes.");
      }
    } else if (action === 'trade_route') {
      if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
        addLog("AP insuficiente.");
        return;
      }
      const targetId = prov.ownerId;
      const existingRoute = playerRealm.tradeRoutes.find(r => (r.fromProvinceId === selectedProvinceId && r.toProvinceId === targetId) || (r.fromProvinceId === targetId && r.toProvinceId === selectedProvinceId));
      
      if (existingRoute) {
        addLog("Rota comercial já existe.");
        return;
      }

      if (playerRealm.relations[targetId] > 20) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].tradeRoutes.push({ fromProvinceId: selectedProvinceId!, toProvinceId: targetId });
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          return next;
        });
        addLog(`Rota comercial estabelecida com ${gameState.realms[targetId].name}.`);
      } else {
        addLog(`${gameState.realms[targetId].name} não tem interesse em comércio conosco.`);
      }
    } else if (action === 'improve') {
      if (playerRealm.actionPoints < ACTION_COSTS.build) {
        addLog("Pontos de Ação insuficientes.");
        return;
      }
      if (playerRealm.gold >= 50) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].gold -= 50;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.build;
          next.provinces[selectedProvinceId].wealth += 1;
          return next;
        });
        addLog(`Economia melhorada em ${prov.name}.`);
      }
    }
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    playSound('turn');
    
    const prevState = gameState;
    const prevPlayerProvs = new Set((Object.values(prevState.provinces) as Province[]).filter(p => p.ownerId === prevState.playerRealmId).map(p => p.id));
    const prevWars = new Set(prevState.realms[prevState.playerRealmId].wars);

    let nextState = processAITurn(gameState);
    nextState = processEndOfTurn(nextState);
    
    // Calculate turn summary
    const playerRealm = nextState.realms[nextState.playerRealmId];
    const nextPlayerProvs = (Object.values(nextState.provinces) as Province[]).filter(p => p.ownerId === nextState.playerRealmId);
    const nextPlayerProvIds = new Set(nextPlayerProvs.map(p => p.id));

    const provincesGained = [...nextPlayerProvIds].filter(id => !prevPlayerProvs.has(id)).map(id => nextState.provinces[id].name);
    const provincesLost = [...prevPlayerProvs].filter(id => !nextPlayerProvIds.has(id)).map(id => nextState.provinces[id]?.name || 'Desconhecida');
    
    const nextWars = new Set(playerRealm.wars);
    const newWars = ([...nextWars] as string[]).filter(id => !prevWars.has(id)).map(id => nextState.realms[id]?.name || id);
    const peaceTreaties = ([...prevWars] as string[]).filter(id => !nextWars.has(id)).map(id => nextState.realms[id]?.name || id);

    const rebellionLogs = nextState.logs.filter(l => l.includes('REBELIÃO') || l.includes('MOTIM'));
    const lowLoyaltyProvs = nextPlayerProvs.filter(p => p.loyalty < 30).map(p => p.name);

    // Calculate income/maintenance
    let goldIncome = 0, foodIncome = 0, materialIncome = 0;
    let goldMaint = 0, foodMaint = 0;
    nextPlayerProvs.forEach(p => {
      const eff = p.population / p.maxPopulation;
      goldIncome += (p.wealth + (p.buildings.mines * BUILDING_PRODUCTION.mines)) * eff;
      foodIncome += (p.foodProduction + (p.buildings.farms * BUILDING_PRODUCTION.farms)) * eff;
      materialIncome += (p.materialProduction + (p.buildings.workshops * BUILDING_PRODUCTION.workshops)) * eff;
      goldMaint += p.army.infantry * UNIT_STATS.infantry.maintenance.gold + p.army.archers * UNIT_STATS.archers.maintenance.gold + p.army.cavalry * UNIT_STATS.cavalry.maintenance.gold;
      foodMaint += p.army.infantry * UNIT_STATS.infantry.maintenance.food + p.army.archers * UNIT_STATS.archers.maintenance.food + p.army.cavalry * UNIT_STATS.cavalry.maintenance.food;
    });

    const summary: TurnSummaryData = {
      goldIncome: Math.floor(goldIncome),
      goldMaintenance: Math.floor(goldMaint),
      goldNet: Math.floor(goldIncome - goldMaint),
      foodIncome: Math.floor(foodIncome),
      foodMaintenance: Math.floor(foodMaint),
      foodNet: Math.floor(foodIncome - foodMaint),
      materialsIncome: Math.floor(materialIncome),
      provincesGained,
      provincesLost,
      newWars,
      newTreaties: peaceTreaties, // Simplifying for summary
      events: nextState.currentEvent ? [nextState.currentEvent.description] : [],
      rebellionRisk: lowLoyaltyProvs
    };

    persistence.autoSave(nextState);
    setGameState(nextState);
    setTurnSummaryData(summary);
    setShowTurnSummary(true);
    addLog(`--- Turno ${nextState.turn} ---`);
    setActionState('idle');
    setActionSourceId(null);
  };

  const handleRestart = () => {
    setGameState(generateInitialState(MAP_WIDTH, MAP_HEIGHT, gameSettings));
    addLog("Bem-vindo a uma nova campanha no Medieval Realms!");
    setSelectedProvinceId(null);
    setActionState('idle');
    setActionSourceId(null);
    setShowMenu(false);
  };

  if (!gameState && !showMenu) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Carregando...</div>;

  if (showMenu) {
    return (
      <>
        <div className="h-screen w-screen parchment-bg flex flex-col items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-auto max-w-2xl w-full bg-[#2c1810]/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#d4af37] text-center relative overflow-hidden shrink-0"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Crown className="mx-auto text-[#d4af37] mb-4" size={56} />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#d4af37] mb-2 medieval-title tracking-widest uppercase drop-shadow-lg">
              Medieval Realms
            </h1>
            <p className="text-[#f5f2ed] text-base md:text-lg mb-6 font-serif italic opacity-80">
              "O destino de um império é forjado no gume da espada e no selo do pergaminho."
            </p>
            
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <div className="bg-black/40 p-4 rounded-xl border border-[#d4af37]/20 mb-2 text-left">
                <h3 className="text-[#d4af37] font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
                  <Settings size={14} /> Configurações
                </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#f5f2ed]/60 mb-1 uppercase">Vitória</label>
                  <select 
                    value={gameSettings.victoryCondition}
                    onChange={(e) => setGameSettings(prev => ({ ...prev, victoryCondition: e.target.value as VictoryCondition }))}
                    className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-2 py-1.5 text-sm text-white"
                  >
                    <option value="conquest">Conquista</option>
                    <option value="economic">Econômica</option>
                    <option value="vassalage">Vassalagem</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#f5f2ed]/60 mb-1 uppercase">Províncias</label>
                    <input 
                      type="number" 
                      min="5"
                      max="100"
                      value={gameSettings.numProvinces}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          const safeVal = Math.max(5, Math.min(100, val));
                          setGameSettings(prev => ({ ...prev, numProvinces: safeVal }));
                        } else {
                          setGameSettings(prev => ({ ...prev, numProvinces: 5 }));
                        }
                      }}
                      className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#f5f2ed]/60 mb-1 uppercase">Reinos</label>
                    <input 
                      type="number" 
                      min="1"
                      max="8"
                      value={gameSettings.numRealms}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setGameSettings(prev => ({ ...prev, numRealms: isNaN(val) ? 1 : val }));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        const safeVal = Math.max(1, Math.min(8, isNaN(val) ? 1 : val));
                        setGameSettings(prev => ({ ...prev, numRealms: safeVal }));
                      }}
                      className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {autosave && (
                <button 
                  onClick={() => {
                    setGameState(autosave.state);
                    setShowMenu(false);
                  }}
                  className="group relative bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] py-3 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#d4af37]/20"
                >
                  <Play size={20} fill="currentColor" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>Continuar Campanha</span>
                    <span className="text-[10px] font-normal opacity-70">Turno {autosave.state?.turn ?? 0}</span>
                  </div>
                </button>
              )}

              <button 
                onClick={startNewGame}
                className="group relative bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] py-3 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#d4af37]/20"
              >
                <Play size={20} fill="currentColor" />
                <span>Iniciar Conquista</span>
              </button>
              
              <button 
                onClick={() => setShowSaveModal(true)}
                className="bg-transparent hover:bg-white/5 text-[#f5f2ed] py-2 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border border-white/20 text-sm"
              >
                <Scroll size={18} />
                <span>Crônicas do Reino</span>
              </button>
              
              <button 
                onClick={() => setShowInstructionsModal(true)}
                className="bg-transparent hover:bg-white/5 text-[#f5f2ed] py-2 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border border-white/20 text-sm"
              >
                <Info size={18} />
                <span>Instruções</span>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-center gap-6 text-[#f5f2ed]/40 text-xs font-serif">
              <div className="flex items-center gap-1"><Shield size={12} /> Estratégia</div>
              <div className="flex items-center gap-1"><Swords size={12} /> Conquista</div>
              <div className="flex items-center gap-1"><Handshake size={12} /> Diplomacia</div>
            </div>
        </motion.div>
      </div>

      <SaveLoadModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        saves={persistence.listSaves()}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDeleteSave}
        canSave={false}
      />
      <InstructionsModal 
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />
      </>
    );
  }

  if (!gameState) return null;

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
      <div 
        className="relative flex gap-4 origin-center transition-transform duration-300 ease-out"
        style={{ width: 1420, height: 850, transform: `scale(${scale})` }}
      >
        <div className="flex-1 relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/5 cursor-grab active:cursor-grabbing"
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}>
          <div 
            className="w-full h-full transition-transform duration-500 ease-out origin-center flex items-center justify-center"
            style={{ 
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.5s ease-out'
            }}
          >
            <Map 
              gameState={gameState} 
              selectedProvinceId={selectedProvinceId}
              actionState={actionState}
              actionSourceId={actionSourceId}
              viewMode={viewMode}
              onProvinceClick={handleProvinceClick}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
            />
          </div>
          
          <Minimap 
            gameState={gameState}
            width={150}
            height={112}
            selectedProvinceId={selectedProvinceId}
            onProvinceClick={(id) => setSelectedProvinceId(id)}
          />

          {/* Logs Overlay */}
          {gameState && (
            <div className="absolute bottom-4 right-4 w-64 max-h-20 overflow-y-auto bg-black/40 backdrop-blur-sm border border-slate-700/50 rounded-lg p-2 text-[9px] text-slate-400 pointer-events-none font-serif opacity-70 hover:opacity-100 transition-opacity">
              {gameState.logs.slice(-3).map((log, i) => (
                <div key={i} className="mb-0.5 last:mb-0 leading-tight">{log}</div>
              ))}
            </div>
          )}
        </div>
        
        <div className="w-96">
          <HUD 
            gameState={gameState}
            selectedProvinceId={selectedProvinceId}
            actionState={actionState}
            actionSourceId={actionSourceId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAction={handleAction}
            onEndTurn={handleEndTurn}
            onSave={() => setShowSaveModal(true)}
            onMenu={() => setShowMenu(true)}
            onCancelAction={() => {
              setActionState('idle');
              setActionSourceId(null);
            }}
            zoom={zoom}
            onZoomChange={setZoom}
            onOpenChronicles={() => setShowChronicles(true)}
          />
        </div>

        <AnimatePresence>
          {showChronicles && (
            <ChroniclesModal 
              logs={gameState.logs} 
              onClose={() => setShowChronicles(false)} 
            />
          )}
        </AnimatePresence>
      </div>

      <GameOverModal 
        gameState={gameState}
        onRestart={handleRestart}
      />

      <SaveLoadModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        saves={persistence.listSaves()}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDeleteSave}
      />

      <InstructionsModal 
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
      />

      <TurnSummaryModal 
        isOpen={showTurnSummary}
        onClose={() => setShowTurnSummary(false)}
        data={turnSummaryData}
      />

      <CombatPreviewModal
        isOpen={showCombatPreview}
        onClose={() => {
          setShowCombatPreview(false);
          setCombatAttackerProvId(null);
          setCombatDefenderProvId(null);
          setCombatAttackingArmy(null);
        }}
        onConfirm={confirmAttack}
        attackerProv={combatAttackerProvId ? gameState.provinces[combatAttackerProvId] : null}
        defenderProv={combatDefenderProvId ? gameState.provinces[combatDefenderProvId] : null}
        attackingArmy={combatAttackingArmy}
      />

      <BattleResultModal
        isOpen={showBattleResult}
        onClose={() => {
          setShowBattleResult(false);
          setBattleResultData(null);
          setBattleResultMeta(null);
        }}
        result={battleResultData}
        attackerName={battleResultMeta?.attackerName || ''}
        defenderName={battleResultMeta?.defenderName || ''}
        provinceName={battleResultMeta?.provinceName || ''}
        conquered={battleResultMeta?.conquered || false}
      />
    </div>
    </ErrorBoundary>
  );
}
