# 🏰 PROJECT CANVAS — Melhorias v1 · Reinos Medievais

> Documento gerado pelo workflow `/project-canvas`.
> Rota de execução recomendada ao fim de cada item.

---

## 📋 RESUMO GERAL

Seis melhorias identificadas pelo jogador + sugestões extras inspiradas em **Age of History 2**.
Classificadas por risco técnico e impacto no `gameState`.

---

## ITEM 1 — Tamanho de Fonte na UI dos Painéis

**Resumo:** Aumentar levemente o tamanho da fonte dos rótulos e valores nos painéis laterais
(ex.: "MANUTENÇÃO MILITAR", "INF: 5", "ADMINISTRAÇÃO REGIONAL", "INFANTARIA", etc.).

**Objetivo de Gameplay:** Legibilidade. O jogador precisa ler informações rapidamente durante
a gestão de províncias. Texto pequeno cansa e cria fricção desnecessária.

**Impacto no GameState:** Nenhum. Mudança puramente de UI/CSS.

**Proposta de valor:** Conforto visual imediato. Zero risco de regressão lógica.

**Escopo:**

- Ajustar font-size das classes de rótulos nos componentes de painel (ProvincePanel / SidePanel).
- Garantir que o ajuste não quebre o layout em viewports menores.

**Fora de escopo:** Refatoração total do sistema de tipografia.

**Restrições:** Tailwind v4 — usar valores via @theme ou classes utilitárias existentes.

**Riscos:** Baixo. Quebra de layout se os painéis não tiverem espaço suficiente para fonte maior.

**Próxima rota:** BUILD FLOW (trivial) — pode ir direto para implementação.

---

## ITEM 2 — Persistência de Tropas Durante Marcha

**Resumo:** Quando o jogador desloca tropas para outra província (march order), elas devem
permanecer na província de destino nas rodadas seguintes em vez de desaparecer.

**Diagnóstico técnico:**
Olhando o código em turnLogic.ts (função processMarchOrders), quando remainingPath.length === 0
e order.troops chegam no destino, as tropas são somadas ao prov.army. Porém, se a província
destino for enemy ou neutral, a lógica remove o MarchOrder mas pode não persistir as tropas
restantes após combate. Também há risco de tropas "em trânsito" não aparecerem no mapa.

**Impacto no GameState:**

- MarchOrder.currentProvId
- Province.army
- Province.troops

**Proposta de valor:** Consistência estratégica — o jogador pode confiar que suas decisões
de posicionamento têm efeito duradouro.

**Escopo:**

- Revisar o fluxo de processMarchOrders quando result.won === true:
  garantir que result.attackerRemaining é persistido no nextProv.army.
- Garantir que marchOrders com remainingPath === [] e destino já amigo
  fazem merge correto no army (sem race condition de deep clone).
- Exibir na UI tropas "em trânsito" de forma distinta (ícone de marcha).

**Fora de escopo:** Animação contínua frame-a-frame da marcha.

**Restrições:** Imutabilidade — clonar state antes de qualquer mutação.

**Riscos:** Médio. A lógica de combate em marcha (resolveCombat inline) já aplica resultado,
mas o estado pós-vitória pode não fazer merge correto das tropas sobreviventes.

**Próxima rota:** BUGFIX FLOW → revisar processMarchOrders L205-L232 no turnLogic.ts.

---

## ITEM 3 — Aba de Comércio de Recursos

**Resumo:** Criar uma aba "Comércio" onde o jogador pode trocar recursos (ouro, comida,
materiais) usando taxas de câmbio baseadas na escassez e no valor relativo de cada recurso.

**Objetivo de Gameplay:** Resolver desequilíbrios pontuais de recursos sem depender apenas
de conquista. Adiciona uma dimensão econômica de gestão.

**Impacto no GameState:**

- Realm.gold, Realm.food, Realm.materials
- Realm.actionPoints (o comércio custa 1 AP por transação)
- Realm.tradeRoutes (pode ser expandido para habilitar rotas comerciais entre reinos)

**Regras de Taxa de Câmbio (proposta inicial):**

| De → Para | Taxa base |
|-----------|-----------|
| Ouro → Comida | 1 ouro = 3 comida |
| Ouro → Material | 1 ouro = 2 material |
| Comida → Ouro | 3 comida = 1 ouro |
| Comida → Material | 2 comida = 1 material |
| Material → Ouro | 2 material = 1 ouro |
| Material → Comida | 1 material = 2 comida |

As taxas podem flutuar ±20% com base no nível de escassez do recurso alvo no reino.

**Proposta de valor:** Controle econômico ativo. O jogador não precisa depender de
RNG de eventos para equilibrar recursos.

