# Sprint 07 — Liberty Desire + Tela de Derrota + Responsividade

**Objetivo:** Implementar sistema de Liberty Desire para vassalos, tela de derrota narrativa com estatísticas, e responsividade de todos os modais.

**Nível de dificuldade:** 🔴 Muito Difícil — use coder FORTE para T2 e T7; use coder BARATO para as demais

**Dependências:** Sprint 01 (tipos), Sprint 02 (capitulação — para coexistência)

**Tempo estimado:** 3.5 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Editar | `src/logic/turnLogic.ts` | **Forte** |
| Editar | `src/logic/combatLogic.ts` | Barato |
| Editar | `src/components/GameEndModal.tsx` | **Forte** |
| Editar | `src/components/HUD.tsx` | Barato |
| Editar | `src/hooks/useGameController.ts` | Barato |
| Editar | `src/components/CombatSetupModal.tsx` | Barato |
| Editar | `src/components/BattleOutcomeModal.tsx` | Barato |
| Editar | `src/components/TurnResultModal.tsx` | Barato |
| Editar | `src/components/DiplomacyModal.tsx` | Barato |
| Editar | `src/components/SaveGameModal.tsx` | Barato |
| Editar | `src/components/ChronicleModal.tsx` | Barato |
| Editar | `src/components/GameInstructionsModal.tsx` | Barato |
| Editar | `src/index.css` | Barato |

---

## Tarefas

### T1 — Adicionar campos de tracking em `types.ts` 🟢 Barato
```typescript
// Em Realm:
vassalLiberty: Record<string, number>;  // vassalId → liberty (0-100)
battlesWon: number;
realmsDefeated: number;
cumulativeGold: number;
maxProvincesHeld: number;
```
- Critério de aceite: `tsc --noEmit` passa

### T2 — Implementar `processVassalLiberty` em `turnLogic.ts` 🔴 FORTE
- Nova função em `turnLogic.ts` seguindo o código do PRD (seção 9)
- **Fatores que aumentam:**
  - +2/turno base
  - +5/turno se overlord está em guerra
  - +10/turno se `overlord.overextension > 80`
  - +3/turno se vassalo tem mais províncias que overlord
- **Fatores que diminuem:**
  - -5 ao receber gold do overlord (ação "Apaziguar Vassalo")
  - -3/turno se overlord tem mais tropas que vassalo
  - -2/turno se vassalo tem pacto defensivo com overlord
- **Rebelião:** `liberty >= 100` → `declareWar(vassalId, overlord.id)` usando a exportada de `diplomacyLogic.ts`
- **Notificação:** `liberty >= 70` → `"⚠️ {vassalo} está inquieto (Liberty: X%)"`
- **PADRÃO IMUTÁVEL:** state já é deep clone em `processEndOfTurn`, trabalhar sobre ele
- Critério de aceite: liberty sobe/desce conforme fatores, rebelião ocorre em 100

### T3 — Adicionar barra de Liberty no HUD 🟡 Barato
- No painel de vassalos do HUD: mostrar nome + barra de liberty (0-100) + cor (verde < 50, amarelo 50-70, vermelho > 70)
- Botão "Apaziguar Vassalo" que custa gold (ex: 100g) e reduz liberty em -5
- Critério de aceite: liberty visível no HUD, apaziguamento funciona

### T4 — Incrementar `battlesWon` em `combatLogic.ts` 🟢 Barato
- Em `resolveCombat`, quando `result.won === true`:
```typescript
if (state && provinceId) {
  const attackerRealm = Object.values(state.realms).find(r => 
    Object.values(state.provinces).some(p => p.id === provinceId && p.ownerId === r.id)
  );
  // Alternativa: passar attackerRealmId como parâmetro
}
```
- **Melhor abordagem:** incrementar no caller (`processMarchOrders` e `executeAIAttack`) onde já temos `realmId`
- Critério de aceite: contador de batalhas vencidas incrementa

### T5 — Incrementar `realmsDefeated` 🟢 Barato
- Quando `delete state.realms[defeatedId]` (capitulação ou eliminação), incrementar `winner.realmsDefeated`
- Critério de aceite: contador de reinos derrotados incrementa

