import React, { useState, useEffect, useCallback } from 'react';
import { GameState, ActionType } from './types';
import { generateInitialState, processAITurn, processEndOfTurn, resolveCombat } from './gameLogic';
import { Map } from './components/Map';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const NUM_PROVINCES = 25;
const NUM_REALMS = 6;

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionType>('idle');
  const [actionSourceId, setActionSourceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<boolean>(true);

  const startNewGame = useCallback(() => {
    const initialState = generateInitialState(MAP_WIDTH, MAP_HEIGHT, NUM_PROVINCES, NUM_REALMS);
    setGameState(initialState);
    setLogs(initialState.logs);
    setSelectedProvinceId(null);
    setActionState('idle');
    setActionSourceId(null);
    setShowMenu(false);
  }, []);

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

    if (actionState === 'idle') {
      setSelectedProvinceId(id);
    } else if (actionState === 'moving') {
      if (actionSourceId) {
        const source = gameState.provinces[actionSourceId];
        const target = gameState.provinces[id];
        
        if (source.neighbors.includes(id) && target.ownerId === gameState.playerRealmId) {
          // Move troops
          const amount = Math.floor(source.troops / 2); // Simple: move half
          if (amount > 0) {
            setGameState(prev => {
              if (!prev) return prev;
              const next = { ...prev };
              next.provinces[actionSourceId].troops -= amount;
              next.provinces[id].troops += amount;
              return next;
            });
            addLog(`Moved ${amount} troops from ${source.name} to ${target.name}.`);
          }
        } else {
          addLog("Invalid move target. Must be an adjacent owned province.");
        }
      }
      setActionState('idle');
      setActionSourceId(null);
    } else if (actionState === 'trading') {
      if (actionSourceId) {
        const source = gameState.provinces[actionSourceId];
        const target = gameState.provinces[id];
        
        if (source.neighbors.includes(id)) {
          // Establish trade route
          const cost = 50;
          if (gameState.realms[gameState.playerRealmId].gold >= cost) {
            setGameState(prev => {
              if (!prev) return prev;
              const next = { ...prev };
              next.realms[prev.playerRealmId].gold -= cost;
              next.realms[prev.playerRealmId].tradeRoutes.push({ from: actionSourceId, to: id });
              return next;
            });
            addLog(`Established trade route between ${source.name} and ${target.name}.`);
          } else {
            addLog("Not enough gold to establish trade route.");
          }
        } else {
          addLog("Invalid trade target. Must be an adjacent province.");
        }
      }
      setActionState('idle');
      setActionSourceId(null);
    }
  };

  const handleAction = (action: 'recruit' | 'move' | 'attack' | 'improve' | 'diplomacy' | 'fortify' | 'build_farm' | 'build_mine' | 'build_workshop' | 'buy_food' | 'sell_food' | 'buy_materials' | 'sell_materials' | 'trade_route' | 'send_gift' | 'propose_pact' | 'propose_alliance', amount?: number) => {
    if (!gameState || !selectedProvinceId) return;
    
    const prov = gameState.provinces[selectedProvinceId];
    const playerRealm = gameState.realms[gameState.playerRealmId];

    if (action === 'recruit') {
      const recruitAmount = amount || 100;
      const cost = Math.ceil(recruitAmount / 10);
      
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.provinces[selectedProvinceId].troops += recruitAmount;
          return next;
        });
        addLog(`Recruited ${recruitAmount} troops in ${prov.name} for ${cost} Gold.`);
      } else {
        addLog("Not enough gold to recruit.");
      }
    } else if (action === 'buy_food') {
      const cost = 20;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].food += 50;
          return next;
        });
        addLog(`Bought 50 Food for ${cost} Gold.`);
      } else {
        addLog("Not enough gold to buy food.");
      }
    } else if (action === 'sell_food') {
      if (playerRealm.food >= 50) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].food -= 50;
          next.realms[prev.playerRealmId].gold += 10;
          return next;
        });
        addLog(`Sold 50 Food for 10 Gold.`);
      } else {
        addLog("Not enough food to sell.");
      }
    } else if (action === 'buy_materials') {
      const cost = 30;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials += 25;
          return next;
        });
        addLog(`Bought 25 Materials for ${cost} Gold.`);
      } else {
        addLog("Not enough gold to buy materials.");
      }
    } else if (action === 'sell_materials') {
      if (playerRealm.materials >= 25) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].materials -= 25;
          next.realms[prev.playerRealmId].gold += 15;
          return next;
        });
        addLog(`Sold 25 Materials for 15 Gold.`);
      } else {
        addLog("Not enough materials to sell.");
      }
    } else if (action === 'trade_route') {
      setActionState('trading');
      setActionSourceId(selectedProvinceId);
      addLog("Select an adjacent province to establish a trade route (Cost: 50 Gold).");
    } else if (action === 'send_gift') {
      const cost = 100;
      if (playerRealm.gold >= cost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          const targetRealmId = prov.ownerId;
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].relations[targetRealmId] = Math.min(100, (next.realms[prev.playerRealmId].relations[targetRealmId] || 0) + 25);
          return next;
        });
        addLog(`Sent a gift of 100 Gold to ${gameState.realms[prov.ownerId].name}. Relations improved.`);
      } else {
        addLog("Not enough gold to send a gift.");
      }
    } else if (action === 'propose_pact') {
      const targetRealmId = prov.ownerId;
      const relations = playerRealm.relations[targetRealmId] || 0;
      if (relations >= 20) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].pacts.push(targetRealmId);
          next.realms[targetRealmId].pacts.push(prev.playerRealmId);
          return next;
        });
        addLog(`Non-aggression pact signed with ${gameState.realms[targetRealmId].name}.`);
      } else {
        addLog(`${gameState.realms[targetRealmId].name} refuses. Relations must be at least 20.`);
      }
    } else if (action === 'propose_alliance') {
      const targetRealmId = prov.ownerId;
      const relations = playerRealm.relations[targetRealmId] || 0;
      if (relations >= 60) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].alliances.push(targetRealmId);
          next.realms[targetRealmId].alliances.push(prev.playerRealmId);
          return next;
        });
        addLog(`Alliance formed with ${gameState.realms[targetRealmId].name}!`);
      } else {
        addLog(`${gameState.realms[targetRealmId].name} refuses. Relations must be at least 60.`);
      }
    } else if (action === 'build_farm') {
      const cost = 100;
      const matCost = 50;
      if (playerRealm.gold >= cost && playerRealm.materials >= matCost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials -= matCost;
          next.provinces[selectedProvinceId].buildings.farms += 1;
          return next;
        });
        addLog(`Built a Farm in ${prov.name}.`);
      } else {
        addLog("Not enough Gold or Materials to build a Farm.");
      }
    } else if (action === 'build_mine') {
      const cost = 150;
      const matCost = 75;
      if (playerRealm.gold >= cost && playerRealm.materials >= matCost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials -= matCost;
          next.provinces[selectedProvinceId].buildings.mines += 1;
          return next;
        });
        addLog(`Built a Mine in ${prov.name}.`);
      } else {
        addLog("Not enough Gold or Materials to build a Mine.");
      }
    } else if (action === 'build_workshop') {
      const cost = 120;
      const matCost = 60;
      if (playerRealm.gold >= cost && playerRealm.materials >= matCost) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= cost;
          next.realms[prev.playerRealmId].materials -= matCost;
          next.provinces[selectedProvinceId].buildings.workshops += 1;
          return next;
        });
        addLog(`Built a Workshop in ${prov.name}.`);
      } else {
        addLog("Not enough Gold or Materials to build a Workshop.");
      }
    } else if (action === 'improve') {
      if (playerRealm.gold >= 50) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.realms[prev.playerRealmId].gold -= 50;
          next.provinces[selectedProvinceId].wealth += 1;
          return next;
        });
        addLog(`Improved economy in ${prov.name}.`);
      } else {
        addLog("Not enough gold to improve economy.");
      }
    } else if (action === 'fortify') {
      if (playerRealm.gold >= 75) {
        if (prov.defense < 5) {
          setGameState(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            next.realms[prev.playerRealmId].gold -= 75;
            next.provinces[selectedProvinceId].defense += 1;
            return next;
          });
          addLog(`Fortified ${prov.name}. Defense level is now ${prov.defense + 1}.`);
        } else {
          addLog(`${prov.name} is already at maximum defense.`);
        }
      } else {
        addLog("Not enough gold to fortify.");
      }
    } else if (action === 'move') {
      setActionState('moving');
      setActionSourceId(selectedProvinceId);
      addLog("Select an adjacent owned province to move troops to.");
    } else if (action === 'attack') {
      const ownedNeighbors = prov.neighbors.filter(nId => gameState.provinces[nId].ownerId === gameState.playerRealmId);
      if (ownedNeighbors.length > 0) {
        const strongestNeighborId = ownedNeighbors.sort((a, b) => gameState.provinces[b].troops - gameState.provinces[a].troops)[0];
        const source = gameState.provinces[strongestNeighborId];
        const attackingTroops = Math.floor(source.troops * 0.8);
        
        if (attackingTroops > 0) {
          addVisualEffect('battle', prov.center[0], prov.center[1]);
          setGameState(prev => {
            if (!prev) return prev;
            const next = { ...prev };
            next.provinces[strongestNeighborId].troops -= attackingTroops;
            
            const result = resolveCombat(attackingTroops, prov.troops, prov.terrain, prov.defense);
            
            if (result.won) {
              next.provinces[selectedProvinceId].ownerId = prev.playerRealmId;
              next.provinces[selectedProvinceId].troops = result.attackerRemaining;
              addLog(`Victory! Conquered ${prov.name}.`);
              
              // Attacking lowers relations
              next.realms[prev.playerRealmId].relations[prov.ownerId] -= 50;
              
              // Conquest effect
              setTimeout(() => addVisualEffect('conquest', prov.center[0], prov.center[1]), 500);
            } else {
              next.provinces[selectedProvinceId].troops = result.defenderRemaining;
              next.provinces[strongestNeighborId].troops += result.attackerRemaining;
              addLog(`Defeat! Failed to conquer ${prov.name}.`);
              
              // Siege effect: if attacker was strong but lost, reduce defense
              if (attackingTroops > prov.troops * 1.2 && next.provinces[selectedProvinceId].defense > 0) {
                next.provinces[selectedProvinceId].defense -= 1;
                addLog(`The siege of ${prov.name} failed, but the fortifications were damaged.`);
              }
              
              next.realms[prev.playerRealmId].relations[prov.ownerId] -= 25;
            }
            return next;
          });
        } else {
          addLog("Not enough troops to attack.");
        }
      } else {
        addLog("No adjacent owned provinces to attack from.");
      }
    } else if (action === 'diplomacy') {
      addLog("Diplomacy is currently simplified. Focus on conquest!");
    }
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    
    let nextState = processAITurn(gameState);
    nextState = processEndOfTurn(nextState);
    
    setGameState(nextState);
    setLogs(prev => [...prev.slice(-5), `--- Turn ${nextState.turn} ---`]);
    setActionState('idle');
    setActionSourceId(null);
  };

  const handleRestart = () => {
    setGameState(generateInitialState(MAP_WIDTH, MAP_HEIGHT, NUM_PROVINCES, NUM_REALMS));
    setLogs(["Welcome to a new campaign in Medieval Realms!"]);
    setSelectedProvinceId(null);
    setActionState('idle');
    setActionSourceId(null);
    setShowMenu(false);
  };

  if (!gameState && !showMenu) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans relative">
      {showMenu && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-amber-600/50 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
            <h1 className="text-4xl font-serif font-bold text-amber-500 mb-2">Medieval Realms</h1>
            <p className="text-slate-400 mb-8">Conquer the land, manage your economy, and crush your enemies.</p>
            
            <div className="space-y-4">
              <button 
                onClick={startNewGame}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
              >
                New Game
              </button>
              {gameState && (
                <button 
                  onClick={() => setShowMenu(false)}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
                >
                  Resume Game
                </button>
              )}
              <button 
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg shadow-lg transition-all active:scale-95"
                onClick={() => alert("Settings coming soon!")}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState && (
        <>
          {/* Main Game Area */}
          <div className="flex-1 flex flex-col relative">
            {/* Top Menu Bar */}
            <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
              <h1 className="text-xl font-serif font-bold text-slate-200">Medieval Realms</h1>
              <div className="flex gap-4">
                <button onClick={() => setShowMenu(true)} className="text-sm text-slate-400 hover:text-white transition-colors">Menu</button>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
              <Map 
                gameState={gameState}
                selectedProvinceId={selectedProvinceId}
                actionState={actionState}
                actionSourceId={actionSourceId}
                onProvinceClick={handleProvinceClick}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
              />
              
              {/* Logs Overlay */}
              <div className="absolute bottom-4 left-4 w-80 max-h-48 overflow-y-auto bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-sm text-slate-300 pointer-events-none">
                {logs.slice(-6).map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right HUD */}
          <HUD 
            gameState={gameState}
            selectedProvinceId={selectedProvinceId}
            actionState={actionState}
            actionSourceId={actionSourceId}
            onAction={handleAction}
            onEndTurn={handleEndTurn}
            onCancelAction={() => {
              setActionState('idle');
              setActionSourceId(null);
            }}
          />
          <GameOverModal gameState={gameState} onRestart={handleRestart} />
        </>
      )}
    </div>
  );
}
