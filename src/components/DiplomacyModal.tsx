import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Handshake, X, Scroll, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  diplomacyResult: {
    type: 'peace' | 'war' | 'tribute' | 'vassalage' | 'trade';
    realm: string;
    success: boolean;
    message: string;
  };
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({ isOpen, onClose, diplomacyResult }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border-2 border-emerald-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5 bg-emerald-950/20 border-b border-emerald-900/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-emerald-500 flex items-center gap-2">
              <Handshake size={24} /> Tratado Diplomático
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-emerald-900/20 rounded-full transition-colors text-emerald-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6 text-center">
            <div className="flex justify-center">
              {diplomacyResult.success ? (
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border-2 border-emerald-500/50">
                  <ShieldCheck size={40} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 border-2 border-red-500/50">
                  <AlertTriangle size={40} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-white">{diplomacyResult.realm}</h3>
              <p className={`text-sm font-bold uppercase tracking-widest ${diplomacyResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {diplomacyResult.success ? 'Proposta Aceita' : 'Proposta Rejeitada'}
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 italic text-slate-300 font-serif leading-relaxed">
              "{diplomacyResult.message}"
            </div>
          </div>

          <div className="p-5 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
            >
              Ciente
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
