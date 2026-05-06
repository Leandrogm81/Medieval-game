---
description: Workflow para definir a blindagem mínima correta de testes, smoke checks e regressão no Reinos Medievais.
---

# Test / Regression Harness - Reinos Medievais

**Descrição:**  
Use este workflow para decidir como uma mudança deve ser validada.  
Ele não existe para “rodar tudo por reflexo”, mas para escolher a menor blindagem que reduza o risco de regressão (ex: bugs de combate que voltam, recursos que quebram) de forma confiável e eficiente.

---

## 🎯 Missão

Traduzir o risco de uma mudança em evidência de qualidade: testes de lógica, smoke checks de UI, fixtures de estado, validação manual dirigida e cobertura de regressão de balanceamento.

---

## 🧭 Princípios

- **Nem toda mudança precisa do mesmo nível de teste.**
- **Não testar demais por ritual; focar no que é crítico (Ouro, Tropas, Turno).**
- **Não testar de menos por pressa; regressões em jogos destroem a experiência.**
- **Toda regressão conhecida merece blindagem proporcional (fixtures canônicos).**
- **A validação deve seguir o risco real no `gameState`.**

---

## 📥 Quando Acionar

Acione após:

- `BUGFIX FLOW` (para garantir que o fix funciona e não quebrou nada).
- `BUILD FLOW` (para validar a nova feature).
- Refactor (especialmente migrações de imutabilidade).
- Ajuste em `types.ts`.
- Ajuste em fórmulas de cálculo (Economia/Combate).
- Mudança de UI no HUD ou painéis críticos.

---

## 📥 Entradas Esperadas

- Tipo de mudança.
- Nível de risco (`trivial`, `standard`, `risky`, `structural`).
- Área afetada (`UI`, `Logic`, `IA`, `State`).
- Regressão conhecida (se houver).
- Fluxos principais tocados (ex: "Processamento de fim de turno").

---

## 📤 Saídas Obrigatórias

- **Estratégia de validação.**
- **Testes obrigatórios** (ex: rodar `GAME LOGIC VERIFIER`).
- **Testes dispensáveis** (o que não precisa ser testado agora).
- **Smoke checks necessários** (ex: "Passar 5 turnos e checar o ouro").
- **Necessidade de fixture/caso canônico** (ex: um `gameState` específico de guerra).
- **Evidência mínima** para considerar a mudança segura.

---

## 🛠️ Protocolo de Execução

### Passo 1: Classificar a Mudança

- `bugfix`, `feature`, `refactor`, `balance`, `ui`.

### Passo 2: Ler o Risco (Triage)

- Se for `risky` ou `structural`, a blindagem deve ser rigorosa.

### Passo 3: Escolher a Blindagem Mínima

#### Para `trivial`

- Validação local dirigida.
- Lint.

#### Para `standard`

- Lint + Build.
- Teste dirigido do fluxo principal (ex: abrir o painel alterado).

#### Para `risky`

- Lint + Build.
- `GAME LOGIC VERIFIER` (obrigatório para cálculos).
- Smoke check do fluxo afetado (ex: simular uma marcha).
- Checagem explícita de mutação de estado.

#### Para `structural`

- Tudo acima + suíte completa de validação.
- Verificação cruzada de contratos (`CONTRACT GUARDIAN`).
- Teste de estresse (mapa grande ou muitos turnos).

---

### Passo 4: Cobrir a Regressão Principal

Responder:

- O que poderia quebrar novamente?
- Qual evidência mínima impediria isso?
- A correção foi provada via logs ou visualmente?

---

## 🧪 Heurísticas por Área

### Lógica de Jogo (Domain)

- Fixture canônica (um objeto `GameState` pronto para teste).
- Consistência semântica (ouro nunca negativo).
- Verificação via `GAME LOGIC VERIFIER`.

### Interface (UI)

- Fluxo principal de interação.
- Estados de erro e loading.
- Consistência com Tailwind v4.

### State Management

- Provar imutabilidade (Deep Clone check).
- Persistência (se o jogo salva/carrega corretamente).

---

## 🚫 Fronteiras

Este workflow:

- **não implementa código.**
- **não decide release sozinho.**
- **não cria teste por vaidade.**
- **não cria log por reflexo.**

---

## ✅ Checklist Final

- [ ] O risco foi considerado de acordo com o Triage?
- [ ] A blindagem é proporcional ao impacto no `gameState`?
- [ ] Há evidência para a regressão principal?
- [ ] Foi definido o que é obrigatório e o que é dispensado?
- [ ] A validação é objetiva e provável?

---

## 📌 Formato de Saída Recomendado

```markdown
**Validation Plan Result**
- Mudança: [descrição]
- Risco: [nível]
- Evidência obrigatória:
  - Game Logic Verifier (cálculo X)
  - Smoke check (fluxo Y)
  - Build
- Dispensado:
  - [item]
- Status: Pronto para VALIDATE GATE
```
