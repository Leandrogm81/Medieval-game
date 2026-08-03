import { GameState, Realm, Technology } from '../types';
import { TECH_TREE } from './game-constants';

/**
 * Calcula quantos pontos de tecnologia um reino ganha por turno.
 * Baseado no número de províncias e bônus específicos.
 */
export const calculateTechPointsPerTurn = (realm: Realm, ownedProvincesCount: number): number => {
  const basePoints = 5;
  const provinceBonus = ownedProvincesCount * 2;
  
  // Aqui poderíamos adicionar bônus de construções como 'Universidade' ou 'Monastério'
  return basePoints + provinceBonus;
};

/**
 * Verifica se um reino pode desbloquear uma tecnologia.
 */
export const canUnlockTech = (realm: Realm, techId: string): { can: boolean; reason?: string } => {
  // Encontrar a tecnologia na biblioteca
  let technology: Technology | undefined;
  for (const category in TECH_TREE) {
    technology = TECH_TREE[category].find((t: Technology) => t.id === techId);
    if (technology) break;
  }

  if (!technology) return { can: false, reason: 'Tecnologia não encontrada.' };
  if (realm.unlockedTechs.includes(techId)) return { can: false, reason: 'Tecnologia já desbloqueada.' };
  if (realm.techPoints < technology.cost) return { can: false, reason: 'Pontos de tecnologia insuficientes.' };

  // Verificar pré-requisitos
  for (const reqId of technology.prerequisites) {
    if (!realm.unlockedTechs.includes(reqId)) {
      return { can: false, reason: `Requer ${reqId}.` };
    }
  }

  return { can: true };
};

/**
 * Retorna o bônus total de um determinado tipo para um reino.
 * Exemplo: getTechBonus(realm, 'military') -> 0.1 (10% de bônus)
 */
export const getTechBonus = (realm: Realm, type: string): number => {
  let totalBonus = 0;
  
  // Percorrer todas as categorias da TECH_TREE
  for (const category in TECH_TREE) {
    const techs = TECH_TREE[category];
    for (const tech of techs) {
      if (realm.unlockedTechs.includes(tech.id) && tech.bonus.type === type) {
        totalBonus += tech.bonus.value;
      }
    }
  }
  
  return totalBonus;
};

/**
 * Desbloqueia uma tecnologia para o reino.
 * Retorna uma cópia do reino com a tecnologia desbloqueada.
 */
export const unlockTech = (realm: Realm, techId: string): Realm => {
  const validation = canUnlockTech(realm, techId);
  if (!validation.can) return realm;

  let technology: Technology | undefined;
  for (const category in TECH_TREE) {
    technology = TECH_TREE[category].find((t: Technology) => t.id === techId);
    if (technology) break;
  }

  if (!technology) return realm;

  return {
    ...realm,
    techPoints: realm.techPoints - technology.cost,
    unlockedTechs: [...realm.unlockedTechs, techId]
  };
};
