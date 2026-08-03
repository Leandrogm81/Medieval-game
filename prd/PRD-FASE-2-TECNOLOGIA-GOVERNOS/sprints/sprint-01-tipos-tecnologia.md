# Sprint 01 — Tipos Base + Sistema de Tecnologia

**Objetivo:** Adicionar todos os novos campos de tipo em `types.ts` e implementar o sistema completo de tecnologia (geração, alocação, bônus, UI).

**Nível de dificuldade:** 🔴 Muito Difícil — use coder FORTE para T5 e T7; use coder BARATO para as demais

**Dependências:** Sprint 00 (leitura do projeto)

**Tempo estimado:** 3.5 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Criar | `src/logic/technologyLogic.ts` | Barato |
| Criar | `src/components/TechnologyModal.tsx` | **Forte** |
| Editar | `src/logic/turnLogic.ts` | Barato |
| Editar | `src/logic/economyLogic.ts` | Barato |
| Editar | `src/logic/combatLogic.ts` | **Forte** |
| Editar | `src/hooks/useGameController.ts` | Barato |
| Editar | `src/hooks/useUI.ts` | Barato |
| Editar | `src/components/HUD.tsx` | Barato |
| Editar | `src/App.tsx` | Barato |
| Editar | `src/components/Map.tsx` | Barato |

---

## Tarefas

### T1 — Adicionar `TechLevels` e campos de `Realm` em `types.ts` 🟢 Barato
- Criar interface `TechLevels`:
```typescript
export interface TechLevels {
  movement: number;      // 0-10
  assimilation: number;  // 0-10
  recruitment: number;   // 0-10
  combat: number;        // 0-20
}
```
- Adicionar a `Realm`: `techPoints: number` e `techLevels: TechLevels`
- Adicionar a `ViewMode`: `'technology'`
- Critério de aceite: `tsc --noEmit` passa

### T2 — Criar `src/logic/technologyLogic.ts` com funções puras 🟡 Barato
- `generateTechPoints(realm, state)` → soma 1 base + pop/500 + workshops + courts/2, aplica penalidade de governo, cap 20
- `getTechUpgradeCost(currentLevel)` → `10 + 5 * level * (level + 1) / 2`
- `allocateTechPoints(realm, category, state?)` → deduz cost, incrementa nível, +1 loyalty global
- `getTechEffects(realm)` → retorna `{ bonusAP, assimDiscount, recruitBonus, combatBonus }`
- `applyTechCombatBonus(attackerRealm, defenderRealm, atkPower, defPower)` → +5% por nível
- Critério de aceite: todas exportadas, puras, testáveis

### T3 — Integrar `generateTechPoints` em `turnLogic.ts` 🟡 Barato
- Em `processEndOfTurn`, no loop de realms (linha 513), após cálculo de renda e antes do reset de AP (linha 688)
- `realm.techPoints += generateTechPoints(realm, newState)`
- Critério de aceite: ao fim de cada turno, `realm.techPoints` incrementa

### T4 — Integrar bônus de recrutamento em `economyLogic.ts` 🟡 Barato
- `getMaxRecruitable` (linha 300): `maxRecruitable *= (1 + (realm.techLevels?.recruitment || 0) * 0.1)`
- Critério de aceite: com recruitment nível 3, pode recrutar 30% mais

### T5 — Integrar bônus de combat 🔴 FORTE
- `resolveCombat` NÃO recebe `Realm` (só `Army`, `Terrain`, `defenseLevel`)
- **Duas opções:**
  - A) Refatorar `resolveCombat` para receber `attackerRealm` e `defenderRealm` opcionais
  - B) Aplicar bônus no caller (`processMarchOrders` em `turnLogic.ts` linha 285 e `executeAIAttack` em `aiLogic.ts` linha 52)
- **Recomendação:** Opção B (aplicar no caller) para manter `resolveCombat` pura
- Critério de aceite: com combat nível 4 (+20%), poder de ataque e defesa refletem o bônus

