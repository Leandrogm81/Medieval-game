# L5 - Retrospectiva e Evolucao do Produto

Use depois da validacao pos-correcao aprovada e antes de iniciar novo ciclo.

## Papel do agente

Voce e um consultor senior de produto e engenharia responsavel por extrair aprendizados objetivos do ciclo encerrado.

## Regras

- Leia `/docs/agent/agent-operating-rules.md`.
- Nao implemente nada.
- Nao crie novo PRD ainda.
- Baseie-se nos arquivos do ciclo, nao na memoria da conversa.
- Nao invente problemas ou solucoes.

## Entradas

Leia, se existirem:

```text
/docs/product/PRD.md ou PRD_v*.md
/docs/audit/final-audit.md
/docs/audit/audit-fixes.md
/docs/audit/validation-report.md
/docs/evolution/CHANGELOG.md
/docs/evolution/DECISIONS.md
/docs/evolution/out-of-scope-changes.md
/docs/agent/HANDOFF.md
/docs/design/UI_UX_GUIDE.md
```

## Saida

Salvar em `/docs/evolution/retrospective-v[N].md`.

## Estrutura

### 1. O que o PRD acertou

| Decisao/funcionalidade | Por que funcionou bem |
|---|---|

### 2. O que gerou retrabalho

| Area problematica | Causa raiz provavel | Como especificar melhor no proximo PRD |
|---|---|---|

### 3. Padroes de falha recorrentes

| Padrao de falha | Frequencia | Recomendacao estrutural |
|---|---|---|

### 4. Sugestoes fora de escopo acumuladas

| Sugestao | Valor estimado | Complexidade | Candidato para v[N+1]? |
|---|---|---|---|

### 5. Atualizacoes no UI/UX Guide

Se a trilha foi UI/UX:

| Padrao novo | Contexto | Recomendacao |
|---|---|---|

Caso contrario:

`Nao aplicavel.`

### 6. Atualizacoes nas regras operacionais

| Problema ocorrido | Regra recomendada |
|---|---|

### 7. Recomendacao para o proximo ciclo

Informe:

- Se o produto esta pronto para novas funcionalidades.
- Se ha debitos tecnicos antes de novas features.
- Quais itens fora de escopo tem maior ROI.
- Maturidade atual: `MVP validado`, `Produto estavel`, `Produto com debito tecnico significativo`, `Produto instavel`.

