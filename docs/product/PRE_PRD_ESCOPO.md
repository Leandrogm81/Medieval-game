# Pre-PRD — Escopo Consolidado: Reinos Medievais

> **Data:** 03/08/2026
> **Versão:** 1.0
> **Status:** Rascunho para revisão (aguarda PRD_MASTER)
> **Base:** `docs/product/BROWNFIELD_ANALYSIS.md` (02/08/2026)
> **Fontes consolidadas:** PRD-FASE-1 (v2.1), PRD-FASE-2 (v1.1 consolidado), PRD-FASE-3 (v1.0), IMPLEMENTACOES-FUTURAS.md, PLANO-ATUALIZACAO-AOH2.md

---

## 1. Visão do produto

Reinos Medievais é um grand strategy medieval single-player (React 19 + Vite + D3 Voronoi), inspirado em Age of History 2. O jogador governa um reino em mapa procedural: economia, exército, conquista, diplomacia. O objetivo desta consolidação é transformar o jogo de **MVP funcional** em **estratégia completa** com profundidade diplomática, tecnológica e religiosa, com fundação de testes e qualidade.

## 2. Estado atual (resumo do brownfield)

- **Maturidade:** MVP em produção — jogável de ponta a ponta
- **Fase 1 (diplomacia/hotkeys/combate/audiovisual):** ~90% IMPLEMENTADA (diplomacia completa, hotkeys, retreat, mass actions, multi-seleção, SFX, minimapa, partículas, mapa visual rico, mobile)
- **Fase 2 (tech/governos):** ~20% — financeLogic.ts e techLogic.ts existem sem UI; governos, capitulação, IA avançada, música, liberty desire não iniciados
- **Fase 3 (religiões/multiplayer):** 0%
- **Débitos críticos:** zero testes automatizados; tsconfig sem strict; README errado; 946 KB chunk único

## 3. Escopo proposto (consolidado)

### 3.1 Fundação (PRÉ-REQUISITO — antes de features)

| # | Item | Esforço | Prioridade |
|---|---|---|---|
| F1 | Sprint 00B: framework de testes (Vitest) + smoke test | 2-3d | 🔴 Crítica |
| F2 | Testes de regressão para src/logic/ (economia, combate, turno, diplomacia) | 3-4d | 🔴 Crítica |
| F3 | tsconfig strict: true + eliminar `any` | 1d | 🟡 Alta |
| F4 | README correto + limpeza de dependências mortas (express, genai, dotenv) | 0.5d | 🟡 Alta |
| F5 | Migrar docs/ avulsos (prd/) para o framework docs/ | 0.5d | 🟡 Alta |

### 3.2 Fase 1 — Restante (gap pós-brownfield)

| # | Item | Esforço | Prioridade |
|---|---|---|---|
| 1.1 | Completar UI de tecnologia (techPoints visíveis, alocação) | 2d | 🔴 Crítica |
| 1.2 | Tratados de paz completos (peace deals, não só exaustão) | 2d | 🟡 Alta |
| 1.3 | Melhorar UI de vassalagem | 1d | 🟡 Alta |
| 1.4 | Flavor text diplomático | 1d | 🟢 Média |

### 3.3 Fase 2 — Tecnologia, Governos e Profundidade

| # | Item | Esforço | Prioridade |
|---|---|---|---|
| 2.1 | Sistema de Tecnologia completo (4 categorias, custo triangular 10+5n(n+1)/2) | 3d | 🔴 Crítica |
| 2.2 | Capitulação / auto-surrender | 1.5d | 🔴 Crítica |
| 2.3 | Sistema de Governos (Monarchy, Republic, etc., trade-offs) | 2.5d | 🔴 Crítica |
| 2.4 | Novos modos de mapa (Growth, Military Strength) | 2d | 🟡 Alta |
| 2.5 | Sistema de Empréstimos (fórmula paymentPerTurn = ceil(amount*1.15/10)) | 1d | 🟡 Alta |
| 2.6 | IA Avançada (calculateMilitaryPower, respostas a ações) | 2.5d | 🟡 Alta |
| 2.7 | Música ambiente (MP3 CC0, `<audio>` nativo) | 4d | 🟢 Média |
| 2.8 | Responsividade de modais | 1d | 🟢 Média |
| 2.9 | Liberty Desire dos vassalos | 1.5d | 🟢 Média |
| 2.10 | Tela de derrota narrativa | 1d | 🟢 Média |

