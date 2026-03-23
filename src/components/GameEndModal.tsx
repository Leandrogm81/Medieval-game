import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RefreshCw, Home, X } from 'lucide-react';
import { GameState } from '../types';

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onRestart: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({ isOpen, onClose, gameState, onRestart }) => {
  if (!isOpen) return null;

  const stats = {
    winner: gameState.realms[gameState.playerRealmId]?.name || 'Desconhecido',
    isPlayerWinner: !gameState.gameOver, // This logic might need refinement
    turns: gameState.turn,
    provincesCaptured: Object.values(gameState.provinces).filter(p => p.ownerId === gameState.playerRealmId).length,
    enemiesDefeated: 0, // Placeholder
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="bg-slate-900 border-4 border-amber-600/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-10 text-center space-y-8">
            <div className="flex justify-center">
              {stats.isPlayerWinner ? (
                <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 shadow-lg">
                  <Trophy size={48} />
                </div>
              ) : (
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-red-500 border-4 border-red-900/50 shadow-lg">
                  <Skull size={48} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Fim da Jornada</h2>
              <p className="text-slate-400 font-serif italic">
                {stats.isPlayerWinner 
                  ? `Vossa Majestade triunfou! O reino de ${stats.winner} agora governa todas as terras.`
                  : `O destino foi cruel. O reino de ${stats.winner} conquistou a supremacia absoluta.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-800">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Turnos</p>
                <p className="text-2xl font-black text-white">{stats.turns}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Conquistas</p>
                <p className="text-2xl font-black text-emerald-500">{stats.provincesCaptured}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Vitórias</p>
                <p className="text-2xl font-black text-indigo-400">{stats.enemiesDefeated}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRestart}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <RefreshCw size={20} /> Nova Campanha
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                <Home size={18} /> Menu Principal
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
