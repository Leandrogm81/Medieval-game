import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Swords, Handshake, Activity, Coins, Hammer, Wheat, Crown, Home, Users, Zap, Factory, Tractor, Pickaxe, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { UNIT_STATS, ACTION_COSTS, BUILDING_STATS, BUILDING_PRODUCTION } from '../gameLogic';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    title: 'Objetivo & Vitória',
    icon: Crown,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-justify">
          Lidere seu reino à supremacia medieval. A cada turno, administre recursos, comande exércitos e
          teça alianças para cumprir sua condição de vitória.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Conquista', desc: 'Controle a maioria das províncias do mapa.', color: 'text-red-400' },
            { name: 'Econômica', desc: 'Acumule 2000 de ouro em seus cofres.', color: 'text-yellow-400' },
            { name: 'Vassalagem', desc: 'Torne todos os reinos seus vassalos.', color: 'text-purple-400' },
            { name: 'Sandbox', desc: 'Sem condição de vitória. Jogue livremente.', color: 'text-blue-400' },
          ].map(v => (
            <div key={v.name} className="bg-black/30 p-3 rounded-lg border border-white/5">
              <span className={`font-bold ${v.color}`}>{v.name}</span>
              <p className="text-xs opacity-70 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Recursos',
    icon: Coins,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          Três recursos sustentam seu império. Todos são produzidos por turno com base na população e edifícios de cada província.
        </p>
        <div className="space-y-3">
          {[
            { icon: Coins, name: 'Ouro', color: 'text-yellow-400', desc: 'Paga recrutamento, construções, manutenção do exército e diplomacia.' },
            { icon: Wheat, name: 'Comida', color: 'text-green-400', desc: 'Alimenta o exército. Déficit causa deserção e perda de moral.' },
            { icon: Hammer, name: 'Materiais', color: 'text-slate-300', desc: 'Necessário para construções e recrutamento de unidades avançadas.' },
          ].map(r => (
            <div key={r.name} className="flex items-start gap-3 bg-black/30 p-3 rounded-lg border border-white/5">
              <r.icon size={20} className={`${r.color} mt-0.5 shrink-0`} />
              <div>
                <span className={`font-bold ${r.color}`}>{r.name}</span>
                <p className="text-xs opacity-70 mt-1">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-black/30 p-3 rounded-lg border border-white/5">
          <span className="font-bold text-blue-400 flex items-center gap-2"><Users size={16} /> População</span>
          <p className="text-xs opacity-70 mt-1">Afeta a eficiência produtiva e é consumida ao recrutar tropas. Cresce 7% por turno até o limite da província.</p>
        </div>
      </div>
    )
  },
  {
    title: 'Unidades Militares',
    icon: Swords,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          Recrute tropas para proteger suas fronteiras. Tropas são recrutadas em <span className="text-amber-400 font-bold">levas de 10 unidades</span>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[#d4af37]">
                <th className="text-left py-2">Unidade</th>
                <th className="text-center py-2">Custo Leva (10x)</th>
                <th className="text-center py-2">Maint./Turno</th>
                <th className="text-center py-2">ATK / DEF</th>
                <th className="text-center py-2">Requisito</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-white/5">
                <td className="py-2 font-bold flex items-center gap-1"><Shield size={12} /> Infantaria</td>
                <td className="text-center text-green-300">{UNIT_STATS.infantry.cost.food * 10}C, {UNIT_STATS.infantry.cost.materials * 10}M</td>
                <td className="text-center">{UNIT_STATS.infantry.maintenance.gold * 10}O, {UNIT_STATS.infantry.maintenance.food * 10}C</td>
                <td className="text-center font-mono">1.0 / 1.5</td>
                <td className="text-center text-slate-500">—</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 font-bold flex items-center gap-1"><Activity size={12} /> Arqueiros</td>
                <td className="text-center text-green-300">{UNIT_STATS.archers.cost.food * 10}C, {UNIT_STATS.archers.cost.materials * 10}M</td>
                <td className="text-center">{UNIT_STATS.archers.maintenance.gold * 10}O, {UNIT_STATS.archers.maintenance.food * 10}C</td>
                <td className="text-center font-mono">1.2 / 1.2</td>
                <td className="text-center text-green-400">Madeira</td>
              </tr>
              <tr>
                <td className="py-2 font-bold flex items-center gap-1"><Zap size={12} /> Cavalaria</td>
                <td className="text-center text-green-300">{UNIT_STATS.cavalry.cost.food * 10}C, {UNIT_STATS.cavalry.cost.materials * 10}M</td>
                <td className="text-center">{UNIT_STATS.cavalry.maintenance.gold * 10}O, {UNIT_STATS.cavalry.maintenance.food * 10}C</td>
                <td className="text-center font-mono">2.0 / 1.0</td>
                <td className="text-center text-amber-400">Cavalo</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-red-900/20 p-2 rounded border border-red-500/20 text-[10px] italic text-red-200">
          Nota: Recrutamento agora custa <span className="font-bold underline">ZERO ouros</span>. O ouro é focado apenas na manutenção (salários) e infraestrutura.
        </div>
      </div>
    )
  },
  {
    title: 'Sistema de Combate',
    icon: Activity,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          As batalhas são resolvidas em <span className="text-amber-400 font-bold">múltiplas rodadas</span> simuladas. O terreno e a composição do exército são cruciais.
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm">
          {[
            { name: 'Vantagem Tática', desc: 'Cavalaria > Arqueiros, Arqueiros > Infantaria, Infantaria > Cavalaria.' },
            { name: 'Bonificações de Terreno', desc: 'Montanhas dão +50% DEF. Florestas dão +20% DEF e bônus para Arqueiros. Planícies favorecem Cavalaria.' },
            { name: 'Cercos e Fortes', desc: 'Cada nível de Forte dá +20% DEF. Ataques falhos em províncias fortificadas causam dano ao cerco, facilitando invasões futuras.' },
            { name: 'Retirada e Aniquilação', desc: 'Tropas sobreviventes de uma defesa falha tentam recuar para províncias vizinhas aliadas.' },
          ].map(c => (
            <div key={c.name} className="bg-black/30 p-2 rounded border border-white/5">
              <span className="font-bold text-[#d4af37] text-xs block">{c.name}</span>
              <p className="opacity-70 text-[11px] mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Construções',
    icon: Hammer,
    content: (
      <div className="space-y-3">
        {[
          { icon: Tractor, name: 'Fazenda', color: 'text-green-400', cost: `${BUILDING_STATS.farms.gold}O, ${BUILDING_STATS.farms.materials}M`, prod: `+${BUILDING_PRODUCTION.farms} Comida/turno` },
          { icon: Pickaxe, name: 'Mina', color: 'text-yellow-400', cost: `${BUILDING_STATS.mines.gold}O, ${BUILDING_STATS.mines.materials}M`, prod: `+${BUILDING_PRODUCTION.mines} Ouro/turno` },
          { icon: Factory, name: 'Oficina', color: 'text-slate-300', cost: `${BUILDING_STATS.workshops.gold}O, ${BUILDING_STATS.workshops.materials}M`, prod: `+${BUILDING_PRODUCTION.workshops} Materiais/turno` },
          { icon: Home, name: 'Tribunal', color: 'text-blue-400', cost: `${BUILDING_STATS.courts.gold}O, ${BUILDING_STATS.courts.materials}M`, prod: `+${BUILDING_PRODUCTION.courts} Lealdade/turno` },
          { icon: Shield, name: 'Fortificação', color: 'text-indigo-400', cost: `${BUILDING_STATS.fortify.gold}O, ${BUILDING_STATS.fortify.materials}M`, prod: `+1 nível de defesa (máx 5)` },
        ].map(b => (
          <div key={b.name} className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <b.icon size={16} className={b.color} />
              <span className={`font-bold text-sm ${b.color}`}>{b.name}</span>
            </div>
            <div className="text-right text-xs">
              <div className="opacity-60">{b.cost}</div>
              <div className="text-green-400 font-bold">{b.prod}</div>
            </div>
          </div>
        ))}
        <p className="text-xs opacity-60">Todas custam {ACTION_COSTS.build} Pontos de Ação. Produção depende da eficiência (população/máx).</p>
      </div>
    )
  },
  {
    title: 'Pontos de Ação',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          Você recebe 10 AP por turno. Cada ação consome AP. Planeje suas prioridades antes de gastar tudo!
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Recrutar', cost: ACTION_COSTS.recruit, color: 'text-blue-400' },
            { name: 'Mover', cost: ACTION_COSTS.move, color: 'text-green-400' },
            { name: 'Atacar', cost: ACTION_COSTS.attack, color: 'text-red-400' },
            { name: 'Construir', cost: ACTION_COSTS.build, color: 'text-amber-400' },
            { name: 'Diplomacia', cost: ACTION_COSTS.diplomacy, color: 'text-purple-400' },
          ].map(a => (
            <div key={a.name} className="flex justify-between bg-black/30 p-2 rounded-lg border border-white/5 text-sm">
              <span className={`font-bold ${a.color}`}>{a.name}</span>
              <span className="text-white font-bold">{a.cost} AP</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Política Interna',
    icon: Home,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          Expandir é fácil — governar é difícil. O sistema de política interna simula a tensão entre crescimento e estabilidade.
        </p>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Capital', desc: 'Seu centro administrativo. Perder a capital causa um grande abalo. A província capital sempre tem +10 lealdade/turno.' },
            { label: 'Distância Administrativa', desc: 'Províncias longe da capital perdem lealdade progressivamente. Construa Tribunais para compensar.' },
            { label: 'Lealdade (0–100%)', desc: 'Determina eficiência produtiva. Abaixo de 25%, há risco de rebelião armada que pode custar a província!' },
            { label: 'Overextension', desc: 'Cada conquista gera +15% OE. Decai 5% por turno. OE alto penaliza toda a produção do reino.' },
          ].map(i => (
            <div key={i.label} className="bg-black/30 p-3 rounded-lg border border-white/5">
              <span className="font-bold text-[#d4af37]">{i.label}</span>
              <p className="text-xs opacity-70 mt-1">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    title: 'Diplomacia',
    icon: Handshake,
    content: (
      <div className="space-y-4">
        <p className="opacity-80 leading-relaxed text-sm">
          Selecione uma província inimiga no mapa para ver as opções diplomáticas com o reino dono.
        </p>
        <div className="space-y-2 text-sm">
          {[
            { action: 'Presente', desc: 'Gasta 100 ouro, +25 relação. Boa forma de abrir caminhos.', color: 'text-purple-400' },
            { action: 'Pacto de Não-Agressão', desc: 'Requer relação > 10. Quebrá-lo gera marca de "Traidor".', color: 'text-blue-400' },
            { action: 'Aliança', desc: 'Requer relação > 50. Laço militar defensivo.', color: 'text-indigo-400' },
            { action: 'Rota Comercial', desc: 'Requer relação > 20. Gera ouro extra por turno.', color: 'text-emerald-400' },
            { action: 'Declarar Guerra', desc: 'Necessário antes de atacar. Quebrar pacto repercute gravemente.', color: 'text-red-400' },
            { action: 'Exigir Vassalagem', desc: 'Quando você tem 3x mais províncias e relação negativa.', color: 'text-amber-400' },
          ].map(d => (
            <div key={d.action} className="flex items-start gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
              <span className={`font-bold ${d.color} shrink-0 w-36`}>{d.action}</span>
              <span className="opacity-70 text-xs">{d.desc}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
];

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [page, setPage] = useState(0);
  
  if (!isOpen) return null;

  const section = SECTIONS[page];
  const Icon = section.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#2c1810] border-4 border-[#d4af37] rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
        >
          <div className="p-5 border-b border-[#d4af37]/30 flex justify-between items-center bg-[#1a0f0a] shrink-0">
            <h2 className="text-xl font-serif font-bold text-[#d4af37] uppercase tracking-widest flex items-center gap-3">
              <Shield size={24} />
              Manual do Soberano
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#d4af37]/60 font-bold">{page + 1}/{SECTIONS.length}</span>
              <button onClick={onClose} className="text-[#f5f2ed]/60 hover:text-white transition-colors">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="flex gap-1 px-5 pt-4 pb-2 overflow-x-auto shrink-0">
            {SECTIONS.map((s, i) => {
              const SIcon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    page === i ? 'bg-[#d4af37] text-[#2c1810]' : 'bg-white/5 text-[#f5f2ed]/50 hover:text-[#f5f2ed]/80'
                  }`}
                >
                  <SIcon size={12} />
                  {s.title}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar text-[#f5f2ed] flex-1">
            <h3 className="text-lg font-bold text-[#d4af37] border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
              <Icon size={20} />
              {section.title}
            </h3>
            {section.content}
          </div>
          
          {/* Navigation Footer */}
          <div className="p-4 border-t border-[#d4af37]/30 bg-[#1a0f0a] flex justify-between items-center shrink-0">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                page === 0 ? 'opacity-30 cursor-default' : 'bg-white/10 hover:bg-white/20 text-[#f5f2ed]'
              }`}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            
            {page === SECTIONS.length - 1 ? (
              <button
                onClick={onClose}
                className="bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] px-6 py-2 rounded-lg font-bold transition-colors active:scale-95"
              >
                Entendido!
              </button>
            ) : (
              <button
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-[#d4af37] hover:bg-[#b8860b] text-[#2c1810] transition-all active:scale-95"
              >
                Próximo <ChevronRight size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
