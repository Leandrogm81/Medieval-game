# PRD — Reforma de UI do Reinos Medievais

> **Versão:** 1.1  
> **Autor:** Hermes Agent (via análise de código-fonte)  
> **Status:** Aprovado — pronto para implementação  
> **Classificação:** MVP — Reforma de Interface  
> **Decisões finais:** PD-01 a PD-06 resolvidas nesta versão

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

5. **Scrollbar customizada ausente** — A classe `.custom-scrollbar` é usada em 5 componentes mas nunca foi definida no CSS.

6. **Navegação incompleta** — O modal de instruções existe mas não tem botão para acessá-lo. Não há atalhos de teclado. Ações como recrutamento não permitem escolha de tipo de unidade.

---

## 4. Público-alvo e personas

### Persona 1 — Jogador Casual (Desktop)
- **Nome:** Rafael
- **Perfil:** Joga em notebook 1366×768 ou monitor full HD. Gosta de estratégia mas não quer complexidade excessiva.
- **Necessidades:** UI clara, mapa visível, HUD informativo sem ocupar metade da tela, feedback visual das ações.

### Persona 2 — Jogador Mobile (Tablet/Celular)
- **Nome:** Camila
- **Perfil:** Joga no celular em transporte público. Tela de 390×844 a 430×932.
- **Necessidades:** HUD recolhível, touch targets de no mínimo 44px, modo paisagem funcional, zoom com pinch.

### Persona 3 — Desenvolvedor do jogo
- **Nome:** Leandro (o usuário real)
- **Perfil:** Criou o jogo e quer iterar. Precisa de código limpo, sem `!important`, com componentes modulares e estilos previsíveis.
- **Necessidades:** CSS sem hacks, componentes reutilizáveis, breakpoints claros, sem regras conflitantes.

---

## 5. Escopo do MVP

O MVP cobre exclusivamente a reforma da camada de apresentação. **Nenhuma lógica de jogo será alterada.**

1. Sistema de layout responsivo com HUD recolhível (sidebar)
2. Substituição do zoom fixo de 1440px por zoom nativo (CSS transforms controlados por estado)
3. Correção dos labels SVG (Tailwind → atributos SVG nativos)
4. Implementação da classe `.custom-scrollbar` no CSS
5. Indicador visual de modo de ação no mapa (cursor, bordas, destaque)
6. Botão de instruções acessível no menu principal e no HUD
7. Aumento de touch targets para mínimo 44px em todos os botões de ação
8. Mini indicador de estado de ação na região do HUD (ex: "Modo Ataque: clique em um alvo adjacente")
9. Loading state na geração do mapa
10. Refatoração do CSS: remover `!important`, consolidar media queries repetitivas, adicionar `display=swap` nas fontes

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
- Alteração na lógica de jogo (combate, economia, IA, turnos)
- Responsividade do modal de combate (será tratado em V1)
- PWA ou service workers

---

## 7. Funcionalidades principais

### F-01: Layout responsivo com HUD recolhível

**Objetivo:** Substituir o HUD fixo por uma sidebar que pode ser recolhida pelo jogador, adaptando-se ao tamanho da tela.

**Comportamento esperado:**
- Em desktop (≥1024px): HUD aparece como sidebar à direita, com largura `clamp(280px, 25vw, 420px)`. Botão de toggle visível no canto superior direito do mapa.
- Em tablet (768px–1023px): HUD inicia aberto mas pode ser recolhido. Largura fixa de **320px**. Quando recolhido, mostra apenas um ícone na borda direita.
- Em celular (<768px): HUD inicia recolhido. Ao abrir, funciona como **overlay translúcido** com slide lateral da direita (300ms, ease-out), ocupando **100vw** com fundo `bg-black/60 backdrop-blur-sm`. O mapa permanece visível atrás do overlay. Toggle button flutuante visível no canto inferior direito.