**Escopo:**

- Nova aba "Comércio" no painel de gestão do reino.
- Função executeTradeExchange(realm, from, to, amount) em economyLogic.ts.
- Custo: 1 AP por transação (máx. 3 transações/turno para evitar abuso).
- Slider de quantidade na UI.
- Preview do resultado antes de confirmar.

**Fora de escopo (v1):** Comércio entre reinos IA; rotas comerciais dinâmicas.

**Restrições:** O custo em AP deve ser balanceado para não tornar o AP o único
gargalo do jogo.

**Riscos:** Médio. Risco de inflação descontrolada se as taxas forem muito favoráveis.
Limitar volume máximo por turno é essencial.

**Próxima rota:** SPEC STUDIO em PRD MODE → definir taxas, limites e UI detalhada.

---

## ITEM 4 — Painel de Informações Completo das Províncias

**Resumo:** Ao clicar em uma província, o jogador deve ver claramente:
tropas (por tipo), população recrutável, construções existentes, produtividade
(ouro/comida/material por turno), lealdade e recurso estratégico.

**Diagnóstico:** Os dados já existem no Province (campos army, population,
buildings, foodProduction, wealth, loyalty, strategicResource). O problema
é que a UI não os exibe todos ou os exibe de forma truncada.

**Impacto no GameState:** Nenhum. Apenas leitura de dados existentes.

**Proposta de valor:** O jogador toma decisões informadas sobre onde recrutar,
onde construir, e quais províncias priorizar para defesa.

**Escopo:**

- Expandir o componente ProvincePanel para incluir:
  - Exército: INF / ARQ / CAV / BAT com ícones
  - Lealdade: barra visual com % e estado (rebelde/leal)
  - Construções: farms / mines / workshops / courts com nível
  - Produtividade: ouro + comida + material estimados por turno
  - Recrutáveis: Math.floor(province.population * 0.1) — 10% da população
  - Recurso estratégico: ícone + nome
- Adicionar seção "Província" claramente visível no painel lateral.

**Fora de escopo:** Histórico de eventos por província; gráfico de tendência de lealdade.

**Restrições:** O painel lateral já existe — expansão deve ser feita sem quebrar o layout.

**Riscos:** Baixo. Apenas UI read-only.

**Próxima rota:** BUILD FLOW (standard) → implementar diretamente no painel existente.

---

## ITEM 5 — Sistema de Estabilidade de Província

**Resumo:** Criar o recurso stability (0–100) por província, distinto de loyalty.
Estabilidade mede a capacidade administrativa e social da província de funcionar
eficientemente, independente de quem a controla.

**Diferença de Loyalty vs. Stability:**

| Aspecto | Loyalty (já existe) | Stability (novo) |
|---------|---------------------|------------------|
| O que mede | Fidelidade ao governante | Ordem e funcionalidade |
| Afetado por | Conquista, distância, eventos | Guerras, rebeliões, construções |
| Efeito | Risco de rebelião | Eficiência produtiva |
| Escala | 0–100 | 0–100 |

**Regras de Estabilidade (proposta):**

```
estabilidade_inicial = 70 (ao gerar o mapa)

PENALIDADES por turno:
  - Província recém-conquistada:   -10/turno (primeiros 3 turnos)
  - Rebelião ocorreu:              -20 (imediato)
  - Guerra ativa na região:        -3/turno
  - Lealdade < 30:                 -5/turno
  - Overextension do reino > 80:  -2/turno

BÔNUS por turno:
  - Tribunal (courts) presente:   +5/turno
  - Lealdade > 70:                +3/turno
  - Sem guerra por 3+ turnos:    +4/turno
  - Capital do reino:             +5/turno

EFEITO NA PRODUÇÃO:
  stability 80–100: efficiency × 1.0 (sem penalidade)
  stability 50–79:  efficiency × 0.85
  stability 20–49:  efficiency × 0.65
  stability 0–19:   efficiency × 0.40 + risco de rebelião aumentado
```

**Impacto no GameState:**

- Novo campo stability: number na interface Province em types.ts
- Lógica de cálculo em processEndOfTurn dentro de turnLogic.ts
- Fator de stability aplicado ao cálculo de efficiency na produção

**Proposta de valor:** Gestão pós-conquista mais profunda. O jogador precisa
estabilizar novas províncias antes de extrair valor delas. Cria tensão estratégica
real entre expansão rápida e consolidação.

**Escopo v1:**

- Adicionar stability ao tipo Province
- Inicializar com 70 em mapGeneration.ts
- Calcular variação por turno em processEndOfTurn
- Aplicar multiplicador de efficiency baseado em stability
- Exibir stability no painel de informações de província (Item 4)

