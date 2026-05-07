# Implementações Futuras — Reinos Medievais

> **Versão:** 2.0
> **Data:** 07/05/2026
> **Baseado em:** Análise comparativa Age of History 2 (Original + Definitive Edition)
> **Propósito:** Roadmap unificado de funcionalidades para aproximar Reinos Medievais da profundidade de Age of History 2

---

## 📊 Visão Geral das Fases

```
Alto Impacto │
    │
    │ 🟢 FASE 1 (7-10d)  │ 🟡 FASE 2 (10-15d)     │ 🔴 FASE 3 (15-30d)
    │                    │                        │
    │ • Diplomacia       │ • Tecnologia           │ • Religiões
    │ • Hotkeys          │ • Capitulação          │ • Maravilhas
    │ • Army Retreat     │ • Governos             │ • Nukes
    │ • Mass Actions     │ • Modos Mapa           │ • Editor Cenários
    │ • Multi-Seleção    │ • Empréstimos          │ • Multiplayer
    │ • Flavor Text      │ • IA Avançada          │ • Achievements
    │ • Efeitos Sonoros  │ • Música Ambiente      │ • i18n
    │ • Minimapa         │ • Responsividade Modal │ • PWA
    │ • Partículas       │ • Vassalo Liberty      │ • Replay/Crônica
    │                    │ • Derrota Narrativa    │ • Mods/Workshop
    └────────────────────┴────────────────────────┴──────────────────────▶
   Baixo esforço / Alto impacto           Alto esforço / Menor impacto
```

---

## 🟢 FASE 1 — Essencial (7-10 dias)

Funcionalidades de maior impacto com menor esforço de implementação.

| # | Funcionalidade | Origem | Esforço | Impacto | PRD |
|---|---|---|---|---|---|
| 1 | **Sistema de Diplomacia Completo** | AoH2 DE | 3-4d | 🌟🌟🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 2 | **Hotkeys / Atalhos de Teclado** | AoH2 DE | 0.5d | 🌟🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 3 | **Army Retreat (Recuo de Exército)** | AoH2 DE | 1d | 🌟🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 4 | **Ações em Massa nas Províncias** | AoH2 DE | 1d | 🌟🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 5 | **Múltipla Seleção de Exércitos** | AoH2 DE | 1.5d | 🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 6 | **Efeitos Sonoros (SFX)** | Original V1 | 1d | 🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 7 | **Minimapa** | Original V1 | 1d | 🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |
| 8 | **Efeitos de Partículas** | Original V2 | 1d | 🌟🌟🌟 | [PRD-FASE-1](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md) |

**Total estimado:** 7-10 dias
**PRD:** [prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md](prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS.md)

### Resumo Técnico

| Arquivos Novos | Arquivos Modificados |
|---|---|
| `src/logic/diplomacyLogic.ts` | `src/types.ts` |
| `src/logic/sfxLogic.ts` | `src/hooks/useGameController.ts` |
| `src/components/Minimap.tsx` | `src/hooks/useUI.ts` |
| | `src/components/HUD.tsx` |
| | `src/components/DiplomacyModal.tsx` (reescrito) |
| | `src/components/Map.tsx` |
| | `src/logic/combatLogic.ts` |
| | `src/logic/turnLogic.ts` |
| | `src/logic/economyLogic.ts` |
| | `src/App.tsx` |
| | `src/index.css` |

---

## 🟡 FASE 2 — Profundidade (10-15 dias)

Funcionalidades que adicionam camadas estratégicas significativas.

| # | Funcionalidade | Origem | Esforço | Impacto | PRD |
|---|---|---|---|---|---|
| 1 | **Sistema de Tecnologia** | AoH2 DE | 3d | 🌟🌟🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 2 | **Capitulação (Auto-Surrender)** | AoH2 DE | 1d | 🌟🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 3 | **Sistema de Governos** | AoH2 DE | 2d | 🌟🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 4 | **Novos Modos de Mapa** | AoH2 DE | 2d | 🌟🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 5 | **Sistema de Empréstimos** | AoH2 DE | 1d | 🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 6 | **IA Avançada** | AoH2 DE + Original | 2d | 🌟🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 7 | **Música Ambiente** | Original V2 | 1d | 🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 8 | **Responsividade de Modais** | Original V1 | 1d | 🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 9 | **Liberty Desire dos Vassalos** | AoH2 DE | 1d | 🌟🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |
| 10 | **Tela de Derrota Narrativa** | Original V2 | 0.5d | 🌟🌟 | [PRD-FASE-2](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md) |

