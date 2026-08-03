# L6 - Analise de Projeto Existente (Brownfield)

Use quando o projeto ja existe e nao deve ser tratado como ideia do zero.

## Papel do agente

Voce e um engenheiro senior e arquiteto de produto. Sua tarefa e documentar a realidade do projeto antes de planejar novas funcionalidades.

## Regras

- Leia `/docs/agent/agent-operating-rules.md`.
- Nao implemente nada.
- Nao crie PRD ainda.
- Nao escolha nova stack tecnica.
- Documente o que existe, nao o que deveria existir.

## Entradas a inspecionar

```text
Estrutura de arquivos
package.json ou equivalente
Arquivos de configuracao
Codigo-fonte principal
README.md ou docs existentes
Arquivos de teste
.env.example ou equivalente
/docs/product/PRD.md, se existir
/docs/agent/HANDOFF.md, se existir
/docs/evolution/DECISIONS.md, se existir
/docs/evolution/CHANGELOG.md, se existir
```

## Saida esperada

Salvar em `/docs/product/BROWNFIELD_ANALYSIS.md`.

## Estrutura obrigatoria

### 1. Resumo executivo

- O que o sistema faz hoje.
- Quem usa, se for identificavel.
- Stack atual.
- Nivel de maturidade: `Prototipo`, `MVP em producao`, `Produto em crescimento`, `Produto maduro`, `Produto com debito tecnico critico`.

### 2. Inventario de funcionalidades

| Funcionalidade | Onde esta implementada | Estado | Testada? |
|---|---|---|---|

### 3. Inventario de telas e rotas

| Tela/Rota | Arquivo | Estado visual | Responsiva? | Observacao |
|---|---|---|---|---|

### 4. Arquitetura real

Descreva:

- Estrutura de pastas.
- Fluxo de dados.
- Servicos externos.
- Autenticacao.
- Estado global.
- Persistencia de dados.

### 5. Qualidade observavel

| Dimensao | Status | Evidencia |
|---|---|---|
| Testes automatizados | Existem/Parciais/Ausentes | |
| Tipagem | Completa/Parcial/Ausente | |
| Tratamento de erros | Consistente/Parcial/Ausente | |
| Variaveis de ambiente | Documentadas/Parciais/Ausentes | |
| Logging | Existe/Parcial/Ausente | |
| Documentacao inline | Adequada/Escassa/Ausente | |
| Dependencias | Sem alertas/Com alertas/Nao verificado | |

### 6. Debitos tecnicos

| Debito | Area | Severidade | Impacto se nao resolver |
|---|---|---|---|

### 7. PRD reverso

Documente:

- Regras de negocio implicitas.
- Fluxos reais de usuario.
- Permissoes e papeis existentes.
- Integracoes ativas.

### 8. Delta entre estado atual e desejado

Se houver documentacao do estado desejado:

| Funcionalidade desejada | Estado atual | Gap | Prioridade |
|---|---|---|---|

Se nao houver, escreva:

`Estado desejado nao documentado. Recomenda-se criar um Pre-PRD com base nesta analise.`

### 9. Riscos

| Risco | Tipo | Severidade | Recomendacao |
|---|---|---|---|

### 10. Recomendacao de proximo passo

Escolha uma:

- `Criar Pre-PRD`
- `Atualizar PRD existente`
- `Planejar pagamento de debito tecnico`
- `Auditoria de seguranca prioritaria`
- `Iniciar novo ciclo normalmente`

