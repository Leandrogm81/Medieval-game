import { GameState, Realm, Province, Terrain, Army } from '../types';

export interface BattleResult {
  won: boolean;
  attackerRemaining: Army;
  defenderRemaining: Army;
  attackerLosses: Army;
  defenderLosses: Army;
  attackerInitial: Army;
  defenderInitial: Army;
  terrain: Terrain;
  defenseLevel: number;
  rounds: number;
}

export function resolveCombat(attackerArmy: Army, defenderArmy: Army, terrain: Terrain, defense: number): BattleResult {
  const atk = { ...attackerArmy, scouts: 0 };
  const def = { ...defenderArmy, scouts: 0 };
  const atkInitial = { ...atk };
  const defInitial = { ...def };

  let terrainDefBonus = 1.0;
  let cavAtkMod = 1.0;
  let archerDefMod = 1.0;
  
  if (terrain === 'forest') {
    terrainDefBonus = 1.2;
    archerDefMod = 1.4;
    cavAtkMod = 0.6;
  } else if (terrain === 'mountain') {
    terrainDefBonus = 1.5;
    archerDefMod = 1.6;
    cavAtkMod = 0.4;
  } else {
    cavAtkMod = 1.5;
  }

  const fortBonus = 1.0 + (defense * 0.2);

  let rounds = 0;
  for (let r = 0; r < 5; r++) {
    rounds++;
    const atkTotal = atk.infantry + atk.archers + atk.cavalry;
    const defTotal = def.infantry + def.archers + def.cavalry;
    if (atkTotal <= 0 || defTotal <= 0) break;

    const atkPower = 
      atk.infantry * 1.0 +
      atk.archers * 1.3 +
      atk.cavalry * 2.0 * cavAtkMod;

    const defPower = (
      def.infantry * 1.5 +
      def.archers * 1.2 * archerDefMod +
      def.cavalry * 1.0
    ) * terrainDefBonus * fortBonus;

    const atkRoll = atkPower * (0.9 + Math.random() * 0.2);
    const defRoll = defPower * (0.9 + Math.random() * 0.2);

    const totalPower = atkRoll + defRoll;
    const atkDmgRatio = defRoll / totalPower;
    const defDmgRatio = atkRoll / totalPower;

    const baseCasualtyRate = 0.25;
    const atkCasualtyRate = baseCasualtyRate * atkDmgRatio * 2;
    atk.infantry = Math.max(0, atk.infantry - Math.ceil(atk.infantry * atkCasualtyRate));
    atk.archers = Math.max(0, atk.archers - Math.ceil(atk.archers * atkCasualtyRate * 0.8));
    atk.cavalry = Math.max(0, atk.cavalry - Math.ceil(atk.cavalry * atkCasualtyRate));

    const defCasualtyRate = baseCasualtyRate * defDmgRatio * 2;
    def.infantry = Math.max(0, def.infantry - Math.ceil(def.infantry * defCasualtyRate));
    def.archers = Math.max(0, def.archers - Math.ceil(def.archers * defCasualtyRate * 0.7));
    def.cavalry = Math.max(0, def.cavalry - Math.ceil(def.cavalry * defCasualtyRate));
  }

  const atkSurvivors = atk.infantry + atk.archers + atk.cavalry;
  const defSurvivors = def.infantry + def.archers + def.cavalry;
  const won = atkSurvivors > defSurvivors;

  return {
    won,
    attackerRemaining: atk,
    defenderRemaining: def,
    attackerLosses: {
      infantry: atkInitial.infantry - atk.infantry,
      archers: atkInitial.archers - atk.archers,
      cavalry: atkInitial.cavalry - atk.cavalry,
      scouts: atkInitial.scouts - atk.scouts,
    },
    defenderLosses: {
      infantry: defInitial.infantry - def.infantry,
      archers: defInitial.archers - def.archers,
      cavalry: defInitial.cavalry - def.cavalry,
      scouts: defInitial.scouts - def.scouts,
    },
    attackerInitial: atkInitial,
    defenderInitial: defInitial,
    terrain,
    defenseLevel: defense,
    rounds,
  };
}

