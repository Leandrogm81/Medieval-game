import { GameState, Realm, TechCategory, Province } from '../types';

export const TECH_CATEGORIES: TechCategory[] = ['movement', 'assimilation', 'recruitment', 'combat'];

export const TECH_MAX_LEVELS: Record<TechCategory, number> = {
  movement: 10,
  assimilation: 10,
  recruitment: 10,
  combat: 20,
};

export interface TechEffects {
  movementAPBonus: number;       // +0.5 AP por nível
  assimilationDiscount: number;  // -10% custo por nível (0-1)
  recruitmentBonus: number;      // +10% pop recrutável por nível (0-1)
  combatBonus: number;           // +5% atk/def por nível (0-1)
}

/**
 * Gera pontos de tecnologia por turno (função pura — não armazena estado).
 * Fórmula (PRD-FASE-2 §1): 1 base + floor(totalPop/500) + workshops + floor(courts/2), cap 20.
 */
export function generateTechPoints(realm: Realm, state: GameState): number {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  const totalPop = ownedProvinces.reduce((sum, p) => sum + (p.population || 0), 0);
  const totalWorkshops = ownedProvinces.reduce((sum, p) => sum + (p.buildings?.workshops || 0), 0);
  const totalCourts = ownedProvinces.reduce((sum, p) => sum + (p.buildings?.courts || 0), 0);

  let points = 1;
  points += Math.floor(totalPop / 500);
  points += totalWorkshops;
  points += Math.floor(totalCourts / 2);

  // Penalidade de governo: Theocracy -10%, Tribal -20% (ver governmentLogic na Sprint D)
  if (realm.government === 'theocracy') points *= 0.9;
  if (realm.government === 'tribal') points *= 0.8;

  return Math.min(Math.floor(points), 20);
}

/**
 * Custo triangular: 10, 15, 25, 40, 60, 85, 115, 150, 190, 235, ...
 * cost = 10 + 5 * level * (level + 1) / 2
 */
export function getTechUpgradeCost(currentLevel: number): number {
  return 10 + (5 * currentLevel * (currentLevel + 1)) / 2;
}

/**
 * Aloca pontos para subir 1 nível na categoria.
 * Retorna true se a alocação foi feita (pontos suficientes e nível abaixo do máx).
 */
export function allocateTechPoints(realm: Realm, category: TechCategory): boolean {
  const currentLevel = realm.techLevels?.[category] ?? 0;
  const maxLevel = TECH_MAX_LEVELS[category];
  if (currentLevel >= maxLevel) return false;

  const cost = getTechUpgradeCost(currentLevel);
  if ((realm.techPoints ?? 0) < cost) return false;

  realm.techPoints -= cost;
  realm.techLevels[category] = currentLevel + 1;
  return true;
}

/**
 * Calcula os efeitos acumulados dos níveis de tecnologia de um reino.
 */
export function getTechEffects(realm: Realm): TechEffects {
  const levels = realm.techLevels ?? { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };
  return {
    movementAPBonus: levels.movement * 0.5,
    assimilationDiscount: levels.assimilation * 0.1,
    recruitmentBonus: levels.recruitment * 0.1,
    combatBonus: levels.combat * 0.05,
  };
}

/**
 * Aplica bônus de combate tech aos poderes de ataque/defesa.
 * Retorna [atkPower, defPower] ajustados.
 */
export function applyTechCombatBonus(
  attackerBonus: number,
  defenderBonus: number,
  atkPower: number,
  defPower: number
): [number, number] {
  return [atkPower * (1 + attackerBonus), defPower * (1 + defenderBonus)];
}

/**
 * Recalcula maxActionPoints considerando tech de movimento e governo.
 * Piso: nunca < 2 (PRD-FASE-2 §1).
 */
export function applyMovementAPBonus(realm: Realm, baseAP: number): number {
  const effects = getTechEffects(realm);
  return Math.max(2, Math.floor(baseAP + effects.movementAPBonus));
}

/**
 * Aplica bônus de recrutamento: maxRecruitable *= (1 + bonus)
 */
export function applyRecruitmentBonus(realm: Realm, maxRecruitable: number): number {
  const effects = getTechEffects(realm);
  return Math.floor(maxRecruitable * (1 + effects.recruitmentBonus));
}
