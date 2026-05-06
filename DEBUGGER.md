# 🔧 DEBUGGER.md — Manual de Diagnóstico (Reinos Medievais)

> **Propósito:** Guia para rastrear bugs de estado, erros de lógica e falhas de UI no projeto Reinos Medievais.

---

## 🔍 Ferramentas de Diagnóstico

### 1. Logs de Estado (gameState)
Sempre que o `gameState` mudar, verifique o console ou adicione logs temporários em:
- `useGameController.ts`
- Handlers de ação (Marcha, Ataque, Construção)

**O que procurar:**
- Mutações diretas (objetos com a mesma referência).
- Valores inesperados (ouro negativo, tropas NaN).

### 2. Lógica Pura
Teste as funções em `src/logic/` isoladamente.
- `economy.ts`: Verifique as fórmulas de renda e manutenção.
- `combat.ts`: Verifique o cálculo de baixas e bônus.

---

## 🐞 Padrões Comuns de Erro

### 1. Loop de Renderização
**Causa:** `useEffect` no `useGameController` dependendo de um `gameState` que sofre mutação.
**Correção:** Garanta imutabilidade absoluta. Use Deep Clone.

### 2. Discrepância UI vs Estado
**Causa:** A UI está usando um valor cacheado ou não reativo.
**Correção:** Verifique se o componente está recebendo a prop correta do `gameState`.

### 3. Turno Travado
**Causa:** Alguma promessa ou estado pendente impede o processamento do fim de turno.
**Correção:** Verifique o `handleEndTurn` e garanta que todas as ações pendentes sejam resolvidas.

---

## 🛠️ Protocolo de Debugging

1. **Repro:** Consiga reproduzir o erro.
2. **Isolate:** Descubra se é UI, Estado ou Lógica.
3. **Trace:** Siga o dado desde a ação do usuário até a mudança no `gameState`.
4. **Fix:** Aplique a correção cirúrgica.
5. **Verify:** Use o `BUGFIX FLOW`.
