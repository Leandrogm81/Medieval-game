---
description: Workflow de promoção controlada de mudanças no Reinos Medievais, com disciplina de release e capacidade explícita de rollback.
---

# Release / Rollback - Reinos Medievais

**Descrição:**  
Use este workflow depois que a mudança já tiver passado pela validação técnica (Build, Testes, Game Logic Verifier).  
O objetivo é decidir se a alteração está pronta para entrar na versão estável do jogo, garantir que o escopo publicado é exatamente o pretendido e preservar a capacidade clara de recuo (rollback) caso a economia ou combate quebrem.

---

## 🎯 Missão

Separar **código validado** de **mudança pronta para entrar em circulação**, com revisão final de escopo, impacto no balanceamento e plano de reversão.

---

## 🧭 Princípios

- **Validar não é publicar.** Provar que a lógica funciona localmente é diferente de integrá-la à build principal.
- **Publicar não é despejar tudo.** A release deve ser seletiva, legível e reversível.
- **Toda promoção deve ter escopo claro.** Sem commits genéricos como "updates".
- **Quanto maior o risco, maior a disciplina.** Mudanças estruturais no `gameState` exigem revisão rigorosa do diff.

---

## 📥 Quando Acionar

Acione após:

- `VALIDATE GATE` aprovado.
- Revisão do diff final concluída.
- Testes de lógica (`Game Logic Verifier`) e builds necessários concluídos.
- Decisão de promover a mudança para a branch principal ou release.

---

## 📥 Entradas Esperadas

- Diff final das alterações.
- Branch atual.
- Arquivos alterados.
- Risco da mudança (`trivial`, `standard`, `risky`, `structural`).
- Resultado da validação técnica.
- Áreas sensíveis tocadas (ex: `Economy`, `Combat`, `Save System`).

---

## 📤 Saídas Obrigatórias

- **Decisão `Go / No-Go`.**
- **Escopo final da release.**
- **Staging seletivo** (quais arquivos serão commitados).
- **Mensagem de commit adequada.**
- **Plano de Rollback** (o que fazer se o jogo travar após a promoção).
- **Nota de monitoramento pós-promoção.**

---

## 🛠️ Protocolo de Execução

### Passo 1: Confirmar Prontidão Técnica

Verificar se já existe evidência de:

- Lint + Build sem erros.
- `Game Logic Verifier` passou para mecânicas críticas.
- `Contract Guardian` validou tipos alterados.
- Smoke check visual em resoluções diferentes.

### Passo 2: Revisar Escopo Real (Diff Check)

Conferir:

- Se há arquivos inesperados ou lixo de desenvolvimento.
- Se há mudanças fora do objetivo original.
- Se o diff está limpo e conciso.

### Passo 3: Decidir `Go / No-Go`

- **Go:** Validação completa, diff limpo, risco aceitável.
- **No-Go:** Falta evidência, diff contaminado, rollback complexo demais ou risco de quebrar o balanceamento sem plano de teste.

### Passo 4: Fazer Staging Seletivo

Incluir apenas os arquivos necessários para a feature/fix. Não use `git add .` indiscriminadamente.

### Passo 5: Declarar Plano de Rollback

Antes da promoção, declarar:

- O que desfazer se a economia colapsar ou o turno travar.
- Qual sinal indicaria reversão (ex: "Ouro ficando negativo após o turno 10").

### Passo 6: Registrar Nota de Release

Curta e útil: O que entrou, área afetada e o que observar (ex: "Observar se a cavalaria ainda está recebendo bônus de terreno").

---

## 🚫 Fronteiras

Este workflow:

- **não implementa código.**
- **não corrige bugs.**
- **não valida sozinho o código.**
- **não usa staging indiscriminado.**

---

## ✅ Checklist Final

- [ ] A validação técnica necessária foi concluída?
- [ ] O diff foi revisado e está limpo?
- [ ] O escopo real da release está alinhado com o pedido?
- [ ] O staging foi seletivo?
- [ ] Há decisão explícita de `Go / No-Go`?
- [ ] O plano de rollback foi definido?

---

## 📌 Formato de Saída Recomendado

```markdown
**Release Decision Result**
- Status: `GO`
- Risco: `standard`
- Escopo: [descrição curta]
- Arquivos promovidos: [lista]
- Commit: `feat/fix: [descrição clara]`
- Rollback: Reverter commit se [comportamento inesperado] ocorrer.
- Monitorar: [ex: balanceamento da renda, logs de combate]
```
