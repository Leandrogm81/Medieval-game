# Classificação de Sprints por Nível de Coder

> Critério de classificação: complexidade de raciocínio, risco de quebra de estado,
> número de arquivos tocados e necessidade de entender regras de negócio do jogo.

---

## 🟢 CODER SIMPLES (Flash / Haiku / GPT-4o-mini)

> Tarefas mecânicas, sem lógica de negócio nova, sem risco de regressão em gameState.
> O coder só precisa **localizar e editar** elementos existentes.

---

### Sprint 02 — Tamanho de Fonte na UI

**Por que é simples:**

- Alteração puramente de CSS/Tailwind — sem lógica de jogo
- Tarefa mecânica: encontrar classes `text-[7px]` / `text-[8px]` e aumentar 1-2 pontos
- Um arquivo principal: `HUD.tsx`
- Critério de aceite 100% visual — fácil de verificar

**Instrução suficiente para o coder:**
> "Em `HUD.tsx`, substitua todas as classes `text-[7px]` por `text-[9px]`
> e `text-[8px]` por `text-[10px]`. Não altere lógica, apenas Tailwind CSS classes."

**Risco de erro:** Muito baixo. Pior caso: layout estica — reversível com 1 linha.

---

### Sprint 03 — Painel de Informações Completo das Províncias

**Por que é simples (com ressalva):**

- Os dados já existem no `Province` — não há lógica nova a criar
- A tarefa é **renderizar dados existentes** em JSX
- Um arquivo principal: `HUD.tsx` (seção `selectedProvince`)
- Cálculo de recrutáveis é trivial: `Math.floor(pop * 0.1)`
- A ressalva: o coder precisa localizar a seção certa dentro de um arquivo de 739 linhas

**Instrução suficiente para o coder:**
> "Em `HUD.tsx`, dentro do bloco `selectedProvince`, adicione uma seção que exiba:
> `army` (por tipo), `loyalty` (barra visual), `buildings` (contagem por tipo),
> `wealth + foodProduction + materialProduction` (produtividade estimada),
> `Math.floor(population * 0.1)` (recrutáveis) e `strategicResource`.
> Não crie lógica nova — apenas leia e exiba campos existentes do `Province`."

**Risco de erro:** Baixo. Layout pode quebrar se mal dimensionado — reversível.

---

## 🔴 CODER INTELIGENTE (Sonnet / GPT-4o / Gemini Pro / Flash Thinking)

> Tarefas que exigem raciocínio sobre estado de jogo, múltiplos arquivos,
> lógica de negócio nova ou risco de regressão em funcionalidades existentes.

---

### Sprint 01 — Províncias nas Bordas sem Nome

**Por que exige mais:**

- Requer entender o sistema de coordenadas SVG e o algoritmo de geração de polígonos Voronoi
- O bug pode estar em `mapGeneration.ts` (geração do centroid) **ou** em `Map.tsx` (renderização)
- O coder precisa **diagnosticar onde está o problema** antes de corrigir
- Aplicar clamp incorretamente pode deslocar rótulos para dentro de outras províncias

**O que diferencia:** Exige raciocínio espacial e geométrico, não só edição de strings.

---

### Sprint 04 — Persistência de Tropas Durante Marcha

**Por que exige mais:**

- Lógica de estado crítica: `MarchOrder`, `Province.army`, combate pós-marcha
- O bug está em `processMarchOrders` — uma função com múltiplos branches de estado
- Requer entender o ciclo completo: dispatch → processamento → merge → limpeza
- Um erro aqui pode fazer tropas duplicarem, desaparecerem ou combate quebrar para a IA
- Necessita de **deep clone** correto para não mutar o estado original

**O que diferencia:** Risco de regressão alto. Exige leitura profunda de `turnLogic.ts`
e compreensão do modelo de estado imutável do jogo.

---

### Sprint 05 — Aba de Comércio de Recursos

**Por que exige mais:**

- Feature nova que toca 4+ arquivos: `types.ts`, `economyLogic.ts`, `turnLogic.ts`, `HUD.tsx`
- Requer criar nova lógica balanceada (taxas de câmbio com ajuste de escassez)
- Novo campo de estado (`tradesThisTurn`) que precisa ser resetado no turno
- A UI precisa ser projetada do zero (seletor de recurso, slider, preview)
- Risco de inflação se as taxas ou limites forem implementados errado

**O que diferencia:** Múltiplos arquivos + nova lógica de negócio + balanceamento econômico.

---

### Sprint 06 — Sistema de Estabilidade de Província

**Por que exige mais:**

- Novo campo de estado que **afeta a fórmula de eficiência de toda a economia**
- Requer entender como `efficiency` é calculada hoje para integrá-la corretamente
- Risco de loop de regressão (stability → produção → gold → loyalty → stability)
- Vários gatilhos de mudança de stability (conquista, rebelião, guerra, buildings, capital)
- A lógica precisa ser correta **na primeira vez** — bugs aqui afetam todo o jogo

**O que diferencia:** Impacto sistêmico. Altera equações centrais da economia.
Exige raciocínio sobre feedback loops e limites de segurança.

---

## 📊 Tabela Resumo

| Sprint | Tema | Nível de Coder | Motivo resumido |
|--------|------|----------------|-----------------|
| 02 | Tamanho de fonte | 🟢 Simples | CSS puro, um arquivo, sem lógica |
| 03 | Painel de informações | 🟢 Simples | Renderizar dados existentes, sem lógica nova |
| 01 | Bordas do mapa | 🔴 Inteligente | Diagnóstico geométrico + SVG |
| 04 | Persistência de tropas | 🔴 Inteligente | Estado crítico, combate, deep clone |
| 05 | Aba de comércio | 🔴 Inteligente | Múltiplos arquivos, nova lógica + balanceamento |
| 06 | Estabilidade | 🔴 Inteligente | Impacto sistêmico na economia inteira |

---

## 🎯 Estratégia de Execução Recomendada

1. **Comece com o coder simples** nas Sprints 02 e 03 — baixo custo, alto ganho imediato.
2. **Use o coder inteligente** somente para 01, 04, 05 e 06.
3. **Sprint 06 exige revisão humana** após implementação — rode `GAME LOGIC VERIFIER` obrigatoriamente.