### T6 — Incrementar `cumulativeGold` e `maxProvincesHeld` 🟢 Barato
- Em `processEndOfTurn`, no loop de realms (linha 513):
```typescript
realm.cumulativeGold = (realm.cumulativeGold || 0) + realm.gold;
const ownedCount = Object.values(newState.provinces).filter(p => p.ownerId === realm.id).length;
realm.maxProvincesHeld = Math.max(realm.maxProvincesHeld || 0, ownedCount);
```
- Fazer ANTES de deduzir manutenção (para pegar o gold bruto)
- Critério de aceite: tracking funciona ao longo dos turnos

### T7 — Reescrever `GameEndModal.tsx` para derrota narrativa 🔴 FORTE
- **Branch de derrota:** `winnerId !== playerRealmId`
- Template:
  - 💀 "O FIM DE UMA ERA"
  - "O reino de {PlayerRealm} caiu."
  - Frase temática aleatória (array de 4 frases do PRD)
  - Estatísticas finais em grid 2x2 ou 4 colunas:
    - Turnos: `gameState.turn`
    - Províncias máximas: `playerRealm.maxProvincesHeld`
    - Batalhas vencidas: `playerRealm.battlesWon`
    - Reinos derrotados: `playerRealm.realmsDefeated`
    - Ouro acumulado: `playerRealm.cumulativeGold`
  - Botões: "Tentar Novamente" (chama `onRestart`) e "Menu" (chama `onClose`)
- **Manter branch de vitória existente** (troféu + mensagem de triunfo)
- Critério de aceite: tela de derrota mostra estatísticas reais, frase aleatória, botões funcionam

### T8 — Responsividade de 8 modais 🟡 Barato
- Adicionar em `index.css`:
```css
@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  .modal-button {
    min-height: 48px;
    min-width: 48px;
  }
}
```
- Aplicar classes `modal-content` e `modal-button` nos modais:
  - `CombatSetupModal`: layout vertical, sliders maiores
  - `BattleOutcomeModal`: fonte maior, botão maior
  - `TurnResultModal`: scroll vertical, cards empilhados
  - `DiplomacyModal`: lista scrollável, botões touch-friendly
  - `SaveGameModal`: layout compacto
  - `ChronicleModal`: fonte menor, scroll
  - `GameInstructionsModal`: accordion em vez de scroll
  - `GameEndModal`: layout vertical
- Critério de aceite: todos os modais usáveis em 375px, sem overflow horizontal

---

## Critérios de aceite da sprint
- [ ] Liberty sobe a cada turno conforme fatores
- [ ] Liberty >= 100 → rebelião usando `declareWar` canônica
- [ ] Após rebelião, vassalo removido de `overlord.vassals`, `vassal.vassalOf = undefined`
- [ ] Apaziguar vassalo (-5 liberty) funciona como ação
- [ ] Liberty nunca < 0 nem > 100
- [ ] Notificação quando Liberty >= 70
- [ ] `battlesWon`, `realmsDefeated`, `cumulativeGold`, `maxProvincesHeld` incrementam corretamente
- [ ] Tela de derrota narrativa com estatísticas reais e frase aleatória
- [ ] Todos os modais sem overflow horizontal em 375px
- [ ] Touch targets ≥ 48px em botões de modal

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev
# Testar:
# 1. Ter vassalo → observar liberty subir → rebelião
# 2. Perder jogo → ver tela de derrota narrativa
# 3. Chrome DevTools 375px → verificar todos os modais
```

---

## Riscos
- **`declareWar` retorna `{ newState, callsToResolve }`:** em `processVassalLiberty`, `state` já é o clone. Usar `declareWar(state, vassalId, overlord.id)` diretamente (ela modifica o objeto recebido)
- **GameEndModal existente:** `isPlayerWinner: !gameState.gameOver` está incorreto (linha 18). Corrigir para `gameState.gameOver?.winnerId === gameState.playerRealmId`
- **Tailwind v4:** classes como `max-h-[90vh]` podem ter sintaxe diferente. Testar
- **Ação "Apaziguar Vassalo":** se não existir sistema de enviar gold para vassalo, implementar como ação diplomática simples

---

## O que NÃO deve ser alterado
- Sistema de vassalagem existente — apenas adicionar liberty tracking
- Template de vitória do `GameEndModal` — apenas adicionar branch de derrota
- Lógica de jogo nos modais — apenas CSS/layout

---

*Sprint 07 — Liberty + Derrota + Responsividade — Reinos Medievais — Fase 2*