export function executeAttack(state: GameState, realm: Realm, attackerProv: Province, targetProv: Province) {
  const attackingArmy: Army = {
    infantry: Math.floor(attackerProv.army.infantry * 0.7),
    archers: Math.floor(attackerProv.army.archers * 0.7),
    cavalry: Math.floor(attackerProv.army.cavalry * 0.7),
    scouts: Math.floor(attackerProv.army.scouts * 0.7)
  };
  
  attackerProv.army.infantry -= attackingArmy.infantry;
  attackerProv.army.archers -= attackingArmy.archers;
  attackerProv.army.cavalry -= attackingArmy.cavalry;
  attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry;
  
  const effectiveDefense = Math.max(0, targetProv.defense - (targetProv.siegeDamage || 0));
  const result = resolveCombat(attackingArmy, targetProv.army, targetProv.terrain, effectiveDefense);
  
  state.visualEffects.push({
    id: `effect_${Date.now()}_${Math.random()}`,
    type: 'battle',
    x: targetProv.center[0],
    y: targetProv.center[1],
    duration: 2000,
    startTime: Date.now()
  });

  if (result.won) {
    const oldOwnerId = targetProv.ownerId;
    const oldOwner = state.realms[oldOwnerId];
    const oldOwnerName = oldOwner?.name || 'Desconhecido';
    targetProv.ownerId = realm.id;
    targetProv.army = result.attackerRemaining;
    targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
    targetProv.siegeDamage = 0;
    
    const totalDefenderRemaining = result.defenderRemaining.infantry + result.defenderRemaining.archers + result.defenderRemaining.cavalry;
    if (totalDefenderRemaining > 0) {
      const retreatOptions = targetProv.neighbors.map(nId => state.provinces[nId]).filter(p => p.ownerId === oldOwnerId);
      if (retreatOptions.length > 0) {
        const retreatProv = retreatOptions.sort((a, b) => b.troops - a.troops)[0];
        retreatProv.army.infantry += result.defenderRemaining.infantry;
        retreatProv.army.archers += result.defenderRemaining.archers;
        retreatProv.army.cavalry += result.defenderRemaining.cavalry;
        retreatProv.troops = retreatProv.army.infantry + retreatProv.army.archers + retreatProv.army.cavalry;
        state.logs.push(`RETIRADA: Os sobreviventes de ${targetProv.name} recuaram para ${retreatProv.name}.`);
      } else {
        state.logs.push(`ANIQUILAÇÃO: Sem ter para onde fugir, os últimos defensores de ${targetProv.name} foram destruídos.`);
      }
    }

    state.logs.push(`CONQUISTA: ${realm.name} tomou ${targetProv.name} de ${oldOwnerName}!`);
    realm.overextension = Math.min(100, realm.overextension + 15);
    targetProv.recentlyConquered = 10;
    targetProv.loyalty = 30;
    
    if (state.realms[oldOwnerId] && state.realms[oldOwnerId].capitalId === targetProv.id) {
       const remaining = Object.values(state.provinces).filter(p => p.ownerId === oldOwnerId && p.id !== targetProv.id);
       if (remaining.length > 0) {
          state.realms[oldOwnerId].capitalId = remaining.sort((a, b) => b.population - a.population)[0].id;
          state.logs.push(`GOVERNO: ${oldOwnerName} moveu sua sede de poder para ${state.provinces[state.realms[oldOwnerId].capitalId!].name}.`);
       }
    }
    
    const oldOwnerProvinces = Object.values(state.provinces).filter(p => p.ownerId === oldOwnerId);
    if (oldOwnerProvinces.length === 0) {
      state.logs.push(`QUEDA: O reino de ${oldOwnerName} foi destruído.`);
    }
    
    const targetRealm = state.realms[oldOwnerId];
    if (targetRealm && targetRealm.memory[realm.id]) {
      targetRealm.memory[realm.id].aggression += 30;
      targetRealm.memory[realm.id].lastWarTurn = state.turn;
      targetRealm.relations[realm.id] -= 50;
    }
    
    // Update War State
    const war = state.activeWars.find(w => 
      (w.attackerId === realm.id && w.defenderId === oldOwnerId) ||
      (w.attackerId === oldOwnerId && w.defenderId === realm.id)
    );
    if (war) {
      const isAttacker = war.attackerId === realm.id;
      war.warScore = Math.min(100, Math.max(-100, war.warScore + (isAttacker ? 10 : -10)));
      // Conquest adds exhaustion to the loser
      if (isAttacker) war.defenderExhaustion = Math.min(100, war.defenderExhaustion + 5);
      else war.attackerExhaustion = Math.min(100, war.attackerExhaustion + 5);
    }
  } else {
    targetProv.army = result.defenderRemaining;
    targetProv.troops = targetProv.army.infantry + targetProv.army.archers + targetProv.army.cavalry;
    attackerProv.army.infantry += result.attackerRemaining.infantry;
    attackerProv.army.archers += result.attackerRemaining.archers;
    attackerProv.army.cavalry += result.attackerRemaining.cavalry;
    attackerProv.troops = attackerProv.army.infantry + attackerProv.army.archers + attackerProv.army.cavalry;
    
    if (targetProv.defense > (targetProv.siegeDamage || 0)) {
       targetProv.siegeDamage = (targetProv.siegeDamage || 0) + 1;
       state.logs.push(`CERCO: As fortificações de ${targetProv.name} sofreram danos no ataque.`);
    }
  }

  // Update exhaustion based on losses for both sides
  const war = state.activeWars.find(w => 
    (w.attackerId === realm.id && w.defenderId === targetProv.ownerId) ||
    (w.attackerId === targetProv.ownerId && w.defenderId === realm.id)
  );
  if (war) {
    const atkLosses = result.attackerLosses.infantry + result.attackerLosses.archers + result.attackerLosses.cavalry;
    const defLosses = result.defenderLosses.infantry + result.defenderLosses.archers + result.defenderLosses.cavalry;
    
    // 1% exhaustion per 20 troops lost
    const atkExh = Math.floor(atkLosses / 20);
    const defExh = Math.floor(defLosses / 20);
    
    if (war.attackerId === realm.id) {
       war.attackerExhaustion = Math.min(100, war.attackerExhaustion + atkExh);
       war.defenderExhaustion = Math.min(100, war.defenderExhaustion + defExh);
    } else {
       war.attackerExhaustion = Math.min(100, war.attackerExhaustion + defExh);
       war.defenderExhaustion = Math.min(100, war.defenderExhaustion + atkExh);
    }
  }
}
