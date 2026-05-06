---
description: Workflow para transformar incidentes reais em aprendizado filtrado, melhoria operacional e prevenção de recorrência no Reinos Medievais.
---

# Incident Review - Reinos Medievais

**Descrição:**  
Use este workflow após incidentes relevantes de gameplay, regressões repetidas (ex: bug de ouro que volta), quebras na lógica de turno ou falhas críticas de imutabilidade.  
O objetivo é extrair aprendizado útil sem transformar cada erro em burocracia excessiva, garantindo que o jogo se torne mais robusto a cada falha.

---

## 🎯 Missão

Converter incidente real em melhoria filtrada: melhor teste de lógica, melhor validação de imutabilidade, melhor observabilidade do `gameState` ou, raramente, uma nova regra no `MAESTRO.md`.

---

## 🧭 Princípios

- **Nem todo incidente merece virar regra permanente.**
- **Aprendizado útil vale mais que documentação volumosa.**
- **Primeiro entender a falha na lógica de estado, depois pensar em prevenção.**
- **MAESTRO só muda quando a lição for geral, recorrente e densa.**
- **O resultado ideal é prevenção proporcional ao risco da mecânica.**

---

## 📥 Quando Acionar

Acione este workflow quando houver:

- Corrupção do `gameState` (objetos sumindo, valores impossíveis).
- Regressão repetida de balanceamento (ex: cavalaria buffada demais novamente).
- Loop infinito ou crash no processamento de fim de turno.
- Bug de difícil diagnóstico em componentes de UI complexos (ex: Map.tsx).
- Falha não capturada pelo `GAME LOGIC VERIFIER`.

---

## 📥 Entradas Esperadas

- Descrição do que aconteceu (ex: "Ouro dobrou ao salvar o jogo").
- Evidências (logs, prints ou objeto `gameState` corrompido).
- Impacto real (ex: "Jogadores podem ficar ricos instantaneamente").
- Correção aplicada (se já foi feita).
- Causa raiz (ex: "Mutações diretas no controller ignorando imutabilidade").

---

## 📤 Saídas Obrigatórias

- **Resumo do incidente.**
- **Causa raiz resumida.**
- **Lacuna que permitiu a falha** (ex: falta de `structuredClone`).
- **Melhoria proposta** (teste, fixture ou mudança de workflow).
- **Decisão sobre registro formal.**
- **Decisão sobre sugestão ao MAESTRO.**

---

## 🛠️ Protocolo de Execução

### Passo 1: Resumir o Incidente

“O que aconteceu, onde e com qual impacto no jogo?”

### Passo 2: Declarar a Causa Raiz

Foco técnico: Foi uma mutação? Foi um erro de cálculo? Foi uma falha de sincronia no turno?

### Passo 3: Identificar a Lacuna

- Faltou `GAME LOGIC VERIFIER`?
- Faltou `CONTRACT GUARDIAN`?
- Faltou verificação de imutabilidade?
- Faltou smoke test do fluxo de turno?

### Passo 4: Escolher a Prevenção Mínima

- Teste direcionado em `src/logic/`.
- Nova fixture de estado no `Game Logic Verifier`.
- Ajuste no `INTAKE TRIAGE` para capturar esse risco melhor.

### Passo 5: Aplicar Filtro de MAESTRO

A lição é geral o suficiente para o Kernel? Se sim, sugira a adição em `Compressed Memory` ou `Active Rules`.

---

## 🚫 Fronteiras

Este workflow:

- **não corrige o bug por si só** (use `BUGFIX FLOW`).
- **não substitui o diagnóstico técnico.**
- **não cria regras redundantes.**

---

## ✅ Checklist Final

- [ ] O incidente foi resumido com clareza?
- [ ] A causa raiz (técnica) foi declarada?
- [ ] A lacuna no processo atual foi identificada?
- [ ] A prevenção mínima foi escolhida (proporcional ao risco)?
- [ ] A sugestão ao MAESTRO passou pelo filtro de relevância?

---

## 📌 Formato de Saída Recomendado

```markdown
**Incident Review Result**
- Incidente: Ouro do Reino X ficou negativo no turno 5.
- Causa raiz: Manutenção de tropas calculada duas vezes devido a mutação direta.
- Lacuna: Falta de Deep Clone no handler de fim de turno.
- Prevenção mínima:
  - Adicionar verificação de imutabilidade no `GAME LOGIC VERIFIER`.
  - Fixar o handler com `structuredClone`.
- Sugestão ao MAESTRO: Sim, reforçar regra K03 (Imutabilidade).
```
