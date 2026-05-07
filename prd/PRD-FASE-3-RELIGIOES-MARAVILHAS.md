# PRD — Fase 3: Conteúdo Avançado, Religiões e Multiplayer

> **Versão:** 1.0
> **Data:** 07/05/2026
> **Status:** 🔴 TODO
> **Estimativa:** 15-30 dias
> **Pré-requisito:** Fases 1 e 2 concluídas
> **PRD pai:** [IMPLEMENTACOES-FUTURAS.md](../IMPLEMENTACOES-FUTURAS.md)

---

## 🎯 Visão da Fase

Esta é a fase de conteúdo avançado que transforma Reinos Medievais em um ecossistema completo. Religiões adicionam uma nova dimensão diplomática, maravilhas criam objetivos de longo prazo, e o editor de cenários permite que a comunidade crie conteúdo. Multiplayer/hot-seat é o ápice: o jogo deixa de ser single-player e se torna uma experiência social.

---

## 📦 Entregáveis

| # | Funcionalidade | Dias | Prioridade | Arquivos |
|---|---|---|---|---|
| 1 | Sistema de Religiões | 3.0 | 🔴 Crítica | `religionLogic.ts`, `types.ts`, `Map.tsx` |
| 2 | Maravilhas (Wonders) | 3.0 | 🔴 Crítica | `wonderLogic.ts`, `types.ts`, `HUD.tsx` |
| 3 | Editor de Cenários | 5.0 | 🟡 Alta | `ScenarioEditor.tsx`, `mapGeneration.ts` |
| 4 | Conquistas / Achievements | 1.5 | 🟡 Alta | `achievementLogic.ts`, `AchievementsModal.tsx` |
| 5 | Armas Atômicas / Nukes | 2.0 | 🟢 Média | `nukeLogic.ts`, `types.ts` |
| 6 | Multiplayer / Hot-seat | 8.0 | 🟢 Média | `multiplayerLogic.ts`, `App.tsx` |
| 7 | i18n / Múltiplos Idiomas | 3.0 | 🟢 Média | `i18n/`, traduções |
| 8 | Replay / Crônica Animada | 3.0 | 🔵 Baixa | `ReplayModal.tsx` |
| 9 | PWA / Service Worker | 2.0 | 🔵 Baixa | `sw.js`, `manifest.json` |
| 10 | Suporte a Mods | 5.0 | 🔵 Baixa | API de mods |

---

## 1. ⛪ Sistema de Religiões

### Resumo
Cada província e reino tem uma religião. Religiões afetam relações diplomáticas (bônus/penalidade), fornecem bônus únicos, podem ser convertidas (via eventos ou ação diplomática), e têm um modo de visualização dedicado no mapa. Inspirado no sistema de religiões do Age of History 2 DE.

### Religiões Medievais

| Religião | Bônus | Cor no Mapa |
|----------|-------|-------------|
| **Catholicism** | +15% gold de igrejas, +10% influência diplomática | Dourado |
| **Orthodoxy** | +20% estabilidade, -5% gold | Roxo escuro |
| **Islam** | +10% ataque militar, +5% conversão | Verde |
| **Paganism** | +20% food production, -10% tecnologia | Marrom |
| **Judaism** | +15% gold de comércio, +10% pesquisa | Azul |
| **Zoroastrianism** | +10% defesa, +10% loyalty | Laranja |
| **Animism** | +25% recursos estratégicos, -5% diplomacia | Cinza |
| **None/Secular** | Sem bônus/penalidade | Branco |

### Modelo de Dados

**Novos campos em `Province`:**
```typescript
religion: ReligionType;  // 'catholicism' | 'orthodoxy' | 'islam' | 'paganism' | 'judaism' | 'zoroastrianism' | 'animism' | 'none'
```

**Novo campo em `Realm`:**
```typescript
stateReligion: ReligionType;  // Religião oficial do reino
```

### Efeitos nas Relações

| Cenário | Modificador |
|---------|-------------|
| Mesma religião | +20 relações |
| Religiões diferentes | -10 relações |
| Religiões opostas (ex: Catholicism vs Paganism) | -25 relações |
| Mesma religião + aliança | Bônus extra +5 |
| Tentar converter reino de outra religião | -30 relações |

