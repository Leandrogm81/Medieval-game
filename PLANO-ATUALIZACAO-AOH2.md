# 🏰 Plano de Atualização — Reinos Medievais vs Age of History 2

> **Data:** 07/05/2026
> **Propósito:** Análise comparativa completa e plano de implementação para aproximar Reinos Medievais do conteúdo e profundidade do Age of History 2 (incluindo Definitive Edition).
> **Projeto:** `/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game/`

---

## 📊 Análise Comparativa

### Legenda
| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado |
| 🟡 | Parcialmente implementado |
| ❌ | Não implementado |

---

## 1. 🗺️ Mapa & Províncias

| Funcionalidade | AoH2 | Reinos Medievais | Observações |
|---------------|------|-------------------|-------------|
| Mapa com províncias | ✅ 13.892 | ✅ ~20-40 (Voronoi) | Escalabilidade futura |
| Nomes nas províncias | ✅ Nomes animados no zoom | ❌ Apenas no hover/click | **Implementar** |
| Fronteiras suaves | ✅ Novo sistema | 🟡 Polígonos Voronoi | Ok por enquanto |
| Múltiplos cenários | ✅ 23 cenários + editor | ❌ Apenas geração procedural | **V2** |
| Civilizações formáveis | ✅ 225+ | ❌ Nenhuma | **V2** |
| Clima/nuvens no mapa | ✅ Nuvens animadas | ❌ Apenas efeitos mínimos | **V2** |
| Mapa mundi real | ✅ Sim (13.892 províncias) | ❌ Mapa procedural | Arquitetura diferente |

---

## 2. 👑 Diplomacia

| Funcionalidade | AoH2 | Reinos Medievais | Observações |
|---------------|------|-------------------|-------------|
| Declarar guerra | ✅ | ✅ | Implementado |
| Alianças | ✅ | 🟡 `alliances[]` no estado, sem UI | Estado existe, UI não |
| Pacto de não-agressão | ✅ | ❌ | **Implementar** |
| Pacto defensivo | ✅ | ❌ | **Implementar** |
| Melhorar relações | ✅ | ❌ (Relogios existem, mas sem ação) | **Implementar** |
| Enviar insulto | ✅ | ❌ | **Implementar** |
| Oferecer tributo | ✅ | ❌ | **Implementar** |
| Exigir tributo | ✅ | ❌ | **Implementar** |
| Propor união | ✅ Propose Union | ❌ | **V2** |
| Compartilhar tecnologia | ✅ Share Technology | ❌ | **V2** |
| Enviar exército voluntário | ✅ Send Volunteer Army | ❌ | **V2** |
| Intervir em guerra | ✅ Intervene/Join War | ❌ | **V2** |
| Impor paz | ✅ Enforce Peace | ❌ | **V2** |
| Recrutar mercenários | ✅ Recruit Mercenaries | ❌ | **V2** |
| Propaganda | ✅ Spread Propaganda | ❌ | **V2** |
| Sanções | ✅ Impose Sanctions | ❌ | **V2** |
| Cúpula diplomática | ✅ Host Diplomatic Summit | ❌ | **V3** |
| Investir/Build em província alheia | ✅ Invest in Foreign Provinces | ❌ | **V3** |
| Fundar cidade | ✅ Found a City | ❌ | **V3** |
| Pedir/Perdoar empréstimo | ✅ Request Loan/Debt Relief | ❌ | **V3** |
| Realocar população | ✅ Population Relocation | ❌ | **V3** |
| Texto narrativo diplomático | ✅ Diplomacy Flavor Text | ❌ **Implementar** |

---

## 3. ⚔️ Guerra & Combate

| Funcionalidade | AoH2 | Reinos Medievais | Observações |
|---------------|------|-------------------|-------------|
| Sistema de batalha | ✅ | ✅ | Implementado com terreno |
| Marcha de tropas | ✅ | ✅ | March orders implementados |
| Múltipla seleção de exércitos | ✅ Drag mid-mouse | ❌ Apenas 1 província | **Implementar** |
| Recuo de exército | ✅ Army Retreat | ❌ Derrotados somem | **Implementar** |
| Capitulação | ✅ Auto-surrender | ❌ | **Implementar** |
| Pontuação de guerra | ✅ War Score | ✅ | Implementado |
| Exaustão de guerra | ✅ War Exhaustion | ✅ | Implementado |
| Captura de capital | ✅ Bônus de war score | ✅ | Implementado |
| Tratados de paz | ✅ Peace Deals | 🟡 Só exaustão | Melhorar |
| Transferir vassalos na paz | ✅ | ❌ | **V2** |
| Armas atômicas (DE) | ✅ Nukes (DE) | ❌ | **V3** |
| Controle de exército por IA | ✅ AI Army Control | ❌ | **V3** |
| Baixas em todas as guerras | ✅ Deaths in All Wars | ❌ | **V2** |

