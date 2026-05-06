---
description: Workflow para garantir integridade, compatibilidade e tipagem estrita de contratos e payloads no projeto Reinos Medievais.
---

# CONTRACT GUARDIAN - Reinos Medievais

**Descrição:**  
Use este workflow sempre que houver mudança em `src/types.ts`, payloads de ações de jogo (ex: Marcha, Construção), estrutura do `gameState` ou interfaces de comunicação entre Lógica e UI.  
O objetivo é evitar "quebras silenciosas" causadas por mudanças em campos de dados.

---

## 🎯 Missão

Garantir que a estrutura de dados do jogo seja estável, tipada e que qualquer mudança seja refletida corretamente em todos os consumidores (IA, UI, Reducers).

---

## 🧭 Princípios

- **Tipagem Estrita:** Não usar `any`.
- **Compatibilidade:** Mudanças no `gameState` não devem quebrar o carregamento de jogos salvos (quando aplicável).
- **Consistência:** O payload enviado pela UI deve ser exatamente o esperado pela Lógica.
- **Single Source of Truth:** `src/types.ts` é a autoridade máxima.

---

## 📥 Quando Acionar

Acione este workflow quando:

- alterar `GameState`, `Province`, `Kingdom` ou `Troops` em `src/types.ts`.
- adicionar ou modificar uma ação de jogo (payload de Marcha, Ataque, etc).
- mudar o formato de retorno de uma função de lógica.
- detectar erro de "field undefined" ou "type mismatch".

---

## 📥 Entradas Esperadas

- mudança proposta no tipo ou payload.
- consumidores afetados (UI, Controller, IA).
- risco de quebra de contrato.
- impacto em jogos salvos / estado persistente.

---

## 📤 Saídas Obrigatórias

- análise de impacto da mudança de contrato.
- verificação de alinhamento entre produtor (UI) e consumidor (Logic).
- atualização de tipos concluída sem erros de TS.
- decisão: `contrato íntegro` ou `contrato quebrado`.

---

## 🛠️ Protocolo de Execução

### Passo 1: Mapear o Contrato

Identificar em `src/types.ts` qual interface está sendo alterada.  
Listar todos os arquivos que importam esse tipo.

---

### Passo 2: Validar o Payload

Se for uma ação (ex: `ActionPayload`):

- O componente que dispara a ação envia todos os campos?
- O reducer/handler que recebe a ação sabe tratar os novos campos?
- Campos antigos foram removidos com segurança?

---

### Passo 3: Checar Tipagem Estrita

- Rodar verificação de tipos (se disponível).
- Garantir que não há casts perigosos (`as any`).
- Verificar se campos opcionais estão tratados corretamente.

---

### Passo 4: Verificar Integridade de Estado

Se o `GameState` mudou:

- O estado inicial foi atualizado?
- A lógica de "fim de turno" sabe lidar com o novo campo?
- O novo campo é inicializado corretamente?

---

### Passo 5: Validar com o Consumidor

Simular ou verificar o fluxo completo:
> UI (Dispatch) -> Controller (Handle) -> Logic (Process) -> State (Update)

Se o dado "morre" ou chega "undefined" em algum ponto, o Guardian falhou.

---

## 🚫 Fronteiras

Este workflow:

- **não implementa a funcionalidade**
- **não valida a matemática da lógica** (isso é com o Game Logic Verifier)
- **não corrige erros de UI** (apenas o fluxo de dados)

---

## ✅ Checklist Final

- [ ] O tipo em `src/types.ts` foi atualizado?
- [ ] Todos os consumidores foram revisados?
- [ ] O payload de ação está alinhado entre UI e Lógica?
- [ ] Não há uso de `any` ou tipos vagos?
- [ ] O estado inicial foi contemplado?

---

## 📌 Formato de Saída Recomendado

```markdown
**Contract Guardian Result**
- Contrato alterado: `TroopComposition`
- Mudança: Adicionado campo `siegeEngines`
- Impacto:
  - `src/types.ts` (Interface)
  - `ProvinceCard.tsx` (UI de exibição)
  - `combat.ts` (Cálculo de dano)
  - `useGameController.ts` (Estado inicial)
- Status: `Alinhado`
- Observação: Todos os consumidores atualizados para lidar com o novo campo de tropa.
```
