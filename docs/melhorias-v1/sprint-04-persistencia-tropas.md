# Sprint 04 — Persistência de Tropas Durante Marcha

**Prioridade:** 4ª | **Risco:** Médio | **Esforço:** Médio | **Impacto:** Alto

---

## Resumo

Quando o jogador desloca tropas para outra província (march order), elas devem
permanecer na província de destino nas rodadas seguintes em vez de desaparecer.

## Diagnóstico técnico

Em `turnLogic.ts` (função `processMarchOrders`), quando `remainingPath.length === 0`
e `order.troops` chegam no destino, as tropas são somadas ao `prov.army`. Porém, se a província
destino for enemy ou neutral, a lógica remove o `MarchOrder` mas pode não persistir as tropas
restantes após combate. Também há risco de tropas "em trânsito" não aparecerem no mapa.

**Linhas de referência:** `processMarchOrders` — verificar bloco de resolução de combate
e merge pós-vitória no `turnLogic.ts`.

## Impacto no GameState

- `MarchOrder.currentProvId`
- `Province.army`
- `Province.troops`

## Proposta de valor

Consistência estratégica — o jogador pode confiar que suas decisões
de posicionamento têm efeito duradouro.

## Escopo

- Revisar o fluxo de `processMarchOrders` quando `result.won === true`:
  garantir que `result.attackerRemaining` é persistido no `nextProv.army`.
- Garantir que `marchOrders` com `remainingPath === []` e destino já amigo
  fazem merge correto no `army` (sem race condition de deep clone).
- Exibir na UI tropas "em trânsito" de forma distinta (ícone de marcha no mapa ou HUD).

## Fora de escopo

Animação contínua frame-a-frame da marcha.

## Arquivos prováveis

- `src/logic/turnLogic.ts` (função `processMarchOrders`)
- `src/hooks/useGameController.ts` (dispatch de march orders)
- `src/components/Map.tsx` (exibição de tropas em trânsito)

## Critério de aceite

- [ ] Tropas que chegam em província amiga permanecem lá no turno seguinte
- [ ] Tropas sobreviventes de combate (vitória) permanecem na província conquistada
- [ ] `Province.troops` é igual à soma de `army.infantry + archers + cavalry + scouts` após a marcha
- [ ] Nenhuma regressão em combate entre reinos IA
- [ ] `npm run build` passa sem erros

## Restrições

Imutabilidade — clonar state antes de qualquer mutação.
Não alterar a assinatura de `processMarchOrders` sem verificar todos os callers.

## Risco

Médio. A lógica de combate em marcha (`resolveCombat` inline) já aplica resultado,
mas o estado pós-vitória pode não fazer merge correto das tropas sobreviventes.

## Rota de execução

`BUGFIX FLOW` → revisar `processMarchOrders` em `turnLogic.ts`.
