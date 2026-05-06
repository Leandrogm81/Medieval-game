# PRD — Reforma de UI do Reinos Medievais (v2 Consolidada)

> **Versão:** 2.0 (consolidada pós-auditoria)
> **Autor:** Hermes Agent (via análise de código-fonte + auditoria)
> **Status:** Pronto para implementação
> **Classificação:** MVP — Reforma de Interface
> **Decisões:** PD-01 a PD-06 resolvidas; PD-07 a PD-09 adicionadas nesta versão; PD-03 justificada com nota técnica

---

## 1. Resumo executivo

O jogo "Reinos Medievais" é um jogo de estratégia medieval em React + TypeScript + Vite, com mapa interativo em SVG, gestão de províncias, exércitos, batalhas e economia. O produto já tem lógica de jogo funcional, mas a interface apresenta problemas críticos de usabilidade: o HUD lateral é fixo e não responsivo, o sistema de zoom usa escala CSS fixa em 1440px (quebrando em qualquer outra resolução), labels do SVG não renderizam corretamente, faltam feedbacks visuais para ações do jogador e não há suporte real para dispositivos móveis.

Este PRD descreve a reforma completa da camada de UI para tornar o jogo jogável em desktop e mobile, com navegação clara, feedbacks visuais, responsividade funcional e manutenibilidade de código.

---

## 2. Objetivo do produto

**Objetivo principal:** Transformar a interface do Reinos Medievais de um protótipo funcional com problemas de usabilidade para um jogo jogável, responsivo e visualmente polido.

**Resultado esperado:** Um jogador consegue iniciar uma partida, navegar pelo mapa, selecionar províncias, emitir ordens militares, construir edifícios, encerrar turnos e visualizar resultados — tudo isso em qualquer tamanho de tela (desktop, tablet, celular) sem frustração.

---

## 3. Problema a resolver

O jogo existe e a lógica de negócio (geração de mapa, combate, economia, IA, turnos) é funcional. A dor atual é que a interface impede a experiência:

1. **HUD fixo sem responsividade** — O painel lateral é forçado a ficar sempre aberto com `!important`, ocupando 320–420px. Em telas menores que 1440px, sobra pouco espaço para o mapa. Em celular, é injogável.

2. **Sistema de zoom quebrado** — O `handleZoom` escala o `#root` inteiro para simular um viewport de 1440px. Em monitores comuns (1920×1080) escala para 1.33x cortando bordas; em celular escala para 0.27x, tornando tudo minúsculo.

3. **Labels do SVG não funcionam** — Classes Tailwind (`text-[10px]`, `font-bold`) aplicadas a elementos SVG `<text>` não renderizam corretamente. O SVG não interpreta classes de texto do Tailwind.

4. **Falta de feedbacks visuais** — Quando o jogador entra em modo "Marchar" ou "Atacar", não há indicador no mapa. Sem alteração de cursor, sem borda pulsante, sem destaque em províncias vizinhas válidas.

5. **Scrollbar customizada ausente** — A classe `.custom-scrollbar` é usada em 5 componentes (HUD, ChronicleModal, TurnResultModal, SaveGameModal, GameInstructionsModal) mas nunca foi definida no CSS.

6. **Navegação incompleta** — O modal de instruções existe mas não tem botão para acessá-lo. Não há atalhos de teclado. Ações como recrutamento não permitem escolha de tipo de unidade. *(Não resolvido neste MVP — será tratado em versão futura.)*

7. **Toast notification existe na implementação (`useUI.ts` + inline em `App.tsx`) mas não está documentado nem tem padrão visual consistente.**

---

## 4. Público-alvo e personas

### Persona 1 — Jogador Casual (Desktop)
- **Nome:** Rafael
- **Perfil:** Joga em notebook 1366×768 ou monitor full HD. Gosta de estratégia mas não quer complexidade excessiva.
- **Necessidades:** UI clara, mapa visível, HUD informativo sem ocupar metade da tela, feedback visual das ações.

### Persona 2 — Jogador Mobile (Tablet/Celular)
- **Nome:** Camila
- **Perfil:** Joga no celular em transporte público. Tela de 390×844 a 430×932.
- **Necessidades:** HUD recolhível, touch targets de no mínimo 44px, modo paisagem funcional. *(Zoom com pinch foi considerado mas removido do MVP por complexidade técnica — será reconsiderado em V2.)*

### Persona 3 — Desenvolvedor do jogo
- **Nome:** Leandro (o usuário real)
- **Perfil:** Criou o jogo e quer iterar. Precisa de código limpo, sem `!important`, com componentes modulares e estilos previsíveis.
- **Necessidades:** CSS sem hacks, componentes reutilizáveis, breakpoints claros, sem regras conflitantes.

---

## 5. Escopo do MVP

O MVP cobre exclusivamente a reforma da camada de apresentação. **Nenhuma lógica de jogo será alterada** com exceção do item FS-02, que é correção de bug (ver seção 8).

1. Sistema de layout responsivo com HUD recolhível (sidebar)
2. Substituição do zoom fixo de 1440px por zoom nativo (CSS transforms controlados por estado)
3. Correção dos labels SVG (Tailwind → atributos SVG nativos)
4. Implementação da classe `.custom-scrollbar` no CSS (aplicada seletivamente nos 5 componentes existentes que a referenciam. Nota: modais CombatSetupModal, BattleOutcomeModal e GameEndModal **não têm** conteúdo rolável e não recebem a classe.)
5. Indicador visual de modo de ação no mapa (cursor, bordas, destaque)
6. Botão de instruções acessível no menu principal e no HUD
7. Aumento de touch targets para mínimo 44px em todos os botões de ação (universal, sem distinção mobile/desktop)
8. Mini indicador de estado de ação na região do HUD (ex: "Modo Ataque: clique em um alvo adjacente")
9. **Loading state na geração do mapa** com delay mínimo de 400ms para garantir que o spinner seja visível (a geração é síncrona e instantânea, então sem delay o usuário nunca veria o indicador)
10. Refatoração do CSS: remover `!important`, consolidar media queries repetitivas, adicionar `display=swap` nas fontes
11. **Alinhamento de constantes (FS-02):** atualizar `ACTION_COSTS` em `game-constants.ts` para refletir os valores balanceados e testados no código (ataque=2, marcha=1, construção=1) — exceção explícita à regra de não alterar lógica
12. **Documentar e estabilizar o sistema de toast** já existente em `useUI.ts` e `App.tsx` (extrair para componente reutilizável, padronizar posição e estilo)

