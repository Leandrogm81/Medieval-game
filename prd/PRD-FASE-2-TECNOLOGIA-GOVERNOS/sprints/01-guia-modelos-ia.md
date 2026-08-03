# Guia de Modelos IA — Fase 2: Tecnologia, Governos e Profundidade Estratégica

> Referência rápida: qual modelo usar em cada sprint do projeto Reinos Medievais.
> Baseado no `00-guia-dificuldade.md` e nas cotas disponíveis (Antigravity, Codex, OpenCode Go).
> **Prefeŕencia do desenvolvedor:** DeepSeek V4 Pro, DeepSeek V4 Flash, GPT 5.4 Mini, Gemini Flash — não estouram cotas facilmente.

---

## Resumo do Guia de Dificuldade

| Nível | Símbolo | Descrição | Coder |
|-------|---------|-----------|-------|
| 🟢 Fácil | E | Funções puras, CSS, tipos, CRUD simples. 1-2 arquivos. | Barato |
| 🟡 Médio | M | Integração entre 2-3 arquivos, lógica com condicionais, UI simples. | Barato com supervisão |
| 🟠 Difícil | D | Refatoração de fluxo existente, UI complexa, múltiplos call sites. | Forte |
| 🔴 Muito Difícil | MD | Reescrita de função central, alteração de arquitetura, integração global. | Forte obrigatório |

**Distribuição:** 70% das tarefas são baratas, 30% exigem coder forte.

---

## Modelos Disponíveis por Provedor

### 🔵 OpenCode Go — $10/mês (principal)

| Modelo | Req/5h | Preço (in/out por 1M tokens) | Contexto | Destaque |
|--------|--------|------------------------------|----------|----------|
| DeepSeek V4 Flash ⭐ | 31.650 | $0.14 / $0.28 | 128K | Ultraleve, não estoura cota |
| Qwen3.5 Plus | 10.200 | $0.20 / $1.20 | 128K | Backup barato abundante |
| DeepSeek V4 Pro ⭐ | 3.450 | $0.44 / $0.87 | 1M | Melhor custo-benefício, alucinação 6%, AA Agentic 67.2 |
| MiniMax M2.7 | 3.400 | $0.30 / $1.20 | 196K | SWE-Bench Pro 56.2%, barato |
| Qwen3.6 Plus | 3.300 | $0.50 / $3.00 | 128K | Intermediário |
| MiMo-V2.5-Pro | 1.290 | $1.00 / $3.00 | 1M | AA Agentic 67.4, agente mais forte |
| Kimi K2.6 | 1.150 | $0.75 / $3.50 | 262K | GPQA Diamond 91.1%, agent swarm |
| GLM-5.1 | 880 | $1.05 / $3.50 | 200K | SWE-Bench Pro 58.4%, melhor coding |

⭐ = preferência do desenvolvedor

### 🟣 OpenAI Codex — Plus $20/mês (ou API pay-per-token)

| Modelo | Preço (in/out por 1M tokens) | Destaque |
|--------|------------------------------|----------|
| gpt-5.4-mini ⭐ | $0.75 / $4.50 | Rápido, eficiente, não estoura cota |
| gpt-5.4 | $2.50 / $15.00 | Flagship, tarefas complexas |
| gpt-5.3-codex | $1.25 / $10.00 | Líder em coding (API) |
| gpt-5.5 | $5.00 / $30.00 | Frontier, máxima capacidade |
| gpt-5.3-codex-spark | — | Research preview (Pro $100+/mês) |

### 🟢 Google Antigravity — Grátis (cotas limitadas)

| Modelo | Tipo | Observação |
|--------|------|------------|
| Gemini 3 Flash ⭐ | Leve/rápido | Não estoura cota, ideal para tarefas simples |
| GPT-OSS-120b | Open-source | Alternativa gratuita |
| Gemini 3.1 Pro (low) | Médio | Balanço性能/cota |
| Gemini 3.1 Pro (high) | Pesado | Melhor performance Google |
| Claude Sonnet 4.6 | Forte | Coding sólido |
| Claude Opus 4.6 | Máximo | Deep reasoning, queima cota rápido |

⚠️ Cotas gratuitas do Antigravity foram reduzidas em até 92% desde dez/2025. Um chat com Opus 4.6 pode consumir 635+ créditos.

### 🔴 OpenRouter — último recurso

