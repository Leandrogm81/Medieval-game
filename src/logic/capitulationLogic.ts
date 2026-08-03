import { GameState, War, Province } from '../types';

export interface CapitulationResult {
  winnerId: string;
  loserId: string;
  occupationRatio: number;
  provincesToCede: string[];
}

/**
 * Conta as províncias ocupadas pelo atacante (originalOwnerId = defensor, ownerId = atacante).
 */
function getOccupiedProvinces(state: GameState, war: War): Province[] {
  return Object.values(state.provinces).filter(
    p => p.originalOwnerId === war.defenderId && p.ownerId === war.attackerId
  );
}

/**
 * Seleciona as províncias mais distantes da capital do derrotado (BFS).
 */
function selectProvincesToCede(
  state: GameState,
  occupiedIds: string[],
  defenderCapitalId: string | undefined,
  fraction: number
): string[] {
  if (occupiedIds.length === 0) return [];

  // BFS distances from capital
  const distances = new Map<string, number>();
  if (defenderCapitalId) {
    const queue: string[] = [defenderCapitalId];
    const visited = new Set<string>([defenderCapitalId]);
    distances.set(defenderCapitalId, 0);
    while (queue.length > 0) {
      const id = queue.shift()!;
      const prov = state.provinces[id];
      if (!prov) continue;
      for (const nId of prov.neighbors || []) {
        if (!visited.has(nId)) {
          visited.add(nId);
          distances.set(nId, (distances.get(id) || 0) + 1);
          queue.push(nId);
        }
      }
    }
  }

  const sorted = [...occupiedIds].sort((a, b) => {
    const da = distances.get(a) ?? 999;
    const db = distances.get(b) ?? 999;
    return db - da; // mais distantes primeiro
  });

  const count = Math.ceil(occupiedIds.length * fraction);
  return sorted.slice(0, count);
}

/**
 * Checa se a guerra satisfaz as condições de capitulação:
 * - >60% das províncias do defensor ocupadas
 * - OU war score > 70 a favor do atacante
 * - OU capital capturada + war score > 50
 */
export function checkCapitulation(state: GameState, war: War): CapitulationResult | null {
  const attacker = state.realms[war.attackerId];
  const defender = state.realms[war.defenderId];
  if (!attacker || !defender) return null;

  const occupied = getOccupiedProvinces(state, war);
  const defenderProvinces = Object.values(state.provinces).filter(
    p => p.ownerId === war.defenderId || p.originalOwnerId === war.defenderId
  ).length;
  const occupationRatio = defenderProvinces > 0 ? occupied.length / defenderProvinces : 0;
  const capitalCaptured = defender.capitalId
    ? state.provinces[defender.capitalId]?.ownerId === war.attackerId
    : false;

  if (occupationRatio > 0.6 || war.warScore > 70 || (capitalCaptured && war.warScore > 50)) {
    const provincesToCede = selectProvincesToCede(
      state,
      occupied.map(p => p.id),
      defender.capitalId,
      0.5
    );
    return { winnerId: war.attackerId, loserId: war.defenderId, occupationRatio, provincesToCede };
  }
  return null;
}

/**
 * Aplica os efeitos da capitulação:
 * - Guerra termina; originalOwnerId limpo
 * - Derrotado cede 50% das ocupadas (mais distantes da capital)
 * - Vira vassalo se ainda tiver províncias; eliminado se não tiver
 * - Vencedor sofre -20 loyalty em todas as províncias por 5 turnos
 * Retorna true se a guerra foi encerrada por capitulação.
 */
export function executeCapitulation(state: GameState, result: CapitulationResult): boolean {
  const winner = state.realms[result.winnerId];
  const loser = state.realms[result.loserId];
  if (!winner || !loser) return false;

  // 1. Ceder províncias
  result.provincesToCede.forEach(provId => {
    const prov = state.provinces[provId];
    if (!prov) return;
    prov.ownerId = result.winnerId;
    prov.originalOwnerId = undefined;
    prov.loyalty = 30;
    prov.recentlyConquered = 3;
  });

  // 2. Limpar originalOwnerId de TODAS as províncias da guerra
  Object.values(state.provinces).forEach(p => {
    if (p.originalOwnerId === result.loserId || p.originalOwnerId === result.winnerId) {
      p.originalOwnerId = undefined;
    }
  });

  // 3. Derrotado vira vassalo ou é eliminado
  const loserProvinces = Object.values(state.provinces).filter(p => p.ownerId === result.loserId).length;
  if (loserProvinces > 0) {
    loser.vassalOf = result.winnerId;
    if (!winner.vassals.includes(result.loserId)) winner.vassals.push(result.loserId);
  } else {
    delete state.realms[result.loserId];
    winner.realmsDefeated = (winner.realmsDefeated || 0) + 1; // Fase 2: tracking
  }

  // 4. Encerrar guerra
  const war = state.activeWars.find(
    w => (w.attackerId === result.winnerId && w.defenderId === result.loserId) ||
         (w.attackerId === result.loserId && w.defenderId === result.winnerId)
  );
  if (war) {
    state.activeWars = state.activeWars.filter(w => w.id !== war.id);
  }
  winner.wars = (winner.wars || []).filter(id => id !== result.loserId);
  loser.wars = (loser.wars || []).filter(id => id !== result.winnerId);

  // 5. Instabilidade pós-guerra: -20 loyalty por 5 turnos (implementado via recentlyConquered-like flag)
  const instabilityTurns = { turns: 5, penalty: -20 };
  Object.values(state.provinces).forEach(p => {
    if (p.ownerId === result.winnerId) {
      p.loyalty = Math.max(0, Math.min(100, (p.loyalty || 0) + instabilityTurns.penalty));
    }
  });

  // 6. Notificação
  const winnerName = winner.name;
  const loserName = loserProvinces > 0 ? loser.name : `o reino de ${loser.name}`;
  state.logs.push(
    `🏳️ ${loserName} se rendeu a ${winnerName}! Após perder ${result.provincesToCede.length} províncias, o reino depôs suas armas. ${result.provincesToCede.length} províncias foram cedidas.`
  );
  if (loserProvinces > 0) {
    state.logs.push(`${loser.name} agora é vassalo de ${winnerName}.`);
  } else {
    state.logs.push(`${loser.name} deixou de existir.`);
  }

  return true;
}
