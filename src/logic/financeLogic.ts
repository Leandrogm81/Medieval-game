import { Realm, Loan, GameState } from '../types';
import { LOAN_CONSTANTS } from './game-constants';

/**
 * Calcula o valor máximo de empréstimo que um reino pode pegar.
 */
export const calculateMaxLoanAmount = (realm: Realm, ownedProvincesCount: number): number => {
  return ownedProvincesCount * LOAN_CONSTANTS.LOAN_AMOUNT_FACTOR;
};

/**
 * Verifica se um reino pode pegar um novo empréstimo.
 */
export const canTakeLoan = (realm: Realm): { can: boolean; reason?: string } => {
  if (realm.loans.length >= LOAN_CONSTANTS.MAX_LOANS) {
    return { can: false, reason: 'Limite máximo de empréstimos atingido.' };
  }
  return { can: true };
};

/**
 * Gera um novo empréstimo para o reino.
 */
export const takeLoan = (realm: Realm, currentTurn: number, ownedProvincesCount: number): Realm => {
  const validation = canTakeLoan(realm);
  if (!validation.can) return realm;

  const amount = calculateMaxLoanAmount(realm, ownedProvincesCount);
  const interestTotal = Math.floor(amount * LOAN_CONSTANTS.INTEREST_RATE * LOAN_CONSTANTS.DURATION);
  
  const newLoan: Loan = {
    id: `loan_${realm.id}_${Date.now()}`,
    amount: amount,
    interest: interestTotal,
    dueTurn: currentTurn + LOAN_CONSTANTS.DURATION,
    remainingTurns: LOAN_CONSTANTS.DURATION
  };

  return {
    ...realm,
    gold: realm.gold + amount,
    loans: [...realm.loans, newLoan]
  };
};

/**
 * Processa os empréstimos no final do turno.
 * Paga juros e verifica vencimento.
 */
export const processRealmLoans = (realm: Realm): { updatedRealm: Realm; totalInterestPaid: number } => {
  let totalInterestPaid = 0;
  const updatedLoans: Loan[] = [];
  let currentGold = realm.gold;

  for (const loan of realm.loans) {
    // Juros por turno (interest total / duration)
    const turnInterest = Math.floor(loan.interest / LOAN_CONSTANTS.DURATION);
    totalInterestPaid += turnInterest;
    currentGold -= turnInterest;

    const updatedLoan = {
      ...loan,
      remainingTurns: loan.remainingTurns - 1
    };

    // Se o empréstimo venceu, paga o principal
    if (updatedLoan.remainingTurns <= 0) {
      currentGold -= updatedLoan.amount;
      // O empréstimo é removido (não vai para updatedLoans)
    } else {
      updatedLoans.push(updatedLoan);
    }
  }

  return {
    updatedRealm: {
      ...realm,
      gold: currentGold,
      loans: updatedLoans
    },
    totalInterestPaid
  };
};
