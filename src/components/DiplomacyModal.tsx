import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Handshake,
  Sword,
  Shield,
  MessageSquareQuote,
  Coins,
  FileText,
  Flame,
  X,
  Crown,
  ShieldAlert,
  Heart
} from 'lucide-react';
import {
  canDeclareWar,
  canDemandTribute,
  canImproveRelations,
  canOfferTribute,
  canProposeAlliance,
  canProposeDefensivePact,
  canProposeNAP,
  canSendInsult
} from '../logic/diplomacyLogic';
import { DIPLOMACY_ACTION_COSTS, UNIT_STATS } from '../logic/game-constants';
import { DiplomacyAction, GameState, Realm } from '../types';

interface DiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRealmId: string;
  gameState: GameState;
  onAction: (action: DiplomacyAction, payload?: { amount?: number }) => void;
  playerRealmId: string;
}

type ActionEntry = {
  action: DiplomacyAction;
  label: string;
  icon: React.ReactNode;
  amountSensitive?: boolean;
};

const ACTIONS: ActionEntry[] = [
  { action: 'improveRelations', label: 'Melhorar Relações', icon: <Heart size={14} />, amountSensitive: false },
  { action: 'sendInsult', label: 'Enviar Insulto', icon: <MessageSquareQuote size={14} />, amountSensitive: false },
  { action: 'nonAggressionPact', label: 'Pacto Não-Agressão', icon: <Shield size={14} />, amountSensitive: false },
  { action: 'defensivePact', label: 'Pacto Defensivo', icon: <ShieldAlert size={14} />, amountSensitive: false },
  { action: 'alliance', label: 'Aliança', icon: <Handshake size={14} />, amountSensitive: false },
  { action: 'offerTribute', label: 'Oferecer Tributo', icon: <Coins size={14} />, amountSensitive: true },
  { action: 'demandTribute', label: 'Exigir Tributo', icon: <FileText size={14} />, amountSensitive: true },
  { action: 'declareWar', label: 'Declarar Guerra', icon: <Flame size={14} />, amountSensitive: false }
];

function getRealmPower(state: GameState, realmId: string): number {
  return Object.values(state.provinces)
    .filter(province => province.ownerId === realmId)
    .reduce((sum, province) => {
      return sum +
        province.army.infantry * UNIT_STATS.infantry.attack +
        province.army.archers * UNIT_STATS.archers.attack +
        province.army.cavalry * UNIT_STATS.cavalry.attack +
        province.army.scouts * UNIT_STATS.scouts.attack;
    }, 0);
}

function getPersonalityEmoji(personality: Realm['personality']): string {
  switch (personality) {
    case 'diplomatic': return '🕊️';
    case 'defensive': return '🛡️';
    case 'commercial': return '💰';
    case 'opportunistic': return '🦊';
    case 'expansionist':
    default:
      return '⚔️';
  }
}

