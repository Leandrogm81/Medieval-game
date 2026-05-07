import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, Shield, Swords, Coins, Map } from 'lucide-react';

interface GameInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameInstructionsModal: React.FC<GameInstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border-2 border-amber-900/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        >
          <div className="p-5 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <HelpCircle size={24} /> Como Governar seu Reino
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Map size={20} className="text-emerald-400" /> O Mapa e Províncias
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                O mundo é dividido em províncias. Cada província gera recursos (Ouro, Comida, Materiais) com base em sua população e edifícios.
                Selecione uma província para ver seus detalhes e realizar ações.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Coins size={20} className="text-yellow-400" /> Recursos e Economia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-yellow-400 font-bold text-xs uppercase mb-1">Ouro</p>
                  <p className="text-[10px] text-slate-500">Usado para recrutamento, construção e manutenção de exércitos.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-green-400 font-bold text-xs uppercase mb-1">Comida</p>
                  <p className="text-[10px] text-slate-500">Necessária para alimentar sua população e tropas.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-slate-300 font-bold text-xs uppercase mb-1">Materiais</p>
                  <p className="text-[10px] text-slate-500">Essenciais para construir fazendas, minas e oficinas.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Swords size={20} className="text-red-400" /> Guerra e Conquista
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Recrute tropas em suas províncias. Use a ação de Marcha para mover exércitos entre províncias adjacentes.
                Se mover para uma província inimiga, uma batalha ocorrerá. A vitória depende do tamanho e composição do seu exército.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Shield size={20} className="text-indigo-400" /> Diplomacia
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Nem tudo se resolve com a espada. Use a diplomacia para propor paz, exigir tributos ou até mesmo vassalagem de reinos mais fracos.
              </p>
            </section>
          </div>

          <div className="p-5 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-12 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-900/20 uppercase tracking-widest text-sm"
            >
              Entendido, Meu Senhor
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
