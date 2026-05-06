# PLANO DE IMPLEMENTAÇÃO — [NOME DA TAREFA]

> **Status:** 🔴 TODO | 🟡 IN_PROGRESS | 🟢 DONE
> **Autor:** [Agente]
> **Data:** [Data]
> **Contexto:** [Link para issue ou descrição breve]

---

## 🎯 Objetivo
[Descrição clara do que se pretende atingir com esta mudança.]

## ⚠️ Análise de Risco (Triage)
- **Tipo:** `bug` | `feature` | `refactor` | `logic` | `state`
- **Nível:** `trivial` | `standard` | `risky` | `structural`
- **Impacto:** [Áreas afetadas: Economia, Combate, IA, UI, Estado]

---

## 🗺️ Estratégia de Implementação

### Fase 1: Preparação & Análise
- [ ] Mapear arquivos afetados.
- [ ] Validar tipos em `src/types.ts`.
- [ ] Identificar pontos de quebra de imutabilidade.

### Fase 2: Lógica Pura (`src/logic/`)
- [ ] Implementar/Ajustar funções puras.
- [ ] Validar outputs determinísticos.

### Fase 3: Integração de Estado (`useGameController`)
- [ ] Atualizar handlers de ação.
- [ ] **Garantir Deep Clone** em atualizações aninhadas.
- [ ] Adicionar logs de depuração temporários.

### Fase 4: Interface & Visual (`src/components/`)
- [ ] Atualizar componentes UI (Tailwind v4).
- [ ] Adicionar/Ajustar animações (Framer Motion).
- [ ] Validar responsividade e touch-targets.

### Fase 5: Validação & Gate
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Teste de fumaça (smoke test) dos fluxos principais.
- [ ] Validação visual premium.

---

## 🧪 Plano de Testes
- **Cenário A:** [Descrição] -> Esperado: [Resultado]
- **Cenário B:** [Descrição] -> Esperado: [Resultado]

---

## 📝 Notas & Riscos Residuais
- [Nota 1]
- [Risco 1]
