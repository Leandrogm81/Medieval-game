import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, X, TrendingUp, TrendingDown, Users, Coins, Wheat, Hammer } from 'lucide-react';

interface TurnResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    turnNumber: number;
    results: {
      goldChange: number;
      foodChange: number;
      materialsChange: number;
      populationChange: number;
      events: string[];
    };
  } | null;
}

export const TurnResultModal: React.FC<TurnResultModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { turnNumber, results } = data;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border-2 border-amber-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <RotateCw size={24} /> Relatório do Turno {turnNumber}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                <Coins size={20} className="text-yellow-400" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Ouro</p>
                <div className="flex items-center gap-1">
                  {results.goldChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  <p className={`text-xl font-bold ${results.goldChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.goldChange >= 0 ? '+' : ''}{results.goldChange}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                <Wheat size={20} className="text-green-400" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Comida</p>
                <div className="flex items-center gap-1">
                  {results.foodChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  <p className={`text-xl font-bold ${results.foodChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.foodChange >= 0 ? '+' : ''}{results.foodChange}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                <Hammer size={20} className="text-slate-300" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Materiais</p>
                <div className="flex items-center gap-1">
                  {results.materialsChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  <p className={`text-xl font-bold ${results.materialsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.materialsChange >= 0 ? '+' : ''}{results.materialsChange}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                <Users size={20} className="text-blue-400" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">População</p>
                <div className="flex items-center gap-1">
                  {results.populationChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  <p className={`text-xl font-bold ${results.populationChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results.populationChange >= 0 ? '+' : ''}{results.populationChange}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Eventos do Turno</h3>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2 max-h-40 overflow-y-auto font-serif text-sm italic text-slate-300">
                {results.events.length === 0 ? (
                  <p className="text-center opacity-50">Nenhum evento significativo...</p>
                ) : (
                  results.events.map((event, idx) => (
                    <div key={idx} className="border-l-2 border-amber-900/30 pl-3 py-1">
                      <p>{event}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-12 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-900/20 uppercase tracking-widest text-sm"
            >
              Continuar Reinado
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