---

## 4. 🏛️ Governos & Política

| Funcionalidade | AoH2 | Reinos Medievais | Observações |
|---------------|------|-------------------|-------------|
| Múltiplos tipos de governo | ✅ Monarchy, Republic, etc. | ❌ `PersonalityType` existe, mas sem mecânica | **Implementar** |
| Mudança de governo | ✅ Via diplomacia/ultimato | ❌ | **V2** |
| Tribos -> Civilização | ✅ Tribal Research | ❌ | **V3** |
| Vassalagem | ✅ | 🟡 `vassals[]` + tributo automático | Melhorar UI |
| Coalizões | ✅ Contra expansionistas | ✅ | Implementado |
| Satisfação do vassalo | ✅ Liberty Desire | ❌ | **V2** |

---

## 5. 📖 Religiões (Recurso Novo do DE)

| Funcionalidade | AoH2 DE | Reinos Medievais |
|---------------|---------|-------------------|
| 32 religiões | ✅ | ❌ **Implementar** |
| Influência diplomática | ✅ Afeta relações | ❌ |
| Modo de mapa religiões | ✅ | ❌ |

---

## 6. 🔬 Tecnologia

| Funcionalidade | AoH2 | Reinos Medievais |
|---------------|------|-------------------|
| Pontos de tecnologia | ✅ Alocáveis | ❌ **Implementar** |
| Movimento extra por tech | ✅ | ❌ |
| Redução de assimilação | ✅ | ❌ |
| Aumento de população recrutável | ✅ | ❌ |
| Efeito no combate | ✅ Tech levels afetam atk/def | ❌ **Implementar** |
| Visualização de tech por civilização | ✅ | ❌ |
| Felicidade ao pesquisar | ✅ +1 happiness | ❌ |

---

## 7. 🏗️ Economia & Províncias

| Funcionalidade | AoH2 | Reinos Medievais | Observações |
|---------------|------|-------------------|-------------|
| Impostos | ✅ Taxation | 🟡 Renda automática | Melhorar |
| Produção | ✅ | ✅ | Implementado |
| Comércio / Rotas | ✅ | ✅ Trade Routes | Implementado |
| Empréstimos | ✅ Request Loan | ❌ | **V2** |
| Ações em massa | ✅ Assimilar/Investir todos | ❌ **Implementar** |
| Construções | ✅ Farms, Markets, Workshops, Libraries, etc. | ✅ Farms, Mines, Workshops, Courts | Expandir |
| Maravilhas | ✅ Wonders (+crescimento +imposto) | ❌ **Implementar** |
| Investimento econômico | ✅ | ❌ | **V2** |
| Festivais | ✅ Launch Festivals | ❌ | **V2** |

---

## 8. 🎯 Modos de Mapa & Visualização

| Funcionalidade | AoH2 DE | Reinos Medievais |
|---------------|---------|-------------------|
| Político | ✅ | ✅ |
| Econômico | ✅ | ✅ |
| Militar | ✅ | ✅ |
| Diplomático | ✅ | ✅ |
| Recursos | ✅ | ✅ |
| Religiões | ✅ (DE) | ❌ **Implementar** |
| População | ✅ Ranking | ❌ |
| Desenvolvimento | ✅ Ranking | ❌ |
| Fazendas/Oficinas/Mercados/Bibliotecas | ✅ | ❌ |
| Investimentos/Assimilações/Festivais | ✅ | ❌ |
| Renda/Implantação/Produção | ✅ | ❌ |
| Maravilhas | ✅ | ❌ |

---

## 9. 🎮 UI & Experiência do Usuário

