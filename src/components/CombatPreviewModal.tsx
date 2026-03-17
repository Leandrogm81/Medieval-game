import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Shield, Mountain, TreePine, Map as MapIcon, X, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';
import { Province, Army } from '../types';

interface CombatPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  attackerProv: Province | null;
  defenderProv: Province | null;
  attackingArmy: Army | null;
}

function getTerrainName(terrain: string): string {
  switch (terrain) {
    case 'plains': return 'Planícies';
    case 'forest': return 'Floresta';
    case 'mountain': return 'Montanha';
    default: return terrain;
  }
}

function getTerrainIcon(terrain: string) {
  switch (terrain) {
    case 'forest': return <TreePine size={14} className="text-green-400" />;
    case 'mountain': return <Mountain size={14} className="text-slate-400" />;
    default: return <MapIcon size={14} className="text-amber-400" />;
  }
}

function getTerrainDefenseBonus(terrain: string): number {
  switch (terrain) {
    case 'forest': return 1;
    case 'mountain': return 2;
    default: return 0;
  }
}

function calcPower(army: Army, multiplier: number): number {
  return Math.floor(
    army.infantry * 1.0 * multiplier +
    army.archers * 1.2 * multiplier +
    army.cavalry * 2.0 * multiplier
  );
}

export const CombatPreviewModal: React.FC<CombatPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  attackerProv,
  defenderProv,
  attackingArmy,
}) => {
  if (!isOpen || !attackerProv || !defenderProv || !attackingArmy) return null;

  const totalAttack = attackingArmy.infantry + attackingArmy.archers + attackingArmy.cavalry;
  const totalDefense = defenderProv.army.infantry + defenderProv.army.archers + defenderProv.army.cavalry;

  const terrainBonus = getTerrainDefenseBonus(defenderProv.terrain);
  const effectiveDefense = Math.max(0, defenderProv.defense - (defenderProv.siegeDamage || 0));

  const atkPower = calcPower(attackingArmy, 1.0);
  const defPower = calcPower(defenderProv.army, 1.5) + effectiveDefense * 20 + terrainBonus * 15;
  
  const ratio = atkPower / Math.max(1, defPower);
  let riskLevel: 'favorable' | 'balanced' | 'unfavorable';
  let riskColor: string;
  let riskLabel: string;
  let RiskIcon: React.ElementType;

  if (ratio > 1.5) {
    riskLevel = 'favorable';
    riskColor = 'text-green-400';
    riskLabel = 'Favorável';
    RiskIcon = CheckCircle;
  } else if (ratio > 0.8) {
    riskLevel = 'balanced';
    riskColor = 'text-amber-400';
    riskLabel = 'Equilibrado';
    RiskIcon = MinusCircle;
  } else {
    riskLevel = 'unfavorable';
    riskColor = 'text-red-400';
    riskLabel = 'Desfavorável';
    RiskIcon = AlertTriangle;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border-2 border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-900/40 to-slate-900 border-b border-red-500/20 flex justify-between items-center">
            <h2 className="text-lg font-serif font-bold text-red-400 flex items-center gap-2">
              <Swords size={20} /> Previsão de Combate
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Armies Comparison */}
            <div className="grid grid-cols-2 gap-3">
              {/* Attacker */}
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Atacante — {attackerProv.name}
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Infantaria</span><span className="font-bold">{attackingArmy.infantry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Arqueiros</span><span className="font-bold">{attackingArmy.archers}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Cavalaria</span><span className="font-bold">{attackingArmy.cavalry}</span></div>
                  <div className="pt-1 border-t border-slate-700 flex justify-between font-bold">
                    <span>Total</span><span className="text-blue-400">{totalAttack}</span>
                  </div>
                </div>
              </div>

              {/* Defender */}
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                  Defensor — {defenderProv.name}
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Infantaria</span><span className="font-bold">{defenderProv.army.infantry}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Arqueiros</span><span className="font-bold">{defenderProv.army.archers}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Cavalaria</span><span className="font-bold">{defenderProv.army.cavalry}</span></div>
                  <div className="pt-1 border-t border-slate-700 flex justify-between font-bold">
                    <span>Total</span><span className="text-red-400">{totalDefense}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modifiers */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modificadores</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">{getTerrainIcon(defenderProv.terrain)} Terreno ({getTerrainName(defenderProv.terrain)})</span>
                  <span className={terrainBonus > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                    {terrainBonus > 0 ? `+${terrainBonus} DEF` : 'Neutro'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Shield size={14} className="text-blue-400" /> Fortificação</span>
                  <span className={effectiveDefense > 0 ? 'text-red-400 font-bold' : 'text-slate-500'}>
                    {effectiveDefense > 0 ? `Nível ${effectiveDefense}` : 'Nenhuma'}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className={`p-3 rounded-xl border flex items-center justify-center gap-3 ${
              riskLevel === 'favorable' ? 'bg-green-900/20 border-green-500/20' :
              riskLevel === 'balanced' ? 'bg-amber-900/20 border-amber-500/20' :
              'bg-red-900/20 border-red-500/20'
            }`}>
              <RiskIcon size={24} className={riskColor} />
              <div>
                <div className={`text-lg font-bold ${riskColor}`}>{riskLabel}</div>
                <div className="text-[10px] text-slate-400">
                  Poder de ataque: {atkPower} vs Poder de defesa: {defPower}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-700 bg-slate-800 grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Swords size={16} /> Atacar!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
