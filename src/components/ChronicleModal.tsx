import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scroll, History, ScrollText } from 'lucide-react';

interface ChronicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({ isOpen, onClose, logs }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                      className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-black/40 border-b border-amber-900/20 flex justify-between items-center text-amber-100 font-black uppercase tracking-widest gap-3">
               <Scroll size={20} className="text-amber-500" /> As Crônicas do Reino
               <button onClick={onClose}><X size={20}/></button>
            </div>
            
            <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar space-y-3 bg-[#1a1a1a]">
               {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-stone-900/40 border border-white/5 rounded relative group hover:bg-stone-800/60 transition-all">
                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 text-stone-500 group-hover:text-amber-500 transition-colors">
                        <History size={14} />
                     </div>
                     <p className="text-[10px] md:text-sm font-serif italic text-stone-300 leading-relaxed">{log}</p>
                  </div>
               )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                     <ScrollText size={64} className="mb-4" />
                     <p className="text-sm">A história ainda não foi escrita.</p>
                  </div>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