| Funcionalidade | AoH2 DE | Reinos Medievais |
|---------------|---------|-------------------|
| Menu modernizado | ✅ | ✅ Já reformado |
| UI responsiva | ✅ | ✅ |
| Hotkeys (A,S,D,F) | ✅ Recrutamento | ❌ **Implementar** |
| Minimapa | ✅ | ❌ |
| Notificações de vizinhos | ✅ | ❌ |
| Caixa de info de guerra | ✅ | 🟡 Logs textuais |
| Nuvens no mapa | ✅ | ❌ |
| Zoom suave | ✅ | ✅ |
| Nomes de civilização animados | ✅ | ❌ |
| Gráficos e rankings | ✅ | 🟡 Turn summary |
| Formatação personalizável de exército | ✅ | ❌ |
| Tooltips e textos narrativos | ✅ Diplomacy Flavor Text, etc. | ❌ |
| Tutorial/Onboarding | ✅ | 🟡 Instructions modal |
| Tela de derrota narrativa | ✅ | ❌ |

---

## 10. 🧠 IA

| Funcionalidade | AoH2 DE | Reinos Medievais |
|---------------|---------|-------------------|
| IA otimizada | ✅ | 🟡 Básica |
| IA recruta durante guerra | ✅ | ✅ |
| IA faz empréstimos | ✅ | ❌ |
| IA não investe em economia já no limite | ✅ | ❌ |
| Agressividade configurável (0-1000%) | ✅ | ❌ |
| Comportamento por personalidade | ✅ | 🟡 Definição existe, lógica básica |

---

## 11. 🛠️ Editores & Modding

| Funcionalidade | AoH2 | Reinos Medievais |
|---------------|------|-------------------|
| Editor de cenários | ✅ | ❌ |
| Editor de mapa | ✅ Auto-connect | ❌ |
| Editor de bandeiras | ✅ v2 Alta resolução | ❌ |
| Templates de nação | ✅ | ❌ |
| Adicionar civilizações antes do jogo | ✅ | ❌ |
| Suporte a mods/Workshop | ✅ Steam Workshop | ❌ |

---

## 12. 🔧 Outros

| Funcionalidade | AoH2 DE | Reinos Medievais |
|---------------|---------|-------------------|
| Salvamento/Carregamento | ✅ | ✅ |
| Multiplayer/Hot-seat | ❌ (não tem) | ❌ |
| Conquistas/Achievements | ✅ Steam Achievements | ❌ |
| Música ambiente | ✅ | ❌ |
| Efeitos sonoros | ✅ | ❌ |
| Múltiplos idiomas | ✅ Vários | ❌ |
| PWA/Offline | ❌ | ❌ |

---

# 🎯 PLANO DE IMPLEMENTAÇÃO

## Priorização por Esforço vs Impacto

```
Alto Impacto │
    │
    │ 🟢 FASE 1 │ 🟡 FASE 2          │ 🔴 FASE 3
    │  5-7 dias  │  8-15 dias         │  15-30 dias
    │            │                    │
    │ • Diplomacia │ • Tecnologia     │ • Religiões
    │ • Hotkeys   │ • Capitulação    │ • Maravilhas
    │ • Army Retreat │ • Governos    │ • Nukes
    │ • Mass Actions │ • Modos Mapa  │ • Editor Cenários
    │               │ • Empréstimos  │ • Multiplayer
    └──────────────┴──────────────────┴──────────────▶
    Baixo esforço              Alto esforço
```

---

## 🟢 FASE 1 — Prioridade Máxima (5-7 dias)

### 1.1 — Sistema de Diplomacia Completo
**Arquivos:** `src/logic/diplomacyLogic.ts` (criar), `src/components/DiplomacyModal.tsx` (reescrever), `src/hooks/useGameController.ts`, `src/types.ts`

**Tarefas:**
- [ ] Criar `src/logic/diplomacyLogic.ts` com funções puras:
  - `proposeAlliance()`, `proposeNonAggressionPact()`, `proposeDefensivePact()`
  - `improveRelations()`, `sendInsult()`, `offerTribute()`, `demandTribute()`
  - `getDiplomacyAcceptance()` — calcula chance baseada em relações, poder, personalidade
  - Memória de eventos (traições, ajudas) influenciando decisões
- [ ] Reescrever `DiplomacyModal.tsx` com:
  - Lista de reinos conhecidos com suas relações
  - Botões de ação diplomática por reino
  - Feedback visual de aceitação/rejeição
  - Texto narrativo ("Flavor Text") para cada ação
- [ ] Conectar ações ao `useGameController`
- [ ] Notificações de eventos diplomáticos de vizinhos

