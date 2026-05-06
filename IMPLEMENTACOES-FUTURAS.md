# Implementações Futuras — Reinos Medievais

> **Versão:** 1.0  
> **Baseado no:** PRD-UI-OVERHAUL.md  
> **Propósito:** Funcionalidades identificadas durante a análise de UI, intencionalmente deixadas para versões futuras (V1, V2, etc.)

---

## V1 (próxima após o MVP)

| # | Funcionalidade | Motivo para adiar |
| --- | --------------- | ------------------- |
| 1 | **Seletor de composição de tropas** — ao marchar ou atacar, permitir escolher quantas unidades de cada tipo enviar | Requer UI adicional (sliders ou campos numéricos) e validação |
| 2 | **Minimapa** — mapa reduzido no canto inferior esquerdo para orientação durante o pan/zoom | UI nova com lógica de espelhamento; não crítico para MVP |
| 3 | **Hotkeys / atalhos de teclado** — `Enter` (encerrar turno), `Esc` (cancelar ação), `1-4` (modos de visão) | Não afeta a jogabilidade principal; valor incremental |
| 4 | **Efeitos sonoros** — SFX para batalhas, recrutamento, construção, fim de turno | Requer assets de áudio e integração com Web Audio API |
| 5 | **Responsividade dos modais** — adaptar CombatSetupModal, BattleOutcomeModal e TurnResultModal para mobile | Modais já são usáveis; polimento visual pode vir depois |
| 6 | **Remover import duplicado do Vite** no `package.json` | Correção trivial mas não impacta UI; pode ser feito junto com V1 |

---

## V2 (médio prazo)

| # | Funcionalidade | Motivo para adiar |
| --- | --------------- | ------------------- |
| 1 | **Música ambiente** — trilha sonora medieval para menu e jogo | Requer assets de áudio licenciados ou gerados |
| 2 | **Tutorial interativo / onboarding guiado** — sequência de dicas na primeira partida | Escopo grande de design de experiência; instruções modais são suficientes por enquanto |
| 3 | **Efeitos de partículas** — fogo, faíscas em batalhas, conquista de província | Performance e asset cost; pode usar canvas ou biblioteca como tsParticles |
| 4 | **PWA / service worker** — instalação como app no celular e funcionamento offline | Requer manifesto, icons, caching strategy; sem impacto na jogabilidade atual |
| 5 | **Suporte a mais modos de visão** (recursos, diplomacia, militar avançado) | Já existem 3 modos funcionais; mais modos exigem novas legendas e filtros |
| 6 | **Tela de derrota narrativa** — mensagem específica quando o jogador perde (não apenas "Crônica Encerrada") | Baixo impacto; GameEndModal genérico já funciona |

---

## V3 / Visão de longo prazo

| # | Funcionalidade | Motivo para adiar |
| --- | --------------- | ------------------- |
| 1 | **Diplomacia e tela de negociação** — interface visual para alianças, tratados, trocas | Requer nova tela inteira, novas entidades e lógica de IA; escopo grande |
| 2 | **Multiplayer ou hot-seat** — modo local ou online para 2+ jogadores | Arquitetura atual é single-player; exigiria reestruturação |
| 3 | **Sistema de achievements / conquistas** — badge por marcos (10 batalhas vencidas, 50 províncias, etc.) | Sem impacto na jogabilidade; puro engajamento |
| 4 | **Suporte a mods / editor de mapas** — criação customizada de províncias e terrenos | Escopo enorme, fora da visão atual |
| 5 | **Replay / crônica animada** — playback dos eventos do jogo em ordem | Funcionalidade avançada; crônica textual já existe |
| 6 | **Suporte a múltiplos idiomas** — i18n para inglês, espanhol, etc. | Requer biblioteca de tradução e revisão de todo texto |

---

## Notas

- Esta lista **não é congelada** — prioridades podem mudar com feedback dos jogadores.
- Funcionalidades marcadas como V1 podem ser puxadas para o MVP se houver justificativa clara.
- Nenhuma dessas funcionalidades deve ser implementada **antes** da conclusão do MVP de reforma de UI.
