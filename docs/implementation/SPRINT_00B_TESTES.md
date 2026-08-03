# L8 - Sprint 00B: Fundacao de Testes

Use entre a Sprint 0 e a Sprint 1 quando a Sprint 0 detectar ausencia de testes.

## Objetivo

Configurar a infraestrutura minima de testes antes de implementar funcionalidades.

Esta sprint:

- Nao implementa funcionalidades.
- Nao altera logica de negocio.
- Nao refatora codigo existente.
- Apenas configura a base para testar.

## Condicoes de ativacao

Ative se a Sprint 0 detectar:

- Ausencia de framework de testes.
- Ausencia de arquivos de teste.
- Ausencia de script de teste.

## Ponto de decisao obrigatorio

Antes de instalar algo, pergunte:

```markdown
## Ponto de decisao - Estrategia de testes

O projeto nao tem infraestrutura de testes configurada.

**Stack detectada:** [stack]

**Frameworks recomendados:**
1. [framework] - [justificativa]
2. [framework] - [justificativa]

**Tipos de teste sugeridos:**
- Unitarios: [sim/nao + motivo]
- Integracao: [sim/nao + motivo]
- E2E: [sim/nao + motivo]

Qual framework e quais tipos devo configurar?
```

## Tarefas

### 00B.1 - Instalar e configurar framework

Arquivos provaveis:

- `package.json`
- `[framework].config.[ts|js]`
- `tsconfig.json`, se necessario.

Criterios:

- Comando de teste executa sem erro de configuracao.
- Scripts estao documentados.

### 00B.2 - Criar smoke test

O teste deve:

- Testar algo real do projeto.
- Ser simples.
- Passar com o codigo existente.
- Ser executavel em CI.

Nao use apenas `expect(1).toBe(1)`.

### 00B.3 - Documentar estrategia

Criar `/docs/implementation/test-plan.md` com:

```markdown
# Plano de Testes

## Framework
[nome + versao]

## Tipos configurados
- [tipo]: [ferramenta]

## Localizacao dos testes
[padrao]

## Nomenclatura
[padrao]

## Como executar
[comandos]

## Cobertura esperada
[sem meta ainda ou meta definida]

## Decisoes tomadas
[lista]
```

## Criterios de aceite da sprint

- Framework configurado.
- Smoke test existe e passa.
- Script de teste existe.
- `test-plan.md` criado.
- Build continua funcionando.
- Nenhuma logica de negocio foi alterada.

