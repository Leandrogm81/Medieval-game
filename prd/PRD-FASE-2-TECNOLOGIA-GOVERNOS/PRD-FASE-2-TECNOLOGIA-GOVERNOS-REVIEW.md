# Revisão Crítica do PRD — Fase 2: Tecnologia, Governos e Profundidade Estratégica

> **Data da revisão:** 07/05/2026
> **Revisor:** Agente Hermes (auditoria automatizada de PRD)
> **Versão do PRD analisada:** 1.0
> **Base de código inspecionada:** `src/types.ts`, `src/logic/diplomacyLogic.ts`, `src/logic/turnLogic.ts`, `src/logic/aiLogic.ts`, `src/hooks/useGameController.ts`

---

## Resumo da avaliação

O PRD cobre bem o _design conceitual_ das 10 funcionalidades e o modelo mental de cada sistema está claro. Entretanto, ele contém **7 achados críticos** que travarão a implementação se não forem resolvidos antes — entre eles funções inexistentes referenciadas, campos de dados não definidos e fórmulas ambíguas. Some-se a isso **6 achados importantes** (ambiguidades de negócio e riscos de retrabalho) e **4 opcionais**. No estado atual, estimo que um agente coder gastaria de 30% a 50% do tempo resolvendo ambiguidades que o PRD deveria ter sanado.

---

## Achados críticos

### C1. `calculateMilitaryPower` não existe na base de código

**Local:** Seção 6 (IA Avançada), função `shouldAIAttack`

**Problema:** O PRD chama `calculateMilitaryPower(realm, state)` como se fosse uma função existente, mas ela **não está implementada em lugar nenhum** do projeto (`search_files` retornou zero ocorrências). A seção de IA inteira depende desta função para decidir quando atacar. Sem ela, o `switch` de personalidades é inútil.

**Correção:** Especificar a fórmula de poder militar (ex.: `troops * atkPower + defense de todas as províncias`) e adicionar `calculateMilitaryPower` como entregável da seção 6, com assinatura exata e comportamento definido.

---

### C2. Capitulação: `originalOwnerId` não existe em `Province`

**Local:** Seção 2 (Capitulação), bloco de código `checkCapitulation`

**Problema:** O próprio código do PRD admite com comentário: `/* precisamos rastrear ocupação */`. O campo `originalOwnerId` não existe em `Province` (confirmado em `src/types.ts`). Sem esse campo, é impossível calcular `occupationRatio` — a função `checkCapitulation` está estruturalmente quebrada. Além disso, o PRD diz "Precisamos adicionar `originalOwnerId?: string` ao `Province`" como nota informal, mas não formaliza isso no modelo de dados, nem explica quando o campo é setado/limpo.

**Correção:**
1. Adicionar `originalOwnerId?: string` formalmente ao modelo de dados da seção 2.
2. Definir regra: toda província conquistada em guerra mantém `originalOwnerId` do dono pré-guerra; o campo é limpo quando a guerra termina.
3. Atualizar `checkCapitulation` para usar `originalOwnerId` em vez do pseudocódigo comentado.

---

### C3. `declareWar` usado com padrão de mutação incompatível

**Local:** Seção 9 (Liberty Desire), linha `declareWar(state, vassalId, overlord.id)`

**Problema:** Existem **duas** funções `declareWar` no projeto:
- `src/logic/diplomacyLogic.ts`: **pura**, retorna `{ newState: GameState; callsToResolve: CallToArmsRequest[] }` — não muta o parâmetro.
- `src/logic/aiLogic.ts`: **impura**, função local que muta `state` diretamente.

O código do PRD na seção Liberty Desire chama `declareWar(state, vassalId, overlord.id)` sem capturar o retorno, assumindo mutação. Dependendo de qual `declareWar` for importada em `turnLogic.ts`, o comportamento será diferente:
- Se importar da `diplomacyLogic.ts`: a declaração de guerra **não terá efeito** (retorno descartado).
- Se importar da `aiLogic.ts`: funciona, mas a função local de `aiLogic.ts` não está exportada.

Além disso, o AGENTS.md exige imutabilidade ("If it's not immutable, it's wrong"), e o código da Liberty faz `vassal.vassalOf = undefined` e `overlord.vassals = overlord.vassals.filter(...)` — mutações diretas que violam o princípio declarado.

