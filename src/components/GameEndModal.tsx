import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Skull, RefreshCw, Home } from 'lucide-react';
import { GameState } from '../types';

interface GameEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onRestart: () => void;
}

const DEFEAT_PHRASES = [
  'As crônicas lembrarão seu nome, mas as muralhas já não o protegem.',
  'Até os maiores impérios viram pó. O seu não foi exceção.',
  'A história é escrita pelos vencedores. Hoje, você não segura a pena.',
  'Seu castelo resistiu a incontáveis cercos, mas nenhum reino é eterno.',
  'O trono que você ocupou agora pertence a outra dinastia.',
];

export const GameEndModal: React.FC<GameEndModalProps> = ({ isOpen, onClose, gameState, onRestart }) => {
  // Frase temática estável por sessão de derrota
  const defeatPhrase = useMemo(() => {
    return DEFEAT_PHRASES[Math.floor(Math.random() * DEFEAT_PHRASES.length)];
  }, [gameState.gameOver]);

  if (!isOpen) return null;

  const playerRealm = gameState.realms[gameState.playerRealmId];
  const isPlayerWinner = !gameState.gameOver || gameState.gameOver.winnerId === gameState.playerRealmId;
  const winnerName = gameState.gameOver?.winnerId
    ? gameState.realms[gameState.gameOver.winnerId]?.name || 'Um reino rival'
    : playerRealm?.name || 'Desconhecido';

  // Estatísticas reais de tracking (Fase 2 — RF-02-09)
  const stats = {
    turns: gameState.turn,
    provinces: Object.values(gameState.provinces).filter(p => p.ownerId === gameState.playerRealmId).length,
    maxProvinces: playerRealm?.maxProvincesHeld ?? 0,
    battlesWon: playerRealm?.battlesWon ?? 0,
    realmsDefeated: playerRealm?.realmsDefeated ?? 0,
    cumulativeGold: playerRealm?.cumulativeGold ?? 0,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={`bg-slate-900 border-4 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden ${
            isPlayerWinner ? 'border-amber-600/50' : 'border-red-900/60'
          }`}
        >
          <div className="p-10 text-center space-y-6">
            <div className="flex justify-center">
              {isPlayerWinner ? (
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
              <h2 className={`text-4xl font-black uppercase tracking-tighter italic ${isPlayerWinner ? 'text-white' : 'text-red-400'}`}>
                {isPlayerWinner ? 'Fim da Jornada' : 'O Fim de Uma Era'}
              </h2>
              <p className="text-slate-400 font-serif italic">
                {isPlayerWinner
                  ? `Vossa Majestade triunfou! O reino de ${winnerName} agora governa todas as terras.`
                  : `O reino de ${winnerName} conquistou a supremacia absoluta.`}
              </p>
              {!isPlayerWinner && (
                <p className="text-amber-300/80 font-serif italic text-sm">"{defeatPhrase}"</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-800">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Turnos</p>
                <p className="text-2xl font-black text-white">{stats.turns}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Províncias</p>
                <p className="text-2xl font-black text-emerald-500">{stats.provinces}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Pico territorial</p>
                <p className="text-2xl font-black text-indigo-400">{stats.maxProvinces}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Batalhas vencidas</p>
                <p className="text-xl font-black text-orange-400">{stats.battlesWon}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reinos derrotados</p>
                <p className="text-xl font-black text-red-400">{stats.realmsDefeated}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ouro acumulado</p>
                <p className="text-xl font-black text-yellow-400">{stats.cumulativeGold.toLocaleString('pt-BR')}</p>
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