**Regras:**
- O HUD nunca deve ocupar mais de 50% da largura total em desktop.
- Ao recolher o HUD em desktop/tablet, o mapa expande para ocupar o espaço liberado.
- Em mobile, o HUD em overlay não afeta o tamanho ou posição do mapa.
- A animação de abrir/fechar é **slide horizontal + fade**, 300ms, com easing `ease-out`.
- O estado do HUD (aberto/recolhido) persiste apenas na sessão (não precisa de save).
- Remover completamente o `!important` do `.hud-docked` e `.hud-toggle-btn`.

**Critérios de aceite:**
- [ ] Botão de toggle do HUD está SEMPRE visível em telas < 1024px
- [ ] Em desktop ≥ 1024px, toggle aparece mas o HUD abre/fecha sem quebrar layout
- [ ] HUD recolhido mostra indicador minimalista (ícone ou borda fina) para reabrir
- [ ] Ao recolher, mapa ocupa 100% da área disponível
- [ ] Nenhum `!important` de posicionamento permanece no CSS do HUD

### F-02: Sistema de zoom nativo (não mais escala fixa)

**Objetivo:** Substituir o `handleZoom` que escala o `#root` inteiro para 1440px por um sistema de zoom controlado por estado React, aplicado apenas ao container do mapa via CSS transform.

**Comportamento esperado:**
- O mapa SVG tem viewBox fixo (1280×720) mas o container CSS escala via `transform: scale(zoom)` com `transformOrigin: center center`.
- O zoom mínimo é 0.5, máximo 3.0, incremento de 0.2.
- A página não escala o `#root` inteiro — apenas a área do mapa.
- O layout da página (HUD + mapa lado a lado) usa flexbox normal sem scale mágico.
- Remover o event listener de resize que força o zoom. O layout deve ser responsivo por CSS puro.

**Regras:**
- O zoom não deve afetar o HUD, botões ou modais — apenas o conteúdo do mapa.
- Zoom de 1.0 deve mostrar o mapa inteiro (1280×720) centralizado no container.
- O pan (arrastar) continua funcionando como antes, mas agora relativo ao container do mapa, não à página inteira.
- **Scroll do mouse não controla zoom** — apenas os botões + e - da UI.
- Apenas zoom via botões: sem scroll wheel, sem pinch-to-zoom, sem gestos multi-touch.

**Critérios de aceite:**
- [ ] `handleZoom` do App.tsx removido e substituído por zoom baseado em estado
- [ ] `#root` não tem mais `transform: scale()` nem `width: 1440px`
- [ ] Mapa ocupa corretamente o espaço entre a borda esquerda e o HUD
- [ ] Zoom + e - funcionam no mapa sem afetar outros elementos
- [ ] Em navegador redimensionado, layout se ajusta sem distorcer
- [ ] Pan (arrastar) funciona proporcional ao zoom atual

### F-03: Labels SVG com atributos nativos

**Objetivo:** Fazer os nomes das províncias renderizarem corretamente substituindo classes Tailwind por atributos SVG.

**Comportamento esperado:**
- Os elementos `<text>` no mapa usam `font-size="10"`, `font-weight="bold"`, `font-family="serif"`, `fill="rgba(255,255,255,0.8)"` em vez de `className="text-[10px] fill-white/80 font-serif"`.
- Adicionar `paint-order="stroke"` e `stroke="rgba(0,0,0,0.5)" stroke-width="2"` para legibilidade sobre polígonos coloridos.

**Critérios de aceite:**
- [ ] Nomes das províncias visíveis no centro de cada polígono
- [ ] Texto legível com contraste contra qualquer cor de preenchimento
- [ ] Nenhum texto aparece no tamanho errado ou com fallback de fonte incorreto
- [ ] Código não usa mais `className` com utilities de texto em elementos `<text>` SVG

### F-04: Implementar `.custom-scrollbar` no CSS

