# Plano de Implementação — Reforma de UI do Reinos Medievais

**PRD:** PRD-UI-OVERHAUL-v2.md
**Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind v4, Motion (Framer), Lucide React
**Repositório:** `/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game`

---

## 1. Premissas

1. O Tailwind v4 está configurado via `@tailwindcss/vite` (plugin de build), sem `tailwind.config` — as media queries customizadas estão no `index.css` via `@theme` e `@media` tradicionais.
2. O estado `isHudOpen` já existe no hook `useUI` (linha 35 de `useUI.ts`), mas o CSS força o HUD sempre aberto via `!important` nas classes `.hud-docked` e `.hud-toggle-btn`.
3. O estado `zoom` e `panOffset` já existem no `useUI`, e o `motion.div` em `App.tsx` já aplica `scale` e `x`/`y` — a base do zoom nativo já está parcialmente implementada. Falta apenas remover o `handleZoom` que escala `#root` e mover os botões de zoom para o container do mapa.
4. O componente `Map` já recebe `actionState` e `actionSourceId` como props — a estrutura para indicadores visuais de ação já está pronta para receber a lógica.
5. O sistema de toast já existe em `useUI.ts` com estado `toast` e função `showToast`, renderizado inline em `App.tsx` com `AnimatePresence`. Extrair para componente dedicado é refatoração, não criação do zero.
6. Os arquivos de lógica (combatLogic, economyLogic, turnLogic, mapGeneration) são intocados — exceto `game-constants.ts` e `aiLogic.ts` para o FS-02.
7. O PRD cobre **exclusivamente** a camada de apresentação. Nenhuma mecânica de jogo é alterada, com a exceção documentada do FS-02.
8. O projeto não tem testes automatizados. O comando `lint` no `package.json` é `tsc --noEmit`. Validação será visual e por typecheck.
9. As constantes `ACTION_COSTS` em `game-constants.ts` estão desalinhadas: o código testado debita ataque=2, marcha=1, construção=1, mas as constantes dizem 4, 2, 2 respectivamente.

---

## 2. Visão geral das sprints

| Sprint | Nome | Funcionalidades | Arquivos |
|--------|------|-----------------|----------|
| 0 | Preparação e leitura | Inspeção completa da codebase | Todos os `src/**` |
| 1 | Fundação: CSS + constantes | FS-01 (vite duplicado), FS-02 (ACTION_COSTS), F-09 (refatoração CSS), F-04 (.custom-scrollbar) | `package.json`, `game-constants.ts`, `aiLogic.ts`, `index.css`, `index.html` |
| 2 | Zoom nativo | F-02 (zoom por estado, remover handleZoom) | `App.tsx` |
| 3 | HUD recolhível | F-01 (sidebar responsiva com 3 breakpoints) | `App.tsx`, `HUD.tsx`, `index.css` |
| 4 | Labels SVG + indicador de ação | F-03 (atributos SVG nativos), F-05 (cursor, borda pulsante, destaque, banner) | `Map.tsx`, `App.tsx` |
| 5 | Touch targets + loading state | F-07 (44px universal), F-08 (spinner ao gerar mapa) | `App.tsx`, `HUD.tsx`, `useUI.ts`, `useGameController.ts` |
| 6 | Instruções + rename + toast | F-06 (botão "?" no menu e HUD), FS-03 (renomear botão), F-10 (extrair ToastContainer) | `App.tsx`, `HUD.tsx`, `ToastContainer.tsx` (novo) |
| 7 | Ajustes finos e validação | Verificação visual, typecheck, responsividade, regressão | Todos os alterados |

---

## 3. Sprint 0 — Preparação e leitura do projeto

**Objetivo:** Garantir que o agente de implementação entenda a estrutura real do código antes de tocar em qualquer arquivo.

### Arquivos a inspecionar (nesta ordem)

| # | Arquivo | O que verificar |
|---|---------|----------------|
| 1 | `package.json` | Duplicação do `vite` (linhas 25 e 36); ausência de testes |
| 2 | `index.html` | Ausência de `preconnect`; viewport meta já existe |
| 3 | `src/types.ts` | Confirmar que entidades NÃO serão alteradas |
| 4 | `src/index.css` | 8+ blocos `@media`; `!important` nas linhas 283-298; falta `.custom-scrollbar`; `display=swap` já existe na linha 1 |
| 5 | `src/hooks/useUI.ts` | Estados existentes: `isHudOpen`, `zoom`, `actionState`, `actionSourceId`, `toast`, `showToast`; faltam: `isGenerating`, `actionBannerMessage` |
| 6 | `src/hooks/useGameController.ts` | `startNewGame` é síncrono (linha 13-18); `handleZoom` NÃO está aqui — está no `App.tsx` |
| 7 | `src/App.tsx` | `handleZoom` nas linhas 57-86; toast inline nas linhas 523-538; botão "Ver Todos os Reinos" na linha 305; zoom buttons nas linhas 404-406 (tamanho errado) |
| 8 | `src/components/HUD.tsx` | `className="custom-scrollbar"` na linha 168; `hud-docked` na linha 105; ações militares em 202-218; ausência de botão "?" |
| 9 | `src/components/Map.tsx` | Labels com `className` Tailwind na linha 82; props `actionState` e `actionSourceId` já recebidas |
| 10 | `src/logic/game-constants.ts` | `ACTION_COSTS`: move=2, attack=4, build=2 (ERRADOS — devem ser 1, 2, 1) |
| 11 | `src/logic/aiLogic.ts` | Linha 22: `realm.actionPoints -= 2` hardcoded com comentário "Assuming build cost is 2" |

