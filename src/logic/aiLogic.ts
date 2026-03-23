import { GameState, Realm, Province, ActionType } from '../types';
import { executeRecruitment, executeBuilding } from './economyLogic';
import { findPath } from './turnLogic';

export function processAI(state: GameState) {
  Object.values(state.realms).forEach(realm => {
    if (realm.isPlayer) return;
    
    // AI Strategy
    const provinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
    if (provinces.length === 0) return;

    // Simple AI behavior: Recruit, Build, or Attack
    provinces.forEach(prov => {
      if (realm.actionPoints <= 0) return;

      // 1. Build if we have enough resources
      if (Math.random() < 0.3) {
        const buildingTypes: ('farms' | 'mines' | 'workshops' | 'courts')[] = ['farms', 'mines', 'workshops', 'courts'];
        const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
        if (executeBuilding(state, realm, prov, type)) {
          realm.actionPoints -= 2; // Assuming build cost is 2
        }
      }

      // 2. Recruit if population is high and food is available
      if (Math.random() < 0.4 && realm.actionPoints > 0) {
        executeRecruitment(state, realm, prov);
        realm.actionPoints -= 1; // Assuming recruit cost is 1
      }

      // 3. Attack if we have many troops
      if (prov.troops > 40 && realm.actionPoints > 4) {
        const neighbors = prov.neighbors.map(id => state.provinces[id]).filter(p => p && p.ownerId !== realm.id);
        if (neighbors.length > 0) {
          const target = neighbors[Math.floor(Math.random() * neighbors.length)];
          // Simplified AI attack logic: just set a flag for next end-of-turn processing or simulate immediately
          // In this simple version, AI is passive until I implement full combat calls here
        }
      }
    });
  });
}
