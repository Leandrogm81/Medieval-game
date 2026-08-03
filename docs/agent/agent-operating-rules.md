# Regras Operacionais do Agente

Use este arquivo como regra base em todos os prompts do framework.

## 1. Separacao de responsabilidades

- Quem cria nao deve auditar o proprio trabalho no mesmo contexto.
- Quem corrige nao deve validar a propria correcao no mesmo contexto.
- Auditoria, correcao e validacao devem deixar evidencias.

## 2. Evidencia antes de conclusao

O agente nao deve declarar tarefa concluida sem informar:

- O que foi feito.
- Arquivos alterados.
- Validacoes executadas.
- Validacoes nao executadas e motivo.
- Surpresas encontradas.
- Pontos de decisao pendentes.

## 3. Documentos de continuidade

Atualize estes arquivos quando aplicavel:

| Arquivo | Funcao | Quando atualizar |
|---|---|---|
| `/docs/agent/HANDOFF.md` | Transferir contexto para outra sessao/agente | Antes de trocar sessao/modelo ou pausar |
| `/docs/agent/CURRENT_STATE.md` | Registrar estado atual | Ao finalizar tarefa ou encontrar erro novo |
| `/docs/evolution/DECISIONS.md` | Registrar decisoes permanentes | Ao tomar decisao tecnica ou de negocio |
| `/docs/evolution/CHANGELOG.md` | Registrar mudancas implementadas | Ao alterar o projeto |

## 4. Hierarquia de instrucoes

Em caso de conflito, use esta ordem:

1. Instrucao explicita do usuario na sessao atual.
2. Regras do sistema/ferramenta usada.
3. Documentos permanentes do projeto.
4. Plano de implementacao vigente.
5. Inferencia do agente.

Inferencia nunca deve prevalecer sozinha sobre documento ou instrucao explicita.

## 5. Regra de resolucao de conflitos entre documentos

Quando dois documentos do projeto se contradisserem, pare e identifique o conflito antes de agir.

### 5.1 Precedencia entre documentos

Menor numero significa maior prioridade.

| Prioridade | Documento | Motivo |
|---|---|---|
| 1 | Instrucao explicita do usuario na sessao atual | Decisao humana mais recente |
| 2 | `/docs/evolution/DECISIONS.md` | Decisoes permanentes aprovadas |
| 3 | PRD versionado mais recente | Especificacao de produto mais atual |
| 4 | `/docs/product/acceptance-criteria.md` | Criterios verificaveis |
| 5 | `/docs/implementation/PLANO_IMPLEMENTACAO.md` | Plano derivado do PRD |
| 6 | `/docs/audit/final-audit.md` mais recente | Achados objetivos |
| 7 | `/docs/agent/HANDOFF.md` | Continuidade de sessao |
| 8 | `/docs/agent/agent-operating-rules.md` | Regras padrao |
| 9 | Inferencia do agente | Ultimo recurso |

### 5.2 Protocolo de conflito

Use este formato:

```markdown
## Conflito de documentos identificado

**Documento A:** [caminho]
**Trecho de A:** [citacao curta ou descricao precisa]

**Documento B:** [caminho]
**Trecho de B:** [citacao curta ou descricao precisa]

**Natureza do conflito:** [requisito / versao / terminologia / regra de negocio / arquitetura]

**Documento prevalecente:** [documento]
**Motivo:** [prioridade aplicada]

**Acao:** [continuar / registrar decisao / ponto de decisao / parar]
```

### 5.3 Quando parar obrigatoriamente

Pare e aguarde instrucao humana se o conflito envolver:

- Regra de negocio.
- Criterio de aceite.
- Escopo do MVP.
- Arquitetura.
- Seguranca.
- Dados, pagamento, autenticacao ou permissoes.

