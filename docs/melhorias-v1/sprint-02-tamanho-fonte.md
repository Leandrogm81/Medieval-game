# Sprint 02 — Tamanho de Fonte na UI dos Painéis

**Prioridade:** 2ª | **Risco:** Baixo | **Esforço:** Pequeno | **Impacto:** Médio

---

## Resumo

Aumentar levemente o tamanho da fonte dos rótulos e valores nos painéis laterais
(ex.: "MANUTENÇÃO MILITAR", "INF: 5", "ADMINISTRAÇÃO REGIONAL", "INFANTARIA", etc.).

## Objetivo de Gameplay

Legibilidade. O jogador precisa ler informações rapidamente durante
a gestão de províncias. Texto pequeno cansa e cria fricção desnecessária.

## Impacto no GameState

Nenhum. Mudança puramente de UI/CSS.

## Proposta de valor

Conforto visual imediato. Zero risco de regressão lógica.

## Escopo

- Ajustar font-size das classes de rótulos no `HUD.tsx` (rótulos como `text-[7px]`, `text-[8px]`).
- Garantir que o ajuste não quebre o layout em viewports menores.
- Focar especialmente nas seções de painel de província e manutenção militar.

## Fora de escopo

Refatoração total do sistema de tipografia.

## Arquivos prováveis

- `src/components/HUD.tsx`
- `src/index.css` (se houver classes customizadas)

## Critério de aceite

- [ ] Rótulos de painel legíveis sem precisar aproximar o rosto da tela
- [ ] Layout não quebra em telas de 1280×720
- [ ] `npm run build` passa sem erros

## Restrições

Tailwind v4 — usar valores via `@theme` ou classes utilitárias existentes.
Não usar valores de fonte abaixo de `text-[10px]` para rótulos principais.

## Risco

Baixo. Quebra de layout se os painéis não tiverem espaço suficiente para fonte maior.

## Rota de execução

`BUILD FLOW` (trivial) — pode ir direto para implementação.
