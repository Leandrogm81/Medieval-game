import { useCallback, useEffect, useRef } from 'react';
import { GameState, ActionType, Army, DiplomacyAction, CallToArmsRequest } from '../types';
import { generateInitialState } from '../logic/mapGeneration';
import { processEndOfTurn, findPath } from '../logic/turnLogic';
import { resolveCombat } from '../logic/combatLogic';
import {
  executeRecruitmentWithComposition,
  executeBuilding,
  executeDisband,
  executeTradeExchange,
  massAssimilate,
  massBuildCourts,
  massBuildFarms,
  massBuildMines,
  massBuildWorkshops,
  massInvest,
  MassActionType
} from '../logic/economyLogic';
import { processAI } from '../logic/aiLogic';
import { ACTION_COSTS, DIPLOMACY_ACTION_COSTS } from '../logic/game-constants';
import {
  playBuildSound,
  playEndTurnSound,
  playRecruitSound,
  playWarDeclaredSound
} from '../logic/sfxLogic';
import {
  canDeclareWar,
  canDemandTribute,
  canImproveRelations,
  canOfferTribute,
  canProposeAlliance,
  canProposeDefensivePact,
  canProposeNAP,
  canSendInsult,
  declareWar,
  demandTribute,
  improveRelations,
  offerTribute,
  proposeAlliance,
  proposeDefensivePact,
  proposeNonAggressionPact,
  resolveCallToArms,
  sendInsult,
  autoResolveCallToArms
} from '../logic/diplomacyLogic';
import { persistence } from '../persistence';
import { useUI } from './useUI';
import { deepClone } from '../utils/deepClone';

