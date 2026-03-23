import React, { useState, useEffect } from 'react';
import { GameState, ViewMode, ActionType, UnitType, SaveData, Province } from './types';
import { Map } from './components/Map';
import { HUD } from './components/HUD';
import { ChronicleModal } from './components/ChronicleModal';
import { GameEndModal } from './components/GameEndModal';
import { SaveGameModal } from './components/SaveGameModal';
import { GameInstructionsModal } from './components/GameInstructionsModal';
import { TurnResultModal } from './components/TurnResultModal';
import { CombatSetupModal } from './components/CombatSetupModal';
import { BattleOutcomeModal } from './components/BattleOutcomeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusCircle,
  Settings,
  HelpCircle,
  Save,
  History,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Volume2,
  VolumeX,
  ScrollText,
  MousePointer2,
  Maximize2,
  RotateCw,
  MapPin,
  Trash2,
  Shield, Swords, Crown, Scroll, Play, Info, Handshake, Home
} from 'lucide-react';

import { useUI } from './hooks/useUI';
import { useGameController } from './hooks/useGameController';
import { persistence } from './persistence';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const ui = useUI();
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

    return () => {
      clearInterval(timer);
    };
  }, []);

  const toggleFullScreen = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const doc = window.document as any;
      const docEl = doc.documentElement;

      const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
      const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      const isFullscreen = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);

      if (!isFullscreen && requestFullScreen) {
        requestFullScreen.call(docEl);
      } else if (isFullscreen && cancelFullScreen) {
        cancelFullScreen.call(doc);
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia:", err);
      ui.showToast("Erro ao alternar tela cheia. O navegador pode ter bloqueado a ação.", "error");
    }
  };

  if (ui.showMenu) {
    let saves: SaveData[] = [];
    try {
      saves = [
        ...(ui.autosave ? [ui.autosave] : []),
        ...(Array.isArray(persistence.listSaves()) ? persistence.listSaves() : [])
      ].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      }).slice(0, 3);
    } catch (err) {
      console.error("Erro ao listar salvamentos:", err);
    }

    return (
      <div className="w-full h-full bg-stone-950 text-stone-200 flex flex-col items-center p-2 xs:p-4 relative overflow-y-auto overflow-x-hidden select-none custom-scrollbar"
        style={{
          backgroundImage: 'url("/splash_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}>
        {/* Overlay for better readability */}
        <div className="fixed inset-0 bg-black/50 z-0 pointer-events-none"></div>

        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex justify-center mt-4 mb-2"
          style={{ mixBlendMode: 'screen' }}
        >
          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-75"></div>
            <img
              src="/logo.png"
              alt="Reinos Medievais Logo"
              className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain filter transition-all duration-700"
            />
          </div>
        </motion.div>

        {/* Title area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="z-10 text-center mb-4"
        >
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-black tracking-[0.2em] mb-1 gold-gradient-text uppercase">
            Reinos Medievais
          </h1>
          <p className="text-amber-200/60 tracking-[0.2em] text-[7px] xs:text-[9px] md:text-xs uppercase font-serif">
            Forje seu império • Conquiste o destino
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-3 w-full max-w-5xl z-10 px-2 pb-8">
          {/* New Game Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="menu-panel flex-1 flex flex-col items-center p-4 xs:p-5 rounded-sm"
          >
            <div className="mb-3 text-center">
              <h2 className="text-base xs:text-lg md:text-xl font-bold text-amber-100/90 tracking-widest uppercase mb-1">Novo Reinado</h2>
              <div className="w-10 h-0.5 bg-amber-600/50 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-3 w-full mb-5 flex-1">
              <div className="bg-stone-900/60 p-3 rounded border border-white/5 backdrop-blur-sm">
                <label className="block text-[9px] text-stone-400 mb-2 font-bold uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={10} className="text-amber-600" /> Extensão do Mundo
                </label>
                <input
                  type="range" min="15" max="40" step="1"
                  value={ui.gameSettings.numProvinces}
                  onChange={e => ui.setGameSettings({ ...ui.gameSettings, numProvinces: parseInt(e.target.value) })}
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[8px] text-stone-500 mt-2 font-serif italic">
                  <span>Pequeno</span>
                  <span className="text-amber-500 font-bold not-italic">{ui.gameSettings.numProvinces} Províncias</span>
                  <span>Vasto</span>
                </div>
              </div>

              <div className="bg-stone-900/60 p-3 rounded border border-white/5 backdrop-blur-sm">
                <label className="block text-[9px] text-stone-400 mb-2 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Shield size={10} className="text-amber-600" /> Número de Reinos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 8].map(n => (
                    <button
                      key={n}
                      onClick={() => ui.setGameSettings({ ...ui.gameSettings, numRealms: n })}
                      className={`text-xs py-1.5 rounded-sm border transition-all duration-300 font-serif ${ui.gameSettings.numRealms === n
                        ? 'bg-amber-600/20 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-stone-800/40 border-stone-700/50 text-stone-500 hover:border-amber-900/50 hover:text-stone-300'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={ctrl.startNewGame}
              className="w-full btn-premium-gold h-11 rounded-sm font-black text-stone-950 tracking-[0.15em] flex items-center justify-center gap-2 active:scale-95 group/btn text-xs"
            >
              <Swords size={16} className="group-hover/btn:rotate-12 transition-transform" />
              INICIAR JORNADA
            </button>
          </motion.div>

          {/* Resume Game Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="menu-panel flex-1 flex flex-col p-4 xs:p-5 rounded-sm"
          >
            <div className="mb-3 text-center">
              <h2 className="text-base xs:text-lg md:text-xl font-bold text-amber-100/90 tracking-widest uppercase mb-1">Retomar Partida</h2>
              <div className="w-10 h-0.5 bg-amber-600/50 mx-auto rounded-full"></div>
            </div>

            <div className="flex-1 space-y-2 mb-4 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {saves.length > 0 ? (
                saves.map((save) => {
                  const turn = save.state.turn || 0;
                  const years = Math.floor(turn / 12) + 1;
                  const months = (turn % 12) + 1;
                  const totalProvinces = Object.keys(save.state.provinces).length;
                  const ownedProvinces = (Object.values(save.state.provinces) as Province[]).filter(p => p.ownerId === save.state.playerRealmId).length;
                  const progress = Math.round((ownedProvinces / (totalProvinces || 1)) * 100);
                  const playerRealm = save.state.realms[save.state.playerRealmId];

                  return (
                    <div
                      key={save.id}
                      onClick={() => ctrl.handleLoad(save.id)}
                      className="group/save bg-stone-900/50 border border-white/5 p-2 rounded-sm flex items-center gap-2 hover:bg-amber-600/10 hover:border-amber-600/30 transition-all cursor-pointer relative"
                    >
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <svg className="progress-bar-circular w-8 h-8" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-stone-800" strokeWidth="2"></circle>
                          <circle
                            cx="18" cy="18" r="16" fill="none"
                            className="stroke-amber-600 transition-all duration-1000"
                            strokeWidth="2"
                            strokeDasharray={`${progress}, 100`}
                          ></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-amber-200">
                          {progress}%
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-stone-400 text-[7px] uppercase tracking-tighter font-bold mb-0.5 opacity-60">
                          {save.id === 'autosave' ? 'Salvamento Auto' : 'Salvamento Manual'}
                        </p>
                        <h4 className="text-xs font-bold text-amber-100 truncate flex items-center gap-1">
                          {playerRealm?.name || 'Império'}
                          {save.id === 'autosave' && <RotateCw size={8} className="text-amber-500 animate-spin-slow" />}
                        </h4>
                        <div className="flex items-center gap-2 text-[8px] text-stone-500 mt-0.5">
                          <span className="flex items-center gap-0.5"><History size={8} /> {months}m</span>
                          <span className="flex items-center gap-0.5"><Crown size={8} /> Ano {years}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          ctrl.handleDeleteSave(save.id);
                          ui.showToast('Registro apagado.', 'info');
                        }}
                        className="p-1 text-stone-700 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all relative z-10"
                      >
                        <Trash2 size={12} />
                      </button>

                      <ChevronRight size={14} className="text-stone-700 group-hover/save:text-amber-500 transition-colors" />
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-600 italic py-4">
                  <ScrollText className="w-6 h-6 mb-1 opacity-20" />
                  <p className="text-xs">Nenhum registro</p>
                </div>
              )}
            </div>

            <button
              onClick={() => ui.setShowSaveModal(true)}
              className="w-full py-2 bg-stone-800/40 hover:bg-stone-800/60 border border-stone-700/50 hover:border-amber-900/50 text-stone-400 hover:text-amber-200 rounded-sm text-[9px] font-bold tracking-widest transition-all uppercase"
            >
              Ver Todos os Reinos
            </button>
          </motion.div>
        </div>

        {ui.showSaveModal && (
          <SaveGameModal
            isOpen={ui.showSaveModal}
            onClose={() => ui.setShowSaveModal(false)}
            onSave={ctrl.handleSave}
            onLoad={ctrl.handleLoad}
            onDelete={ctrl.handleDeleteSave}
            saves={persistence.listSaves()}
          />
        )}

        {ui.showInstructionsModal && (
          <GameInstructionsModal
            isOpen={ui.showInstructionsModal}
            onClose={() => ui.setShowInstructionsModal(false)}
          />
        )}
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="w-full h-full bg-stone-950 text-white flex flex-row overflow-hidden font-serif select-none relative">
      <ErrorBoundary>
        <div
          className="flex-1 relative overflow-hidden bg-[#1e293b] touch-none h-full"
          onMouseDown={ctrl.handleMouseDown}
          onMouseMove={ctrl.handleMouseMove}
          onMouseUp={ctrl.handleMouseUp}
          onMouseLeave={ctrl.handleMouseUp}
          onTouchStart={ctrl.handleTouchStart}
          onTouchMove={ctrl.handleTouchMove}
          onTouchEnd={ctrl.handleTouchEnd}
        >
          <div className="absolute top-4 left-4 z-[100] pointer-events-auto">
            <button
              onClick={toggleFullScreen}
              onTouchEnd={(e) => { e.preventDefault(); toggleFullScreen(e); }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-12 h-12 bg-stone-900/95 border-2 border-amber-500 rounded-full hover:bg-stone-800 shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-110 active:scale-90 transition-all flex items-center justify-center group"
              title="Alternar Tela Cheia"
            >
              <Maximize2 size={20} className="text-amber-500 group-hover:rotate-12 transition-transform" />
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
              selectedProvinceId={ui.selectedProvinceId}
              onProvinceClick={(id) => ctrl.handleProvinceClick(id, ui.hasDragged)}
              viewMode={ui.viewMode}
              previewPath={ui.previewPath}
              marchAnimations={ui.marchAnimations}
              triggerMarchAnimation={ui.triggerMarchAnimation}
              actionState={ui.actionState}
              actionSourceId={ui.actionSourceId}
            />
          </motion.div>

          {/* Floating Selection Details for Mobile (Top-left within map area) */}
          <AnimatePresence>
            {ui.selectedProvinceId && !ui.isHudOpen && (
              <motion.div
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="absolute top-2 left-8 xs:top-4 xs:left-12 z-40 bg-stone-900/90 border border-amber-900/50 p-1 xs:p-1.5 rounded backdrop-blur-md shadow-2xl pointer-events-none lg:hidden"
              >
                <p className="text-[6px] text-amber-500 font-bold uppercase tracking-widest leading-none mb-0.5">
                  {gameState.provinces[ui.selectedProvinceId].ownerId === 'neutral' ? 'Terra de Ninguém' : (gameState.realms[gameState.provinces[ui.selectedProvinceId].ownerId]?.name || 'Reino Misterioso')}
                </p>
                <h4 className="text-[10px] font-black text-stone-100 flex items-center gap-1">
                  {gameState.provinces[ui.selectedProvinceId].name}
                  <span className="text-[6px] bg-stone-800 px-0.5 py-0.5 rounded text-stone-400 capitalize">{gameState.provinces[ui.selectedProvinceId].terrain}</span>
                </h4>
                <div className="flex gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5"><Shield className="w-2 h-2 text-stone-500" /> <span className="text-[8px] font-bold">{gameState.provinces[ui.selectedProvinceId].troops.infantry + gameState.provinces[ui.selectedProvinceId].troops.archers + gameState.provinces[ui.selectedProvinceId].troops.cavalry + gameState.provinces[ui.selectedProvinceId].troops.scouts}</span></div>
                  <div className="flex items-center gap-0.5"><Crown className="w-2 h-2 text-amber-600" /> <span className="text-[8px] font-bold text-amber-500/80">{gameState.provinces[ui.selectedProvinceId].loyalty}%</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
            <button onClick={() => ui.setZoom(Math.min(ui.zoom + 0.2, 3))} className="w-12 h-12 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl text-xl">+</button>
            <button onClick={() => ui.setZoom(Math.max(ui.zoom - 0.2, 0.5))} className="w-12 h-12 bg-stone-900/80 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-800 shadow-xl text-xl">-</button>
          </div>
        </div>

        {/* HUD Area */}
        <HUD
          gameState={gameState}
          selectedProvinceId={ui.selectedProvinceId}
          onAction={ctrl.handleAction}
          onEndTurn={ctrl.handleEndTurn}
          onToggleMode={(mode) => ui.setViewMode(mode)}
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
              ui.setMoveComposition({
                infantry: prov.troops.infantry,
                archers: prov.troops.archers,
                cavalry: prov.troops.cavalry,
                scouts: 0
              });
              ctrl.addLog(`Iniciado preparo de movimentação em ${prov.name}. Selecione o alvo.`);
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
            <SaveGameModal
              isOpen={ui.showSaveModal}
              onClose={() => ui.setShowSaveModal(false)}
              onSave={ctrl.handleSave}
              onLoad={ctrl.handleLoad}
              onDelete={ctrl.handleDeleteSave}
              saves={persistence.listSaves()}
            />
          )}
          {ui.showInstructionsModal && (
            <GameInstructionsModal
              isOpen={ui.showInstructionsModal}
              onClose={() => ui.setShowInstructionsModal(false)}
            />
          )}
          {ui.showTurnSummary && ui.turnSummaryData && (
            <TurnResultModal
              isOpen={ui.showTurnSummary}
              data={ui.turnSummaryData}
              onClose={() => ui.setShowTurnSummary(false)}
            />
          )}
          {ui.showCombatPreview && ui.combatAttackerProvId && ui.combatDefenderProvId && ui.combatAttackingArmy && (
            <CombatSetupModal
              isOpen={ui.showCombatPreview}
              attackerProv={gameState.provinces[ui.combatAttackerProvId]}
              defenderProv={gameState.provinces[ui.combatDefenderProvId]}
              attackingArmy={ui.combatAttackingArmy}
              onConfirm={ctrl.confirmAttack}
              onClose={() => ui.setShowCombatPreview(false)}
            />
          )}
          {ui.showBattleResult && ui.battleResultData && ui.battleResultMeta && (
            <BattleOutcomeModal
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
              isOpen={gameState.gameOver}
              gameState={gameState}
              onRestart={() => { ui.setShowMenu(true); setGameState(null); }}
              onClose={() => { ui.setShowMenu(true); setGameState(null); }}
            />
          )}
        </AnimatePresence>
      </ErrorBoundary>
      {/* Toast Notifications */}
      <AnimatePresence>
        {ui.toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-2xl border flex items-center gap-2 backdrop-blur-md ${ui.toast.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
              ui.toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
                'bg-blue-900/90 border-blue-500 text-blue-100'
              }`}
          >
            {ui.toast.type === 'success' && <div className="p-1 bg-green-500 rounded-full"><PlusCircle size={12} className="text-green-900" /></div>}
            <span className="text-xs font-bold medieval-text">{ui.toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