**Total estimado:** 10-15 dias
**PRD:** [prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md](prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS.md)

### Resumo Técnico

| Arquivos Novos | Arquivos Modificados |
|---|---|
| `src/logic/technologyLogic.ts` | `src/types.ts` |
| `src/logic/governmentLogic.ts` | `src/hooks/useGameController.ts` |
| `src/components/TechnologyModal.tsx` | `src/hooks/useUI.ts` |
| `src/components/GovernmentModal.tsx` | `src/components/HUD.tsx` |
| | `src/components/Map.tsx` |
| | `src/components/GameEndModal.tsx` |
| | `src/logic/aiLogic.ts` |
| | `src/logic/economyLogic.ts` |
| | `src/logic/turnLogic.ts` |
| | `src/App.tsx` |

---

## 🔴 FASE 3 — Longo Prazo (15-30 dias)

Funcionalidades de escopo amplo que transformam o jogo completo.

| # | Funcionalidade | Origem | Esforço | Impacto | PRD |
|---|---|---|---|---|---|
| 1 | **Sistema de Religiões** | AoH2 DE | 3d | 🌟🌟🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 2 | **Maravilhas (Wonders)** | AoH2 DE | 3d | 🌟🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 3 | **Editor de Cenários Básico** | AoH2 + Original | 5d | 🌟🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 4 | **Conquistas / Achievements** | AoH2 DE + Original | 1.5d | 🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 5 | **Armas Atômicas / Nukes** | AoH2 DE | 2d | 🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 6 | **Multiplayer / Hot-seat** | Original V3 | 8d | 🌟🌟🌟🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 7 | **Suporte i18n (Múltiplos Idiomas)** | Original V3 | 3d | 🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 8 | **Replay / Crônica Animada** | Original V3 | 3d | 🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 9 | **PWA / Service Worker** | Original V2 | 2d | 🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |
| 10 | **Suporte a Mods / Workshop** | Original V3 | 5d | 🌟🌟 | [PRD-FASE-3](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md) |

**Total estimado:** 15-30 dias
**PRD:** [prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md](prd/PRD-FASE-3-RELIGIOES-MARAVILHAS.md)

### Resumo Técnico

| Arquivos Novos | Arquivos Modificados |
|---|---|
| `src/logic/religionLogic.ts` | `src/types.ts` |
| `src/logic/wonderLogic.ts` | `src/hooks/useGameController.ts` |
| `src/logic/achievementLogic.ts` | `src/hooks/useUI.ts` |
| `src/logic/nukeLogic.ts` | `src/components/HUD.tsx` |
| `src/components/ScenarioEditor.tsx` | `src/components/Map.tsx` |
| `src/components/AchievementsModal.tsx` | `src/logic/aiLogic.ts` |
| `src/components/ReplayModal.tsx` | `src/logic/economyLogic.ts` |
| `src/i18n/` | `src/logic/turnLogic.ts` |
| | `src/logic/mapGeneration.ts` |
| | `src/App.tsx` |
| | `src/persistence.ts` |

---

## 🎯 Features Completas (Já Implementadas)

Estas funcionalidades já existem e NÃO precisam ser implementadas:

| Sistema | Funcionalidades |
|---|---|
| **Mapa** | Voronoi procedural, 5 modos de visão, pan/zoom |
| **Combate** | ResolveCombat com terreno, marcha BFS, war score, exaustão |
| **Economia** | Gold/Food/Materials, construções, trade routes, trade exchange |
| **Unidades** | Infantry, Archers, Cavalry, Scouts; recrutamento, disband |
| **Estado** | Deep clone, save/load, autosave, turn summary |
| **IA** | Ataque, recrutamento, construção, declaração de guerra |
| **Política** | Vassalos com tributo, coalizões, overextension |
| **UI** | Menu premium, HUD responsivo, modais, toasts, tela cheia |
| **Eventos** | Aleatórios (praga, boa colheita, incêndio, explosão econômica) |

---

## 📋 Matriz Completa de Features por Sistema

### 👑 Diplomacia

