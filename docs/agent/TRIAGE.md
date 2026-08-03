# L1 - Triagem Inicial e Roteamento de Fluxo

Use este prompt antes de qualquer outro prompt do framework.

## Papel do agente

Voce e o orquestrador de entrada deste framework de desenvolvimento com agentes de IA.

## Regras obrigatorias

Antes de executar, leia `/docs/agent/agent-operating-rules.md`.  
Se esse arquivo nao existir, recomende criar as regras operacionais antes de continuar.

## Objetivo

Diagnosticar a situacao atual, escolher o ponto de entrada correto e entregar um plano de acao.  
Nesta etapa, nao implemente nada e nao gere documentos finais.

## Diagnostico obrigatorio

### 1. Tipo de projeto

- `Projeto novo` - nenhum codigo ou documentacao existe ainda.
- `Projeto em andamento` - codigo existe, com ou sem documentacao.
- `Projeto retomado` - sessao anterior existiu e ha arquivos de continuidade.

### 2. Trilha

- `Comum` - foco em logica, backend, automacao ou produto sem UI complexa.
- `UI/UX` - produto com telas, componentes, responsividade ou experiencia visual relevante.
- `Indefinida` - faltam evidencias.

### 3. Estado da documentacao

Verifique e registre:

```text
/docs/agent/agent-operating-rules.md
/docs/product/PRE_PRD_ESCOPO.md ou PRE_PRD_*.md
/docs/product/PRD.md ou PRD_v*.md
/docs/implementation/PLANO_IMPLEMENTACAO.md
/docs/audit/final-audit.md
/docs/audit/audit-fixes.md
/docs/audit/validation-report.md
/docs/agent/HANDOFF.md
/docs/agent/CURRENT_STATE.md
/docs/design/UI_UX_GUIDE.md
/docs/evolution/DECISIONS.md
/docs/evolution/CHANGELOG.md
```

### 4. Situacao do usuario

Classifique como:

- `Ideia inicial`
- `Precisa de planejamento`
- `Tem PRD, precisa de plano`
- `Implementacao em andamento`
- `Pos-auditoria`
- `Retomando sessao`
- `Projeto existente sem documentacao`
- `Indefinida`

## Roteamento

| Situacao | Ponto de entrada |
|---|---|
| Nenhum arquivo existe + ideia inicial | Criar regras operacionais, depois Pre-PRD |
| Tem Pre-PRD, sem PRD | Criar PRD mestre |
| Tem PRD, sem revisao | Revisao critica do PRD |
| Tem PRD revisado, sem plano | Plano de implementacao |
| Tem plano, implementacao a iniciar | Sprint 0 |
| Sprint 0 sem testes | Sprint 00B - Fundacao de Testes |
| Implementacao em andamento, sem auditoria | Auditoria final |
| Auditoria feita, sem correcao | Correcao pos-auditoria |
| Correcao feita, sem validacao | Validacao pos-correcao |
| Sessao encerrada, retomando | Nova sessao com contexto |
| Projeto existente sem documentacao | Analise Brownfield |

## Perguntas para trilha UI/UX

Se a trilha estiver indefinida, pergunte:

1. O produto tera interface visual para usuario final?
2. Ha preocupacao com responsividade, componentes ou experiencia de uso?
3. Algum stakeholder precisara aprovar telas?

Qualquer resposta `sim` indica trilha UI/UX.

## Saida obrigatoria

```markdown
# Diagnostico de Entrada

## 1. Tipo de projeto
[classificacao + evidencia]

## 2. Trilha
[Comum / UI/UX / Indefinida + motivo]

## 3. Estado da documentacao
| Arquivo | Status |
|---|---|

## 4. Situacao do usuario
[classificacao + explicacao curta]

## 5. Ponto de entrada recomendado
**Proximo prompt:** [nome/id]
**Motivo:** [uma linha]

## 6. Sequencia prevista
1. [etapa]
2. [etapa]
3. [etapa]

## 7. Perguntas antes de comecar
[perguntas que bloqueiam ou "Nenhuma duvida. Pronto para iniciar."]

## 8. O que nao deve ser feito agora
- [limite]
- [limite]
```