### Dependências a verificar

```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
node --version       # Deve ser >= 18
npm --version
npm ls vite          # Confirmar duplicação
npm ls tailwindcss   # Deve ser ^4.x
npm ls motion        # Deve ser ^12.x (motion/react, NÃO framer-motion)
```

### Comandos iniciais

```bash
npm install          # Garantir deps instaladas
npm run lint         # Typecheck inicial — anotar erros existentes
npm run build        # Build limpo de referência
```

### Riscos

- O projeto pode ter erros de typecheck pré-existentes não relacionados a UI — anotar e não corrigir agora.
- O build pode falhar por problemas de ambiente (Node, path encoding no Windows/WSL).

---

## 4. Sprint 1 — Fundação: CSS + Constantes

**Objetivo:** Corrigir as constantes do jogo (FS-02), limpar o `package.json` (FS-01), refatorar o CSS base (F-09) e implementar `.custom-scrollbar` (F-04). Essa sprint é pré-requisito para todas as demais.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `package.json` |
| Editar | `src/logic/game-constants.ts` |
| Editar | `src/logic/aiLogic.ts` |
| Editar | `src/index.css` |
| Editar | `index.html` |

### Tarefas (em ordem)

**T1.1 — FS-01: Remover vite duplicado do package.json**
- Remover `"vite": "^6.2.0"` da seção `dependencies` (linha 25). Manter apenas em `devDependencies`.
- Critério de aceite: `npm ls vite` mostra vite apenas como devDependency.

**T1.2 — FS-02: Corrigir ACTION_COSTS em game-constants.ts**
- Alterar: `move: 2` → `move: 1`
- Alterar: `attack: 4` → `attack: 2`
- Alterar: `build: 2` → `build: 1`
- Não alterar `recruit` (já é 1, correto) nem `diplomacy`.
- Critério de aceite: constantes refletem os valores testados (1, 1, 2, 1).

**T1.3 — FS-02: Alinhar IA em aiLogic.ts**
- Linha 22: substituir `realm.actionPoints -= 2; // Assuming build cost is 2` por `realm.actionPoints -= ACTION_COSTS.build;`
- Adicionar `import { ACTION_COSTS } from './game-constants';` no topo se ainda não existir.
- Critério de aceite: IA usa a constante, não valor hardcoded. Typecheck passa.

**T1.4 — F-09: Consolidar media queries no index.css**
- Remover blocos específicos por modelo de iPhone: linhas 141-154 (`max-width: 414px`), 157-177 (`max-width: 414px and max-height: 896px`), 180-200 (`max-width: 375px and max-height: 812px`), 203-214 (`min-width: 390px and max-width: 414px and min-height: 844px`), 217-237 (`max-height: 500px and orientation: landscape`).
- Manter: `@media (max-width: 768px)` para scrollbar (linha 123-127), `@media (max-width: 640px)` (linha 130-138, útil para parchment/mobile), `@media (pointer: coarse)` (linha 240-260, útil para touch targets).
- Adicionar breakpoint genérico para mobile pequeno se necessário: `@media (max-width: 480px)` com regras mínimas (tamanho de fonte base).
- Resultado: máximo 4 blocos `@media` (768px, 640px, 480px, pointer:coarse).
- Critério de aceite: layout não quebra em 5 resoluções de teste.

**T1.5 — F-09: Remover CSS comentado/morto**
- Remover o bloco `.portrait-blocker` (linhas 282-284) — está com `display: none !important`, é código morto.
- Critério de aceite: `grep -r "portrait-blocker" src/` não retorna uso vivo.

**T1.6 — F-04: Implementar .custom-scrollbar no index.css**
- Adicionar antes da seção `::-webkit-scrollbar` existente (linha 83):

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: var(--slate-900);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--slate-700);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--slate-600);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--slate-700) var(--slate-900);
}
@media (max-width: 768px) {
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
}
```

- Critério de aceite: scrollbar estilizada visível nos 5 componentes que referenciam a classe (HUD, ChronicleModal, TurnResultModal, SaveGameModal, GameInstructionsModal).

**T1.7 — F-09: Adicionar preconnect no index.html**
- Adicionar dentro do `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

- Critério de aceite: Lighthouse/DevTools mostra preconnect ativo.

### Critérios de aceite da sprint

- [ ] `npm run lint` passa sem novos erros
- [ ] `npm run build` completa sem erros
- [ ] `ACTION_COSTS` reflete valores balanceados (move=1, attack=2, build=1)
- [ ] `aiLogic.ts` usa `ACTION_COSTS.build`, sem hardcode
- [ ] `index.css` tem no máximo 4 blocos `@media`
- [ ] `.portrait-blocker` removido do CSS
- [ ] `.custom-scrollbar` definida e funcional
- [ ] `index.html` tem preconnect links
- [ ] `vite` não está duplicado no `package.json`