---

## 6. Fora de escopo

Os itens abaixo **não fazem parte do MVP** e não devem ser implementados:

- Música e efeitos sonoros
- Minimapa
- Hotkeys/atalhos de teclado
- Seletor de composição de tropas para marcha e ataque
- Diplomacia e tela de negociação
- Tutorial interativo ou onboarding guiado
- Sistema de achievements ou conquistas
- Multiplayer ou modo online
- Animações de marcha no mapa
- Efeitos de partículas (batalha, fogo, etc.)
- Novos modos de visão do mapa (exceto corrigir os existentes)
- Alteração na lógica de jogo (combate, economia, IA, turnos) — **exceto FS-02 que é correção de bug**
- Responsividade do modal de combate (será tratado em V1)
- PWA ou service workers
- Pinch-to-zoom ou gestos multi-touch (reconsiderado em V2)

---

## 7. Funcionalidades principais

### F-01: Layout responsivo com HUD recolhível

**Objetivo:** Substituir o HUD fixo por uma sidebar que pode ser recolhida pelo jogador, adaptando-se ao tamanho da tela.

**Comportamento esperado:**
- Em desktop (≥1024px): HUD aparece como sidebar à direita, com largura `clamp(280px, 25vw, 420px)`. Botão de toggle visível no canto superior direito do mapa.
- Em tablet (768px–1023px): HUD inicia aberto mas pode ser recolhido. Largura fixa de **320px**. Quando recolhido, mostra apenas um ícone na borda direita.
- Em celular (<768px): HUD inicia recolhido. Ao abrir, funciona como **overlay translúcido** com slide lateral da direita (300ms, ease-out), ocupando **100vw** com fundo `bg-black/60 backdrop-blur-sm`. O mapa permanece visível atrás do overlay. **Toggle button flutuante no canto inferior direito, posicionado à esquerda dos botões de zoom (gap de 8px entre eles).**

**Regras:**
- O HUD nunca deve ocupar mais de 50% da largura total em desktop.
- Ao recolher o HUD em desktop/tablet, o mapa expande para ocupar o espaço liberado.
- Em mobile, o HUD em overlay não afeta o tamanho ou posição do mapa.
- A animação de abrir/fechar é **slide horizontal + fade**, 300ms, com easing `ease-out`.
- O estado do HUD (aberto/recolhido) persiste apenas na sessão (não precisa de save).
- Remover completamente o `!important` do `.hud-docked` e `.hud-toggle-btn` no `index.css`.

**Critérios de aceite:**
- [ ] Botão de toggle do HUD está SEMPRE visível em telas < 1024px
- [ ] Em desktop ≥ 1024px, toggle aparece mas o HUD abre/fecha sem quebrar layout
- [ ] HUD recolhido mostra indicador minimalista (ícone ou borda fina) para reabrir
- [ ] Ao recolher, mapa ocupa 100% da área disponível
- [ ] Nenhum `!important` de posicionamento permanece no CSS do HUD
- [ ] Em mobile, toggle do HUD vem antes (à esquerda) dos botões de zoom, com gap de 8px, sem sobreposição

---

### F-02: Sistema de zoom nativo (não mais escala fixa)

**Objetivo:** Substituir o `handleZoom` que escala o `#root` inteiro para 1440px por um sistema de zoom controlado por estado React, aplicado apenas ao container do mapa via CSS transform.

**Comportamento esperado:**
- O mapa SVG tem viewBox fixo (1280×720) mas o container CSS escala via `transform: scale(zoom)` com `transformOrigin: center center`.
- O zoom mínimo é 0.5, máximo 3.0, incremento de 0.2.
- A página não escala o `#root` inteiro — apenas a área do mapa.
- O layout da página (HUD + mapa lado a lado) usa flexbox normal sem scale mágico.
- Remover o event listener de resize que força o zoom (`handleZoom` em `App.tsx`). O layout deve ser responsivo por CSS puro.

**Regras:**
- O zoom não deve afetar o HUD, botões ou modais — apenas o conteúdo do mapa.
- Zoom de 1.0 deve mostrar o mapa inteiro (1280×720) centralizado no container.
- O pan (arrastar) continua funcionando como antes: usa `panOffset` do hook `useUI`, handlers `onMouseDown/Move/Up` e `onTouchStart/Move/End` no controller (`useGameController`), com offset aplicado via `motion.div` com propriedades `x`/`y` animadas. Agora relativo ao container do mapa, não à página inteira.
- **Scroll do mouse não controla zoom** — apenas os botões + e - da UI.
- Apenas zoom via botões: sem scroll wheel, sem pinch-to-zoom, sem gestos multi-touch. *(PD-03: Pinch removido por complexidade técnica de gestos multi-touch no SVG. Reconsiderado em V2.)*

**Critérios de aceite:**
- [ ] `handleZoom` do `App.tsx` removido e substituído por zoom baseado em estado (`ui.zoom`)
- [ ] `#root` não tem mais `transform: scale()` nem `width: 1440px`
- [ ] Mapa ocupa corretamente o espaço entre a borda esquerda e o HUD
- [ ] Zoom + e - funcionam no mapa sem afetar outros elementos
- [ ] Em navegador redimensionado, layout se ajusta sem distorcer
- [ ] Pan (arrastar) funciona proporcional ao zoom atual

---

### F-03: Labels SVG com atributos nativos

**Objetivo:** Fazer os nomes das províncias renderizarem corretamente substituindo classes Tailwind por atributos SVG.

**Comportamento esperado:**
- Os elementos `<text>` no mapa usam `font-size="10"`, `font-weight="bold"`, `font-family="serif"`, `fill="rgba(255,255,255,0.8)"` em vez de `className="text-[10px] fill-white/80 font-serif..."`.
- Adicionar `paint-order="stroke"` e `stroke="rgba(0,0,0,0.5)" stroke-width="2"` para legibilidade sobre polígonos coloridos.

