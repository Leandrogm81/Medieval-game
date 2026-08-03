# Análise Brownfield — Reinos Medievais

> **Data:** 02/08/2026
> **Prompt-fonte:** `docs/product/BROWNFIELD_ANALYSIS_TEMPLATE.md` (L6)
> **Método:** Inspeção de código-fonte, histórico git, build e execução local
> **Projeto:** `/mnt/c/Dev/Medieval game/Medieval-game/`

---

## 1. Resumo executivo

**O que o sistema faz hoje:** Jogo de estratégia grand strategy medieval, single-player, turn-based, inspirado em Age of History 2. O jogador comanda um reino em um mapa Voronoi procedural: gerencia economia (ouro/grãos/obra), recruta e movimenta exércitos (march orders com caminho multi-província), conquista províncias vizinhas com combate por terreno, conduz diplomacia (alianças, pactos, tributos, insultos, NAPs), pesquisa tecnologia, contrai empréstimos, gerencia vassalos e coalizões. Vitória por conquista ou economia.

**Quem usa:** Uso pessoal do autor (Leandro). Sem usuários externos identificáveis, sem deploy público ativo.

**Stack atual:**
- React 19 + TypeScript ~5.8 + Vite 6.4
- Tailwind CSS v4 (via plugin Vite) + Motion (Framer Motion) + lucide-react
- D3 v7 (geração Voronoi com Lloyd relaxation) + Tone.js v15 (SFX)
- Express + @google/genai + dotenv no package.json, porém **sem uso real no código-fonte** (dependências mortas)
- Persistência: localStorage (saves, autosave, último save)

**Nível de maturidade:** `MVP em produção` — funcional, jogável de ponta a ponta, com UI caprichada, mas sem testes automatizados, sem CI e com débitos de organização de repositório.

---

## 2. Inventário de funcionalidades

| Funcionalidade | Onde está implementada | Estado | Testada? |
|---|---|---|---|
| Geração de mapa Voronoi (Lloyd relaxation, terrenos, recursos estratégicos) | `src/logic/mapGeneration.ts` | ✅ | ❌ |
| Economia (ouro/grãos/obra, renda, manutenção, overextension) | `src/logic/economyLogic.ts`, `financeLogic.ts` | ✅ | ❌ |
| Combate com terreno + recuo | `src/logic/combatLogic.ts` | ✅ | ❌ |
| March orders (caminho multi-província, ataque, reconhecimento) | `src/logic/turnLogic.ts`, `Map.tsx` | ✅ | ❌ |
| Diplomacia (aliança, NAP, pacto defensivo, tributos, insulto, guerra) | `src/logic/diplomacyLogic.ts`, `DiplomacyModal.tsx` | ✅ | ❌ |
| Guerra (war score, exaustão, coalizões, call-to-arms) | `src/logic/turnLogic.ts`, `CallToArmsModal.tsx` | ✅ | ❌ |
| Tecnologia (tech points, unlockedTechs) | `src/logic/techLogic.ts` | 🟡 Estrutura existe, UI parcial | ❌ |
| Empréstimos | `src/logic/financeLogic.ts`, `Loan` em types | 🟡 | ❌ |
| Vassalagem + tributo automático | `types.ts`, `turnLogic.ts` | 🟡 Estado existe, UI limitada | ❌ |
| IA de reinos (personalidade, objetivos, build/recruit/attack) | `src/logic/aiLogic.ts` | ✅ | ❌ |
| Visibilidade / névoa de guerra | `turnLogic.ts` (calculateVisibility), `Map.tsx` | ✅ | ❌ |
| Hotkeys (1-5 modos, W/A/S, Q/E zoom, F tela cheia, Space capital) | `src/App.tsx` | ✅ | ❌ |
| Multi-seleção de províncias (shift + retângulo botão direito) | `Map.tsx`, `useGameController.ts` (handleMassAction) | ✅ | ❌ |
| Ações em massa nas províncias | `useGameController.ts` | ✅ | ❌ |
| SFX (Tone.js, toggable) | `src/logic/sfxLogic.ts` | ✅ | ❌ |
| Minimapa navegável | `src/components/Minimap.tsx` | ✅ | ❌ |
| Partículas (batalha/conquista/construção) | `Map.tsx`, `index.css` | ✅ | ❌ |
| Save/load + autosave + quick save | `src/persistence.ts` | ✅ | ❌ |
| Crônicas (log de eventos) | `ChronicleModal.tsx` | ✅ | ❌ |
| Modos de mapa (político, economia, militar, diplomático, recursos, comércio) | `Map.tsx` | ✅ | ❌ |
| Mapa visual rico (oceano, rosa dos ventos, escudos, banners, estradas) | `Map.tsx` (portado da base AI Studio em 02/08/2026) | ✅ | ❌ |
| Responsividade mobile (HUD compacto, touch pan/zoom, mapa adaptativo) | `App.tsx`, `HUD.tsx`, `Map.tsx` (useIsMobile) | ✅ | ❌ |
| Escala de mapa (20–70 províncias, 4–8 reinos) | `App.tsx`, `useUI.ts` | ✅ | ❌ |

