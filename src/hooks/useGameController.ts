import { useState, useCallback } from 'react';
import { GameState, ActionType, Army, Province, Realm } from '../types';
import { generateInitialState } from '../logic/mapGeneration';
import { processEndOfTurn, findPath } from '../logic/turnLogic';
import { resolveCombat } from '../logic/combatLogic';
import { executeRecruitment, executeBuilding } from '../logic/economyLogic';
import { processAI } from '../logic/aiLogic';
import { persistence } from '../persistence';
import { useUI } from './useUI';

export function useGameController(gameState: GameState | null, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, ui: ReturnType<typeof useUI>) {
  
  const startNewGame = useCallback(() => {
    const state = generateInitialState(1280, 720, ui.gameSettings);
    setGameState(state);
    ui.setShowMenu(false);
    ui.showToast("Dê início à sua dinastia!", "success");
  }, [ui.gameSettings, setGameState, ui]);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, logs: [msg, ...prev.logs].slice(0, 100) };
    });
  }, [setGameState]);

  const handleEndTurn = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      
      const playerRealmPrior = prev.realms[prev.playerRealmId];
      
      // Process AI actions before turn end
      processAI(prev);
      
      const next = processEndOfTurn(prev);
      
      // Save auto-save
      persistence.saveAutoSave(next);
      
      const playerNext = next.realms[next.playerRealmId];
      ui.setTurnSummaryData({
        goldIncome: playerNext.goldIncome || 0,
        goldMaintenance: playerNext.goldMaintenance || 0,
        goldNet: playerNext.gold - playerRealmPrior.gold,
        foodIncome: playerNext.foodIncome || 0,
        foodMaintenance: playerNext.foodMaintenance || 0,
        foodNet: playerNext.food - playerRealmPrior.food,
        materialsIncome: playerNext.materialsIncome || 0,
        provincesGained: [],
        provincesLost: [],
        newWars: [],
        newTreaties: [],
        events: next.currentEvent ? [next.currentEvent.name] : [],
        rebellionRisk: []
      });
      ui.setShowTurnSummary(true);
      
      return next;
    });
  }, [setGameState, ui]);

  const handleAction = useCallback((type: ActionType, provinceId: string, extra?: any) => {
    if (!gameState) return;
    const realm = gameState.realms[gameState.playerRealmId];
    if (realm.actionPoints <= 0) {
      ui.showToast("Pontos de ação insuficientes!", "error");
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const p = next.provinces[provinceId];
      const r = next.realms[next.playerRealmId];

      if (type === 'recruit') {
        executeRecruitment(next, r, p);
        r.actionPoints -= 1;
      } else if (type === 'build') {
        const buildingType = extra as any;
        if (executeBuilding(next, r, p, buildingType)) {
          r.actionPoints -= 1;
        }
      }
      return next;
    });
  }, [gameState, setGameState, ui]);

  const handleProvinceClick = useCallback((id: string, wasDragging: boolean) => {
    if (wasDragging) return;
    
    if (ui.actionState === 'moving' && ui.actionSourceId) {
      const path = findPath(gameState!, ui.actionSourceId, id, gameState!.playerRealmId);
      if (path.length > 0) {
        setGameState(prev => {
           if (!prev) return prev;
           const next = {...prev};
           const src = next.provinces[ui.actionSourceId!];
           const order = {
             id: `march_${Date.now()}`,
             realmId: next.playerRealmId,
             currentProvId: ui.actionSourceId!,
             remainingPath: path,
             troops: ui.moveComposition,
             isScoutMission: false
           };
           src.army.infantry -= ui.moveComposition.infantry;
           src.army.archers -= ui.moveComposition.archers;
           src.army.cavalry -= ui.moveComposition.cavalry;
           src.troops = src.army.infantry + src.army.archers + src.army.cavalry + src.army.scouts;
           next.marchOrders.push(order);
           next.realms[next.playerRealmId].actionPoints -= 1;
           return next;
        });
        ui.setActionState('idle');
        ui.setActionSourceId(null);
      }
      return;
    }
    
    if (ui.actionState === 'attacking' && ui.actionSourceId) {
      const src = gameState!.provinces[ui.actionSourceId];
      if (src.neighbors.includes(id)) {
        ui.setCombatAttackerProvId(ui.actionSourceId);
        ui.setCombatDefenderProvId(id);
        ui.setCombatAttackingArmy({...src.army, scouts: 0});
        ui.setShowCombatPreview(true);
      }
      return;
    }

    ui.setSelectedProvinceId(id);
  }, [gameState, ui, setGameState]);

  const confirmAttack = useCallback(() => {
    if (!ui.combatAttackerProvId || !ui.combatDefenderProvId || !ui.combatAttackingArmy) return;
    
    setGameState(prev => {
      if (!prev) return prev;
      const next = {...prev};
      const atkProv = next.provinces[ui.combatAttackerProvId!];
      const defProv = next.provinces[ui.combatDefenderProvId!];
      
      const result = resolveCombat(ui.combatAttackingArmy!, defProv.army, defProv.terrain, defProv.defense);
      
      atkProv.army = result.attackerRemaining;
      atkProv.troops = atkProv.army.infantry + atkProv.army.archers + atkProv.army.cavalry + atkProv.army.scouts;
      
      defProv.army = result.defenderRemaining;
      defProv.troops = defProv.army.infantry + defProv.army.archers + defProv.army.cavalry + defProv.army.scouts;
      
      if (result.won) {
        defProv.ownerId = next.playerRealmId;
        defProv.loyalty = 40;
        defProv.recentlyConquered = 3;
        next.realms[next.playerRealmId].overextension += 10;
      }
      
      next.realms[next.playerRealmId].actionPoints -= 2;
      
      ui.setBattleResultData(result);
      ui.setBattleResultMeta({
        attackerName: next.realms[next.playerRealmId].name,
        defenderName: next.realms[defProv.ownerId]?.name || 'Neutral',
        provinceName: defProv.name,
        conquered: result.won
      });
      ui.setShowBattleResult(true);
      ui.setShowCombatPreview(false);
      ui.setActionState('idle');
      
      return next;
    });
  }, [ui, setGameState]);

  const handleSave = useCallback((name: string) => {
    if (!gameState) return;
    persistence.saveGame(gameState, name);
    ui.showToast("Jogo salvo!", "success");
  }, [gameState, ui]);

  const handleLoad = useCallback((id: string) => {
    const data = persistence.loadGame(id);
    if (data) {
      setGameState(data.state);
      ui.setShowMenu(false);
      ui.showToast("Partida carregada.", "info");
    }
  }, [setGameState, ui]);

  const handleDeleteSave = useCallback((id: string) => {
    persistence.deleteSave(id);
  }, []);

  const cancelMarchOrder = useCallback((id: string) => {
     setGameState(prev => {
        if(!prev) return prev;
        const next = {...prev};
        const order = next.marchOrders.find(o => o.id === id);
        if(!order) return prev;
        const prov = next.provinces[order.currentProvId];
        if(prov && prov.ownerId === order.realmId) {
          prov.army.infantry += order.troops.infantry;
          prov.army.archers += order.troops.archers;
          prov.army.cavalry += order.troops.cavalry;
          prov.army.scouts += order.troops.scouts;
          prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts;
        }
        next.marchOrders = next.marchOrders.filter(o => o.id !== id);
        return next;
     });
  }, [setGameState]);

  return {
    startNewGame,
    handleEndTurn,
    handleAction,
    handleProvinceClick,
    confirmAttack,
    handleSave,
    handleLoad,
    handleDeleteSave,
    cancelMarchOrder,
    addLog
  };
}