Acesso a todos os modelos, mas com precificação API normal. Claude Opus 4.6: $15/$75 por 1M tokens. Só usar em emergência.

---

## Classificação por Categoria

### 🟢 BARATO — Tarefas fáceis e médias (~70% do projeto)

| Prioridade | Modelo | Provedor | Custo |
|------------|--------|----------|-------|
| ⭐ 1 | **DeepSeek V4 Flash** | OpenCode Go | $0 (na cota) |
| ⭐ 2 | **Gemini 3 Flash** | Antigravity | Grátis |
| ⭐ 3 | **gpt-5.4-mini** | Codex | Baixo |
| 4 | Qwen3.5 Plus | OpenCode Go | $0 (na cota) |
| 5 | Qwen3.6 Plus | OpenCode Go | $0 (na cota) |
| 6 | GPT-OSS-120b | Antigravity | Grátis |

### 🟡 BOM CUSTO-BENEFÍCIO — Tarefas médias complexas

| Prioridade | Modelo | Provedor | Por quê |
|------------|--------|----------|---------|
| ⭐ 1 | **DeepSeek V4 Pro** | OpenCode Go | 1M contexto, baixa alucinação, preço baixo |
| 2 | MiniMax M2.7 | OpenCode Go | SWE-Bench 56.2%, mais barato da lista |
| 3 | gpt-5.4 | Codex | Sólido, mas usar com moderação |
| 4 | Gemini 3.1 Pro (low) | Antigravity | Grátis, boa capacidade |

### 🔴 FORTE (CARO) — Tarefas difíceis e muito difíceis (~30% do projeto)

| Prioridade | Modelo | Provedor | Por quê |
|------------|--------|----------|---------|
| ⭐ 1 | **GLM-5.1** | OpenCode Go | SWE-Bench Pro 58.4% — melhor coding open-source |
| 2 | Kimi K2.6 | OpenCode Go | Agent swarm, GPQA Diamond 91.1% |
| 3 | MiMo-V2.5-Pro | OpenCode Go | AA Agentic 67.4, agente mais forte, 1M contexto |
| 4 | gpt-5.4 | Codex | Sólido para tarefas complexas |
| 5 | Claude Sonnet 4.6 | Antigravity | Forte, mas cuidado com a cota |
| 6 | Claude Opus 4.6 | Antigravity | Máximo, queima cota MUITO rápido |
| 7 | gpt-5.5 | Codex | Frontier, último caso antes do OpenRouter |
| 🆘 | Claude Opus 4.6 | OpenRouter | **Último recurso absoluto** |

---

## Recomendação por Sprint (Sprint Inteiro)

> Cada sprint deve ser executado de uma vez com um único modelo.
> A recomendação considera o nível máximo de dificuldade do sprint.

### Sprint 00 — Preparação e Leitura
- **Nível máximo:** 🟢 Fácil
- **Tempo:** 0.5 dia
- **Coder recomendado:** 🟢 **BARATO**
- **Modelo:** **DeepSeek V4 Flash** (OpenCode Go)
- **Alternativas:** Gemini 3 Flash (Antigravity), gpt-5.4-mini (Codex)
- **Tarefas:** Inspecionar 15 arquivos, verificar dependências (npm install, tsc, build)
- **Nota:** Sprint inteiramente de leitura. Nenhuma lógica de jogo envolvida.

---

### Sprint 01 — Tipos Base + Sistema de Tecnologia
- **Nível máximo:** 🔴 Muito Difícil (T5 combat tech, T7 modal)
- **Tempo:** 3.5 dias
- **Coder recomendado:** 🔴 **FORTE**
- **Modelo principal:** **GLM-5.1** (OpenCode Go) ou **gpt-5.4** (Codex)
- **Alternativa forte:** Kimi K2.6 (OpenCode Go) — agent swarm útil para as 10 tarefas
- **Estratégia mista (recomendada):**
  1. Tarefas baratas (T1-T4, T6, T8-T10) → **DeepSeek V4 Pro** (bom custo-benefício)
  2. T5 (combat tech) + T7 (TechnologyModal) → trocar para **GLM-5.1**
- **Tarefas críticas:** T5 — integrar bônus de combat (resolveCombat não recebe Realm, decidir refactor vs aplicar no caller). T7 — UI complexa com 4 categorias, barras, interações.

---

