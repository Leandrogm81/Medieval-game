import { GameState, Realm, DiplomacyAction, Province, CallToArmsRequest } from '../types';
import { UNIT_STATS, DIPLOMACY_FLAVOR_TEXTS } from './game-constants';

export interface DiplomacyValidationResult {
  valid: boolean;
  reason?: string;
}

export interface DiplomacyAcceptanceResult {
  acceptance: number;
  reasons: string[];
}

type CallToArmsState = GameState & {
  pendingCallToArms?: CallToArmsRequest[];
};

type ExtendedPersonality = Realm['personality'] | 'honrado' | 'covarde' | 'agressivo' | 'neutro';

function getRealm(state: GameState, realmId: string): Realm | undefined {
  return state.realms[realmId];
}

function getRelation(state: GameState, fromId: string, toId: string): number {
  return getRealm(state, fromId)?.relations?.[toId] ?? 0;
}

function setRelationPair(state: GameState, fromId: string, toId: string, nextRelation: number): void {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return;

  fromRealm.relations[toId] = nextRelation;
  toRealm.relations[fromId] = nextRelation;
}

function adjustRelationPair(state: GameState, fromId: string, toId: string, delta: number): number {
  const nextRelation = getRelation(state, fromId, toId) + delta;
  setRelationPair(state, fromId, toId, nextRelation);
  return nextRelation;
}

function ensureMemory(realm: Realm, otherId: string) {
  if (!realm.memory[otherId]) {
    realm.memory[otherId] = {
      betrayal: 0,
      help: 0,
      aggression: 0,
      lastWarTurn: 0,
      warExhaustion: 0
    };
  }

  return realm.memory[otherId];
}

function addLog(state: GameState, message: string): void {
  state.logs.push(message);
}

function replacePlaceholders(template: string, fromName: string, toName: string): string {
  return template
    .replace(/\{from\}/g, fromName)
    .replace(/\{to\}/g, toName);
}

function getCallToArmsState(state: GameState): CallToArmsState {
  return state as CallToArmsState;
}

function addUniqueWar(state: GameState, attackerId: string, defenderId: string): void {
  const attacker = getRealm(state, attackerId);
  const defender = getRealm(state, defenderId);
  if (!attacker || !defender) return;

  if (!attacker.wars.includes(defenderId)) attacker.wars.push(defenderId);
  if (!defender.wars.includes(attackerId)) defender.wars.push(attackerId);

  const activeWars = state.activeWars || [];
  const alreadyTracked = activeWars.some(w =>
    (w.attackerId === attackerId && w.defenderId === defenderId) ||
    (w.attackerId === defenderId && w.defenderId === attackerId)
  );

  if (!alreadyTracked) {
    activeWars.push({
      id: `war_${attackerId}_${defenderId}_${state.turn}`,
      attackerId,
      defenderId,
      startedAtTurn: state.turn,
      warScore: 0,
      attackerExhaustion: 0,
      defenderExhaustion: 0
    });
    state.activeWars = activeWars;
  }
}

function removeUniqueWarReference(state: GameState, firstId: string, secondId: string): void {
  const first = getRealm(state, firstId);
  const second = getRealm(state, secondId);
  if (!first || !second) return;

  first.wars = first.wars.filter(id => id !== secondId);
  second.wars = second.wars.filter(id => id !== firstId);
  state.activeWars = (state.activeWars || []).filter(w =>
    !((w.attackerId === firstId && w.defenderId === secondId) ||
      (w.attackerId === secondId && w.defenderId === firstId))
  );
}

function markAggressionMemories(state: GameState, defenderId: string, aggressorId: string): void {
  const defender = getRealm(state, defenderId);
  if (!defender) return;

  ensureMemory(defender, aggressorId).aggression += 15;

  const alliedIds = new Set<string>([
    ...defender.alliances,
    ...defender.defensivePacts
  ]);

  alliedIds.forEach(alliedId => {
    if (alliedId === aggressorId) return;
    const alliedRealm = getRealm(state, alliedId);
    if (!alliedRealm) return;
    ensureMemory(alliedRealm, aggressorId).aggression += 15;
  });
}

