import { useState } from 'react';
import { ActionType, ViewMode, GameSettings, SaveData, TurnSummaryData, Army, BattleResult, Province } from '../types';

export function useUIState() {
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
  const [zoom, setZoom] = useState(1);
  const [showChronicles, setShowChronicles] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [isHudOpen, setIsHudOpen] = useState(true);

  // ===== March / Routing State =====
  const [moveComposition, setMoveComposition] = useState<Army>({ infantry: 0, archers: 0, cavalry: 0, scouts: 0 });
  const [previewPath, setPreviewPath] = useState<string[]>([]);
  const [selectingMoveComposition, setSelectingMoveComposition] = useState(false);

  return {
    selectedProvinceId, setSelectedProvinceId,
    actionState, setActionState,
    actionSourceId, setActionSourceId,
    showMenu, setShowMenu,
    viewMode, setViewMode,
    showSaveModal, setShowSaveModal,
    showInstructionsModal, setShowInstructionsModal,
    showTurnSummary, setShowTurnSummary,
    turnSummaryData, setTurnSummaryData,
    showCombatPreview, setShowCombatPreview,
    combatAttackerProvId, setCombatAttackerProvId,
    combatDefenderProvId, setCombatDefenderProvId,
    combatAttackingArmy, setCombatAttackingArmy,
    showBattleResult, setShowBattleResult,
    battleResultData, setBattleResultData,
    battleResultMeta, setBattleResultMeta,
    autosave, setAutosave,
    gameSettings, setGameSettings,
    zoom, setZoom,
    showChronicles, setShowChronicles,
    panOffset, setPanOffset,
    isDragging, setIsDragging,
    dragStart, setDragStart,
    hasDragged, setHasDragged,
    isHudOpen, setIsHudOpen,
    moveComposition, setMoveComposition,
    previewPath, setPreviewPath,
    selectingMoveComposition, setSelectingMoveComposition
  };
}
