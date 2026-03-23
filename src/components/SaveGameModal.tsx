import React from 'react';
import { SaveData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Trash2, X, Download } from 'lucide-react';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  saves: SaveData[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  canSave?: boolean;
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({
  isOpen,
  onClose,
  saves,
  onSave,
  onLoad,
  onDelete,
  canSave = true
}) => {
  const [saveName, setSaveName] = React.useState('');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 xs:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2c1810] border-2 xs:border-4 border-[#d4af37] rounded-2xl xs:rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="p-4 xs:p-6 border-b border-[#d4af37]/30 flex justify-between items-center bg-[#1a0f0a] shrink-0">
            <h2 className="text-lg xs:text-2xl font-serif font-bold text-[#d4af37] uppercase tracking-widest">Crônicas do Reino</h2>
            <button onClick={onClose} className="text-[#f5f2ed]/60 hover:text-white transition-colors">
              <X size={20} className="xs:w-6 xs:h-6" />
            </button>
          </div>

          <div className="p-4 xs:p-6 overflow-y-auto custom-scrollbar flex-1">
            {canSave && (
              <div className="mb-6 xs:mb-8">
                <label className="block text-[#f5f2ed]/60 text-[10px] xs:text-sm mb-1.5 xs:mb-2 uppercase tracking-wider font-bold">Novo Registro</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Nome do registro..."
                    className="flex-1 bg-black/40 border border-[#d4af37]/30 rounded-lg xs:rounded-xl px-3 xs:px-4 py-2 xs:py-3 text-white focus:outline-none focus:border-[#d4af37] text-xs xs:text-base"
                  />
                  <button
                    onClick={() => {
                      if (saveName.trim()) {
                        onSave(saveName);
                        setSaveName('');
                      }
                    }}
                    className="bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] px-3 xs:px-5 py-2 xs:py-3 rounded-lg xs:rounded-xl font-bold flex items-center gap-1.5 xs:gap-2 transition-colors active:scale-95 shrink-0 text-xs xs:text-base"
                  >
                    <Save size={16} className="xs:w-5 xs:h-5" />
                    Salvar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 xs:space-y-3">
              <label className="block text-[#f5f2ed]/60 text-[10px] xs:text-sm mb-1.5 xs:mb-2 uppercase tracking-wider font-bold">Registros Existentes</label>
              {saves.length === 0 ? (
                <p className="text-[#f5f2ed]/40 italic text-center py-6 xs:py-8 text-xs xs:text-sm">Nenhum registro encontrado nas crônicas.</p>
              ) : (
                saves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((save) => (
                  <div key={save.id} className="bg-black/20 border border-white/5 rounded-xl xs:rounded-2xl p-3 xs:p-4 flex justify-between items-center hover:border-[#d4af37]/30 transition-all group">
                    <div className="min-w-0 flex-1 mr-2">
                      <h3 className="text-[#f5f2ed] font-bold text-sm xs:text-lg truncate">{save.name}</h3>
                      <div className="text-[#f5f2ed]/60 text-[9px] xs:text-sm flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 xs:mt-1">
                        <span>Turno {save.state?.turn ?? 0}</span>
                        <span>{new Date(save.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 xs:gap-2 shrink-0">
                      <button
                        onClick={() => onLoad(save.id)}
                        className="p-2 xs:p-3 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg xs:rounded-xl transition-all active:scale-90"
                        title="Carregar"
                      >
                        <Download size={16} className="xs:w-5 xs:h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(save.id)}
                        className="p-2 xs:p-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg xs:rounded-xl transition-all active:scale-90"
                        title="Excluir"
                      >
                        <Trash2 size={16} className="xs:w-5 xs:h-5" />
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
