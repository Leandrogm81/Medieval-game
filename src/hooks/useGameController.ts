import { GameState, SaveData, Army } from '../types';
import { persistence } from '../persistence';

export const useGameController = (
  gameState: GameState | null,
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>,
  ui: any
) => {
  const addLog = (message: string) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        logs: [message, ...prev.logs].slice(0, 50)
      };
    });
  };

  const cancelMarchOrder = (orderId: string) => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        marchOrders: prev.marchOrders.filter(o => o.id !== orderId)
      };
    });
    ui.showToast("Ordem de marcha cancelada.", "info");
  };

  const handleSave = (name: string) => {
    if (!gameState) return;
    persistence.saveGame(name, gameState);
    ui.showToast("Jogo salvo com sucesso!", "success");
  };

  const handleLoad = (id: string) => {
    const loadedState = persistence.loadSave(id);
    if (loadedState) {
      setGameState(loadedState);
      ui.setShowMenu(false);
      ui.setShowSaveModal(false);
      ui.showToast("Jogo carregado!", "success");
    } else {
      ui.showToast("Erro ao carregar o jogo.", "error");
    }
  };

  const handleDeleteSave = (id: string) => {
    persistence.deleteSave(id);
    ui.showToast("Salvamento excluído.", "info");
  };

  const confirmAttack = (troops: Army) => {
    ui.showToast("Ordem de ataque confirmada!", "success");
    ui.setActionState('idle');
  };

  const startNewGame = () => {
    // Basic initial state
    const initialState: GameState = {
      turn: 1,
      provinces: {},
      realms: {},
      playerRealmId: 'player',
      selectedProvinceId: null,
      actionPoints: 3,
      history: [],
      logs: ["Bem-vindo ao seu reinado!"],
      marchOrders: [],
      visualEffects: [],
      gameOver: false,
      currentEvent: null,
      lastTurnMovements: [],
      visibleProvinces: []
    };
    setGameState(initialState);
    ui.setShowMenu(false);
  };

  const handleAction = (type: string) => {
    ui.showToast(`Ação ${type} realizada.`, "info");
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    setGameState(prev => {
      if (!prev) return prev;
      return { ...prev, turn: prev.turn + 1 };
    });
    ui.showToast("Turno finalizado.", "success");
  };

  const handleMouseDown = (e: any) => {};
  const handleMouseMove = (e: any) => {};
  const handleMouseUp = (e: any) => {};
  const handleTouchStart = (e: any) => {};
  const handleTouchMove = (e: any) => {};
  const handleTouchEnd = (e: any) => {};
  const handleProvinceClick = (id: string, hasDragged: boolean) => {
    if (hasDragged) return;
    ui.setSelectedProvinceId(id);
  };

  return {
    addLog,
    cancelMarchOrder,
    handleSave,
    handleLoad,
    handleDeleteSave,
    confirmAttack,
    startNewGame,
    handleAction,
    handleEndTurn,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleProvinceClick
  };
};
