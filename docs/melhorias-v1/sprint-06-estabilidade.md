# Sprint 06 — Sistema de Estabilidade de Província

**Prioridade:** 6ª | **Risco:** Médio-alto | **Esforço:** Grande | **Impacto:** Alto

---

## Resumo

Criar o recurso `stability` (0–100) por província, distinto de `loyalty`.
Estabilidade mede a capacidade administrativa e social da província de funcionar
eficientemente, independente de quem a controla.

## Diferença: Loyalty vs. Stability

| Aspecto | Loyalty (já existe) | Stability (novo) |
|---------|---------------------|------------------|
| O que mede | Fidelidade ao governante | Ordem e funcionalidade |
| Afetado por | Conquista, distância, eventos | Guerras, rebeliões, construções |
| Efeito | Risco de rebelião | Eficiência produtiva |
| Escala | 0–100 | 0–100 |

## Regras de Estabilidade

```
estabilidade_inicial = 70 (ao gerar o mapa)

PENALIDADES por turno:
  - Província recém-conquistada:   -10/turno (primeiros 3 turnos)
  - Rebelião ocorreu:              -20 (imediato)
  - Guerra ativa na região:        -3/turno
  - Lealdade < 30:                 -5/turno
  - Overextension do reino > 80:  -2/turno

BÔNUS por turno:
  - Tribunal (courts) presente:   +5/turno
  - Lealdade > 70:                +3/turno
  - Sem guerra por 3+ turnos:    +4/turno
  - Capital do reino:             +5/turno

EFEITO NA PRODUÇÃO:
  stability 80–100: efficiency × 1.0 (sem penalidade)
  stability 50–79:  efficiency × 0.85
  stability 20–49:  efficiency × 0.65
  stability 0–19:   efficiency × 0.40 + risco de rebelião aumentado

LIMITES DE SEGURANÇA:
  - stability mínima: 5 (nunca chega a zero por cascata)
  - stability máxima: 100
  - Mudança máxima por turno: ±20 (evitar oscilações bruscas)
```

## Impacto no GameState

- Novo campo `stability: number` na interface `Province` em `types.ts`
- Lógica de cálculo em `processEndOfTurn` dentro de `turnLogic.ts`
- Fator de `stability` aplicado ao cálculo de `efficiency` na produção
- Exibição no painel de informações da província (depende do Sprint 03)

## Proposta de valor

Gestão pós-conquista mais profunda. O jogador precisa
estabilizar novas províncias antes de extrair valor delas. Cria tensão estratégica
real entre expansão rápida e consolidação.

## Escopo v1

1. **Types (`types.ts`):**
   - Adicionar `stability: number` à interface `Province`

2. **Map Generation (`mapGeneration.ts`):**
   - Inicializar `stability: 70` para todas as províncias geradas

3. **Turn Logic (`turnLogic.ts`):**
   - Função `calculateStabilityDelta(province, realm, state): number`
   - Aplicar delta com clamp `[5, 100]` em `processEndOfTurn`
   - Registrar log quando stability cai abaixo de 30

4. **Economy (`economyLogic.ts` ou `turnLogic.ts`):**
   - Aplicar multiplicador de `stability` no cálculo de `efficiency`:
     ```ts
     const stabilityFactor = province.stability >= 80 ? 1.0
       : province.stability >= 50 ? 0.85
       : province.stability >= 20 ? 0.65
       : 0.40;
     const efficiency = baseEfficiency * stabilityFactor;
     ```

5. **UI (`HUD.tsx`):**
   - Exibir `stability` no painel de província (barra visual + valor)
   - Integrar na seção de painel já expandida no Sprint 03

## Fora de escopo v1

Eventos especiais de instabilidade; políticas de pacificação;
agentes administrativos; animação de queda de estabilidade.

## Arquivos prováveis

- `src/types.ts`
- `src/logic/mapGeneration.ts`
- `src/logic/turnLogic.ts`
- `src/components/HUD.tsx`

## Critério de aceite

- [ ] Campo `stability` existe no tipo `Province` com valor inicial 70
- [ ] `stability` varia corretamente por turno conforme as regras definidas
- [ ] Multiplicador de `stability` afeta a `efficiency` na produção
- [ ] Painel exibe `stability` com barra visual
- [ ] Loop de regressão não ocorre (stability não cai abaixo de 5 automaticamente)
- [ ] `npm run lint` e `npm run build` passam sem erros

## Restrições

- Não pode criar loop de regressão — stability baixa reduz produção,
  o que reduz gold, o que reduz loyalty, o que reduz stability.
  **O mínimo de 5 é inegociável.**
- Alterar `efficiency` requer validação do `GAME LOGIC VERIFIER`.
- Não misturar lógica de `stability` com lógica de `loyalty` existente.

## Dependências

- **Sprint 03** (painel de informações) deve estar concluída para exibir `stability` na UI.
- Recomendado rodar `GAME LOGIC VERIFIER` após implementação antes de promover.

## Risco

Médio-alto. Altera a fórmula de `efficiency` que impacta toda a economia.
Requer teste de balanceamento antes de promover.

## Rota de execução

`SPEC STUDIO em PRD MODE` → definir fórmulas e limites exatos,
depois `BUILD FLOW` → `GAME LOGIC VERIFIER`.
