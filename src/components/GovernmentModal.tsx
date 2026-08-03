import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark } from 'lucide-react';
import { GameState, GovernmentType, Realm } from '../types';
import { GOVERNMENT_STATS, GOVERNMENT_CHANGE_COST, GOVERNMENT_CHANGE_COOLDOWN, GOVERNMENT_CHANGE_LOYALTY_PENALTY } from '../logic/governmentLogic';

interface GovernmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  playerRealmId: string;
  onChange: (type: GovernmentType) => void;
}

const STAT_LABELS: { key: keyof (typeof GOVERNMENT_STATS)['monarchy']; label: string; format: (v: number) => string }[] = [
  { key: 'defense', label: 'Defesa', format: v => `+${Math.round((v - 1) * 100)}%` },
  { key: 'attack', label: 'Ataque', format: v => `+${Math.round((v - 1) * 100)}%` },
  { key: 'goldIncome', label: 'Ouro', format: v => v > 1 ? `+${Math.round((v - 1) * 100)}%` : v < 1 ? `${Math.round((v - 1) * 100)}%` : '—' },
  { key: 'foodProduction', label: 'Comida', format: v => v > 1 ? `+${Math.round((v - 1) * 100)}%` : v < 1 ? `${Math.round((v - 1) * 100)}%` : '—' },
  { key: 'diplomaticActions', label: 'Ações diplomáticas', format: v => v > 0 ? `+${v}` : v < 0 ? `${v}` : '—' },
  { key: 'techGeneration', label: 'Geração de tech', format: v => v < 1 ? `-${Math.round((1 - v) * 100)}%` : '—' },
  { key: 'recruitmentCost', label: 'Custo de recrutamento', format: v => v < 1 ? `-${Math.round((1 - v) * 100)}%` : '—' },
  { key: 'populationGrowth', label: 'Crescimento populacional', format: v => v < 1 ? `-${Math.round((1 - v) * 100)}%` : '—' },
  { key: 'vassalGoldBonus', label: 'Ouro de vassalos', format: v => v > 0 ? `+${Math.round(v * 100)}%` : '—' },
  { key: 'vassalLoyaltyBonus', label: 'Lealdade de vassalos', format: v => v > 0 ? `+${v}` : '—' },
  { key: 'strategicResourceBonus', label: 'Recursos estratégicos', format: v => v > 1 ? `x${v}` : '—' },
  { key: 'stabilityInDistant', label: 'Estabilidade em províncias distantes', format: v => v < 0 ? `${v}%` : '—' },
  { key: 'relationPenalty', label: 'Relações com todos', format: v => v < 0 ? `${v}` : '—' },
];

export const GovernmentModal: React.FC<GovernmentModalProps> = ({
  isOpen,
  onClose,
  gameState,
  playerRealmId,
  onChange,
}) => {
  if (!isOpen) return null;

  const realm: Realm = gameState.realms[playerRealmId];
  if (!realm) return null;

  const cooldown = realm.governmentChangeCooldown || 0;
  const canAfford = realm.gold >= GOVERNMENT_CHANGE_COST.gold && realm.materials >= GOVERNMENT_CHANGE_COST.materials;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border-2 border-amber-900/50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <Landmark size={24} /> Governo
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-serif text-slate-300">
            {/* Governo atual */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-amber-900/40">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-lg">👑 Governo atual</span>
                <span className="text-2xl font-black text-amber-300">{GOVERNMENT_STATS[realm.government].name}</span>
              </div>
              <p className="text-sm italic text-slate-400 mt-1">"{GOVERNMENT_STATS[realm.government].flavor}"</p>
              <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                {STAT_LABELS.filter(s => {
                  const v = GOVERNMENT_STATS[realm.government][s.key] as number;
                  return s.format(v) !== '—';
                }).map(s => {
                  const v = GOVERNMENT_STATS[realm.government][s.key] as number;
                  return (
                    <p key={s.key} className="flex justify-between border-b border-slate-700/40 py-0.5">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="text-amber-300 font-bold">{s.format(v)}</span>
                    </p>
                  );
                })}
              </div>
              {cooldown > 0 && (
                <p className="text-xs text-red-400 mt-2">⏳ Reforma disponível em {cooldown} turnos</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Custo da reforma: {GOVERNMENT_CHANGE_COST.gold} ouro + {GOVERNMENT_CHANGE_COST.materials} obra · instabilidade -{Math.abs(GOVERNMENT_CHANGE_LOYALTY_PENALTY)} lealdade por 3 turnos
              </p>
            </div>

            {/* Outros governos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(GOVERNMENT_STATS) as GovernmentType[])
                .filter(g => g !== realm.government)
                .map(type => {
                  const stats = GOVERNMENT_STATS[type];
                  const disabled = cooldown > 0 || !canAfford;
                  return (
                    <div key={type} className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-100">{stats.name}</span>
                        <span className="text-[10px] italic text-slate-500 max-w-[55%] text-right">"{stats.flavor}"</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] mb-3">
                        {STAT_LABELS.filter(s => s.format(stats[s.key] as number) !== '—').map(s => (
                          <p key={s.key} className="flex justify-between">
                            <span className="text-slate-500">{s.label}</span>
                            <span className={(stats[s.key] as number) > 1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                              {s.format(stats[s.key] as number)}
                            </span>
                          </p>
                        ))}
                      </div>
                      <button
                        onClick={() => onChange(type)}
                        disabled={disabled}
                        className={`w-full py-2 rounded border text-xs font-black uppercase tracking-widest transition-all min-h-[44px] ${
                          disabled
                            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-600/20 border-amber-600 text-amber-200 hover:bg-amber-600/30 active:scale-95'
                        }`}
                      >
                        {cooldown > 0 ? `Aguarde ${cooldown} turnos` : !canAfford ? 'Recursos insuficientes' : 'Reformar Governo'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
