---
description: Workflow para mapear rapidamente uma ideia de mecânica, evento ou expansão no Reinos Medievais antes de entrar em PRD, MVP ou Spec detalhada.
---

# PROJECT CANVAS - Reinos Medievais

**Descrição:**  
Use este workflow quando a ideia ainda estiver em estágio inicial, ampla ou parcialmente formada.  
O objetivo é organizar a visão da mecânica, o problema que ela resolve, o impacto no gameplay, a proposta de valor para o jogador, o escopo inicial e os riscos em um formato rápido e claro, antes de acionar o `SPEC STUDIO`.

---

## 🎯 Missão

Transformar uma ideia difusa em um mapa simples e utilizável de mecânica ou feature.

Este workflow existe para:

- Organizar o pensamento inicial sobre novas mecânicas (ex: religião, espionagem, comércio).
- Reduzir a nebulosidade sobre como a feature se encaixa no `gameState`.
- Identificar o problema que a mecânica resolve ou a diversão que ela adiciona.
- Delimitar uma direção inicial de design.
- Decidir se a ideia já está pronta para `DISCOVERY MODE`, `PRD MODE`, `MVP MODE` ou `SPEC MODE`.

---

## 🧭 Princípios

- **Mapa antes de documento longo.**
- **Clareza inicial vale mais que detalhe precoce.**
- **Não discutir implementação (código) cedo demais.**
- **Canvas serve para orientar o Game Design, não para executar.**
- **Mecânica confusa precisa de estrutura leve antes de especificação pesada.**

---

## 📥 Quando Acionar

Acione este workflow quando você quiser:

- Organizar uma ideia de nova mecânica de jogo.
- Pensar um sistema do zero (ex: sistema de clima, sistema de sucessão).
- Resumir um conceito antes do PRD.
- Estruturar uma visão inicial para uma expansão do mapa.
- Validar se a ideia já tem direção suficiente para o balanceamento.
- Sair de brainstorming e entrar em planejamento real.

---

## 📥 Entradas Esperadas

Sempre que possível, informar:

- Ideia inicial (ex: "Sistema de Alianças").
- Problema percebido ou oportunidade de diversão (ex: "O late game está monótono").
- Tipo de projeto (Mecânica, UI, Expansão de Mapa, Balanceamento).
- Impacto no jogador.
- Referências de outros jogos ou inspirações históricas.
- Limitações conhecidas (ex: "Não pode aumentar muito o tempo de processamento do turno").

---

## 📤 Saídas Possíveis

Este workflow pode gerar:

- **Project Canvas**
- **Idea Snapshot**
- **Initial Scope Map**
- **Design Brief**
- **Open Questions List** (Dúvidas de balanceamento ou lógica)
- **Recomendação de próxima rota no SPEC STUDIO**

---

## 🛠️ Protocolo de Execução

### Passo 1: Resumir a Ideia

Transformar a ideia em uma frase simples:

> “Queremos criar / melhorar / testar [X] para [Y].”

Se a frase ainda estiver confusa, simplificar antes de continuar.

---

### Passo 2: Declarar o Objetivo/Problema

Responder:

- Qual necessidade ou oportunidade de gameplay motivou essa ideia?
- Essa mecânica resolve um "buraco" no loop de jogo?
- O que acontece hoje no jogo sem essa solução?

---

### Passo 3: Identificar o Impacto no Gameplay

Mapear:

- Como o jogador interage com isso?
- Quais partes do `gameState` são afetadas (recursos, exército, províncias)?
- Por que o jogador se importaria com essa mecânica?

---

### Passo 4: Definir a Proposta de Valor

Responder:

- Que valor (diversão, desafio, estratégia) essa ideia entrega?
- O que melhoraria na experiência do usuário?
- Qual o benefício mais claro para a retenção do jogador?

---

### Passo 5: Delimitar Escopo Inicial

Registrar:

- O que parece fazer parte da mecânica (ex: "Menu de diplomacia, status de relação").
- O que provavelmente está fora (ex: "Não haverá comércio de recursos por enquanto").
- O que ainda é cedo demais para decidir.

---

### Passo 6: Identificar Restrições e Dependências

Checar, quando aplicável:

- **Performance do Turno:** Vai travar o jogo em mapas grandes?
- **Imutabilidade:** Como isso afeta a estrutura profunda do `GameState`?
- **UI/UX:** Exige novos componentes complexos no Tailwind v4?
- **Balanceamento:** Pode quebrar a economia existente?

---

### Passo 7: Mapear Riscos e Dúvidas

Registrar:

- Principais incertezas de design.
- Riscos de "feature creep" (ficar complexo demais).
- Pontos nebulosos na lógica de cálculo.
- Decisões que dependem de testes de balanceamento.

---

### Passo 8: Escolher a Próxima Rota

Ao final, decidir qual é o próximo passo mais útil:

- `SPEC STUDIO em DISCOVERY MODE` (para explorar como a mecânica funcionaria).
- `SPEC STUDIO em PRD MODE` (para definir os requisitos funcionais).
- `SPEC STUDIO em MVP MODE` (para uma versão mínima testável).
- `SPEC STUDIO em SPEC MODE` (se já houver clareza total).

---

## 🧱 Estrutura Recomendada de Saída

Quando a saída for **Project Canvas**, usar preferencialmente esta estrutura:

1. Título da ideia
2. Resumo da ideia
3. Objetivo principal (Gameplay Goal)
4. Partes afetadas (GameState Scope)
5. Proposta de valor
6. Escopo inicial
7. Fora de escopo inicial
8. Restrições e dependências
9. Riscos e dúvidas
10. Próximo passo recomendado

---

## 🚫 Fronteiras

Este workflow:

- **não implementa código.**
- **não gera lógica pura em `src/logic/` diretamente.**
- **não altera o `types.ts`.**
- **não substitui o PRD detalhado.**
- **não inicia BUILD FLOW.**

---

## ✅ Checklist Final

- [ ] A ideia foi resumida com clareza?
- [ ] O objetivo de gameplay foi identificado?
- [ ] O impacto no `gameState` foi mapeado?
- [ ] A proposta de valor (diversão) ficou clara?
- [ ] O escopo inicial foi delimitado?
- [ ] Os riscos de balanceamento/performance foram registrados?
- [ ] A próxima rota no Spec Studio foi escolhida?

---

## 📌 Formato de Saída Recomendado

```markdown
**PROJECT CANVAS Result**
- Ideia: [descrição]
- Objetivo de Gameplay: [descrição]
- Impacto no Estado: [quais objetos do gameState mudam]
- Proposta de valor: [por que é divertido/necessário]
- Escopo inicial:
  - [item]
  - [item]
- Fora de escopo inicial:
  - [item]
  - [item]
- Restrições técnicas/balanceamento:
  - [item]
- Riscos e dúvidas:
  - [item]
- Próxima rota recomendada:
  - SPEC STUDIO em [modo]
```