### 1.2 — Hotkeys / Atalhos de Teclado
**Arquivos:** `src/App.tsx`, `src/hooks/useUI.ts`

**Tarefas:**
- [ ] `Enter` → Encerrar turno
- [ ] `Esc` → Cancelar ação atual
- [ ] `1-5` → Alternar modos de visão (Political, Economic, Military, Diplomatic, Resources)
- [ ] `W` → Modo marcha
- [ ] `A` → Modo ataque
- [ ] `Q` / `E` → Zoom in/out
- [ ] `Space` → Centralizar na capital
- [ ] `S` → Salvar jogo
- [ ] Indicador visual de hotkeys nos tooltips

### 1.3 — Army Retreat (Recuo de Exército)
**Arquivos:** `src/logic/combatLogic.ts`, `src/logic/turnLogic.ts`

**Tarefas:**
- [ ] Quando exército é derrotado, X% (configurável, ex: 30%) recua para província vizinha amigável
- [ ] Se não houver província vizinha amigável, tropas são eliminadas
- [ ] Mostrar notificação de recuo no `BattleOutcomeModal`

### 1.4 — Ações em Massa nas Províncias
**Arquivos:** `src/logic/economyLogic.ts`, `src/components/HUD.tsx`

**Tarefas:**
- [ ] Botão "Assimilar Todas" — aplica loyalty boost em todas províncias (custa gold)
- [ ] Botão "Investir em Todas" — investe gold em desenvolvimento em massa
- [ ] Botão "Construir (tipo) em Todas" — const相同的instalação em províncias elegíveis

### 1.5 — Múltipla Seleção de Exércitos
**Arquivos:** `src/components/Map.tsx`, `src/hooks/useGameController.ts`

**Tarefas:**
- [ ] Seleção por arrasto (drag) com o mouse — similar ao AoH2 (middle mouse)
- [ ] Mover múltiplos exércitos simultaneamente
- [ ] Dividir exército ao mover para múltiplos destinos

---

## 🟡 FASE 2 — Médio Prazo (8-15 dias)

### 2.1 — Sistema de Tecnologia
**Arquivos:** `src/types.ts`, `src/logic/technologyLogic.ts` (criar)

**Tarefas:**
- [ ] Adicionar campos de tecnologia ao `Realm`:
  - `techPoints: number` — pontos acumulados por turno
  - `techAllocation: { movement: number; assimilation: number; recruitment: number; combat: number }`
- [ ] Criar `src/logic/technologyLogic.ts`:
  - `generateTechPoints(realm)` — gera pontos baseado em economia/população
  - `allocateTechPoints(realm, category, amount)`
  - `getTechEffects(realm)` — retorna bônus atuais:
    - movement: +0.5 AP por nível
    - assimilation: -10% custo de assimilação por nível
    - recruitment: +10% população recrutável por nível
    - combat: +5% ataque/defesa por nível
- [ ] UI de alocação de tecnologia (modal ou painel)
- [ ] Mostrar níveis de tecnologia de outros reinos
- [ ] +1 felicidade ao pesquisar novo nível

### 2.2 — Capitulação
**Arquivos:** `src/logic/turnLogic.ts` (dentro de `processActiveWars`)

**Tarefas:**
- [ ] Se > 60% províncias ocupadas E war score > 50% → civilização se rende
- [ ] Rendição: perde X% das províncias (as mais distantes da capital), vira vassalo ou é anexada
- [ ] Notificação especial de capitulação

### 2.3 — Sistema de Governos
**Arquivos:** `src/types.ts`, `src/logic/governmentLogic.ts` (criar)

**Tarefas:**
- [ ] Tipos de governo com bônus/penalidades:
  - **Monarchy**: +10% defesa, -1 ação diplomática por turno
  - **Republic**: +1 ação diplomática, -5% manutenção de tropas
  - **Feudal**: +15% produção de comida, vassalos mais leais
  - **Theocracy**: +20% felicidade, -10% pesquisa
  - **Despotism**: +10% ataque, -20% crescimento populacional
- [ ] Mudança de governo via decisão (custa gold/estabilidade)
- [ ] Revoluções quando estabilidade muito baixa

### 2.4 — Novos Modos de Mapa
**Arquivos:** `src/components/Map.tsx`, `src/types.ts`