export function isWarBetween(state: GameState, aId: string, bId: string): boolean {
  const a = getRealm(state, aId);
  const b = getRealm(state, bId);
  if (!a || !b) return false;

  const activeWar = (state.activeWars || []).some(w =>
    (w.attackerId === aId && w.defenderId === bId) ||
    (w.attackerId === bId && w.defenderId === aId)
  );

  return activeWar || (a.wars?.includes(bId) ?? false) || (b.wars?.includes(aId) ?? false);
}

function getOwnedProvinces(state: GameState, realmId: string): Province[] {
  return Object.values(state.provinces).filter(province => province.ownerId === realmId);
}

function getMilitaryPower(state: GameState, realmId: string): number {
  return getOwnedProvinces(state, realmId).reduce((power, province) => {
    const army = province.army;
    return power +
      army.infantry * UNIT_STATS.infantry.attack +
      army.archers * UNIT_STATS.archers.attack +
      army.cavalry * UNIT_STATS.cavalry.attack +
      army.scouts * UNIT_STATS.scouts.attack;
  }, 0);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function getShortestProvinceDistance(state: GameState, fromId: string, toId: string): number | undefined {
  if (fromId === toId) return 0;

  const fromProvinces = getOwnedProvinces(state, fromId).map(p => p.id);
  const targetSet = new Set(getOwnedProvinces(state, toId).map(p => p.id));
  if (fromProvinces.length === 0 || targetSet.size === 0) return undefined;

  const visited = new Set<string>(fromProvinces);
  const queue: Array<{ id: string; distance: number }> = fromProvinces.map(id => ({ id, distance: 0 }));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const province = state.provinces[current.id];
    if (!province) continue;

    for (const neighborId of province.neighbors || []) {
      if (visited.has(neighborId)) continue;
      const nextDistance = current.distance + 1;
      if (targetSet.has(neighborId)) {
        return nextDistance;
      }
      visited.add(neighborId);
      queue.push({ id: neighborId, distance: nextDistance });
    }
  }

  return undefined;
}

function getPersonalityFactor(personality: Realm['personality']): number {
  switch (personality) {
    case 'diplomatic':
      return 70;
    case 'defensive':
      return 60;
    case 'commercial':
      return 55;
    case 'opportunistic':
      return 45;
    case 'expansionist':
    default:
      return 40;
  }
}

function getMemoryFactor(state: GameState, fromId: string, toId: string): number {
  const memory = getRealm(state, toId)?.memory?.[fromId];
  if (!memory) return 50;

  return clamp(
    50 +
      (memory.help || 0) * 1 -
      (memory.betrayal || 0) * 0.5 -
      (memory.aggression || 0) * 0.3
  );
}

function getCommonEnemyFactor(state: GameState, fromId: string, toId: string): number {
  const enemies = Object.values(state.realms).filter(realm =>
    realm.id !== fromId &&
    realm.id !== toId &&
    isWarBetween(state, fromId, realm.id) &&
    isWarBetween(state, toId, realm.id)
  );

  return clamp(50 + Math.min(15, enemies.length * 5));
}

function getDistanceFactor(state: GameState, fromId: string, toId: string): number {
  const distance = getShortestProvinceDistance(state, fromId, toId);
  if (distance === undefined) return 45;
  if (distance <= 1) return 55;
  if (distance > 5) return 45;
  return 50;
}

function formatContribution(label: string, weight: number, factorValue: number): string {
  const contribution = Math.round((factorValue * weight) / 100);
  const sign = contribution >= 0 ? '+' : '-';
  return `${label} (${weight}%): ${sign}${Math.abs(contribution)}`;
}