### T6 — Integrar bônus de AP em `turnLogic.ts` 🟡 Barato
- Em `processEndOfTurn`, antes de `realm.actionPoints = realm.maxActionPoints` (linha 688):
```typescript
const techBonus = (realm.techLevels?.movement || 0) * 0.5;
const govPenalty = 0; // placeholder até Sprint 3
realm.maxActionPoints = Math.max(2, 5 + techBonus - govPenalty);
```
- Critério de aceite: com movement 6, maxAP = 8. Nunca < 2

### T7 — Criar `TechnologyModal.tsx` 🔴 FORTE
- Modal com 4 categorias (movimento, assimilação, recrutamento, combate)
- Cada categoria: nome, ícone, nível atual, barra de progresso (▓▓▓░░░), custo de upgrade, bônus atual e próximo
- Exibir `techPoints` disponíveis e geração/turno
- Seção "Reinos Vizinhos" (opcional, pode ser simplificada)
- Botão de upgrade → chama `allocateTechPoints`
- Usar `motion/react` para animações (consistente com outros modais)
- Critério de aceite: modal abre/fecha, alocação deduz pontos corretamente, barra de progresso visualmente correta

### T8 — Integrar modal no HUD e App 🟢 Barato
- `HUD.tsx`: adicionar botão "🔬 Tecnologia"
- `App.tsx`: importar `TechnologyModal`, controlar visibilidade via `ui.showTechnologyModal`
- `useUI.ts`: adicionar `showTechnologyModal: boolean` e setter
- Critério de aceite: botão no HUD abre modal

### T9 — Bônus de assimilation tech 🟢 Barato
- `assimilateProvince` (linha 143): `cost = 50 * (1 - (realm.techLevels?.assimilation || 0) * 0.1)`
- `massAssimilate`: mesmo ajuste no `goldCost`
- Critério de aceite: com assimilation 5, custo = 25

### T10 — +1 loyalty global ao subir tech 🟡 Barato
- Em `allocateTechPoints` (T2), após incrementar nível, percorrer províncias do reino e `prov.loyalty = Math.min(100, prov.loyalty + 1)`
- Critério de aceite: ao subir qualquer tech, todas as províncias ganham +1 loyalty

---

## Critérios de aceite da sprint
- [ ] `tsc --noEmit` limpo
- [ ] `npm run build` sem erros
- [ ] `generateTechPoints` retorna valor esperado para reino com X pop, Y workshops, Z courts
- [ ] `getTechUpgradeCost(0) === 10`, `getTechUpgradeCost(5) === 85`
- [ ] Alocação de tech deduz pontos e incrementa nível
- [ ] Bônus de movement: +0.5 AP por nível, piso mínimo 2
- [ ] Bônus de recruitment: +10% pop recrutável por nível
- [ ] Bônus de combat: +5% atk/def por nível
- [ ] Cap de 20 pontos gerados por turno
- [ ] +1 loyalty global ao subir tech
- [ ] TechnologyModal funcional

---

## Comandos de validação
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm run lint         # deve passar limpo
npm run build        # deve compilar
npm run dev          # testar: abrir TechnologyModal, alocar pontos, ver bônus
```

---

## Riscos
- **Penalidades de governo ainda não existem:** usar placeholder `govPenalty = 0` em `generateTechPoints` e no cálculo de AP
- **`resolveCombat` não recebe `Realm`:** requer decisão de design (refatorar assinatura vs aplicar no caller)
- **TechnologyModal pode ser complexo:** se o coder barato não conseguir, simplificar: remover "Reinos Vizinhos", usar layout mais simples

---

## O que NÃO deve ser alterado
- `src/logic/mapGeneration.ts`
- `src/logic/diplomacyLogic.ts`
- `src/logic/game-constants.ts` (a menos que precise de constantes de tech)
- `src/logic/sfxLogic.ts`
- Estrutura de marcha/combate em `turnLogic.ts` `processMarchOrders`

---

*Sprint 01 — Tecnologia — Reinos Medievais — Fase 2*
