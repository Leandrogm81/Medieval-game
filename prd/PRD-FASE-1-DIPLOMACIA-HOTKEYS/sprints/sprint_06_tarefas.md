# Sprint 06 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_06_ux_avancada_multipla_selecao_minimapa.md
> **Total de tarefas:** 7
> **Ordem de execução:** T1-T3 (múltipla seleção); T4-T5 (minimapa); T6 (integração); T7 (validação)
> **Regras:** NÃO quebrar seleção única existente. Eventos de rato não devem conflitar.

---

## Tarefa 1 — Adicionar multiSelectedProvinceIds ao useUI

- **Objetivo:** Adicionar o estado de múltipla seleção ao hook de UI.
- **Arquivos prováveis:** `src/hooks/useUI.ts`
- **Passos:**
  1. Abrir `src/hooks/useUI.ts`.
  2. Adicionar `useState<string[]>`: `const [multiSelectedProvinceIds, setMultiSelectedProvinceIds] = useState<string[]>([])`.
  3. Adicionar `multiSelectedProvinceIds` e `setMultiSelectedProvinceIds` ao retorno do hook.
  4. NÃO alterar outras partes do hook.
- **Critérios de aceite:** `npm run lint` passa. Estado disponível no retorno.
- **Como validar:** `npm run lint`
- **Riscos:** Nenhum.

---

## Tarefa 2 — Implementar Shift+Click e arrasto com botão direito no Map.tsx

- **Objetivo:** Adicionar lógica de seleção múltipla de províncias via Shift+Click e right-click drag.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Depende de:** Tarefa 1 (multiSelectedProvinceIds disponível)
- **Passos:**
  1. Abrir `src/components/Map.tsx`. Verificar as props existentes — adicionar novas props se necessário:
     - `multiSelectedProvinceIds: string[]`
     - `onMultiSelectChange: (ids: string[]) => void`
     - `playerRealmId: string`
  2. **Shift+Click em província (modificar handler onClick de cada path/polygon de província):**
     - Detetar `e.shiftKey`.
     - Se Shift pressionado e província é do jogador (`ownerId === playerRealmId`):
       - Se já está em `multiSelectedProvinceIds` → remover.
       - Se não está → adicionar.
     - Se província NÃO é do jogador → ignorar.
     - Se clicou sem Shift → limpar `multiSelectedProvinceIds` (comportamento normal de seleção única).
  3. **Arrasto com botão direito:**
     - Adicionar estado local: `selectionRect: { startX, startY, endX, endY } | null`.
     - `onMouseDown`: se `e.button === 2` (botão direito) → registar posição inicial, `e.preventDefault()`.
     - `onMouseMove`: se `selectionRect` ativo → atualizar `endX`, `endY`.
     - `onMouseUp`: se `selectionRect` ativo:
       - Calcular bounding box do retângulo.
       - Detetar todas as províncias do jogador cujo centroide está dentro do retângulo.
       - `onMultiSelectChange(dentroDoRetangulo)`.
       - Limpar `selectionRect`.
     - Renderizar `<div>` ou `<rect>` visual semi-transparente durante o arrasto.
  4. **Highlight visual para províncias multi-selecionadas:**
     - Ao renderizar cada província, verificar se `multiSelectedProvinceIds.includes(prov.id)`.
     - Se sim: aplicar classe CSS com borda dourada pulsante:
       ```css
       stroke: #fbbf24; stroke-width: 2; animation: pulse-gold 1s infinite;
       ```
     - Adicionar `@keyframes pulse-gold` no CSS inline ou index.css.
  5. **Contador no banner:** se `multiSelectedProvinceIds.length > 1`, mostrar "{N} províncias selecionadas".
  6. NÃO quebrar o pan (arrasto com botão esquerdo). O arrasto de seleção usa botão DIREITO.
- **Critérios de aceite:**
  - Shift+Click adiciona/remove província aliada.
  - Shift+Click em província inimiga → ignorado.
  - Arrasto com botão direito desenha retângulo e seleciona províncias.
  - Arrasto sobre províncias de múltiplos donos → só as do jogador.
  - Províncias selecionadas mostram borda dourada.
  - Clique sem Shift limpa seleção múltipla.
