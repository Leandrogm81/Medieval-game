# Sprint 06 — UX Avançada: Múltipla Seleção + Minimapa

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §5 (Múltipla Seleção) + §7 (Minimapa)
> **Duração estimada:** 2.5 dias
> **Dependências:** Sprint 01 (hotkeys W/A para marcha). Sprint 05 (march orders são o alvo da múltipla seleção).
> **Pré-requisito para:** Nenhum (sprint final de UX)

---

## Objetivo da Sprint

Entregar duas funcionalidades de UX avançada: (1) seleção múltipla de províncias para mover exércitos em grupo, e (2) um minimapa navegável no canto inferior esquerdo para orientação espacial em impérios grandes.

---

## Scope: User Stories

### US-01 — Estado e Handlers de Múltipla Seleção
**Como** jogador, **quero** selecionar várias províncias com Shift+Click ou arrasto **para** mover múltiplos exércitos simultaneamente.

**Adicionar em `src/hooks/useUI.ts`:**
```typescript
multiSelectedProvinceIds: string[]  // nova propriedade no estado de UI
```

**Implementar em `src/components/Map.tsx`:**

1. **Shift+Click em província:**
   - Se província é do jogador (`ownerId === playerRealmId`):
     - Se já está em `multiSelectedProvinceIds` → remover
     - Se não está → adicionar
   - Se província NÃO é do jogador → ignorar
   - Se clicou sem Shift → limpar `multiSelectedProvinceIds` (seleção única normal)

2. **Arrasto com botão direito (right-click drag):**
   - `mousedown` (botão direito) → registar posição inicial
   - `mousemove` → desenhar retângulo de seleção visual (overlay `<div>` ou `<rect>`)
   - `mouseup` → detetar todas as províncias do jogador dentro do retângulo
   - Adicionar ao `multiSelectedProvinceIds`
   - Se o retângulo cobre províncias de múltiplos donos → só as do jogador são selecionadas

3. **Highlight visual:**
   - Províncias multi-selecionadas: borda dourada pulsante (`stroke: '#fbbf24'`, animação CSS)
   - Contador no banner de ação: "3 províncias selecionadas"

**Arquivos:** `src/hooks/useUI.ts`, `src/components/Map.tsx`

### US-02 — March Orders Multi-Origem
**Como** jogador com múltiplas províncias selecionadas, **quero** clicar num destino e enviar todos os exércitos **para** coordenar ataques ou movimentações em larga escala.

**Implementar em `src/hooks/useGameController.ts` — `handleProvinceClick` (modificar):**

Quando `multiSelectedProvinceIds.length > 0` e o jogador clica num destino:
1. Para cada província de origem em `multiSelectedProvinceIds`:
   - Validar que a província tem tropas > 0 (se não, pular com aviso)
   - Calcular `findPath(originId, destinationId)` — se inalcançável, pular
   - Criar `MarchOrder` com tropas da origem

2. **Gestão de AP:**
   - Cada origem consome 1 AP
   - Se `multiSelectedProvinceIds.length > actionPoints`:
     - Ordenar origens por `remainingPath.length` (mais próximas do destino primeiro)
     - Marchar apenas as primeiras `actionPoints` províncias
     - Toast: "AP insuficiente para todas as seleções. Marchando de {M}/{N} províncias."
     - Províncias não marchadas **permanecem selecionadas** (para agir no próximo turno)

3. **Preview de caminhos:**
   - Mostrar caminhos de todas as origens selecionadas
   - Usar cores diferentes ou tracejado para distinguir múltiplos paths
   - Highlight da província de destino

4. **Após execução:**
   - Limpar `multiSelectedProvinceIds`
   - Toast com resumo: "{N} exércitos em marcha."
   - Deduzir AP

**Arquivos:** `src/hooks/useGameController.ts`, `src/components/Map.tsx`

### US-03 — Componente Minimapa
**Como** jogador com um império grande, **quero** um minimapa no canto **para** me orientar espacialmente sem perder a visão dos detalhes.

**Criar `src/components/Minimap.tsx`:**

**Props:**
```typescript
interface MinimapProps {
  gameState: GameState;
  panOffset: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}
```

**Layout e comportamento:**
- **Posição:** Canto inferior esquerdo, fixo
- **Tamanho:** 150×100px (desktop), 100×70px ou toggle (mobile < 768px)
- **Z-index:** `z-20` (botões de zoom e HUD em `z-30` ficam acima)
- **Conteúdo:**
  - Versão minificada SVG do mapa — todas as províncias coloridas por `ownerId`
  - Retângulo branco semitransparente indicando a viewport atual
  - O retângulo ajusta tamanho com o zoom (mais zoom out = retângulo menor)