**Observação sobre contraste WCAG AA (4.5:1):** Os labels SVG são renderizados sobre polígonos com cores de reino arbitrárias. O uso de `stroke` preto + `fill` branco garante legibilidade visual independente da cor de fundo. O critério WCAG AA é uma meta, não um requisito bloqueante para labels SVG sobre mapa — a legibilidade visual é o critério de aceite.

**Critérios de aceite:**
- [ ] Nomes das províncias visíveis no centro de cada polígono
- [ ] Texto legível com contraste contra qualquer cor de preenchimento
- [ ] Nenhum texto aparece no tamanho errado ou com fallback de fonte incorreto
- [ ] Código não usa mais `className` com utilities de texto em elementos `<text>` SVG

---

### F-04: Implementar `.custom-scrollbar` no CSS

**Objetivo:** Criar a definição CSS da classe `.custom-scrollbar` que é referenciada em 5 componentes mas nunca foi implementada.

**Comportamento esperado:**
- `.custom-scrollbar` estiliza a scrollbar com: largura 6px (desktop) / 4px (mobile), track escuro (slate-900), thumb slate-700 com borda arredondada.
- Deve funcionar em WebKit (Chrome, Safari, Edge) e ter fallback para Firefox (`scrollbar-width: thin`).
- Aplicar em todos os componentes que já usam a classe: HUD, ChronicleModal, TurnResultModal, SaveGameModal, GameInstructionsModal.
- **Nota:** CombatSetupModal, BattleOutcomeModal e GameEndModal **não possuem conteúdo rolável** e não precisam da classe.

**Critérios de aceite:**
- [ ] Classe `.custom-scrollbar` definida no `index.css`
- [ ] Scrollbars estilizadas aparecem nos 5 componentes
- [ ] Funciona em Chrome e Firefox
- [ ] Não quebra a scrollbar nativa em outros navegadores (graceful degradation)

---

### F-05: Indicador visual de modo de ação

**Objetivo:** Quando o jogador ativa "Marchar" ou "Atacar", o mapa deve mostrar claramente que está em modo de ação.

**Comportamento esperado:**
- Ao clicar "Marchar" ou "Atacar" no HUD:
  - A província origem recebe uma borda pulsante (animação `pulse-slow` existente)
  - O cursor do mapa muda para `crosshair`
  - Províncias adjacentes (ataque) ou alcançáveis (marcha) recebem um leve destaque (opacidade ou brilho)
  - Um **banner fixo no topo do mapa** (barra horizontal semi-transparente, `z-10`) com instrução textual: "Selecione o alvo para [ação]"
- Ao clicar em província não-válida, o toast de erro já existente (`showToast` em `useUI.ts`) é disparado com tipo `'error'`
- Ao cancelar (botão "Cancelar"), tudo volta ao normal

**Definição de "alcançável" para marcha:** Províncias acessíveis por BFS (busca em largura) limitado ao alcance de movimento padrão de 3 tiles a partir da origem. Isso é mais barato computacionalmente que executar A* para cada nó candidato. O cálculo de alcance de marcha pode causar queda de performance em mapas grandes (>60 províncias) — monitorar durante implementação.

**Regras:**
- Usar estado global `actionState` e `actionSourceId` já existentes no hook `useUI`
- O indicador visual é responsabilidade do componente `Map` (receber como props)
- Não alterar a lógica de clique (`handleProvinceClick`)
- **Z-index do banner:** `z-10`. Botões de fullscreen e toggle do HUD ficam em `z-20` para permanecer acessíveis.

**Critérios de aceite:**
- [ ] Borda pulsante aparece na província de origem quando em modo de ação
- [ ] Cursor muda para `crosshair` em toda a área do mapa
- [ ] Províncias alvo válidas têm destaque visual (stroke mais claro ou glow)
- [ ] Banner de instrução aparece no topo do mapa (z-10, sem cobrir botões de fullscreen/toggle)
- [ ] Ao cancelar, todos os indicadores somem e cursor volta ao normal
- [ ] Toast de erro aparece ao clicar em alvo inválido

---

### F-06: Botão de instruções acessível

**Objetivo:** Garantir que o jogador consiga acessar as instruções do jogo.

**Comportamento esperado:**
- **No menu principal:** ícone circular "?" no **canto superior direito** (ao lado do título), com `aria-label="Instruções"`.
- **No HUD:** botão "?" na barra superior ao lado dos botões "Salvar" e "Menu". Em telas ≥ 768px, exibir também o texto "Instruções" ao lado do ícone.
- Ambos abrem o `GameInstructionsModal` já existente.

**Critérios de aceite:**
- [ ] Botão de instruções visível no menu principal (canto superior direito)
- [ ] Botão de instruções visível no HUD em todas as views
- [ ] Modal de instruções abre e fecha corretamente
- [ ] Botão "?" tem `aria-label="Instruções"` para acessibilidade

---

### F-07: Touch targets mínimos (unificado — 44px universal)

**Objetivo:** Garantir que todos os botões de ação tenham tamanho mínimo para toque.

**Comportamento esperado:**
- **Padrão universal:** todos os botões de ação têm `min-height: 44px` e `min-width: 44px` — sem distinção mobile/desktop. O valor 44px é o mínimo recomendado pela WCAG para touch targets e atende ambos os públicos.
- Botões de zoom do mapa: aumentar de `w-5 h-5` / `w-6 h-6` para no mínimo 44×44px.
- A variável CSS `--touch-target-size: 44px` (já definida em `:root`) deve ser usada como referência.

**Critérios de aceite:**
- [ ] Botões de zoom (+/-) no mapa têm no mínimo 44×44px
- [ ] Botões "Marchar", "Atacar", "Recrutar" têm altura mínima de 44px
- [ ] Nenhum botão de ação tem área clicável menor que 44×44px

---

### F-08: Loading state na geração do mapa

**Objetivo:** Mostrar feedback visual enquanto o mapa está sendo gerado.