**Correção:**
1. Definir **uma** função `declareWar` canônica exportada (a de `diplomacyLogic.ts` já é a correta).
2. Reescrever o código da Liberty para usar padrão imutável:
   ```typescript
   const warResult = declareWar(state, vassalId, overlord.id);
   state = warResult.newState; // ou propagar no processEndOfTurn
   ```
3. Remover a função duplicada de `aiLogic.ts` ou refatorá-la para usar a exportada.

---

### C4. Custo de upgrade de tecnologia sem fórmula matemática

**Local:** Seção 1 (Tecnologia), subseção "Alocação"

**Problema:** O PRD diz: "Custo aumenta: 10 → 15 → 25 → 40 → 60 → ...". Essa sequência não tem fórmula declarada. Um agente coder vai adivinhar — e diferentes agentes adivinharão fórmulas diferentes (triangular? exponencial? tabela fixa?). A função `getTechUpgradeCost(currentLevel)` está na assinatura mas não tem corpo. Quando um agente implementar a UI com `[↑ 25]`, e outro implementar `getTechUpgradeCost` com fórmula diferente, o botão vai mostrar custo errado.

**Correção:** Especificar a fórmula. Exemplo: `cost = Math.floor(10 * Math.pow(1.55, level))` ou `cost = 10 + 5 * level + 5 * level * (level - 1) / 2`. A sequência sugerida (10, 15, 25, 40, 60) aproxima `round(10 * 1.45^level)`, mas **o PRD precisa cravar a fórmula**.

---

### C5. Atalhos de teclado faltantes para modos 11 e 12

**Local:** Seção 4 (Novos Modos de Mapa), tabela de atalhos

