# Sprint 01 — Províncias nas Bordas sem Nome e sem Informações

**Prioridade:** 1ª | **Risco:** Baixo | **Esforço:** Pequeno | **Impacto:** Alto

---

## Resumo

Províncias geradas nas extremidades do mapa ficam sem nome visível
e sem dados de tropas exibidos no mapa.

## Diagnóstico provável

O centro calculado (`province.center`) cai fora da viewport
ou muito próximo da borda, fazendo o label de texto SVG ficar cortado.
Pode ser também que os polígonos das bordas sejam gerados com vértices fora dos limites
e o centroid calculado seja inválido.

## Impacto no GameState

Nenhum nos dados. Apenas na renderização do mapa SVG.

## Proposta de valor

Consistência visual. Todas as províncias devem ser jogáveis e legíveis.

## Escopo

- Em `mapGeneration.ts`: adicionar clamp no centroid calculado para garantir que
  `center[0] ∈ [padding, 1280 - padding]` e `center[1] ∈ [padding, 720 - padding]`.
- Em `Map.tsx` (ou componente de render SVG): garantir que labels de texto verificam
  se o centro está dentro do viewport antes de renderizar.
- Verificar se `province.name` é gerado corretamente para todas as províncias.

## Fora de escopo

Redesign do algoritmo de geração de mapa.

## Arquivos prováveis

- `src/logic/mapGeneration.ts`
- `src/components/Map.tsx`

## Critério de aceite

- [ ] Todas as províncias exibem nome no mapa (inclusive nas bordas)
- [ ] Nenhum label SVG aparece cortado ou fora da área visível
- [ ] `npm run build` passa sem erros

## Risco

Baixo. Bugfix cirúrgico de coordenadas.

## Rota de execução

`BUGFIX FLOW` → localizar `mapGeneration.ts` e componente de render SVG.
