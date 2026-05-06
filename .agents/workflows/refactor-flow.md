---
description: Workflow para conduzir refactors e redução de dívida técnica no projeto Reinos Medievais sem contaminar fluxos de bugfix e feature.
---

# REFACTOR FLOW - Reinos Medievais

**Descrição:**  
Use este workflow quando a motivação principal da mudança for estrutural: simplificação de estado, isolamento de lógica em `src/logic/`, transformação de shallow clones em deep clones ou organização de componentes UI.  
O objetivo é impedir refactors disfarçados e manter a estabilidade do jogo.

---

## 🎯 Missão

Executar refactors mínimos e úteis, preservando o comportamento das mecânicas de jogo e eliminando mutações de estado.

---

## 🧭 Princípios

- **Refactor não é desculpa para reescrever o motor do jogo.**
- **Preservar o comportamento do turno e da economia é obrigatório.**
- **Prioridade 1: Segurança de Estado.** Mudar de mutação para imutabilidade.
- **Dívida real (ex: lógica gigante no componente) vale mais do que perfeccionismo.**
- **Se a mudança altera as regras do jogo, não é este workflow.**

---

## 📥 Quando Acionar

Acione este workflow quando a intenção principal for:

- extrair lógica de componentes para `src/logic/`
- substituir mutações por imutabilidade (Deep Clone)
- simplificar o `useGameController.ts`
- organizar estrutura de tipos em `src/types.ts`
- melhorar legibilidade e reduzir acoplamento

---

## 📥 Entradas Esperadas

- área afetada (ex: handler de combate)
- problema estrutural (ex: "lógica de economia está no useEffect")
- comportamento que deve ser preservado
- limites do refactor

---

## 📤 Saídas Obrigatórias

- problema estrutural definido
- escopo do refactor
- não-objetivos
- comportamento que deve permanecer intacto
- validação mínima (precisa garantir que o jogo ainda funciona igual)

---

## 🛠️ Protocolo de Execução

### Passo 1: Declarar a Dívida

Definir o problema real em uma frase.

Exemplos:

- "Handler de marcha está alterando o estado original diretamente."
- "Cálculo de impostos está duplicado em dois lugares."
- "Componente Map.tsx está processando lógica de combate."

---

### Passo 2: Delimitar o Escopo

Especificar:

- o que será tocado
- o que **não** será tocado
- qual a fronteira da mudança (ex: apenas a função X em economy.ts)

---

### Passo 3: Declarar Preservação de Comportamento

Responder:

- O resultado do turno deve ser idêntico?
- O gameState deve ter o mesmo formato final?

---

### Passo 4: Escolher a Menor Abordagem Útil

Preferir:

- extração de funções puras.
- alinhamento de naming com o domínio medieval.
- centralização de estado no controller.

Evitar:

- novas bibliotecas de estado sem necessidade.
- generalização prematura de mecânicas.

---

### Passo 5: Avaliar Risco

Checar:

- risco de quebrar o salvamento/carregamento.
- risco de introduzir bugs de referência.
- necessidade de `Game Logic Verifier`.

---

### Passo 6: Definir Validação

Normalmente envolverá:

- conferência de imutabilidade.
- testes de fim de turno.
- lint / build.

---

## 🚫 Fronteiras

Este workflow:

- **não inventa regra de jogo**
- **não corrige bugs complexos sem declarar**
- **não muda mecânicas de balanceamento**
- **não atualiza MAESTRO**

---

## ✅ Checklist Final

- [ ] A dívida técnica foi definida?
- [ ] O escopo do refactor foi delimitado?
- [ ] A imutabilidade foi garantida?
- [ ] O comportamento do jogo permanece idêntico?
- [ ] A lógica de negócio foi movida para `src/logic/`?

---

## 📌 Formato de Saída Recomendado

```markdown
**Refactor Plan**
- Área: `useGameController.ts` / handler de impostos
- Problema estrutural: lógica de impostos mutava o estado das províncias
- Escopo:
  - mover cálculo para `src/logic/economy.ts`
  - usar deep clone no controller
- Não-objetivos:
  - não mudar o valor dos impostos
- Validação mínima:
  - passar turno e conferir ouro
  - build / lint
```
