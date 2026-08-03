# Sprint 04 quebrada em tarefas menores — Novos Modos de Mapa

> **Coder:** 🟢 BARATO para TODAS as tarefas
> **Subpasta de destino:** `tarefas/sprint-04/`

---

## Tarefa 1 — Expandir ViewMode em types.ts
- **Objetivo:** Adicionar os 7 novos modos ao union type.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Na linha do `ViewMode`, adicionar após `'trade'`:
     ```typescript
     | 'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength'
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Switch/case em Map.tsx vai quebrar até adicionarmos os branches (T3, T4)

---

## Tarefa 2 — Calcular valores máximos para heatmaps (Map.tsx)
- **Objetivo:** Adicionar `useMemo` que calcula valores máximos entre todas as províncias para normalização.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Passos:**
  1. Após `const provinces = useMemo(...)` (linha 77), adicionar:
     ```typescript
     const maxValues = useMemo(() => {
       let maxPop = 1, maxDev = 1, maxIncome = 1, maxBuildings = 1, maxTroops = 1;
       provinces.forEach(p => {
         maxPop = Math.max(maxPop, p.population);
         const dev = (p.wealth || 0) + (p.buildings?.farms || 0) + (p.buildings?.mines || 0) + (p.buildings?.workshops || 0) + (p.buildings?.courts || 0);
         maxDev = Math.max(maxDev, dev);
         maxBuildings = Math.max(maxBuildings, dev);
         maxTroops = Math.max(maxTroops, p.troops || 0);
       });
       return { maxPop, maxDev, maxIncome: 1, maxBuildings, maxTroops };
     }, [provinces]);
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Valores máximos calculados uma vez por render
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `p.buildings` pode ser undefined. Usar fallback

---

## Tarefa 3 — Adicionar coloração para os 7 novos modos (Map.tsx)
- **Objetivo:** Cada novo modo pinta as províncias com o heatmap correto.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Passos:**
  1. Na seção `fillColor` (linha 253-264), adicionar `else if` para CADA novo modo:
     - `'population'`: `getHeatColor(p.population / maxValues.maxPop, 120)` (verde)
     - `'development'`: `getHeatColor(dev / maxValues.maxDev, 210)` (azul)
     - `'income'`: `getHeatColor((owner?.goldIncome || 0) / Math.max(maxValues.maxIncome, 1), 45)` (dourado)
     - `'stability'`: cor fixa baseada em loyalty (verde >70, amarelo 40-70, vermelho <40)
     - `'buildings'`: `getHeatColor(dev / maxValues.maxBuildings, 270)` (roxo)
     - `'growth'`: `getHeatColor(0.5, 180)` (ciano — placeholder, growth rate não é armazenado)
     - `'military_strength'`: `getHeatColor((p.troops || 0) / maxValues.maxTroops, 30)` (laranja)
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Cada modo renderiza com cor correta
- **Como validar:** `npm run build && npm run dev` — alternar modos, verificar cores
- **Riscos:** `owner` pode ser undefined para `neutral`. Verificar null safety

---

## Tarefa 4 — Adicionar labels para os 7 novos modos (Map.tsx)
- **Objetivo:** Cada modo mostra o label correto sobre a província.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Passos:**
  1. Na seção de labels (linha 298-311), adicionar `else if`:
     - `'population'`: `labelText = p.population.toLocaleString()` (ex: "12.450")
     - `'development'`: `labelText = "Dev: " + dev`
     - `'income'`: `labelText = "+" + (owner?.goldIncome || 0) + "g"`
     - `'stability'`: `labelText = (p.loyalty || 0) + "%"`
     - `'buildings'`: `labelText = "🏘️" + dev`
     - `'growth'`: `labelText = "+3%"` (placeholder)
     - `'military_strength'`: `labelText = "⚔️" + (p.troops || 0)`
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Labels corretos por modo
- **Como validar:** `npm run build && npm run dev` — verificar labels em cada modo
- **Riscos:** Formatação de número com `toLocaleString` pode não funcionar em todos os browsers

---

## Tarefa 5 — Adicionar atalhos 6, 7, 8, 9 em App.tsx
- **Objetivo:** Teclas numéricas 6-9 trocam modos de mapa.
- **Arquivos prováveis:** `src/App.tsx`
- **Passos:**
  1. No keydown handler (linhas 261-275), adicionar após case '5':
     ```typescript
     case '6': ui.setViewMode('population'); return;
     case '7': ui.setViewMode('development'); return;
     case '8': ui.setViewMode('income'); return;
     case '9': ui.setViewMode('stability'); return;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Teclas 6-9 funcionam
- **Como validar:** `npm run build && npm run dev` — pressionar 6, 7, 8, 9
- **Riscos:** Nenhum

---

## Tarefa 6 — Adicionar atalhos 0, G, T, F em App.tsx
- **Objetivo:** Teclas 0, G, T, F trocam para modos específicos.
- **Arquivos prováveis:** `src/App.tsx`
- **Passos:**
  1. Adicionar:
     ```typescript
     case '0': ui.setViewMode('buildings'); return;
     case 'G': case 'g': ui.setViewMode('growth'); return;
     case 'T': case 't': ui.setViewMode('trade'); return;
     ```
  2. ⚠️ `F` conflita com fullscreen (linha 285). Opções:
     - Usar `Shift+F` para military_strength
     - OU mudar fullscreen para outra tecla
     - OU usar `M` para military_strength
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Teclas 0, G, T funcionam. Atalho para military_strength decidido e funcional
- **Como validar:** `npm run build && npm run dev` — testar cada atalho
- **Riscos:** Conflito `F`. **Perguntar ao usuário antes de implementar**

---

## Tarefa 7 — Verificar e corrigir modo Trade
- **Objetivo:** Garantir que o modo `'trade'` renderiza algo visível.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Passos:**
  1. Verificar se `viewMode === 'trade'` tem branch de coloração
  2. Se não tiver: adicionar `else if (viewMode === 'trade')` com cor padrão (political)
  3. Opcional: desenhar linhas SVG entre províncias com `tradeRoutes`
  4. `npm run build`
- **Critérios de aceite:** Modo Trade não quebra ao ser selecionado
- **Como validar:** `npm run build && npm run dev` — pressionar T, verificar
- **Riscos:** `tradeRoutes` pode não ter visualização. Apenas garantir que não quebra

---

## Tarefa 8 — Validação final do Sprint 04
- **Objetivo:** Testar todos os 13 modos de mapa.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar:
     - Cada atalho 1-9, 0, T, G, (Shift+)F
     - Verificar cor e label de cada modo
     - Verificar estabilidade: verde >70, amarelo 40-70, vermelho <40
     - Verificar performance com 40 províncias (sem lag)
     - Modo Trade não quebra
- **Critérios de aceite:** 13 modos funcionais, sem lag, sem erros
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Performance com 40 províncias. Se lag, revisar `useMemo`

---

*Sprint 04 quebrada — 8 tarefas — Reinos Medievais — Fase 2*