**Objetivo:** Criar a definição CSS da classe `.custom-scrollbar` que é referenciada em 5 componentes mas nunca foi implementada.

**Comportamento esperado:**
- `.custom-scrollbar` estiliza a scrollbar com: largura 6px (desktop) / 4px (mobile), track escuro (slate-900), thumb slate-700 com borda arredondada.
- Deve funcionar em WebKit (Chrome, Safari, Edge) e ter fallback para Firefox (`scrollbar-width: thin`).
- Aplicar em todos os componentes que já usam a classe: HUD, ChronicleModal, TurnResultModal, SaveGameModal, GameInstructionsModal.

**Critérios de aceite:**
- [ ] Classe `.custom-scrollbar` definida no `index.css`
- [ ] Scrollbars estilizadas aparecem nos 5 componentes
- [ ] Funciona em Chrome e Firefox
- [ ] Não quebra a scrollbar nativa em outros navegadores (graceful degradation)

### F-05: Indicador visual de modo de ação

**Objetivo:** Quando o jogador ativa "Marchar" ou "Atacar", o mapa deve mostrar claramente que está em modo de ação.

**Comportamento esperado:**
- Ao clicar "Marchar" ou "Atacar" no HUD:
  - A província origem recebe uma borda pulsante (animação `pulse-slow` existente)
  - O cursor do mapa muda para `crosshair`
  - Províncias adjacentes (ataque) ou alcançáveis (marcha) recebem um leve destaque (opacidade ou brilho)
  - Um **banner fixo no topo do mapa** (barra horizontal semi-transparente) com instrução textual: "Selecione o alvo para [ação]"
- Ao clicar em província não-válida, mostra toast de erro
- Ao cancelar (botão "Cancelar" ou tecla futuramente), tudo volta ao normal

**Regras:**
- Usar estado global `actionState` e `actionSourceId` já existentes no hook `useUI`
- O indicador visual é responsabilidade do componente `Map` (receber como props)
- Não alterar a lógica de clique (`handleProvinceClick`)

**Critérios de aceite:**
- [ ] Borda pulsante aparece na província de origem quando em modo de ação
- [ ] Cursor muda para `crosshair` em toda a área do mapa
- [ ] Províncias alvo válidas têm destaque visual (stroke mais claro ou glow)
- [ ] Banner de instrução aparece no topo do mapa
- [ ] Ao cancelar, todos os indicadores somem e cursor volta ao normal

### F-06: Botão de instruções acessível

**Objetivo:** Garantir que o jogador consiga acessar as instruções do jogo.

**Comportamento esperado:**
- Adicionar botão "?" ou "Instruções" no menu principal (ao lado do título ou como terceiro painel)
- Adicionar botão "?" no HUD, na barra superior ao lado dos botões "Salvar" e "Menu"
- Ambos abrem o `GameInstructionsModal` já existente

**Critérios de aceite:**
- [ ] Botão de instruções visível no menu principal
- [ ] Botão de instruções visível no HUD em todas as views
- [ ] Modal de instruções abre e fecha corretamente

### F-07: Touch targets mínimos

**Objetivo:** Garantir que todos os botões de ação tenham tamanho mínimo para toque.

**Comportamento esperado:**
- Todos os botões no HUD, modais e menu principal têm `min-height: 44px` e `min-width: 44px` (mobile) ou 36px (desktop).
- Botões de zoom do mapa: aumentados para no mínimo 44×44px.
- Remover classes `w-5 h-5` e `w-6 h-6` dos botões de zoom.

**Critérios de aceite:**
- [ ] Botões de zoom (+/-) no mapa têm no mínimo 44×44px em mobile, 40×40px em desktop
- [ ] Botões "Marchar", "Atacar", "Recrutar" têm altura mínima de 44px
- [ ] Nenhum botão de ação tem área clicável menor que 36×36px

### F-08: Loading state na geração do mapa

