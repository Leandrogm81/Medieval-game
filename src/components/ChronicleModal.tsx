import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scroll, Swords, Coins, Handshake, Info, Shield, Flag } from 'lucide-react';

interface ChronicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({ isOpen, onClose, logs }) => {
  const categorizeLog = (log: string) => {
    const l = log.toUpperCase();
    if (l.includes('CONQUISTA') || l.includes('TOMOU') || l.includes('GUERRA') || l.includes('BATALHA') || l.includes('REBELIÃO')) {
      return { category: 'Militar', color: 'text-red-600', icon: <Swords size={14} /> };
    }
    if (l.includes('COMPRADO') || l.includes('VENDIDO') || l.includes('OURO') || l.includes('RECURSOS') || l.includes('FINALIZADO')) {
      return { category: 'Econômico', color: 'text-amber-600', icon: <Coins size={14} /> };
    }
    if (l.includes('PACTO') || l.includes('ALIANÇA') || l.includes('PRESENTE') || l.includes('DIPLOMACIA') || l.includes('VASSALO')) {
      return { category: 'Diplomático', color: 'text-purple-600', icon: <Handshake size={14} /> };
    }
    return { category: 'Geral', color: 'text-slate-600', icon: <Info size={14} /> };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl parchment-bg rounded-2xl shadow-2xl border-8 border-[#2c1810] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#2c1810]/10 flex justify-between items-center bg-[#2c1810]/5">
              <div className="flex items-center gap-3">
                <Scroll className="text-[#2c1810]" size={28} />
                <h2 className="text-2xl font-serif font-bold text-[#2c1810] medieval-title tracking-widest">
                  Crônicas do Reino
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#2c1810]"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-serif">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-[#2c1810]/40 italic">
                  Nenhum registro encontrado nas crônicas...
                </div>
              ) : (
                [...logs].reverse().map((log, i) => {
                  const { category, color, icon } = categorizeLog(log);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.5) }}
                      className="flex gap-4 items-start border-l-2 border-[#2c1810]/10 pl-4 py-1"
                    >
                      <div className={`mt-1 ${color} opacity-80 shrink-0`}>
                        {icon}
                      </div>
                      <div className="space-y-1">
                        <div className={`text-xs font-bold uppercase tracking-tighter ${color} opacity-60 mb-0.5`}>
                          {category}
                        </div>
                        <p className="text-[#1a0f0a] text-sm leading-relaxed">
                          {log}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2c1810]/10 bg-[#2c1810]/5 text-center">
              <p className="text-xs text-[#2c1810]/50 uppercase tracking-widest font-bold">
                Registros preservados para a posteridade
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
