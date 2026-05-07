import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scroll } from 'lucide-react';

interface ChronicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border-2 border-amber-900/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <Scroll size={24} /> Crônicas do Reino
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-serif text-slate-300">
            {logs.length === 0 ? (
              <p className="text-center italic opacity-50">Nenhuma crônica registrada ainda...</p>
            ) : (
              logs.map((entry, idx) => (
                <div key={idx} className="border-l-2 border-amber-900/30 pl-4 py-1">
                  <p className="leading-relaxed">{entry}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