**Tarefas:**
- [ ] **População** — cor baseada em população total, ranking
- [ ] **Desenvolvimento** — cor baseada em wealth/buildings, ranking
- [ ] **Renda** — cor baseada em goldIncome por província
- [ ] **Felicidade/Estabilidade** — cor baseada em loyalty/stability
- [ ] **Edifícios** — heatmap por tipo de construção
- [ ] Atalhos no HUD para troca rápida entre modos

### 2.5 — Sistema de Empréstimos
**Arquivos:** `src/logic/economyLogic.ts`, `src/components/HUD.tsx`

**Tarefas:**
- [ ] Pedir empréstimo: ganha gold agora, paga gold + juros por turno pelos próximos N turnos
- [ ] Limite de crédito baseado em renda total
- [ ] Se não pagar: penalidade de relações com todos, rebeliões
- [ ] AI pode pedir empréstimos durante guerra

### 2.6 — Melhorias na IA
**Arquivos:** `src/logic/aiLogic.ts`

**Tarefas:**
- [ ] IA faz empréstimos quando precisa de gold para guerra
- [ ] IA não investe em províncias com economia já no limite
- [ ] Personalidades afetam comportamento:
  - Expansionist: mais agressivo, menos construção
  - Defensive: foca em fortificações, evita guerras
  - Diplomatic: busca alianças, evita conflitos
  - Commercial: foca em economia e comércio
  - Opportunistic: ataca quando vê fraqueza
- [ ] Agressividade influenciada por tamanho relativo

---

## 🔴 FASE 3 — Longo Prazo (15-30 dias)

### 3.1 — Religiões
**Arquivos:** `src/types.ts`, `src/logic/religionLogic.ts` (criar)

**Tarefas:**
- [ ] Adicionar campo `religion` ao `Province` e `religion` principal ao `Realm`
- [ ] 4-8 religiões medievais: Catholicism, Orthodoxy, Islam, Paganism, Judaism, etc.
- [ ] Religiões afetam relações diplomáticas: -20 entre religiões diferentes, +20 entre iguais
- [ ] Eventos de conversão religiosa
- [ ] Modo de mapa: Religiões
- [ ] Bônus específicos por religião (ex: Catholicism +gold, Islam +attack, etc.)

### 3.2 — Maravilhas
**Arquivos:** `src/types.ts`, `src/logic/wonderLogic.ts` (criar)

**Tarefas:**
- [ ] Adicionar campo `wonder?: string` à `Province`
- [ ] Lista de maravilhas: Cathedral, Castle, University, Market Hub, Great Wall
- [ ] Cada maravilha dá bônus único: +crescimento pop, +gold, +pesquisa, +defesa
- [ ] Construção de maravilha: custa muito gold/materiais, leva N turnos
- [ ] Modo de mapa: Maravilhas
- [ ] Evento quando maravilha é construída

### 3.3 — Editor de Cenários Básico
**Arquivos:** Novo módulo React

**Tarefas:**
- [ ] Tela de editor com lista de civilizações e províncias
- [ ] Atribuir províncias a civilizações visualmente
- [ ] Configurar relações iniciais, tecnologias, recursos
- [ ] Salvar/Carregar cenários como JSON
- [ ] Templates de nação baseados em período histórico

### 3.4 — Conquistas / Achievements
**Arquivos:** `src/logic/achievementLogic.ts` (criar)

**Tarefas:**
- [ ] Detectar marcos: 10 batalhas vencidas, 50 províncias, 100 turnos, etc.
- [ ] Notificação de achievement desbloqueado
- [ ] Tela de conquistas
- [ ] Salvar progresso no persistence

### 3.5 — Música e Efeitos Sonoros
**Arquivos:**
- [ ] Música ambiente medieval no menu e durante o jogo
- [ ] SFX: batalha, recrutamento, construção, fim de turno, notificação
- [ ] Toggle de som no menu

### 3.6 — Nukes / Armas Atômicas (Inspirado no DE)
**Arquivos:** `src/logic/nukeLogic.ts` (criar)

**Tarefas:**
- [ ] Construção requer tecnologia avançada + gold
- [ ] Uso apenas contra reinos em guerra
- [ ] Causa dano massivo: população reduzida, economia destruída, tropas mortas
- [ ] Penalidade massiva de relações globais ao usar

### 3.7 — Multiplayer / Hot-seat
**Tarefas:**
- [ ] Modo local: 2+ jogadores no mesmo PC alternando turnos
- [ ] Tela de configuração de múltiplos jogadores
- [ ] Ocultar informações de outros jogadores durante o turno

