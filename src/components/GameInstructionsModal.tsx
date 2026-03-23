import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Swords, Scroll, Shield } from 'lucide-react';

interface GameInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                      className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl p-8 space-y-4">
             <div className="flex justify-between items-center text-amber-100 font-black uppercase tracking-widest gap-3">
               <HelpCircle size={20} className="text-amber-500" /> Guia de Conquista
               <button onClick={onClose}><X size={20}/></button>
            </div>
            <div className="space-y-4 text-stone-300 font-serif italic text-xs md:text-sm max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
               <p><b className="text-amber-500 uppercase not-italic">Objetivo:</b> Domine 70% das províncias ou acumule 10.000 de ouro para vencer como soberano incontestável.</p>
               <p><b className="text-amber-500 uppercase not-italic">Administração:</b> Cada ação custa Pontos de Ação (AP). Use-os para marchar tropas, recrutar novos regimentos ou construir projetos de infraestrutura.</p>
               <p><b className="text-amber-500 uppercase not-italic">Recursos:</b> Ouro, Alimentos e Materiais são essenciais. Gerencie a lealdade e a produção regional para evitar fome e deserção.</p>
               <p><b className="text-amber-500 uppercase not-italic">Combine e Conquiste:</b> Marque alvos adjacentes para atacar. O terreno e bônus defensivos em montanhas ou florestas podem virar a maré da guerra.</p>
               <p className="border-t border-stone-800 pt-4 text-amber-500/60 text-center font-serif text-[10px] md:text-xs">Que os deuses da guerra favoreçam seu estandarte.</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
