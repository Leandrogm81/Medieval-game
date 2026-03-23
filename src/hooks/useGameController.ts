import React, { useCallback } from 'react';
import { GameState, Province, Realm, Army, UnitType, ActionType, MarchOrder, GameSettings, War } from '../types';
import { generateInitialState, processEndOfTurn, resolveCombat, findPath, ACTION_COSTS, UNIT_STATS, BUILDING_STATS } from '../gameLogic';
import { persistence } from '../persistence';

export function useGameController(
  gameState: GameState | null,
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>,
  ui: any // useUI return type
) {
  
  const addLog = useCallback((msg: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, logs: [...prev.logs, msg] };
    });
  }, [setGameState]);

  const addVisualEffect = useCallback((type: 'battle' | 'conquest' | 'trade', x: number, y: number) => {
    setGameState(prev => {
      if (!prev) return prev;
      const newEffect = {
        id: `effect_${Date.now()}_${Math.random()}`,
        type, x, y,
        duration: 2000,
        startTime: Date.now()
      };
      return { ...prev, visualEffects: [...prev.visualEffects, newEffect] };
    });
  }, [setGameState]);

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
      const initialState = generateInitialState(1000, 750, ui.gameSettings);
      setGameState(initialState);
      ui.setSelectedProvinceId(null);
      ui.setActionState('idle');
      ui.setActionSourceId(null);
      ui.setShowMenu(false);
    } catch (error) {
      console.error("Failed to start new game:", error);
      addLog("Erro ao iniciar novo jogo.");
    }
  }, [ui.gameSettings, setGameState, ui, addLog]);

  const handleSave = (name: string) => {
    if (!gameState) return;
    persistence.saveGame(gameState, name);
    addLog(`Jogo salvo: ${name}`);
  };

  const handleLoad = (id: string) => {
    const loadedState = persistence.loadSave(id);
    if (loadedState) {
      setGameState(loadedState);
      ui.setShowMenu(false);
      ui.setShowSaveModal(false);
      addLog("Jogo carregado com sucesso.");
    }
  };

  const handleDeleteSave = (id: string) => {
    persistence.deleteSave(id);
    if (id === 'autosave') {
      ui.setAutosave(null);
    }
    ui.setUpdateTrigger((prev: number) => prev + 1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    ui.setIsDragging(true);
    ui.setDragStart({ x: e.clientX - ui.panOffset.x, y: e.clientY - ui.panOffset.y });
    ui.setHasDragged(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ui.isDragging) return;
    const newX = e.clientX - ui.dragStart.x;
    const newY = e.clientY - ui.dragStart.y;
    
    if (Math.abs(newX - ui.panOffset.x) > 5 || Math.abs(newY - ui.panOffset.y) > 5) {
      ui.setHasDragged(true);
    }
    
    ui.setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    ui.setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      ui.setIsDragging(true);
      const touch = e.touches[0];
      ui.setDragStart({ x: touch.clientX - ui.panOffset.x, y: touch.clientY - ui.panOffset.y });
      ui.setHasDragged(false);
    } else if (e.touches.length === 2) {
      // Pinch start
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      (ui as any)._lastPinchDist = d;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && ui.isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - ui.dragStart.x;
      const newY = touch.clientY - ui.dragStart.y;
      
      if (Math.abs(newX - ui.panOffset.x) > 5 || Math.abs(newY - ui.panOffset.y) > 5) {
        ui.setHasDragged(true);
      }
      ui.setPanOffset({ x: newX, y: newY });
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if ((ui as any)._lastPinchDist) {
        const delta = d - (ui as any)._lastPinchDist;
        const zoomDelta = delta * 0.01;
        ui.setZoom(Math.min(3, Math.max(0.4, ui.zoom + zoomDelta)));
      }
      (ui as any)._lastPinchDist = d;
    }
  };

  const handleTouchEnd = () => {
    ui.setIsDragging(false);
    (ui as any)._lastPinchDist = null;
  };

  const handleProvinceClick = (id: string, hasDragged: boolean) => {
    if (!gameState) return;
    if (hasDragged) return;
    ui.setSelectedProvinceId(id);
    playSound('click');

    if (ui.actionState === 'idle') {
      // nothing extra
    } else if (ui.actionState === 'moving' || ui.actionState === 'routing') {
      if (ui.actionSourceId) {
        const source = gameState.provinces[ui.actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.move) {
          addLog('Pontos de Ação insuficientes para mover.');
          ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]); return;
        }

        const path = findPath(gameState, ui.actionSourceId, id, gameState.playerRealmId, false);
        if (path.length === 0) {
          addLog('Destino inalcançável pelos seus territórios. Use o modo de rota para batedores.');
          ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]); return;
        }

        const totalComp = ui.moveComposition.infantry + ui.moveComposition.archers + ui.moveComposition.cavalry + ui.moveComposition.scouts;
        if (totalComp <= 0) {
          addLog('Selecione a quantidade de tropas antes de mover.');
          return;
        }

        if (ui.moveComposition.infantry > source.army.infantry ||
            ui.moveComposition.archers > source.army.archers ||
            ui.moveComposition.cavalry > source.army.cavalry ||
            ui.moveComposition.scouts > source.army.scouts) {
          addLog('Tropas insuficientes para o movimento selecionado.');
          return;
        }

        if (path.length === 1) {
          if (target.ownerId !== 'neutral' && target.ownerId !== gameState.playerRealmId) {
            addLog(`Ação inválida: Use "Atacar" para entrar em território inimigo.`);
            ui.setActionState('idle'); ui.setActionSourceId(null);
            return;
          }

          ui.triggerMarchAnimation(source.center, target.center, ui.moveComposition);
          
          setGameState(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
            const s = next.provinces[ui.actionSourceId!];
            const t = next.provinces[id];
            
            s.army.infantry -= ui.moveComposition.infantry;
            s.army.archers  -= ui.moveComposition.archers;
            s.army.cavalry  -= ui.moveComposition.cavalry;
            s.army.scouts   -= ui.moveComposition.scouts;
            s.troops = s.army.infantry + s.army.archers + s.army.cavalry + s.army.scouts;
            
            const isNeutral = t.ownerId === 'neutral';
            if (isNeutral) {
              t.ownerId = prev.playerRealmId;
              t.loyalty = 50;
              t.army = { ...ui.moveComposition };
            } else {
              t.army.infantry += ui.moveComposition.infantry;
              t.army.archers  += ui.moveComposition.archers;
              t.army.cavalry  += ui.moveComposition.cavalry;
              t.army.scouts   += ui.moveComposition.scouts;
            }
            t.troops = t.army.infantry + t.army.archers + t.army.cavalry + t.army.scouts;
            
            next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.move;
            return next;
          });
          
          addVisualEffect(target.ownerId === 'neutral' ? 'conquest' : 'trade', target.center[0], target.center[1]);
          ui.showToast(target.ownerId === 'neutral' 
            ? `CONQUISTA: ${target.name} agora é nossa!` 
            : `Movimento para ${target.name} concluído.`, 'success');
          addLog(target.ownerId === 'neutral' 
            ? `CONQUISTA: ${source.name} expandiu o reino para ${target.name}!` 
            : `Tropas movidas de ${source.name} para ${target.name}.`);
        } else {
          const order: MarchOrder = {
            id: `march_${Date.now()}`,
            realmId: gameState.playerRealmId,
            currentProvId: ui.actionSourceId,
            remainingPath: path,
            troops: { ...ui.moveComposition },
            isScoutMission: false,
          };
          setGameState(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
            const s = next.provinces[ui.actionSourceId!];
            s.army.infantry -= ui.moveComposition.infantry;
            s.army.archers  -= ui.moveComposition.archers;
            s.army.cavalry  -= ui.moveComposition.cavalry;
            s.army.scouts   -= ui.moveComposition.scouts;
            s.troops = s.army.infantry + s.army.archers + s.army.cavalry + s.army.scouts;
            next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.move;
            if (!next.marchOrders) next.marchOrders = [];
            next.marchOrders.push(order);
            return next;
          });
          addLog(`Ordem de marcha criada: ${path.length} turno(s) até ${target.name}.`);
        }
      }
      ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]);
      ui.setMoveComposition({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
      ui.setSelectingMoveComposition(false);
    } else if (ui.actionState === 'dispatching_scouts') {
      if (ui.actionSourceId) {
        const source = gameState.provinces[ui.actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.move) {
          addLog('Pontos de Ação insuficientes para despachar batedores.');
          ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]); return;
        }

        const scoutsToSend = ui.moveComposition.scouts > 0 ? ui.moveComposition.scouts : source.army.scouts;
        if (scoutsToSend <= 0) {
          addLog('Sem batedores nesta província.');
          ui.setActionState('idle'); ui.setActionSourceId(null); return;
        }

        const path = findPath(gameState, ui.actionSourceId, id, gameState.playerRealmId, true);
        if (path.length === 0) {
          addLog('Nenhum caminho encontrado para os batedores.');
          ui.setActionState('idle'); ui.setActionSourceId(null); return;
        }

        if (playerRealm.wars.includes(target.ownerId)) {
          ui.showToast(`Batedores recusam ir para ${target.name} (território inimigo em guerra)!`, 'error');
          addLog(`Batedores não podem espiar reinos inimigos em guerra direta.`);
          ui.setActionState('idle'); ui.setActionSourceId(null); return;
        }

        const order: MarchOrder = {
          id: `scout_${Date.now()}`,
          realmId: gameState.playerRealmId,
          currentProvId: ui.actionSourceId,
          remainingPath: path,
          troops: { infantry: 0, archers: 0, cavalry: 0, scouts: scoutsToSend },
          isScoutMission: true,
        };
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          const s = next.provinces[ui.actionSourceId!];
          s.army.scouts -= scoutsToSend;
          s.troops = s.army.infantry + s.army.archers + s.army.cavalry + s.army.scouts;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.move;
          if (!next.marchOrders) next.marchOrders = [];
          next.marchOrders.push(order);
          return next;
        });
        addLog(`${scoutsToSend} batedores despachados para ${target.name} (${path.length} turno(s)).`);
      }
      ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]);
      ui.setMoveComposition({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
    } else if (ui.actionState === 'attacking') {
      if (ui.actionSourceId) {
        const source = gameState.provinces[ui.actionSourceId];
        const target = gameState.provinces[id];
        const playerRealm = gameState.realms[gameState.playerRealmId];

        if (playerRealm.actionPoints < ACTION_COSTS.attack) {
          addLog("Pontos de Ação insuficientes para atacar.");
          ui.setActionState('idle'); ui.setActionSourceId(null);
          return;
        }

        if (source.neighbors.includes(id) && target.ownerId !== gameState.playerRealmId) {
          if (!playerRealm.wars.includes(target.ownerId)) {
             addLog(`Você precisa declarar guerra a ${gameState.realms[target.ownerId].name} antes de atacar!`);
          } else {
             const attackingArmy: Army = {
               infantry: Math.floor(source.army.infantry * 0.8),
               archers: Math.floor(source.army.archers * 0.8),
               cavalry: Math.floor(source.army.cavalry * 0.8),
               scouts: 0,
             };
             const totalAttacking = attackingArmy.infantry + attackingArmy.archers + attackingArmy.cavalry;
             if (totalAttacking > 0) {
               ui.setCombatAttackerProvId(ui.actionSourceId);
               ui.setCombatDefenderProvId(id);
               ui.setCombatAttackingArmy(attackingArmy);
               ui.setShowCombatPreview(true);
             } else {
               addLog("Tropas insuficientes na província de origem para atacar.");
             }
          }
        } else {
          addLog("Alvo inválido! Deve ser uma província inimiga adjacente.");
        }
      }
      ui.setActionState('idle'); ui.setActionSourceId(null);
    }
  };

  const cancelMarchOrder = (orderId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      const order = (next.marchOrders || []).find(o => o.id === orderId);
      if (!order) return prev;
      const prov = next.provinces[order.currentProvId];
      if (prov && (order.isScoutMission || prov.ownerId === next.playerRealmId)) {
        prov.army.infantry += order.troops.infantry;
        prov.army.archers  += order.troops.archers;
        prov.army.cavalry  += order.troops.cavalry;
        prov.army.scouts   += order.troops.scouts;
        prov.troops = prov.army.infantry + prov.army.archers + prov.army.cavalry + prov.army.scouts;
        next.logs.push(`Ordem de marcha cancelada. Tropas retornaram a ${prov.name}.`);
      }
      next.marchOrders = next.marchOrders.filter(o => o.id !== orderId);
      return next;
    });
  };

  const confirmAttack = () => {
    if (!gameState || !ui.combatAttackerProvId || !ui.combatDefenderProvId || !ui.combatAttackingArmy) return;
    playSound('combat');

    const target = gameState.provinces[ui.combatDefenderProvId];
    const playerRealm = gameState.realms[gameState.playerRealmId];
    const defenderRealm = gameState.realms[target.ownerId];

    addVisualEffect('battle', target.center[0], target.center[1]);

    const effectiveDefense = Math.max(0, target.defense - (target.siegeDamage || 0));
    const result = resolveCombat(ui.combatAttackingArmy, target.army, target.terrain, effectiveDefense);

    ui.setBattleResultData(result);
    ui.setBattleResultMeta({
      attackerName: playerRealm.name,
      defenderName: defenderRealm?.name || 'Desconhecido',
      provinceName: target.name,
      conquered: result.won,
    });
    ui.setShowBattleResult(true);

    setGameState(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
      const s = next.provinces[ui.combatAttackerProvId!];
      const t = next.provinces[ui.combatDefenderProvId!];
      const r = next.realms[prev.playerRealmId];

      s.army.infantry -= ui.combatAttackingArmy!.infantry;
      s.army.archers -= ui.combatAttackingArmy!.archers;
      s.army.cavalry -= ui.combatAttackingArmy!.cavalry;
      s.army.scouts -= (ui.combatAttackingArmy!.scouts || 0);
      s.troops = s.army.infantry + s.army.archers + s.army.cavalry + s.army.scouts;
      r.actionPoints -= ACTION_COSTS.attack;

      if (result.won) {
        const oldOwnerId = t.ownerId;
        const oldOwner = next.realms[oldOwnerId];
        t.ownerId = r.id;
        t.army = result.attackerRemaining;
        t.troops = t.army.infantry + t.army.archers + t.army.cavalry + (t.army.scouts || 0);
        t.siegeDamage = 0;

        const totalDefRem = result.defenderRemaining.infantry + result.defenderRemaining.archers + result.defenderRemaining.cavalry;
        if (totalDefRem > 0) {
          const retreatOptions = t.neighbors.map(nId => next.provinces[nId]).filter(p => p.ownerId === oldOwnerId);
          if (retreatOptions.length > 0) {
            const rp = retreatOptions.sort((a, b) => b.troops - a.troops)[0];
            rp.army.infantry += result.defenderRemaining.infantry;
            rp.army.archers += result.defenderRemaining.archers;
            rp.army.cavalry += result.defenderRemaining.cavalry;
            rp.army.scouts += (result.defenderRemaining.scouts || 0);
            rp.troops = rp.army.infantry + rp.army.archers + rp.army.cavalry + rp.army.scouts;
          }
        }

        next.logs.push(`CONQUISTA: ${r.name} tomou ${t.name}!`);
        r.overextension = Math.min(100, r.overextension + 15);
        t.recentlyConquered = 10;
        t.loyalty = 30;

        if (oldOwner && oldOwner.capitalId === t.id) {
          const remaining = (Object.values(next.provinces) as Province[]).filter(p => p.ownerId === oldOwnerId && p.id !== t.id);
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
        t.army = result.defenderRemaining;
        t.troops = t.army.infantry + t.army.archers + t.army.cavalry + (t.army.scouts || 0);
        s.army.infantry += result.attackerRemaining.infantry;
        s.army.archers += result.attackerRemaining.archers;
        s.army.cavalry += result.attackerRemaining.cavalry;
        s.army.scouts += (result.attackerRemaining.scouts || 0);
        s.troops = s.army.infantry + s.army.archers + s.army.cavalry + s.army.scouts;
        if (t.defense > (t.siegeDamage || 0)) { t.siegeDamage = (t.siegeDamage || 0) + 1; }
      }
      return next;
    });
    ui.setShowCombatPreview(false);
    ui.setCombatAttackerProvId(null);
    ui.setCombatDefenderProvId(null);
    ui.setCombatAttackingArmy(null);
  };

  const handleAction = (action: ActionType | string, unitType?: UnitType, amount?: number) => {
    if (!gameState || !ui.selectedProvinceId) return;
    const prov = gameState.provinces[ui.selectedProvinceId];
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

      const statsWithReq = stats as any;
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
        const p = next.provinces[ui.selectedProvinceId!];
        const r = next.realms[prev.playerRealmId];
        r.gold -= goldCost; r.food -= foodCost; r.materials -= materialsCost; r.actionPoints -= ACTION_COSTS.recruit;
        p.population -= popCost; p.army[unitType] += recruitAmount;
        p.troops = p.army.infantry + p.army.archers + p.army.cavalry + (p.army.scouts || 0);
        return next;
      });
      addLog(`Recrutado ${recruitAmount} ${unitType === 'infantry' ? 'Infantaria' : unitType === 'archers' ? 'Arqueiros' : unitType === 'cavalry' ? 'Cavalaria' : 'Batedores'} em ${prov.name}.`);
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
          const r = next.realms[prev.playerRealmId];
          const p = next.provinces[ui.selectedProvinceId!];
          r.gold -= cost; r.materials -= matCost; r.actionPoints -= ACTION_COSTS.build;
          if (buildingType === 'fortify') { p.defense += 1; } else { p.buildings[buildingType as 'farms'] += 1; }
          return next;
        });
        const buildingNames: any = { farms: 'Fazenda', mines: 'Mina', workshops: 'Oficina', courts: 'Tribunal', fortify: 'Fortificação' };
        ui.showToast(`${buildingNames[buildingType]} ${isFortify ? 'concluída' : 'construída'}!`, 'success');
        addLog(`${buildingNames[buildingType]} ${isFortify ? 'concluída' : 'construída'} em ${prov.name}.`);
      } else {
        addLog("Recursos insuficientes para construir.");
      }
    } else if (action === 'buy_food' || action === 'sell_food' || action === 'buy_materials' || action === 'sell_materials') {
      const type = action.split('_')[1] as 'food' | 'materials';
      const isBuy = action.startsWith('buy');
      const amount = 50; // Aligned with HUD
      const price = type === 'food' ? 30 : 50; // Aligned with HUD

      if (isBuy) {
        if (playerRealm.gold >= price) {
          setGameState(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
            next.realms[prev.playerRealmId].gold -= price;
            next.realms[prev.playerRealmId][type] += amount;
            return next;
          });
          ui.showToast(`Comprado ${amount} de ${type === 'food' ? 'alimento' : 'materiais'}!`, 'success');
          addLog(`MERCADO: Comprado ${amount} de ${type === 'food' ? 'alimento' : 'materiais'} por ${price} de ouro.`);
        } else { 
          ui.showToast("Ouro insuficiente!", "error");
          addLog("MERCADO: Ouro insuficiente no tesouro."); 
        }
      } else {
        if (playerRealm[type] >= amount) {
          const sellPrice = Math.floor(price * 0.7);
          setGameState(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
            next.realms[prev.playerRealmId][type] -= amount;
            next.realms[prev.playerRealmId].gold += sellPrice;
            return next;
          });
          ui.showToast(`Vendido ${amount} de ${type === 'food' ? 'alimento' : 'materiais'}!`, 'success');
          addLog(`MERCADO: Vendido ${amount} de ${type === 'food' ? 'alimento' : 'materiais'} por ${sellPrice} de ouro.`);
        } else { 
          ui.showToast(`${type === 'food' ? 'Alimento' : 'Materiais'} insuficiente!`, "error");
          addLog(`MERCADO: Você não tem ${amount} de ${type === 'food' ? 'alimento' : 'materiais'} para vender.`); 
        }
      }
    } else if (['send_gift', 'propose_pact', 'propose_alliance', 'demand_tribute', 'demand_vassalage', 'declare_war', 'offer_peace', 'break_pact', 'trade_route'].includes(action)) {
       handleDiplomacyAction(action as any);
    }
  };

  const handleDiplomacyAction = (action: ActionType | 'trade_route') => {
    if (!gameState || !ui.selectedProvinceId) return;
    const targetProv = gameState.provinces[ui.selectedProvinceId];
    const targetRealmId = targetProv.ownerId;
    const playerRealm = gameState.realms[gameState.playerRealmId];

    if (targetRealmId === 'neutral') {
       ui.showToast("Territórios neutros podem ser conquistados movendo tropas para eles.", "info");
       addLog("DIPLOMACIA: Ação inválida para território neutro. Use 'Mover' para conquistar.");
       return;
    }
    if (targetRealmId === playerRealm.id) {
       addLog("DIPLOMACIA: Você não pode realizar ações diplomáticas com seu próprio reino.");
       return;
    }

    const targetRealm = gameState.realms[targetRealmId];
    if (playerRealm.actionPoints < ACTION_COSTS.diplomacy) {
       addLog("Pontos de Ação insuficientes para diplomacia.");
       return;
    }

    if (action === 'declare_war') {
      if (playerRealm.wars.includes(targetRealmId)) { addLog("Vocês já estão em guerra!"); return; }
      
      // Check for Truce
      const truceTurn = playerRealm.memory[targetRealmId]?.truces?.[targetRealmId];
      if (truceTurn && gameState.turn < truceTurn) {
        addLog(`TRÉGUA: Você não pode declarar guerra a ${targetRealm.name} até o turno ${truceTurn}.`);
        return;
      }

      setGameState(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
        
        // Create formal War object
        const newWar: War = {
          id: `war_${Date.now()}`,
          attackerId: prev.playerRealmId,
          defenderId: targetRealmId,
          startedAtTurn: prev.turn,
          warScore: 0,
          attackerExhaustion: 0,
          defenderExhaustion: 0
        };
        
        if (!next.activeWars) next.activeWars = [];
        next.activeWars.push(newWar);
        
        next.realms[prev.playerRealmId].wars.push(targetRealmId);
        next.realms[targetRealmId].wars.push(prev.playerRealmId);
        next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
        next.realms[prev.playerRealmId].relations[targetRealmId] -= 50;
        next.realms[targetRealmId].relations[prev.playerRealmId] -= 50;
        return next;
      });
      addLog(`GUERRA: Você declarou guerra formal a ${targetRealm.name}!`);
      return;
    }

    if (action === 'trade_route') {
      if (playerRealm.gold < 50) { addLog("Ouro insuficiente para abrir rota comercial (Custo: 50)."); return; }
      const myProv = (Object.values(gameState.provinces) as Province[]).find(p => p.ownerId === playerRealm.id);
      if (myProv) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
          next.realms[prev.playerRealmId].tradeRoutes.push({ fromProvinceId: myProv.id, toProvinceId: ui.selectedProvinceId! });
          next.realms[prev.playerRealmId].gold -= 50;
          next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
          next.realms[prev.playerRealmId].relations[targetRealmId] += 10;
          return next;
        });
        addLog(`Rota comercial estabelecida com ${targetRealm.name}.`);
      }
      return;
    }

    let success = false;
    let msg = "";
    const rel = playerRealm.relations[targetRealmId] || 0;

    switch(action) {
      case 'send_gift': if(playerRealm.gold >= 100) { success = true; msg = `Presente enviado a ${targetRealm.name}. Relações +20.`; } break;
      case 'propose_pact': if(rel > 20) { success = true; msg = `Pacto de não agressão aceito por ${targetRealm.name}.`; } break;
      case 'propose_alliance': if(rel > 50) { success = true; msg = `Aliança formal firmada com ${targetRealm.name}!`; } break;
      case 'offer_peace': if(playerRealm.wars.includes(targetRealmId)) { success = true; msg = `${targetRealm.name} aceitou sua proposta de trégua.`; } break;
      case 'demand_vassalage': 
        const ourPower = Object.values(gameState.provinces).filter(p => p.ownerId === playerRealm.id).length;
        const theirPower = Object.values(gameState.provinces).filter(p => p.ownerId === targetRealmId).length;
        if(ourPower > theirPower * 3 && rel > 0) { success = true; msg = `${targetRealm.name} agora é seu vassalo sob proteção armada!`; } break;
    }

    if (success) {
      setGameState(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
        const pr = next.realms[prev.playerRealmId];
        const tr = next.realms[targetRealmId];
        pr.actionPoints -= ACTION_COSTS.diplomacy;
        if(action === 'send_gift') { pr.gold -= 100; pr.relations[targetRealmId] = Math.min(100, (pr.relations[targetRealmId] || 0) + 20); tr.relations[prev.playerRealmId] = Math.min(100, (tr.relations[prev.playerRealmId] || 0) + 20); }
        if(action === 'propose_pact') { pr.pacts.push(targetRealmId); tr.pacts.push(prev.playerRealmId); }
        if(action === 'propose_alliance') { pr.alliances.push(targetRealmId); tr.alliances.push(prev.playerRealmId); }
        if(action === 'offer_peace') { 
          pr.wars = pr.wars.filter(id => id !== targetRealmId); 
          tr.wars = tr.wars.filter(id => id !== prev.playerRealmId);
          next.activeWars = (next.activeWars || []).filter(w => 
            !((w.attackerId === prev.playerRealmId && w.defenderId === targetRealmId) ||
              (w.attackerId === targetRealmId && w.defenderId === prev.playerRealmId))
          );
          // Set Truce
          if (!pr.memory[targetRealmId]) pr.memory[targetRealmId] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: prev.turn, warExhaustion: 0, truces: {} };
          if (!tr.memory[prev.playerRealmId]) tr.memory[prev.playerRealmId] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: prev.turn, warExhaustion: 0, truces: {} };
          pr.memory[targetRealmId].truces[targetRealmId] = prev.turn + 15;
          tr.memory[prev.playerRealmId].truces[prev.playerRealmId] = prev.turn + 15;
        }
        if(action === 'demand_vassalage') { pr.vassals.push(targetRealmId); tr.vassalOf = prev.playerRealmId; }
        return next;
      });
      ui.showToast(msg, 'success');
      addLog(`DIPLOMACIA: ${msg}`);
    } else {
      ui.showToast(`${targetRealm.name} recusou sua proposta.`, 'error');
      addLog(`DIPLOMACIA: ${targetRealm.name} recusou sua proposta.`);
      setGameState(prev => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev)) as typeof prev;
        next.realms[prev.playerRealmId].actionPoints -= ACTION_COSTS.diplomacy;
        return next;
      });
    }
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    playSound('turn');
    
    // Summary of player state before turn
    const playerRealmPrior = gameState.realms[gameState.playerRealmId];
    const provincesPrior = Object.values(gameState.provinces).filter(p => p.ownerId === gameState.playerRealmId).map(p => p.id);

    // AI process turns
    const stateAfterAI = JSON.parse(JSON.stringify(gameState)) as GameState;
    Object.keys(stateAfterAI.realms).forEach(id => {
      if (id !== stateAfterAI.playerRealmId) {
        processEndOfTurn(stateAfterAI); // Note: This is simplified, usually each AI acts
      }
    });

    const nextState = processEndOfTurn(gameState);
    
    // Prepare turn summary
    const playerNext = nextState.realms[nextState.playerRealmId];
    const provincesAfter = Object.values(nextState.provinces).filter(p => p.ownerId === nextState.playerRealmId).map(p => p.id);
    const gained = provincesAfter.filter(id => !provincesPrior.includes(id)).map(id => nextState.provinces[id].name);
    const lost = provincesPrior.filter(id => !provincesAfter.includes(id)).map(id => nextState.provinces[id].name);
    const risk = Object.values(nextState.provinces)
      .filter(p => p.ownerId === nextState.playerRealmId && p.loyalty < 30)
      .map(p => p.name);

    ui.setTurnSummaryData({
      goldIncome: playerNext.goldIncome || 0,
      goldMaintenance: playerNext.goldMaintenance || 0,
      goldNet: playerNext.gold - playerRealmPrior.gold,
      foodIncome: playerNext.foodIncome || 0,
      foodMaintenance: playerNext.foodMaintenance || 0,
      foodNet: playerNext.food - playerRealmPrior.food,
      materialsIncome: playerNext.materialsIncome || 0,
      provincesGained: gained,
      provincesLost: lost,
      newWars: playerNext.wars.filter(w => !playerRealmPrior.wars.includes(w)).map(id => nextState.realms[id]?.name || 'Reino Misterioso'),
      newTreaties: [],
      events: nextState.currentEvent ? [nextState.currentEvent.name] : [],
      rebellionRisk: risk
    });
    
    setGameState(nextState);
    persistence.autoSave(nextState);
    ui.setAutosave(persistence.loadAutoSave());
    ui.setShowTurnSummary(true);
    ui.setSelectedProvinceId(null);
  };

  return {
    addLog,
    addVisualEffect,
    playSound,
    startNewGame,
    handleSave,
    handleLoad,
    handleDeleteSave,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleProvinceClick,
    cancelMarchOrder,
    confirmAttack,
    handleAction,
    handleEndTurn
  };
}
