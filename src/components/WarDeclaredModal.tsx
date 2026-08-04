import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield } from 'lucide-react';

interface WarDeclaredModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackerName: string;
  attackerRealmId?: string;
}

export const WarDeclaredModal: React.FC<WarDeclaredModalProps> = ({
  isOpen,
  onClose,
  attackerName,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.7 }}
          className="bg-gradient-to-br from-red-950/80 to-slate-900 border-4 border-red-700/60 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto w-20 h-20 bg-red-900/40 rounded-full flex items-center justify-center border-2 border-red-700/50">
              <Sword size={40} className="text-red-400" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-red-400 uppercase tracking-widest italic drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                Guerra Declarada!
              </h2>
              <p className="mt-2 text-slate-300 font-serif italic text-lg leading-relaxed">
                O reino de <span className="text-red-300 font-black not-italic">{attackerName}</span> rompeu as relações e
                declarou guerra contra o seu reino!
              </p>
            </div>

            <div className="bg-black/30 rounded-lg border border-red-900/40 p-3 text-sm text-slate-400 font-serif italic">
              "A espada foi desembainhada. Reforce suas fronteiras e posicione seus exércitos — a invasão pode começar a qualquer momento."
            </div>

            <button
              onClick={onClose}
              className="w-full min-h-[52px] py-4 bg-red-700 hover:bg-red-600 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-red-900/30"
            >
              <Shield size={20} /> Preparar Defesa!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
