import React from 'react';
import { GameState } from '../types';
import { Trophy, Skull, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface GameOverModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ gameState, onRestart }) => {
  if (!gameState.gameOver) return null;

  const isPlayerWinner = gameState.gameOver.winnerId === gameState.playerRealmId;
  const winner = gameState.realms[gameState.gameOver.winnerId];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center"
      >
        <div className="mb-6 flex justify-center">
          {isPlayerWinner ? (
            <div className="relative">
              <Trophy size={80} className="text-amber-400" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full"
              />
            </div>
          ) : (
            <Skull size={80} className="text-slate-500" />
          )}
        </div>

        <h2 className={`text-4xl font-serif font-bold mb-2 ${isPlayerWinner ? 'text-amber-400' : 'text-slate-200'}`}>
          {isPlayerWinner ? 'Victory!' : 'Defeat!'}
        </h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          {gameState.gameOver.reason}
        </p>

        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold">World Statistics</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-200">{gameState.turn}</div>
              <div className="text-xs text-slate-500 uppercase">Turns Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-200" style={{ color: winner.color }}>
                {winner.name}
              </div>
              <div className="text-xs text-slate-500 uppercase">Dominant Realm</div>
            </div>
          </div>
        </div>

        <button 
          onClick={onRestart}
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} />
          Start New Campaign
        </button>
      </motion.div>
    </div>
  );
};
