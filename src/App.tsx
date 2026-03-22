import React, { useState, useEffect } from 'react';
import { GameState, ViewMode, ActionType, UnitType } from './types';
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
  }, [ui]);

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
      <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-4 relative overflow-hidden font-serif select-none"
           style={{ backgroundImage: 'radial-gradient(circle at center, #292524 0%, #0c0a09 100%)' }}>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}></div>
        
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="w-24 h-24 text-amber-600" />
              <Crown className="w-10 h-10 text-amber-400 absolute -top-2 -right-2 transform rotate-12" />
              <Swords className="w-10 h-10 text-amber-500 absolute -bottom-2 -left-2 transform -rotate-12" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-sm text-center">
            MEDIEVAL REALMS
          </h1>
          <p className="text-stone-400 italic font-serif flex items-center justify-center gap-2">
            <Scroll className="w-4 h-4" /> Forje seu império, conquiste o destino <Scroll className="w-4 h-4" />
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl w-full z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-stone-900/80 border-2 border-amber-900/30 p-5 md:p-8 rounded-lg backdrop-blur-sm shadow-2xl flex flex-col items-center"
          >
            <h2 className="text-2xl font-bold text-amber-200 mb-6 border-b border-amber-900/50 pb-2 w-full text-center flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Novo Reinado
            </h2>
            <div className="space-y-6 w-full mb-8">
              <div>
                <label className="block text-sm text-stone-400 mb-2 font-bold uppercase tracking-widest">Extensão do Reino</label>
                <input 
                  type="range" min="15" max="40" step="1" 
                  value={ui.gameSettings.numProvinces} 
                  onChange={e => ui.setGameSettings({...ui.gameSettings, numProvinces: parseInt(e.target.value)})}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-xs mt-1 text-stone-500">
                  <span>Pequeno</span> <span>{ui.gameSettings.numProvinces} Províncias</span> <span>Vasto</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2 font-bold uppercase tracking-widest">Reinos Rivais</label>
                <div className="flex gap-2">
                  {[4, 6, 8].map(n => (
                    <button 
                      key={n}
                      onClick={() => ui.setGameSettings({...ui.gameSettings, numRealms: n})}
                      className={`flex-1 py-2 rounded border transition-all ${ui.gameSettings.numRealms === n ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2 font-bold uppercase tracking-widest">Dificuldade</label>
                <div className="flex gap-2 text-xs">
                  {['easy', 'normal', 'hard'].map(d => (
                    <button 
                      key={d}
                      onClick={() => ui.setGameSettings({...ui.gameSettings, aiDifficulty: d as any})}
                      className={`flex-1 py-2 rounded border transition-all uppercase tracking-tighter ${ui.gameSettings.aiDifficulty === d ? 'bg-amber-700 border-amber-500 text-white shadow-lg' : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'}`}
                    >
                      {d === 'easy' ? 'Vassalo' : d === 'normal' ? 'Lorde' : 'Rei'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2 font-bold uppercase tracking-widest">Objetivo Final</label>
                <select 
                  className="w-full bg-stone-800 border border-stone-700 py-2 px-3 rounded text-stone-300 text-sm outline-none focus:border-amber-600"
                  value={ui.gameSettings.victoryCondition}
                  onChange={e => ui.setGameSettings({...ui.gameSettings, victoryCondition: e.target.value as any})}
                >
                  <option value="conquest">Hegemonia (70% do Mapa)</option>
                  <option value="economic">Riqueza (10.000 Ouro)</option>
                  <option value="diplomatic">Poder (Vassalagem Total)</option>
                  <option value="sandbox">Sem Condições (Sandbox)</option>
                </select>
              </div>
            </div>
            <button 
              onClick={ctrl.startNewGame}
              className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-black py-4 rounded shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group border-b-4 border-amber-900"
            >
              <Swords className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              INICIAR CONTRATO
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-stone-900/80 border-2 border-stone-800 p-5 md:p-8 rounded-lg flex-1 backdrop-blur-sm shadow-xl relative group">
              <h2 className="text-xl font-bold text-stone-400 mb-6 flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Retomar Jornada
              </h2>
              {ui.autosave ? (
                <div className="space-y-4">
                   <div className="bg-stone-800/50 p-4 rounded border border-stone-700/50">
                      <p className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        Auto-Save Recente
                      </p>
                      <p className="text-xs text-stone-500 mb-3">{ui.autosave.date}</p>
                      <button 
                        onClick={() => ctrl.handleLoad('autosave')}
                        className="w-full py-2 bg-stone-700 hover:bg-amber-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-2 font-bold"
                      >
                         DESBRAVAR AGORA
                      </button>
                   </div>
                   <button 
                    onClick={() => ui.setShowSaveModal(true)}
                    className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-sm transition-colors border border-stone-700 font-bold flex items-center justify-center gap-2"
                   >
                     VER TODOS OS REGISTROS
                   </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-600 py-12">
                   <Scroll className="w-12 h-12 mb-2 opacity-20" />
                   <p className="text-sm italic">Nenhum pergaminho selado encontrado.</p>
                   <button onClick={() => ui.setShowSaveModal(true)} className="mt-4 text-amber-700 hover:text-amber-500 text-xs font-bold underline">CONFIGURAR CARREGAMENTO</button>
                </div>
              )}
            </div>

            <div className="bg-stone-900/80 border-2 border-stone-800 p-6 rounded-lg flex items-center justify-between backdrop-blur-sm shadow-xl">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-stone-800 flex items-center justify-center">
                    <Info className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-300">Primeiros Passos?</h3>
                    <p className="text-xs text-stone-500">Leia os Pergaminhos de Instrução.</p>
                  </div>
               </div>
               <button 
                 onClick={() => ui.setShowInstructionsModal(true)}
                 className="p-3 bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 rounded-full transition-colors border border-amber-900/30"
               >
                 <Scroll className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-stone-600 text-[10px] flex items-center gap-4 z-10 border-t border-stone-900 pt-4 w-full max-w-4xl justify-center font-serif uppercase tracking-widest">
           <span>Versão 2.4 - Era da Modularização</span>
           <span>•</span>
           <span>Medieval Engine v4.0</span>
           <span>•</span>
           <button onClick={toggleFullScreen} className="hover:text-amber-500 transition-colors flex items-center gap-1">
             <Settings className="w-3 h-3" /> Modo Fullscreen
           </button>
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
                        className="absolute top-4 left-4 z-40 bg-stone-900/90 border border-amber-900/50 p-3 rounded-lg backdrop-blur-md shadow-2xl pointer-events-none lg:hidden"
                    >
                        <p className="text-xs text-amber-500 font-bold uppercase tracking-widest leading-none mb-1">
                          {gameState.provinces[ui.selectedProvinceId].ownerId === 'neutral' ? 'Terra de Ninguém' : gameState.realms[gameState.provinces[ui.selectedProvinceId].ownerId].name}
                        </p>
                        <h4 className="text-lg font-black text-stone-100 flex items-center gap-2">
                           {gameState.provinces[ui.selectedProvinceId].name}
                           <span className="text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 capitalize">{gameState.provinces[ui.selectedProvinceId].terrain}</span>
                        </h4>
                        <div className="flex gap-4 mt-2">
                           <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-stone-500" /> <span className="text-xs font-bold">{gameState.provinces[ui.selectedProvinceId].troops}</span></div>
                           <div className="flex items-center gap-1.5"><Crown className="w-3 h-3 text-amber-600" /> <span className="text-xs font-bold text-amber-500/80">{gameState.provinces[ui.selectedProvinceId].loyalty}%</span></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
              <Minimap 
                gameState={gameState} 
                width={200}
                height={150}
                selectedProvinceId={ui.selectedProvinceId}
                onProvinceClick={id => ctrl.handleProvinceClick(id, false)}
              />
            </div>
            
            <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
                <button onClick={() => ui.setZoom(Math.min(ui.zoom + 0.2, 3))} className="w-10 h-10 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl">+</button>
                <button onClick={() => ui.setZoom(Math.max(ui.zoom - 0.2, 0.5))} className="w-10 h-10 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl">-</button>
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
            <ChroniclesModal 
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
            <GameOverModal 
              gameState={gameState}
              onRestart={() => { ui.setShowMenu(true); setGameState(null); }}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </div>
  );
}
