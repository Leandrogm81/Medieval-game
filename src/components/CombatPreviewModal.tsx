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

  const totalAttack = (attackingArmy.infantry || 0) + (attackingArmy.archers || 0) + (attackingArmy.cavalry || 0);
  const totalDefense = (defenderProv.army?.infantry || 0) + (defenderProv.army?.archers || 0) + (defenderProv.army?.cavalry || 0);

  const terrainBonus = getTerrainDefenseBonus(defenderProv.terrain);
  const effectiveDefense = Math.max(0, (defenderProv.defense || 0) - (defenderProv.siegeDamage || 0));

  // Improved power calculation for preview
  const atkPower = Math.floor((attackingArmy.infantry || 0) * 1.0 + (attackingArmy.archers || 0) * 1.2 + (attackingArmy.cavalry || 0) * 2.5);
  const defPower = Math.floor(((defenderProv.army?.infantry || 0) * 1.5 + (defenderProv.army?.archers || 0) * 1.2 + (defenderProv.army?.cavalry || 0) * 1.5) * (1 + (effectiveDefense * 0.2)));
  
  const ratio = atkPower / Math.max(1, defPower);
  let riskLevel: 'favorable' | 'balanced' | 'unfavorable';
  let riskColor: string;
  let riskLabel: string;
  let RiskIcon: React.ElementType;

  if (ratio > 1.3) {
    riskLevel = 'favorable';
    riskColor = 'text-green-400';
    riskLabel = 'Favorável';
    RiskIcon = CheckCircle;
  } else if (ratio > 0.7) {
    riskLevel = 'balanced';
    riskColor = 'text-amber-400';
    riskLabel = 'Incerteza';
    RiskIcon = MinusCircle;
  } else {
    riskLevel = 'unfavorable';
    riskColor = 'text-red-400';
    riskLabel = 'Desfavorável';
    RiskIcon = AlertTriangle;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2c1810] border-4 border-[#d4af37] rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#d4af37]/30 flex justify-between items-center bg-[#1a0f0a]">
            <h2 className="text-xl font-serif font-bold text-[#d4af37] flex items-center gap-3 tracking-widest uppercase">
              <Swords size={24} /> Planejamento de Ataque
            </h2>
            <button onClick={onClose} className="text-[#f5f2ed]/60 hover:text-white transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="p-6 space-y-5 bg-[#2c1810]">
            <div className="grid grid-cols-2 gap-4">
              {/* Attacker */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-1">
                  Atacante — {attackerProv.name}
                </h4>
                <div className="space-y-2 text-xs text-[#f5f2ed]">
                  <div className="flex justify-between"><span className="opacity-60">Infantaria</span><span className="font-bold">{attackingArmy.infantry}</span></div>
                  <div className="flex justify-between"><span className="opacity-60">Arqueiros</span><span className="font-bold">{attackingArmy.archers}</span></div>
                  <div className="flex justify-between"><span className="opacity-60">Cavalaria</span><span className="font-bold">{attackingArmy.cavalry}</span></div>
                  <div className="pt-2 mt-1 border-t border-white/10 flex justify-between font-bold text-blue-400">
                    <span>Total</span><span>{totalAttack}</span>
                  </div>
                </div>
              </div>

              {/* Defender */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-1">
                  Defensor — {defenderProv.name}
                </h4>
                <div className="space-y-2 text-xs text-[#f5f2ed]">
                  <div className="flex justify-between"><span className="opacity-60">Infantaria</span><span className="font-bold">{defenderProv.army?.infantry ?? 0}</span></div>
                  <div className="flex justify-between"><span className="opacity-60">Arqueiros</span><span className="font-bold">{defenderProv.army?.archers ?? 0}</span></div>
                  <div className="flex justify-between"><span className="opacity-60">Cavalaria</span><span className="font-bold">{defenderProv.army?.cavalry ?? 0}</span></div>
                  <div className="pt-2 mt-1 border-t border-white/10 flex justify-between font-bold text-red-400">
                    <span>Total</span><span>{totalDefense}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modifiers */}
            <div className="bg-black/20 p-4 rounded-xl border border-[#d4af37]/10 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-[#f5f2ed]/60">
                  {getTerrainIcon(defenderProv.terrain)} 
                  Terreno: <span className="text-[#f5f2ed]">{getTerrainName(defenderProv.terrain)}</span>
                </span>
                <span className={terrainBonus > 0 ? 'text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded' : 'text-slate-500 italic'}>
                  {terrainBonus > 0 ? `+${terrainBonus * 20}% Defesa` : 'Sem bônus'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-[#f5f2ed]/60">
                  <Shield size={14} className="text-[#d4af37]" /> 
                  Fortificações: <span className="text-[#f5f2ed]">Nível {effectiveDefense}</span>
                </span>
                <span className={effectiveDefense > 0 ? 'text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded' : 'text-slate-500 italic'}>
                  {effectiveDefense > 0 ? `+${effectiveDefense * 20}% Defesa` : 'Nenhuma'}
                </span>
              </div>
            </div>

            {/* Counter Warning */}
            <div className="text-[10px] text-amber-200/50 italic bg-amber-900/10 p-2 rounded border border-amber-500/10">
              * Lembre-se: Cavalaria {'>'} Arqueiros {'>'} Infantaria {'>'} Cavalaria. A composição pode mudar drasticamente o resultado real.
            </div>

            {/* Final Assessment */}
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-4 shadow-inner ${
              riskLevel === 'favorable' ? 'bg-green-900/20 border-green-500/40 text-green-300' :
              riskLevel === 'balanced' ? 'bg-amber-900/20 border-amber-500/40 text-amber-300' :
              'bg-red-900/20 border-red-500/40 text-red-300'
            }`}>
              <RiskIcon size={32} />
              <div className="text-center">
                <div className="text-2xl font-serif font-bold uppercase tracking-tighter">{riskLabel}</div>
                <div className="text-[10px] opacity-60 font-mono tracking-widest mt-1">
                  ESTIMATIVA DE PODER: {atkPower} VS {defPower}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 border-t border-[#d4af37]/30 bg-[#1a0f0a] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-[#f5f2ed]/80 font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-all active:scale-95"
            >
              Recuar
            </button>
            <button
              onClick={onConfirm}
              className="flex-[2] py-3 bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] font-bold rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Swords size={20} /> INICIAR ATAQUE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