### Comandos de validação

```bash
npm run lint                    # Typecheck — sem novos erros
npm run build                   # Build — sem erros
grep -c "@media" src/index.css  # Deve ser <= 4 (após refatoração)
grep "ACTION_COSTS" src/logic/aiLogic.ts  # Deve mostrar import + uso
```

### Riscos

- A remoção de media queries específicas de iPhone pode expor regressões visuais em telas pequenas. Mitigação: testar visualmente em 375px (iPhone SE) após refatoração.
- Conflito entre `.custom-scrollbar` e a scrollbar global `::-webkit-scrollbar` se houver elementos com ambas. Mitigação: `.custom-scrollbar` é explícita; a global afeta o body/html apenas.

### O que NÃO deve ser alterado

- Não remover `display=swap` da URL do Google Fonts (linha 1 do index.css).
- Não alterar as variáveis CSS `:root` (linhas 13-30).
- Não alterar animações (`glow-pulse`, `pulse-slow`).
- Não alterar `.no-scrollbar`.
- Não alterar `recruit` e `diplomacy` em `ACTION_COSTS`.

---

## 5. Sprint 2 — Zoom nativo

**Objetivo:** Remover o `handleZoom` que escala `#root` para 1440px e garantir que o zoom do mapa funcione apenas via estado React no container do mapa.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/App.tsx` |

### Tarefas (em ordem)

**T2.1 — Remover o useEffect do handleZoom**
- Remover completamente o `useEffect` das linhas 45-86 de `App.tsx`. Isso inclui:
  - A função `handleZoom` (linhas 57-75)
  - Os event listeners de `resize` e `orientationchange` (linhas 77-78)
  - A chamada inicial `handleZoom()` (linha 79)
  - O cleanup (linhas 81-85)
- Manter apenas o `useEffect` dos visual effects (timer de limpeza dos `visualEffects`).
- Critério de aceite: `#root` não recebe mais `transform: scale()`, `width: 1440px`, nem `position: fixed` inline.

**T2.2 — Verificar que o zoom por estado já funciona**
- O `motion.div` na linha 360-368 já aplica `scale: ui.zoom` e `x`/`y`. Confirmar que com a remoção do `handleZoom`, a escala do `#root` não conflita mais.
- Os botões de zoom nas linhas 404-406 já chamam `ui.setZoom(...)` — confirmar que continuam funcionais.
- Critério de aceite: botões + e - alteram o zoom do mapa sem afetar HUD ou página.

**T2.3 — Mover os botões de zoom para dentro do container do mapa**
- Os botões de zoom estão atualmente em `<div className="absolute bottom-2 right-2 ...">` (linha 404). Isso está correto — estão no container do mapa, não afetados pelo `motion.div` interno. Confirmar posição e z-index.
- Se necessário, ajustar z-index para `z-30` (já está) para ficar acima do banner de ação (que será `z-10`).

### Critérios de aceite da sprint

- [ ] `handleZoom` completamente removido do `App.tsx`
- [ ] `#root` não tem estilos inline de scale, width, height, position
- [ ] Zoom + e - funcionam apenas na área do mapa
- [ ] Redimensionar janela não causa distorção
- [ ] Pan (arrastar) funciona proporcional ao zoom

### Comandos de validação

```bash
npm run lint          # Confirmar que remoção não quebrou tipos
npm run dev           # Testar visualmente:
                      #  - Redimensionar janela de 1920 → 768 → 375
                      #  - Clicar + e - (zoom muda o mapa, não a página)
                      #  - Arrastar mapa com zoom > 1.0
grep -r "handleZoom" src/   # Deve retornar vazio
```

### Riscos

- A página pode quebrar em resoluções não-1440px após a remoção. Mitigação: o layout já usa flexbox (`flex flex-row` na linha 334), então deve se adaptar. Testar em 5 resoluções.
- O pan pode se comportar diferente sem a escala global. Mitigação: o `panOffset` já é aplicado via `motion.div` — a lógica de arraste não muda, só o contexto de escala.

### O que NÃO deve ser alterado

- Não alterar `useUI.ts` (zoom já existe).
- Não adicionar zoom por scroll ou pinch-to-zoom.
- Não alterar os handlers de mouse/touch (`handleMouseDown/Move/Up`, `handleTouchStart/Move/End`).
- Não remover o `motion.div` com `animate={{ scale: ui.zoom }}`.

---

## 6. Sprint 3 — HUD recolhível

**Objetivo:** Tornar o HUD uma sidebar recolhível com 3 comportamentos por breakpoint: desktop (≥1024px) sidebar, tablet (768–1023px) sidebar 320px, mobile (<768px) overlay.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/index.css` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/App.tsx` |

### Tarefas (em ordem)

**T3.1 — Remover `!important` do CSS do HUD**
- Remover completamente as classes `.hud-docked` (linhas 287-294) e `.hud-toggle-btn` (linhas 296-298) do `index.css`.
- Substituir por classes utilitárias Tailwind + CSS condicional no componente.
- Critério de aceite: `grep -r "!important" src/index.css | grep -i hud` retorna vazio.

