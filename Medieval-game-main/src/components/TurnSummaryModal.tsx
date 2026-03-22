import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Swords, Handshake, AlertTriangle, Coins, Wheat, Hammer, Flag } from 'lucide-react';
import { TurnSummaryData } from '../types';

interface TurnSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TurnSummaryData | null;
}

export const TurnSummaryModal: React.FC<TurnSummaryModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="bg-[#1a0f0a] border-2 border-[#d4af37]/50 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#d4af37]/20 flex justify-between items-center bg-black/40">
            <h2 className="text-xl font-serif font-bold text-[#d4af37] flex items-center gap-2">
              <span className="bg-[#d4af37] text-black p-1 rounded">
                <TrendingUp size={18} />
              </span>
              Resumo do Turno
            </h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Coins size={16} /> Economia do Reino
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <Coins size={18} />
                    <span className="text-base font-bold">Ouro</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Renda:</span>
                      <span className="text-green-400 font-bold">+{Math.floor(data.goldIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Manut.:</span>
                      <span className="text-red-400 font-bold">-{Math.floor(data.goldMaintenance)}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-lg">
                      <span>Saldo:</span>
                      <span className={data.goldNet >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {data.goldNet >= 0 ? '+' : ''}{Math.floor(data.goldNet)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <Wheat size={18} />
                    <span className="text-base font-bold">Comida</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Produção:</span>
                      <span className="text-green-400 font-bold">+{Math.floor(data.foodIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Consumo:</span>
                      <span className="text-red-400 font-bold">-{Math.floor(data.foodMaintenance)}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-lg">
                      <span>Saldo:</span>
                      <span className={data.foodNet >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {data.foodNet >= 0 ? '+' : ''}{Math.floor(data.foodNet)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Territory & Diplomacy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Territory */}
              {(data.provincesGained.length > 0 || data.provincesLost.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <Flag size={14} /> Território
                  </h3>
                  <div className="space-y-1">
                    {data.provincesGained.map(p => (
                      <div key={p} className="text-xs flex items-center gap-2 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        <TrendingUp size={12} /> + {p}
                      </div>
                    ))}
                    {data.provincesLost.map(p => (
                      <div key={p} className="text-xs flex items-center gap-2 text-red-400 bg-red-400/10 px-2 py-1 rounded">
                        <TrendingDown size={12} /> - {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diplomacy */}
              {(data.newWars.length > 0 || data.newTreaties.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                    <Handshake size={16} /> Diplomacia
                  </h3>
                  <div className="space-y-1.5">
                    {data.newWars.map(w => (
                      <div key={w} className="text-sm flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-2 rounded font-bold">
                        <Swords size={14} /> Guerra: {w}
                      </div>
                    ))}
                    {data.newTreaties.map(t => (
                      <div key={t} className="text-sm flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-2 rounded">
                        <Handshake size={14} /> Acordo: {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Alerts & Events */}
            {(data.rebellionRisk.length > 0 || data.events.length > 0) && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                {data.rebellionRisk.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-red-200 uppercase tracking-tight">Aviso de Rebelião!</p>
                      <p className="text-xs text-red-200/70 mt-1">Baixa lealdade em: {data.rebellionRisk.join(', ')}</p>
                    </div>
                  </div>
                )}
                
                {data.events.map((e, i) => (
                  <div key={i} className="bg-[#d4af37]/10 border border-[#d4af37]/20 p-3 rounded-xl text-xs text-[#d4af37]/90 italic">
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="p-4 bg-black/40 border-t border-[#d4af37]/20">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#d4af37] hover:bg-[#b8860b] text-black font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#d4af37]/20"
            >
              Prosseguir ao Próximo Turno
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
