import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X, Shield, Users, AlertTriangle } from 'lucide-react';

interface ScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoutResult: {
    provinceName: string;
    owner: string;
    population: number;
    army: { infantry: number; archers: number; cavalry: number };
    buildings: { farms: number; mines: number; workshops: number; courts: number };
    success: boolean;
    message: string;
  };
}

export const ScoutModal: React.FC<ScoutModalProps> = ({ isOpen, onClose, scoutResult }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border-2 border-indigo-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-5 bg-indigo-950/20 border-b border-indigo-900/50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
              <Eye size={24} /> Relatório de Espionagem
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-indigo-900/20 rounded-full transition-colors text-indigo-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Província Infiltrada</p>
              <h3 className="text-2xl font-serif text-white">{scoutResult.provinceName}</h3>
              <p className="text-sm text-indigo-400 font-bold">{scoutResult.owner}</p>
            </div>

            {scoutResult.success ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                  <Users size={20} className="text-blue-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">População</p>
                  <p className="text-xl font-bold text-white">{scoutResult.population}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2">
                  <Shield size={20} className="text-red-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Exército</p>
                  <p className="text-xl font-bold text-white">
                    {scoutResult.army.infantry + scoutResult.army.archers + scoutResult.army.cavalry}
                  </p>
                </div>
                <div className="col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 text-center">Infraestrutura</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Faz.</span>
                      <span className="text-sm font-bold text-white">{scoutResult.buildings.farms}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Min.</span>
                      <span className="text-sm font-bold text-white">{scoutResult.buildings.mines}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Ofi.</span>
                      <span className="text-sm font-bold text-white">{scoutResult.buildings.workshops}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Trib.</span>
                      <span className="text-sm font-bold text-white">{scoutResult.buildings.courts}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-950/20 p-6 rounded-xl border border-red-900/50 text-center space-y-3">
                <AlertTriangle size={32} className="text-red-500 mx-auto" />
                <p className="text-red-400 font-bold uppercase tracking-widest text-xs">Missão Fracassada</p>
                <p className="text-slate-300 italic font-serif">"{scoutResult.message}"</p>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-950/50 border-t border-slate-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
            >
              Arquivar Relatório
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