**Comportamento esperado:**
- Quando o jogador clica "INICIAR JORNADA", um estado de loading é ativado
- Um spinner ou mensagem "Gerando reinos…" aparece no lugar do menu
- **Delay mínimo:** a transição de loading deve durar no mínimo 400ms, mesmo que a geração seja instantânea. Isso garante que o usuário perceba o feedback visual. Implementar via `setTimeout` ou `requestAnimationFrame` que força um re-render antes da execução da função síncrona.
- Quando `generateInitialState` completa e o estado é atualizado, o loading some e o jogo inicia
- **Timeout:** se a geração de alguma forma exceder 5 segundos, mostrar mensagem de erro com opção de voltar ao menu (embora a geração síncrona torne este timeout praticamente impossível de atingir, mantém-se como safety net)

**Regras:**
- O estado de loading é gerenciado no `useUI` hook (adicionar `isGenerating` e `setIsGenerating`)
- O `startNewGame` no controller seta loading=true, força re-render (ex: `setTimeout(0)` ou `requestAnimationFrame`), depois chama `generateInitialState`
- Não alterar `generateInitialState` — é síncrono, o loading é apenas UX

**Critérios de aceite:**
- [ ] Ao clicar "INICIAR JORNADA", o menu some e aparece indicador de carregamento por pelo menos 400ms
- [ ] Quando o jogo carrega, o loading some e o mapa+HUD aparecem
- [ ] Se houver erro (timeout), mensagem visível com opção de voltar ao menu

---

### F-09: Refatoração do CSS

**Objetivo:** Limpeza e organização do `index.css` para manutenibilidade.

**Comportamento esperado:**
- Substituir media queries específicas por modelo de iPhone (SE, 11-13, landscape, etc.) por 3 breakpoints genéricos: <480px (mobile pequeno), 480–768px (mobile grande/tablet), >768px (desktop). Manter apenas as regras que são funcionalmente distintas.
- O arquivo `index.css` já importa Google Fonts com `&display=swap` (linha 1) — verificar que permanece.
- Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">` e `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` no `index.html`.
- Remover blocos CSS comentados ou não utilizados (ex: `.portrait-blocker`).
- Garantir que a classe `.no-scrollbar` e `::-webkit-scrollbar` coexistam sem conflito.
- A classe `.custom-scrollbar` (F-04) deve ser adicionada.

**Critérios de aceite:**
- [ ] Número de blocos `@media` reduzido de ~8 para no máximo 4
- [ ] `display=swap` presente na URL do Google Fonts (já existe — confirmar que não foi removido)
- [ ] Preconnect links adicionados ao `<head>` no `index.html`
- [ ] Código CSS não tem mais comentários de código desativado
- [ ] Layout não quebra em nenhum breakpoint após a refatoração

---

### F-10: Documentar e estabilizar o sistema de toast (novo)

**Objetivo:** O sistema de toast já existe na implementação (`useUI.ts` tem estado `toast` e função `showToast`; `App.tsx` já renderiza o toast inline via `AnimatePresence`). O PRD anterior não o documentava, criando uma dependência não especificada. Esta funcionalidade formaliza e padroniza o sistema.

**Comportamento esperado:**
- Extrair o toast inline de `App.tsx` para um componente `ToastContainer` reutilizável.
- Posição: canto inferior centralizado (como já está), `z-[100]`.
- Duração: 3 segundos (já implementado via `setTimeout` em `showToast`).
- Estilos: mantidos como estão — `success` (verde), `error` (vermelho), `info` (azul) com backdrop-blur.
- O `ToastContainer` deve ser renderizado uma única vez no nível raiz do componente jogo (não no menu).

**Regras:**
- O componente `ToastContainer` recebe `toast` e opcionalmente `onDismiss` como props.
- Não quebrar chamadas existentes de `showToast` em `App.tsx` (linha 108 usa `showToast` com erro).
- O hook `useUI.ts` já fornece `toast` e `showToast` — não alterar a interface do hook.

**Critérios de aceite:**
- [ ] Toast aparece no canto inferior centralizado da tela com animação de entrada
- [ ] Toast desaparece após 3s com animação de saída
- [ ] Três variantes visuais: success (verde), error (vermelho), info (azul)
- [ ] Botão de ação inválida em modo de ação dispara toast de erro
- [ ] Componente `ToastContainer` extraído e usado no lugar do inline atual

---

## 8. Funcionalidades secundárias

### FS-01: Remover import duplicado do Vite no package.json

`vite` aparece tanto em `dependencies` quanto em `devDependencies`. Manter apenas em `devDependencies`. **(Nota:** Embora fuja do escopo estrito "Reforma de UI", é uma limpeza necessária no repositório.)

### FS-02: Alinhar ACTION_COSTS com os valores testados no código (exceção à regra #10)

O código atual debita custos de AP diferentes dos valores em `ACTION_COSTS` no `game-constants.ts`:

| Ação | `ACTION_COSTS` (constante) | Código debita | Correto |
|------|:--------------------------:|:-------------:|:-------:|
| Recrutar | 1 | 1 | ✅ |
| Atacar | **4** | **2** | ❌ — o constante diz 4, mas o código testado e balanceado debita 2 |
| Marchar | **2** | **1** | ❌ — idem |
| Construir (jogador) | **2** | **1** | ❌ — idem |
| Construir (IA) | 2 | 2 | ⚠️ — IA usa valor hardcoded, precisa ser alinhado |

**Decisão do usuário:** Os valores no código (ataque=2, marcha=1, construção=1) são os **testados e balanceados**. As constantes é que estão erradas.

**O que fazer:**
1. Alterar `game-constants.ts`: `ACTION_COSTS.attack = 2`, `ACTION_COSTS.move = 1`, `ACTION_COSTS.build = 1`.
2. Alinhar a IA em `aiLogic.ts`: onde faz `realm.actionPoints -= 2` (construção) com comentário "Assuming build cost is 2", mudar para `realm.actionPoints -= ACTION_COSTS.build`.
3. **Não alterar** os valores debitados no `useGameController.ts` — eles são os valores corretos e já balanceados.
4. A regra #10 ("Nenhuma alteração na lógica de jogo") é excepcionada exclusivamente para este item.