### Conversão Religiosa

**Mecânica:**
- **Ação diplomática:** "Enviar Missionários" — custa 2 AP, 200 gold. Chance de sucesso: 40% + bônus por tech/comércio. Se sucesso: +1 conversão na província alvo.
- **Por evento:** Eventos aleatórios de conversão (ex: "Reforma Religiosa" converte 30% das províncias).
- **Por conquista:** Províncias conquistadas têm 20% de chance de converter para a religião do conquistador (representando imposição).

### Modo de Mapa: Religiões

- Cada província colorida pela cor da sua religião
- Label mostra o nome da religião
- No HUD: estatísticas de distribuição religiosa do reino (ex: "60% Catholic, 30% Pagan, 10% Orthodox")

### Implementação

**Arquivo novo:** `src/logic/religionLogic.ts`
```typescript
export const RELIGION_STATS: Record<ReligionType, ReligionStats>;
export function getReligionDiplomaticModifier(relA: ReligionType, relB: ReligionType): number;
export function convertProvinceReligion(province: Province, newReligion: ReligionType): void;
export function sendMissionaries(state: GameState, fromId: string, targetProvinceId: string): boolean;
export function getReligionDistribution(realmId: string, state: GameState): Record<ReligionType, number>;
```

**Integração:**
- `diplomacyLogic.ts` → `getDiplomacyAcceptance`: adicionar modificador de religião
- `turnLogic.ts` → `processEndOfTurn`: chance de conversão espontânea em províncias conquistadas
- `Map.tsx` → suporte ao modo `'religion'`
- `mapGeneration.ts` → distribuir religiões no mapa procedural

### Testes
- [ ] Províncias têm religião atribuída na geração do mapa
- [ ] Mesma religião: +20 relações
- [ ] Religiões diferentes: -10 a -25 relações
- [ ] Converter província: custa AP/gold, chance de sucesso
- [ ] Conquista: 20% chance de conversão
- [ ] Modo de mapa religiões: cores e labels corretas
- [ ] Distribuição religiosa mostrada no HUD

---

## 2. 🏗️ Maravilhas (Wonders)

### Resumo
Cada reino pode construir uma maravilha em uma de suas províncias (capital ou não). Apenas UMA maravilha de cada tipo pode existir no mundo (first-come, first-served). Maravilhas concedem bônus poderosos e representam prestígio.

### Maravilhas

| Maravilha | Custo | Turnos | Bônus | Flavor |
|-----------|-------|--------|-------|--------|
| **Grand Cathedral** | 2000g + 1000m | 15 | +30% loyalty global, +50% conversão religiosa | "As torres tocam os céus. A fé move montanhas." |
| **Royal Castle** | 2500g + 1500m | 20 | +50% defesa na província, +20% defesa global | "Muralhas que resistiram a mil cercos." |
| **Great University** | 1500g + 2000m | 12 | +50% tech generation, +2 AP por turno | "Onde as mentes mais brilhantes do reino se reúnem." |
| **Grand Bazaar** | 2000g + 500m | 10 | +40% gold de trade, +1 trade route extra | "Mercadores viajam léguas para comerciar aqui." |
| **Imperial Forge** | 2500g + 1500m | 15 | -30% custo de recrutamento, +10% ataque | "O martelo que forja impérios." |
| **Great Wall** | 3000g + 2000m | 25 | +30% defesa em TODAS as províncias | "Nem exércitos, nem tempo, a derrubarão." |
| **Oracle** | 1000g + 1000m | 8 | +2 visibilidade (vê províncias mais distantes), eventos mais favoráveis | "Os deuses sussurram segredos aos que ouvem." |

### Regras

- Apenas 1 maravilha por reino ativo
- Apenas 1 de cada tipo no mundo (se alguém já construiu, ninguém mais pode)
- Construção leva N turnos (progresso visível)
- Se a província for conquistada durante a construção → construção cancelada (recursos perdidos)
- Se a província com maravilha for conquistada → novo dono herda a maravilha (e seus bônus!)
- Maravilha concluída: notificação global "🏗️ {Realm} completou a {Wonder} em {Province}!"

