import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Swords, Handshake, Activity, Coins, Hammer } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2c1810] border-4 border-[#d4af37] rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-[#d4af37]/30 flex justify-between items-center bg-[#1a0f0a] shrink-0">
            <h2 className="text-2xl font-serif font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-3">
              <Shield size={28} />
              Manual do Soberano
            </h2>
            <button onClick={onClose} className="text-[#f5f2ed]/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar text-[#f5f2ed]">
            <div className="space-y-8">
              
              <section>
                <h3 className="text-xl font-bold text-[#d4af37] border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                  <Activity size={20} />
                  O Básico da Conquista
                </h3>
                <p className="opacity-80 leading-relaxed mb-4 text-justify">
                  Seja bem-vindo a Medieval Realms. Seu objetivo primário é liderar sua facção à glória suprema, alcançando a condição de vitória escolhida no início da partida.
                  Para isso, você precisará balancear crescimento econômico militarismo implacável e sagacidade diplomática.
                </p>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 text-sm opacity-90">
                  <p><span className="text-[#d4af37] font-bold">Turnos:</span> O jogo prossegue em turnos. A cada turno, você repõe seus Pontos de Ação (AP) que dão o compasso de quantas grandes decisões você pode tomar.</p>
                  <p><span className="text-[#d4af37] font-bold">AP (Action Points):</span> Mover exércitos, melhorar províncias e ações diplomáticas custam AP.</p>
                  <p><span className="text-[rgb(212,175,55)] font-bold">População:</span> Afeta sua produção, imposto e velocidade de recrutamento.</p>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-bold text-[#d4af37] border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                  <Swords size={20} />
                  Guerra e Combate
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-amber-500 mb-2">Composição de Exércitos</h4>
                    <ul className="space-y-2 text-sm opacity-80 list-disc list-inside">
                      <li><strong>Infantaria:</strong> Balanceada, boa para defesa de castelos.</li>
                      <li><strong>Arqueiros:</strong> Fortes na defesa, danos severos na retaguarda.</li>
                      <li><strong>Cavalaria:</strong> Rápidos e avassaladores no ataque, muito caros.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-500 mb-2">Diplomacia Militar</h4>
                    <ul className="space-y-2 text-sm opacity-80">
                      <li>⚠️ <strong className="text-red-400">Declarar Guerra:</strong> Antes de atacar um reino neutro, você deve ir ao menu 'Diplomacia' do respectivo alvo e Declarar Guerra formalmente. Quebrar um pacto trará repercussões graves!</li>
                      <li>🏰 <strong className="text-orange-400">Cercos:</strong> Atacar uma guarnição que é muito forte causará 'Dano de Cerco' e abaixará aos poucos a defesa de lá ao longo dos turnos.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#d4af37] border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                  <Handshake size={20} />
                  Diplomacia
                </h3>
                <p className="opacity-80 leading-relaxed mb-4">
                  Nenhum reino reina sozinho por muito tempo. Através do menu diplomático com cada reino você pode:
                </p>
                <ul className="space-y-3 text-sm opacity-90">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-600/20 p-1.5 rounded text-blue-400 mt-0.5"><Handshake size={14} /></span>
                    <div>
                      <strong className="text-blue-300">Pactos de Não-Agressão:</strong> Melhoram a relação através da confiança mutua temporal. Quebrá-los acarreta o título de Traidor.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-amber-600/20 p-1.5 rounded text-amber-400 mt-0.5"><Coins size={14} /></span>
                    <div>
                      <strong className="text-amber-300">Rotas Comerciais & Presentes:</strong> Útil para engordar cofres e comprar simpatia de nações mais fracas ou distantes, influenciando no poder político.
                    </div>
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-[#d4af37] border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                  <Hammer size={20} />
                  Infraestrutura
                </h3>
                <p className="opacity-80 leading-relaxed mb-2 text-sm">
                  Cumpra construções e aprimore as províncias usando seus construtores e AP. Certas províncias têm recursos raros (Madeira, Ferro) que ativam status fortíssimos e economia vasta se explorados em seus edifícios passivos.
                </p>
              </section>

            </div>
          </div>
          
          <div className="p-4 border-t border-[#d4af37]/30 bg-[#1a0f0a] flex justify-center shrink-0">
             <button
               onClick={onClose}
               className="bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors active:scale-95"
             >
               Entendido
             </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