---

## 📋 Resumo de Arquivos a Criar

| Arquivo | Fase | Propósito |
|---------|------|-----------|
| `src/logic/diplomacyLogic.ts` | 1 | Lógica de diplomacia |
| `src/logic/technologyLogic.ts` | 2 | Sistema de tecnologia |
| `src/logic/governmentLogic.ts` | 2 | Governos e bônus |
| `src/logic/religionLogic.ts` | 3 | Religiões e mecânicas |
| `src/logic/wonderLogic.ts` | 3 | Maravilhas |
| `src/logic/achievementLogic.ts` | 3 | Conquistas |
| `src/logic/nukeLogic.ts` | 3 | Armas atômicas |

## 📋 Resumo de Arquivos a Modificar

| Arquivo | Fases | Mudanças |
|---------|-------|----------|
| `src/types.ts` | 1,2,3 | Novos tipos: Religion, Government, Technology, Wonder, Achievement |
| `src/hooks/useGameController.ts` | 1,2,3 | Novos handlers: diplomacia, tecnologia, governo |
| `src/hooks/useUI.ts` | 1,2 | Novos estados de UI: modais diplomacia/tecnologia, hotkeys |
| `src/components/HUD.tsx` | 1,2,3 | Novos botões: diplomacia, tecnologia, governo, modos de mapa |
| `src/components/DiplomacyModal.tsx` | 1 | Reescrever completo |
| `src/components/Map.tsx` | 2,3 | Novos modos de mapa, seleção múltipla |
| `src/logic/aiLogic.ts` | 1,2 | IA mais inteligente com personalidades |
| `src/logic/economyLogic.ts` | 1,2 | Ações em massa, empréstimos |
| `src/logic/combatLogic.ts` | 1 | Army retreat |
| `src/logic/turnLogic.ts` | 1,2 | Capitulação, tech points |
| `src/App.tsx` | 1 | Hotkeys, novos modais |
| `src/logic/mapGeneration.ts` | 3 | Suporte a cenários pré-definidos |

---

## 🧪 Plano de Testes por Fase

### Fase 1 — Testes
- [ ] Aliança funciona: +relações, não pode atacar aliado
- [ ] Pacto defensivo: atacar um = guerra com ambos
- [ ] Hotkeys funcionam em todos os modos
- [ ] Army retreat: 30% das tropas sobrevivem para província vizinha
- [ ] Ações em massa: gold/material são deduzidos corretamente
- [ ] Múltipla seleção: todas as tropas selecionadas marcham

### Fase 2 — Testes
- [ ] Tech points acumulam por turno
- [ ] Alocação de tech: bônus aplicados corretamente
- [ ] Capitulação: condições verificadas, consequências corretas
- [ ] Governo muda: bônus/penalidades aplicados
- [ ] Modos de mapa: cores e informações corretas
- [ ] Empréstimo: gold recebido, parcelas descontadas nos turnos seguintes

### Fase 3 — Testes
- [ ] Religiões: bônus aplicados, relações afetadas
- [ ] Maravilhas: construção em N turnos, bônus aplicados
- [ ] Cenário carregado: províncias e relações corretas
- [ ] Achievements: detecção correta de marcos

---

## 📈 Estimativa de Esforço Total

| Fase | Dias | Complexidade | Impacto |
|------|------|-------------|---------|
| Fase 1 🟢 | 5-7 | Média | 🌟🌟🌟🌟🌟 |
| Fase 2 🟡 | 8-15 | Alta | 🌟🌟🌟🌟 |
| Fase 3 🔴 | 15-30 | Muito Alta | 🌟🌟🌟 |

**Total estimado:** 28-52 dias de desenvolvimento.

---

## 🎯 Recomendação Imediata

Comece pela **Fase 1** na seguinte ordem:

1. **Hotkeys** (1 dia) — Baixo esforço, alto ganho de qualidade de vida
2. **Diplomacia** (3-4 dias) — Maior impacto na profundidade do jogo
3. **Army Retreat** (1 dia) — Mecânica simples que melhoria significativa no combate
4. **Ações em Massa** (1 dia) — Qualidade de vida para impérios grandes
5. **Seleção Múltipla** (1 dia) — Melhoria na gestão de exércitos

---

*Documento gerado em 07/05/2026 — Reinos Medievais v1.0*