---

## 3. Inventário de telas e rotas

| Tela/Rota | Arquivo | Estado visual | Responsiva? | Observação |
|---|---|---|---|---|
| Menu principal (novo reinado, retomar partida, instruções) | `App.tsx` (showMenu) | ✅ Caprichado (gold gradient, painéis) | ✅ | Slider províncias 20–70, reinos 4–8 |
| Jogo (mapa + HUD) | `App.tsx` + `Map.tsx` + `HUD.tsx` | ✅ Mapa rico portado da base | ✅ | Pan/zoom touch + mouse |
| Modais de combate (setup, batalha, resultado) | `CombatSetupModal`, `BattleModal`, `BattleOutcomeModal` | ✅ | ✅ | |
| Diplomacia | `DiplomacyModal.tsx` | ✅ | ✅ | |
| Call to arms | `CallToArmsModal.tsx` | ✅ | ✅ | |
| Crônicas | `ChronicleModal.tsx` | ✅ | ✅ | |
| Save/load | `SaveGameModal.tsx` | ✅ | ✅ | |
| Instruções | `GameInstructionsModal.tsx` | ✅ | ✅ | |
| Fim de jogo / game over | `GameEndModal`, `GameOverModal` | ✅ | ✅ | |
| Resumo de turno | `TurnResultModal.tsx` | ✅ | ✅ | |
| Toasts | `ToastContainer.tsx` | ✅ | ✅ | |
| Error boundary global | `ErrorBoundary.tsx` | ✅ | — | Recuperação com reload |

Sem rotas/URLs — app de página única, sem react-router.

---

## 4. Arquitetura real

**Estrutura de pastas:**
```
src/
├── logic/          → Funções puras de negócio (9 módulos, sem React)
├── hooks/
│   ├── useGameController.ts (920 ln) → estado + ações do jogador + IA
│   └── useUI.ts                     → estado de UI (modais, seleção, pan/zoom)
├── components/     → 17 componentes de apresentação (UI pura)
├── types.ts        → todos os tipos de domínio centralizados
├── persistence.ts  → localStorage (saves/autosave)
├── gameLogic.ts    → constantes de balanceamento (UNIT_STATS etc.)
└── App.tsx         → orquestrador (857 ln): rotas de tela, hotkeys, composição
```

**Fluxo de dados:** `App.tsx` detém `gameState` (useState). `useGameController` recebe estado + setter e expõe `handle*` que clonam profundamente (`JSON.parse(JSON.stringify())` via `utils/deepClone.ts`), mutam o clone e chamam `setGameState`. `useUI` é estado independente de UI. `Map.tsx` e componentes recebem tudo via props (sem context, sem store externo).

**Serviços externos:** Nenhum ativo. `express`, `@google/genai`, `dotenv`, `GEMINI_API_KEY` no vite.config são resíduos do template AI Studio — não usados em `src/`.

**Autenticação:** Não existe (jogo local single-player).

**Estado global:** useState no App + 2 hooks (useGameController, useUI). Regra de ouro documentada no MAESTRO: nunca mutar estado direto, sempre deep clone.

