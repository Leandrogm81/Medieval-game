# Sprint 04 — Novos Modos de Mapa

**Objetivo:** Adicionar 7 novos modos de visualização ao mapa com heatmaps e labels, e atalhos de teclado correspondentes.

**Nível de dificuldade:** 🟡 Médio — use coder BARATO para TODAS as tarefas

**Dependências:** Sprint 01 (ViewMode expandido)

**Tempo estimado:** 2.0 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Editar | `src/components/Map.tsx` | Barato |
| Editar | `src/App.tsx` | Barato |

---

## Tarefas

### T1 — Expandir `ViewMode` em `types.ts` 🟢 Barato
- Adicionar ao union type existente:
```typescript
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade'
  | 'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength';
```
- Critério de aceite: `tsc --noEmit` passa

### T2 — Adicionar lógica de coloração para cada novo modo em `Map.tsx` 🟡 Barato
- Na seção de `fillColor` (após linha 263), adicionar branches:

| Modo | Cor | Cálculo |
|------|-----|---------|
| `'population'` | Verde escuro | `pop / maxPop` → hsl(120, 60%, 25-60%) |
| `'development'` | Azul | `(wealth + sum(buildings)) / maxDev` → hsl(210, 60%, 25-60%) |
| `'income'` | Dourado | `goldIncome / maxIncome` → hsl(45, 80%, 25-60%) |
| `'stability'` | Branco→Vermelho | >70 branco, 40-70 amarelo, <40 vermelho |
| `'buildings'` | Roxo | `sum(buildings) / maxBuildings` → hsl(270, 60%, 25-60%) |
| `'growth'` | Ciano | `growthRate / maxGrowth` → hsl(180, 60%, 25-60%) |
| `'military_strength'` | Laranja | `troops / maxTroops` → hsl(30, 80%, 25-60%) |

- Calcular `maxPop`, `maxDev`, `maxIncome`, etc. via `useMemo` percorrendo todas as províncias
- Critério de aceite: cada modo renderiza com o heatmap correto

### T3 — Adicionar labels para cada novo modo em `Map.tsx` 🟡 Barato
- Na seção de labels (após linha 311), adicionar branches:

| Modo | Label | Formato |
|------|-------|---------|
| `'population'` | População | `"12.450"` |
| `'development'` | Desenvolvimento | `"Dev: 45"` |
| `'income'` | Renda | `"+320g"` |
| `'stability'` | Estabilidade | `"85%"` |
| `'buildings'` | Edifícios | `"🏘️4"` |
| `'growth'` | Crescimento | `"+3%"` |
| `'military_strength'` | Força Militar | `"⚔️45"` |

- Critério de aceite: cada modo mostra label correto

### T4 — Adicionar atalhos de teclado em `App.tsx` 🟢 Barato
- No keydown handler (linhas 261-275), adicionar:
```typescript
case '6': ui.setViewMode('population'); return;
case '7': ui.setViewMode('development'); return;
case '8': ui.setViewMode('income'); return;
case '9': ui.setViewMode('stability'); return;
case '0': ui.setViewMode('buildings'); return;
case 'G': case 'g': ui.setViewMode('growth'); return;
case 'F': case 'f': ui.setViewMode('military_strength'); return;
case 'T': case 't': ui.setViewMode('trade'); return;
```
- ⚠️ **ATENÇÃO:** `F` já é usado para fullscreen (linha 285). Se conflitar, use `Shift+F` para força militar ou negocie com o usuário
- Critério de aceite: 1-9, 0, T, G, (Shift+)F funcionam

### T5 — Verificar modo Trade 🟢 Barato
- Confirmar que `'trade'` renderiza algo (rotas comerciais)
- Se não houver visualização, implementar básica: desenhar linhas entre províncias com `tradeRoutes`
- Critério de aceite: modo Trade funcional

---

## Critérios de aceite da sprint
- [ ] 13 modos de mapa funcionais (6 existentes + 7 novos)
- [ ] Cada modo mostra cor/label correta
- [ ] Estabilidade: verde (>70), amarelo (40-70), vermelho (<40)
- [ ] Todos os atalhos (1-9, 0, T, G, F) funcionam
- [ ] Modo Trade preservado

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar cada atalho de teclado, verificar heatmaps
```

---

## Riscos
- **Performance:** 13 modos com 40 províncias. Calcular `maxPop`, `maxDev` etc. via `useMemo` para evitar recálculo a cada frame
- **Modo trade sem renderização:** Se `tradeRoutes` não tiver visualização, criar SVG `<line>` entre centros das províncias
- **Atalho `F` conflitante:** fullscreen (linha 285) vs military_strength. **Resolver antes de implementar**

---

## O que NÃO deve ser alterado
- Lógica de jogo — apenas visualização
- `src/logic/*` — nenhum arquivo de lógica
- Estrutura de pan/zoom do mapa

---

*Sprint 04 — Modos de Mapa — Reinos Medievais — Fase 2*