**Objetivo:** Mostrar feedback visual enquanto o mapa está sendo gerado.

**Comportamento esperado:**
- Quando o jogador clica "INICIAR JORNADA", um estado de loading é ativado
- Um spinner ou mensagem "Gerando reinos…" aparece no lugar do menu
- Quando `generateInitialState` completa e o estado é atualizado, o loading some e o jogo inicia
- Timeout: se a geração demorar mais de 5 segundos, mostrar mensagem de erro

**Regras:**
- O estado de loading é gerenciado no `useUI` hook (adicionar `isGenerating` e `setIsGenerating`)
- O `startNewGame` no controller seta loading=true antes de chamar `generateInitialState`
- Não alterar `generateInitialState` — é síncrono, o loading é apenas UX

**Critérios de aceite:**
- [ ] Ao clicar "INICIAR JORNADA", o menu some e aparece indicador de carregamento
- [ ] Quando o jogo carrega, o loading some e o mapa+HUD aparecem
- [ ] Se houver erro (timeout), mensagem visível com opção de voltar ao menu

### F-09: Refatoração do CSS

**Objetivo:** Limpeza e organização do `index.css` para manutenibilidade.

**Comportamento esperado:**
- Remover blocos `@media` específicos por modelo de iPhone (SE, 11-13, etc.) e substituir por 2–3 breakpoints genéricos: <480px (mobile pequeno), 480–768px (mobile grande/tablet), >768px (desktop).
- Adicionar `&display=swap` na URL de importação do Google Fonts.
- Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">` e `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` no `index.html`.
- Remover blocos CSS comentados ou não utilizados (ex: `.portrait-blocker`).
- Garantir que a classe `.no-scrollbar` e `::-webkit-scrollbar` coexistam sem conflito.

**Critérios de aceite:**
- [ ] Número de blocos `@media` reduzido de ~10 para no máximo 4
- [ ] `display=swap` presente na URL do Google Fonts
- [ ] Preconnect links adicionados ao `<head>` no index.html
- [ ] Código CSS não tem mais comentários de código desativado
- [ ] Layout não quebra em nenhum breakpoint após a refatoração

---

## 8. Funcionalidades secundárias

### FS-01: Remover import duplicado do Vite no package.json

`vite` aparece tanto em `dependencies` quanto em `devDependencies`. Manter apenas em `devDependencies`.

### FS-02: Correção do custo de ataque

O código debita 2 AP do jogador no ataque (`actionPoints -= 2`) mas `ACTION_COSTS.attack = 4`. Alinhar para usar `ACTION_COSTS.attack`.

### FS-03: Renomear botão "Ver Todos os Reinos"

Foi decidido: renomear para **"Gerenciar Salvamentos"** no menu principal, já que é isso que o botão faz (abre o modal de save/load).

---

## 9. Fluxos de usuário

### Fluxo principal: Iniciar partida

1. Jogador abre o jogo → vê menu principal com logo "Reinos Medievais", painel "Novo Reinado" e painel "Retomar Partida"
2. Ajusta extensão do mundo (slider 15–40) e número de reinos (4/6/8)
3. Clica "INICIAR JORNADA"
4. Aparece loading state ("Gerando reinos…")
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
3. **Banner fixo no topo do mapa:** "Modo Ataque — clique em uma província adjacente"
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

1. Jogador clica "?" no menu principal ou no HUD
2. Modal "Guia de Conquista" abre com regras do jogo
3. Jogador lê e fecha clicando no X ou fora do modal

---

## 10. Telas e componentes

### Tela 1 — Menu Principal
- Background: `splash_bg.png` com overlay escuro
- Logo animada (mix-blend-mode: screen)
- Título "Reinos Medievais" com gradiente dourado
- Painel "Novo Reinado":
  - Slider de extensão do mundo (15–40)
  - Seletor de número de reinos (4, 6, 8)
  - Botão "INICIAR JORNADA"