**Subtotal Fase 2: 20d** (estimativa revisada da Fase 2 original)

### 3.4 Fase 3 — Conteúdo Avançado (após Fases 1-2)

| # | Item | Esforço | Prioridade |
|---|---|---|---|
| 3.1 | Sistema de Religiões (8 religiões, conversão, efeitos diplomáticos) | 3d | 🔴 Crítica |
| 3.2 | Maravilhas / Wonders | 3d | 🔴 Crítica |
| 3.3 | Editor de Cenários | 5d | 🟡 Alta |
| 3.4 | Conquistas / Achievements | 1.5d | 🟡 Alta |
| 3.5 | Armas Atômicas | 2d | 🟢 Média |
| 3.6 | Multiplayer / Hot-seat | 8d | 🟢 Média |
| 3.7 | i18n | 3d | 🟢 Média |
| 3.8 | Replay / Crônica animada | 3d | 🔵 Baixa |
| 3.9 | PWA | 2d | 🔵 Baixa |
| 3.10 | Suporte a Mods | 5d | 🔵 Baixa |

**Subtotal Fase 3: 35.5d**

## 4. Fora de escopo (agora)

- Multiplayer online (só hot-seat local na Fase 3)
- Mapa mundi real (13.892 províncias) — arquitetura diferente, ficar com procedural
- Mudança de stack
- Monetização, contas, backend

## 5. Decisões já tomadas (herdadas dos PRDs)

| Decisão | Fonte |
|---|---|
| Custo tech triangular: `10 + 5 * level * (level + 1) / 2` | PRD-FASE-2 P1 |
| Música: MP3 CC0 (OpenGameArt/Pixabay), `<audio>` nativo | PRD-FASE-2 P2 |
| Províncias distantes (Republic): ≥2 saltos BFS da capital sofrem -10% estabilidade | PRD-FASE-2 P4 |
| calculateMilitaryPower = soma total de tropas × bônus tech/governo | PRD-FASE-2 P5 |
| Modo trade mantido com atalho T | PRD-FASE-2 P6 |
| Imutabilidade de estado: deep clone obrigatório (MAESTRO K03) | MAESTRO.md |
| Fórmula empréstimo: `Math.ceil((amount * 1.15) / 10)` | PRD-FASE-2 I2 |
| AP mínimo: `Math.max(2, valorCalculado)` | PRD-FASE-2 I5 |

## 6. Riscos principais

| Risco | Mitigação |
|---|---|
| Features sem testes → regressões | F1/F2 (fundação de testes) ANTES de qualquer feature |
| Escopo grande (60d+) em sessões curtas | Fases sequenciais com auditoria no fim de cada uma |
| Saves antigos quebram com novos campos | Migração com defaults (PRD-FASE-2 O2) |
| Fase 3 multiplayer pode virar projeto paralelo | Hot-seat primeiro; online fora de escopo |

## 7. Perguntas em aberto para o PRD_MASTER

1. Fase 2 completa (20d) de uma vez ou fatiar: Tech+Governos primeiro, resto depois?
2. Música ambiente (4d) — incluir ou cortar do ciclo 1?
3. Prioridade real do usuário: profundidade estratégica (Fase 2) ou conteúdo (Fase 3)?
4. Hot-seat multiplayer é desejado de fato, ou era especulativo?

## 8. Recomendação de próximo passo

**PRD_MASTER** — transformar este escopo em PRD.md versionado, com critérios de aceite por feature, seguido de:
1. Revisão crítica do PRD (PRD_REVIEW)
2. Plano de implementação (IMPLEMENTATION_PLAN)
3. Sprint 0 → Sprint 00B (testes) → Fase 1 restante