**T3.2 — Adicionar classes CSS para o HUD responsivo**
- No `index.css`, adicionar APÓS as regras removidas:

```css
/* HUD responsive sidebar */
.hud-sidebar {
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
.hud-sidebar.open {
  transform: translateX(0);
  opacity: 1;
}
.hud-sidebar.closed {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

/* Overlay mode for mobile */
@media (max-width: 767px) {
  .hud-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }
  .hud-overlay .hud-sidebar {
    width: 100vw;
    max-width: 100vw;
  }
}

/* Desktop/tablet: map expands when HUD closed */
.hud-open .map-area {
  /* map ocupa espaço restante naturalmente via flex */
}
.hud-closed .map-area {
  flex: 1;
}
```

- Critério de aceite: animações com 300ms ease-out e slide+fade.

**T3.3 — Refatorar HUD.tsx para sidebar responsiva**
- Usar `isHudOpen` (já recebido como prop) para controlar classes condicionais.
- Desktop (≥1024px): `w-[clamp(280px,25vw,420px)]` quando aberto, `w-0 overflow-hidden` quando fechado. Sidebar, não overlay.
- Tablet (768–1023px): `w-[320px]` quando aberto, `w-0 overflow-hidden` quando fechado. Sidebar.
- Mobile (<768px): overlay com `position: fixed; inset: 0; z-50`, 100vw, backdrop-blur. Mapa não é redimensionado.
- Adicionar botão de toggle no HUD:
  - Desktop/tablet: canto superior direito do HUD (ícone `<`/`>`).
  - Mobile: botão flutuante no canto inferior direito (à esquerda dos botões de zoom).
- Critério de aceite: toggle visível e funcional em todas as resoluções.

**T3.4 — Adicionar toggle button externo no App.tsx para mobile**
- Em mobile (<768px), o HUD inicia fechado (`isHudOpen = false`). O toggle button deve ficar no canto inferior direito, à esquerda dos botões de zoom, com gap de 8px.
- Usar `window.innerWidth` ou media query CSS para controlar posição.
- Alternativa mais simples: sempre renderizar o toggle no container do mapa, mas com `lg:hidden` para esconder em desktop.
- Critério de aceite: toggle visível em mobile, gap de 8px à esquerda dos botões de zoom.

### Critérios de aceite da sprint

- [ ] HUD pode ser aberto/fechado com animação de 300ms
- [ ] Desktop: sidebar recolhível, mapa expande ao fechar
- [ ] Tablet: sidebar 320px recolhível
- [ ] Mobile: overlay 100vw com backdrop-blur, mapa não redimensiona
- [ ] Toggle visível em todas as resoluções
- [ ] Nenhum `!important` relacionado a HUD no CSS
- [ ] Estado `isHudOpen` persiste durante a sessão

### Comandos de validação

```bash
npm run dev
# Testar manualmente:
#  - 1920px: HUD abre/fecha, mapa expande
#  - 1024px: igual, com largura clamp
#  - 768px: sidebar 320px, toggle funcional
#  - 375px: overlay, toggle no canto inferior direito
grep -r "!important" src/index.css | grep -i hud  # Deve ser vazio
```

### Riscos

- O estado inicial (`isHudOpen = true`) pode causar overlay aberto em mobile no primeiro render. Mitigação: no `useUI`, inicializar com base em `window.innerWidth` (se < 768, `false`).
- A transição do flex layout quando o HUD abre/fecha pode causar layout shift no mapa. Mitigação: usar `transition-all duration-300` no container do mapa.

### O que NÃO deve ser alterado

- Não alterar o conteúdo interno do HUD (recursos, ações, modos de visão).
- Não alterar as props da interface `HUDProps`.
- Não alterar a lógica de `onMapAction`.
- Não remover o botão de fullscreen existente.

---

## 7. Sprint 4 — Labels SVG + Indicador visual de ação