**Problema:** O PRD define 12 modos de mapa (numerados #1 a #12), mas a tabela de atalhos só cobre teclas `1` a `0` (10 teclas). Os modos **Growth (Crescimento, #11)** e **Military Strength (Força Militar, #12)** não têm atalho atribuído. Um agente implementaria os modos mas o jogador não conseguiria acessá-los por teclado, criando inconsistência na UX.

**Correção:** Atribuir atalhos para os modos 11 e 12. Sugestão: `Shift+1` para Growth, `Shift+2` para Military Strength, ou usar teclas como `G` e `F`. Documentar na tabela.

---

### C6. `ViewMode` duplica `'trade'` — possível conflito com o tipo existente

**Local:** Seção 4, bloco de código `types.ts`

**Problema:** O tipo `ViewMode` atual (`src/types.ts` linha 15) já é:
```typescript
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade';
```
O PRD propõe expandi-lo para incluir `'trade'` novamente junto com os novos modos. TypeScript aceita literais duplicados em union types (colapsa), mas a intenção é ambígua: o PRD está ciente de que `'trade'` já existe ou está tratando como novo? Além disso, `'trade'` aparece na lista de modos existentes (#1-#5) como #5 "Resources"? A tabela de atalhos mostra `5` = "Resources", não "Trade". Isso indica que o PRD pode estar confundindo o mapa de modos atual.

**Correção:** Fazer auditoria dos modos já existentes na Fase 1. Se `'trade'` já existe, removê-lo da expansão proposta. Se não existe, o PRD deve declarar que está adicionando `'trade'` como modo #6 real (e reordenar a numeração).

---

### C7. Código da Capitulação proposto conflita com a estrutura de `processActiveWars`

**Local:** Seção 2, subseção "Implementação"

**Problema:** O PRD diz para "modificar `processActiveWars`" adicionando `checkCapitulation`, mas o código mostra `checkCapitulation` como função **local nova** que retorna `CapitulationResult | null`. A função `processActiveWars` existente (`src/logic/turnLogic.ts` linha 403) itera sobre `state.activeWars` e processa batalhas/exaustão. O PRD não especifica **onde** no fluxo de `processActiveWars` a capitulação deve ser checada (antes das batalhas? depois? no lugar delas?). Também não define o tipo `CapitulationResult`.

**Correção:** Mostrar o ponto exato de inserção no fluxo de `processActiveWars`. Definir a interface `CapitulationResult` (campos: `winnerId`, `loserId`, `occupationRatio`, `provincesToCede`). Especificar que a checagem ocorre **após** processar todas as batalhas do turno, antes de calcular exaustão.

---

## Achados importantes

### I1. `techGeneration` desnormalizado — risco de dessincronização

**Local:** Seção 1, modelo de dados do `Realm`

**Problema:** `techGeneration` é um campo armazenado em `Realm`, mas seu valor é **calculado** a cada turno com base em população e edifícios. Se qualquer sistema modificar população ou edifícios sem recalcular `techGeneration`, o valor fica stale. Pior: o PRD não diz quando recalcular — só em `processEndOfTurn`? Ao construir edifício?

**Correção:** Ou tornar `techGeneration` uma função pura (não armazenar), ou definir explicitamente todos os pontos de recálculo: `processEndOfTurn`, `buildBuilding`, `conquerProvince`, `populationGrowth`.

---

### I2. `paymentPerTurn` do empréstimo sem fórmula

**Local:** Seção 5 (Empréstimos)

**Problema:** O PRD diz "Juros: 15% total (1.5% por turno)" e "Pagamento: automático no `processEndOfTurn`", mas **nunca especifica a fórmula de cálculo da parcela**. Um agente pode fazer `(amount * 1.15) / 10`, outro pode fazer `amount * 0.015 + amount/10`. A interface `requestLoan` retorna `paymentPerTurn: number` mas como esse número é computado? Silêncio total.

**Correção:** Especificar: `paymentPerTurn = Math.ceil((amount * 1.15) / 10)`. Também esclarecer se é juros simples ou compostos e se o campo `remaining` no modelo `Loan` é "parcelas restantes" ou "gold restante".

---

### I3. Escopo da música procedural subestimado em ~5x

**Local:** Seção 7 (Música Ambiente)

**Problema:** O PRD aloca **1 dia** para "música ambiente com Web Audio API e sons gerados proceduralmente". Gerar música procedural com crossfade, múltiplas faixas temáticas (menu/paz/guerra), loop contínuo e slider de volume é uma tarefa de **5-10 dias** para um dev competente. Envolve síntese de áudio, scheduling preciso, transições suaves, e gestão de `AudioContext`. Um agente coder que levar 1 dia entregará algo quebrado ou placeholder.

**Correção:** Ou aumentar a estimativa para 4-5 dias, ou reduzir o escopo: usar arquivos de áudio pré-gravados (MP3 leves) com `<audio>` nativo em vez de Web Audio API procedural. Especificar fonte dos assets (gerados por IA? banco gratuito?).

---

### I4. "Províncias distantes" da Republic não definido

**Local:** Seção 3 (Governos), tabela de tipos

**Problema:** Republic: "-10% estabilidade em províncias distantes". O que é "distante"? Distância em pixels do centro da capital? Número de saltos (path length) entre províncias? Províncias que não fazem fronteira com a capital? Sem definição, cada agente implementará uma heurística diferente e o balanço do jogo será imprevisível.

**Correção:** Definir "distante" como "províncias cujo caminho mais curto até a capital tem mais de N províncias intermediárias" (ex.: N=2) ou "distância euclidiana do centro da capital > X pixels".

---

### I5. Tribal: -1 AP pode levar a AP negativo sem proteção

**Local:** Seção 3, tabela de tipos (Tribal)

**Problema:** Tribal dá `-1 AP por turno`, mas um reino Tribal com `maxActionPoints = 5` e `techLevels.movement = 0` teria `maxActionPoints = 4`. Até aí OK. Mas se `maxActionPoints` já for 1 (baseline de algum cenário), `-1 AP` = 0 AP por turno = reino **congelado**. O PRD não define piso mínimo para `maxActionPoints`.

**Correção:** Adicionar regra: `maxActionPoints = Math.max(2, baseValue)` — piso mínimo de 2 AP para qualquer reino, independentemente de penalidades.

---

### I6. Estatísticas da tela de derrota sem tracking definido

**Local:** Seção 10 (Tela de Derrota Narrativa)

**Problema:** O template mostra "Batalhas vencidas: {wins}", "Reinos derrotados: {defeated}", "Ouro acumulado: {gold}". Nenhum desses campos existe em `Realm` ou `GameState`. O PRD não define **onde** esses contadores serão armazenados nem **quando** serão incrementados. Um agente implementará o `GameEndModal` e descobrirá que os dados simplesmente não existem.

**Correção:** Adicionar campos de tracking ao `Realm` ou `GameState` (ex.: `battlesWon`, `realmsDefeated`, `cumulativeGold`), com regras de incremento especificadas (ex.: `battlesWon++` ao vencer batalha, `realmsDefeated++` quando reino é eliminado, `cumulativeGold += goldIncome` a cada turno).

---

## Achados opcionais

### O1. Estimativa global de 10-15 dias é agressiva

Com 10 funcionalidades, várias delas complexas (IA, tecnologia, música procedural), e o overhead de integração entre sistemas, 10-15 dias exigiria um desenvolvedor sênior dedicado em tempo integral. Para agentes de código trabalhando sequencialmente com revisão, 20-25 dias é mais realista. Isso não quebra o PRD, mas gera expectativa irreal.

---

### O2. Sem estratégia de migração de save games

O PRD adiciona campos a `Realm` (techPoints, techLevels, techGeneration, government, vassalLiberty, loans) e a `Province` (originalOwnerId). Jogos salvos da Fase 1 **não terão esses campos** e quebrarão ao carregar. O PRD não menciona migração, versão de schema ou valor default para saves antigos.

**Correção:** Adicionar seção "Migração de Save Games" com versão de schema e defaults para todos os novos campos.

---

### O3. Requisito fantasma: "IA não investe em província com wealth > 90% do máximo"

**Local:** Seção 6, lista de testes

**Problema:** O item de teste menciona investimento em províncias, mas **nenhuma seção do PRD define sistema de investimento**. É um requisito da Fase 1? É uma feature futura? Um agente lendo esse teste não saberá o que implementar.

**Correção:** Remover do checklist de testes da Fase 2 ou referenciar explicitamente o sistema de investimento existente (se houver).

---

### O4. Browser autoplay policy para música não tratada

**Local:** Seção 7

**Problema:** Navegadores modernos bloqueiam autoplay de áudio sem gesto do usuário. Se a música deve começar automaticamente ao entrar no jogo, isso falhará em 90% dos browsers. O PRD não menciona como contornar (ex.: iniciar após primeiro clique no mapa).

**Correção:** Adicionar nota de implementação: iniciar `AudioContext` via evento de clique do usuário (ex.: botão "Iniciar Jogo"), usar `ctx.resume()` após gesto.

---

## Correções recomendadas

| # | Achado | Ação recomendada |
|---|--------|-----------------|
| C1 | `calculateMilitaryPower` inexistente | Especificar fórmula e adicionar ao escopo da seção 6 |
| C2 | `originalOwnerId` ausente em Province | Formalizar campo no modelo de dados com regras de set/clear |
| C3 | `declareWar` com padrão de mutação ambíguo | Unificar em uma função canônica; reescrever Liberty com imutabilidade |
| C4 | Fórmula de custo de tech ambígua | Definir `getTechUpgradeCost(n)` matematicamente |
| C5 | Atalhos faltantes modos 11-12 | Atribuir teclas e documentar |
| C6 | `ViewMode` duplicando `'trade'` | Auditar modos existentes, remover duplicata |
| C7 | `checkCapitulation` vs `processActiveWars` | Definir ponto de inserção e tipo `CapitulationResult` |
| I1 | `techGeneration` desnormalizado | Tornar campo computado ou definir todos os pontos de recálculo |
| I2 | `paymentPerTurn` sem fórmula | Especificar: `Math.ceil(amount * 1.15 / 10)` |
| I3 | Música: 1 dia irreal | Aumentar para 4-5 dias ou usar assets pré-gravados |
| I4 | "Províncias distantes" não definido | Definir métrica de distância (hops ou pixels) |
| I5 | AP pode ir a zero/negativo | Adicionar piso `Math.max(2, ...)` |
| I6 | Estatísticas de derrota sem tracking | Adicionar campos e regras de incremento |
| O1 | Estimativa agressiva | Ajustar para 20-25 dias ou reduzir escopo |
| O2 | Sem migração de saves | Adicionar seção de migração com defaults |
| O3 | Teste de investimento fantasma | Remover ou referenciar sistema existente |
| O4 | Autoplay policy | Documentar estratégia de `AudioContext.resume()` |

---

## Veredito final

**⚠️ PARCIALMENTE PRONTO**

O PRD tem visão de produto sólida e a direção estratégica está correta. Os 7 achados críticos, porém, **impedem a implementação direta** — um agente coder que receber este documento hoje travará em:
- `calculateMilitaryPower` (não existe — IA inteira bloqueada)
- `originalOwnerId` (não existe — capitulação quebrada)
- `declareWar` ambíguo (Liberty Desire com comportamento indefinido)
- Custo de tecnologia sem fórmula (UI e lógica divergentes)

Recomendo **1-2 dias de refinamento do PRD** para resolver os 7 críticos e os 6 importantes antes de iniciar o plano de implementação. Após essas correções, o documento estará pronto para decomposição em sprints.

---

*Revisão gerada por Hermes Agent | 07/05/2026*
