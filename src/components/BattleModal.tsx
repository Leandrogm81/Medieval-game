import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, X, Shield, Skull } from 'lucide-react';

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  battleResult: {
    attacker: string;
    defender: string;
    winner: string;
    attackerLosses: { infantry: number; archers: number; cavalry: number };
    defenderLosses: { infantry: number; archers: number; cavalry: number };
    provinceName: string;
  };
}

export const BattleModal: React.FC<BattleModalProps> = ({ isOpen, onClose, battleResult }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="bg-slate-900 border-4 border-red-900/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 bg-red-950/30 border-b border-red-900/50 flex items-center justify-between">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-3 uppercase tracking-tighter">
              <Swords size={32} /> Relatório de Batalha
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-red-900/20 rounded-full transition-colors text-red-400">
              <X size={28} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center">
              <p className="text-slate-400 text-sm uppercase font-bold tracking-widest mb-2">Local do Conflito</p>
              <h3 className="text-3xl font-serif text-white">{battleResult.provinceName}</h3>
            </div>

            <div className="grid grid-cols-2 gap-8 items-center relative">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-700 font-black text-4xl italic opacity-20">VS</div>
              
              <div className={`text-center p-4 rounded-xl border-2 ${battleResult.winner === battleResult.attacker ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-red-900/50 bg-red-950/10'}`}>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Atacante</p>
                <p className="text-xl font-bold text-white truncate">{battleResult.attacker}</p>
                {battleResult.winner === battleResult.attacker && <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">Vencedor</span>}
              </div>

              <div className={`text-center p-4 rounded-xl border-2 ${battleResult.winner === battleResult.defender ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-red-900/50 bg-red-950/10'}`}>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Defensor</p>
                <p className="text-xl font-bold text-white truncate">{battleResult.defender}</p>
                {battleResult.winner === battleResult.defender && <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-black uppercase mt-2 inline-block">Vencedor</span>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Skull size={14} /> Baixas de Guerra
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Atacante</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between text-red-400"><span>Infantaria:</span> <span>-{battleResult.attackerLosses.infantry}</span></div>
                    <div className="flex justify-between text-red-400"><span>Arqueiros:</span> <span>-{battleResult.attackerLosses.archers}</span></div>
                    <div className="flex justify-between text-red-400"><span>Cavalaria:</span> <span>-{battleResult.attackerLosses.cavalry}</span></div>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Defensor</p>
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between text-red-400"><span>Infantaria:</span> <span>-{battleResult.defenderLosses.infantry}</span></div>
                    <div className="flex justify-between text-red-400"><span>Arqueiros:</span> <span>-{battleResult.defenderLosses.archers}</span></div>
                    <div className="flex justify-between text-red-400"><span>Cavalaria:</span> <span>-{battleResult.defenderLosses.cavalry}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-12 py-3 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 uppercase tracking-widest"
            >
              Enterrar os Mortos
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