export function useGameController(gameState: GameState | null, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, ui: ReturnType<typeof useUI>) {
  const timeoutIds = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => window.clearTimeout(id));
      timeoutIds.current = [];
    };
  }, []);

  const startNewGame = useCallback(() => {
    ui.setIsGenerating(true);
    const safetyTimeout = window.setTimeout(() => {
      ui.setIsGenerating(false);
      ui.showToast("Erro ao gerar o mapa. Tente novamente.", "error");
    }, 5000);
    timeoutIds.current.push(safetyTimeout);

    const generationTimeout = window.setTimeout(() => {
      try {
        const state = generateInitialState(1280, 720, ui.gameSettings);
        setGameState(state);
        ui.setShowMenu(false);
        ui.showToast("Dê início à sua dinastia!", "success");
      } catch (error) {
        console.error('Erro ao gerar estado inicial:', error);
        ui.showToast("Erro ao gerar o mapa. Tente novamente.", "error");
      } finally {
        window.clearTimeout(safetyTimeout);
        timeoutIds.current = timeoutIds.current.filter(id => id !== safetyTimeout && id !== generationTimeout);
        ui.setIsGenerating(false);
      }
    }, 400);
    timeoutIds.current.push(generationTimeout);
  }, [ui, setGameState]);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, logs: [msg, ...prev.logs].slice(0, 100) };
    });
  }, [setGameState]);

  const handleEndTurn = useCallback(() => {
    playEndTurnSound();
    setGameState(prev => {
      if (!prev) return prev;

      const playerRealmPrior = prev.realms[prev.playerRealmId];

      // CRITICAL: Clone BEFORE passing to mutator functions
      const stateToProcess = deepClone(prev);

      processAI(stateToProcess);

      const next = processEndOfTurn(stateToProcess);

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
        materialsNet: playerNext.materials - playerRealmPrior.materials,
        provincesGained: [],
        provincesLost: [],
        newWars: [],
        newTreaties: [],
        events: next.currentEvent ? [next.currentEvent.name] : [],
        rebellionRisk: []
      });
      ui.setShowTurnSummary(true);

      if (next.pendingBattleResults && next.pendingBattleResults.length > 0) {
        const battle = next.pendingBattleResults[0];
        ui.setBattleResultData(battle.result);
        ui.setBattleResultMeta({
          attackerName: battle.attackerName,
          defenderName: battle.defenderName,
          provinceName: battle.provinceName,
          conquered: battle.conquered
        });
        ui.setShowBattleResult(true);
      }

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

    if (type === 'recruit') {
      const clone = deepClone(gameState);
      const p = clone.provinces[provinceId];
      const r = clone.realms[clone.playerRealmId];
      
      // Use the recruit composition from UI state
      const desired = ui.recruitComposition;
      const { recruited, success } = executeRecruitmentWithComposition(clone, r, p, desired);
      
      if (success) {
        r.actionPoints -= ACTION_COSTS.recruit;
        setGameState(clone);
        playRecruitSound();
        
        // Build toast message
        const parts: string[] = [];
        if (recruited.infantry > 0) parts.push(`${recruited.infantry} infantaria`);
        if (recruited.archers > 0) parts.push(`${recruited.archers} arqueiros`);
        if (recruited.cavalry > 0) parts.push(`${recruited.cavalry} cavalaria`);
        if (recruited.scouts > 0) parts.push(`${recruited.scouts} batedores`);
        ui.showToast(`Recrutado: ${parts.join(', ')}!`, "success");
        
        // Reset composition after recruitment
        ui.setRecruitComposition({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
      } else {
        ui.showToast("Recursos insuficientes para recrutar!", "error");
      }
      return;
    }

    if (type === 'build') {
      const clone = deepClone(gameState);
      const p = clone.provinces[provinceId];
      const r = clone.realms[clone.playerRealmId];
      const buildingType = extra as any;
      if (executeBuilding(clone, r, p, buildingType)) {
        r.actionPoints -= ACTION_COSTS.build;
        setGameState(clone);
        playBuildSound();
        ui.showToast(`Edifício construído!`, "success");
      } else {
        ui.showToast("Recursos insuficientes para construir!", "error");
      }
      return;
    }

    if (type === 'trade') {
      const clone = deepClone(gameState);
      const r = clone.realms[clone.playerRealmId];
      const payload = extra as { from: 'gold' | 'food' | 'materials'; to: 'gold' | 'food' | 'materials'; amount: number } | undefined;
      if (!payload) {
        ui.showToast("Selecione uma troca válida.", "error");
        return;
      }

      const success = executeTradeExchange(clone, r, payload.from, payload.to, payload.amount);
      if (success) {
        setGameState(clone);
        ui.showToast(`Troca concluída: ${payload.amount} ${payload.from} -> ${payload.to}.`, "success");
      } else {
        ui.showToast("Não foi possível executar a troca.", "error");
      }
      return;
    }

    // Fallback for other action types
    setGameState(prev => {
      if (!prev) return prev;
      const next = deepClone(prev);
      return next;
    });
  }, [gameState, setGameState, ui]);

  const handleMassAction = useCallback((actionType: MassActionType) => {
    if (!gameState) return;

    const clone = deepClone(gameState);
    const realm = clone.realms[clone.playerRealmId];
    if (!realm) return;

    let count = 0;
    let costGold = 0;
    let costMaterials = 0;
    let actionLabel = '';

    switch (actionType) {
      case 'assimilate': {
        const result = massAssimilate(clone, realm.id);
        count = result.count;
        costGold = result.cost;
        actionLabel = 'Assimilação em massa';
        break;
      }
      case 'invest': {
        const result = massInvest(clone, realm.id);
        count = result.count;
        costGold = result.cost;
        actionLabel = 'Investimento em massa';
        break;
      }
      case 'buildFarms': {
        const result = massBuildFarms(clone, realm.id);
        count = result.count;
        costGold = result.costGold;
        costMaterials = result.costMaterials;
        actionLabel = 'Construção de farms em massa';
        break;
      }
      case 'buildMines': {
        const result = massBuildMines(clone, realm.id);
        count = result.count;
        costGold = result.costGold;
        costMaterials = result.costMaterials;
        actionLabel = 'Construção de mines em massa';
        break;
      }
      case 'buildWorkshops': {
        const result = massBuildWorkshops(clone, realm.id);
        count = result.count;
        costGold = result.costGold;
        costMaterials = result.costMaterials;
        actionLabel = 'Construção de workshops em massa';
        break;
      }
      case 'buildCourts': {
        const result = massBuildCourts(clone, realm.id);
        count = result.count;
        costGold = result.costGold;
        costMaterials = result.costMaterials;
        actionLabel = 'Construção de courts em massa';
        break;
      }
      default:
        return;
    }

    setGameState(clone);
    setTimeout(() => {
      const costParts = [`${costGold}g`];
      if (costMaterials > 0) costParts.push(`${costMaterials}m`);
      ui.showToast(`${actionLabel} concluída em ${count} províncias. Custo: ${costParts.join(' ')}.`, count > 0 ? 'success' : 'info');
    }, 0);
  }, [gameState, setGameState, ui]);

  const handleDiplomacyAction = useCallback((action: DiplomacyAction, payload?: { amount?: number }) => {
    if (!gameState) return;

    const targetRealmId = ui.selectedDiplomacyTargetId;
    if (!targetRealmId) {
      ui.showToast('Selecione um reino para diplomacia.', 'error');
      return;
    }

    const playerRealm = gameState.realms[gameState.playerRealmId];
    const targetRealm = gameState.realms[targetRealmId];
    if (!playerRealm || !targetRealm) {
      ui.showToast('Reino alvo não encontrado.', 'error');
      return;
    }

    const cost = DIPLOMACY_ACTION_COSTS[action];
    if ((playerRealm.actionPoints ?? 0) < cost) {
      ui.showToast('Pontos de ação insuficientes.', 'error');
      return;
    }

    const amount = Math.max(1, payload?.amount ?? 50);
    const clone = deepClone(gameState) as GameState & { pendingCallToArms?: CallToArmsRequest[] };
    const clonePlayer = clone.realms[clone.playerRealmId];
    const cloneTarget = clone.realms[targetRealmId];
    if (!clonePlayer || !cloneTarget) {
      ui.showToast('Reino alvo não encontrado.', 'error');
      return;
    }

    let toastMessage = '';
    let toastType: 'success' | 'error' | 'info' = 'success';
    let shouldClose = false;

    switch (action) {
      case 'alliance': {
        const validation = canProposeAlliance(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível propor aliança.', 'error');
          return;
        }
        proposeAlliance(clone, clone.playerRealmId, targetRealmId);
        const accepted = clonePlayer.alliances.includes(targetRealmId);
        toastMessage = accepted
          ? `Aliança selada com ${cloneTarget.name}.`
          : `${cloneTarget.name} recusou a aliança.`;
        toastType = accepted ? 'success' : 'error';
        shouldClose = accepted;
        break;
      }
      case 'nonAggressionPact': {
        const validation = canProposeNAP(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível propor pacto de não agressão.', 'error');
          return;
        }
        proposeNonAggressionPact(clone, clone.playerRealmId, targetRealmId);
        const accepted = clonePlayer.nonAggressionPacts.includes(targetRealmId);
        toastMessage = accepted
          ? `NAP firmado com ${cloneTarget.name}.`
          : `${cloneTarget.name} recusou o NAP.`;
        toastType = accepted ? 'success' : 'error';
        shouldClose = accepted;
        break;
      }
      case 'defensivePact': {
        const validation = canProposeDefensivePact(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível propor pacto defensivo.', 'error');
          return;
        }
        proposeDefensivePact(clone, clone.playerRealmId, targetRealmId);
        const accepted = clonePlayer.defensivePacts.includes(targetRealmId);
        toastMessage = accepted
          ? `Pacto defensivo firmado com ${cloneTarget.name}.`
          : `${cloneTarget.name} recusou o pacto defensivo.`;
        toastType = accepted ? 'success' : 'error';
        shouldClose = accepted;
        break;
      }
      case 'improveRelations': {
        const validation = canImproveRelations(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível melhorar relações.', 'error');
          return;
        }
        const result = improveRelations(clone, clone.playerRealmId, targetRealmId);
        toastMessage = `Relações com ${cloneTarget.name} melhoraram em ${result.delta}.`;
        toastType = 'success';
        break;
      }
      case 'sendInsult': {
        const validation = canSendInsult(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível enviar insulto.', 'error');
          return;
        }
        const result = sendInsult(clone, clone.playerRealmId, targetRealmId);
        toastMessage = `Relações com ${cloneTarget.name} pioraram em ${Math.abs(result.delta)}.`;
        toastType = 'info';
        break;
      }
      case 'offerTribute': {
        const validation = canOfferTribute(clone, clone.playerRealmId, targetRealmId, amount);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível oferecer tributo.', 'error');
          return;
        }
        offerTribute(clone, clone.playerRealmId, targetRealmId, amount);
        const accepted = !!clonePlayer.tributeTo[targetRealmId];
        toastMessage = accepted
          ? `Tributo de ${amount} ouro aceito por ${cloneTarget.name}.`
          : `${cloneTarget.name} recusou o tributo.`;
        toastType = accepted ? 'success' : 'error';
        shouldClose = accepted;
        break;
      }
      case 'demandTribute': {
        const validation = canDemandTribute(clone, clone.playerRealmId, targetRealmId, amount);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível exigir tributo.', 'error');
          return;
        }
        const result = demandTribute(clone, clone.playerRealmId, targetRealmId, amount);
        toastMessage = result.accepted
          ? `Tributo de ${amount} ouro exigido de ${cloneTarget.name}.`
          : `${cloneTarget.name} rejeitou a exigência.`;
        toastType = result.accepted ? 'success' : 'error';
        shouldClose = result.accepted;
        break;
      }
      case 'declareWar': {
        const validation = canDeclareWar(clone, clone.playerRealmId, targetRealmId);
        if (!validation.valid) {
          ui.showToast(validation.reason || 'Não foi possível declarar guerra.', 'error');
          return;
        }

        const warResult = declareWar(clone, clone.playerRealmId, targetRealmId);
        clone.pendingCallToArms = warResult.callsToResolve;

        const playerCalls = warResult.callsToResolve.filter(call => call.calledRealmId === gameState.playerRealmId);
        const aiCalls = warResult.callsToResolve.filter(call => call.calledRealmId !== gameState.playerRealmId);

        aiCalls.forEach(call => {
          const accepted = autoResolveCallToArms(clone, call);
          resolveCallToArms(clone, call.id, accepted);
        });

        clonePlayer.actionPoints = Math.max(0, (clonePlayer.actionPoints ?? 0) - cost);
        delete clone.pendingCallToArms;
        playWarDeclaredSound();
        setGameState(clone);
        ui.setPendingCallToArms(playerCalls);
        ui.setShowCallToArmsModal(playerCalls.length > 0);
        ui.setShowDiplomacyModal(false);
        setTimeout(() => ui.showToast(`Guerra declarada contra ${targetRealm.name}.`, 'success'), 0);
        return;
      }
      default:
        return;
    }

    clonePlayer.actionPoints = Math.max(0, (clonePlayer.actionPoints ?? 0) - cost);
    setGameState(clone);
    if (shouldClose) {
      ui.setShowDiplomacyModal(false);
    }
    setTimeout(() => ui.showToast(toastMessage, toastType), 0);
  }, [gameState, ui, setGameState]);

  const handleCallToArmsResponse = useCallback((requestId: string, accepted: boolean) => {
    if (!gameState) return;

    const currentQueue = ui.pendingCallToArms;
    const request = currentQueue.find(item => item.id === requestId);
    if (!request) return;

    const clone = deepClone(gameState) as GameState & { pendingCallToArms?: CallToArmsRequest[] };
    clone.pendingCallToArms = [...currentQueue];
    resolveCallToArms(clone, requestId, accepted);
    delete clone.pendingCallToArms;
    setGameState(clone);

    const remaining = currentQueue.filter(item => item.id !== requestId);
    ui.setPendingCallToArms(remaining);
    ui.setShowCallToArmsModal(remaining.length > 0);
    setTimeout(() => {
      ui.showToast(
        accepted
          ? `${gameState.realms[request.calledRealmId]?.name || 'Reino'} entrou na guerra.`
          : `${gameState.realms[request.calledRealmId]?.name || 'Reino'} recusou o chamado.`,
        accepted ? 'success' : 'info'
      );
    }, 0);
  }, [gameState, ui, setGameState]);

  const handleDisband = useCallback((provinceId: string) => {
    if (!gameState) return;
    const realm = gameState.realms[gameState.playerRealmId];
    if (realm.actionPoints <= 0) {
      ui.showToast("Pontos de ação insuficientes!", "error");
      return;
    }

    const totalToDisband = ui.disbandComposition.infantry + ui.disbandComposition.archers +
                           ui.disbandComposition.cavalry + ui.disbandComposition.scouts;
    if (totalToDisband <= 0) {
      ui.showToast("Selecione pelo menos uma tropa para dispensar!", "error");
      return;
    }

    const clone = deepClone(gameState);
    const p = clone.provinces[provinceId];
    const r = clone.realms[clone.playerRealmId];

    const { disbanded, success } = executeDisband(clone, r, p, ui.disbandComposition);

    if (success) {
      r.actionPoints -= 1;
      setGameState(clone);

      const parts: string[] = [];
      if (disbanded.infantry > 0) parts.push(`${disbanded.infantry} infantaria`);
      if (disbanded.archers > 0) parts.push(`${disbanded.archers} arqueiros`);
      if (disbanded.cavalry > 0) parts.push(`${disbanded.cavalry} cavalaria`);
      if (disbanded.scouts > 0) parts.push(`${disbanded.scouts} batedores`);

      ui.showToast(`Dispensado: ${parts.join(', ')} — tropas retornaram à população.`, "success");
      ui.setDisbandComposition({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
      ui.setIsDisbandMode(false);
    }
  }, [gameState, setGameState, ui]);

  const handleProvinceClick = useCallback((id: string, wasDragging: boolean) => {
    if (wasDragging) return;

    if (ui.actionState === 'moving' && ui.actionSourceId) {
      // Don't allow marching to the source province
      if (id === ui.actionSourceId) return;

      const sourceProvince = gameState!.provinces[ui.actionSourceId];
      if (!sourceProvince) return;

      // Check if total troops to move is > 0
      const totalTroops = ui.moveComposition.infantry + ui.moveComposition.archers + ui.moveComposition.cavalry + ui.moveComposition.scouts;
      if (totalTroops <= 0) {
        ui.showToast("Selecione pelo menos uma tropa para marchar!", "error");
        return;
      }

      const path = findPath(gameState!, ui.actionSourceId, id, gameState!.playerRealmId);
      if (path.length > 0) {
        setGameState(prev => {
          if (!prev) return prev;
          const next = deepClone(prev);
          const src = next.provinces[ui.actionSourceId!];
          if (!src || !next.realms[next.playerRealmId]) return prev;
          const order = {
            id: `march_${Date.now()}`,
            realmId: next.playerRealmId,
            currentProvId: ui.actionSourceId!,
            destinationId: id,
            remainingPath: path,
            troops: { ...ui.moveComposition },
            kind: 'move' as const
          };
          src.army.infantry -= ui.moveComposition.infantry;
          src.army.archers -= ui.moveComposition.archers;
          src.army.cavalry -= ui.moveComposition.cavalry;
          src.army.scouts -= ui.moveComposition.scouts;
          src.troops = src.army.infantry + src.army.archers + src.army.cavalry + src.army.scouts;
          next.marchOrders.push(order);
          next.realms[next.playerRealmId].actionPoints -= ACTION_COSTS.move;

          // Trigger march animation
          const from = src.center as [number, number];
          const destProv = next.provinces[id];
          const to = destProv ? (destProv.center as [number, number]) : from;
          ui.triggerMarchAnimation(from, to, ui.moveComposition, 'move');

          ui.setActionState('idle');
          ui.setActionSourceId(null);
          ui.setPreviewPath([]);
          ui.setActionBannerMessage(null);
          ui.setSelectingMoveComposition(false);
          ui.setMoveComposition({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
          return next;
        });
        // Use setTimeout to ensure toast is shown after React state batch
        setTimeout(() => ui.showToast(`Tropas marchando para ${gameState!.provinces[id].name}!`, "success"), 0);
      } else {
        setTimeout(() => ui.showToast("Destino inacessível! Apenas províncias vizinhas ou conectadas por território amigo.", "error"), 0);
      }
      return;
    }

    if (ui.actionState === 'attacking' && ui.actionSourceId) {
      const src = gameState!.provinces[ui.actionSourceId];
      if (!src) return;

      // BUG FIX: Não permitir atacar províncias próprias
      const targetProv = gameState!.provinces[id];
      if (!targetProv) return;
      if (targetProv.ownerId === gameState!.playerRealmId) {
        ui.showToast("Você não pode atacar suas próprias províncias!", "error");
        return;
      }

      if (src.neighbors.includes(id)) {
        ui.setCombatAttackerProvId(ui.actionSourceId);
        ui.setCombatDefenderProvId(id);
        ui.setCombatAttackingArmy({ ...src.army, scouts: 0 });
        ui.setShowCombatPreview(true);
        ui.setActionBannerMessage(null);
      }
      return;
    }

    ui.setSelectedProvinceId(id);
  }, [gameState, ui, setGameState]);

  const confirmAttack = useCallback(() => {
    if (!ui.combatAttackerProvId || !ui.combatDefenderProvId || !ui.combatAttackingArmy) return;

    setGameState(prev => {
      if (!prev) return prev;
      const next = deepClone(prev);
      const atkProv = next.provinces[ui.combatAttackerProvId!];
      const defProv = next.provinces[ui.combatDefenderProvId!];
      if (!atkProv || !defProv || !next.realms[next.playerRealmId]) return prev;

      const sentArmy = ui.combatAttackingArmy!;
      const path = findPath(next, ui.combatAttackerProvId!, ui.combatDefenderProvId!, next.playerRealmId);
      if (path.length === 0) return prev;
      const order = {
        id: `march_${Date.now()}`,
        realmId: next.playerRealmId,
        currentProvId: ui.combatAttackerProvId!,
        destinationId: ui.combatDefenderProvId!,
        remainingPath: path,
        troops: { ...sentArmy },
        kind: 'attack' as const
      };

      atkProv.army = {
        infantry: Math.max(0, atkProv.army.infantry - sentArmy.infantry),
        archers: Math.max(0, atkProv.army.archers - sentArmy.archers),
        cavalry: Math.max(0, atkProv.army.cavalry - sentArmy.cavalry),
        scouts: atkProv.army.scouts
      };
      atkProv.troops = atkProv.army.infantry + atkProv.army.archers + atkProv.army.cavalry + atkProv.army.scouts;
      next.marchOrders.push(order);
      next.realms[next.playerRealmId].actionPoints -= ACTION_COSTS.attack;

      const from = atkProv.center as [number, number];
      const to = defProv.center as [number, number];
      ui.triggerMarchAnimation(from, to, sentArmy, 'attack');

      ui.setShowBattleResult(false);
      ui.setShowCombatPreview(false);
      ui.setActionState('idle');
      ui.setActionSourceId(null);
      ui.setPreviewPath([]);
      ui.setActionBannerMessage(null);
      ui.showToast('Ataque enviado. O combate será resolvido na chegada.', 'info');

      return next;
    });
  }, [ui, setGameState]);

  const handleSave = useCallback((name: string) => {
    if (!gameState) return;
    persistence.saveGame(name, gameState);
    ui.showToast("Jogo salvo!", "success");
  }, [gameState, ui]);

  const handleQuickSave = useCallback(() => {
    if (!gameState) return;
    persistence.saveAutoSave(gameState);
    ui.showToast('Jogo salvo! [S]', 'success');
  }, [gameState, ui]);

  const handleLoad = useCallback((id: string) => {
    const data = persistence.loadSave(id);
    if (data) {
      setGameState(data);
      ui.setShowMenu(false);
      ui.showToast("Partida carregada.", "info");
    }
  }, [setGameState, ui]);

  const centerOnCapital = useCallback(() => {
    if (!gameState) return;
    if (typeof window === 'undefined') return;

    const realm = gameState.realms[gameState.playerRealmId];
    if (!realm?.capitalId) return;

    const capital = gameState.provinces[realm.capitalId];
    if (!capital) return;

    const [capitalX, capitalY] = capital.center;
    const zoom = ui.zoom;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    ui.setPanOffset({
      x: centerX - capitalX * zoom,
      y: centerY - capitalY * zoom
    });
    ui.setZoom(1);
  }, [gameState, ui]);

  const handleDeleteSave = useCallback((id: string) => {
    persistence.deleteSave(id);
    ui.setUpdateTrigger(v => v + 1);
    ui.showToast("Registro apagado.", "info");
  }, [ui]);

  const cancelMarchOrder = useCallback((id: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = deepClone(prev);
      const order = next.marchOrders.find(o => o.id === id);
      if (!order) return prev;
      const prov = next.provinces[order.currentProvId];
      if (prov && prov.ownerId === order.realmId) {
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    ui.setIsDragging(true);
    ui.setDragStart({ x: e.clientX, y: e.clientY });
    ui.setHasDragged(false);
  }, [ui]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ui.isDragging) return;
    const dx = e.clientX - ui.dragStart.x;
    const dy = e.clientY - ui.dragStart.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ui.setHasDragged(true);
    ui.setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    ui.setDragStart({ x: e.clientX, y: e.clientY });
  }, [ui]);

  const handleMouseUp = useCallback(() => {
    ui.setIsDragging(false);
  }, [ui]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    ui.setIsDragging(true);
    ui.setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    ui.setHasDragged(false);
  }, [ui]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!ui.isDragging) return;
    const dx = e.touches[0].clientX - ui.dragStart.x;
    const dy = e.touches[0].clientY - ui.dragStart.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ui.setHasDragged(true);
    ui.setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    ui.setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, [ui]);

  const handleTouchEnd = useCallback(() => {
    ui.setIsDragging(false);
  }, [ui]);

  return {
    startNewGame,
    handleEndTurn,
    handleAction,
    handleMassAction,
    handleDiplomacyAction,
    handleCallToArmsResponse,
    handleDisband,
    handleProvinceClick,
    confirmAttack,
    handleSave,
    handleQuickSave,
    handleLoad,
    handleDeleteSave,
    centerOnCapital,
    cancelMarchOrder,
    addLog,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

