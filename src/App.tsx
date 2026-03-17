import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ActionType, Province, Realm, VisualEffect, Army, UnitType, StrategicResource, ViewMode, GameSettings, VictoryCondition } from './types';
import { generateInitialState, processAITurn, processEndOfTurn, resolveCombat, UNIT_STATS, ACTION_COSTS } from './gameLogic';
import { persistence } from './persistence';
import { Map } from './components/Map';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { GameOverModal } from './components/GameOverModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, Crown, Scroll, Play, Info, Handshake, Settings, Save } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 750;
const NUM_PROVINCES = 25;
const NUM_REALMS = 6;

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionType>('idle');
  const [actionSourceId, setActionSourceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('political');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    numProvinces: 25,
    numRealms: 6,
    aiDifficulty: 'normal',
    resourceDensity: 'normal',
    victoryCondition: 'conquest'
  });

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
    const initialState = generateInitialState(MAP_WIDTH, MAP_HEIGHT, gameSettings);
    setGameState(initialState);
    setLogs(initialState.logs);
    setSelectedProvinceId(null);
    setActionState('idle');
    setActionSourceId(null);
    setShowMenu(false);
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
      setLogs(loadedState.logs);
      setShowMenu(false);
      setShowSaveModal(false);
      addLog("Jogo carregado com sucesso.");
    }
  };

  const handleDeleteSave = (id: string) => {
    persistence.deleteSave(id);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  // Cleanup visual effects
  useEffect(() => {
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

  const handleProvinceClick = (id: string) => {
    if (!gameState) return;
    playSound('click');

    if (actionState === 'idle') {
      setSelectedProvinceId(id);
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
            const next = { ...prev };
            const s = next.provinces[actionSourceId];
            const t = next.provinces[id];
            
            // Move half of each type
            const moveInf = Math.floor(s.army.infantry / 2);
            const moveArc = Math.floor(s.army.archers / 2);
            const moveCav = Math.floor(s.army.cavalry / 2);

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
    }
  };

  const handleAction = (action: 'recruit' | 'move' | 'attack' | 'improve' | 'diplomacy' | 'fortify' | 'build_farm' | 'build_mine' | 'build_workshop' | 'buy_food' | 'sell_food' | 'buy_materials' | 'sell_materials' | 'trade_route' | 'send_gift' | 'propose_pact' | 'propose_alliance' | 'demand_tribute' | 'demand_vassalage', unitType?: UnitType, amount?: number) => {
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
        const next = { ...prev };
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
    } else if (action === 'build_farm' || action === 'build_mine' || action === 'build_workshop') {
      playSound('build');
      if (playerRealm.actionPoints < ACTION_COSTS.build) {
        addLog("Pontos de Ação insuficientes para construir.");
        return;
      }

      let cost = 100;
      let matCost = 50;
      let buildingType: 'farms' | 'mines' | 'workshops' = 'farms';

      if (action === 'build_mine') {
        cost = 150; matCost = 75; buildingType = 'mines';
      } else if (action === 'build_workshop') {
        cost = 120; matCost = 60; buildingType = 'workshops';
      }

      if (playerRealm.gold >= cost && playerRealm.materials >= matCost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials -= matCost;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.build;
          next.provinces[selectedProvinceId].buildings[buildingType] += 1;
          return next;
        });
        addLog(`Construído um ${buildingType.slice(0, -1)} em ${prov.name}.`);
      } else {
        addLog("Ouro ou Materiais insuficientes para construir.");
      }
    } else if (action === 'fortify') {
      if (playerRealm.actionPoints < ACTION_COSTS.build) {
        addLog("Pontos de Ação insuficientes para fortificar.");
        return;
      }
      if (playerRealm.gold >= 75 && prov.defense < 5) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= 75;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.build;
          next.provinces[selectedProvinceId].defense += 1;
          return next;
        });
        addLog(`Fortificado ${prov.name}.`);
      } else {
        addLog("Não é possível fortificar mais ou ouro insuficiente.");
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

      const ownedNeighbors = prov.neighbors.filter(nId => gameState.provinces[nId].ownerId === gameState.playerRealmId);
      if (ownedNeighbors.length > 0) {
        const strongestNeighborId = ownedNeighbors.sort((a, b) => gameState.provinces[b].troops - gameState.provinces[a].troops)[0];
        const source = gameState.provinces[strongestNeighborId];
        
        const attackingArmy: Army = {
          infantry: Math.floor(source.army.infantry * 0.8),
          archers: Math.floor(source.army.archers * 0.8),
          cavalry: Math.floor(source.army.cavalry * 0.8)
        };
        
        const totalAttacking = attackingArmy.infantry + attackingArmy.archers + attackingArmy.cavalry;

        if (totalAttacking > 0) {
          addVisualEffect('battle', prov.center[0], prov.center[1]);
          setGameState(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            const s = next.provinces[strongestNeighborId];
            const t = next.provinces[selectedProvinceId];
            const r = next.realms[prev.playerRealmId];

            s.army.infantry -= attackingArmy.infantry;
            s.army.archers -= attackingArmy.archers;
            s.army.cavalry -= attackingArmy.cavalry;
            s.troops = s.army.infantry + s.army.archers + s.army.cavalry;
            
            r.actionPoints -= ACTION_COSTS.attack;

            const result = resolveCombat(attackingArmy, t.army, t.terrain, t.defense);
            
            if (result.won) {
              const oldOwnerId = t.ownerId;
              t.ownerId = prev.playerRealmId;
              t.army = result.attackerRemaining;
              t.troops = t.army.infantry + t.army.archers + t.army.cavalry;
              r.overextension = Math.min(100, r.overextension + 15);
              addLog(`Vitória! Conquistado ${prov.name}. Sobre-expansão aumentada.`);
              
              // Memory of aggression
              const targetRealm = next.realms[oldOwnerId];
              if (targetRealm.memory[prev.playerRealmId]) {
                targetRealm.memory[prev.playerRealmId].aggression += 30;
                targetRealm.memory[prev.playerRealmId].lastWarTurn = prev.turn;
              }
              
              next.realms[prev.playerRealmId].relations[oldOwnerId] -= 50;
              setTimeout(() => addVisualEffect('conquest', prov.center[0], prov.center[1]), 500);
            } else {
              t.army = result.defenderRemaining;
              t.troops = t.army.infantry + t.army.archers + t.army.cavalry;
              
              // Retreat survivors
              s.army.infantry += result.attackerRemaining.infantry;
              s.army.archers += result.attackerRemaining.archers;
              s.army.cavalry += result.attackerRemaining.cavalry;
              s.troops = s.army.infantry + s.army.archers + s.army.cavalry;
              
              addLog(`Derrota! Falha ao conquistar ${prov.name}.`);
              next.realms[prev.playerRealmId].relations[prov.ownerId] -= 25;
            }
            return next;
          });
        } else {
          addLog("Tropas insuficientes para atacar.");
        }
      } else {
        addLog("Nenhuma província adjacente de sua propriedade para atacar.");
      }
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
          next.realms[prev.playerRealmId].pacts.push(targetId);
          next.realms[targetId].pacts.push(prev.playerRealmId);
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
          next.realms[prev.playerRealmId].alliances.push(targetId);
          next.realms[targetId].alliances.push(prev.playerRealmId);
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
          const next = { ...prev };
          next.realms[prev.playerRealmId].vassals.push(targetId);
          next.realms[targetId].vassalOf = prev.playerRealmId;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          return next;
        });
        addLog(`${targetRealm.name} agora é nosso vassalo!`);
      } else {
        addLog(`${targetRealm.name} recusa-se a dobrar o joelho.`);
      }
    } else if (action === 'buy_food') {
      const cost = 20;
      const amount = 50;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].food += amount;
          return next;
        });
        addLog(`Comprado ${amount} de comida por ${cost} ouro.`);
      } else {
        addLog("Ouro insuficiente.");
      }
    } else if (action === 'sell_food') {
      const price = 10;
      const amount = 50;
      if (playerRealm.food >= amount) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold += price;
          next.realms[prev.playerRealmId].food -= amount;
          return next;
        });
        addLog(`Vendido ${amount} de comida por ${price} ouro.`);
      } else {
        addLog("Comida insuficiente.");
      }
    } else if (action === 'buy_materials') {
      const cost = 30;
      const amount = 25;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials += amount;
          return next;
        });
        addLog(`Comprado ${amount} de materiais por ${cost} ouro.`);
      } else {
        addLog("Ouro insuficiente.");
      }
    } else if (action === 'sell_materials') {
      const price = 15;
      const amount = 25;
      if (playerRealm.materials >= amount) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
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
      const existingRoute = playerRealm.tradeRoutes.find(r => (r.from === selectedProvinceId && r.to === targetId) || (r.from === targetId && r.to === selectedProvinceId));
      
      if (existingRoute) {
        addLog("Rota comercial já existe.");
        return;
      }

      if (playerRealm.relations[targetId] > 20) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].tradeRoutes.push({ from: selectedProvinceId!, to: targetId });
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
          const next = { ...prev };
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
    
    let nextState = processAITurn(gameState);
    nextState = processEndOfTurn(nextState);
    
    // Autosave
    persistence.autoSave(nextState);
    
    setGameState(nextState);
    setLogs(prev => [...prev.slice(-5), `--- Turno ${nextState.turn} ---`]);
    setActionState('idle');
    setActionSourceId(null);
  };

  const handleRestart = () => {
    setGameState(generateInitialState(MAP_WIDTH, MAP_HEIGHT, gameSettings));
    setLogs(["Bem-vindo a uma nova campanha no Medieval Realms!"]);
    setSelectedProvinceId(null);
    setActionState('idle');
    setActionSourceId(null);
    setShowMenu(false);
  };

  if (!gameState && !showMenu) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Carregando...</div>;

  if (showMenu) {
    return (
      <div className="min-h-screen parchment-bg flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-[#2c1810]/90 backdrop-blur-md p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#d4af37] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
          
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <Crown className="mx-auto text-[#d4af37] mb-6" size={80} />
          </motion.div>
          
          <h1 className="text-6xl font-serif font-bold text-[#d4af37] mb-4 medieval-title tracking-widest uppercase drop-shadow-lg">
            Medieval Realms
          </h1>
          <p className="text-[#f5f2ed] text-xl mb-12 font-serif italic opacity-80">
            "O destino de um império é forjado no gume da espada e no selo do pergaminho."
          </p>
          
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <div className="bg-black/40 p-6 rounded-2xl border border-[#d4af37]/20 mb-4 text-left">
              <h3 className="text-[#d4af37] font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                <Settings size={16} /> Configurações da Partida
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#f5f2ed]/60 mb-1 uppercase">Vitória</label>
                  <select 
                    value={gameSettings.victoryCondition}
                    onChange={(e) => setGameSettings(prev => ({ ...prev, victoryCondition: e.target.value as VictoryCondition }))}
                    className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-3 py-2 text-base text-white"
                  >
                    <option value="conquest">Conquista (70%)</option>
                    <option value="economic">Econômica (10k Ouro)</option>
                    <option value="vassalage">Vassalagem (50% Reinos)</option>
                    <option value="sandbox">Sandbox (Sem Fim)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#f5f2ed]/60 mb-1 uppercase">Províncias</label>
                    <input 
                      type="number" 
                      value={gameSettings.numProvinces}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, numProvinces: parseInt(e.target.value) }))}
                      className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-3 py-2 text-base text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#f5f2ed]/60 mb-1 uppercase">Reinos</label>
                    <input 
                      type="number" 
                      value={gameSettings.numRealms}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, numRealms: parseInt(e.target.value) }))}
                      className="w-full bg-[#1a0f0a] border border-[#d4af37]/30 rounded-lg px-3 py-2 text-base text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={startNewGame}
              className="group relative bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] py-4 px-8 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#d4af37]/20"
            >
              <Play size={24} fill="currentColor" />
              <span>Iniciar Conquista</span>
            </button>
            
            <button 
              onClick={() => setShowSaveModal(true)}
              className="bg-transparent hover:bg-white/5 text-[#f5f2ed] py-3 px-8 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border border-white/20"
            >
              <Scroll size={20} />
              <span>Crônicas do Reino</span>
            </button>
            
            <button className="bg-transparent hover:bg-white/5 text-[#f5f2ed] py-3 px-8 rounded-xl font-medium transition-all flex items-center justify-center gap-3 border border-white/20">
              <Info size={20} />
              <span>Instruções</span>
            </button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 flex justify-center gap-8 text-[#f5f2ed]/40 text-sm font-serif">
            <div className="flex items-center gap-2"><Shield size={14} /> Estratégia</div>
            <div className="flex items-center gap-2"><Swords size={14} /> Conquista</div>
            <div className="flex items-center gap-2"><Handshake size={14} /> Diplomacia</div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 overflow-hidden">
      <div className="relative flex gap-6 max-w-[1450px] w-full h-[850px]">
        <div className="flex-1 relative">
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
          
          <Minimap 
            gameState={gameState}
            width={150}
            height={112}
            onProvinceClick={(id) => setSelectedProvinceId(id)}
          />

          {/* Logs Overlay */}
          <div className="absolute bottom-4 right-4 w-80 max-h-48 overflow-y-auto bg-black/60 backdrop-blur border border-slate-700 rounded-lg p-3 text-[10px] text-slate-300 pointer-events-none font-serif">
            {logs.slice(-8).map((log, i) => (
              <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
            ))}
          </div>
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
            onCancelAction={() => {
              setActionState('idle');
              setActionSourceId(null);
            }}
          />
        </div>
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
    </div>
  );
}
