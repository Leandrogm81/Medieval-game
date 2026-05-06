---
description: Workflow para garantir que a lógica de jogo (combate, economia, turnos) está correta, consistente e imutável no projeto Reinos Medievais.
---

# Game Logic Verifier - Reinos Medievais

**Descrição:**  
Use este workflow sempre que houver alteração em regras de combate, fórmulas de economia, processamento de turno ou IA.  
O objetivo é garantir que a lógica pura do jogo permaneça determinística, correta e livre de efeitos colaterais de estado.

---

## 🎯 Missão

Garantir a integridade matemática e lógica do jogo, mantendo a separação entre lógica pura e visual.

---

## 🧭 Princípios

- **Lógica pura não conhece o React.**
- **Fórmulas devem ser determinísticas.**
- **Recursos nunca podem ser negativos (salvo regra explícita).**
- **O turno é atômico.**

---

## 🛠️ Áreas de Verificação

### 1. Economia
- Produção = Σ(Províncias) * Taxa.
- Manutenção = Σ(Tropas) * Custo/Tipo.
- Renda Líquida = Produção - Manutenção.
- **Checagem:** O ouro atualizou corretamente? O saldo bate com o relatório?

### 2. Combate
- Força Relativa (Infantaria > Arqueiros > Cavalaria > Infantaria).
- Bônus de Terreno e Capital.
- Cálculo de Baixas (Proporcional e aleatório controlado).
- **Checagem:** O vencedor é lógico baseado nos números? As perdas são imutáveis?

### 3. Turnos
- Reset de ações.
- Processamento de movimentos pendentes.
- Crescimento populacional/recursos.
- **Checagem:** Algum efeito "vazou" para o turno seguinte?

---

## 🛠️ Protocolo de Execução

1. **Isolar a Função:** Vá para `src/logic/` e identifique a função afetada.
2. **Teste de Input:** Rode a função com valores limite (ex: 0 tropas, 1000 províncias).
3. **Imutabilidade:** Verifique se o objeto retornado é novo e se o original não foi alterado.
4. **Consistência:** Verifique se o HUD reflete exatamente o que a lógica calculou.

---

## ✅ Checklist

- [ ] A lógica está em `src/logic/`?
- [ ] A função é pura?
- [ ] Não há mutação de estado?
- [ ] Casos de borda (recursos 0) tratados?
