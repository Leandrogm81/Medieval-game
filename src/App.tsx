import React, { useState, useEffect } from 'react';
import { GameState, ViewMode, ActionType, UnitType } from './types';
import { Map } from './components/Map';
import { HUD } from './components/HUD';
import { ChronicleModal } from './components/ChronicleModal';
import { GameEndModal } from './components/GameEndModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { InstructionsModal } from './components/InstructionsModal';
import { TurnSummaryModal } from './components/TurnSummaryModal';
import { CombatPreviewModal } from './components/CombatPreviewModal';
import { BattleResultModal } from './components/BattleResultModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, Crown, Scroll, Play, Info, Handshake, Settings, Save, Home } from 'lucide-react';

import { useUIState } from './hooks/useUIState';
import { useGameController } from './hooks/useGameController';
import { persistence } from './persistence';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 750;

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const ui = useUIState();
  const ctrl = useGameController(gameState, setGameState, ui);

  // Persistence and Visual Effects cleanup
  useEffect(() => {
    ui.setAutosave(persistence.loadAutoSave());
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (ui.showMenu) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-row items-center justify-center p-2 relative overflow-hidden font-serif select-none gap-2"
           style={{ backgroundImage: 'radial-gradient(circle at center, #292524 0%, #0c0a09 100%)' }}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="z-10 text-center w-1/3 flex flex-col items-center"
        >
          <div className="flex justify-center mb-1">
            <div className="relative">
              <Shield className="w-12 h-12 text-amber-600" />
              <Crown className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 transform rotate-12" />
              <Swords className="w-6 h-6 text-amber-500 absolute -bottom-1 -left-1 transform -rotate-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter mb-1 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-sm text-center">
            REINOS MEDIEVAIS
          </h1>
          <p className="text-stone-400 italic font-serif flex items-center justify-center gap-1 text-xs">
            <Scroll className="w-3 h-3" /> Forje seu império, conquiste o destino <Scroll className="w-3 h-3" />
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 w-2/3 z-10 p-1">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-stone-900/80 border border-amber-900/30 p-3 rounded-lg backdrop-blur-sm shadow-xl flex flex-col items-center"
          >
            <h2 className="text-lg font-bold text-amber-200 mb-2 border-b border-amber-900/50 pb-1 w-full text-center flex items-center justify-center gap-1">
              <Play className="w-4 h-4" /> Novo Reinado
            </h2>
            <div className="space-y-2 w-full mb-2">
              <div>
                <label className="block text-[10px] text-stone-400 mb-0.5 font-bold uppercase tracking-widest">Extensão</label>
                <input 
                  type="range" min="15" max="40" step="1" 
                  value={ui.gameSettings.numProvinces} 
                  onChange={e => ui.setGameSettings({...ui.gameSettings, numProvinces: parseInt(e.target.value)})}
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[9px] text-stone-500">
                  <span>Pequeno</span> <span>{ui.gameSettings.numProvinces}</span> <span>Vasto</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[4, 6, 8].map(n => (
                  <button 
                    key={n}
                    onClick={() => ui.setGameSettings({...ui.gameSettings, numRealms: n})}
                    className={`text-xs py-1 rounded border transition-all ${ui.gameSettings.numRealms === n ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={ctrl.startNewGame}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-black py-2 rounded shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1 text-sm border-b-2 border-amber-900"
            >
              <Swords className="w-4 h-4" />
              INICIAR
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-stone-900/80 border border-stone-800 p-3 rounded-lg backdrop-blur-sm shadow-xl flex flex-col"
          >
            <h2 className="text-lg font-bold text-stone-400 mb-2 flex items-center justify-center gap-1">
              <Save className="w-4 h-4" /> Retomar
            </h2>
            <div className="flex-1 overflow-y-auto space-y-1">
              {ui.autosave ? (
                <div className="bg-stone-800/50 p-2 rounded border border-stone-700/50">
                  <p className="text-[10px] font-bold text-amber-400 mb-0.5">Auto-Save</p>
                  <button 
                    onClick={() => ctrl.handleLoad('autosave')}
                    className="w-full py-1 bg-stone-700 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                  >
                    DESBRAVAR
                  </button>
                </div>
              ) : (
                <p className="text-[10px] italic text-stone-600 text-center">Vazio</p>
              )}
            </div>
            <button 
              onClick={() => ui.setShowSaveModal(true)}
              className="w-full py-1.5 mt-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-[10px] font-bold border border-stone-700"
            >
              VER TODOS
            </button>
          </motion.div>
        </div>
        
        {ui.showSaveModal && (
          <SaveLoadModal 
            isOpen={ui.showSaveModal}
            onClose={() => ui.setShowSaveModal(false)}
            onSave={ctrl.handleSave}
            onLoad={ctrl.handleLoad}
            onDelete={ctrl.handleDeleteSave}
            saves={persistence.listSaves()}
          />
        )}
        
        {ui.showInstructionsModal && (
          <InstructionsModal 
            isOpen={ui.showInstructionsModal}
            onClose={() => ui.setShowInstructionsModal(false)} 
          />
        )}
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="w-full h-[100dvh] bg-stone-950 text-white flex flex-row overflow-hidden font-serif select-none">
      <ErrorBoundary>
        <div 
          className="flex-1 relative overflow-hidden bg-[#1e293b] touch-none"
          onMouseDown={ctrl.handleMouseDown}
          onMouseMove={ctrl.handleMouseMove}
          onMouseUp={ctrl.handleMouseUp}
          onMouseLeave={ctrl.handleMouseUp}
          onTouchStart={ctrl.handleTouchStart}
          onTouchMove={ctrl.handleTouchMove}
          onTouchEnd={ctrl.handleTouchEnd}
        >

            <div className="absolute top-4 left-4 z-30">
              <button 
                onClick={() => ui.setShowMenu(true)}
                className="p-1.5 sm:p-3 bg-stone-900/80 border border-stone-700 rounded-full hover:bg-stone-800 shadow-xl"
                title="Menu Principal"
              >
                <Home size={14} className="text-amber-500 sm:w-5 sm:h-5" />
              </button>
            </div>

            <motion.div 
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              animate={{ 
                x: ui.panOffset.x, 
                y: ui.panOffset.y,
                scale: ui.zoom 
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 150, mass: 0.5 }}
            >
              <Map 
                gameState={gameState}
                onProvinceClick={id => ctrl.handleProvinceClick(id, ui.hasDragged)}
                selectedProvinceId={ui.selectedProvinceId}
                viewMode={ui.viewMode}
                previewPath={ui.previewPath}
                actionState={ui.actionState}
                actionSourceId={ui.actionSourceId}
              />
            </motion.div>

            {/* Floating Selection Details for Mobile (Top-left within map area) */}
            <AnimatePresence>
                {ui.selectedProvinceId && !ui.isHudOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                        className="absolute top-4 left-12 z-40 bg-stone-900/90 border border-amber-900/50 p-1.5 rounded backdrop-blur-md shadow-2xl pointer-events-none lg:hidden"
                    >
                        <p className="text-[6px] text-amber-500 font-bold uppercase tracking-widest leading-none mb-0.5">
                          {gameState.provinces[ui.selectedProvinceId].ownerId === 'neutral' ? 'Terra de Ninguém' : gameState.realms[gameState.provinces[ui.selectedProvinceId].ownerId].name}
                        </p>
                        <h4 className="text-[10px] font-black text-stone-100 flex items-center gap-1">
                           {gameState.provinces[ui.selectedProvinceId].name}
                           <span className="text-[6px] bg-stone-800 px-0.5 py-0.5 rounded text-stone-400 capitalize">{gameState.provinces[ui.selectedProvinceId].terrain}</span>
                        </h4>
                        <div className="flex gap-2 mt-0.5">
                           <div className="flex items-center gap-0.5"><Shield className="w-2 h-2 text-stone-500" /> <span className="text-[8px] font-bold">{gameState.provinces[ui.selectedProvinceId].troops}</span></div>
                           <div className="flex items-center gap-0.5"><Crown className="w-2 h-2 text-amber-600" /> <span className="text-[8px] font-bold text-amber-500/80">{gameState.provinces[ui.selectedProvinceId].loyalty}%</span></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1 pointer-events-auto">
                <button onClick={() => ui.setZoom(Math.min(ui.zoom + 0.2, 3))} className="w-6 h-6 sm:w-10 sm:h-10 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl text-sm sm:text-xl">+</button>
                <button onClick={() => ui.setZoom(Math.max(ui.zoom - 0.2, 0.5))} className="w-6 h-6 sm:w-10 sm:h-10 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl text-sm sm:text-xl">-</button>
            </div>
        </div>

        {/* HUD Area */}
        <HUD 
          gameState={gameState}
          selectedProvinceId={ui.selectedProvinceId}
          onAction={ctrl.handleAction}
          onEndTurn={ctrl.handleEndTurn}
          onToggleMode={() => {
            const modes: ViewMode[] = ['political', 'military', 'economic', 'diplomatic', 'resources'];
            const next = modes[(modes.indexOf(ui.viewMode) + 1) % modes.length];
            ui.setViewMode(next);
          }}
          viewMode={ui.viewMode}
          onSave={() => ui.setShowSaveModal(true)}
          onMenu={() => ui.setShowMenu(true)}
          onToggleChronicles={() => ui.setShowChronicles(!ui.showChronicles)}
          actionState={ui.actionState}
          onCancelAction={() => { ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]); }}
          onToggleHud={() => ui.setIsHudOpen(!ui.isHudOpen)}
          isHudOpen={ui.isHudOpen}
          onMapAction={(type) => {
            if (!ui.selectedProvinceId) return;
            const prov = gameState.provinces[ui.selectedProvinceId];
            if (prov.ownerId !== gameState.playerRealmId) return;
            
            if (type === 'move') {
               ui.setActionSourceId(ui.selectedProvinceId);
               ui.setActionState('moving');
               ui.setSelectingMoveComposition(true);
               ctrl.addLog(`Iniciado preparo de movimentação em ${prov.name}. Selecione as tropas.`);
            } else if (type === 'attack') {
               ui.setActionSourceId(ui.selectedProvinceId);
               ui.setActionState('attacking');
               ctrl.addLog(`Modo de ataque ativado a partir de ${prov.name}. Escolha o alvo adjacente.`);
            } else if (type === 'scout') {
               ui.setActionSourceId(ui.selectedProvinceId);
               ui.setActionState('dispatching_scouts');
               ctrl.addLog(`Missão de reconhecimento: selecione batedores e o alvo distante.`);
            }
          }}
          marchOrders={gameState.marchOrders || []}
          onCancelMarchOrder={ctrl.cancelMarchOrder}
          zoom={ui.zoom}
          onZoomChange={ui.setZoom}
          moveComposition={ui.moveComposition}
          onMoveCompositionChange={ui.setMoveComposition}
          onDispatchScouts={() => ui.setActionState('dispatching_scouts')}
          onRoute={() => ui.setActionState('routing')}
          onToggleFullScreen={toggleFullScreen}
        />

        <AnimatePresence>
          {ui.showChronicles && (
            <ChronicleModal 
              isOpen={ui.showChronicles}
              logs={gameState.logs} 
              onClose={() => ui.setShowChronicles(false)} 
            />
          )}
          {ui.showSaveModal && (
            <SaveLoadModal 
              isOpen={ui.showSaveModal}
              onClose={() => ui.setShowSaveModal(false)}
              onSave={ctrl.handleSave}
              onLoad={ctrl.handleLoad}
              onDelete={ctrl.handleDeleteSave}
              saves={persistence.listSaves()}
            />
          )}
          {ui.showInstructionsModal && (
            <InstructionsModal 
              isOpen={ui.showInstructionsModal}
              onClose={() => ui.setShowInstructionsModal(false)} 
            />
          )}
          {ui.showTurnSummary && ui.turnSummaryData && (
            <TurnSummaryModal 
              isOpen={ui.showTurnSummary}
              data={ui.turnSummaryData} 
              onClose={() => ui.setShowTurnSummary(false)} 
            />
          )}
          {ui.showCombatPreview && ui.combatAttackerProvId && ui.combatDefenderProvId && ui.combatAttackingArmy && (
            <CombatPreviewModal 
              isOpen={ui.showCombatPreview}
              attackerProv={gameState.provinces[ui.combatAttackerProvId]}
              defenderProv={gameState.provinces[ui.combatDefenderProvId]}
              attackingArmy={ui.combatAttackingArmy}
              onConfirm={ctrl.confirmAttack}
              onClose={() => ui.setShowCombatPreview(false)}
            />
          )}
          {ui.showBattleResult && ui.battleResultData && ui.battleResultMeta && (
            <BattleResultModal 
              isOpen={ui.showBattleResult}
              result={ui.battleResultData}
              attackerName={ui.battleResultMeta.attackerName}
              defenderName={ui.battleResultMeta.defenderName}
              provinceName={ui.battleResultMeta.provinceName}
              conquered={ui.battleResultMeta.conquered}
              onClose={() => ui.setShowBattleResult(false)}
            />
          )}
          {gameState.gameOver && (
            <GameEndModal 
              gameState={gameState}
              onRestart={() => { ui.setShowMenu(true); setGameState(null); }}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </div>
  );
}
