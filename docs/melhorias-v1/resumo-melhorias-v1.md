# Resumo de Melhorias v1

Este documento consolida as melhorias entregues na rodada v1 de
Reinos Medievais.

## Sprint 01 - Bordas do mapa
- Corrigido o posicionamento de `center` nas provincias geradas.
- Labels de mapa passaram a respeitar a area visivel.
- Provincias nas bordas deixam de perder nome e informacao visual.

## Sprint 02 - Tamanho de fonte
- Aumentados os textos menores dos paineis laterais.
- Legibilidade melhorada sem alterar a logica do jogo.
- Ajustes mantidos dentro da HUD existente.

## Sprint 03 - Painel de provincia
- Adicionado um bloco completo de detalhes da provincia selecionada.
- Exibicao de exercito por tipo, lealdade, construcoes,
  produtividade, recrutaveis e recurso estrategico.
- Todas as informacoes continuam read-only e baseadas em dados
  existentes.

## Sprint 04 - Persistencia de tropas durante marcha
- Corrigido o fluxo de marcha para manter tropas corretamente na origem
  ou no destino.
- Cancelamento de marcha retorna as tropas ao provedor correto.
- Historico de movimentos ficou consistente com o avanco real da ordem.

## Sprint 05 - Comercio de recursos
- Criada a aba de comercio no nivel de reino.
- Implementada troca entre ouro, comida e materiais com taxa dinamica
  por escassez.
- Aplicados limite de 3 transacoes por turno, maximo de 100 unidades
  por transacao e custo de 1 AP.

## Sprint 06 - Estabilidade de provincia
- Adicionado `stability` ao contrato de provincia.
- Estabilidade inicial definida em 70 e aplicada ao fluxo de turno.
- Producao passou a considerar um multiplicador de estabilidade.
- HUD passou a exibir estabilidade em barra e valor numerico.

## Resultado
- O nucleo do jogo ficou mais legivel, mais consistente e mais
  estrategico.
- O mapa, o painel de provincia, a marcha, o comercio e a economia
  agora compartilham regras mais estaveis.
- As mudancas foram feitas com foco em escopo pequeno e validacao por
  build.
