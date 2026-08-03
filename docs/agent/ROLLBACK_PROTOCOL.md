# L2 - Protocolo de Rollback

Use quando uma sprint falhar, causar regressao ou perder rastreabilidade.

## Condicoes que ativam rollback

Acione este protocolo se:

- Nenhum criterio de aceite da sprint foi atingido.
- Um teste que passava antes agora falha.
- O build foi quebrado e nao foi corrigido dentro do escopo.
- Uma dependencia critica esta ausente ou incompativel.
- Um arquivo de configuracao foi corrompido ou perdido.
- Uma alteracao afetou area fora do escopo.
- O agente nao consegue explicar exatamente o que alterou.

## Passo 1 - Registrar falha

Atualize `/docs/agent/CURRENT_STATE.md`:

```markdown
## Estado de falha - Sprint [X]

- Data: [data]
- Sprint: [nome]
- Criterios nao atingidos: [lista]
- Causa identificada: [descricao ou "nao identificada"]
- Arquivos alterados nesta sprint: [lista]
- Comportamento inesperado observado: [descricao]
```

## Passo 2 - Registrar no changelog

Atualize `/docs/evolution/CHANGELOG.md`:

```markdown
## [data] - Rollback Sprint [X]

### Resumo
Sprint [X] revertida. [motivo objetivo]

### Arquivos revertidos
- [arquivo]

### Motivo
[causa confirmada ou hipotese mais provavel]

### Pendencias
[o que resolver antes de tentar novamente]
```

## Passo 3 - Reverter

- Se usar Git, prefira `git revert` quando a mudanca ja foi commitada.
- Use `git reset` apenas com autorizacao explicita e entendimento do impacto.
- Sem Git, restaure pelo backup da Sprint 0 ou ultimo estado aprovado.
- Nunca apague historico sem autorizacao explicita do usuario.

## Passo 4 - Verificar estado restaurado

Execute, quando existirem:

- lint
- typecheck
- build
- testes
- teste manual do ultimo fluxo aprovado

Se o estado anterior tambem falhar, reporte:

```markdown
ALERTA: O estado anterior a sprint tambem apresenta problemas.
Isso indica problema pre-existente ou reversao incompleta.
Nao tente nova sprint antes de resolver isso.
```

## Passo 5 - Atualizar handoff

Atualize `/docs/agent/HANDOFF.md`:

```markdown
## Sprint [X] - Revertida

- Tentativa realizada em: [data]
- Motivo do rollback: [causa]
- Estado atual: [estado restaurado]
- O que foi aprendido: [licao objetiva]
- O que nao deve ser tentado da mesma forma: [restricao]
- Proxima acao recomendada: [acao]
```

## Reabertura da sprint

Antes de tentar de novo, responda:

1. Qual foi a causa raiz?
2. O plano precisa mudar?
3. A causa esta dentro do escopo da sprint?
4. Existe bloqueio externo?
5. Qual ajuste documentado sera aplicado?

Nunca repita a mesma abordagem sem ajuste documentado.

