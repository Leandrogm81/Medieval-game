import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Swords, Shield, Crown } from 'lucide-react';
import { GameState } from '../types';

interface GameEndModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({ gameState, onRestart }) => {
  const winner = gameState.gameOver ? gameState.realms[gameState.gameOver.winnerId] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
        <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl p-8 text-center space-y-8">
          <Trophy size={64} className="mx-auto text-amber-500 animate-bounce" />
          <h2 className="text-3xl md:text-5xl font-serif font-black text-amber-100 uppercase tracking-widest leading-tight">Crônica Encerrada</h2>
          <div className="py-8 bg-black/40 border-y border-stone-800 space-y-4">
             <p className="text-xl md:text-2xl font-black text-amber-50 uppercase tracking-widest">{winner?.name || 'Reino Misterioso'}</p>
             <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-[0.2em]">{gameState.gameOver?.reason}</p>
          </div>
          <button onClick={onRestart} className="px-12 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black uppercase text-xs md:text-sm rounded-sm transition-all shadow-lg active:scale-95 tracking-widest">
             Novo Reinado
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
