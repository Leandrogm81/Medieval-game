import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Shield, Skull, Trophy, ChevronRight, Mountain, TreePine, Map as MapIcon } from 'lucide-react';
import { BattleResult } from '../gameLogic';
import { Army } from '../types';

interface BattleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BattleResult | null;
  attackerName: string;
  defenderName: string;
  provinceName: string;
  conquered: boolean;
}

function getTerrainLabel(terrain: string) {
  switch (terrain) {
    case 'forest': return { label: 'Floresta', icon: <TreePine size={14} className="text-green-400" /> };
    case 'mountain': return { label: 'Montanha', icon: <Mountain size={14} className="text-slate-400" /> };
    default: return { label: 'Planícies', icon: <MapIcon size={14} className="text-amber-400" /> };
  }
}

function ArmyColumn({ label, initial, losses, remaining, color }: { label: string; initial: Army; losses: Army; remaining: Army; color: string }) {
  const total = (initial.infantry || 0) + (initial.archers || 0) + (initial.cavalry || 0) + (initial.scouts || 0);
  const totalLost = (losses.infantry || 0) + (losses.archers || 0) + (losses.cavalry || 0) + (losses.scouts || 0);
  const pctLost = total > 0 ? Math.round((totalLost / total) * 100) : 0;

  return (
    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>{label}</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Infantaria</span>
          <span>{initial.infantry} → <span className="font-bold">{remaining.infantry}</span> <span className="text-red-400">(-{losses.infantry})</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Arqueiros</span>
          <span>{initial.archers} → <span className="font-bold">{remaining.archers}</span> <span className="text-red-400">(-{losses.archers})</span></span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Cavalaria</span>
          <span>{initial.cavalry} → <span className="font-bold">{remaining.cavalry}</span> <span className="text-red-400">(-{losses.cavalry})</span></span>
        </div>
        <div className="flex justify-between text-blue-400/80">
          <span className="opacity-60">Batedores</span>
          <span>{initial.scouts} → <span className="font-bold">{remaining.scouts}</span> <span className="text-red-400">(-{losses.scouts})</span></span>
        </div>
        <div className="pt-1 border-t border-slate-700 flex justify-between font-bold text-xs">
          <span>Baixas</span>
          <span className="text-red-400">{totalLost} ({pctLost}%)</span>
        </div>
      </div>
    </div>
  );
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  isOpen,
  onClose,
  result,
  attackerName,
  defenderName,
  provinceName,
  conquered,
}) => {
  if (!isOpen || !result) return null;

  const terrain = getTerrainLabel(result.terrain);
  const totalAtkLost = (result.attackerLosses.infantry || 0) + (result.attackerLosses.archers || 0) + (result.attackerLosses.cavalry || 0) + (result.attackerLosses.scouts || 0);
  const totalDefLost = (result.defenderLosses.infantry || 0) + (result.defenderLosses.archers || 0) + (result.defenderLosses.cavalry || 0) + (result.defenderLosses.scouts || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900 border-2 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          style={{ borderColor: result.won ? '#22c55e' : '#ef4444' }}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-center gap-3 ${
            result.won 
              ? 'bg-gradient-to-r from-green-900/40 to-slate-900 border-green-500/20' 
              : 'bg-gradient-to-r from-red-900/40 to-slate-900 border-red-500/20'
          }`}>
            {result.won ? (
              <Trophy size={24} className="text-green-400" />
            ) : (
              <Skull size={24} className="text-red-400" />
            )}
            <div className="text-center">
              <h2 className={`text-lg font-serif font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
                {result.won ? (conquered ? 'Vitória — Província Conquistada!' : 'Vitória!') : 'Derrota'}
              </h2>
              <p className="text-xs text-slate-400">
                Batalha por <span className="font-bold text-white">{provinceName}</span> — {result.rounds} rodada{result.rounds > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Armies */}
            <div className="grid grid-cols-2 gap-3">
              <ArmyColumn
                label={`⚔️ ${attackerName}`}
                initial={result.attackerInitial}
                losses={result.attackerLosses}
                remaining={result.attackerRemaining}
                color="text-blue-400"
              />
              <ArmyColumn
                label={`🛡️ ${defenderName}`}
                initial={result.defenderInitial}
                losses={result.defenderLosses}
                remaining={result.defenderRemaining}
                color="text-red-400"
              />
            </div>

            {/* Modifiers */}
            <div className="flex gap-2 justify-center text-[10px] text-slate-400">
              <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                {terrain.icon} {terrain.label}
              </span>
              {result.defenseLevel > 0 && (
                <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <Shield size={10} className="text-blue-400" /> Forte Nv.{result.defenseLevel}
                </span>
              )}
              <span className="bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                Total: <span className="text-red-400 font-bold">{totalAtkLost + totalDefLost}</span> mortos
              </span>
            </div>
          </div>

          <div className="p-3 border-t border-slate-700 bg-slate-800">
            <button
              onClick={onClose}
              className={`w-full py-2.5 font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                result.won 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-slate-600 hover:bg-slate-500 text-white'
              }`}
            >
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
