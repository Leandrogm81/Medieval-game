import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Wheat, Hammer, Swords, Handshake, AlertTriangle, TrendingUp, TrendingDown, ChevronRight, Shield, Crown } from 'lucide-react';

export interface TurnSummaryData {
  turn: number;
  goldIncome: number;
  goldMaintenance: number;
  foodIncome: number;
  foodMaintenance: number;
  materialIncome: number;
  provincesGained: string[];
  provincesLost: string[];
  newWars: string[];
  peaceTreaties: string[];
  rebellions: string[];
  lowLoyaltyProvinces: string[];
  event: string | null;
}

interface TurnSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TurnSummaryData | null;
}

export const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen || !data) return null;

  const netGold = data.goldIncome - data.goldMaintenance;
  const netFood = data.foodIncome - data.foodMaintenance;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-amber-900/40 to-slate-900 border-b border-amber-500/20 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-amber-400 flex items-center gap-2">
              <Crown size={20} /> Resumo — Turno {data.turn}
            </h2>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Economy */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Economia</h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <Coins size={16} className="mx-auto text-yellow-400 mb-1" />
                  <div className={`font-bold ${netGold >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {netGold >= 0 ? '+' : ''}{netGold}
                  </div>
                  <div className="text-slate-500">Ouro</div>
                </div>
                <div>
                  <Wheat size={16} className="mx-auto text-green-400 mb-1" />
                  <div className={`font-bold ${netFood >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {netFood >= 0 ? '+' : ''}{netFood}
                  </div>
                  <div className="text-slate-500">Comida</div>
                </div>
                <div>
                  <Hammer size={16} className="mx-auto text-slate-300 mb-1" />
                  <div className="font-bold text-green-400">+{data.materialIncome}</div>
                  <div className="text-slate-500">Materiais</div>
                </div>
              </div>
            </div>

            {/* Territory */}
            {(data.provincesGained.length > 0 || data.provincesLost.length > 0) && (
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Território</h3>
                <div className="space-y-1 text-xs">
                  {data.provincesGained.map((p, i) => (
                    <div key={`g${i}`} className="flex items-center gap-2 text-green-400">
                      <TrendingUp size={12} /> Conquistado: <span className="font-bold">{p}</span>
                    </div>
                  ))}
                  {data.provincesLost.map((p, i) => (
                    <div key={`l${i}`} className="flex items-center gap-2 text-red-400">
                      <TrendingDown size={12} /> Perdido: <span className="font-bold">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diplomacy */}
            {(data.newWars.length > 0 || data.peaceTreaties.length > 0) && (
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diplomacia</h3>
                <div className="space-y-1 text-xs">
                  {data.newWars.map((w, i) => (
                    <div key={`w${i}`} className="flex items-center gap-2 text-red-400">
                      <Swords size={12} /> Nova guerra: <span className="font-bold">{w}</span>
                    </div>
                  ))}
                  {data.peaceTreaties.map((t, i) => (
                    <div key={`t${i}`} className="flex items-center gap-2 text-green-400">
                      <Handshake size={12} /> Paz com: <span className="font-bold">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {(data.rebellions.length > 0 || data.lowLoyaltyProvinces.length > 0) && (
              <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Alertas Internos
                </h3>
                <div className="space-y-1 text-xs">
                  {data.rebellions.map((r, i) => (
                    <div key={`r${i}`} className="text-red-300">🔥 Rebelião em <span className="font-bold">{r}</span></div>
                  ))}
                  {data.lowLoyaltyProvinces.map((p, i) => (
                    <div key={`ll${i}`} className="text-amber-300">⚠️ Lealdade crítica em <span className="font-bold">{p}</span></div>
                  ))}
                </div>
              </div>
            )}

            {/* Event */}
            {data.event && (
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Evento</h3>
                <p className="text-xs opacity-80">{data.event}</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-800">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