- Painel "Retomar Partida":
  - Lista de saves (até 3) com progresso circular
  - Botão "Gerenciar Salvamentos" (abre SaveGameModal)
- Botão "?" (Instruções)
- SaveGameModal (overlay)
- GameInstructionsModal (overlay)

### Tela 2 — Jogo (Mapa + HUD)
- **Container principal:** flex row, mapa à esquerda, HUD à direita (recolhível)
- **Área do mapa:**
  - SVG com viewBox 1280×720, escalado via CSS transform
  - Polígonos de províncias com cor do dono
  - Labels com nome das províncias (SVG text com atributos nativos)
  - Botões de zoom (+ e -) no canto inferior direito (≥ 44×44px)
  - Botão de fullscreen no canto superior esquerdo
  - **Banner fixo de modo de ação** (topo, centralizado, semi-transparente)
  - Toggle do HUD (canto superior direito, visível em todos os tamanhos)
- **HUD (sidebar direita, recolhível):**
  - Desktop: `clamp(280px, 25vw, 420px)` — ao recolher, mapa expande
  - Tablet: 320px fixo — ao recolher, mapa expande
  - Mobile: overlay 100vw com slide lateral + fade 300ms + backdrop-blur
  - Grid de recursos: Tesouro, Grãos, Materiais, Ação (com barra de progresso)
  - Área de detalhes: mostra info da província selecionada ou placeholder
  - Ações militares: Marchar, Atacar (se província própria)
  - Administração: Recrutar, Construir (Fazendas, Minas, Oficinas, Corte)
  - Modos de visão: Político, Econômico, Crônicas
  - Botão "Encerrar Turno" (grande, dourado)

### Modais (overlays)
- **ChronicleModal:** Lista de logs do jogo com scroll estilizado
- **TurnResultModal:** Resumo econômico + eventos do turno
- **CombatSetupModal:** Forças atacante vs defensor, chance de vitória
- **BattleOutcomeModal:** Resultado da batalha, perdas, texto narrativo
- **SaveGameModal:** Criar/carregar/deletar saves
- **GameInstructionsModal:** Guia de regras
- **GameEndModal:** Tela de fim de jogo com vencedor

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
- `isGenerating: boolean` — controle de loading
- `actionBannerMessage: string | null` — texto do banner de ação

---

## 12. Regras de negócio

1. **HUD recolhível:** O HUD deve poder ser alternado entre aberto e fechado. O estado padrão depende do viewport: desktop ≥ 1024px → aberto; mobile < 768px → fechado; tablet entre 768–1023px → aberto, mas recolhível.

2. **Zoom do mapa:** O zoom é aplicado apenas ao container do mapa via CSS `transform: scale()`. Não afeta HUD, botões, modais ou qualquer outro elemento.

3. **Pan do mapa:** O arraste do mapa funciona proporcional ao zoom atual. Em zoom 2.0, o movimento do mouse é dividido por 2 para sensibilidade consistente.

4. **Modo de ação:** Apenas um modo de ação pode estar ativo por vez. Ativar "Marchar" desativa "Atacar" e vice-versa. Cancelar uma ação retorna ao estado `idle`.

5. **Alvos válidos (ataque):** Apenas províncias adjacentes (`neighbors.includes(id)`) podem ser alvo de ataque. A província alvo não pode ser do próprio jogador.

6. **Alvos válidos (marcha):** A marcha usa pathfinding (`findPath`) para encontrar rota. O destino pode ser qualquer província não-inimiga acessível.

7. **Tamanho mínimo de toque:** Todos os elementos interativos (botões, inputs) devem ter no mínimo 44×44px em dispositivos touch (detectado via `pointer: coarse`).

8. **Fontes:** Google Fonts carregadas com `display=swap` e preconnect links para evitar layout shift.

9. **Scrollbar customizada:** A classe `.custom-scrollbar` deve ser auto-contida e funcionar sem conflito com scrollbars nativas.