function getPersonalityModifierForRelations(personality: Realm['personality'] | undefined): number {
  switch (personality as string | undefined) {
    case 'pacificador':
      return 5;
    case 'agressivo':
      return -5;
    default:
      return 0;
  }
}

function getCallToArmsPersonality(personality: Realm['personality'] | undefined): ExtendedPersonality {
  return (personality || 'neutro') as ExtendedPersonality;
}

function addPactPair(state: GameState, fromId: string, toId: string, field: 'alliances' | 'nonAggressionPacts' | 'defensivePacts'): void {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return;

  if (!fromRealm[field].includes(toId)) fromRealm[field].push(toId);
  if (!toRealm[field].includes(fromId)) toRealm[field].push(fromId);
}

function removePactPair(state: GameState, fromId: string, toId: string, field: 'alliances' | 'nonAggressionPacts' | 'defensivePacts'): void {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return;

  fromRealm[field] = fromRealm[field].filter(id => id !== toId);
  toRealm[field] = toRealm[field].filter(id => id !== fromId);
}

function getPendingCallToArms(state: CallToArmsState): CallToArmsRequest[] {
  return state.pendingCallToArms ?? [];
}

function createCallToArmsId(): string {
  return `cta_${Date.now()}_${Math.random()}`;
}

export function canProposeAlliance(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { valid: false, reason: 'Reino não encontrado.' };
  if (isWarBetween(state, fromId, toId)) return { valid: false, reason: 'Não é possível propor aliança durante uma guerra.' };
  if (fromRealm.alliances.includes(toId)) return { valid: false, reason: 'Aliança já ativa.' };

  const relation = getRelation(state, fromId, toId);
  if (relation < 50) {
    return { valid: false, reason: `Relações insuficientes (precisa 50, tem ${relation}).` };
  }

  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function proposeAlliance(state: GameState, fromId: string, toId: string): GameState {
  const validation = canProposeAlliance(state, fromId, toId);
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!validation.valid || !fromRealm || !toRealm) {
    if (!validation.valid) {
      addLog(state, `Diplomacia falhou entre ${fromRealm?.name || fromId} e ${toRealm?.name || toId}: ${validation.reason}`);
    }
    return state;
  }

  const acceptance = getDiplomacyAcceptance(fromRealm, toRealm, 'alliance', state);
  const accepted = acceptance.acceptance >= 70;
  const flavor = getDiplomacyFlavorText('alliance', fromRealm.name, toRealm.name, accepted);

  if (accepted) {
    addPactPair(state, fromId, toId, 'alliances');
    adjustRelationPair(state, fromId, toId, 30);
  } else {
    adjustRelationPair(state, fromId, toId, -5);
  }

  addLog(state, flavor);
  return state;
}

export function canProposeNAP(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { valid: false, reason: 'Reino não encontrado.' };
  if (isWarBetween(state, fromId, toId)) return { valid: false, reason: 'Não é possível propor NAP durante uma guerra.' };
  if (fromRealm.nonAggressionPacts.includes(toId)) return { valid: false, reason: 'Pacto de não agressão já ativo.' };

  const relation = getRelation(state, fromId, toId);
  if (relation < 20) {
    return { valid: false, reason: `Relações insuficientes (precisa 20, tem ${relation}).` };
  }

  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function proposeNonAggressionPact(state: GameState, fromId: string, toId: string): GameState {
  const validation = canProposeNAP(state, fromId, toId);
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!validation.valid || !fromRealm || !toRealm) {
    if (!validation.valid) {
      addLog(state, `Diplomacia falhou entre ${fromRealm?.name || fromId} e ${toRealm?.name || toId}: ${validation.reason}`);
    }
    return state;
  }

  const acceptance = getDiplomacyAcceptance(fromRealm, toRealm, 'nonAggressionPact', state);
  const accepted = acceptance.acceptance >= 60;
  const flavor = getDiplomacyFlavorText('nonAggressionPact', fromRealm.name, toRealm.name, accepted);

  if (accepted) {
    addPactPair(state, fromId, toId, 'nonAggressionPacts');
    fromRealm.napExpiryTurn[toId] = state.turn + 20;
    toRealm.napExpiryTurn[fromId] = state.turn + 20;
    adjustRelationPair(state, fromId, toId, 15);
  } else {
    adjustRelationPair(state, fromId, toId, -3);
  }

  addLog(state, flavor);
  return state;
}