### Modelo de Dados

**Novo campo em `Province`:**
```typescript
wonder?: {
  type: WonderType;          // qual maravilha
  completedAt?: number;      // turn em que foi concluída (undefined = em construção)
  startedAt: number;         // turn em que começou
  buildTurns: number;        // total de turnos para construir
};
```

**Novo campo em `GameState`:**
```typescript
builtWonders: Record<WonderType, string>;  // wonderType → realmId que construiu
```

### Implementação

**Arquivo novo:** `src/logic/wonderLogic.ts`
```typescript
export const WONDER_STATS: Record<WonderType, WonderStats>;
export function canBuildWonder(realm: Realm, state: GameState, type: WonderType): boolean;
export function startWonderConstruction(state: GameState, realmId: string, provinceId: string, type: WonderType): boolean;
export function processWonderConstruction(state: GameState): void;
export function applyWonderBonuses(realm: Realm, province: Province): void;
export function getWonderFlavor(type: WonderType): string;
```

**UI — Sub-painel no HUD:**
- Botão "🏗️ Maravilhas" que abre modal com lista
- Mostrar maravilhas já construídas no mundo (por quem, onde)
- Mostrar maravilhas disponíveis para construção
- Barra de progresso para construção em andamento

### Testes
- [ ] Apenas 1 maravilha por reino
- [ ] Apenas 1 de cada tipo no mundo
- [ ] Construção leva N turnos
- [ ] Bônus aplicados após conclusão
- [ ] Conquista da província: novo dono herda maravilha
- [ ] Cancelamento se província perdida durante construção
- [ ] Notificação global ao concluir

---

## 3. 🛠️ Editor de Cenários

### Resumo
Ferramenta visual para criar cenários personalizados: definir quais províncias pertencem a quais reinos, configurar relações iniciais, tecnologias, religiões, e recursos. Cenários podem ser salvos/exportados e compartilhados.

### Funcionalidades

#### 3.1 — Editor de Mapa
- Visualização do mapa idêntica ao jogo
- Modo "Pintar": clicar em província → atribuir a um reino
- Selecionar cor/nome do reino
- Zoom/pan normais
- Auto-preenchimento (BFS a partir de clique)

#### 3.2 — Editor de Reinos
- Criar/remover reinos
- Definir nome, cor, capital
- Definir recursos iniciais (gold, food, materials)
- Definir governo, religião, tecnologia inicial
- Definir personalidade da IA

#### 3.3 — Editor de Relações
- Matriz de relações entre todos os reinos
- Definir alianças, guerras, pactos iniciais
- Definir vassalagem

#### 3.4 — Import/Export
- Salvar cenário como JSON
- Carregar cenário salvo
- Exportar/Importar como arquivo

### Modelo de Dados

```typescript
interface ScenarioData {
  name: string;
  version: string;
  provinces: {
    id: string;
    ownerId: string;
    buildings: { farms: number; mines: number; workshops: number; courts: number };
    religion: ReligionType;
    wonder?: WonderType;
  }[];
  realms: {
    id: string;
    name: string;
    color: string;
    gold: number;
    food: number;
    materials: number;
    government: GovernmentType;
    stateReligion: ReligionType;
    personality: PersonalityType;
    techLevels: TechLevels;
    capitalId: string;
  }[];
  relations: {
    fromId: string;
    toId: string;
    value: number;
    alliance: boolean;
    war: boolean;
    nap: boolean;
  }[];
}
```

### Implementação

**Arquivo novo:** `src/components/ScenarioEditor.tsx`
- Componente principal do editor
- Toolbar com ferramentas (pintar, zoom, selecionar)
- Sidebar com lista de reinos e propriedades
- Modal de export/import

**`mapGeneration.ts`:** Nova função `generateFromScenario(scenario: ScenarioData): GameState`

### Testes
- [ ] Editor carrega com mapa em branco
- [ ] Pintar província atribui ao reino selecionado
- [ ] Criar novo reino com propriedades customizadas
- [ ] Salvar/Carregar cenário funciona
- [ ] Cenário carregado no jogo: todas as propriedades corretas
- [ ] Export/Import preserva todos os dados

---