10. **Nenhuma alteração na lógica de jogo:** As regras de combate, economia, IA, geração de mapas e turnos não devem ser modificadas.

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
- **Preconnect links** para `fonts.googleapis.com` e `fonts.gstatic.com` (otimização de performance)

Nenhuma API externa, banco de dados, autenticação, pagamento ou serviço de back-end está envolvido.

---

## 15. Requisitos não funcionais

### Desempenho
- O mapa SVG com até 40 províncias deve renderizar em < 100ms
- Scroll do HUD deve manter 60fps
- Animações com `motion` não devem causar layout thrashing
- Loading state na geração do mapa deve ser instantâneo (a geração é síncrona, JS puro)

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
- Touch targets ≥ 44px em dispositivos touch
- Contraste mínimo de 4.5:1 para texto (WCAG AA)
- Suporte a `prefers-reduced-motion` (desabilitar animações se necessário)
- Atributos `aria-label` em botões sem texto visível

### Confiabilidade
- Estados de loading e erro visíveis para o usuário
- Timeout na geração do mapa (5s)
- Toast notifications para feedback de ações
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
- [ ] Todos os botões têm tamanho mínimo adequado para toque
- [ ] Loading state aparece ao iniciar nova partida
- [ ] Scrollbars nos modais e HUD estão estilizadas conforme o tema
- [ ] A URL do Google Fonts inclui `display=swap`
- [ ] Preconnect links estão no `<head>` do `index.html`
- [ ] Media queries consolidadas (máximo 4 blocos)
- [ ] Nenhum `!important` de layout ou posicionamento no CSS final
- [ ] Nenhuma lógica de jogo foi alterada

---

## 17. Riscos e mitigação

### Riscos técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Remover o zoom fixo quebra o layout do mapa em algumas resoluções | Média | Alto | Testar em 5 resoluções (320, 768, 1024, 1440, 1920) antes de finalizar |
| Labels SVG ainda não renderizam após migrar para atributos | Baixa | Médio | Usar `paint-order="stroke"` para contorno; testar em Chrome, Firefox, Safari |
| HUD recolhível causa overlap com o mapa em mobile | Média | Alto | Usar `position: fixed` com overlay em mobile; testar recolhimento em várias larguras |
| Refatoração das media queries quebra estilos específicos | Média | Médio | Manter as regras originais comentadas como fallback durante a transição; comparar visualmente antes e depois |
| Remoção de `!important` expõe conflitos de especificidade CSS | Alta | Médio | Usar `@layer` do Tailwind v4 ou `:where()` para controlar especificidade de forma previsível |

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

4. **Nenhuma regressão de lógica:** Todos os fluxos de jogo existentes continuam funcionando (recrutar, construir, atacar, marchar, turnos, IA, save/load).

5. **Código limpo:** Nenhum `!important` não-justificado no CSS final.

---

## 19. Pontos de decisão resolvidos

| ID | Decisão | Resolução |
|:--:|---------|:---------:|
| PD-01 | Largura do HUD em desktop | `clamp(280px, 25vw, 420px)` desktop / 320px tablet / 100vw mobile overlay |
| PD-02 | Comportamento do HUD em mobile | Overlay translúcido com slide lateral + backdrop-blur |
| PD-03 | Zoom do mapa — suporte extra | Apenas botões + e - (sem scroll, sem pinch) |
| PD-04 | Nome do botão "Ver Todos os Reinos" | Renomear para "Gerenciar Salvamentos" |
| PD-05 | Banner de modo de ação | Barra fixa no topo do mapa |
| PD-06 | Animação do HUD ao recolher | Slide horizontal + fade, 300ms, ease-out |

---

## 20. Resumo para o agente de implementação

