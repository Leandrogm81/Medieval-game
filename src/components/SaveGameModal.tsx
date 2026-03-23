import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, History, Crown, Save as SaveIcon } from 'lucide-react';
import { SaveData, GameState } from '../types';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  saves: SaveData[];
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({ isOpen, onClose, onSave, onLoad, onDelete, saves }) => {
  const [saveName, setSaveName] = React.useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
                      className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-900/50 rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 bg-black/40 border-b border-amber-900/20 flex justify-between items-center text-amber-100 font-black uppercase tracking-widest gap-3">
               <SaveIcon size={20} className="text-amber-500" /> Registros e Salvamentos
               <button onClick={onClose}><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
               <div className="flex gap-2">
                  <input 
                     type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
                     placeholder="Nome do Novo Registro..."
                     className="flex-1 bg-stone-800 border border-stone-700 p-2 text-xs md:text-sm text-amber-50 rounded italic"
                  />
                  <button onClick={() => { onSave(saveName); setSaveName(''); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black uppercase text-[10px] md:text-xs rounded transition-all">Novo Save</button>
               </div>
               
               <div className="space-y-2">
                  {saves.map(save => (
                     <div key={save.id} className="p-3 bg-stone-800/40 border border-white/10 rounded flex items-center justify-between hover:bg-amber-600/10 hover:border-amber-600/40 transition-all cursor-pointer group" onClick={() => onLoad(save.id)}>
                        <div className="flex items-center gap-3">
                           <History size={16} className="text-stone-500 group-hover:text-amber-500 transition-colors" />
                           <div>
                              <p className="text-xs md:text-sm font-black text-amber-50 uppercase tracking-widest">{save.name}</p>
                              <div className="flex items-center gap-2 text-[8px] md:text-[10px] text-stone-500">
                                 <span>Turno {save.state.turn}</span>
                                 <span>{new Date(save.date).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(save.id); }} className="p-2 text-stone-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
