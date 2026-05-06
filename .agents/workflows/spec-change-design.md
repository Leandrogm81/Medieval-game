---
description: Workflow para transformar intenção em escopo operacional claro antes da implementação no Reinos Medievais.
---

# Spec / Change Design - Reinos Medievais

**Descrição:**  
Use este workflow quando uma mudança de mecânica ou feature não for trivial e precisar de clareza de escopo antes de entrar no `BUILD FLOW` ou no `BUGFIX FLOW`.  
O objetivo é reduzir improviso, evitar overbuilding e deixar explícito o que será feito, o que **não** será feito e como a mudança será validada na lógica do jogo.

---

## 🎯 Missão

Converter uma demanda em um plano de mudança mínimo, claro e verificável, com risco controlado e sem inflar a implementação.

---

## 🧭 Princípios

- **Planejar só o suficiente para reduzir erros de estado.**
- **Não transformar toda mudança em um PRD complexo.**
- **Escopo explícito evita feature creep e bugs de balanceamento.**
- **Não-objetivos são tão importantes quanto objetivos.**
- **O melhor design é o menor que resolve o problema sem mutar o estado indevidamente.**

---

## 📥 Quando Acionar

Acione este workflow quando a mudança for:

- `standard` com ambiguidade relevante.
- `risky` (ex: mexe em ouro, exército ou IA).
- `structural` (ex: muda a forma como províncias são armazenadas).
- Nova feature de fluxo de jogo.
- Mudança em cálculo de combate ou economia.
- Refactor com risco de comportamento (ex: migração para Deep Clones).

Normalmente **não** é necessário para mudanças `trivial`.

---

## 📥 Entradas Esperadas

- Objetivo da mudança (ex: "Corrigir o cálculo de manutenção de cavalaria").
- Contexto do pedido.
- Resultado esperado no gameplay.
- Área afetada (`UI`, `GameState`, `Logic`, `Types`, `IA`).
- Restrições conhecidas.
- Risco vindo do `INTAKE TRIAGE`.

---

## 📤 Saídas Obrigatórias

- **Objetivo operacional** (O que o código fará).
- **Não-objetivos** (O que será ignorado).
- **Impacto por camada** (UI vs Lógica Pura).
- **Riscos principais** (Mutações, Performance, Balanceamento).
- **Plano mínimo de implementação.**
- **Validação mínima exigida** (Logs, Build, Game Logic Verifier).
- **Workflow seguinte recomendado.**

---

## 🛠️ Protocolo de Execução

### Passo 1: Reescrever o Objetivo

Converter o pedido em uma frase objetiva:
> “A mudança deve permitir / corrigir / alinhar [X] garantindo que [Y] permaneça imutável.”

### Passo 2: Declarar Não-Objetivos

Registrar explicitamente o que **não** faz parte da mudança.

- Ex: "Não redesenhar o HUD, apenas corrigir o valor exibido".

### Passo 3: Mapear Impacto no Estado

Definir onde a mudança toca no `GameState`:

- `Kingdoms`
- `Provinces`
- `Turn Control`
- `Combat Payloads`

### Passo 4: Identificar Riscos Reais

Responder:

- Pode quebrar a imutabilidade?
- Pode gerar recursos negativos impossíveis?
- Pode travar o processamento do fim de turno?

### Passo 5: Desenhar a Implementação Mínima

Descrever o menor plano válido:

- Abordagem escolhida (ex: "Adicionar helper em `src/logic/economy.ts`").
- Por que esta é a menor mudança útil?

### Passo 6: Definir Validação

- `GAME LOGIC VERIFIER` (obrigatório para mudanças em cálculos).
- `CONTRACT GUARDIAN` (se houver mudança de tipos).
- Smoke test do fluxo de turno.

---

## 🚫 Fronteiras

Este workflow:

- **não implementa.**
- **não corrige bug diretamente.**
- **não valida release final.**
- **não atualiza MAESTRO.md.**

---

## ✅ Checklist Final

- [ ] O objetivo foi reescrito com clareza?
- [ ] Os não-objetivos foram declarados?
- [ ] O impacto no `gameState` foi mapeado?
- [ ] Os riscos de balanceamento/imutabilidade foram identificados?
- [ ] A implementação mínima foi descrita?
- [ ] O próximo workflow foi escolhido (`BUILD FLOW` ou `BUGFIX FLOW`)?

---

## 📌 Formato de Saída Recomendado

```markdown
**Change Design Result**
- Objetivo: [descrição]
- Não-objetivos:
  - [item]
- Impacto:
  - [UI/Logic/Types]
- Riscos:
  - [ex: mutação de estado no turno]
- Plano mínimo:
  - [passo 1]
  - [passo 2]
- Validação mínima:
  - Game Logic Verifier
  - build
- Próximo workflow:
  - BUILD FLOW
```
