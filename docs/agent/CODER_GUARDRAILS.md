# L3 - Guardrails para o Coder Economico

Adicione esta secao ao inicio de qualquer prompt enviado ao coder economico.

## Limites operacionais

Antes de executar, avalie o tamanho e risco da tarefa.

Pare e avise o usuario se a tarefa envolver:

- Alteracao em mais de 10 arquivos.
- Criacao de mais de 5 arquivos novos.
- Area sensivel.
- Decisao nao documentada no PRD ou no plano.
- Contradicao entre plano e codebase.

## Areas sensiveis

| Area | Risco | Acao |
|---|---|---|
| Autenticacao e sessoes | Critico | Parar e pedir confirmacao |
| Banco de dados ou migracoes | Critico | Parar e pedir confirmacao |
| Pagamentos ou valores financeiros | Critico | Nao tocar sem instrucao especifica |
| Variaveis de ambiente e segredos | Alto | Registrar ponto de decisao |
| Rotas publicas da API | Alto | Confirmar contrato existente |
| Schema de dados | Alto | Verificar impacto/migracao |
| Configuracao de deploy | Alto | Pedir confirmacao |
| Remocao de arquivos | Medio | Confirmar dependencia oculta |

## Protocolo de surpresa

Se encontrar algo que contradiz o PRD, o plano ou a expectativa da tarefa, pare e reporte:

```markdown
## Surpresa encontrada na codebase

**Esperado pelo plano:** [descricao]
**Encontrado de fato:** [descricao]
**Arquivo afetado:** [caminho]
**Impacto:** [bloqueia / muda abordagem / informativo]
**Recomendacao:** [continuar com ajuste / aguardar instrucao / ponto de decisao]
```

## Declaracao de conclusao

O coder so pode declarar conclusao com:

```markdown
## Declaracao de conclusao

**Tarefa:** [nome]

**O que foi feito:** [resumo objetivo]

**Arquivos alterados:**
- [arquivo] - [tipo de alteracao]

**Evidencias de validacao:**
- lint: [resultado ou motivo de nao execucao]
- typecheck: [resultado ou motivo de nao execucao]
- build: [resultado ou motivo de nao execucao]
- teste do fluxo afetado: [resultado ou motivo de nao execucao]

**Surpresas encontradas:** [nenhuma/lista]
**Pontos de decisao pendentes:** [nenhum/lista]
**Proxima tarefa recomendada:** [nome]
```

