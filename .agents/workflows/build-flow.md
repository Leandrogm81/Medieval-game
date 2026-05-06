---
description: Workflow para implementar novas funcionalidades no projeto Reinos Medievais com escopo mínimo, risco controlado e validação proporcional.
---

# BUILD FLOW - Reinos Medievais

**Descrição:**  
Use este workflow quando a demanda principal for construir uma nova funcionalidade (ex: novo tipo de tropa, nova regra econômica, novo componente de UI), ampliar comportamento existente ou implementar uma melhoria funcional.  
O objetivo é entregar a menor solução útil, sem over-engineering, sem escopo oculto e preservando a imutabilidade do estado.

---

## 🎯 Missão

Implementar mudanças funcionais com o menor escopo válido, preservando a clareza da lógica em `src/logic/` e a excelência visual da UI.

---

## 🧭 Princípios

- **Construir só o que foi pedido.**
- **Evitar feature creep.**
- **Não esconder refactor dentro de feature.**
- **Priorizar integração nativa ao `gameState`.**
- **A menor solução útil é preferível à solução “mais flexível”.**

---

## 📥 Quando Acionar

Acione este workflow quando a demanda for:

- nova funcionalidade de jogo
- melhoria funcional
- ampliação de fluxo existente (ex: nova ação de província)
- novo componente UI premium
- alteração de comportamento pedida explicitamente

Normalmente **não** é o workflow correto para:

- bugfix puro
- refactor estrutural de estado
- revisão de incidente
- promoção/release

---

## 📥 Entradas Esperadas

- objetivo da funcionalidade
- escopo esperado
- risco vindo do Triage
- restrições conhecidas (ex: limites de recursos)
- impacto em `UI`, `Logic`, `State` ou `IA`
- plano vindo de `Spec / Change Design`, quando aplicável

---

## 📤 Saídas Obrigatórias

- funcionalidade implementada
- escopo real da mudança
- arquivos principais alterados
- riscos residuais
- validação mínima necessária
- workflows auxiliares a acionar, se preciso

---

## 🛠️ Protocolo de Execução

### Passo 1: Confirmar Escopo

Antes de implementar, responder:

- o que esta feature faz?
- o que ela não faz?
- qual o menor resultado aceitável?
- há risco de quebrar a imutabilidade do estado?

Se a resposta ainda estiver vaga, voltar para `Spec / Change Design`.

---

### Passo 2: Preservar Fronteiras

Verificar se a mudança exige workflows auxiliares:

- `Contract Guardian` se tocar em `src/types.ts` ou payloads de ação.
- `Game Logic Verifier` se tocar lógica de combate, economia ou turnos.
- `UI / Accessibility Review` se tocar interface relevante (Framer Motion / Tailwind).
- `Test / Regression Harness` para definir a blindagem mínima.

---

### Passo 3: Escolher a Implementação Mínima

Preferir:

- reaproveitar padrões do `useGameController.ts`.
- isolar lógica pura em `src/logic/`.
- tocar o menor número possível de arquivos.
- usar abstrações já consolidadas.

Evitar:

- mutação direta de estado.
- lógica de negócio misturada com React.
- refactor transversal não pedido.

---

### Passo 4: Implementar

Durante a implementação:

- **Imutabilidade Total:** Use Deep Clones para objetos aninhados.
- manter nomes coerentes com o domínio (Reinos, Províncias, Tropas).
- respeitar tipos em `src/types.ts`.
- registrar qualquer risco residual real.

---

### Passo 5: Definir Blindagem

Antes de encerrar, declarar:

- o que precisa ser validado (ex: o ouro está diminuindo corretamente?).
- se há smoke do fluxo principal.
- se há revisão de lógica ou UI.

---

## 🚫 Fronteiras

Este workflow:

- **não é para bugfix puro**
- **não é para refactor estrutural disfarçado**
- **não promove release**
- **não atualiza MAESTRO**

---

## ✅ Checklist Final

- [ ] O objetivo da feature está claro?
- [ ] A implementação respeita a imutabilidade (Deep Clone)?
- [ ] A lógica de negócio está isolada em `src/logic/`?
- [ ] Não houve refactor escondido?
- [ ] Os workflows auxiliares corretos foram acionados, se necessário?
- [ ] A validação mínima foi declarada?

---

## 📌 Formato de Saída Recomendado

```markdown
**BUILD FLOW Result**
- Objetivo: adicionar sistema de manutenção de exército
- Escopo implementado:
  - lógica de cálculo em `src/logic/economy.ts`
  - atualização do fim de turno no `useGameController`
  - HUD atualizado com custos
- Fora de escopo:
  - penalidades de moral por falta de pagamento
- Riscos residuais:
  - balanceamento de custos pode precisar de ajuste
- Workflows auxiliares:
  - Game Logic Verifier
- Validação mínima:
  - smoke de fim de turno
  - lint / build
```