**Objetivo:** Corrigir labels do SVG (F-03) e implementar feedback visual de modo de ação no mapa (F-05).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/Map.tsx` |
| Editar | `src/App.tsx` |
| Editar | `src/hooks/useUI.ts` |

### Tarefas (em ordem)

**T4.1 — F-03: Substituir className Tailwind por atributos SVG nativos nos labels**
- No `Map.tsx`, linha 82: substituir `className="text-[10px] fill-white/80 font-serif pointer-events-none drop-shadow-md"` por atributos SVG nativos:

```
fontSize="10"
fontWeight="bold"
fontFamily="serif"
fill="rgba(255,255,255,0.8)"
paintOrder="stroke"
stroke="rgba(0,0,0,0.5)"
strokeWidth="2"
```

- Certificar-se de que são atributos JSX (camelCase no React: `fontSize`, `fontWeight`, `fontFamily`, `paintOrder`, `strokeWidth`).
- Critério de aceite: labels visíveis e legíveis em Chrome, Firefox, Safari.

**T4.2 — F-05: Adicionar `actionBannerMessage` ao useUI**
- Em `src/hooks/useUI.ts`, adicionar:

```typescript
const [actionBannerMessage, setActionBannerMessage] = useState<string | null>(null);
```

- Adicionar ao objeto de retorno: `actionBannerMessage, setActionBannerMessage`.
- Critério de aceite: novo estado disponível para componentes.

**T4.3 — F-05: Indicador visual no Map.tsx**
- Adicionar lógica condicional baseada em `actionState` e `actionSourceId`:
  - Se `actionState === 'attacking'` ou `actionState === 'moving'`:
    - Província origem (`actionSourceId`): adicionar `className="animate-pulse-slow"` com `stroke="#fbbf24"` e `strokeWidth={3}`
    - Container do SVG: adicionar `style={{ cursor: 'crosshair' }}`
    - Províncias vizinhas válidas: stroke mais claro (`stroke="#fbbf24" strokeOpacity={0.5}`)
  - Para ataque: vizinhas = `prov.neighbors` da origem que não pertencem ao jogador
  - Para marcha: vizinhas = resultado de BFS limitado a 3 tiles (comentado no PRD: "monitorar performance em mapas grandes") — **nesta sprint, implementar apenas BFS e medir tempo de execução**
- Critério de aceite: borda pulsante na origem, cursor crosshair, destaques em vizinhos.

**T4.4 — F-05: Banner de ação no App.tsx**
- Adicionar um banner fixo no topo da área do mapa (dentro da `<div>` do mapa, antes do `motion.div`):

```tsx
{ui.actionBannerMessage && (
  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-6 py-2 bg-black/70 backdrop-blur-sm border border-amber-500/50 rounded-b-lg">
    <span className="text-amber-200 text-sm font-bold">{ui.actionBannerMessage}</span>
  </div>
)}
```

- Definir `actionBannerMessage` ao entrar em modo de ação (em `onMapAction` no `App.tsx`, linhas 426-449):
  - `'moving'`: `"Modo Marcha — selecione o destino no mapa"`
  - `'attacking'`: `"Modo Ataque — clique em uma província adjacente"`
- Limpar banner ao cancelar ação (`onCancelAction`).
- Critério de aceite: banner visível com z-10, botões de fullscreen (z-[100]) e toggle permanecem acessíveis.

**T4.5 — Integrar cancelamento de ação com limpeza de indicadores**
- No `onCancelAction` (App.tsx linha 422), garantir que `setActionBannerMessage(null)` é chamado.
- No `handleProvinceClick`, quando a ação completa, limpar o banner.
- Critério de aceite: ao cancelar, cursor volta ao normal, borda pulsante some, banner desaparece.

### Critérios de aceite da sprint

- [ ] Nomes das províncias visíveis no centro de cada polígono
- [ ] Texto legível com stroke+fill contra qualquer cor de fundo
- [ ] `className` com utilities de texto removido dos elementos `<text>` SVG
- [ ] Borda pulsante na província origem em modo de ação
- [ ] Cursor crosshair no mapa durante modo de ação
- [ ] Províncias alvo válidas com destaque
- [ ] Banner de instrução no topo do mapa (z-10)
- [ ] Cancelar ação limpa todos os indicadores

### Comandos de validação

```bash
npm run dev
# Testar:
#  - Selecionar província própria, clicar "Atacar"
#  - Verificar borda pulsante, cursor crosshair, banner
#  - Clicar em província não-vizinha → toast de erro
#  - Clicar "Cancelar" → tudo volta ao normal
#  - Verificar labels SVG em Chrome e Firefox
grep "className.*text-" src/components/Map.tsx  # Deve ser vazio para elementos text
```

### Riscos

- BFS para calcular províncias alcançáveis em marcha pode ser lento em mapas grandes (40 províncias). Mitigação: limitar profundidade a 3, memoizar com `useMemo` dependente de `actionSourceId`.
- Labels SVG podem precisar de `dy` offset para centralização vertical. Ajustar se necessário.

### O que NÃO deve ser alterado

- Não alterar `handleProvinceClick` (a lógica de clique é preservada).
- Não alterar a estrutura do SVG (viewBox, preserveAspectRatio).
- Não alterar as props da interface `MapProps`.

---

## 8. Sprint 5 — Touch targets + Loading state

**Objetivo:** Garantir touch targets de 44px (F-07) e implementar loading state na geração do mapa (F-08).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/App.tsx` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/hooks/useUI.ts` |
| Editar | `src/hooks/useGameController.ts` |

### Tarefas (em ordem)

**T5.1 — F-08: Adicionar `isGenerating` ao useUI**
- Em `src/hooks/useUI.ts`, adicionar:

```typescript
const [isGenerating, setIsGenerating] = useState<boolean>(false);
```

- Adicionar ao retorno.
- Critério de aceite: estado disponível.

**T5.2 — F-08: Loading state no useGameController**
- Modificar `startNewGame` em `useGameController.ts` (linhas 13-18):

```typescript
const startNewGame = useCallback(() => {
  ui.setIsGenerating(true);
  // Força re-render antes da geração síncrona
  setTimeout(() => {
    const state = generateInitialState(1280, 720, ui.gameSettings);
    setGameState(state);
    ui.setShowMenu(false);
    ui.setIsGenerating(false);
    ui.showToast("Dê início à sua dinastia!", "success");
  }, 400); // delay mínimo de 400ms
}, [ui, setGameState]);
```

- Adicionar `setIsGenerating` à dependência do `useCallback`.
- Critério de aceite: spinner visível por no mínimo 400ms ao iniciar partida.

**T5.3 — F-08: Renderizar loading state no App.tsx**
- No menu principal (antes do `if (ui.showMenu)` return), verificar `isGenerating`:

```tsx
if (ui.isGenerating) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full mb-6"
      />
      <p className="text-amber-200 text-xl font-serif">Gerando reinos...</p>
      <p className="text-stone-500 text-sm mt-2 italic">Forjando o destino do seu império</p>
    </div>
  );
}
```

- Adicionar timeout de 5s como safety net (embora a geração síncrona torne isso praticamente impossível):

```typescript
// Dentro do setTimeout:
const timeout = setTimeout(() => {
  ui.setIsGenerating(false);
  ui.showToast("Erro ao gerar o mapa. Tente novamente.", "error");
}, 5000);
// No sucesso, limpar o timeout
```

- Critério de aceite: spinner + texto "Gerando reinos..." visível.

**T5.4 — F-07: Aumentar botões de zoom para 44x44px**
- Em `App.tsx`, linhas 404-406: alterar classes dos botões de zoom.
- De: `w-5 h-5 xs:w-6 xs:h-6 sm:w-10 sm:h-10`
- Para: `w-11 h-11` (44px) — universal, sem breakpoints.
- Ajustar padding interno para centralizar o texto `+`/`-`.
- Critério de aceite: botões de zoom têm ≥ 44×44px.

**T5.5 — F-07: Aumentar botões de ação no HUD para min-height 44px**
- Em `HUD.tsx`, verificar botões "Marchar" e "Atacar" (linhas 206-217): já têm `py-2` (~32px). Aumentar para `py-3` e adicionar `min-h-[44px]`.
- Botão "Recrutar" (linha 234): adicionar `min-h-[44px]`.
- Botões de construção (linhas 248-255): adicionar `min-h-[44px]`.
- Botão "Encerrar Turno" (linha 272): já tem `h-12` (48px) — ok.
- Critério de aceite: todos os botões de ação têm área mínima de 44×44px.

### Critérios de aceite da sprint

- [ ] Spinner aparece ao clicar "INICIAR JORNADA" por ≥ 400ms
- [ ] Após geração, spinner some e jogo inicia
- [ ] Botões de zoom têm 44×44px
- [ ] Botões de ação no HUD têm min-height 44px
- [ ] Variável CSS `--touch-target-size: 44px` é respeitada

### Comandos de validação

```bash
npm run dev
# Testar:
#  - Clicar "INICIAR JORNADA" → spinner aparece
#  - Aguardar jogo carregar → spinner some
#  - Medir botões de zoom com DevTools (devem ter ≥ 44x44px)
#  - Testar toque em mobile/tablet (ou emular com DevTools)
grep -r "isGenerating" src/
```

### Riscos

- O `setTimeout` de 400ms pode causar flash se o componente for desmontado antes. Mitigação: verificar se `isGenerating` é false antes de chamar `setGameState`.
- Se a geração for muito rápida (sub-400ms), o spinner aparece brevemente e some — isso é o comportamento esperado pelo PRD. O delay de 400ms é intencional.

### O que NÃO deve ser alterado

- Não alterar `generateInitialState` — é síncrono, não precisa de mudança.
- Não alterar a lógica de `startNewGame` além do delay e loading state.

---

## 9. Sprint 6 — Instruções + Rename + Toast

**Objetivo:** Adicionar botão de instruções (F-06), renomear botão (FS-03), extrair ToastContainer (F-10).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/App.tsx` |
| Editar | `src/components/HUD.tsx` |
| Criar | `src/components/ToastContainer.tsx` |

