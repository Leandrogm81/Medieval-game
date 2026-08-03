# 🏰 Reinos Medievais

Grand strategy medieval single-player, inspirado em Age of History 2. Governa um reino em um mapa procedural: gerencie economia, recrute exércitos, conquiste províncias, conduza diplomacia e leve seu reino à hegemonia.

![Medieval game](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🎮 Funcionalidades

- **Mapa procedural Voronoi** (20–70 províncias, 4–8 reinos) com visual rico: oceano, rosa dos ventos, escudos de tropas, banners de capital, estradas medievais
- **Economia**: ouro, grãos, obra, renda, manutenção, overextension
- **Exército**: infantaria, arqueiros, cavalaria e batedores; march orders multi-província; combate com terreno e fortificações; recuo de exército
- **Diplomacia**: alianças, pactos de não-agressão, pactos defensivos, tributos, insultos, guerra
- **Guerra**: war score, exaustão de guerra, coalizões, call-to-arms
- **Reconhecimento**: batedores revelam território (névoa de guerra)
- **Tecnologia e empréstimos** (em progresso)
- **6 modos de mapa**: político, economia, militar, diplomático, recursos, comércio
- **Hotkeys**: 1-5 modos, W/A marcha/ataque, Q/E zoom, S salvar, F tela cheia, Space capital
- **SFX** (Tone.js), minimapa, partículas, save/load com autosave
- **Mobile**: responsivo, touch pan/zoom, HUD adaptativo

## 🚀 Rodando localmente

Pré-requisitos: Node.js 20+

```bash
npm install
npm run dev        # dev server em http://localhost:3000
npm test           # testes (Vitest)
npm run lint       # typecheck (tsc --noEmit)
npm run build      # build de produção em dist/
```

## 🧪 Testes

Suite Vitest em `src/test/` cobrindo lógica pura (`src/logic/`): geração de estado, economia, combate, turnos, diplomacia e IA.

```bash
npm test                 # rodar uma vez
npm run test:watch       # modo watch
npm run test:coverage    # cobertura
```

## 🗺️ Como jogar

1. **Novo Reinado**: ajuste províncias (20–70) e reinos (4–8), escolha dificuldade da IA
2. **Turno**: gaste pontos de ação (10/turno) recrutando, construindo, marchando e atacando
3. **Encerrar turno** (Enter): a IA age, renda é processada, marchas chegam ao destino
4. **Vença**: conquiste 70% do território (conquista) ou acumule 10.000 de ouro (econômica)

## 📁 Estrutura

```
src/
├── logic/          → funções puras de jogo (economia, combate, turnos, diplomacia, IA)
├── hooks/          → useGameController (estado + ações), useUI (estado de interface)
├── components/     → UI (mapa, HUD, modais)
├── test/           → testes Vitest
├── types.ts        → tipos de domínio
└── persistence.ts  → save/load (localStorage)
```

## 📚 Documentação

- `docs/` — framework de desenvolvimento com agentes (triagem, PRD, planos, auditoria)
- `docs/product/` — análise brownfield, PRD mestre, revisões
- `docs/evolution/` — decisões e changelog

## 🛠️ Stack

React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · D3 (Voronoi) · Motion · Tone.js · Vitest

## 📜 Licença

Uso pessoal. Consulte o autor antes de distribuir.
