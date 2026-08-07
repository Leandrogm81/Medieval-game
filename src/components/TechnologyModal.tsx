import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FlaskConical } from 'lucide-react';
import { GameState, Realm, TechCategory } from '../types';
import { getTechUpgradeCost, TECH_CATEGORIES, TECH_MAX_LEVELS, getTechEffects } from '../logic/technologyLogic';

interface TechnologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  playerRealmId: string;
  onAllocate: (category: TechCategory) => void;
}

const CATEGORY_INFO: Record<TechCategory, { label: string; icon: string; description: string }> = {
  movement: { label: 'Movimento', icon: '🏃', description: '+0.5 AP por turno por nível' },
  assimilation: { label: 'Assimilação', icon: '🏗️', description: '-10% custo de assimilação por nível' },
  recruitment: { label: 'Recrutamento', icon: '👥', description: '+10% população recrutável por nível' },
  combat: { label: 'Combate', icon: '⚔️', description: '+5% ataque e defesa por nível' },
};

export const TechnologyModal: React.FC<TechnologyModalProps> = ({
  isOpen,
  onClose,
  gameState,
  playerRealmId,
  onAllocate,
}) => {
  if (!isOpen) return null;

  const realm: Realm = gameState.realms[playerRealmId];
  if (!realm) return null;

  const effects = getTechEffects(realm);
  const levels = realm.techLevels ?? { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };

  const enemyTech = Object.values(gameState.realms)
    .filter(r => r.id !== playerRealmId && r.id !== 'neutral' && r.techLevels)
    .map(r => ({ id: r.id, name: r.name, levels: r.techLevels }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-900 border-2 border-amber-900/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <FlaskConical size={24} /> Tecnologia
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-serif text-slate-300">
            {/* Pontos disponíveis */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-lg">🔬 Pontos de tecnologia</span>
                <span className="text-3xl font-black text-amber-300">{realm.techPoints}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Gere pontos por turno com população, workshops e courts (cap 20/turno).</p>
            </div>

            {/* Categorias */}
            {TECH_CATEGORIES.map(category => {
              const level = levels[category] ?? 0;
              const maxLevel = TECH_MAX_LEVELS[category];
              const cost = getTechUpgradeCost(level);
              const canAfford = realm.techPoints >= cost && level < maxLevel;
              const pct = (level / maxLevel) * 100;

              return (
                <div key={category} className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-slate-100 text-lg">
                        {CATEGORY_INFO[category].icon} {CATEGORY_INFO[category].label}
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">{CATEGORY_INFO[category].description}</p>
                    </div>
                    <span className="text-amber-400 font-black text-xl">Nível {level}</span>
                  </div>

                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-amber-700 to-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <button
                    onClick={() => onAllocate(category)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 rounded border text-sm font-black uppercase tracking-widest transition-all min-h-[44px] ${
                      canAfford
                        ? 'bg-amber-600/20 border-amber-600 text-amber-200 hover:bg-amber-600/30 active:scale-95'
                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {level >= maxLevel
                      ? 'Nível máximo'
                      : `Melhorar (${cost} pts${realm.techPoints >= cost ? '' : ` — faltam ${cost - realm.techPoints}`})`}
                  </button>
                </div>
              );
            })}

            {/* Efeitos atuais */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60 text-sm space-y-1">
              <span className="font-bold text-slate-100">Efeitos ativos:</span>
              <p>🏃 +{effects.movementAPBonus} AP/turno</p>
              <p>🏗️ -{Math.round(effects.assimilationDiscount * 100)}% custo assimilação</p>
              <p>👥 +{Math.round(effects.recruitmentBonus * 100)}% recrutamento</p>
              <p>⚔️ +{Math.round(effects.combatBonus * 100)}% ataque/defesa</p>
            </div>

            {/* Reinos vizinhos */}
            {enemyTech.length > 0 && (
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/60 text-sm">
                <span className="font-bold text-slate-100">Reinos rivais:</span>
                <div className="mt-2 space-y-1">
                  {enemyTech.map(r => (
                    <p key={r.id} className="text-slate-400">
                      • {r.name}: Mov {r.levels.movement} | Ass {r.levels.assimilation} | Rec {r.levels.recruitment} | Comb {r.levels.combat}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