### Sprint 02 — Capitulação (Auto-Surrender)
- **Nível máximo:** 🟠 Difícil (T5 BFS+cede, T6 fluxo de guerras)
- **Tempo:** 1.5 dia
- **Coder recomendado:** 🔴 **FORTE**
- **Modelo principal:** **GLM-5.1** (OpenCode Go) ou **MiMo-V2.5-Pro** (1M contexto)
- **Alternativa forte:** Kimi K2.6 (OpenCode Go)
- **Estratégia mista (recomendada):**
  1. Tarefas baratas (T1-T4, T7) → **DeepSeek V4 Pro**
  2. T5 (selectProvincesToCede + executeCapitulation) + T6 (integrar em processActiveWars) → trocar para **GLM-5.1**
- **Tarefas críticas:** T5 — BFS + vassalagem + eliminação de reino. T6 — modificar fluxo de controle do loop de guerras.

---

### Sprint 03 — Sistema de Governos
- **Nível máximo:** 🔴 Muito Difícil (T3 integrar bônus em múltiplos pontos)
- **Tempo:** 2.5 dias
- **Coder recomendado:** 🔴 **FORTE**
- **Modelo principal:** **GLM-5.1** (OpenCode Go) ou **gpt-5.4** (Codex)
- **Alternativa forte:** Kimi K2.6 (OpenCode Go)
- **Estratégia mista (recomendada):**
  1. Tarefas baratas (T1-T2, T4, T6-T8) → **DeepSeek V4 Pro**
  2. T3 (applyGovernmentBonuses) + T5 (GovernmentModal) → trocar para **GLM-5.1**
- **Tarefas críticas:** T3 — afeta renda, AP, tech, recrutamento em múltiplos pontos de integração. T5 — UI com 7 governos, custos, confirmação.

---

### Sprint 04 — Novos Modos de Mapa
- **Nível máximo:** 🟡 Médio
- **Tempo:** 2.0 dias
- **Coder recomendado:** 🟢 **BARATO**
- **Modelo:** **DeepSeek V4 Flash** (OpenCode Go)
- **Alternativas:** Gemini 3 Flash (Antigravity), gpt-5.4-mini (Codex)
- **Tarefas:** Expandir ViewMode, coloração de 7 modos (switch/case com heatmaps), labels, atalhos de teclado.
- **Nota:** Sprint inteira de visualização. Nenhuma lógica de jogo. Coder barato é suficiente.

---

### Sprint 05 — Empréstimos + IA Avançada
- **Nível máximo:** 🔴 Muito Difícil (T6 refatorar declareWar, T10 reescrever processAI)
- **Tempo:** 3.5 dias
- **Coder recomendado:** 🔴 **FORTE**
- **Modelo principal:** **GLM-5.1** (OpenCode Go) ou **Kimi K2.6** (agent swarm)
- **Alternativa forte:** MiMo-V2.5-Pro (1M contexto), gpt-5.4 (Codex)
- **Estratégia mista (recomendada):**
  1. Tarefas baratas (T1-T5, T7-T9, T11) → **DeepSeek V4 Pro**
  2. T6 (refatorar declareWar) + T10 (reescrever processAI) → trocar para **GLM-5.1**
  3. Revisão final da IA → **Kimi K2.6** (agent swarm para validar)
- **Tarefas críticas:** T6 — adaptar call sites para interface de diplomacyLogic.declareWar. T10 — reescrita completa da IA central.

---

### Sprint 06 — Música Ambiente
- **Nível máximo:** 🟡 Médio
- **Tempo:** 4.0 dias
- **Coder recomendado:** 🟢 **BARATO**
- **Modelo:** **DeepSeek V4 Flash** (OpenCode Go)
- **Alternativas:** Gemini 3 Flash (Antigravity), gpt-5.4-mini (Codex)
- **Tarefas:** Obter assets MP3 (CC0), musicLogic.ts (API de `<audio>` nativa), integrar em App.tsx, toggle no HUD.
- **Nota:** Música é isolada do resto do jogo. Maior sprint em dias, mas 100% barata.

---

