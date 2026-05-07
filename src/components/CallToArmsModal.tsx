import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, Sword, X } from 'lucide-react';

interface CallToArmsModalProps {
  isOpen: boolean;
  defenderName: string;
  aggressorName: string;
  pactType: 'alliance' | 'defensivePact';
  onAccept: () => void;
  onRefuse: () => void;
}

export const CallToArmsModal: React.FC<CallToArmsModalProps> = ({
  isOpen,
  defenderName,
  aggressorName,
  pactType,
  onAccept,
  onRefuse
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-900/40 bg-stone-950 shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
        >
          <div className="flex items-center justify-between border-b border-red-900/30 bg-gradient-to-r from-red-950/70 to-orange-950/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-300">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-200/70">Chamado às armas</p>
                <h2 className="text-xl font-black text-amber-50">⚔️ Defesa urgente</h2>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-red-900/30 bg-black/20 p-4">
              <p className="text-sm text-stone-200">
                <span className="font-black text-amber-100">{defenderName}</span> está sob ataque de{' '}
                <span className="font-black text-amber-100">{aggressorName}</span>.
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Deseja honrar sua {pactType === 'alliance' ? 'aliança' : 'pacto defensivo'} e entrar na guerra?
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={onAccept}
                className="flex items-center justify-center gap-2 rounded-lg border border-emerald-700/50 bg-emerald-600/20 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-emerald-100 transition-colors hover:bg-emerald-600/30"
              >
                <Sword size={16} />
                Entrar na Guerra
              </button>

              <div className="group relative">
                <button
                  onClick={onRefuse}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700/50 bg-red-600/20 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-red-100 transition-colors hover:bg-red-600/30"
                  title={`Recusar quebrará o pacto e causará −50 relações com ${defenderName}`}
                >
                  <ShieldAlert size={16} />
                  Recusar
                </button>
                <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-[10px] text-stone-300 shadow-xl group-hover:block">
                  Recusar quebrará o pacto e causará −50 relações com {defenderName}.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-orange-900/30 bg-orange-950/20 p-3 text-[10px] text-stone-300">
              <X size={14} className="mt-0.5 shrink-0 text-orange-300" />
              <p>
                Esta decisão é imediata e pode alterar sua reputação diplomática de forma permanente.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
