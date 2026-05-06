# Sprint 05 — Aba de Comércio de Recursos

**Prioridade:** 5ª | **Risco:** Médio | **Esforço:** Grande | **Impacto:** Alto

---

## Resumo

Criar uma aba "Comércio" onde o jogador pode trocar recursos (ouro, comida,
materiais) usando taxas de câmbio baseadas na escassez e no valor relativo de cada recurso.

## Objetivo de Gameplay

Resolver desequilíbrios pontuais de recursos sem depender apenas
de conquista. Adiciona uma dimensão econômica de gestão.

## Impacto no GameState

- `Realm.gold`, `Realm.food`, `Realm.materials`
- `Realm.actionPoints` (o comércio custa 1 AP por transação)
- `Realm.tradeRoutes` (pode ser expandido futuramente)

## Regras de Taxa de Câmbio

| De → Para | Taxa base |
|-----------|-----------|
| Ouro → Comida | 1 ouro = 3 comida |
| Ouro → Material | 1 ouro = 2 material |
| Comida → Ouro | 3 comida = 1 ouro |
| Comida → Material | 2 comida = 1 material |
| Material → Ouro | 2 material = 1 ouro |
| Material → Comida | 1 material = 2 comida |

As taxas flutuam ±20% com base no nível de escassez do recurso alvo no reino.

**Fórmula de escassez:**
```
escassez = 1 - (recursoAtual / 500)  // onde 500 é o estoque "confortável"
ajuste = escassez × 0.2              // até ±20%
taxaFinal = taxaBase × (1 + ajuste)
```

**Limites de segurança:**
- Máximo de 3 transações por turno (evitar abuso de AP → recursos)
- Volume máximo por transação: 100 unidades do recurso de origem
- Custo: 1 AP por transação

## Escopo

1. **Logic (`economyLogic.ts`):**
   - Função `executeTradeExchange(realm, from, to, amount): boolean`
   - Função `getTradeRate(realm, from, to): number` (com ajuste por escassez)
   - Validação de AP disponível e limite de transações por turno

2. **State (`types.ts`):**
   - Campo `tradesThisTurn: number` no `Realm` (reset a cada turno)

3. **UI (`HUD.tsx` ou novo componente `TradePanel.tsx`):**
   - Nova aba "Comércio" no painel de gestão
   - Seletor de recurso de origem e destino
   - Slider de quantidade
   - Preview do resultado antes de confirmar
   - Indicador de transações restantes (3 - tradesThisTurn)

4. **Turn Logic (`turnLogic.ts`):**
   - Reset de `tradesThisTurn = 0` no início de cada turno

## Fora de escopo (v1)

Comércio entre reinos IA; rotas comerciais dinâmicas; mercado global.

## Arquivos prováveis

- `src/types.ts` (adicionar `tradesThisTurn`)
- `src/logic/economyLogic.ts` (funções de troca)
- `src/logic/turnLogic.ts` (reset de tradesThisTurn)
- `src/components/HUD.tsx` ou novo `src/components/TradePanel.tsx`
- `src/hooks/useGameController.ts` (action `trade`)

## Critério de aceite

- [ ] Aba "Comércio" visível e acessível no painel lateral
- [ ] Troca de recursos aplica a taxa correta com ajuste de escassez
- [ ] Limite de 3 transações por turno é respeitado
- [ ] `tradesThisTurn` é resetado no início de cada turno
- [ ] Feedback visual claro de custo em AP e resultado da troca
- [ ] `npm run build` passa sem erros

## Restrições

- O custo em AP deve ser balanceado para não tornar o AP o único gargalo do jogo.
- As taxas de câmbio nunca podem ser mais favoráveis que 1:1 (evitar exploits).
- Não expor a aba de comércio para províncias individuais — é uma ação de reino.

## Risco

Médio. Risco de inflação descontrolada se as taxas forem muito favoráveis.
Limitar volume máximo por turno é essencial.

## Dependências

Requer que `Sprint 03` (painel de informações) esteja concluída para integração de UI consistente.

## Rota de execução

`SPEC STUDIO em PRD MODE` → definir taxas, limites e UI detalhada antes de implementar.
