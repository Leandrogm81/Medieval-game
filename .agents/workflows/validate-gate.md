---
description: Workflow para validar se uma mudança no projeto Reinos Medievais está tecnicamente pronta para promoção, garantindo integridade de estado e UI premium.
---

# VALIDATE GATE - Reinos Medievais

**Descrição:**  
Este é o último portão antes da conclusão da tarefa.  
Seu objetivo é garantir que a mudança não quebra o sistema e segue os padrões de qualidade exigidos.

---

## 🎯 Critérios de Passagem

### 1. Integridade Técnica
- `npm run lint` sem erros.
- `npm run build` sem avisos críticos.
- Tipagem estrita respeitada (sem `any`).

### 2. Integridade de Estado
- Nenhuma mutação direta detectada.
- Fluxos de turno testados.
- Persistência (se houver) validada.

### 3. Excelência Visual (UI Premium)
- Tailwind v4 seguindo o design system.
- Animações fluidas (Framer Motion).
- Sem placeholders ou erros de layout.

---

## 🛠️ Procedimento

1. **Checklist de Código:** Revisar o diff final.
2. **Executar Build:** Confirmar que o Vite compila tudo corretamente.
3. **Teste Visual:** Abrir as telas afetadas e verificar interações.
4. **Verificar MAESTRO:** A mudança fere alguma regra de kernel?

---

## ✅ Resultado

- **PASS:** Mudança aprovada e pronta.
- **FAIL:** Listar impedimentos e voltar para o fluxo adequado (Bugfix ou Refactor).
