import React from 'react';
import { SaveData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Trash2, X, Download } from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  saves: SaveData[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  saves,
  onSave,
  onLoad,
  onDelete
}) => {
  const [saveName, setSaveName] = React.useState('');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2c1810] border-4 border-[#d4af37] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-[#d4af37]/30 flex justify-between items-center bg-[#1a0f0a]">
            <h2 className="text-2xl font-serif font-bold text-[#d4af37] uppercase tracking-widest">Crônicas do Reino</h2>
            <button onClick={onClose} className="text-[#f5f2ed]/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <label className="block text-[#f5f2ed]/60 text-sm mb-2 uppercase tracking-wider font-bold">Novo Registro</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Nome do registro..."
                  className="flex-1 bg-black/40 border border-[#d4af37]/30 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  onClick={() => {
                    if (saveName.trim()) {
                      onSave(saveName);
                      setSaveName('');
                    }
                  }}
                  className="bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[#f5f2ed]/60 text-sm mb-2 uppercase tracking-wider font-bold">Registros Existentes</label>
              {saves.length === 0 ? (
                <p className="text-[#f5f2ed]/40 italic text-center py-8">Nenhum registro encontrado nas crônicas.</p>
              ) : (
                saves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((save) => (
                  <div key={save.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:border-[#d4af37]/30 transition-all group">
                    <div>
                      <h3 className="text-[#f5f2ed] font-bold text-lg">{save.name}</h3>
                      <div className="text-[#f5f2ed]/60 text-sm flex gap-4 mt-1">
                        <span>Turno {save.state?.turn ?? 0}</span>
                        <span>{new Date(save.date).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onLoad(save.id)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all"
                        title="Carregar"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(save.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