- **Como validar:** `npm run lint && npm run build`. Testar no browser.
- **Riscos:**
  - Botão direito tem comportamento padrão (context menu). Usar `e.preventDefault()` e `onContextMenu={(e) => e.preventDefault()}` no container do mapa.
  - Conflito com pan do mapa (botão esquerdo). Garantir que botão direito NÃO afeta o pan.
  - O centroide da província pode não estar disponível. Verificar `types.ts` para `Province.centroid`.

---

## Tarefa 3 — Implementar march orders multi-origem no useGameController

- **Objetivo:** Modificar `handleProvinceClick` para criar múltiplas march orders quando há províncias multi-selecionadas e o jogador clica num destino.
- **Arquivos prováveis:** `src/hooks/useGameController.ts`
- **Depende de:** Tarefa 2 (multiSelectedProvinceIds populado)
- **Passos:**
  1. Abrir `src/hooks/useGameController.ts`. Localizar `handleProvinceClick`.
  2. ANTES da lógica existente, adicionar verificação:
     - Se `ui.multiSelectedProvinceIds.length > 0` e o clique é num destino:
       - Obter `destinationId` do clique.
       - Para cada `originId` em `multiSelectedProvinceIds`:
         a) Verificar se a província tem tropas > 0. Se 0 → pular, adicionar a `skippedIds`.
         b) `path = findPath(originId, destinationId)`. Se vazio → pular.
         c) Criar `MarchOrder` (usar lógica existente de criação de march order).
         d) Contador de AP: cada origem consome 1 AP.
       - Se `multiSelectedProvinceIds.length > playerRealm.actionPoints`:
         - Ordenar origens por `path.length` (mais próximas primeiro).
         - Marchar apenas as primeiras `actionPoints` províncias.
         - Toast: "AP insuficiente. Marchando de {M}/{N} províncias."
         - Províncias não marchadas PERMANECEM em `multiSelectedProvinceIds`.
       - Após execução (total ou parcial):
         - Limpar `multiSelectedProvinceIds` das que marcharam.
         - Toast resumo: "{N} exércitos em marcha."
         - Deduzir AP.
         - `return` (não processar clique normal).
  3. Se `multiSelectedProvinceIds.length === 0` → comportamento normal de clique único (manter lógica existente intacta).
  4. Preview de caminhos: o Map.tsx deve mostrar paths de todas as origens (usar `previewPath` array — pode precisar de adaptação para múltiplos paths).
- **Critérios de aceite:**
  - 3 províncias selecionadas + clique no destino → 3 march orders criadas.
  - AP insuficiente → marcha as mais próximas, toast informativo.
  - Províncias sem tropas → saltadas, toast lista quais.
  - Caminho inalcançável → origem saltada.
  - Após ação, `multiSelectedProvinceIds` limpo (ou mantém as não processadas).
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `findPath` pode ser pesado para muitas origens. OK para < 10 províncias.
  - Não quebrar o fluxo de marcha single-origin existente.

---

## Tarefa 4 — Criar componente Minimap.tsx

- **Objetivo:** Criar um componente de minimapa SVG que mostra o mapa completo em miniatura com indicador de viewport.
- **Arquivos prováveis:** `src/components/Minimap.tsx` (novo)
- **Passos:**
  1. Criar `src/components/Minimap.tsx`.
  2. Props:
     ```typescript
     interface MinimapProps {
       gameState: GameState;
       panOffset: { x: number; y: number };
       zoom: number;
       viewportSize: { width: number; height: number };
       onNavigate: (x: number, y: number) => void;
     }
     ```
  3. Layout:
     - Container fixo no canto inferior esquerdo: `absolute bottom-4 left-4 z-20`.
     - Tamanho: `150×100px` (desktop), `100×70px` (mobile — usar `className="max-md:w-[100px] max-md:h-[70px]"`).
     - Fundo semi-transparente: `bg-black/60 border border-amber-900/30 rounded-sm`.
     - SVG interno com viewBox que cobre todas as províncias.
     - Cada província desenhada como `<path>` ou `<polygon>` com `fill={realm.color}` (ou cinza para neutras).
     - Retângulo branco semitransparente (`fill="white" opacity="0.2"`) representando a viewport atual.
     - Tamanho do retângulo: `viewportSize.width / zoom` por `viewportSize.height / zoom`.
     - Posição do retângulo: calculado a partir de `panOffset`.
  4. Performance: usar `React.memo(Minimap)` para evitar re-renders.
  5. NÃO usar hooks dentro do Minimap além dos necessários.
