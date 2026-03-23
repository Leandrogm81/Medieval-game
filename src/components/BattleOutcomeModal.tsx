import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Swords, Shield, AlertTriangle, Zap, TrendingUp, TrendingDown, Info, Landmark, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { BattleResult } from '../types';

interface BattleOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BattleResult;
  attackerName: string;
  defenderName: string;
  provinceName: string;
  conquered: boolean;
}

export const BattleOutcomeModal: React.FC<BattleOutcomeModalProps> = ({ isOpen, onClose, result, attackerName, defenderName, provinceName, conquered }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                      className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className={`p-4 ${conquered ? 'bg-amber-600' : 'bg-red-900'} border-b border-amber-900/30 flex justify-between items-center text-stone-950 font-black uppercase tracking-widest`}>
               <span>{conquered ? 'Vitória Gloriosa' : 'Retirada das Tropas'}</span>
               <button onClick={onClose} className="hover:scale-110 transition-transform"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-8">
               <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-serif font-black text-amber-50 uppercase tracking-tighter mb-2">{provinceName}</h3>
                  <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-widest">{attackerName} vs {defenderName}</p>
               </div>

               <div className="grid grid-cols-2 gap-8 py-6 border-y border-stone-800">
                  <div className="text-center">
                     <p className="text-[8px] text-stone-500 font-black uppercase mb-3">Perdas do Atacante</p>
                     <div className="flex justify-center gap-4 text-red-500 font-black">
                        <div className="text-center"><span className="text-[8px] block">Inf</span> {result.attackerLosses.infantry}</div>
                        <div className="text-center"><span className="text-[8px] block">Arq</span> {result.attackerLosses.archers}</div>
                        <div className="text-center"><span className="text-[8px] block">Cav</span> {result.attackerLosses.cavalry}</div>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[8px] text-stone-500 font-black uppercase mb-3">Perdas do Defensor</p>
                     <div className="flex justify-center gap-4 text-red-500 font-black">
                        <div className="text-center"><span className="text-[8px] block">Inf</span> {result.defenderLosses.infantry}</div>
                        <div className="text-center"><span className="text-[8px] block">Arq</span> {result.defenderLosses.archers}</div>
                        <div className="text-center"><span className="text-[8px] block">Cav</span> {result.defenderLosses.cavalry}</div>
                     </div>
                  </div>
               </div>

               {conquered && (
                  <div className="bg-amber-600/10 border border-amber-600/30 p-4 rounded text-center">
                     <p className="text-amber-500 font-serif italic text-sm md:text-md">As terras de {provinceName} agora juram lealdade ao seu reino sob a ameaça de ferro e fogo.</p>
                  </div>
               )}
            </div>

            <div className="p-4 bg-black/40 flex justify-center">
               <button onClick={onClose} className="px-12 py-3 bg-stone-800 hover:bg-stone-700 text-amber-500 font-black uppercase text-xs md:text-sm rounded-sm transition-all shadow-lg active:scale-95 tracking-widest">
                  Continuar
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
