import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RefreshCw, Home } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  onRestart: () => void;
  onMenu: () => void;
  stats: {
    winner: string;
    isPlayerWinner: boolean;
    turns: number;
    provincesCaptured: number;
    enemiesDefeated: number;
  };
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onRestart, onMenu, stats }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
          className="bg-slate-900 border-4 border-amber-600/50 rounded-3xl shadow-[0_0_100px_rgba(217,119,6,0.2)] w-full max-w-lg overflow-hidden relative"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-600/20 to-transparent pointer-events-none" />
          
          <div className="p-10 text-center space-y-8 relative z-10">
            <div className="flex justify-center">
              {stats.isPlayerWinner ? (
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                  >
                    <Trophy size={48} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-black px-2 py-1 rounded-full shadow-lg">VITÓRIA</div>
                </div>
              ) : (
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-red-500 border-4 border-red-900/50 shadow-[0_0_40px_rgba(127,29,29,0.5)]"
                  >
                    <Skull size={48} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg">DERROTA</div>
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
                onClick={onMenu}
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
