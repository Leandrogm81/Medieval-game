---
description: Workflow para diagnosticar causa raiz e aplicar correção mínima no projeto Reinos Medievais com foco em integridade de estado.
---

# BUGFIX FLOW - Reinos Medievais

**Descrição:**  
Use este workflow quando a demanda for corrigir um comportamento inesperado, erro de cálculo, falha visual ou quebra de estado.  
O objetivo é identificar a causa raiz, isolar o problema e aplicar a correção mais cirúrgica possível, garantindo que não haja regressões em outras partes do jogo.

---

## 🎯 Missão

Corrigir falhas com precisão cirúrgica, priorizando a estabilidade do `gameState` e a integridade das mecânicas de jogo.

---

## 🧭 Princípios

- **Corrigir apenas o que está quebrado.**
- **Não introduzir novas funcionalidades durante o fix.**
- **Se a causa raiz for instabilidade de estado, use Deep Clone.**
- **Toda correção deve ser validada contra o comportamento original.**
- **Não assumir que "parece corrigido" sem evidência.**

---

## 📥 Entradas Esperadas

- Descrição do bug vinda do Triage.
- Risco (geralmente `standard` ou `risky`).
- Evidência (logs de estado, prints, passos de reprodução).
- Código afetado identificado no Triage.

---

## 📤 Saídas Obrigatórias

- Bug corrigido.
- Causa raiz documentada (breve).
- Teste de não-regressão realizado.
- Lint e Build validados.

---

## 🛠️ Protocolo de Execução

### Passo 1: Reprodução
Tente reproduzir o erro. Se não for possível reproduzir localmente, analise os logs de estado ou o código de lógica pura (`src/logic/`).
- "O que causa este estado?"
- "Onde a imutabilidade foi quebrada?"

### Passo 2: Causa Raiz
Identifique onde a falha ocorre:
- UI (Framer Motion / Tailwind v4)
- Estado (`useGameController`)
- Lógica Pura (`src/logic/`)
- Contrato (Tipos em `src/types.ts`)

### Passo 3: Correção Cirúrgica
Aplique a menor mudança possível.
- Se for estado: Garanta que o novo objeto é uma cópia profunda.
- Se for lógica: Ajuste a função pura e garanta que ela continua determinística.

### Passo 4: Validação
- O erro sumiu?
- O `gameState` continua consistente?
- Houve regressão em áreas adjacentes?

### Passo 5: Blindagem
Se o bug for recorrente, adicione uma regra preventiva no `MAESTRO.md` ou melhore a tipagem em `src/types.ts`.

---

## ✅ Checklist Final

- [ ] A causa raiz foi identificada?
- [ ] A correção é cirúrgica (mínima necessária)?
- [ ] O `gameState` está seguro (imutável)?
- [ ] Lint e Build passam?
- [ ] Teste de não-regressão realizado?

---

## 📌 Formato de Saída Recomendado

```markdown
**BUGFIX Result**
- Causa Raiz: Mutação direta no objeto de província durante marcha.
- Correção: Implementado Deep Clone no handler de movimento.
- Arquivos: `src/hooks/useGameController.ts`
- Validação: Marcha testada 5x, estado verificado via log.
- Risco Residual: Baixo.
```