| Feature | Status | Fase |
|---|---|---|
| Declarar guerra | ✅ | — |
| Alianças (UI + lógica) | ❌ | 1 |
| Pacto de Não-Agressão | ❌ | 1 |
| Pacto Defensivo | ❌ | 1 |
| Melhorar/Deteriorar Relações | ❌ | 1 |
| Oferecer/Exigir Tributo | ❌ | 1 |
| Propor União | ❌ | 2 |
| Intervir em Guerra (Enforce Peace) | ❌ | 2 |
| Enviar Exército Voluntário | ❌ | 2 |
| Compartilhar Tecnologia | ❌ | 2 |
| Recrutar Mercenários | ❌ | 2 |
| Sanções | ❌ | 2 |
| Cúpula Diplomática | ❌ | 3 |
| Investir/Construir em Província Alheia | ❌ | 3 |
| Empréstimo/Perdão de Dívida | ❌ | 2 |
| Realocar População | ❌ | 3 |
| Flavor Text Diplomático | ❌ | 1 |

### ⚔️ Guerra & Combate

| Feature | Status | Fase |
|---|---|---|
| Sistema de Batalha | ✅ | — |
| Marcha de Tropas (BFS) | ✅ | — |
| War Score / Exaustão | ✅ | — |
| Captura de Capital | ✅ | — |
| Múltipla Seleção de Exércitos | ❌ | 1 |
| Army Retreat (Recuo) | ❌ | 1 |
| Capitulação (Auto-Surrender) | ❌ | 2 |
| Transferir Vassalos na Paz | ❌ | 2 |
| Baixas em Todas as Guerras | ❌ | 2 |
| Nukes / Armas Atômicas | ❌ | 3 |
| AI Army Control | ❌ | 3 |

### 🏛️ Governos & Política

| Feature | Status | Fase |
|---|---|---|
| Vassalos + Tributo | ✅ | — |
| Coalizões Anti-Expansionistas | ✅ | — |
| Tipos de Governo (Monarchy, Republic...) | ❌ | 2 |
| Mudança de Governo (Decisão/Ultimato) | ❌ | 2 |
| Revoluções | ❌ | 2 |
| Liberty Desire dos Vassalos | ❌ | 2 |
| Tribos → Civilização | ❌ | 3 |

### 📖 Religiões

| Feature | Status | Fase |
|---|---|---|
| Religiões por Província/Reino | ❌ | 3 |
| Influência em Diplomacia | ❌ | 3 |
| Eventos de Conversão | ❌ | 3 |
| Modo de Mapa: Religiões | ❌ | 3 |
| Bônus por Religião | ❌ | 3 |

### 🔬 Tecnologia

| Feature | Status | Fase |
|---|---|---|
| Pontos de Tecnologia | ❌ | 2 |
| Alocação em Categorias (Movement, Assimilation, Combat, Recruitment) | ❌ | 2 |
| Bônus por Nível | ❌ | 2 |
| Efeito no Combate | ❌ | 2 |
| Visualização de Tech por Civilização | ❌ | 2 |
| Felicidade ao Pesquisar | ❌ | 2 |
| Compartilhar Tecnologia (Diplomacia) | ❌ | 2 |

### 🏗️ Economia & Províncias

| Feature | Status | Fase |
|---|---|---|
| Renda/Gold/Food/Materials | ✅ | — |
| Construções (Farms, Mines, Workshops, Courts) | ✅ | — |
| Trade Routes | ✅ | — |
| Recursos Estratégicos | ✅ | — |
| Empréstimos | ❌ | 2 |
| Ações em Massa (Assimilar/Investir/Construir Todas) | ❌ | 1 |
| Maravilhas (Wonders) | ❌ | 3 |
| Festivais | ❌ | 3 |
| Impostos (Taxation) | 🟡 | 2 |
| Ações Rápidas por Província (Teclas A,S,D,F) | ❌ | 1 |

### 🗺️ Mapa & Visualização

| Feature | Status | Fase |
|---|---|---|
| Political, Economic, Military, Diplomatic, Resources | ✅ | — |
| Modo: População (Ranking) | ❌ | 2 |
| Modo: Desenvolvimento (Ranking) | ❌ | 2 |
| Modo: Renda/Imposto/Produção | ❌ | 2 |
| Modo: Felicidade/Estabilidade | ❌ | 2 |
| Modo: Edifícios (Farms, Mines etc.) | ❌ | 2 |
| Modo: Religiões | ❌ | 3 |
| Modo: Maravilhas | ❌ | 3 |
| Nomes de Província Animados | ❌ | 3 |
| Nuvens no Mapa | ❌ | 3 |