**Persistência:** localStorage — chaves `medieval_game_saves`, `medieval_game_autosave`, `medieval_game_last_save_name`, `sfx_enabled`. Sem backend, sem sync.

---

## 5. Qualidade observável

| Dimensão | Status | Evidência |
|---|---|---|
| Testes automatizados | **Ausentes** | Nenhum `*.test.*` no repo; `npm test` não existe |
| Tipagem | **Parcial** | `strict` NÃO habilitado no tsconfig; 4 ocorrências `: any` (Map.tsx ×3, useGameController ×1); props de marchAnimations com `any` |
| Tratamento de erros | **Parcial** | ErrorBoundary global; try/catch na geração de estado e persistência; sem tratamento em handlers de UI |
| Variáveis de ambiente | **Ausentes** | Nenhum `.env.example`; GEMINI_API_KEY referenciada no vite.config mas morta |
| Logging | **Parcial** | `console.log("Generating initial state...")`, logs de jogo em `gameState.logs` (crônicas); sem logging estruturado |
| Documentação inline | **Escassa** | Comentários em Map.tsx (camadas visuais) e MAESTRO; lógica em PT-BR com poucos comentários |
| Dependências | **Sem alertas** | `npm audit`: 0 vulnerabilidades (291 pacotes, 02/08/2026) |

---

## 6. Débitos técnicos

| Débito | Área | Severidade | Impacto se não resolver |
|---|---|---|---|
| 87 arquivos modificados/untracked não commitados (inclui 2 fases de PRD e src/logic novos) | Repositório | 🔴 Alta | Risco de perda de trabalho; impossível rastrear regressões |
| Build quebrado no WSL (node_modules instalado no Windows, binários rollup win32) | Ambiente | 🟡 Média (resolvido em 02/08 com reinstall) | Sem reinstalação, dev server/build falham |
| README.md é o template do Google AI Studio (pede GEMINI_API_KEY, link ai.studio) | Documentação | 🟡 Média | Confunde qualquer visitante/colaborador |
| Commit contaminado: "feat: AstroMap - App de mapa astral com IA" (fb99c58) dentro do histórico | Repositório | 🟡 Média | Histórico mistura 2 projetos |
| Zero testes automatizados em jogo com lógica pura testável | Qualidade | 🔴 Alta | Regressões passam despercebidas (ex: economia, combate, IA) |
| tsconfig sem `strict: true` | Tipagem | 🟡 Média | `any` escapa; bugs de tipo silenciosos |
| Dependências mortas (express, @google/genai, dotenv) | Dependências | 🟢 Baixa | Superfície de ataque desnecessária, bundle maior |
| Caminho antigo do projeto (OneDrive) em PLANO-ATUALIZACAO-AOH2.md | Documentação | 🟢 Baixa | Referências quebradas |
| Arquivos soltos na raiz (vite-dev.log 43 KB, "atualização da ui/" com espaço) | Organização | 🟢 Baixa | Poluição do repo |
| Chunk único de 946 KB (gzip 262 KB) no build | Performance | 🟢 Baixa | Carregamento inicial maior que o necessário |

---

## 7. PRD reverso

**Regras de negócio implícitas (extraídas do código):**
1. **Imutabilidade de estado:** nenhum handler pode mutar `gameState`; deep clone obrigatório (MAESTRO K03).
2. **Custo de ação:** cada ação (recrutar, construir, marchar, atacar, reconhecer, diplomacia) consome pontos de ação (10/turno).
3. **Marcha não é instantânea:** tropas saem da origem imediatamente, ficam em "limbo" e chegam ao fim do turno (processMarchOrders).
4. **Combate com terreno:** montanha/defesa afetam resultado; vencedor pode conquistar; perdedor pode recuar (RetreatInfo).
5. **Visibilidade:** províncias só são visíveis se próprias, vizinhas ou sob reconhecimento (scouts) — névoa de guerra.
6. **Recursos estratégicos:** arqueiros exigem madeira; cavalaria exige cavalos (game-constants).
7. **Diplomacia com memória:** cada reino tem memória (traição, ajuda, agressão) que influencia relações.
8. **Guerra com exaustão:** war score + exaustão de guerra; paz por exaustão (sem peace deals completos).
9. **Capital:** cada reino tem capital; capturá-la dá bônus de war score.
10. **Overextension:** crescimento rápido reduz renda/estabilidade.