**Justificativa:** As constantes foram definidas antes do balanceamento real do jogo. Os valores testados em gameplay são diferentes. Este FS alinha a documentação (constantes) com a realidade testada.

### FS-03: Renomear botão "Ver Todos os Reinos"

Foi decidido (PD-04): renomear para **"Gerenciar Salvamentos"** no menu principal, já que é isso que o botão faz (abre o modal de save/load).

---

## 9. Fluxos de usuário

### Fluxo principal: Iniciar partida

1. Jogador abre o jogo → vê menu principal com logo "Reinos Medievais", painel "Novo Reinado" e painel "Retomar Partida"
2. Ajusta extensão do mundo (slider 15–40) e número de reinos (4/6/8)
3. Clica "INICIAR JORNADA"
4. Aparece loading state ("Gerando reinos…") por no mínimo 400ms
5. Mapa é gerado → HUD aparece à direita → jogo começa no turno 1
6. Jogador vê o mapa com províncias coloridas por dono, nomes visíveis, botões de zoom

### Fluxo: Selecionar e gerenciar província

1. Jogador clica em província no mapa
2. Província fica destacada (borda dourada)
3. HUD mostra detalhes da província: nome, dono, terreno, população, defesa, tropas
4. Se for sua província: botões "Marchar", "Atacar", "Recrutar", construção
5. Se for neutra/inimiga: mostra informações básicas

### Fluxo: Atacar província

1. Jogador seleciona província própria → clica "Atacar"
2. Província origem fica com borda pulsante, cursor vira crosshair
3. **Banner fixo no topo do mapa (z-10):** "Modo Ataque — clique em uma província adjacente"
4. Províncias vizinhas válidas ganham destaque (borda/clarity)
5. Jogador clica em província alvo adjacente
6. Modal "Preparo para Combate" aparece com forças vs defensor
7. Jogador clica "Atacar Agora"
8. Resultado da batalha aparece (vitória/derrota, perdas)
9. Se venceu: província muda de dono, toast de sucesso
10. Estado volta a 'idle'

### Fluxo: Encerrar turno

1. Jogador clica "Encerrar Turno" no HUD
2. IA processa ações dos reinos adversários
3. Economia é processada
4. Modal "Relatório de Fim de Turno" aparece com saldo de recursos e eventos
5. Jogador clica "Confirmar"
6. Turno avança, UI atualiza

### Fluxo: Acessar instruções

1. Jogador clica "?" (ícone circular, aria-label="Instruções") no menu principal (canto superior direito) ou no HUD
2. Modal "Guia de Conquista" abre com regras do jogo
3. Jogador lê e fecha clicando no X ou fora do modal

---

## 10. Telas e componentes

### Tela 1 — Menu Principal
- Background: `splash_bg.png` com overlay escuro
- Logo animada (mix-blend-mode: screen)
- Título "Reinos Medievais" com gradiente dourado
- Ícone "?" (Instruções) no **canto superior direito**, circular, `aria-label="Instruções"`
- Painel "Novo Reinado":
  - Slider de extensão do mundo (15–40)
  - Seletor de número de reinos (4, 6, 8)
  - Botão "INICIAR JORNADA"
- Painel "Retomar Partida":
  - Lista de saves (até 3) com progresso circular
  - Botão "Gerenciar Salvamentos" (abre SaveGameModal)
- SaveGameModal (overlay)
- GameInstructionsModal (overlay)

### Tela 2 — Jogo (Mapa + HUD)
- **Container principal:** flex row, mapa à esquerda, HUD à direita (recolhível)
- **Área do mapa:**
  - SVG com viewBox 1280×720, escalado via CSS transform
  - Polígonos de províncias com cor do dono
  - Labels com nome das províncias (SVG text com atributos nativos)
  - Botões de zoom (+ e -) no canto inferior direito, empilhados verticalmente (≥ 44×44px)
  - Botão de fullscreen no canto superior esquerdo (já existe em App.tsx)
  - **Banner fixo de modo de ação** (topo, centralizado, semi-transparente, z-10)
  - Toggle do HUD: canto superior direito em desktop/tablet; **canto inferior direito (à esquerda dos botões de zoom, gap 8px)** em mobile
- **Modos de visão (existentes — não modificar):** Político, Econômico, Crônicas. A UI do HUD já lista esses modos; não criar novos nem alterar o comportamento existente.
- **ToastContainer:** canto inferior centralizado, z-[100] (extraído para componente, padronizando o que já existe inline)

- **HUD (sidebar direita, recolhível):**
  - Desktop: `clamp(280px, 25vw, 420px)` — ao recolher, mapa expande
  - Tablet: 320px fixo — ao recolher, mapa expande
  - Mobile: overlay 100vw com slide lateral + fade 300ms + backdrop-blur
  - Grid de recursos: Tesouro, Grãos, Materiais, Ação (com barra de progresso)
  - Área de detalhes: mostra info da província selecionada ou placeholder
  - Ações militares: Marchar, Atacar (se província própria)
  - Administração: Recrutar, Construir (Fazendas, Minas, Oficinas, Corte)
  - Botão "?" com ícone e texto "Instruções" (≥768px)
  - Botão "Encerrar Turno" (grande, dourado)

### Modais (overlays)
- **ChronicleModal** com `.custom-scrollbar` ✓
- **TurnResultModal** com `.custom-scrollbar` ✓
- **CombatSetupModal** — sem scrollbar customizada (conteúdo não rolável)
- **BattleOutcomeModal** — sem scrollbar customizada (conteúdo não rolável)
- **SaveGameModal** com `.custom-scrollbar` ✓
- **GameInstructionsModal** com `.custom-scrollbar` ✓
- **GameEndModal** — sem scrollbar customizada (conteúdo não rolável)

---

## 11. Dados e entidades

Nenhuma entidade nova será criada. As entidades existentes estão em `src/types.ts` e permanecem inalteradas:

- **GameState** — estado completo do jogo (turno, reinos, províncias, logs, etc.)
- **Realm** — um reino/jogador (recursos, exército, relações, personalidade)
- **Province** — uma província no mapa (dono, população, exército, edifícios, terreno)
- **Army** — composição do exército (infantaria, arqueiros, cavalaria, batedores)
- **MarchOrder** — ordem de marcha em andamento
- **War** — guerra entre reinos
- **SaveData** — dado de salvamento
- **TurnSummaryData** — dados do resumo de turno
- **BattleResult** — resultado de combate
- **VisualEffect** — efeito visual no mapa

**Relações conceituais:**
- GameState → muitos Realms (via `realms: Record<string, Realm>`)
- GameState → muitas Provinces (via `provinces: Record<string, Province>`)
- Realm → muitas Provinces (via `province.ownerId === realm.id`)
- Realm → muitas Wars (via `realm.wars: string[]`)
- Province → vizinhas (via `province.neighbors: string[]`)
- Province → Army (via `province.army`)

**Mudanças no hook useUI (adicionar estados):**
- `isGenerating: boolean` — controle de loading (novo)
- `setIsGenerating: (v: boolean) => void` (novo)
- `actionBannerMessage: string | null` — texto do banner de ação (novo)
- `setActionBannerMessage: (v: string | null) => void` (novo)
- Nota: `toast` / `showToast` já existem — não recriar.

---

## 12. Regras de negócio

1. **HUD recolhível:** O HUD deve poder ser alternado entre aberto e fechado. O estado padrão depende do viewport: desktop ≥ 1024px → aberto; mobile < 768px → fechado; tablet entre 768–1023px → aberto, mas recolhível.

2. **Zoom do mapa:** O zoom é aplicado apenas ao container do mapa via CSS `transform: scale()`. Não afeta HUD, botões, modais ou qualquer outro elemento.

3. **Pan do mapa:** O arraste do mapa funciona proporcional ao zoom atual. Em zoom 2.0, o movimento do mouse é dividido por 2 para sensibilidade consistente. Implementado via `panOffset` (useUI) + handlers no controller + `motion.div` com propriedades `x`/`y`.

4. **Modo de ação:** Apenas um modo de ação pode estar ativo por vez. Ativar "Marchar" desativa "Atacar" e vice-versa. Cancelar uma ação retorna ao estado `idle`.

5. **Alvos válidos (ataque):** Apenas províncias adjacentes (`neighbors.includes(id)`) podem ser alvo de ataque. A província alvo não pode ser do próprio jogador.

6. **Alvos válidos (marcha):** A marcha usa pathfinding (`findPath`) para encontrar rota. O destino pode ser qualquer província não-inimiga acessível dentro do alcance de movimento (3 tiles, BFS limitado). O custo computacional do BFS para mapas grandes (>60 províncias) deve ser monitorado.

7. **Tamanho mínimo de toque:** Todos os elementos interativos (botões, inputs) devem ter no mínimo 44×44px — padrão universal sem distinção entre mobile e desktop. Usar variável CSS `--touch-target-size`.

8. **Fontes:** Google Fonts carregadas com `display=swap` e preconnect links para evitar layout shift.

9. **Scrollbar customizada:** A classe `.custom-scrollbar` deve ser auto-contida e funcionar sem conflito com scrollbars nativas.

10. **Nenhuma alteração na lógica de jogo:** As regras de combate, economia, IA, geração de mapas e turnos não devem ser modificadas. **Exceção:** FS-02 (alinhar `ACTION_CODES` em `game-constants.ts` com os valores testados no código; alinhar IA em `aiLogic.ts` para usar a constante em vez de valor hardcoded).

---

## 13. Permissões e papéis de usuário

### Papéis
- **Jogador:** único papel existente. O jogo é single-player contra IA.

### Permissões
- O jogador controla UM reino (`playerRealmId`).
- O jogador só pode emitir ações para províncias que possui (`prov.ownerId === playerRealmId`).
- O jogador pode visualizar qualquer província visível (sua, neutra, inimiga — dentro do raio de visibilidade).
- O jogador pode salvar, carregar e deletar partidas.
- O jogador pode acessar instruções e crônicas.

### Restrições
- Ações consomem Action Points (AP). Se AP ≤ 0, ações são bloqueadas.
- Recrutamento requer população disponível (mínimo 10).
- Construção requer ouro e materiais.
- Ataque só pode ser feito contra vizinhos.

---

## 14. Integrações

### Atuais (mantidas)
- **Google Fonts CDN** — carregamento de Cinzel, Libre Baskerville, Inter

### Removidas
- Nenhuma

### Adicionadas
- **Preconnect links** para `fonts.googleapis.com` e `fonts.gstatic.com` (otimização de performance) — adicionar no `<head>` do `index.html`

Nenhuma API externa, banco de dados, autenticação, pagamento ou serviço de back-end está envolvido.

---

## 15. Requisitos não funcionais

### Desempenho
- O mapa SVG com até 40 províncias deve renderizar em < 100ms
- Scroll do HUD deve manter 60fps
- Animações com `motion` não devem causar layout thrashing
- Loading state na geração do mapa com delay mínimo de 400ms (a geração é síncrona e instantânea)
- **Risco:** Cálculo de alcance de marcha (BFS para destaque de províncias alcançáveis) pode causar queda de performance em mapas grandes (>60 províncias). Mitigação: limitar BFS a 3 tiles de profundidade e memoizar resultado enquanto o modo de ação estiver ativo.

### Responsividade
- Layout funcional em: 320px (mobile pequeno), 480px (mobile), 768px (tablet), 1024px (desktop), 1920px (wide)
- HUD funcional em landscape e portrait
- Zoom do mapa operacional em qualquer viewport

### Manutenibilidade
- Zero `!important` no CSS (exceto em utilities legítimas como `.sr-only`)
- Componentes React sem mutação de props
- Estados de UI centralizados no hook `useUI`
- Breakpoints CSS limitados a 3–4 valores, sem regras específicas por modelo de aparelho

### Acessibilidade
- Touch targets ≥ 44px (universal)
- Contraste mínimo de 4.5:1 para texto (WCAG AA) — **meta para labels SVG, não requisito bloqueante**; stroke + fill garantem legibilidade visual
- Suporte a `prefers-reduced-motion` (desabilitar animações se necessário)
- Atributos `aria-label` em botões sem texto visível

