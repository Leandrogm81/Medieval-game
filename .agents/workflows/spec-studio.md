---
description: Workflow para transformar uma ideia de mecânica ou feature em um documento claro de planejamento no Reinos Medievais, usando DISCOVERY MODE, PRD MODE, MVP MODE ou SPEC MODE, sem executar o projeto.
---

# SPEC STUDIO - Reinos Medievais

**Descrição:**  
Use este workflow quando a necessidade principal for pensar, organizar e documentar uma ideia de jogo antes da implementação técnica.  
O objetivo é transformar uma ideia vaga (ex: "quero um sistema de religião"), parcial ou já discutida em um artefato claro de planejamento e design, sem iniciar a execução no código.

---

## 🎯 Missão

Converter intenção de gameplay em clareza, escopo e documentação técnica utilizável.

Este workflow existe para:

- Entender o problema real de gameplay ou oportunidade de design.
- Definir objetivos e não-objetivos (limites da feature).
- Separar o MVP da mecânica de expansões futuras.
- Reduzir ambiguidade na lógica de estado (`gameState`).
- Gerar um documento de planejamento sólido que sirva de guia para o `BUILD FLOW`.

---

## 🧭 Princípios

- **Planejamento de Game Design vem antes da execução técnica.**
- **Documento bom reduz retrabalho na lógica imutável.**
- **Escopo claro vale mais do que documento longo.**
- **Não-objetivos são obrigatórios para evitar feature creep.**
- **MVP da mecânica deve ser separado da visão final.**
- **Especificação não é implementação (não escreva código aqui).**

---

## 📥 Quando Acionar

Acione este workflow quando você quiser:

- Transformar uma ideia de mecânica em um PRD de jogo.
- Montar uma spec de funcionalidade (ex: Novo Painel de Diplomacia).
- Definir o MVP de um sistema complexo.
- Organizar o escopo de balanceamento.
- Esclarecer prioridades de desenvolvimento.
- Gerar um documento-base antes de iniciar o `BUILD FLOW`.

---

## 📥 Entradas Esperadas

Sempre que possível, informar:

- Ideia inicial ou conceito de gameplay.
- Problema que deseja resolver (ex: "Falta de profundidade estratégica no combate").
- Objetivo principal da feature.
- Contexto do projeto (ex: "Para ser integrado ao sistema de turnos atual").
- Referências ou inspirações de outros jogos.
- Limitações conhecidas (ex: "Não pode mudar a estrutura de Províncias").

---

## 📤 Saídas Possíveis

Este workflow pode gerar:

- **Discovery Brief** (Exploração de mecânica)
- **PRD de Jogo** (Requisitos de produto)
- **Game Design Spec** (Detalhamento da mecânica)
- **Feature Spec** (Detalhes de interface e fluxo)
- **MVP Scope** (Versão mínima da feature)
- **Open Questions List** (Dúvidas de balanceamento)

---

## 🔀 Modos Internos

### DISCOVERY MODE

Use quando a ideia de gameplay ainda estiver crua, confusa ou ampla demais.  
*Pergunta:* “O que realmente vale a pena definir aqui antes de escrever uma spec?”

### PRD MODE

Use quando o foco for o "O quê" e o "Porquê". Define o problema, o jogador-alvo, o valor da feature e o escopo geral.  
*Pergunta:* “O que estamos criando, por que isso é divertido e qual o resultado esperado no jogo?”

### MVP MODE

Use quando o risco principal for **complexidade excessiva**. Foca em cortar o que não é essencial para a primeira versão funcional.  
*Pergunta:* “Qual é a menor versão desta mecânica que já adiciona valor ao jogo?”

### SPEC MODE

Use quando o foco for a **definição operacional**. Como a mecânica interage com o `gameState`, quais são as regras de cálculo e fluxos de UI.  
*Pergunta:* “Como essa funcionalidade deve ser definida para que o Coder possa implementá-la sem dúvidas?”

---

## 🛠️ Protocolo de Execução

### Passo 1: Clarificar a Ideia

Resumir: “Queremos criar [X] para resolver [Y] e melhorar a experiência de [Z].”

### Passo 2: Identificar o Impacto no Game Design

Qual o loop de jogo afetado? Como isso altera o balanço de poder entre os reinos?

### Passo 3: Definir Objetivos e Não-Objetivos

Liste claramente o que a feature **não** fará nesta etapa.

### Passo 4: Mapear Requisitos (Lógica e UI)

- **Lógica de Jogo:** Cálculos, fórmulas, alterações no `gameState`.
- **UI/UX:** Componentes Tailwind v4, animações Framer Motion, feedback visual.
- **Dados:** Novos tipos em `src/types.ts`.

### Passo 5: Registrar Riscos e Dúvidas de Balanceamento

Mecânicas de jogo sempre trazem riscos de "exploits" ou tédio. Registre-os aqui.

---

## 🧱 Estrutura de Saída Recomendada (Exemplo PRD)

1. **Título**
2. **Resumo Executivo** (Conceito da feature)
3. **Objetivo de Gameplay**
4. **Escopo do MVP**
5. **Requisitos de Lógica** (Fórmulas e Regras)
6. **Requisitos de UI** (Componentes e Animações)
7. **Não-Objetivos** (O que fica de fora)
8. **Critérios de Sucesso/Aceite**
9. **Questões em Aberto**

---

## 🚫 Fronteiras

Este workflow:

- **não implementa código.**
- **não inicia BUILD FLOW automaticamente.**
- **não faz DEBUG TRACE.**
- **não altera o MAESTRO.md.**

---

## ✅ Checklist Final

- [ ] A ideia de gameplay foi esclarecida?
- [ ] O objetivo foi definido (Diversão vs Balanceamento)?
- [ ] Não-objetivos foram listados?
- [ ] O impacto no `gameState` foi previsto?
- [ ] O modo correto foi escolhido?
- [ ] O documento está pronto para ser passado para o `BUILD FLOW`?

---

## 📌 Formato de Saída Recomendado

```markdown
**SPEC STUDIO Result**
- Modo usado: `SPEC MODE`
- Artefato gerado: `Feature Spec`
- Ideia: [descrição]
- Objetivo: [descrição]
- Regras de Lógica (gameState): [descrição]
- Não-objetivos:
  - [item]
- MVP:
  - [item]
- Questões em aberto:
  - [item]
- Próxima rota sugerida:
  - BUILD FLOW
```
