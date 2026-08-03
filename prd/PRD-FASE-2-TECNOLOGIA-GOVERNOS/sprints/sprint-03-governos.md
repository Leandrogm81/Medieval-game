# Sprint 03 — Sistema de Governos

**Objetivo:** Implementar 7 tipos de governo com bônus/penalidades, modal de seleção, mudança com custo/cooldown, e revolução.

**Nível de dificuldade:** 🔴 Muito Difícil — use coder FORTE para T3 e T5; use coder BARATO para as demais

**Dependências:** Sprint 01 (tipos base)

**Tempo estimado:** 2.5 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Criar | `src/logic/governmentLogic.ts` | Barato |
| Criar | `src/components/GovernmentModal.tsx` | **Forte** |
| Editar | `src/logic/turnLogic.ts` | **Forte** |
| Editar | `src/logic/technologyLogic.ts` | Barato |
| Editar | `src/hooks/useGameController.ts` | Barato |
| Editar | `src/hooks/useUI.ts` | Barato |
| Editar | `src/components/HUD.tsx` | Barato |
| Editar | `src/App.tsx` | Barato |

---

## Tarefas

### T1 — Adicionar tipos de governo em `types.ts` 🟢 Barato
- `GovernmentType`:
```typescript
export type GovernmentType = 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal';
```
- `GovernmentStats`:
```typescript
export interface GovernmentStats {
  name: string;
  defense: number; attack: number;
  goldIncome: number; foodProduction: number;
  diplomaticActions: number; techGeneration: number;
  recruitmentCost: number; populationGrowth: number;
  vassalGoldBonus: number; vassalLoyaltyBonus: number;
  strategicResourceBonus: number; stabilityInDistant: number;
  relationPenalty: number;
}
```
- Campos em `Realm`: `government: GovernmentType` (default `'monarchy'`), `governmentChangeCooldown: number`
- Critério de aceite: `tsc --noEmit` passa

### T2 — Criar `src/logic/governmentLogic.ts` 🟡 Barato
- `GOVERNMENT_STATS: Record<GovernmentType, GovernmentStats>` — tabela completa com os 7 governos conforme PRD (seção 3)
- `applyGovernmentBonuses(realm, state)` — modifica `realm` com bônus/penalidades
- `changeGovernment(realm, newType, state, force)` — custo 500g+200m, instabilidade -30 loyalty/3 turnos, cooldown 20 turnos
- `checkRevolution(realm, state)` — estabilidade < 20 em >50% das províncias → 10% chance/turno
- `getGovernmentFlavor(type)` — texto de sabor
- `isProvinceDistant(state, provinceId, realm, threshold=2)` — BFS da capital
- Critério de aceite: todas as funções exportadas e puras

### T3 — Integrar `applyGovernmentBonuses` em `turnLogic.ts` 🔴 FORTE
- No loop de realms em `processEndOfTurn` (linha 513), após cálculo de renda base, aplicar modificadores:
  - **Monarchy:** +10% defesa (guardar em variável para `resolveCombat`)
  - **Republic:** +1 ação diplomática, +5% gold, -10% estabilidade em províncias distantes
  - **Feudal:** +15% food, vassalos +10 loyalty, -5% gold
  - **Theocracy:** +20% loyalty, -10% tech generation (aplicar em `generateTechPoints`)
  - **Despotism:** +15% ataque, recrutamento 20% mais barato, -20% pop growth
  - **Oligarchy:** +25% gold de vassalos, -10 relações/turno
  - **Tribal:** recurso estratégico dobrado, -1 AP, -20% tech
- Critério de aceite: bônus e penalidades aplicados corretamente

### T4 — Integrar `checkRevolution` em `turnLogic.ts` 🟡 Barato
- Após processamento de estabilidade no loop de províncias, checar revolução
- Se ocorrer: mudar governo aleatoriamente, logar: `"REVOLUÇÃO: ${realm.name} agora é governado por ${newGovernment}!"`
- Critério de aceite: revolução ocorre com ~10% chance/turno quando condições são atingidas

### T5 — Criar `GovernmentModal.tsx` 🔴 FORTE
- Lista de 7 governos com: nome, ícone, bônus (verde), penalidade (vermelha), texto de sabor (itálico)
- Botão "Reformar Governo" com custo visível (500g + 200m)
- Indicador de cooldown: "Disponível em X turnos" ou "Reformar agora"
- Modal de confirmação: "Esta reforma custará 500 gold, 200 materials e causará instabilidade (-30 loyalty) por 3 turnos. Continuar?"
- Governo atual destacado
- Critério de aceite: modal funcional, muda governo, cobra custo, respeita cooldown

### T6 — Integrar modal no HUD e App 🟢 Barato
- `HUD.tsx`: botão "🏛️ Governo"
- `App.tsx`: importar `GovernmentModal`
- `useUI.ts`: adicionar `showGovernmentModal: boolean`
- Critério de aceite: modal acessível via HUD

### T7 — Penalidade de províncias distantes (Republic) 🟡 Barato
- Em `processEndOfTurn`, no loop de províncias, chamar `isProvinceDistant`
- Se Republic + província distante: `stabilityDelta -= 10` (ou multiplicar estabilidade por 0.9)
- Critério de aceite: capital + vizinhas diretas imunes, províncias a ≥2 saltos sofrem penalidade

### T8 — Bônus/penalidades restantes 🟡 Barato
- **Oligarchy:** em `processEndOfTurn`, `goldIncome += Math.floor(vassalTribute * 0.25)`. `Object.values(state.realms).forEach(r => adjustRelation(realm, r.id, -10))`
- **Tribal:** `materialIncome += resourceBonus` (dobrar bônus de recursos estratégicos). `maxActionPoints -= 1` (já tratado em T3)
- **Despotism:** em `getRecruitCost`, `cost.gold *= 0.8` etc.
- Critério de aceite: cada governo tem todos os seus modificadores aplicados

---

## Critérios de aceite da sprint
- [ ] 7 governos disponíveis com stats corretos
- [ ] Mudança de governo custa 500g + 200m + instabilidade
- [ ] Cooldown de 20 turnos
- [ ] Revolução ocorre com estabilidade < 20 em >50% das províncias (10% chance)
- [ ] `maxActionPoints` nunca < 2 (Tribal + outras penalidades)
- [ ] Republic: -10% estabilidade em províncias distantes (≥2 saltos)
- [ ] Oligarchy: +25% gold de vassalos, -10 relações
- [ ] Tribal: recurso dobrado, -1 AP, -20% tech

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar: abrir GovernmentModal, mudar governo, ver bônus/penalidades no próximo turno
```

---

## Riscos
- **Interação com Sprint 01:** Garantir que `maxActionPoints = Math.max(2, 5 + techBonus - govPenalty)`. Substituir placeholder `govPenalty = 0` do Sprint 01
- **Cooldown tracking:** `realm.governmentChangeCooldown` deve ser decrementado em 1 a cada `processEndOfTurn`. Se > 0, impedir mudança
- **Instabilidade temporária (-30 loyalty/3 turnos):** Precisa de tracking. Opção: adicionar `realm.stabilityPenalty: number` (turnos restantes) e aplicar no loop de províncias

---

## O que NÃO deve ser alterado
- Sistema de vassalagem existente — apenas aplicar modificador Oligarchy
- `src/logic/mapGeneration.ts`
- `src/logic/sfxLogic.ts`

---

*Sprint 03 — Governos — Reinos Medievais — Fase 2*