## 4. 🏆 Conquistas / Achievements

### Resumo
Sistema de conquistas que detecta automaticamente marcos do jogador e exibe notificações.

### Achievements

| Achievement | Condição | Ícone |
|-------------|----------|-------|
| **Primeira Vitória** | Vencer 1 batalha | ⚔️ |
| **General** | Vencer 25 batalhas | 🎖️ |
| **Conquistador** | Controlar 10 províncias | 🗺️ |
| **Imperador** | Controlar 30 províncias | 👑 |
| **Diplomata** | Ter 3 alianças simultâneas | 🤝 |
| **Midas** | Acumular 5000 gold | 💰 |
| **Arquiteto** | Construir 20 edifícios | 🏗️ |
| **Maravilha** | Construir uma maravilha | 🏰 |
| **Centenário** | Chegar ao turno 100 | ⏳ |
| **Aniquilador** | Eliminar um reino | 💀 |
| **Pacificador** | Terminar uma guerra com white peace | 🕊️ |
| **Sobrevivente** | Estar em guerra por 20 turnos consecutivos | 🛡️ |
| **Tecnocrata** | Atingir nível 10 em todas as tecnologias | 🔬 |
| **Cruzado** | Converter 10 províncias à sua religião | ⛪ |
| **Senhor da Guerra** | Destruir 1000 tropas inimigas | 💥 |

### Modelo de Dados

**Novo campo em `GameState`:**
```typescript
achievements: {
  unlocked: Record<string, boolean>;   // achievementId → unlocked?
  stats: {
    battlesWon: number;
    provincesConquered: number;
    goldEarned: number;
    buildingsBuilt: number;
    realmsEliminated: number;
    troopsKilled: number;
    warsEnded: number;
  };
};
```

### Implementação

**Arquivo novo:** `src/logic/achievementLogic.ts`
```typescript
export const ACHIEVEMENTS: Record<string, AchievementDef>;
export function checkAchievements(state: GameState): string[];  // retorna IDs recém-desbloqueados
export function updateAchievementStats(state: GameState, event: AchievementEvent): void;
```

**`AchievementsModal.tsx`:** Mostrar lista de achievements (desbloqueados e bloqueados) com progresso.

### Testes
- [ ] Achievement desbloqueado ao atingir condição
- [ ] Notificação toast aparece
- [ ] Estatísticas acumulam corretamente entre turnos
- [ ] Achievements persistem no save/load
- [ ] Modal mostra progresso dos não-desbloqueados

---

## 5. ☢️ Armas Atômicas / Nukes

### Resumo
Funcionalidade avançada de late-game inspirada no Age of History 2 DE. Disponível apenas após alto nível de tecnologia, causando dano massivo mas com enormes penalidades diplomáticas.

### Construção

**Requisitos:**
- Combat tech nível 15+
- 3000 gold + 2000 materials
- 10 turnos para construir
- Máximo de nukes = combat tech level / 3

### Uso

- Só pode usar contra reinos em guerra ativa
- Selecionar província alvo (deve ser visível)
- Efeito na província alvo e vizinhas (raio 2):
  - População reduzida em 80%
  - Todas as tropas na província eliminadas
  - Economy (wealth, buildings) reduzida em 60%
  - Loyalty = 0, Stability = 10

### Penalidades Globais
- -100 relações com TODOS os reinos
- Coalizão automática contra o usuário
- Evento global: "💀 {Realm} usou uma arma de destruição em massa!"

### Implementação

**Arquivo novo:** `src/logic/nukeLogic.ts`
```typescript
export function canBuildNuke(realm: Realm): boolean;
export function startNukeConstruction(realm: Realm): boolean;
export function canUseNuke(realm: Realm, targetRealmId: string): boolean;
export function detonateNuke(state: GameState, realmId: string, targetProvinceId: string): NukeResult;
```

### Testes
- [ ] Nuke só pode ser construído com Combat tech >= 15
- [ ] Construção leva 10 turnos
- [ ] Uso reduz população, tropas e economia no raio 2
- [ ] Penalidade de -100 relações com todos
- [ ] Coalizão automática se forma
- [ ] Máximo de nukes limitado por tech level

