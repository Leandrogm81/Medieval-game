# DECISIONS

Registro de decisoes permanentes do projeto.

## Formato

```markdown
## [data] - [titulo da decisao]

### Contexto
[situacao]

### Decisao
[o que foi decidido]

### Motivo
[por que]

### Impacto
[efeito pratico]

### Status
[ativa / substituida / revogada]
```

## Decisoes iniciais deste framework

### 2026-05-28 - Planilha como mapa, Markdown como fonte dos prompts

**Decisao:** manter a planilha como indice/roteador e armazenar prompts completos em arquivos `.md`.

**Motivo:** a planilha e melhor para navegacao visual; Markdown e melhor para prompts longos, versionamento e manutencao.

**Status:** ativa.

### 2026-05-28 - Menor numero significa maior prioridade na hierarquia de documentos

**Decisao:** corrigir a ambiguidade da lacuna L4: prioridade 1 e a mais alta.

**Motivo:** evita interpretacao contraditoria entre texto e tabela.

**Status:** ativa.

## Decisoes de produto (ciclo 02/08/2026)

### 2026-08-03 - Consolidar escopo em Pre-PRD unico e seguir fluxo L1-L8

**Contexto:** projeto existente (MVP jogavel) sem documentacao formal no framework. Analise Brownfield (L6) concluida em 02/08 identificou: Fase 1 ~90% implementada, Fase 2 ~20%, Fase 3 0%, zero testes automatizados, 87 arquivos nao commitados.

**Decisao:** (1) commit de seguranca do working tree; (2) criar Pre-PRD consolidado em `docs/product/PRE_PRD_ESCOPO.md` unificando PRDs Fase 1-3 avulsos; (3) proximo passo PRD_MASTER; (4) fundacao de testes (Sprint 00B) antes de novas features.

**Motivo:** estado desejado estava disperso em 3 PRDs avulsos + matriz AoH2; sem Pre-PRD unificado o fluxo formal nao tem base; sem testes, auditoria fica subjetiva.

**Impacto:** docs/product/ agora tem brownfield + pre-prd; proximas sessoes seguem PRD_MASTER -> PRD_REVIEW -> IMPLEMENTATION_PLAN -> Sprint 0 -> Sprint 00B.

**Status:** ativa.

### 2026-08-03 - Mapa visual rico portado da base AI Studio

**Contexto:** usuario aprovou visual do mapa da versao base (Downloads/medieval-realms-AI Studio) e pediu portar mantendo todos os recursos do projeto principal.

**Decisao:** reescrever `src/components/Map.tsx` portando camadas visuais (oceano gradiente, rosa dos ventos, navio, espuma costeira, terra pergaminho, escudos medievais, banners de capital, cards de nome, estradas tracejadas, decoracoes de terreno) preservando multi-selecao, heatmaps, nevoeiro de guerra, march orders, particulas, scouts e modo recursos; adaptar para mobile via matchMedia (decoracoes ocultas e escalas reduzidas em telas <=768px/touch).

**Motivo:** pedido explicito do usuario; camadas visuais sao SVG puro, sem impacto na logica de jogo.

**Impacto:** Map.tsx reescrito (commits ec7d7f3); slider de provincias ampliado 15-40 -> 20-70; default 25 -> 30.

**Status:** ativa.