export function canProposeDefensivePact(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { valid: false, reason: 'Reino não encontrado.' };
  if (!fromRealm.nonAggressionPacts.includes(toId)) return { valid: false, reason: 'É necessário um pacto de não agressão ativo.' };
  if (fromRealm.defensivePacts.includes(toId)) return { valid: false, reason: 'Pacto defensivo já ativo.' };

  const relation = getRelation(state, fromId, toId);
  if (relation < 40) {
    return { valid: false, reason: `Relações insuficientes (precisa 40, tem ${relation}).` };
  }

  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function proposeDefensivePact(state: GameState, fromId: string, toId: string): GameState {
  const validation = canProposeDefensivePact(state, fromId, toId);
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!validation.valid || !fromRealm || !toRealm) {
    if (!validation.valid) {
      addLog(state, `Diplomacia falhou entre ${fromRealm?.name || fromId} e ${toRealm?.name || toId}: ${validation.reason}`);
    }
    return state;
  }

  const acceptance = getDiplomacyAcceptance(fromRealm, toRealm, 'defensivePact', state);
  const accepted = acceptance.acceptance >= 75;
  const flavor = getDiplomacyFlavorText('defensivePact', fromRealm.name, toRealm.name, accepted);

  if (accepted) {
    addPactPair(state, fromId, toId, 'defensivePacts');
    adjustRelationPair(state, fromId, toId, 10);
  } else {
    adjustRelationPair(state, fromId, toId, -3);
  }

  addLog(state, flavor);
  return state;
}