**Fora de escopo v1:** Eventos especiais de instabilidade; políticas de pacificação;
agentes administrativos.

**Restrições:** Não pode criar loop de regressão — stability baixa reduz produção,
o que reduz gold, o que reduz loyalty, o que reduz stability. Precisa de limites mínimos.

**Riscos:** Médio-alto. Altera a fórmula de efficiency que impacta toda a economia.
Requer teste de balanceamento antes de promover.

**Próxima rota:** SPEC STUDIO em PRD MODE → definir fórmulas e limites exatos,
depois BUILD FLOW → GAME LOGIC VERIFIER.

---

## ITEM 6 — Províncias nas Bordas sem Nome e sem Informações

**Resumo:** Províncias geradas nas extremidades do mapa ficam sem nome visível
e sem dados de tropas exibidos no mapa.

**Diagnóstico provável:** O centro calculado (province.center) cai fora da viewport
ou muito próximo da borda, fazendo o label de texto SVG ficar cortado.
Pode ser também que os polígonos das bordas sejam gerados com vértices fora dos limites
e o centroid calculado seja inválido.

**Impacto no GameState:** Nenhum nos dados. Apenas na renderização do mapa SVG.

**Proposta de valor:** Consistência visual. Todas as províncias devem ser jogáveis
e legíveis.

**Escopo:**

- Em mapGeneration.ts: adicionar clamp no centroid calculado para garantir que
  center[0] ∈ [padding, 1280 - padding] e center[1] ∈ [padding, 720 - padding].
- Em App.tsx: garantir que labels de texto verificam se o centro está dentro
  do viewport antes de renderizar.
- Verificar se province.name é gerado corretamente para todas as províncias.

**Fora de escopo:** Redesign do algoritmo de geração de mapa.

**Riscos:** Baixo. Bugfix cirúrgico de coordenadas.

**Próxima rota:** BUGFIX FLOW → localizar mapGeneration.ts e componente de render SVG.

---

## 💡 SUGESTÕES EXTRAS (Inspiradas em Age of History 2)

### S1 — Sistema de Diplomacia Ativa

Permitir ao jogador propor paz, aliança ou vassalagem via painel diplomático.
A IA já tem relations e memory — falta a UI e a lógica de aceitação/rejeição por personalidade.
Rota: SPEC STUDIO em DISCOVERY MODE

### S2 — Condição de Vitória por Prestígio

Adicionar um recurso prestige ao Realm que cresce com vitórias militares, construções
e eventos positivos. Vitória por ter o maior prestígio após X turnos.
Rota: SPEC STUDIO em PRD MODE

### S3 — Eventos Históricos com Escolhas Ramificadas

Pool maior de eventos com consequências alternativas (ex.: "Seca severa — escolha:
gastar 200 ouro em irrigação OU perder 30% da comida"). O sistema em handleRandomEvents
já existe — apenas expandir.
Rota: BUILD FLOW (standard)

### S4 — Mapa de Calor de Estabilidade / Lealdade

No painel superior, permitir trocar o ViewMode para visualizar a estabilidade
ou lealdade de cada província por gradiente de cor (verde = estável, vermelho = crítico).
O tipo ViewMode já suporta modos adicionais.
Rota: BUILD FLOW (trivial)

### S5 — Sistema de Sucessão / Líder do Reino

Adicionar um "Ruler" ao Realm com atributos simples (martial, steward, diplomat).
Cada atributo dá bônus em combate, economia ou diplomacia. A morte do líder (a cada
N turnos aleatoriamente) desencadeia uma crise de sucessão.
Rota: SPEC STUDIO em DISCOVERY MODE

---

## 📊 PRIORIZAÇÃO SUGERIDA

| # | Item | Risco | Esforço | Impacto | Prioridade |
|---|------|-------|---------|---------|------------|
| 6 | Bordas sem nome | Baixo | Pequeno | Alto | 1ª |
| 1 | Tamanho de fonte | Baixo | Pequeno | Médio | 2ª |
| 4 | Painel de informações | Baixo | Médio | Alto | 3ª |
| 2 | Persistência de tropas | Médio | Médio | Alto | 4ª |
| 3 | Aba de comércio | Médio | Grande | Alto | 5ª |
| 5 | Estabilidade de província | Alto | Grande | Alto | 6ª |

---

## ✅ Checklist de Canvas

- [x] Ideias resumidas com clareza
- [x] Objetivos de gameplay identificados
- [x] Impacto no gameState mapeado por item
- [x] Propostas de valor definidas
- [x] Escopos iniciais delimitados
- [x] Riscos de balanceamento e performance registrados
- [x] Rotas no Spec Studio escolhidas por item