### Tarefas (em ordem)

**T6.1 — FS-03: Renomear botão "Ver Todos os Reinos"**
- Em `App.tsx`, linha 305: alterar texto de `"Ver Todos os Reinos"` para `"Gerenciar Salvamentos"`.
- Critério de aceite: botão mostra o novo texto.

**T6.2 — F-06: Botão de instruções no menu principal**
- Em `App.tsx`, no menu principal (seção `if (ui.showMenu)`), adicionar botão "?" no canto superior direito:

```tsx
<button
  onClick={() => ui.setShowInstructionsModal(true)}
  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-stone-800/80 border border-amber-600/30 hover:bg-amber-600/20 flex items-center justify-center transition-all"
  aria-label="Instruções"
>
  <HelpCircle size={20} className="text-amber-400" />
</button>
```

- O ícone `HelpCircle` já está importado (linha 17). O estado `showInstructionsModal` já existe.
- O modal `GameInstructionsModal` já está implementado e renderizado condicionalmente (linhas 321-326).
- Critério de aceite: botão "?" visível no canto superior direito, `aria-label="Instruções"`, abre o modal.

**T6.3 — F-06: Botão de instruções no HUD**
- Em `HUD.tsx`, na barra superior (linha 107-122), ao lado dos botões "Salvar" e "Menu", adicionar:

```tsx
<button onClick={onToggleInstructions} className="p-1 px-2 border border-stone-700 bg-stone-800 text-[8px] font-bold uppercase rounded hover:bg-stone-700 transition-colors flex items-center gap-1">
  <HelpCircle size={12} />
  <span className="hidden md:inline">Instruções</span>
</button>
```