### Confiabilidade
- Estados de loading e erro visíveis para o usuário
- Timeout na geração do mapa (5s) — safety net, praticamente impossível de atingir com geração síncrona
- Toast notifications para feedback de ações (já existente, agora documentado e padronizado)
- ErrorBoundary mantido como fallback global

---

## 16. Critérios de aceite gerais

- [ ] O jogo carrega sem erros no console do navegador
- [ ] É possível iniciar uma partida nova com configurações customizadas
- [ ] O HUD pode ser aberto e fechado sem quebrar o layout
- [ ] O mapa ocupa 100% da largura disponível quando o HUD está fechado
- [ ] Nomes das províncias são legíveis no mapa em todos os níveis de zoom
- [ ] Ao ativar "Marchar" ou "Atacar", o cursor muda e a origem fica destacada
- [ ] O modal de instruções pode ser acessado do menu e do HUD
- [ ] Todos os botões têm tamanho mínimo de 44×44px
- [ ] Loading state aparece ao iniciar nova partida por no mínimo 400ms
- [ ] Scrollbars nos modais e HUD estão estilizadas conforme o tema
- [ ] A URL do Google Fonts inclui `display=swap`
- [ ] Preconnect links estão no `<head>` do `index.html`
- [ ] Media queries consolidadas (máximo 4 blocos)
- [ ] Nenhum `!important` de layout ou posicionamento no CSS final
- [ ] Nenhuma lógica de jogo foi alterada, exceto FS-02 (correção de bug do custo de ataque)
- [ ] Toast de erro aparece ao clicar em alvo inválido durante modo de ação
- [ ] Sistema de toast (já existente) funciona com 3 variantes (success, error, info)

---

## 17. Riscos e mitigação

### Riscos técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Remover o zoom fixo quebra o layout do mapa em algumas resoluções | Média | Alto | Testar em 5 resoluções (320, 768, 1024, 1440, 1920) antes de finalizar |
| Labels SVG ainda não renderizam após migrar para atributos | Baixa | Médio | Usar `paint-order="stroke"` para contorno; testar em Chrome, Firefox, Safari |
| HUD recolhível causa overlap com o mapa em mobile | Média | Alto | Usar `position: fixed` com overlay em mobile; testar recolhimento em várias larguras |
| Refatoração das media queries quebra estilos específicos | Média | Médio | Comparar visualmente antes e depois; manter snapshot de referência |
| Remoção de `!important` expõe conflitos de especificidade CSS | Alta | Médio | Usar `@layer` do Tailwind v4 ou `:where()` para controlar especificidade de forma previsível |
| **Cálculo de alcance de marcha (BFS para destaque F-05) causa queda de performance em mapas grandes** | Baixa | Médio | BFS limitado a 3 tiles de profundidade; memoizar resultado enquanto o modo de ação estiver ativo |
| **Labels SVG não atingem WCAG AA 4.5:1 contra cores arbitrárias de reino** | Alta | Baixo | Stroke + fill garantem legibilidade visual; WCAG AA é meta, não requisito bloqueante nesta feature |

### Riscos de produto

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Jogador não encontra o HUD em mobile se ele inicia recolhido | Média | Alto | Mostrar tooltip/indicação na primeira vez que o jogador entra no jogo |
| Mudanças no zoom afetam a sensação de "mapa grande" | Baixa | Baixo | Manter zoom padrão em 1.0 com mapa centralizado |
| Usuário se confunde com a diferença entre "Marchar" e "Atacar" | Alta | Médio | Adicionar tooltip ou descrição textual nos botões |

---

## 18. Métricas de sucesso

1. **Tempo médio para primeira ação:** Um novo jogador consegue selecionar uma província e clicar em "Marchar" ou "Atacar" em menos de 10 segundos.

2. **Taxa de erro de UI:** Navegação completa (menu → jogo → ação → turno → menu) sem erros no console ou quebras visuais.

3. **Responsividade:** A interface não quebra em nenhuma das 5 resoluções-alvo.

4. **Nenhuma regressão de lógica:** Todos os fluxos de jogo existentes continuam funcionando (recrutar, construir, atacar, marchar, turnos, IA, save/load) — incluindo custo de ataque consistente com `ACTION_COSTS.attack`.

5. **Código limpo:** Nenhum `!important` não-justificado no CSS final.

---

## 19. Pontos de decisão

| ID | Decisão | Resolução |
|:--:|---------|:---------:|
| PD-01 | Largura do HUD em desktop | `clamp(280px, 25vw, 420px)` desktop / 320px tablet / 100vw mobile overlay |
| PD-02 | Comportamento do HUD em mobile | Overlay translúcido com slide lateral + backdrop-blur |
| PD-03 | Zoom do mapa — suporte extra | Apenas botões + e - (sem scroll, sem pinch). **Justificativa:** Pinch removido por complexidade técnica de gestos multi-touch no SVG. Será reconsiderado em V2. |
| PD-04 | Nome do botão "Ver Todos os Reinos" | Renomear para "Gerenciar Salvamentos" |
| PD-05 | Banner de modo de ação | Barra fixa no topo do mapa (z-10) |
| PD-06 | Animação do HUD ao recolher | Slide horizontal + fade, 300ms, ease-out |
| PD-07 | Touch targets | 44px universal (sem distinção mobile/desktop). Padrão único e mais seguro. |
| PD-08 | Posição do botão "?" no menu principal | Canto superior direito, ícone circular com `aria-label="Instruções"` |
| PD-09 | Sistema de toast | Extrair para componente `ToastContainer`; padronizar posição (canto inferior centralizado, z-[100]) e variantes (success/error/info) |

---

## 20. Resumo para o agente de implementação

### O que fazer
Reformar a UI do jogo "Reinos Medievais" (React + TypeScript + Vite + Tailwind v4). A lógica do jogo (types, hooks, lógica de combate/economia/IA/turnos) **não deve ser alterada**, **exceto** FS-02 (alinhar `ACTION_COSTS` em `game-constants.ts` com os valores testados e balanceados no código; alinhar IA em `aiLogic.ts` para usar as constantes).

