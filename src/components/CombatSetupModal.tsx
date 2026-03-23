import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, X, Shield, Users, ChevronRight } from 'lucide-react';
import { Province, Army } from '../types';

interface CombatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackerProv: Province;
  defenderProv: Province;
  attackingArmy: Army;
  onConfirm: (troops: Army) => void;
}

export const CombatSetupModal: React.FC<CombatSetupModalProps> = ({
  isOpen,
  onClose,
  attackerProv,
  defenderProv,
  attackingArmy,
  onConfirm
}) => {
  const [infantry, setInfantry] = useState(0);
  const [archers, setArchers] = useState(0);
  const [cavalry, setCavalry] = useState(0);
  const [scouts, setScouts] = useState(0);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({ infantry, archers, cavalry, scouts });
    onClose();
  };

  const maxTroops = attackerProv.troops;
  const provinceName = defenderProv.name;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border-2 border-red-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5 bg-red-950/20 border-b border-red-900/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
              <Swords size={24} /> Preparar Expedição
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-red-900/20 rounded-full transition-colors text-red-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Alvo da Marcha</p>
              <h3 className="text-2xl font-serif text-white">{provinceName}</h3>
            </div>

            <div className="space-y-6">
              {/* Infantry */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Infantaria</span>
                  <span className="text-white">{infantry} / {maxTroops.infantry}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxTroops.infantry}
                  value={infantry}
                  onChange={(e) => setInfantry(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              {/* Archers */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Arqueiros</span>
                  <span className="text-white">{archers} / {maxTroops.archers}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxTroops.archers}
                  value={archers}
                  onChange={(e) => setArchers(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              {/* Cavalry */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Cavalaria</span>
                  <span className="text-white">{cavalry} / {maxTroops.cavalry}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxTroops.cavalry}
                  value={cavalry}
                  onChange={(e) => setCavalry(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-red-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total Mobilizado</span>
                  <span className="text-xl font-black text-white">{infantry + archers + cavalry}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Poder de Ataque</span>
                <p className="text-xl font-black text-red-500">{infantry * 10 + archers * 15 + cavalry * 25}</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={handleConfirm}
              disabled={infantry + archers + cavalry === 0}
              className="w-full py-4 bg-red-700 hover:bg-red-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              Iniciar Marcha <ChevronRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
