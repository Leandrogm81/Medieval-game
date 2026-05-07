# Plano Curto: Marcha e Ataque de Tropas

## Objetivo
Corrigir a chegada das tropas no turno correto e unificar
marcha e ataque no mesmo fluxo de movimentação.

## Mudanças
- Ajustar `processMarchOrders` para concluir a ordem no mesmo
  turno em que ela chega ao destino.
- Fazer o ataque usar `marchOrders` em vez de resolver combate
  direto no clique.
- Garantir que tropas sobreviventes de ataque fiquem na
  província conquistada.
- Reaproveitar a animação de marcha para ataques, com visual
  diferente.

## Validação
- Marcha curta chega no próximo turno sem atraso extra.
- Ataque resolve na chegada.
- Animação de ataque aparece corretamente.
- `npm run build` passa.