- **Critérios de aceite:**
  - Minimapa visível no canto inferior esquerdo.
  - Províncias coloridas por dono.
  - Retângulo de viewport visível e move com pan.
  - Retângulo ajusta tamanho com zoom.
  - Funciona com mapas de qualquer tamanho (até 40 províncias).
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Coordenadas SVG: as províncias usam coordenadas do viewBox original. O minimapa precisa usar o mesmo viewBox mas escalado.
  - `panOffset` pode ser grande — o retângulo pode ficar fora do minimapa. Clampar ao viewBox.

---

## Tarefa 5 — Adicionar navegação por clique no Minimapa + responsividade

- **Objetivo:** Permitir clicar no minimapa para mover a viewport principal e otimizar para mobile.
- **Arquivos prováveis:** `src/components/Minimap.tsx`
- **Depende de:** Tarefa 4
- **Passos:**
  1. No Minimap, adicionar handler `onClick` no SVG:
     - Calcular posição do clique relativa ao SVG.
     - Mapear para coordenadas do mapa real.
     - Chamar `onNavigate(targetX, targetY)`.
  2. Adicionar `onMouseDown` com flag `isMinimapInteraction = true` para evitar que o mapa principal processe o mesmo evento.
  3. No container, adicionar `onMouseDown={(e) => e.stopPropagation()}` para isolar eventos.
  4. Para mobile (< 768px):
     - Minimapa reduzido ou oculto por padrão.
     - Adicionar botão toggle "🗺️" no HUD mobile (será integrado na Tarefa 6).
     - Touch: `onTouchStart`, `onTouchEnd` para navegação.
  5. Animar transição da viewport com CSS `transition: transform 0.3s ease` (aplicado no elemento do mapa principal, não aqui).
- **Critérios de aceite:**
  - Clique no minimapa move a viewport principal.
  - Clique no minimapa NÃO ativa seleção de província no mapa principal.
  - Touch funciona em mobile.
  - Viewport muito pequena → retângulo mínimo 4×4px.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Conflito de eventos entre minimapa e mapa principal. Usar `stopPropagation` com cuidado.
  - Cálculo de coordenadas: garantir que a relação entre SVG do minimapa e SVG do mapa principal é linear (mesmo viewBox proporcional).

---

## Tarefa 6 — Integrar Minimap no Map.tsx e HUD

- **Objetivo:** Renderizar o Minimap dentro do mapa e adicionar toggle no HUD mobile.
- **Arquivos prováveis:** `src/components/Map.tsx`, `src/components/HUD.tsx`
- **Depende de:** Tarefas 4, 5
- **Passos:**
  1. Em `Map.tsx`:
     - Importar `Minimap`.
     - Adicionar props necessárias ao Map (se não existirem): `panOffset`, `zoom`, `onNavigate`.
     - Renderizar `<Minimap>` como overlay absoluto dentro do container do mapa (fora do `motion.div` que faz pan/zoom).
     - Condição: só renderizar durante jogo ativo (não no menu — controlado pelo parent).
  2. Em `HUD.tsx` (apenas mobile):
     - Adicionar botão toggle "🗺️" visível em `max-md:`.
     - Controla estado `showMinimap` (pode ser estado local no HUD ou passado como prop).
  3. Verificar z-index: botões zoom (z-30) > minimapa (z-20) > mapa (z-0).
- **Critérios de aceite:**
  - Minimapa visível durante o jogo.
  - Botão toggle em mobile.
  - Z-index correto.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - O container do mapa tem `overflow-hidden` — o minimapa precisa estar fora ou com `overflow-visible`.

---

## Tarefa 7 — Validação final

- **Objetivo:** Verificar múltipla seleção e minimapa.
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. Testar: Shift+Click, right-drag, multi-march, minimapa clique, minimapa mobile toggle.
  4. Verificar que seleção única ainda funciona.
  5. Verificar que march orders single-origin ainda funcionam.
- **Critérios de aceite:** (checklist completa da sprint original)
- **Como validar:** `npm run lint && npm run build`
