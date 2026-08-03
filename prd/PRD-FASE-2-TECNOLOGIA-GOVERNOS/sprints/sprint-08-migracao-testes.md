# Sprint 08 — Migração de Save + Testes de Integração

**Objetivo:** Implementar migração de saves da Fase 1 para Fase 2, garantir que todos os sistemas funcionam juntos.

**Nível de dificuldade:** 🟡 Médio — use coder BARATO para TODAS as tarefas

**Dependências:** Todos os sprints anteriores (01 a 07)

**Tempo estimado:** 2.0 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Criar | `src/logic/saveMigration.ts` | Barato |
| Editar | `src/types.ts` | Barato |
| Editar | `src/hooks/useGameController.ts` | Barato |
| Editar | `src/logic/mapGeneration.ts` | Barato |

---

## Tarefas

### T1 — Adicionar `schemaVersion` a `GameState` em `types.ts` 🟢 Barato
```typescript
export interface GameState {
  schemaVersion: number;  // 1 = Fase 1, 2 = Fase 2
  turn: number;
  // ... demais campos
}
```
- Critério de aceite: `tsc --noEmit` passa

### T2 — Criar `src/logic/saveMigration.ts` 🟡 Barato
- Função `migrateSaveGame(data: any): GameState`:
```typescript
export function migrateSaveGame(data: any): GameState {
  if (!data.schemaVersion || data.schemaVersion < 2) {
    // Migrar de v1 → v2
    for (const realmId of Object.keys(data.realms || {})) {
      const r = data.realms[realmId];
      r.techPoints = r.techPoints ?? 0;
      r.techLevels = r.techLevels ?? { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };
      r.government = r.government ?? 'monarchy';
      r.governmentChangeCooldown = r.governmentChangeCooldown ?? 0;
      r.vassalLiberty = r.vassalLiberty ?? {};
      r.loans = r.loans ?? [];
      r.battlesWon = r.battlesWon ?? 0;
      r.realmsDefeated = r.realmsDefeated ?? 0;
      r.cumulativeGold = r.cumulativeGold ?? 0;
      r.maxProvincesHeld = r.maxProvincesHeld ?? Object.values(data.provinces || {})
        .filter((p: any) => p.ownerId === realmId).length;
    }
    for (const provId of Object.keys(data.provinces || {})) {
      data.provinces[provId].originalOwnerId = undefined;
    }
    data.schemaVersion = 2;
  }
  return data as GameState;
}
```
- Critério de aceite: save da Fase 1 carrega com todos os defaults aplicados

### T3 — Integrar `migrateSaveGame` em `useGameController.ts` 🟡 Barato
- `handleLoad` (linha 799): após `persistence.loadSave(id)`:
```typescript
const rawData = persistence.loadSave(id);
if (rawData) {
  const migrated = migrateSaveGame(rawData);
  setGameState(migrated);
  ui.setShowMenu(false);
  ui.showToast("Partida carregada.", "info");
}
```
- `startNewGame`: garantir que `generateInitialState` cria `schemaVersion: 2`. Se não, adicionar após geração
- Em `mapGeneration.ts`, adicionar `state.schemaVersion = 2` no retorno de `generateInitialState`
- Critério de aceite: saves antigos migram automaticamente, novos jogos nascem com v2

### T4 — Testes de integração manuais 🟡 Barato
Seguir checklist completo:

#### Fluxo de Tecnologia
- [ ] Iniciar novo jogo → verificar `realm.techPoints` inicial = 0
- [ ] Construir workshops → próximo turno `techPoints` aumentam
- [ ] Alocar pontos → nível sobe, pontos deduzidos
- [ ] Bônus de movement: AP aumenta
- [ ] Bônus de recruitment: pode recrutar mais
- [ ] `maxActionPoints` nunca < 2

#### Fluxo de Governos
- [ ] Abrir GovernmentModal → 7 governos listados
- [ ] Mudar para Republic → gold income +5%, províncias distantes perdem estabilidade
- [ ] Mudar para Despotism → ataque +15%, pop growth -20%
- [ ] Cooldown: não pode mudar novamente por 20 turnos
- [ ] Revolução: com estabilidade < 20 em >50% províncias, ~10% chance

#### Fluxo de Capitulação
- [ ] Declarar guerra → conquistar >60% → capitulação dispara
- [ ] `originalOwnerId` limpo após guerra
- [ ] Derrotado vira vassalo ou é eliminado
- [ ] Notificação de capitulação aparece

#### Fluxo de Empréstimos
- [ ] Contrair empréstimo → gold aparece imediatamente
- [ ] Parcela `Math.ceil((amount * 1.15) / 10)` descontada por turno
- [ ] Após 10 turnos, loan removido
- [ ] Default (sem gold): penalidades aplicadas

#### Fluxo de IA
- [ ] Expansionist ataca com vantagem > 1.5
- [ ] Defensive nunca inicia guerra
- [ ] IA pede empréstimo quando necessário
- [ ] `aiLogic.ts` não tem `declareWar` local

#### Fluxo de Música
- [ ] Música inicia após primeiro clique
- [ ] Transição menu → jogo com crossfade
- [ ] Guerra alterna para música de guerra
- [ ] Toggle e volume funcionam

#### Fluxo de Liberty + Derrota
- [ ] Liberty sobe a cada turno
- [ ] Liberty >= 100 → rebelião
- [ ] Tela de derrota mostra estatísticas reais

#### Modos de Mapa
- [ ] 13 modos renderizam sem lag
- [ ] Todos os atalhos funcionam

#### Responsividade
- [ ] 375px: todos os modais sem overflow horizontal
- [ ] Touch targets ≥ 48px

#### Migração de Save
- [ ] Save da Fase 1 carrega com defaults
- [ ] Novo jogo Fase 2 salva e carrega com `schemaVersion: 2`

#### Sanidade
- [ ] `calculateMilitaryPower` sem NaN/Infinity
- [ ] `maxActionPoints` nunca < 2
- [ ] Nenhum loop infinito
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros
- [ ] Recrutamento, construção, marcha, ataque funcionam como antes
- [ ] Diplomacia funciona como antes
- [ ] Vitória ainda funciona

---

## Critérios de aceite da sprint
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros
- [ ] Save da Fase 1 carrega corretamente após migração
- [ ] Novo jogo Fase 2 salva e carrega com `schemaVersion: 2`
- [ ] Todos os sistemas funcionam integrados sem loops infinitos
- [ ] Checklist de testes manuais completo

---

## Comandos de validação
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm run lint
npm run build
npm run dev
# Testar: carregar save antigo, iniciar novo jogo, jogar vários turnos
# Verificar cada item do checklist T4
```

---

## Riscos
- **Saves antigos com estruturas inesperadas:** campos com `null` em vez de `undefined`. `??` (nullish coalescing) cobre ambos
- **Tamanho do localStorage:** múltiplos saves com novos campos podem exceder 5-10MB. Se ocorrer, implementar compressão ou limite de saves
- **`generateInitialState` não cria `schemaVersion`:** editar `mapGeneration.ts` para adicionar o campo no objeto de retorno
- **Regressões:** funcionalidades da Fase 1 podem quebrar. Checklist de regressão é essencial

---

## O que NÃO deve ser alterado
- Formato de save existente — apenas adicionar migração
- `persistence.ts` — estrutura de `saveGame`/`loadSave` mantida
- Nenhuma lógica de jogo — apenas correção de bugs encontrados

---

*Sprint 08 — Migração + Testes — Reinos Medievais — Fase 2*