export function canImproveRelations(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const relation = getRelation(state, fromId, toId);
  if (relation >= 100) return { valid: false, reason: 'Relações já no máximo.' };
  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function improveRelations(state: GameState, fromId: string, toId: string): { newRelations: number; delta: number } {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { newRelations: getRelation(state, fromId, toId), delta: 0 };

  const currentRelations = getRelation(state, fromId, toId);
  if (currentRelations >= 100) {
    addLog(state, `Relações com ${toRealm.name} já estão no máximo.`);
    return { newRelations: 100, delta: 0 };
  }

  const baseDelta = 15 + Math.floor(Math.random() * 11);
  const delta = baseDelta + getPersonalityModifierForRelations(toRealm.personality);
  const nextRelations = Math.min(100, currentRelations + delta);
  const actualDelta = nextRelations - currentRelations;
  setRelationPair(state, fromId, toId, nextRelations);
  addLog(state, getDiplomacyFlavorText('improveRelations', fromRealm.name, toRealm.name, true));

  return { newRelations: nextRelations, delta: actualDelta };
}

export function canSendInsult(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const relation = getRelation(state, fromId, toId);
  if (relation <= -100) return { valid: false, reason: 'Relações já no mínimo.' };
  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function sendInsult(state: GameState, fromId: string, toId: string): { newRelations: number; delta: number } {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { newRelations: getRelation(state, fromId, toId), delta: 0 };

  const currentRelations = getRelation(state, fromId, toId);
  if (currentRelations <= -100) {
    addLog(state, `Relações com ${toRealm.name} já estão no mínimo.`);
    return { newRelations: -100, delta: 0 };
  }

  const delta = -(15 + Math.floor(Math.random() * 11));
  const nextRelations = Math.max(-100, currentRelations + delta);
  const actualDelta = nextRelations - currentRelations;
  setRelationPair(state, fromId, toId, nextRelations);
  addLog(state, getDiplomacyFlavorText('sendInsult', fromRealm.name, toRealm.name, true));

  return { newRelations: nextRelations, delta: actualDelta };
}

export function canOfferTribute(state: GameState, fromId: string, _toId: string, amount: number): DiplomacyValidationResult {
  const fromRealm = getRealm(state, fromId);
  if (!fromRealm) return { valid: false, reason: 'Reino não encontrado.' };
  if (fromRealm.gold < amount) return { valid: false, reason: 'Ouro insuficiente.' };
  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function offerTribute(state: GameState, fromId: string, toId: string, amount: number): GameState {
  const validation = canOfferTribute(state, fromId, toId, amount);
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!validation.valid || !fromRealm || !toRealm) {
    if (!validation.valid) {
      addLog(state, `Tributo recusado entre ${fromRealm?.name || fromId} e ${toRealm?.name || toId}: ${validation.reason}`);
    }
    return state;
  }

  const acceptance = getDiplomacyAcceptance(fromRealm, toRealm, 'offerTribute', state);
  const accepted = acceptance.acceptance >= 50;
  const flavor = getDiplomacyFlavorText('offerTribute', fromRealm.name, toRealm.name, accepted);

  if (accepted) {
    fromRealm.gold -= amount;
    fromRealm.tributeTo[toId] = amount;
    toRealm.tributeFrom[fromId] = amount;
    adjustRelationPair(state, fromId, toId, 10);
  } else {
    adjustRelationPair(state, fromId, toId, -3);
  }

  addLog(state, flavor);
  return state;
}

export function canDemandTribute(_state: GameState, _fromId: string, _toId: string, _amount: number): DiplomacyValidationResult {
  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function demandTribute(state: GameState, fromId: string, toId: string, amount: number): { accepted: boolean; newState: GameState } {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { accepted: false, newState: state };

  const acceptance = getDiplomacyAcceptance(fromRealm, toRealm, 'demandTribute', state);
  const accepted = acceptance.acceptance >= 50;
  const flavor = getDiplomacyFlavorText('demandTribute', fromRealm.name, toRealm.name, accepted);

  if (accepted) {
    fromRealm.tributeTo[toId] = amount;
    toRealm.tributeFrom[fromId] = amount;
    ensureMemory(toRealm, fromId).betrayal += 15;
  } else {
    adjustRelationPair(state, fromId, toId, -10);
  }

  addLog(state, flavor);
  return { accepted, newState: state };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function stopTribute(state: GameState, fromId: string, toId: string): GameState {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return state;

  delete fromRealm.tributeTo[toId];
  delete toRealm.tributeFrom[fromId];
  adjustRelationPair(state, fromId, toId, -20);
  addLog(state, `Tributo entre ${fromRealm.name} e ${toRealm.name} foi encerrado.`);
  return state;
}

export function canDeclareWar(state: GameState, fromId: string, toId: string): DiplomacyValidationResult {
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!fromRealm || !toRealm) return { valid: false, reason: 'Reino não encontrado.' };
  if (isWarBetween(state, fromId, toId)) return { valid: false, reason: 'Já existe uma guerra ativa.' };
  if (fromRealm.nonAggressionPacts.includes(toId)) return { valid: false, reason: 'Não é possível declarar guerra com NAP ativo.' };
  if (fromRealm.alliances.includes(toId)) return { valid: false, reason: 'Não é possível declarar guerra contra um aliado.' };

  return { valid: true };
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function declareWar(state: GameState, fromId: string, toId: string): { newState: GameState; callsToResolve: CallToArmsRequest[] } {
  const validation = canDeclareWar(state, fromId, toId);
  const fromRealm = getRealm(state, fromId);
  const toRealm = getRealm(state, toId);
  if (!validation.valid || !fromRealm || !toRealm) {
    return { newState: state, callsToResolve: [] };
  }

  addUniqueWar(state, fromId, toId);
  markAggressionMemories(state, toId, fromId);

  const hadNAP = fromRealm.nonAggressionPacts.includes(toId) || toRealm.nonAggressionPacts.includes(fromId);
  const hadAlliance = fromRealm.alliances.includes(toId) || toRealm.alliances.includes(fromId);

  if (hadNAP) {
    removePactPair(state, fromId, toId, 'nonAggressionPacts');
    adjustRelationPair(state, fromId, toId, -60);
    ensureMemory(fromRealm, toId).betrayal += 25;
    ensureMemory(toRealm, fromId).betrayal += 25;
  }

  if (hadAlliance) {
    removePactPair(state, fromId, toId, 'alliances');
    adjustRelationPair(state, fromId, toId, -80);
    ensureMemory(fromRealm, toId).betrayal += 30;
    ensureMemory(toRealm, fromId).betrayal += 30;
  }

  addLog(state, getDiplomacyFlavorText('declareWar', fromRealm.name, toRealm.name, true));

  const callsToResolve = checkDefensiveCallToArms(state, toId, fromId);
  return { newState: state, callsToResolve };
}

export function getDiplomacyAcceptance(
  playerRealm: Realm,
  targetRealm: Realm,
  action: DiplomacyAction,
  state: GameState
): DiplomacyAcceptanceResult {
  if (action === 'improveRelations' || action === 'sendInsult' || action === 'declareWar') {
    return {
      acceptance: 100,
      reasons: ['Ação unilateral - sempre aceita.']
    };
  }

  const relation = getRelation(state, playerRealm.id, targetRealm.id);
  const playerPower = getMilitaryPower(state, playerRealm.id);
  const targetPower = getMilitaryPower(state, targetRealm.id);
  const powerFactor = playerPower + targetPower > 0 ? (playerPower / (playerPower + targetPower)) * 100 : 50;
  const personalityFactor = getPersonalityFactor(targetRealm.personality);
  const memoryFactor = getMemoryFactor(state, playerRealm.id, targetRealm.id);
  const commonEnemyFactor = getCommonEnemyFactor(state, playerRealm.id, targetRealm.id);
  const distanceFactor = getDistanceFactor(state, playerRealm.id, targetRealm.id);

  const powerWeight = action === 'demandTribute' ? 40 : 20;
  const personalityWeight = action === 'demandTribute' ? 5 : 15;

  const factorContributions = [
    { label: 'Relações', weight: 40, factor: clamp((relation + 100) / 2) },
    { label: 'Poder militar', weight: powerWeight, factor: clamp(powerFactor) },
    { label: 'Personalidade', weight: personalityWeight, factor: clamp(personalityFactor) },
    { label: 'Memória', weight: 15, factor: memoryFactor },
    { label: 'Inimigos comuns', weight: 5, factor: commonEnemyFactor },
    { label: 'Distância geográfica', weight: 5, factor: distanceFactor }
  ];

  const acceptance = clamp(
    Math.round(
      factorContributions.reduce((sum, item) => sum + (item.factor * item.weight) / 100, 0)
    )
  );

  return {
    acceptance,
    reasons: factorContributions.map(item => formatContribution(item.label, item.weight, item.factor))
  };
}

export function getDiplomacyFlavorText(action: DiplomacyAction, fromName: string, toName: string, accepted: boolean): string {
  const template = DIPLOMACY_FLAVOR_TEXTS[action];
  const raw = template?.[accepted ? 'accepted' : 'rejected'];
  if (!raw) {
    return accepted ? 'A proposta diplomática foi aceita.' : 'A proposta diplomática foi rejeitada.';
  }

  return replacePlaceholders(raw, fromName, toName);
}

export function checkDefensiveCallToArms(state: GameState, defenderId: string, aggressorId: string): CallToArmsRequest[] {
  const defender = getRealm(state, defenderId);
  if (!defender) return [];

  const calledIds = new Set<string>();
  const calls: CallToArmsRequest[] = [];

  [...defender.alliances, ...defender.defensivePacts].forEach(calledRealmId => {
    if (calledRealmId === aggressorId || calledIds.has(calledRealmId)) return;
    const calledRealm = getRealm(state, calledRealmId);
    if (!calledRealm) return;

    const pactType: CallToArmsRequest['pactType'] = defender.alliances.includes(calledRealmId) ? 'alliance' : 'defensivePact';
    calledIds.add(calledRealmId);
    calls.push({
      id: createCallToArmsId(),
      defenderId,
      aggressorId,
      calledRealmId,
      pactType,
      resolved: false
    });
  });

  return calls;
}

/**
 * @param state Deve ser um deep clone. Esta função modifica o objeto recebido.
 */
export function resolveCallToArms(state: GameState, requestId: string, accepted: boolean): GameState {
  const callState = getCallToArmsState(state);
  const requests = getPendingCallToArms(callState);
  const request = requests.find(item => item.id === requestId);
  if (!request || request.resolved) return state;

  const defender = getRealm(state, request.defenderId);
  const calledRealm = getRealm(state, request.calledRealmId);
  const aggressor = getRealm(state, request.aggressorId);
  if (!defender || !calledRealm || !aggressor) return state;

  request.resolved = true;

  if (accepted) {
    addUniqueWar(state, request.calledRealmId, request.aggressorId);
    adjustRelationPair(state, request.calledRealmId, request.defenderId, 15);
    ensureMemory(calledRealm, request.defenderId).help += 20;
    addLog(state, `${calledRealm.name} honra sua ${request.pactType === 'alliance' ? 'aliança' : 'pacto defensivo'} com ${defender.name} e entra na guerra contra ${aggressor.name}!`);
  } else {
    removePactPair(state, request.calledRealmId, request.defenderId, request.pactType === 'alliance' ? 'alliances' : 'defensivePacts');
    adjustRelationPair(state, request.calledRealmId, request.defenderId, -50);
    ensureMemory(calledRealm, request.defenderId).betrayal += 20;
    addLog(state, `${calledRealm.name} abandona ${defender.name} em sua hora de necessidade.`);
  }

  return state;
}

export function autoResolveCallToArms(state: GameState, request: CallToArmsRequest): boolean {
  const defender = getRealm(state, request.defenderId);
  const calledRealm = getRealm(state, request.calledRealmId);
  const aggressor = getRealm(state, request.aggressorId);
  if (!defender || !calledRealm || !aggressor) return false;

  const personality = getCallToArmsPersonality(calledRealm.personality);
  if (personality === 'honrado') return true;
  if (personality === 'covarde') return false;

  const relations = getRelation(state, request.calledRealmId, request.defenderId);
  const relationsScore = clamp(Math.round((relations + 100) / 2));

  const calledPower = getMilitaryPower(state, request.calledRealmId);
  const defenderPower = getMilitaryPower(state, request.defenderId);
  const aggressorPower = getMilitaryPower(state, request.aggressorId);
  const combinedPower = calledPower + defenderPower;
  const powerRatio = combinedPower / Math.max(1, aggressorPower);
  const powerScore = clamp(Math.round(50 + ((powerRatio - 1) * 50)));

  let personalityScore = 50;
  if (personality === 'opportunistic') {
    personalityScore = powerRatio > 0.6 ? 75 : 25;
  } else if (personality === 'agressivo') {
    personalityScore = 35;
  } else if (personality === 'diplomatic' || personality === 'defensive') {
    personalityScore = 65;
  } else if (personality === 'expansionist' || personality === 'commercial') {
    personalityScore = 40;
  }

  const score = (relationsScore * 0.4) + (powerScore * 0.35) + (personalityScore * 0.25);
  return score > 50;
}