- **Renderização:** Reutilizar as mesmas cores de `realm.color` do mapa principal
- **Performance:** Para mapas com 100+ províncias, usar `will-change: transform` e evitar re-renders desnecessários (React.memo)

**Integrar em `src/components/Map.tsx`:**
- Renderizar `<Minimap>` como overlay absoluto dentro do container do mapa
- Pasar `panOffset`, `zoom`, `viewportSize` do estado do mapa
- Só visível durante o jogo ativo (não no menu)

**Arquivos:** `src/components/Minimap.tsx` (criar), `src/components/Map.tsx`

### US-04 — Navegação por Clique no Minimapa + Responsividade
**Como** jogador, **quero** clicar no minimapa para navegar rapidamente **para** saltar entre regiões distantes do mapa.

**Navegação por clique:**
- Clique no minimapa → calcular posição correspondente no mapa real
- Mover viewport com animação suave (`transition: transform 0.3s ease`)
- Não conflitar com pan do mapa principal:
  - Touch no minimapa só ativa se o toque começar E terminar dentro da área do minimapa (sem arrasto significativo)
  - Usar flag `isMinimapInteraction` para evitar que o mapa principal processe o mesmo evento

**Responsividade mobile (< 768px):**
- Minimapa reduzido para 100×70px
- Alternativa: oculto por padrão, toggle com botão "🗺️" no HUD mobile
- Comportamento touch otimizado (toque simples, sem necessidade de duplo-clique)

**Edge cases:**
- Viewport muito pequena (zoom out máximo) → retângulo visível como ponto (mínimo 4×4px)
- Mapa com 100+ províncias → minimapa renderiza sem perda de performance
- Clique fora dos limites do minimapa → ignorado

**Arquivos:** `src/components/Minimap.tsx`, `src/components/Map.tsx`, `src/components/HUD.tsx` (toggle mobile)

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/hooks/useUI.ts` | Editar — adicionar `multiSelectedProvinceIds` | US-01 |
| `src/components/Map.tsx` | Editar — Shift+Click, arrasto, preview paths, render Minimap | US-01, US-02, US-03 |
| `src/hooks/useGameController.ts` | Editar — lógica de march orders multi-origem | US-02 |
| `src/components/Minimap.tsx` | **Criar** — componente completo | US-03, US-04 |
| `src/components/HUD.tsx` | Editar — botão toggle minimapa (mobile) | US-04 |

---

## Critérios de Aceitação

- [ ] Shift+Click adiciona/remove província da seleção múltipla
- [ ] Arrasto com botão direito seleciona províncias do jogador na área do retângulo
- [ ] Arrasto que cobre províncias de múltiplos donos → só as do jogador são selecionadas
- [ ] Selecionar província inimiga com Shift+Click → ignorado
- [ ] Províncias multi-selecionadas mostram borda dourada pulsante
- [ ] Clicar em província sem Shift limpa a seleção múltipla (volta para seleção única)
- [ ] Clicar em destino com múltiplas selecionadas → cria march orders para todas
- [ ] Cada origem gasta 1 AP
- [ ] Preview mostra caminhos de todas as origens
- [ ] AP insuficiente: marcha as M mais próximas, toast informativo
- [ ] Destino inalcançável para algumas origens → essas origens ignoradas, toast lista quais falharam
- [ ] Províncias não marchadas permanecem selecionadas
- [ ] Minimapa renderiza cores corretas por ownerId
- [ ] Retângulo de viewport move com pan
- [ ] Retângulo de viewport ajusta tamanho com zoom
- [ ] Clicar no minimapa move a viewport principal com animação
- [ ] Minimapa não aparece no menu (só no jogo ativo)
- [ ] Z-index correto: botões de zoom e HUD acima do minimapa (z-30 > z-20)
- [ ] Responsivo em mobile: 100×70px ou toggle
- [ ] Touch no minimapa não conflita com pan do mapa principal
- [ ] Viewport muito pequena → retângulo visível (mínimo 4×4px)

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros
- [ ] `multiSelectedProvinceIds` inicializado como `[]` no estado de UI
- [ ] Nenhuma mutação de estado — handlers usam deep clone antes de modificar gameState
- [ ] `React.memo` no Minimap para evitar re-renders desnecessários
- [ ] Preview paths limpos após execução da ação
- [ ] March orders multi-origem não quebram o fluxo de marcha single-origin existente
- [ ] `multiSelectedProvinceIds` limpo após ação bem-sucedida
- [ ] Minimap não causa memory leak (event listeners limpos no unmount)
- [ ] Animações CSS com `will-change` para performance
- [ ] Testado em viewports desktop (1920×1080) e mobile (375×667)