**Fluxos reais de usuário:** Novo reinado (configurar mapa/reinos) → gerenciar economia no HUD → recrutar → marchar/atacar → diplomacia → encerrar turno (IA age, renda, eventos) → repetir até dominação ou colapso.

**Permissões e papéis:** Apenas 1 papel (jogador = realm_0, isPlayer). IA controla demais reinos com mesma lógica de custos.

**Integrações ativas:** Nenhuma externa. Tone.js para SFX local, localStorage para persistência.

---

## 8. Delta entre estado atual e desejado

O estado desejado está documentado em artefatos avulsos (não integrados ao framework):

| Funcionalidade desejada | Estado atual | Gap | Prioridade |
|---|---|---|---|
| Diplomacia completa (Fase 1 — PRD-FASE-1) | Alianças/NAPs/tributos ✅; UI e restantes 🟡 | Média | Alta |
| Tecnologia + governos (Fase 2 — PRD-FASE-2) | techLogic/financeLogic criados, sem UI completa | Média | Média |
| Religiões + maravilhas (Fase 3 — PRD-FASE-3) | Não iniciado | Total | Baixa |
| Capitulação, peace deals completos | Só exaustão | Alto | Média |
| Vassalo liberty desire | Não existe | Total | Baixa |
| Testes automatizados (IMPLEMENTACOES-FUTURAS) | Zero | Total | Alta |
| Editor de cenários, multiplayer, i18n, PWA | Não iniciado | Total | Baixa |

**Observação:** os PRDs de Fase 1–3 vivem em `prd/` (untracked, fora do framework docs/). O `PLANO-ATUALIZACAO-AOH2.md` (521 ln) é a matriz comparativa mais completa contra Age of History 2.

---

## 9. Riscos

| Risco | Tipo | Severidade | Recomendação |
|---|---|---|---|
| Perda do working tree não commitado (87 arquivos) | Operacional | 🔴 Alta | Commit imediato de segurança (após OK do usuário) |
| Regressões silenciosas em economia/combate/IA sem testes | Técnico | 🔴 Alta | Sprint 00B: fundação de testes p/ src/logic/ (funções puras) |
| Divergência entre docs/ e prd/ (2 sistemas de documentação) | Processo | 🟡 Média | Unificar no framework docs/ (migrar PRDs após brownfield) |
| Perda do prompt L6 original | Processo | 🟡 Média | Mitigado: template preservado em BROWNFIELD_ANALYSIS_TEMPLATE.md |
| Mapa com 70 províncias degrada performance em mobile fraco | Técnico | 🟢 Baixa | Testar em device real; ajustar decorações condicionais |
| Provider de visão auxiliar do Hermes quebrado (Console Go) | Ferramenta | 🟢 Baixa | Não afeta o jogo; configurar modelo de visão |

---

## 10. Recomendação de próximo passo

**`Criar Pre-PRD`**

**Motivo:** O projeto tem estado desejado disperso (3 PRDs avulsos + matriz AoH2 + melhorias v1), mas nenhum Pre-PRD unificado no framework. Sem ele, o fluxo formal (PRD → revisão → plano → sprints) não tem base. Antes disso, porém, há 2 pré-requisitos operacionais críticos:

1. **Commit de segurança** do working tree (87 arquivos) — sem isso, qualquer trabalho de documentação corre risco de perda.
2. **Sprint 00B (fundação de testes)** — recomendada antes de novas features, dado o débito de zero testes.

**Sequência sugerida:**
1. Commit de segurança (aguardando OK do usuário)
2. Pre-PRD unificado (consolidando prd/ Fase 1–3 + matriz AoH2)
3. Revisão crítica do Pre-PRD
4. PRD mestre versionado
5. Sprint 00B (testes) → sprints de features conforme prioridade
6. Auditoria final ao fim de cada ciclo

---

*Documento gerado por inspeção direta do código em 02/08/2026. Evidências: src/ (37 arquivos), git log (62 commits), npm run build (✓), npx tsc --noEmit (✓), execução local em http://localhost:3000.*
