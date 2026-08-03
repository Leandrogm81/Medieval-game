import { Realm, Loan, GameState } from '../types';
import { LOAN_CONSTANTS } from './game-constants';

/**
 * Fase 2 — Sistema de Empréstimos (PRD-FASE-2 §5)
 * - Limite: maxLoan = floor(totalGoldIncome * 5)
 * - Período: 10 turnos, juros 15% simples
 * - Parcela: paymentPerTurn = ceil((amount * 1.15) / 10)
 * - Default (não pagar): -10 relações globais, -5 loyalty, flag defaulted
 */

export const LOAN_TERMS = {
  duration: 10,
  interestRate: 0.15,
  defaultRelationPenalty: -10,
  defaultLoyaltyPenalty: -5,
};

/**
 * Calcula o valor máximo de empréstimo (5x renda total por turno).
 */
export function getMaxLoanAmount(realm: Realm, state: GameState): number {
  const totalIncome = (realm.goldIncome ?? 0) + (realm.goldMaintenance ?? 0); // renda bruta
  return Math.max(100, Math.floor(Math.max(totalIncome, 0) * 5));
}

/**
 * Calcula a parcela fixa de um empréstimo.
 */
export function getLoanPayment(amount: number): number {
  return Math.ceil((amount * (1 + LOAN_TERMS.interestRate)) / LOAN_TERMS.duration);
}

/**
 * Verifica se um reino pode pegar um novo empréstimo.
 */
export function canTakeLoan(realm: Realm, state: GameState): { can: boolean; reason?: string; maxAmount?: number } {
  if (realm.loans.length >= LOAN_CONSTANTS.MAX_LOANS) {
    return { can: false, reason: 'Limite máximo de empréstimos atingido.' };
  }
  const maxAmount = getMaxLoanAmount(realm, state);
  if (maxAmount < 100) {
    return { can: false, reason: 'Renda muito baixa para um empréstimo.' };
  }
  return { can: true, maxAmount };
}

/**
 * Contrai um empréstimo. Retorna o reino atualizado.
 */
export function takeLoan(realm: Realm, amount: number, currentTurn: number): Realm {
  if (amount <= 0) return realm;

  const newLoan: Loan = {
    id: `loan_${realm.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    amount,
    interest: Math.floor(amount * LOAN_TERMS.interestRate),
    dueTurn: currentTurn + LOAN_TERMS.duration,
    remainingTurns: LOAN_TERMS.duration,
  };

  return {
    ...realm,
    gold: realm.gold + amount,
    loans: [...realm.loans, newLoan],
  };
}

/**
 * Processa os empréstimos no fim do turno (pagamento automático).
 * Se não puder pagar a parcela: penalidade de relações/loyalty + flag defaulted.
 */
export function processRealmLoans(realm: Realm, state: GameState): { updatedRealm: Realm; defaulted: boolean } {
  if (realm.loans.length === 0) return { updatedRealm: realm, defaulted: false };

  let currentGold = realm.gold;
  let defaulted = false;
  const updatedLoans: Loan[] = [];

  for (const loan of realm.loans) {
    const payment = getLoanPayment(loan.amount);

    if (currentGold >= payment) {
      currentGold -= payment;
      const remaining = loan.remainingTurns - 1;
      if (remaining > 0) {
        updatedLoans.push({ ...loan, remainingTurns: remaining });
      }
      // remaining = 0 → quitado, removido
    } else {
      // Default: não pagou a parcela
      defaulted = true;
      updatedLoans.push({ ...loan, remainingTurns: loan.remainingTurns - 1 });
    }
  }

  const updatedRealm: Realm = {
    ...realm,
    gold: Math.max(0, currentGold),
    loans: updatedLoans.filter(l => l.remainingTurns > 0),
  };

  if (defaulted) {
    // -10 relações com todos os reinos
    Object.keys(updatedRealm.relations).forEach(targetId => {
      updatedRealm.relations[targetId] = Math.max(-100, (updatedRealm.relations[targetId] || 0) + LOAN_TERMS.defaultRelationPenalty);
    });
    // -5 loyalty em todas as províncias
    Object.values(state.provinces).forEach(p => {
      if (p.ownerId === realm.id) {
        p.loyalty = Math.max(0, Math.min(100, (p.loyalty || 0) + LOAN_TERMS.defaultLoyaltyPenalty));
      }
    });
  }

  return { updatedRealm, defaulted };
}