### Sprint 07 — Liberty Desire + Tela de Derrota + Responsividade
- **Nível máximo:** 🔴 Muito Difícil (T2 vassalLiberty, T7 GameEndModal)
- **Tempo:** 3.5 dias
- **Coder recomendado:** 🔴 **FORTE**
- **Modelo principal:** **GLM-5.1** (OpenCode Go) ou **MiMo-V2.5-Pro** (1M contexto)
- **Alternativa forte:** gpt-5.4 (Codex)
- **Estratégia mista (recomendada):**
  1. Tarefas baratas (T1, T3-T6, T8) → **DeepSeek V4 Pro**
  2. T2 (processVassalLiberty) + T7 (GameEndModal) → trocar para **GLM-5.1**
- **Tarefas críticas:** T2 — múltiplos fatores, clamping, rebelião com declareWar, padrão imutável. T7 — UI com template condicional, estatísticas reais, frases aleatórias.

---

### Sprint 08 — Migração de Save + Testes de Integração
- **Nível máximo:** 🟡 Médio
- **Tempo:** 2.0 dias
- **Coder recomendado:** 🟢 **BARATO**
- **Modelo:** **DeepSeek V4 Flash** (OpenCode Go)
- **Alternativas:** Gemini 3 Flash (Antigravity), gpt-5.4-mini (Codex)
- **Tarefas:** Adicionar schemaVersion, saveMigration.ts (aplicar defaults com `??`), integrar migrateSaveGame, testes manuais.
- **Nota:** Sprint inteira sem lógica complexa.

---

## Resumo Executivo

### Sprints BARATOS (usar DeepSeek V4 Flash / Gemini 3 Flash / gpt-5.4-mini)

| Sprint | Nome | Dias | Modelo |
|--------|------|------|--------|
| 00 | Preparação | 0.5 | DeepSeek V4 Flash |
| 04 | Modos de Mapa | 2.0 | DeepSeek V4 Flash |
| 06 | Música Ambiente | 4.0 | DeepSeek V4 Flash |
| 08 | Migração + Testes | 2.0 | DeepSeek V4 Flash |
| **Total** | | **8.5 dias** | |

### Sprints FORTES (usar GLM-5.1 / Kimi K2.6 / gpt-5.4)

| Sprint | Nome | Dias | Tarefas Críticas | Modelo Forte |
|--------|------|------|------------------|--------------|
| 01 | Tecnologia | 3.5 | T5 (combat), T7 (modal) | GLM-5.1 |
| 02 | Capitulação | 1.5 | T5 (cede), T6 (guerras) | GLM-5.1 |
| 03 | Governos | 2.5 | T3 (bônus), T5 (modal) | GLM-5.1 |
| 05 | Empréstimos + IA | 3.5 | T6 (declareWar), T10 (processAI) | GLM-5.1 + Kimi K2.6 |
| 07 | Liberty + Derrota | 3.5 | T2 (vassalLiberty), T7 (GameEndModal) | GLM-5.1 |
| **Total** | | **14.5 dias** | | |

### Estratégia por Sprint Forte

Para os 5 sprints que exigem coder forte, use a abordagem em duas fases:

1. **Fase 1 (70% do sprint):** Execute com **DeepSeek V4 Pro** todas as tarefas baratas/médias do sprint
2. **Fase 2 (30% do sprint):** Troque para **GLM-5.1** apenas para as 2-3 tarefas críticas

Isso preserva a cota do GLM-5.1 (apenas 880 req/5h) para onde realmente importa.

### Ordem de Prioridade dos Modelos

```
Tarefas 🟢 Fáceis / 🟡 Médias:
  1. DeepSeek V4 Flash     ← padrão, não gasta cota
  2. Gemini 3 Flash         ← queimar cota gratuita do Antigravity
  3. gpt-5.4-mini           ← queimar cota Plus do Codex
  4. DeepSeek V4 Pro        ← quando precisa de 1M contexto

Tarefas 🟠 Difíceis / 🔴 Muito Difíceis:
  1. GLM-5.1                ← reservar para as ~10 tarefas críticas
  2. Kimi K2.6              ← backup quando GLM-5.1 acabar cota
  3. MiMo-V2.5-Pro          ← quando precisar de 1M contexto + agente forte
  4. gpt-5.4                ← se sobrar cota Codex Plus
  5. Claude Opus 4.6        ← Antigravity (queima cota rápido)
  6. OpenRouter              ← só em emergência absoluta
```

---

*Guia gerado em 08/05/2026 — Reinos Medievais — Fase 2*
*Fontes: OpenCode Go docs, OpenAI Pricing, Google Antigravity docs, Hermes Agent providers, SWE-Bench Pro, GDPval-AA benchmarks*
