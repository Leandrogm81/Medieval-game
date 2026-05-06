# Resumo de Melhorias v1

Este documento consolida as melhorias entregues na rodada v1 de Reinos Medievais.

## Sprint 01 - Bordas do mapa
- Corrigido o posicionamento de `center` nas províncias geradas.
- Labels de mapa passaram a respeitar a área visível.
- Províncias nas bordas deixam de perder nome e informação visual.

## Sprint 02 - Tamanho de fonte
- Aumentados os textos menores dos painéis laterais.
- Legibilidade melhorada sem alterar a lógica do jogo.
- Ajustes mantidos dentro da HUD existente.

## Sprint 03 - Painel de província
- Adicionado um bloco completo de detalhes da província selecionada.
- Exibição de exército por tipo, lealdade, construções, produtividade, recrutáveis e recurso estratégico.
- Todas as informações continuam read-only e baseadas em dados existentes.

## Sprint 04 - Persistência de tropas durante marcha
- Corrigido o fluxo de marcha para manter tropas corretamente na origem ou no destino.
- Cancelamento de marcha retorna as tropas ao provedor correto.
- Histórico de movimentos ficou consistente com o avanço real da ordem.

## Sprint 05 - Comércio de recursos
- Criada a aba de comércio no nível de reino.
- Implementada troca entre ouro, comida e materiais com taxa dinâmica por escassez.
- Aplicados limite de 3 transações por turno, máximo de 100 unidades por transação e custo de 1 AP.

## Sprint 06 - Estabilidade de província
- Adicionado `stability` ao contrato de província.
- Estabilidade inicial definida em 70 e aplicada ao fluxo de turno.
- Produção passou a considerar um multiplicador de estabilidade.
- HUD passou a exibir estabilidade em barra e valor numérico.

## Resultado
- O núcleo do jogo ficou mais legível, mais consistente e mais estratégico.
- O mapa, o painel de província, a marcha, o comércio e a economia agora compartilham regras mais estáveis.
- As mudanças foram feitas com foco em escopo pequeno e validação por build.
