import { useState } from 'react';
import { SaveData, ViewMode, ActionType, UnitType, Army } from '../types';

export const useUI = () => {
  const [showMenu, setShowMenu] = useState(true);
  const [showChronicles, setShowChronicles] = useState(false);
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showTurnSummary, setShowTurnSummary] = useState(false);
  const [showCombatPreview, setShowCombatPreview] = useState(false);
  const [showBattleResult, setShowBattleResult] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('political');
  const [actionState, setActionState] = useState<ActionType>('idle');
  const [actionSourceId, setActionSourceId] = useState<string | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string[]>([]);
  const [isHudOpen, setIsHudOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectingMoveComposition, setSelectingMoveComposition] = useState(false);
  const [moveComposition, setMoveComposition] = useState<Army>({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
  const [autosave, setAutosave] = useState<SaveData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [turnSummaryData, setTurnSummaryData] = useState<any>(null);
  const [combatAttackerProvId, setCombatAttackerProvId] = useState<string | null>(null);
  const [combatDefenderProvId, setCombatDefenderProvId] = useState<string | null>(null);
  const [combatAttackingArmy, setCombatAttackingArmy] = useState<Army | null>(null);
  const [battleResultData, setBattleResultData] = useState<any>(null);
  const [battleResultMeta, setBattleResultMeta] = useState<any>(null);
  const [gameSettings, setGameSettings] = useState({ musicVolume: 0.5, sfxVolume: 0.5, numProvinces: 25, numRealms: 6 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [marchAnimations, setMarchAnimations] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerMarchAnimation = (order: any) => {
    setMarchAnimations(prev => [...prev, order]);
  };

  return {
    showMenu, setShowMenu,
    showChronicles, setShowChronicles,
    showGameEnd, setShowGameEnd,
    showSaveModal, setShowSaveModal,
    showInstructionsModal, setShowInstructionsModal,
    showTurnSummary, setShowTurnSummary,
    showCombatPreview, setShowCombatPreview,
    showBattleResult, setShowBattleResult,
    viewMode, setViewMode,
    actionState, setActionState,
    actionSourceId, setActionSourceId,
    selectedProvinceId, setSelectedProvinceId,
    previewPath, setPreviewPath,
    isHudOpen, setIsHudOpen,
    zoom, setZoom,
    selectingMoveComposition, setSelectingMoveComposition,
    moveComposition, setMoveComposition,
    autosave, setAutosave,
    toast, showToast,
    turnSummaryData, setTurnSummaryData,
    combatAttackerProvId, setCombatAttackerProvId,
    combatDefenderProvId, setCombatDefenderProvId,
    combatAttackingArmy, setCombatAttackingArmy,
    battleResultData, setBattleResultData,
    battleResultMeta, setBattleResultMeta,
    gameSettings, setGameSettings,
    panOffset, setPanOffset,
    hasDragged, setHasDragged,
    marchAnimations, setMarchAnimations,
    triggerMarchAnimation
  };
};