### Arquivos para modificar

| Arquivo | O que fazer |
|---------|-------------|
| `src/App.tsx` | Remover `handleZoom` (efeito de resize); remover scale fixo do `#root`; adicionar banner de ação; extrair toast inline para `ToastContainer`; adicionar botão "?" no menu (canto superior direito) |
| `src/components/HUD.tsx` | Tornar sidebar recolhível; adicionar toggle (canto superior direito desktop/tablet, canto inferior direito mobile); aumentar touch targets (44px); adicionar botão "?" no HUD |
| `src/components/Map.tsx` | Atributos SVG nativos nos textos (remover className Tailwind); adicionar indicador visual de ação (borda pulsante, destaque em vizinhos, cursor crosshair); receber `actionState`/`actionSourceId` como props (já recebe) |
| `src/index.css` | Implementar `.custom-scrollbar`; consolidar media queries (máx 4 blocos); remover `!important` do `.hud-docked` e `.hud-toggle-btn`; remover `@media` específicos por modelo de iPhone |
| `index.html` | Adicionar preconnect links para Google Fonts no `<head>` |
| `src/hooks/useUI.ts` | Adicionar `isGenerating`, `setIsGenerating`, `actionBannerMessage`, `setActionBannerMessage` (toast/showToast já existem — não recriar) |
| `src/hooks/useGameController.ts` | Adicionar loading state no `startNewGame` com delay mínimo de 400ms |
| `src/components/ToastContainer.tsx` | **NOVO** — extrair toast inline de App.tsx para componente reutilizável |
| `src/logic/game-constants.ts` | FS-02: alterar `ACTION_COSTS.move = 1`, `ACTION_COSTS.attack = 2`, `ACTION_COSTS.build = 1` |
| `src/logic/aiLogic.ts` | FS-02: onde faz `realm.actionPoints -= 2` (construção), mudar para `realm.actionPoints -= ACTION_COSTS.build` |

### O que NÃO fazer
- Não alterar `src/types.ts`
- Não alterar `src/logic/` (combatLogic, economyLogic, turnLogic, mapGeneration) — **exceto** `game-constants.ts` e `aiLogic.ts` para FS-02
- Não alterar `src/persistence.ts`
- Não alterar modais que não precisam de scrollbar (CombatSetupModal, BattleOutcomeModal, GameEndModal)
- Não adicionar novos pacotes npm
- Não implementar minimapa, música, hotkeys, composição de tropas, diplomacia, tutorial
- Não adicionar zoom por scroll ou pinch-to-zoom

### Regras críticas
1. O HUD deve ser recolhível, com comportamentos por breakpoint:
   - Desktop (≥1024px): `clamp(280px, 25vw, 420px)` — sidebar, ao fechar mapa expande
   - Tablet (768–1023px): 320px fixo — sidebar, ao fechar mapa expande
   - Mobile (<768px): overlay 100vw com slide lateral + fade 300ms, backdrop-blur — mapa NÃO é redimensionado. Toggle mobile no canto inferior direito, à esquerda dos botões de zoom
2. O zoom afeta APENAS o container do mapa, não a página inteira
3. Labels do SVG usam atributos nativos (`font-size="10"`), não classes Tailwind
4. Banner de ação é **barra fixa no topo do mapa** (z-10) durante "Marchar" ou "Atacar". Botões de fullscreen/toggle ficam em z-20.
5. Cursor vira crosshair no mapa durante modo de ação
6. Zoom apenas por botões + e - (sem scroll, sem pinch)
7. Botões de zoom aumentados para mínimo 44×44px
8. `display=swap` na URL das fontes; preconnect links no `index.html`
9. Nenhum `!important` de layout no CSS final
10. Loading state ao iniciar nova partida com delay mínimo de 400ms
11. Botão "Ver Todos os Reinos" renomeado para **"Gerenciar Salvamentos"**
12. Animação do HUD: slide horizontal + fade, 300ms, ease-out
13. Touch targets: **44px universal** (todos os botões)
14. **FS-02 é alinhamento de constantes** — alterar `ACTION_COSTS` em `game-constants.ts`: `attack: 2`, `move: 1`, `build: 1`. Alinhar IA em `aiLogic.ts` para usar `ACTION_COSTS.build` em vez de valor hardcoded. Isto excepciona a regra #10.
15. Toast notifications já existem em `useUI.ts` e `App.tsx` — extrair para `ToastContainer.tsx`, não recriar o hook

---

## Checklist de qualidade do PRD

| Critério | Status | Observação |
|----------|:------:|------------|
| Escopo claro | ✅ | MVP definido com 12 funcionalidades (10 originais + F-10 toast + FS-02 bugfix) |
| Regras claras | ✅ | 10 regras de negócio documentadas com exceção explícita para FS-02 |
| Critérios de aceite claros | ✅ | Cada funcionalidade tem 3–7 critérios verificáveis |
| Telas definidas | ✅ | Menu, Jogo (mapa + HUD) e 7 modais com nota sobre scrollbars |
| Dados definidos | ✅ | Entidades existentes de `types.ts` + 2 novos estados em useUI |
| Riscos mapeados | ✅ | 6 riscos técnicos (incluindo BFS de marcha + contraste WCAG) + 3 riscos de produto |
| Fora de escopo definido | ✅ | 13 itens explicitamente fora do MVP |
| Contradições resolvidas | ✅ | C-01 (FS-02 como alinhamento de constantes), C-02 (delay 400ms), C-03 (BFS limitado), C-04 (toast documentado) |
| Inconsistências corrigidas | ✅ | Touch targets unificados (44px), z-index do banner, posição toggle mobile, fullscreen documentado |
| Pronto para virar plano de implementação | ✅ | Seção 20 com lista de arquivos, o que fazer e o que não fazer |
| Pontos de decisão listados | ✅ | 9 decisões (PD-01 a PD-09) com justificativas |
| Diferencia MVP de V1 | ✅ | Seções 5 e 6 separam escopo claramente |