- Adicionar `onToggleInstructions` à interface `HUDProps` e ao componente.
- No `App.tsx`, passar `onToggleInstructions={() => ui.setShowInstructionsModal(true)}` para o HUD.
- Critério de aceite: botão "?" no HUD, texto "Instruções" visível em ≥768px.

**T6.4 — F-10: Criar ToastContainer.tsx**
- Criar `src/components/ToastContainer.tsx`:

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle } from 'lucide-react';

interface ToastContainerProps {
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-2xl border flex items-center gap-2 backdrop-blur-md ${
          toast.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
          toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
          'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}
      >
        {toast.type === 'success' && <div className="p-1 bg-green-500 rounded-full"><PlusCircle size={12} className="text-green-900" /></div>}
        <span className="text-xs font-bold medieval-text">{toast.message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);
```

**T6.5 — F-10: Substituir toast inline por ToastContainer no App.tsx**
- Remover linhas 522-538 de `App.tsx` (bloco `{/* Toast Notifications */}` inteiro).
- Adicionar import: `import { ToastContainer } from './components/ToastContainer';`
- Adicionar no JSX (antes do fechamento do container principal):

```tsx
<ToastContainer toast={ui.toast} />
```

- Critério de aceite: toast funciona exatamente como antes, mas via componente dedicado.

### Critérios de aceite da sprint

- [ ] Botão "?" no menu principal (canto superior direito, `aria-label="Instruções"`)
- [ ] Botão "?" no HUD com texto "Instruções" em ≥768px
- [ ] Modal de instruções abre e fecha corretamente
- [ ] Botão renomeado para "Gerenciar Salvamentos"
- [ ] Toast funciona com 3 variantes (success, error, info)
- [ ] Componente `ToastContainer` usado no lugar do inline
- [ ] Toast aparece no canto inferior centralizado, z-[100], duração 3s

### Comandos de validação

```bash
npm run lint
npm run dev
# Testar:
#  - Menu: clicar "?" → modal de instruções abre
#  - Jogo: HUD → clicar "?" → modal de instruções abre
#  - Fechar modal pelo X e clicando fora
#  - Menu: botão mostra "Gerenciar Salvamentos"
#  - Modo de ataque: clicar em alvo inválido → toast de erro
#  - Salvar jogo → toast de sucesso
```

### Riscos

- Se `HelpCircle` não estiver importado nas dependências corretas em HUD.tsx, adicionar à lista de imports do lucide-react.
- O `onToggleInstructions` precisa ser adicionado à interface `HUDProps` — pode causar erro de tipo se esquecido. Mitigação: typecheck após cada adição.

### O que NÃO deve ser alterado

- Não alterar o conteúdo do `GameInstructionsModal`.
- Não alterar o hook `useUI` (toast/showToast já existem — NÃO recriar).
- Não alterar a lógica de `setTimeout` em `showToast`.

---

## 10. Sprint 7 — Ajustes finos e validação geral

**Objetivo:** Verificar tudo, corrigir edge cases, garantir que o typecheck e build passam, testar em múltiplas resoluções.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Revisar | Todos os alterados |
| Editar | Ajustes pontuais conforme necessário |

### Tarefas (em ordem)

**T7.1 — Typecheck completo**

```bash
npm run lint
```

- Corrigir TODOS os erros de tipo introduzidos.
- Se houver erros pré-existentes, anotar mas não corrigir (fora de escopo).

**T7.2 — Build de produção**

```bash
npm run build
npm run preview
```

- Confirmar que o build gera os assets corretamente.
- Testar com `preview` em produção.

**T7.3 — Teste de responsividade (5 resoluções)**
- 320px (mobile pequeno — Galaxy Fold)
- 480px (mobile — iPhone SE)
- 768px (tablet — iPad Mini)
- 1024px (desktop pequeno)
- 1920px (desktop full HD)
- Verificar: HUD toggle, zoom, labels, banner, botões, scrollbar.

**T7.4 — Teste de fluxos completos**
- Iniciar partida → loading → jogo inicia
- Selecionar província → ver detalhes no HUD
- Marchar → indicadores visuais → selecionar destino
- Atacar → indicadores visuais → combate → resultado
- Recrutar / Construir
- Encerrar turno → modal → confirmar
- Salvar / Carregar
- Abrir instruções (menu e HUD)
- Acessar crônicas

**T7.5 — Verificação de regressão**
- Confirmar que `#root` NÃO tem estilos inline de scale/width.
- Confirmar que `handleZoom` NÃO existe no código.
- Confirmar que `!important` relacionados a HUD foram removidos.
- Confirmar que `ACTION_COSTS` estão corretos.
- Confirmar que `aiLogic.ts` usa `ACTION_COSTS.build`.

**T7.6 — Verificação de acessibilidade**
- Todos botões sem texto visível têm `aria-label`.
- Touch targets ≥ 44px em todos botões de ação.
- `display=swap` presente na URL do Google Fonts.
- Preconnect links no `<head>`.

### Critérios de aceite da sprint

- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` completa
- [ ] Layout funcional em 5 resoluções
- [ ] Todos os fluxos de jogo funcionam
- [ ] Nenhuma regressão de lógica de jogo
- [ ] Código sem `!important` não-justificados

---

## 11. Ordem de execução recomendada

1. **Sprint 0:** Leitura obrigatória antes de qualquer alteração.
2. **Sprint 1:** Fundação — as constantes e CSS base precisam estar corretos antes de tudo.
3. **Sprint 2:** Zoom nativo — depende apenas da Sprint 1 (remoção do `handleZoom`).
4. **Sprint 3:** HUD recolhível — depende da Sprint 2 (layout sem escala fixa) e Sprint 1 (CSS limpo).
5. **Sprint 4:** Labels SVG + indicador de ação — depende da Sprint 2 (zoom nativo para o crosshair funcionar) e Sprint 3 (HUD não atrapalha o banner).
6. **Sprint 5:** Touch targets + loading — depende da Sprint 3 (HUD refatorado) e Sprint 1 (useUI atualizado).
7. **Sprint 6:** Instruções + rename + toast — pode ser feita em paralelo com a Sprint 5, depende apenas da Sprint 1.
8. **Sprint 7:** Validação — após todas as anteriores.

**Paralelismo possível:**
- Sprint 5 e Sprint 6 podem ser executadas simultaneamente (não conflitam em arquivos).
- Sprint 4 pode começar após Sprint 2, sem esperar a Sprint 3 (Map.tsx e HUD.tsx são independentes).

---

## 12. Checklist de validação geral

### Lint

```bash
npm run lint
```

- [ ] Zero novos erros de TypeScript introduzidos

### Typecheck

```bash
npx tsc --noEmit
```

- [ ] Todos os tipos resolvem corretamente

### Build

```bash
npm run build
npm run preview
```

- [ ] Build produz `dist/` sem erros
- [ ] Preview serve o jogo corretamente

### Testes

- [ ] Projeto não tem suíte de testes — validação é manual

### Fluxo manual

- [ ] Iniciar partida (loading → jogo)
- [ ] Selecionar província → HUD mostra detalhes
- [ ] Marchar (indicadores + execução)
- [ ] Atacar (indicadores + combate + resultado)
- [ ] Recrutar
- [ ] Construir (4 tipos)
- [ ] Encerrar turno
- [ ] Salvar / Carregar / Deletar save
- [ ] Abrir instruções (menu e HUD)
- [ ] Abrir crônicas
- [ ] Fullscreen toggle

### Responsividade

- [ ] 320px — HUD overlay, toggle visível, mapa navegável
- [ ] 480px — idem
- [ ] 768px — HUD sidebar 320px, recolhível
- [ ] 1024px — HUD sidebar clamp, recolhível
- [ ] 1920px — layout equilibrado, HUD ≤ 420px

### Regressões

- [ ] `#root` sem scale/width/position inline
- [ ] `handleZoom` removido
- [ ] `!important` de HUD removidos
- [ ] `ACTION_COSTS` alinhados (move=1, attack=2, build=1)
- [ ] `aiLogic.ts` usa constantes
- [ ] `vite` não duplicado
- [ ] `.portrait-blocker` removido
- [ ] Labels SVG legíveis em Chrome e Firefox

---

## 13. Pontos que exigem modelo mais forte

As tarefas abaixo envolvem raciocínio espacial, decisões de design CSS com impacto cross-browser, ou refatoração de código com efeitos colaterais sutis. **Não delegue a um modelo barato:**

| Sprint | Tarefa | Por quê |
|--------|--------|---------|
| 2 | Remover `handleZoom` sem quebrar layout | Requer entender a interação entre o scale do `#root`, o `motion.div` do mapa, e o flexbox do container. Se mal feito, o jogo fica injogável. |
| 3 | HUD responsivo com 3 breakpoints + overlay | CSS condicional complexo com animações, z-index stacking, e comportamento distinto por viewport. Erro aqui quebra o layout inteiro. |
| 4 | BFS para províncias alcançáveis | Algoritmo de grafo com risco de performance. Modelo barato pode implementar BFS ineficiente que trava o jogo em mapas grandes. |
| 3+4 | Stacking de z-index (banner, toggle, fullscreen, HUD overlay) | Requer visão holística: banner z-10, HUD overlay z-50, toast z-[100], fullscreen z-[100]. Conflito de z-index é difícil de debugar. |
| 1 | Consolidação de media queries | Remover regras específicas de iPhone mantendo comportamento equivalente em genéricas exige teste visual cuidadoso em cada resolução. |
| 5 | Loading state com setTimeout + race condition | O delay de 400ms com geração síncrona tem edge cases (desmontagem, timeout). Modelo barato pode introduzir memory leak. |

### Tarefas seguras para modelo barato:

- FS-01 (remover vite duplicado)
- FS-02 (alterar constantes numéricas)
- FS-03 (renomear string de botão)
- F-03 (substituir className por atributos SVG)
- F-04 (adicionar `.custom-scrollbar` no CSS)
- F-06 (adicionar botões "?" com aria-label)
- F-07 (aumentar tamanho de botões)
- F-09 parcial (remover `.portrait-blocker`, adicionar preconnect)
- F-10 (extrair ToastContainer — copiar-colar estruturado)