---

## 6. 👥 Multiplayer / Hot-seat

### Resumo
Modo local onde múltiplos jogadores se alternam no mesmo dispositivo. Cada jogador controla um reino diferente.

### Especificação

**Fluxo:**
1. Menu inicial: opção "Multijogador Local"
2. Configuração: número de jogadores (2-4), atribuir reinos
3. Jogo normal, mas ao fim do turno de cada jogador:
   - Tela de transição: "Vez de {Jogador 2}"
   - Informações do jogador anterior são ocultadas
4. Vitória individual: quando um jogador atinge condição de vitória

**Tela de Transição:**
```
┌──────────────────────────────────────┐
│                                      │
│      👑 Vez de Jogador 2             │
│      Reino: Avalon                   │
│                                      │
│   Passe o dispositivo para Jogador 2 │
│                                      │
│         [Continuar]                  │
│                                      │
└──────────────────────────────────────┘
```

### Modelo de Dados

```typescript
// Em GameState:
players: { id: string; name: string; realmId: string; isHuman: boolean }[];
currentPlayerIndex: number;
```

### Implementação

**Arquivo novo:** `src/logic/multiplayerLogic.ts`
```typescript
export function setupMultiplayer(state: GameState, players: PlayerConfig[]): GameState;
export function nextPlayer(state: GameState): GameState;
export function getCurrentPlayer(state: GameState): PlayerConfig;
export function hideOtherPlayersInfo(state: GameState, currentPlayerId: string): GameState;
```

**`App.tsx`:** Adicionar tela de seleção de jogadores e tela de transição.

### Testes
- [ ] 2 jogadores alternam turnos corretamente
- [ ] Informações do outro jogador são ocultadas durante o turno
- [ ] Tela de transição aparece entre turnos
- [ ] Vitória individual funciona (jogador específico ganha)
- [ ] Save/Load funciona com multiplayer
- [ ] 3-4 jogadores funcionam sem conflitos

---

## 7. 🌐 i18n / Múltiplos Idiomas

### Resumo
Internacionalizar todo o texto do jogo para suportar múltiplos idiomas.

### Idiomas Iniciais

| Idioma | Código | Prioridade |
|--------|--------|-----------|
| Português (Brasil) | pt-BR | Padrão atual |
| Inglês | en | Alta |
| Espanhol | es | Média |
| Francês | fr | Baixa |

### Estrutura

```
src/
├── i18n/
│   ├── index.ts          // setup, hook useTranslation
│   ├── locales/
│   │   ├── pt-BR.json    // strings em português
│   │   ├── en.json        // strings em inglês
│   │   ├── es.json        // strings em espanhol
│   │   └── fr.json        // strings em francês
│   └── types.ts           // TranslationKeys
```

### Padrão de Uso

```typescript
// Hook
const { t } = useTranslation();

// Uso
<h1>{t('menu.title')}</h1>
<p>{t('combat.victory', { realm: 'Avalon', troops: 500 })}</p>

// JSON (pt-BR.json)
{
  "menu.title": "Reinos Medievais",
  "combat.victory": "Vitória! {realm} conquistou com {troops} tropas."
}
```

### Implementação

- Extrair todas as strings hardcoded do código
- Criar arquivos de tradução
- Adicionar seletor de idioma no menu
- Persistir preferência em localStorage

### Testes
- [ ] Todas as strings são traduzidas
- [ ] Trocar idioma no menu atualiza toda a UI
- [ ] Interpolação de variáveis funciona
- [ ] Fallback para pt-BR se chave não encontrada
- [ ] Preferência de idioma persiste

---

## 8. 🎬 Replay / Crônica Animada

### Resumo
Ao final do jogo, permitir assistir a um replay animado de todos os eventos principais.

### Funcionalidades

- Timeline com scrubber
- Play/Pause, velocidade (1x, 2x, 4x, 8x)
- Mapa mostra mudanças de dono ao longo do tempo
- Eventos importantes aparecem como marcadores na timeline
- Saltar para evento específico

### Dados para Replay