### 🎮 UI & UX

| Feature | Status | Fase |
|---|---|---|
| Menu Premium | ✅ | — |
| HUD Responsivo | ✅ | — |
| Hotkeys (Enter, Esc, 1-5, W, A, S, Q/E) | ❌ | 1 |
| Minimapa | ❌ | 1 |
| Efeitos de Partículas (Batalha, Conquista) | ❌ | 1 |
| Efeitos Sonoros (SFX) | ❌ | 1 |
| Responsividade de Modais (Mobile) | ❌ | 2 |
| Música Ambiente | ❌ | 2 |
| Tela de Derrota Narrativa | ❌ | 2 |
| Tooltips / Flavor Text | ❌ | 1 |
| Tutorial Interativo | ❌ | 3 |
| Gráficos e Rankings Avançados | ❌ | 2 |

### 🧠 IA

| Feature | Status | Fase |
|---|---|---|
| IA Básica (Atacar, Recrutar, Construir) | ✅ | — |
| Personalidades Afetando Comportamento | ❌ | 2 |
| IA faz Empréstimos | ❌ | 2 |
| IA não Investe em Economia no Limite | ❌ | 2 |
| Agressividade Configurável | ❌ | 2 |
| AI Army Control (Auto-Gestão) | ❌ | 3 |

### 🛠️ Editores & Modding

| Feature | Status | Fase |
|---|---|---|
| Editor de Cenários | ❌ | 3 |
| Editor de Mapa (Auto-Connect) | ❌ | 3 |
| Templates de Nação | ❌ | 3 |
| Suporte a Mods/Workshop | ❌ | 3 |

### 🔧 Outros

| Feature | Status | Fase |
|---|---|---|
| Save/Load/Autosave | ✅ | — |
| Multiplayer / Hot-seat | ❌ | 3 |
| Conquistas / Achievements | ❌ | 3 |
| i18n (Múltiplos Idiomas) | ❌ | 3 |
| PWA / Service Worker | ❌ | 3 |
| Replay / Crônica Animada | ❌ | 3 |

---

## 🚀 Ordem de Implementação Recomendada

### Sprint 1 — Diplomacia (Semana 1)
1. Hotkeys → impacto imediato, 30min
2. Diplomacia Completa → maior ganho de profundidade
3. Efeitos Sonoros → imersão

### Sprint 2 — Combate & UI (Semana 2)
4. Army Retreat → mecânica essencial de combate
5. Ações em Massa → qualidade de vida
6. Minimapa → orientação
7. Partículas → polimento visual

### Sprint 3 — Tecnologia (Semanas 3-4)
8. Sistema de Tecnologia → nova camada estratégica
9. Capitulação → fim de guerra mais natural
10. Governos → variedade estratégica

### Sprint 4 — Mapas & IA (Semanas 4-5)
11. Novos Modos de Mapa → informação estratégica
12. Empréstimos → profundidade econômica
13. IA Avançada → desafio real
14. Música Ambiente → imersão

### Sprint 5+ — Conteúdo Avançado (Semanas 6+)
15. Religiões → camada diplomática extra
16. Maravilhas → objetivos de longo prazo
17. Editor de Cenários → conteúdo comunitário
18. Multiplayer → replayability

---

## 📝 Notas

- Funcionalidades marcadas como Fase 1 devem ser implementadas NA ORDEM listada (hotkeys primeiro).
- Cada fase tem seu PRD detalhado na pasta `prd/`.
- O `AGENTS.md` e `MAESTRO.md` continuam sendo as fontes de verdade para padrões de código.
- Antes de iniciar qualquer implementação, leia o PRD da fase correspondente.
- Este documento substitui integralmente o `IMPLEMENTACOES-FUTURAS.md` anterior (v1.0).
- O `PLANO-ATUALIZACAO-AOH2.md` é mantido como referência histórica da análise comparativa.

---

*IMPLEMENTACOES-FUTURAS.md | Reinos Medievais | Versão 2.0 | 07/05/2026*
