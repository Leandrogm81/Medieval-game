# MAESTRO.md - Reinos Medievais

Status: always-on
Mode: compact
Role: kernel de execução + auto-melhoria controlada
Hard limits:
- Max 180 linhas
- Max 2200 palavras
- Kernel deve manter <= 12 regras

## 0. Propósito
MAESTRO é o núcleo de regras soberano do projeto Reinos Medievais.
Seu objetivo é:
- Evitar regressões em mecânicas críticas (Economia, Combate, IA).
- Garantir a integridade do estado do jogo (Imutabilidade).
- Manter o custo de contexto baixo e a execução cirúrgica.

## 1. Modelo de Operação
M01. O tempo de execução deve ser enxuto.
M02. Aprendizado por compressão: falhas passadas geram regras densas, não listas infinitas.
M03. Prioridade total para a estabilidade do MVP.
M04. **Think Before Coding:** Não assuma. Se houver ambiguidade, peça clarificação antes de alterar o estado.

## 2. Precedência
P01. Intenção direta do usuário vence, desde que não quebre a lógica pura do jogo.
P02. Regras de Kernel (Seção 4) sobrepõem qualquer outra instrução.
P03. Regras de Domínio aplicam-se apenas à mecânica de jogo.

## 3. Workflow Boundary
W01. MAESTRO define o "quê" e o "porquê". Workflows definem o "como".
W02. Workflows Oficiais:
- INTAKE TRIAGE
- BUILD FLOW
- BUGFIX FLOW
- REFACTOR FLOW
- GAME LOGIC VERIFIER
- VALIDATE GATE
W03. Sempre passe pelo **INTAKE TRIAGE** em tarefas não triviais.

## 4. Kernel (The 12 Rules)
K01. **Think Before Coding:** Analise o fluxo de estado antes de alterar qualquer handler. Surface tradeoffs.
K02. **Minimal Change:** Faça a menor alteração possível (Surgical Changes). Toque apenas no necessário.
K03. **State Integrity:** Nunca mute o `gameState` diretamente. Use Deep Clones para atualizações aninhadas.
K04. **Logic Isolation:** Mantenha regras de negócio em funções puras dentro de `src/logic/`.
K05. **Strict Typing:** Não use `any`. Tipos de jogo devem ser explícitos e centralizados em `src/types.ts`.
K06. **Verification First:** Toda correção deve ter um caminho de validação claro. Loop até verificado.
K07. **UI Consistency:** Siga o padrão Tailwind v4 e animações Framer Motion existentes. Match existing style.
K08. **No Silent Changes:** Não altere formatação ou lógica adjacente sem aviso ou necessidade direta.
K09. **Clean > Clever:** Prefira código legível a "hacks" de performance prematuros ou complexidade desnecessária.
K10. **Error Handling:** Valide entradas e estados impossíveis (ex: ouro negativo, tropa sem tipo).
K11. **Balance Awareness:** Alterações em custos ou forças devem considerar o balanço geral do jogo.
K12. **Evidence Driven:** Não presuma que fixou; prove com logs ou testes visuais (Goal-Driven Execution).

## 5. Domain Rules (Reinos Medievais)
D01. O mapa usa D3 e Voronoi; alterações em `Map.tsx` exigem cuidado com performance de renderização.
D02. O turno é a unidade de tempo sagrada; processamento de fim de turno deve ser atômico.
D03. A economia é baseada em Manutenção vs Produção; discrepâncias devem ser tratadas via `GAME LOGIC VERIFIER`.
D04. IA deve ser determinística para facilitar a depuração.

## 6. Active Rules (Temporary Focus)
A01. Prioridade: Eliminar mutações de estado no `useGameController.ts`.
A02. Corrigir discrepância de recursos entre HUD e Relatório de Turno.
A03. Garantir que o seletor de tropas atualize o payload de Marcha corretamente.

## 7. Self-Improvement
S01. Melhore este arquivo por compressão. Se duas regras dizem o mesmo, una-as.
S02. Errou? Adicione em `Compressed Memory` primeiro, promova a `Active Rule` se persistir.

## 8. Compressed Memory
C01. Mutações em objetos de províncias no `gameState` causam bugs de UI difíceis de rastrear.
C02. O `useEffect` no `useGameController` pode causar loops se a dependência do `gameState` for instável.
C03. Tailwind v4 exige compilação via Vite; classes dinâmicas precisam estar no escopo de scan.
