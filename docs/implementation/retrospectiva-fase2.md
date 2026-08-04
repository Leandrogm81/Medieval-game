# Retrospectiva — Ciclo Fase 2 (Reinos Medievais)

> **Data:** 03/08/2026
> **Participantes:** Agente Hermes + Leandro (decisões pontuais)

---

## O que funcionou bem

1. **Testes primeiro (Sprint 00B)** — a fundação de testes pegou 2 bugs reais antes das features novas (crash de reino eliminado, guerra contra si mesmo). Sem os testes, esses bugs iriam para produção.
2. **Imutabilidade como convenção** — testar declareWar por clonagem revelou e impediu regressões.
3. **Sprints pequenas com commit por sprint** — 11 commits atômicos, cada um com validação (tsc + testes + build). Rollback trivial se algo quebrasse.
4. **Migração de saves antes das features** (Sprint B antes de C-H) — saves antigos do jogador nunca quebraram durante o ciclo.
5. **Decisões registradas imediatamente** — conflito de hotkey F/V resolvido no ato e documentado, sem reabrir discussão depois.

## O que poderia ter sido melhor

1. **Plano subestimou UI** — modais e botões do HUD levaram mais tempo que o previsto (a lógica era 40%, a UI 60%). Próximo ciclo: orçar UI como item separado.
2. **Testes flaky no início** — 3 testes dependiam do mapa aleatório (realm_1 com 1 província) e quebravam intermitentemente. Lição: testes de integração com estado gerado precisam normalizar o cenário (garantir nº mínimo de províncias por reino) desde o início.
3. **Várias pendências só detectadas na revisão final** — a checagem contra o plano no fim revelou 5 tarefas de UI não executadas (empréstimo do jogador, apaziguar vassalo, decay, touch targets, lifecycle). Lição: criar checklist de aceite por sprint e verificar ao fechar cada sprint, não no fim do ciclo.
4. **CRLF→LF poluiu diffs** — commits grandes de formatação dificultaram a leitura. Próximo ciclo: normalizar line endings no início.

## Métricas do ciclo

| Métrica | Valor |
|---|---|
| Sprints executadas | 9 + pendências |
| Commits | 11 (3dc0fc2 → 70699b6) |
| Testes | 39 → 76 (+95%) |
| Bugs reais pegos por testes | 2 (Sprint 00B) |
| `any` eliminados | 10 |
| Deps mortas removidas | 4 |
| Arquivos de lógica novos | 6 (technology, government, capitulation, vassal, saveMigration + ai/finance reescritos) |
| Modais novos | 2 (Technology, Government) |

## Ações para o próximo ciclo

- [ ] Fazer checklist de aceite por sprint (extraído do plano) e validar antes do commit de fechamento
- [ ] Normalizar line endings (git config core.autocrlf) no início
- [ ] Teste em device real (375px) dos modais antes de release
- [ ] Benchmark de 70 províncias com os 13 modos
- [ ] Considerar hot-seat multiplayer (único item especulativo do PRD)
