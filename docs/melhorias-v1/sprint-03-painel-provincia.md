# Sprint 03 — Painel de Informações Completo das Províncias

**Prioridade:** 3ª | **Risco:** Baixo | **Esforço:** Médio | **Impacto:** Alto

---

## Resumo

Ao clicar em uma província, o jogador deve ver claramente:
tropas (por tipo), população recrutável, construções existentes, produtividade
(ouro/comida/material por turno), lealdade e recurso estratégico.

## Diagnóstico

Os dados já existem no `Province` (campos `army`, `population`,
`buildings`, `foodProduction`, `wealth`, `loyalty`, `strategicResource`). O problema
é que a UI não os exibe todos ou os exibe de forma truncada.

## Impacto no GameState

Nenhum. Apenas leitura de dados existentes.

## Proposta de valor

O jogador toma decisões informadas sobre onde recrutar,
onde construir, e quais províncias priorizar para defesa.

## Escopo

Expandir o `HUD.tsx` (seção de detalhes da província selecionada) para incluir:

- **Exército:** INF / ARQ / CAV / BAT com ícones e valores
- **Lealdade:** barra visual com % e estado (rebelde/leal/neutro)
- **Construções:** farms / mines / workshops / courts com nível numérico
- **Produtividade estimada:** ouro + comida + material por turno
- **Recrutáveis:** `Math.floor(province.population * 0.1)` — 10% da população
- **Recurso estratégico:** ícone + nome (iron, wood, stone, horse, none)

## Fora de escopo

Histórico de eventos por província; gráfico de tendência de lealdade.

## Arquivos prováveis

- `src/components/HUD.tsx` (seção `selectedProvince`)
- `src/logic/game-constants.ts` (para rótulos de recursos)

## Critério de aceite

- [ ] Seção de informações visível ao selecionar qualquer província (própria ou neutra)
- [ ] Tropas exibidas por tipo com ícone
- [ ] Lealdade exibida como barra de progresso
- [ ] Construções listadas com contagem atual
- [ ] Produtividade estimada coerente com os valores reais do turno
- [ ] `npm run build` passa sem erros

## Restrições

O painel lateral já existe — expansão deve ser feita sem quebrar o layout.
Não duplicar dados já exibidos em outras seções do painel.

## Risco

Baixo. Apenas UI read-only.

## Rota de execução

`BUILD FLOW` (standard) → implementar diretamente no painel existente.
