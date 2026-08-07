import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, ArrowRight, Coins, Zap, AlertTriangle } from 'lucide-react';
import { Province } from '../types';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProvince: Province | null;
  targetProvince: Province | null;
  playerGold: number;
  playerActionPoints: number;
  onConfirmMigration: (sourceId: string, targetId: string, amount: number) => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  sourceProvince,
  targetProvince,
  playerGold,
  playerActionPoints,
  onConfirmMigration
}) => {
  if (!isOpen || !sourceProvince || !targetProvince) return null;

  const minSourcePop = 10;
  const availableInSource = Math.max(0, sourceProvince.population - minSourcePop);
  const targetSpace = Math.max(0, targetProvince.maxPopulation - targetProvince.population);
  const maxPossible = Math.min(availableInSource, targetSpace);

  const [amount, setAmount] = useState<number>(() => Math.min(100, maxPossible));

  useEffect(() => {
    setAmount(Math.min(100, maxPossible));
  }, [sourceProvince.id, targetProvince.id, maxPossible]);

  // Costs: 1 gold per 10 settlers (min 1 gold if amount > 0), 1 AP
  const goldCost = amount > 0 ? Math.max(1, Math.ceil(amount / 10)) : 0;
  const apCost = 1;

  const hasGold = playerGold >= goldCost;
  const hasAP = playerActionPoints >= apCost;
  const canMigrate = amount > 0 && maxPossible > 0 && hasGold && hasAP;

  const handleConfirm = () => {
    if (!canMigrate) return;
    onConfirmMigration(sourceProvince.id, targetProvince.id, amount);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg overflow-hidden border bg-stone-900 border-amber-900/40 rounded-xl shadow-2xl text-amber-50"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-stone-950/80 border-amber-900/30">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold tracking-wide uppercase font-serif text-amber-200">
                Migração de População
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Source & Destination Preview */}
            <div className="grid grid-cols-5 items-center gap-3 p-4 bg-stone-950/50 border border-stone-800 rounded-lg">
              <div className="col-span-2 text-center space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Origem</span>
                <p className="text-sm font-bold text-amber-100 truncate">{sourceProvince.name}</p>
                <p className="text-xs text-stone-400">
                  Pop: <span className="font-semibold text-amber-300">{sourceProvince.population - (amount || 0)}</span> / {sourceProvince.maxPopulation}
                </p>
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center">
                <ArrowRight className="w-6 h-6 text-amber-500 animate-pulse" />
                <span className="text-[10px] text-amber-400 font-bold mt-1">+{amount}</span>
              </div>

              <div className="col-span-2 text-center space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Destino</span>
                <p className="text-sm font-bold text-amber-100 truncate">{targetProvince.name}</p>
                <p className="text-xs text-stone-400">
                  Pop: <span className="font-semibold text-amber-300">{targetProvince.population + (amount || 0)}</span> / {targetProvince.maxPopulation}
                </p>
              </div>
            </div>

            {/* Slider Section */}
            {maxPossible <= 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                  {availableInSource <= 0
                    ? `A província de origem precisa ter mais de ${minSourcePop} habitantes para permitir a saída de colonos.`
                    : `A província de destino já atingiu a capacidade populacional máxima.`}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-300">Habitantes a migrar:</span>
                  <span className="text-base font-bold text-amber-400">{amount} colonos</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={maxPossible}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>1 colono</span>
                  <span>Máximo: {maxPossible} colonos</span>
                </div>
              </div>
            )}

            {/* Costs Breakdown */}
            <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-lg space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Custos da Operação</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Transporte & Suprimentos (1g / 10 colonos):</span>
                </div>
                <span className={`font-bold ${hasGold ? 'text-amber-300' : 'text-rose-400'}`}>
                  {goldCost} Ouro {`(${playerGold} dispo.)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Pontos de Ação (AP):</span>
                </div>
                <span className={`font-bold ${hasAP ? 'text-amber-300' : 'text-rose-400'}`}>
                  {apCost} AP {`(${playerActionPoints} dispo.)`}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-stone-950/80 border-amber-900/30">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={!canMigrate}
              onClick={handleConfirm}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                canMigrate
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/20'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700/50'
              }`}
            >
              Confirmar Migração
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
