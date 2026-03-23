import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Swords, Handshake, AlertTriangle, Coins, Carrot, Hammer, Info } from 'lucide-react';
import { TurnSummaryData } from '../types';

interface TurnResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TurnSummaryData;
}

export const TurnResultModal: React.FC<TurnResultModalProps> = ({ isOpen, onClose, data }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-900/50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-4 md:p-6 border-b border-amber-900/20 bg-black/40 flex justify-between items-center">
              <h2 className="text-xl md:text-3xl font-black text-amber-100 uppercase tracking-widest flex items-center gap-3">
                Relatório de Fim de Turno
              </h2>
              <button onClick={onClose} className="p-1 text-stone-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
               {/* Financials */}
               <div className="space-y-4">
                  <h3 className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest border-b border-stone-800 pb-1">Economia do Reino</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-stone-800/40 p-2 rounded border border-white/5">
                        <Coins size={16} className="text-amber-500 mb-1" />
                        <p className="text-[8px] text-stone-500 uppercase font-bold">Ouro</p>
                        <p className={`text-xs md:text-sm font-black ${data.goldNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {data.goldNet >= 0 ? '+' : ''}{data.goldNet}
                        </p>
                     </div>
                     <div className="bg-stone-800/40 p-2 rounded border border-white/5">
                        <Carrot size={16} className="text-orange-500 mb-1" />
                        <p className="text-[8px] text-stone-500 uppercase font-bold">Grãos</p>
                        <p className={`text-xs md:text-sm font-black ${data.foodNet >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {data.foodNet >= 0 ? '+' : ''}{data.foodNet}
                        </p>
                     </div>
                     <div className="bg-stone-800/40 p-2 rounded border border-white/5">
                        <Hammer size={16} className="text-blue-500 mb-1" />
                        <p className="text-[8px] text-stone-500 uppercase font-bold">Materiais</p>
                        <p className="text-xs md:text-sm font-black text-amber-50">
                           {data.materialsIncome > 0 ? '+' : ''}{Math.floor(data.materialsIncome)}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Events & News */}
               <div className="space-y-4">
                  <h3 className="text-xs md:text-sm font-black text-amber-500 uppercase tracking-widest border-b border-stone-800 pb-1">Eventos & Notícias</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                     {data.events.length > 0 ? data.events.map((e, i) => (
                        <div key={i} className="flex gap-2 text-[10px] md:text-xs">
                           <Info size={14} className="text-amber-500 flex-shrink-0" />
                           <p className="text-stone-300 font-serif italic">{e}</p>
                        </div>
                     )) : (
                        <p className="text-[10px] md:text-xs text-stone-600 italic">Nada de relevante ocorreu neste turno.</p>
                     )}
                  </div>
               </div>
            </div>

            <div className="p-4 bg-black/40 flex justify-end">
               <button onClick={onClose} className="px-8 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs md:text-sm uppercase tracking-widest rounded-sm transition-all shadow-lg active:scale-95">
                  Confirmar
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
