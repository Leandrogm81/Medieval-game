# Revisão Crítica do PRD — Reforma de UI

> **Documento auditado:** PRD-UI-OVERHAUL.md v1.1
> **Data da auditoria:** 05/05/2026
> **Tipo:** Auditoria pré-implementação

---

## Resumo da avaliação

O PRD é bem estruturado, tem escopo claro e seções bem definidas. No entanto, contém **contradições internas graves**, **riscos técnicos não mapeados** e **suposições sobre a base de código que podem gerar retrabalho**. O principal problema é que ele se compromete a "não alterar lógica de jogo" mas inclui uma funcionalidade (FS-02) que explicitamente altera uma constante de jogo. Além disso, pelo menos uma feature (F-08 loading state) é inútil como especificada, e o sistema de toast — referenciado em critérios de aceite — não existe nem é definido.

**Veredito: Parcialmente pronto** — requer correções antes de virar plano de implementação.

---

## Achados críticos

---

### C-01 — FS-02 viola a regra fundamental "nenhuma alteração na lógica de jogo"

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §8 (FS-02) + §5 + §12 (regra #10) + §20 |
| **Tipo** | Contradição interna |
| **Impacto** | Coder não sabe qual instrução seguir |

**Problema:**
A seção 20, a regra de negócio #10, e o escopo (seção 5) repetem: **"Nenhuma alteração na lógica de jogo"**. Porém FS-02 (seção 8) manda alinhar o custo de ataque: o código debita 2 AP mas `ACTION_COSTS.attack = 4`, e a instrução é "Alinhar para usar `ACTION_COSTS.attack`". Isso **altera o custo de ataque de 2 para 4 AP** — é uma mudança na lógica de jogo.

Um agente coder que segue a regra #10 pulará FS-02; um que segue FS-02 alterará a lógica. O PRD dá instruções conflitantes para o mesmo ponto.

**Correção sugerida:**
- Opção A: Mover FS-02 para fora de escopo (V1).
- Opção B: Declarar explicitamente que FS-02 é **correção de bug** (o comportamento pretendido sempre foi 4 AP, e o `2` era um erro de implementação) e adicionar uma exceção à regra #10: *"Exceto FS-02, que é correção de bug alinhando implementação à constante definida."*

---

### C-02 — F-08: Loading state é inútil como especificado

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §7 (F-08) + §12 (regra 9) + §15 |
| **Tipo** | Requisito ineficaz |
| **Impacto** | Coder implementa feature que o usuário nunca vê |

**Problema:**
A seção 7 (F-08) e a regra 9 dizem: *"Não alterar `generateInitialState` — é síncrono, o loading é apenas UX"*. A seção 15 diz: *"A geração é síncrona, JS puro"*.

Se a geração é síncrona e instantânea, o estado `isGenerating=true` será setado e imediatamente limpo **no mesmo frame** — o usuário nunca verá o spinner, a menos que haja um delay artificial. O timeout de 5s para erro é impossível de atingir. O coder implementará um loading que pisca invisível, ou gastará tempo tentando entender como "consertar" algo que é instantâneo.

**Correção sugerida:**
- Opção A: Especificar um delay mínimo (`setTimeout` de 300–400ms) para exibir o spinner.
- Opção B: Envolver a chamada em `setTimeout(0)` para forçar um re-render antes da execução.
- Opção C: Remover F-08 do escopo se a geração é realmente instantânea e a feature não agrega valor.

---

### C-03 — Destaque de províncias alcançáveis em marcha (F-05) é computacionalmente pesado e não especificado

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §7 (F-05) + §12 (regra #6) |
| **Tipo** | Risco técnico ignorado |
| **Impacto** | Queda de performance ao ativar modo marcha |

**Problema:**
F-05 diz que províncias "alcançáveis (marcha)" devem receber destaque visual. A regra #6 diz que marcha usa pathfinding (`findPath`). Destacar **todas** as províncias alcançáveis exige executar pathfinding para cada província candidata, ou um BFS completo a partir da origem. Em um mapa de 40 províncias, o custo pode ser aceitável, mas em mapas maiores ou com pathfinding complexo pode causar queda de frame. O risco não está mapeado na seção 17.

Além disso, não está claro qual o critério de "alcançável": qualquer província acessível por um caminho? Dentro de um limite de movimento? Apenas as que podem ser alcançadas em um turno de marcha?

**Correção sugerida:**
- Especificar o algoritmo: BFS limitado por alcance de movimento é mais barato que A* para cada nó.
- Definir o que é "alcançável" (alcance de movimento em tiles/tempo de marcha).
- Mapear o risco na seção 17: "Cálculo de alcance de marcha pode causar queda de performance em mapas grandes".

---

### C-04 — Sistema de toast não existe e não é definido

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §7 (F-05) + §15 (Confiabilidade) |
| **Tipo** | Dependência não mencionada |
| **Impacto** | Coder não sabe como implementar feedback de erro |

**Problema:**
F-05 diz *"mostra toast de erro"* ao clicar em província não-válida. A seção 15 (Confiabilidade) diz *"Toast notifications para feedback de ações"*. Porém em nenhum lugar do PRD há especificação do sistema de toast: não há componente, não há definição de onde ele aparece, qual a cor, duração, se é um componente novo ou existente, nem se está no escopo da reforma.

O coder precisará improvisar um sistema de toast, arriscando implementar algo fora do escopo ou inconsistente com o design.

**Correção sugerida:**
- Adicionar especificação do sistema de toast ao escopo (ex: criar `ToastContainer` com posição canto inferior esquerdo, duração 3s, estilos dark, fade out).
- Ou verificar se já existe no código e referenciar explicitamente.
- Ou declarar que o toast não é parte do MVP e substituir por alternativa mais simples (ex: `alert()` temporário ou feedback inline no banner de ação).

---

## Achados importantes

---

### I-01 — Touch targets: três números diferentes em três lugares

| Onde | Valor |
|------|-------|
| F-07 (seção 7) | 44px mobile / 36px desktop |
| Regra de negócio #7 (seção 12) | 44px em dispositivos touch (`pointer: coarse`) |
| Critério de aceite F-07 (seção 7) | "Nenhum botão menor que 36×36px" |

São três critérios numericamente diferentes que um coder pode interpretar de três formas distintas. O critério de aceite geral (seção 16) diz *"tamanho mínimo adequado para toque"* — vago demais.

**Correção sugerida:** Unificar em **44px como mínimo universal** (mais seguro para ambos os públicos) ou definir explicitamente: 44px para `@media (pointer: coarse)` e 36px para desktop com mouse. Remover o critério de aceite genérico "36×36px".

---

### I-02 — Botão fullscreen aparece na Tela 2 sem especificação

**Onde:** §10 (Tela 2 — Mapa) — *"Botão de fullscreen no canto superior esquerdo"*

**Problema:** O botão fullscreen não está em nenhuma F-(01 a 09), não tem critérios de aceite, não está na seção 20 (arquivos para modificar). Um coder pode: (a) ignorar (e o resultado não terá fullscreen), (b) implementar de qualquer jeito sem especificação, (c) perder tempo procurando especificação que não existe.

**Correção sugerida:** Adicionar como FS-04 com especificação completa, ou remover da descrição da Tela 2 para não gerar expectativa não atendida.

---

### I-03 — "Modos de visão: Político, Econômico, Crônicas" no HUD sem especificação

**Onde:** §10 (Tela 2 — HUD)

**Problema:** A seção 10 lista modos de visão como parte do HUD. Não há funcionalidade correspondente no escopo MVP, não há critérios de aceite, não está na seção 20. Pode ser um artefato descritivo da UI existente que não será modificado — mas o coder pode pensar que precisa criar ou modificar esses modos.

**Correção sugerida:** Adicionar nota explícita: *"Modos de visão existentes — não modificar"* se for apenas descrição do estado atual.

---

### I-04 — Banner de modo de ação sobrepõe botão de fullscreen e toggle do HUD sem regra de z-index

**Onde:** §7 (F-05) + §10 (Tela 2)

**Problema:** F-05 especifica banner fixo no **topo do mapa**. A Tela 2 coloca:
- Botão de fullscreen no **canto superior esquerdo**
- Toggle do HUD no **canto superior direito**

O banner ocupa o topo inteiro. Sem regras de `z-index` e posicionamento relativo, os botões podem ficar invisíveis ou inacessíveis durante o modo de ação.

**Correção sugerida:** Especificar z-index do banner como `z-10` e garantir que botões de fullscreen/toggle fiquem acima (`z-20`). Ou reduzir a largura do banner para não cobrir os cantos (ex: `max-w-[80%]` centralizado).

---

### I-05 — Contraste WCAG AA 4.5:1 em labels SVG sobre cores arbitrárias

**Onde:** §15 (Acessibilidade) + §7 (F-03)

**Problema:** A seção 15 define "Contraste mínimo de 4.5:1 para texto (WCAG AA)". Os labels SVG (F-03) são renderizados sobre polígonos coloridos cuja cor é determinada pelo dono da província — cores de reino arbitrárias (vermelho, azul, verde, roxo, etc.). Não há como garantir contraste 4.5:1 contra um fundo de cor variável sem um mecanismo dinâmico (auto-detecção de luminância, contorno adaptativo). O PRD ignora esse risco.

**Correção sugerida:**
- F-03 já especifica `stroke` e `paint-order` para contorno, o que ajuda. Mas o PRD deve reconhecer que o critério WCAG AA pode não ser atingível em todos os casos.
- Definir fallback explícito: *"Usar `stroke` preto + `fill` branco para garantir legibilidade independente da cor de fundo. O critério WCAG AA é uma meta, não um requisito bloqueante para labels SVG sobre mapa."*

---

### I-06 — Nomes de arquivo na seção 20 são presuntivos e podem não existir

**Onde:** §20

**Problema:** A seção 20 mapeia estes arquivos para modificação:
- `src/components/HUD.tsx`
- `src/hooks/useGameController.ts`
- `src/components/Map.tsx`

Se o projeto tiver nomes diferentes (ex: `Sidebar.tsx`, `useUI.ts` já tem estado de UI, `MapView.tsx`), o coder vai gastar tempo procurando arquivos que não existem ou confundir arquivos similares.

**Correção sugerida:** Verificar a estrutura real de arquivos do projeto e atualizar a tabela da seção 20 com caminhos exatos e confirmados.

---

### I-07 — Toggle do HUD em mobile colide com botões de zoom

**Onde:** §7 (F-01) + §7 (F-02) + §10 (Tela 2)

**Problema:**
- F-01: *"Toggle button flutuante visível no **canto inferior direito**"* (mobile)
- F-02 / Tela 2: Botões de zoom (+ e -) no **"canto inferior direito"**

Ambos ocupam o mesmo canto. Sem especificação de layout relativo, o coder pode sobrepor os elementos ou posicionar de forma conflitante.

**Correção sugerida:** Especificar ordem/posição relativa. Ex: *"Botões de zoom no canto inferior direito empilhados verticalmente. Toggle do HUD mobile à esquerda dos botões de zoom no mesmo canto, com gap de 8px."*

---

### I-08 — Pan "continua funcionando como antes" sem documentar comportamento atual

**Onde:** §7 (F-02 — Regras)

**Problema:** F-02 diz *"O pan (arrastar) continua funcionando como antes, mas agora relativo ao container do mapa, não à página inteira."* O comportamento atual do pan não é descrito em lugar nenhum. O coder precisa caçar no código para entender como o pan funciona hoje, correndo risco de quebrá-lo ou implementar de forma inconsistente com o resto do sistema.

**Correção sugerida:** Descrever brevemente o mecanismo: *"Atualmente o pan é implementado via `onMouseDown`/`onMouseMove`/`onMouseUp` no componente Map, ajustando `translate` no SVG. O deslocamento é armazenado em estado local do Map."* — ou referenciar o arquivo/função exata.

---

### I-09 — Scrollbar customizada: 5 componentes listados, mas seção 10 lista 7 modais

**Onde:** §7 (F-04) + §10

**Problema:** F-04 lista os componentes que receberão `.custom-scrollbar`:
1. HUD
2. ChronicleModal
3. TurnResultModal
4. SaveGameModal
5. GameInstructionsModal

A seção 10 lista 7 modais no total. Os modais **CombatSetupModal**, **BattleOutcomeModal** e **GameEndModal** não têm `.custom-scrollbar` especificado. Se eles têm conteúdo rolável, o coder pode precisar adicionar a classe neles também — ou pode ignorá-los e o resultado ficar inconsistente.

**Correção sugerida:** Verificar se os modais restantes precisam de scrollbar estilizada e adicionar à lista ou declarar explicitamente que não precisam.

---

## Achados opcionais

---

### O-01 — Posição do botão "?" no menu principal é ambígua

**Onde:** §7 (F-06)

**Problema:** *"Adicionar botão '?' ou 'Instruções' no menu principal **(ao lado do título ou como terceiro painel)**"* — duas opções dadas sem decisão. O coder precisará escolher arbitrariamente.

**Correção sugerida:** Resolver a ambiguidade: decidir uma posição (ex: "ícone '?' no canto superior direito do menu principal") ou dar uma regra de design.

---

### O-02 — FS-01 (remover Vite de dependencies) foge do escopo "Reforma de UI"

**Onde:** §8 (FS-01)

**Problema:** É uma correção de configuração do `package.json`, não de UI. Embora inofensiva, quebra a pureza do escopo declarado ("MVP — Reforma de Interface"). Pode causar merge conflicts se outro branch mexer em `package.json`.

**Correção sugerida:** Mover para um PR separado de manutenção ou justificar explicitamente como "limpeza necessária para a reforma".

---

### O-03 — F-06 define "botão '?'" sem especificar ícone ou texto exato

**Onde:** §7 (F-06)

**Problema:** *"Adicionar botão '?' ou 'Instruções'"* — o coder precisa decidir entre ícone só, texto só, ou ambos. Pode fazer uma escolha inconsistente com o estilo visual do jogo.

**Correção sugerida:** Especificar: *"Botão circular com ícone '?' e `aria-label='Instruções'`. Em telas ≥ 768px, exibir também o texto 'Instruções' ao lado do ícone."*

---

### O-04 — Persona Camila pede "zoom com pinch" mas PD-03 deliberadamente nega sem justificativa

**Onde:** §4 + §19 (PD-03)

**Problema:** A necessidade da persona mobile (Camila) diz *"zoom com pinch"*. A decisão PD-03 diz *"Apenas botões + e - (sem scroll, sem pinch)"* — sem justificativa. O leitor (incluindo o coder) pode questionar por que uma necessidade explícita da persona foi ignorada.

**Correção sugerida:** Adicionar justificativa à PD-03: ex: *"Pinch removido por complexidade técnica de implementação do gesture handler no SVG. Será reconsiderado como melhoria futura (V2)."*

---

### O-05 — Seção 3 item 6 descreve problema que não é resolvido no escopo

**Onde:** §3 (item 6)

**Problema:** O problema #6 lista: *"Ações como recrutamento não permitem escolha de tipo de unidade"*. A seção 6 (Fora de escopo) coloca *"Seletor de composição de tropas para marcha e ataque"* como fora do MVP. Ou seja, o problema é identificado mas não resolvido — o que é válido. Porém o coder pode ler o problema e procurar a solução no escopo, sem encontrá-la, gerando dúvida.

**Correção sugerida:** Adicionar nota ao lado do problema #6: *"Não resolvido neste MVP — será tratado em versão futura."*

---

## Correções recomendadas (ordem de prioridade)

| Prio | ID | Ação |
|:----:|:--:|------|
| 1 | C-01 | Separar FS-02 do PRD de UI ou declarar como exceção explícita ("bug fix") |
| 2 | C-02 | Especificar delay mínimo (300ms+) para loading state ou remover F-08 |
| 3 | C-03 | Definir algoritmo de destaque para marcha (BFS limitado vs A* geral) |
| 4 | C-04 | Adicionar sistema de toast ao escopo ou substituir por alternativa |
| 5 | I-01 | Unificar touch targets em um único valor (44px mínimo universal) |
| 6 | I-04 | Especificar z-index do banner vs botões de fullscreen/toggle |
| 7 | I-07 | Especificar posição relativa do toggle mobile vs botões de zoom |
| 8 | I-06 | Verificar estrutura real de arquivos e atualizar seção 20 |
| 9 | I-08 | Documentar comportamento atual do pan |
| 10 | I-02 | Adicionar fullscreen ao escopo ou remover da Tela 2 |
| 11 | I-03 | Adicionar nota sobre modos de visão ("não modificar" ou especificar) |
| 12 | I-05 | Relaxar critério WCAG AA para labels SVG ou especificar fallback |
| 13 | I-09 | Verificar necessidade de scrollbar nos modais restantes |
| 14 | O-01 | Decidir posição do botão "?" no menu principal |
| 15 | O-03 | Especificar ícone vs texto do botão "?" |
| 16 | O-04 | Adicionar justificativa à PD-03 |
| 17 | O-05 | Adicionar nota ao problema #6: "fora de escopo deste MVP" |
| 18 | O-02 | Mover FS-01 para PR separado ou justificar |

---

## Veredito final

**Parcialmente pronto.**

O PRD tem excelente estrutura, personas definidas, escopo claro e riscos mapeados. Porém as **contradições C-01** (FS-02 vs regra de não alterar lógica), **C-02** (loading state invisível), **C-03** (custo computacional não avaliado) e **C-04** (sistema de toast ausente) são falhas que **um agente coder implementará de forma errada ou inconsistente** sem intervenção.

Recomendo corrigir os 4 críticos e os 9 importantes antes de transformar em plano de implementação. As seções 19 (pontos de decisão) e 20 (resumo para agente) são bons resumos, mas precisam refletir as correções acima para serem confiáveis.

Se as correções forem aplicadas, o PRD estará **pronto** para virar plano de implementação.

---

*Fim da auditoria.*