```typescript
interface ReplayFrame {
  turn: number;
  ownershipChanges: { provinceId: string; fromRealmId: string; toRealmId: string }[];
  events: string[];
  wars: { attackerId: string; defenderId: string; action: 'declare' | 'peace' | 'capitulation' }[];
}
```

### Implementação

**Arquivo novo:** `src/components/ReplayModal.tsx`
- Player de timeline
- Mapa em modo replay (read-only)
- Controles de play/pause/velocidade

### Testes
- [ ] Replay mostra mudanças de território frame a frame
- [ ] Play/Pause funciona
- [ ] Velocidades diferentes funcionam
- [ ] Eventos marcados na timeline
- [ ] Saltar para evento específico funciona

---

## 9. 📱 PWA / Service Worker

### Resumo
Transformar o jogo em um Progressive Web App instalável, funcionando offline.

### Funcionalidades

- Service Worker para cache de assets
- Manifest.json para instalação
- Funcionamento offline completo (jogo single-player)
- Atualização automática quando online

### Arquivos

```
public/
├── manifest.json
├── sw.js
├── icon-192.png
├── icon-512.png
```

### Implementação

- `vite-plugin-pwa` ou service worker manual
- `manifest.json` com nome, ícones, cores
- Cache-first strategy para assets estáticos

### Testes
- [ ] Jogo instala como app no celular
- [ ] Funciona offline (modo avião)
- [ ] Ícone aparece na tela inicial
- [ ] Atualiza cache quando online

---

## 10. 🔌 Suporte a Mods / Workshop

### Resumo
Permitir que a comunidade crie e compartilhe mods: cenários, texturas, traduções, scripts de eventos.

### Arquitetura

```
mods/
├── {mod-id}/
│   ├── mod.json          // metadata
│   ├── scenarios/        // cenários customizados
│   ├── assets/           // texturas, sons, fontes
│   ├── scripts/          // scripts de eventos/extensões
│   └── locales/          // traduções
```

### Mod Loader

```typescript
interface ModMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  dependencies: string[];
}

function loadMods(): Mod[];
function activateMod(modId: string): void;
function deactivateMod(modId: string): void;
```

### Tipos de Mods

1. **Cenários:** Novos mapas e configurações iniciais
2. **Assets:** Texturas de província, ícones, bandeiras
3. **Traduções:** Idiomas adicionais
4. **Scripts:** Eventos customizados, novas mecânicas (requer API de scripting)

### Implementação

- Sistema de carregamento de mods no boot
- Resolução de dependências
- UI de gerenciamento de mods no menu
- Sandbox para scripts de evento

### Testes
- [ ] Mod carrega corretamente
- [ ] Dependências resolvidas
- [ ] Conflitos de mods detectados
- [ ] Desativar mod restaura estado original
- [ ] Mods de cenário aparecem no menu de novo jogo

---

## 🧪 Testes de Integração da Fase

- [ ] Religiões + Maravilhas + Nukes não criam loops de bônus infinitos
- [ ] Editor de Cenários gera estados de jogo válidos
- [ ] Achievements não têm falsos positivos (desbloqueio incorreto)
- [ ] Multiplayer + Religiões + Mods: cada jogador vê apenas sua perspectiva
- [ ] i18n + Mods: traduções de mods não quebram traduções base
- [ ] Replay funciona com todos os sistemas (religiões, maravilhas, nukes)
- [ ] PWA cache inclui todos os novos assets
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros (bundle < 2MB)

---

## 📊 Critérios de Aceitação da Fase

- [ ] Jogador pode ver e interagir com religiões de províncias e reinos
- [ ] Pelo menos 4 maravilhas construíveis com bônus distintos
- [ ] Editor de cenários funcional: criar, editar, salvar, carregar
- [ ] Pelo menos 10 achievements detectáveis automaticamente
- [ ] Nuke funcional (construção, uso, penalidades)
- [ ] Hot-seat para 2+ jogadores no mesmo dispositivo
- [ ] Suporte a 3+ idiomas com troca em tempo real
- [ ] Replay ao fim do jogo com controles de timeline
- [ ] PWA instalável com funcionamento offline
- [ ] Sistema de mods com carregamento de cenários customizados

---

*PRD-FASE-3 | Reinos Medievais | Versão 1.0 | 07/05/2026*
