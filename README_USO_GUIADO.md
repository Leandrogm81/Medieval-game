# Framework v1.1 - Uso guiado com planilha

Este pacote implementa as 8 lacunas do framework mantendo a planilha como ponto central de referencia.

## Decisao principal

A planilha deve ser usada como **mapa de navegacao**. Os prompts completos ficam em arquivos Markdown, porque sao mais faceis de versionar, copiar, revisar e atualizar.

## Como usar na pratica

1. Abra a planilha `Prompts Importantes v1.1.xlsx`.
2. Comece sempre pela aba `Fluxo v1.1`.
3. Execute primeiro o prompt `L1\\\_TRIAGE`.
4. Siga o ponto de entrada indicado pela triagem.
5. Use a coluna `Arquivo Markdown` para abrir o prompt completo.
6. Atualize os documentos de continuidade indicados na aba `Arquivos`.

## Regra de ouro

Quem cria nao deve ser o mesmo contexto que audita.  
Quem corrige nao deve ser o mesmo contexto que valida.

## Niveis de uso

### Obrigatorio em todo projeto

* `L1\\\_TRIAGE` - triagem e roteamento inicial.
* `AGENT\\\_RULES` - regras operacionais do agente.
* `L3\\\_CODER\\\_GUARDRAILS` - limites para tarefas enviadas ao coder economico.
* `L4\\\_CONFLICT\\\_RULES` - resolucao de conflitos entre documentos.
* Documentos de continuidade: `HANDOFF`, `CURRENT\\\_STATE`, `DECISIONS`, `CHANGELOG`.

### Condicional

* `L6\\\_BROWNFIELD` - quando o projeto ja existe.
* `L8\\\_TEST\\\_FOUNDATION` - quando nao existe infraestrutura de testes.
* `L7\\\_UI\\\_APPROVED\\\_COMPONENTS` - quando o projeto tem UI/UX e componentes aprovados.

### Quando houver falha ou fim de ciclo

* `L2\\\_ROLLBACK` - quando uma sprint falhar ou causar regressao.
* `L5\\\_RETROSPECTIVE` - depois da validacao pos-correcao aprovada.

## Estrutura recomendada no projeto real

```text
/docs
  /agent
    agent-operating-rules.md
    TRIAGE.md
    ROLLBACK\\\_PROTOCOL.md
    CODER\\\_GUARDRAILS.md
    HANDOFF.md
    CURRENT\\\_STATE.md
  /product
    PRE\\\_PRD\\\_ESCOPO.md
    PRD.md
    BROWNFIELD\\\_ANALYSIS.md
  /implementation
    PLANO\\\_IMPLEMENTACAO.md
    SPRINT\\\_00B\\\_TESTES.md
    test-plan.md
  /audit
    final-audit.md
    audit-fixes.md
    validation-report.md
  /design
    UI\\\_UX\\\_GUIDE.md
  /evolution
    DECISIONS.md
    CHANGELOG.md
    out-of-scope-changes.md
    retrospective-v1.md
```

## Ordem recomendada

1. Triagem.
2. Regras operacionais.
3. Pre-PRD ou Brownfield.
4. PRD.
5. Revisao critica do PRD.
6. Melhorias do PRD.
7. Plano de implementacao.
8. Sprint 0.
9. Sprint 00B de testes, se necessario.
10. Coder economico com guardrails.
11. Evidencias de auditoria.
12. Auditoria por outro contexto.
13. Correcao por outro contexto.
14. Validacao por outro contexto.
15. Retrospectiva.
16. Atualizacao de backlog/PRD v1.1.