### O que fazer
Reformar a UI do jogo "Reinos Medievais" (React + TypeScript + Vite + Tailwind v4). A lógica do jogo (types, hooks, lógica de combate/economia/IA/turnos) **não deve ser alterada**.

### Arquivos para modificar

| Arquivo | O que fazer |
|---------|-------------|
| `src/App.tsx` | Remover `handleZoom` (efeito de resize); remover scale fixo do `#root`; adicionar banner de ação |
| `src/components/HUD.tsx` | Tornar sidebar recolhível; adicionar toggle; aumentar touch targets; adicionar botão "?" |
| `src/components/Map.tsx` | Atributos SVG nativos nos textos; adicionar indicador visual de ação (borda pulsante, destaque em vizinhos, cursor crosshair) |
| `src/index.css` | Implementar `.custom-scrollbar`; consolidar media queries; remover `!important` do `.hud-docked` e `.hud-toggle-btn` |
| `index.html` | Adicionar preconnect links para Google Fonts |
| `src/hooks/useUI.ts` | Adicionar `isGenerating`, `setIsGenerating`, `actionBannerMessage`, `setActionBannerMessage` |
| `src/hooks/useGameController.ts` | Adicionar loading state no `startNewGame` |

### O que NÃO fazer
- Não alterar `src/types.ts`
- Não alterar `src/logic/` (combatLogic, economyLogic, turnLogic, aiLogic, mapGeneration, game-constants)
- Não alterar `src/persistence.ts`
- Não alterar modais (exceto se precisarem de scrollbar estilizada — já devem ter)
- Não adicionar novos pacotes npm
- Não implementar minimapa, música, hotkeys, composição de tropas, diplomacia, tutorial

### Regras críticas
1. O HUD deve ser recolhível, com comportamentos por breakpoint:
   - Desktop (≥1024px): `clamp(280px, 25vw, 420px)` — sidebar, ao fechar mapa expande
   - Tablet (768–1023px): 320px fixo — sidebar, ao fechar mapa expande
   - Mobile (<768px): overlay 100vw com slide lateral + fade 300ms, backdrop-blur — mapa NÃO é redimensionado
2. O zoom afeta APENAS o container do mapa, não a página inteira
3. Labels do SVG usam atributos nativos (font-size="10"), não classes Tailwind
4. Banner de ação é **barra fixa no topo do mapa** durante "Marchar" ou "Atacar"
5. Cursor vira crosshair no mapa durante modo de ação
6. Zoom apenas por botões + e - (sem scroll, sem pinch)
7. Botões de zoom aumentados para mínimo 44×44px em mobile
8. `display=swap` na URL das fontes; preconnect links no index.html
9. Nenhum `!important` de layout no CSS final
10. Loading state ao iniciar nova partida
11. Botão "Ver Todos os Reinos" renomeado para **"Gerenciar Salvamentos"**
12. Animação do HUD: slide horizontal + fade, 300ms, ease-out

---

## Checklist de qualidade do PRD

| Critério | Status | Observação |
|----------|:------:|------------|
| Escopo claro | ✅ | MVP definido com 10 funcionalidades |
| Regras claras | ✅ | 10 regras de negócio documentadas |
| Critérios de aceite claros | ✅ | Cada funcionalidade tem 3–7 critérios verificáveis |
| Telas definidas | ✅ | Menu, Jogo (mapa + HUD) e 7 modais |
| Dados definidos | ✅ | Entidades existentes de `types.ts` + 2 novos estados em useUI |
| Riscos mapeados | ✅ | 5 riscos técnicos + 3 riscos de produto com mitigação |
| Fora de escopo definido | ✅ | 12 itens explicitamente fora do MVP |
| Pronto para virar plano de implementação | ✅ | Seção 20 com lista de arquivos, o que fazer e o que não fazer |
| Pontos de decisão listados | ✅ | 6 decisões pendentes com alternativas |
| Diferencia MVP de V1 | ✅ | Seções 5 e 6 separam escopo claramente |