function buildHistoryLines(gameState: GameState, playerRealmId: string, targetRealmId: string): string[] {
  const playerMemory = gameState.realms[playerRealmId]?.memory?.[targetRealmId];
  const targetMemory = gameState.realms[targetRealmId]?.memory?.[playerRealmId];
  if (!playerMemory && !targetMemory) return [];

  const betrayal = (playerMemory?.betrayal || 0) + (targetMemory?.betrayal || 0);
  const help = (playerMemory?.help || 0) + (targetMemory?.help || 0);
  const aggression = (playerMemory?.aggression || 0) + (targetMemory?.aggression || 0);
  const exhaustion = (playerMemory?.warExhaustion || 0) + (targetMemory?.warExhaustion || 0);
  const lastWarTurn = Math.max(playerMemory?.lastWarTurn || 0, targetMemory?.lastWarTurn || 0);
  const lines: string[] = [];

  if (lastWarTurn > 0) lines.push(`Turno ${lastWarTurn}: última guerra registrada.`);
  if (help > 0) lines.push(`Ajuda diplomática acumulada: ${help}.`);
  if (aggression > 0) lines.push(`Agressão acumulada: ${aggression}.`);
  if (betrayal > 0) lines.push(`Traição acumulada: ${betrayal}.`);
  if (exhaustion > 0) lines.push(`Exaustão de guerra acumulada: ${exhaustion}.`);

  return lines.slice(0, 5);
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({
  isOpen,
  onClose,
  targetRealmId,
  gameState,
  onAction,
  playerRealmId
}) => {
  const [tributeAmount, setTributeAmount] = useState(50);

  const playerRealm = gameState.realms[playerRealmId];
  const targetRealm = gameState.realms[targetRealmId];

  const historyLines = useMemo(() => buildHistoryLines(gameState, playerRealmId, targetRealmId), [gameState, playerRealmId, targetRealmId]);

  const relation = playerRealm?.relations?.[targetRealmId] ?? 0;
  const relationPercent = Math.max(0, Math.min(100, Math.round((relation + 100) / 2)));
  const relationColor = relation > 50 ? 'bg-emerald-500' : relation < 0 ? 'bg-red-500' : 'bg-amber-500';

  const playerPower = getRealmPower(gameState, playerRealmId);
  const targetPower = getRealmPower(gameState, targetRealmId);
  const powerRatio = playerPower + targetPower > 0 ? playerPower / (playerPower + targetPower) : 0.5;
  const powerIndicator = Math.max(12, Math.round(powerRatio * 12));

  const makeValidation = (action: DiplomacyAction): { valid: boolean; reason?: string } => {
    switch (action) {
      case 'alliance':
        return canProposeAlliance(gameState, playerRealmId, targetRealmId);
      case 'nonAggressionPact':
        return canProposeNAP(gameState, playerRealmId, targetRealmId);
      case 'defensivePact':
        return canProposeDefensivePact(gameState, playerRealmId, targetRealmId);
      case 'improveRelations':
        return canImproveRelations(gameState, playerRealmId, targetRealmId);
      case 'sendInsult':
        return canSendInsult(gameState, playerRealmId, targetRealmId);
      case 'offerTribute':
        return canOfferTribute(gameState, playerRealmId, targetRealmId, tributeAmount);
      case 'demandTribute':
        return tributeAmount > 0 ? canDemandTribute(gameState, playerRealmId, targetRealmId, tributeAmount) : { valid: false, reason: 'Escolha um valor de tributo maior que zero.' };
      case 'declareWar':
        return canDeclareWar(gameState, playerRealmId, targetRealmId);
      default:
        return { valid: false, reason: 'Ação indisponível.' };
    }
  };

  const actionMeta = ACTIONS.map((entry) => {
    const validation = makeValidation(entry.action);
    const apCost = DIPLOMACY_ACTION_COSTS[entry.action];
    const apAvailable = playerRealm?.actionPoints ?? 0;
    const apValid = apAvailable >= apCost;
    return {
      ...entry,
      validation,
      apCost,
      disabled: !validation.valid || !apValid,
      reason: !apValid ? `Pontos de ação insuficientes (precisa ${apCost}, tem ${apAvailable}).` : validation.reason
    };
  });

  if (!isOpen || !playerRealm || !targetRealm) return null;

  const personalityEmoji = getPersonalityEmoji(targetRealm.personality);
  const isPositiveRelation = relation > 50;
  const isNegativeRelation = relation < 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 18 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-900/40 bg-stone-950 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between border-b border-amber-900/30 bg-stone-900/90 px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-500/70">Diplomacia</p>
              <h2 className="flex items-center gap-2 text-xl font-black text-amber-100">
                <Crown size={20} className="text-amber-500" />
                {targetRealm.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-stone-700 bg-stone-900 p-2 text-stone-300 transition-colors hover:bg-stone-800 hover:text-amber-100"
              aria-label="Fechar modal de diplomacia"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Relações</p>
                    <p className="text-3xl font-black text-amber-50">
                      <span className={isPositiveRelation ? 'text-emerald-400' : isNegativeRelation ? 'text-red-400' : 'text-amber-200'}>❤️</span>{' '}
                      {relation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">AP</p>
                    <p className="text-lg font-black text-amber-100">{playerRealm.actionPoints}/{playerRealm.maxActionPoints}</p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-stone-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${relationColor}`}
                    style={{ width: `${relationPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                  {relation > 50 ? 'Relação favorável' : relation < 0 ? 'Relação hostil' : 'Relação instável'}
                </p>
              </div>

              <div className="grid gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4 md:grid-cols-2">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Poder militar relativo</p>
                  <p className="mt-2 text-2xl font-black text-amber-50">
                    {powerIndicator}/{12}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Seu poder: {playerPower.toFixed(0)} | Alvo: {targetPower.toFixed(0)}
                  </p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Personalidade</p>
                  <p className="mt-2 text-2xl font-black text-amber-50">{personalityEmoji}</p>
                  <p className="text-[10px] text-stone-400 capitalize">{targetRealm.personality}</p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Ações disponíveis</p>
                    <h3 className="text-lg font-black text-amber-100">8 opções diplomáticas</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Tributo</p>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={tributeAmount}
                      onChange={(e) => setTributeAmount(Math.max(1, parseInt(e.target.value || '0', 10) || 1))}
                      className="mt-1 w-24 rounded-md border border-stone-700 bg-black/30 px-2 py-1 text-right text-sm font-black text-amber-50 outline-none"
                      aria-label="Quantidade de tributo"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {actionMeta.map((entry) => (
                    <div key={entry.action} className="group relative">
                      <button
                        type="button"
                        disabled={entry.disabled}
                        onClick={() => onAction(entry.action, entry.amountSensitive ? { amount: tributeAmount } : undefined)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
                          entry.disabled
                            ? 'cursor-not-allowed border-stone-800 bg-stone-950/70 text-stone-600'
                            : 'border-amber-900/30 bg-stone-950 text-amber-100 hover:border-amber-500/60 hover:bg-amber-600/10'
                        }`}
                        title={entry.reason || `${entry.label} disponível`}
                      >
                        <span className="flex items-center gap-2">
                          {entry.icon}
                          {entry.label}
                        </span>
                        <span className="rounded-full border border-stone-700 px-2 py-1 text-[9px] text-amber-200">
                          {DIPLOMACY_ACTION_COSTS[entry.action]} AP
                        </span>
                      </button>
                      {entry.disabled && entry.reason && (
                        <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-[10px] text-stone-300 shadow-xl group-hover:block">
                          {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Histórico</p>
                {historyLines.length > 0 ? (
                  <div className="space-y-2">
                    {historyLines.map((line) => (
                      <div key={line} className="rounded-lg border border-stone-800 bg-black/20 px-3 py-2 text-sm text-stone-200">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-stone-700 bg-black/20 px-3 py-6 text-center text-sm italic text-stone-500">
                    Sem eventos registrados.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-900/20 bg-gradient-to-br from-amber-950/20 to-stone-900/60 p-4">
                <div className="flex items-center gap-2 text-amber-200">
                  <Sword size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]">Orientação tática</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  Use relações positivas para acordos, tributos para ganhar tempo e guerra apenas quando o custo político fizer sentido.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
