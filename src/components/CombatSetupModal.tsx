import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Swords, Shield, AlertTriangle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Province, Army } from '../types';
import { UNIT_STATS } from '../logic/game-constants';

interface CombatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  attackerProv: Province;
  defenderProv: Province;
  attackingArmy: Army;
  onArmyChange: (army: Army) => void;
}

export const CombatSetupModal: React.FC<CombatSetupModalProps> = ({ isOpen, onClose, onConfirm, attackerProv, defenderProv, attackingArmy, onArmyChange }) => {
  const atkPower = Math.floor(attackingArmy.infantry * UNIT_STATS.infantry.attack +
    attackingArmy.archers * UNIT_STATS.archers.attack +
    attackingArmy.cavalry * UNIT_STATS.cavalry.attack);

  let defPower = Math.floor(defenderProv.army.infantry * UNIT_STATS.infantry.defense +
    defenderProv.army.archers * UNIT_STATS.archers.defense +
    defenderProv.army.cavalry * UNIT_STATS.cavalry.defense);

  if (defenderProv.terrain === 'mountain') defPower = Math.floor(defPower * 1.5);
  if (defenderProv.terrain === 'forest') defPower = Math.floor(defPower * 1.2);
  defPower = Math.floor(defPower * (1 + (defenderProv.defense * 0.2)));

  const winChance = Math.min(100, Math.max(0, Math.floor((atkPower / (atkPower + defPower)) * 100)));
  const riskLabel = winChance > 70 ? 'Favorável' : winChance > 40 ? 'Incerteza' : 'Desfavorável';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-black/40 border-b border-amber-900/20 flex justify-between items-center text-amber-100 font-black uppercase tracking-widest">
              Preparar Ataque
              <button onClick={onClose} aria-label="Fechar preparo para combate" title="Fechar preparo para combate"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center bg-stone-800/40 p-4 rounded-sm border border-white/5 shadow-inner">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-amber-500/80 font-black uppercase mb-1">{attackerProv.name}</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-50">{atkPower}</p>
                  <p className="text-[8px] text-stone-500 uppercase font-black">Força de Ataque</p>
                </div>
                <div className="flex flex-col items-center gap-2 px-4 border-x border-stone-800">
                  <Swords size={32} className="text-amber-500 animate-pulse" />
                  <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${riskLabel === 'Favorável' ? 'bg-green-600 text-white' : riskLabel === 'Incerteza' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
                    {riskLabel}
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-red-500/80 font-black uppercase mb-1">{defenderProv.name}</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-50">{defPower}</p>
                  <p className="text-[8px] text-stone-500 uppercase font-black">Força de Defesa</p>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 italic">
                O combate será resolvido quando a tropa chegar ao destino.
              </p>

              {/* Troop Composition Sliders */}
              <fieldset className="space-y-3">
                <legend className="text-[10px] text-amber-500 font-black uppercase mb-2">
                  Ajustar tropas de ataque
                </legend>
                {(['infantry', 'archers', 'cavalry'] as const).map(type => {
                  const maxAvailable = attackerProv.army[type];
                  if (maxAvailable <= 0) return null;
                  const labels: Record<string, string> = { infantry: 'Infantaria', archers: 'Arqueiros', cavalry: 'Cavalaria' };
                  const inputId = `combat-army-${type}`;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <label htmlFor={inputId} className="text-[10px] text-stone-400 w-20">
                        {labels[type]}
                      </label>
                      <input
                        id={inputId}
                        type="range"
                        min="0"
                        max={maxAvailable}
                        value={attackingArmy[type]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onArmyChange({ ...attackingArmy, [type]: val });
                        }}
                        aria-label={`Quantidade de ${labels[type]} no ataque`}
                        title={`Quantidade de ${labels[type]} no ataque`}
                        className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="text-[10px] text-amber-200 w-12 text-right">{attackingArmy[type]}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-[10px] font-bold pt-2 border-t border-stone-700">
                  <span className="text-stone-400">Total atacando:</span>
                  <span className="text-amber-200">{attackingArmy.infantry + attackingArmy.archers + attackingArmy.cavalry}</span>
                </div>
              </fieldset>

              <div className="grid grid-cols-3 gap-2 text-[8px] md:text-[10px] uppercase font-black">
                <div className="bg-stone-800/40 p-2 rounded border border-white/5 text-center">
                  <span className="text-stone-500 block">Infantaria</span>
                  <span className="text-amber-200">{attackingArmy.infantry} vs {defenderProv.army.infantry}</span>
                </div>
                <div className="bg-stone-800/40 p-2 rounded border border-white/5 text-center">
                  <span className="text-stone-500 block">Arqueiros</span>
                  <span className="text-amber-200">{attackingArmy.archers} vs {defenderProv.army.archers}</span>
                </div>
                <div className="bg-stone-800/40 p-2 rounded border border-white/5 text-center">
                  <span className="text-stone-500 block">Cavalaria</span>
                  <span className="text-amber-200">{attackingArmy.cavalry} vs {defenderProv.army.cavalry}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/40 flex gap-2 justify-end">
              <button type="button" onClick={onClose} aria-label="Cancelar ataque" title="Cancelar ataque" className="px-6 py-2 border border-stone-700 text-stone-500 font-bold uppercase text-xs md:text-sm rounded-sm hover:border-stone-500 transition-all">Cancelar</button>
              <button type="button" onClick={onConfirm} aria-label="Confirmar ataque" title="Confirmar ataque" className="px-10 py-2 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-xs md:text-sm rounded-sm transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Zap size={16} className="fill-white" /> Enviar Tropas
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
