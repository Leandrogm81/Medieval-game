# Sprint 07 — Audiovisual: Efeitos Sonoros (SFX) + Partículas

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §6 (SFX) + §8 (Partículas)
> **Duração estimada:** 2-2.5 dias
> **Dependências:** Sprint 01 (infraestrutura de áudio: `initAudio`, toggle, localStorage). Sprints 02-04 (diplomacia gera eventos que disparam sons).
> **Pré-requisito para:** Nenhum (sprint final da fase)

---

## Objetivo da Sprint

Adicionar a camada audiovisual final ao jogo: efeitos sonoros imersivos para todas as ações principais usando tone.js (síntese procedural) e partículas visuais CSS para batalhas, conquistas e construções. Este sprint conclui a Fase 1 com polimento sensorial completo.

---

## Scope: User Stories

### US-01 — Biblioteca de Sons com tone.js
**Como** jogador, **quero** ouvir feedback sonoro para cada ação importante **para** ter uma experiência imersiva e confirmação auditiva das minhas ações.

**Implementar em `src/logic/sfxLogic.ts`** (expandir o ficheiro criado no Sprint 01):

Cada som usa synths built-in do tone.js com parâmetros ajustados. Funções exportadas:

| Função | Evento | Som | Synth |
|--------|--------|-----|-------|
| `playBattleSound()` | Batalha iniciada | Clash metálico | `MetalSynth` (frequency: 200, harmonicity: 5, modulationIndex: 32, resonance: 4000, octaves: 1.5) |
| `playVictoryFanfare()` | Vitória em batalha | Fanfarra curta (C5→E5→G5) | `Synth` (triangle wave, sequência de 3 notas) |
| `playDefeatSound()` | Derrota em batalha | Som grave descendente | `Synth` (sawtooth, C4→G3→C3) |
| `playRecruitSound()` | Recrutamento concluído | Martelo/forja | `MetalSynth` + `NoiseSynth` |
| `playBuildSound()` | Construção concluída | Pedra/madeira | `MembraneSynth` + ruído |
| `playEndTurnSound()` | Fim de turno | Badalo de relógio | `MetalSynth` (frequency: 800, harmonicity: 1, decay: 0.1) |
| `playConquestSound()` | Província conquistada | Trombeta | `Synth` (brass-like, C5→E5→G5→C6) |
| `playWarDeclaredSound()` | Guerra declarada | Tambor | `MembraneSynth` (frequency: 100, decay: 0.5) |
| `playNotificationSound()` | Toast/notificação | Sino suave | `Synth` (sine wave, C6, curto) |

**Padrão de cada função:**
```typescript
export function playBattleSound(): void {
  if (!isSfxEnabled()) return;
  const synth = new Tone.MetalSynth({...}).toDestination();
  synth.triggerAttackRelease('16n');
}
```

**Princípios:**
- `isSfxEnabled()` verifica o toggle + se AudioContext está ativo
- Sons curtos (16n a 4n) para não sobrecarregar
- Synths descartáveis (criados e destruídos a cada chamada) — tone.js faz garbage collection
- Sem loops ou sons contínuos

**Arquivos:** `src/logic/sfxLogic.ts`

### US-02 — Disparo de Sons nos Eventos do Jogo
**Como** sistema, **preciso** que os sons sejam disparados nos momentos corretos **para** que o feedback auditivo seja contextual.

**Integrar chamadas `play*Sound()` nos seguintes pontos:**

| Local | Som | Quando |
|-------|-----|--------|
| `src/logic/combatLogic.ts` — `resolveCombat` | `playBattleSound()` | No início da resolução de combate |
| `src/components/BattleOutcomeModal.tsx` | `playVictoryFanfare()` | Quando `won === true` |
| `src/components/BattleOutcomeModal.tsx` | `playDefeatSound()` | Quando `won === false` |
| `src/hooks/useGameController.ts` — recrutamento | `playRecruitSound()` | Após `executeRecruitment` com sucesso |
| `src/hooks/useGameController.ts` — construção | `playBuildSound()` | Após `executeBuilding` com sucesso |
| `src/hooks/useGameController.ts` — fim de turno | `playEndTurnSound()` | Em `handleEndTurn` |
| `src/logic/turnLogic.ts` — conquista | `playConquestSound()` | Em `finishAttack` quando `result.won` |
| `src/hooks/useGameController.ts` — declarar guerra | `playWarDeclaredSound()` | Em `handleDeclareWar` (Sprint 04) |
| `src/hooks/useUI.ts` — toast | `playNotificationSound()` | Ao chamar `showToast` |

**Toggle SFX** (infraestrutura do Sprint 01):
- `isSfxEnabled()` lê localStorage key `sfx_enabled`
- Botão 🔈/🔊 no HUD alterna o valor
- Se `false`, todas as funções `play*Sound` retornam imediatamente (no-op)

**Arquivos:** `src/logic/sfxLogic.ts` (já contém `isSfxEnabled`), múltiplos ficheiros para integração

### US-03 — Animações CSS de Partículas
**Como** sistema, **preciso** de animações CSS reutilizáveis e tipos estendidos **para** que partículas possam ser renderizadas sobre o mapa.

**Adicionar em `src/index.css`:**

```css
@keyframes particle-burst {
  0%   { transform: scale(0) translate(0, 0); opacity: 1; }
  100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
}

@keyframes particle-rise {
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-40px) scale(0); opacity: 0; }
}

@keyframes particle-fall {
  0%   { transform: translateY(-20px) scale(0.5); opacity: 0; }
  50%  { opacity: 0.8; }
  100% { transform: translateY(0) scale(1); opacity: 0; }
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
}

.particle-battle {
  animation: particle-burst 0.8s ease-out forwards;
}

.particle-conquest {
  animation: particle-rise 1.2s ease-out forwards;
}

.particle-build {
  animation: particle-fall 0.6s ease-out forwards;
}
```

**Estender `VisualEffect` em `src/types.ts`:**
```typescript
export interface VisualEffect {
  type: 'battle' | 'conquest' | 'trade'
       | 'conquest_particles' | 'battle_particles' | 'build_particles';  // novos tipos
  provinceId: string;
  particleCount?: number;  // novo campo opcional (default: 8)
  // ... demais campos existentes mantidos
}
```

**⚠️ IMPORTANTE — Exaustividade do switch:**
Atualizar TODOS os `switch (effect.type)` existentes no código para tratar os 3 novos casos. Adicionar `default:` com handler genérico como fallback para evitar erros de TypeScript.

**Especificação por tipo de partícula:**

| Tipo | Cor | Animação | Duração | Tamanho | Quantidade |
|------|-----|----------|---------|---------|-----------|
| `battle_particles` | Laranja (#f97316) / Vermelho (#ef4444) | `particle-burst` (explosão) | 800ms | 6px | 8-12 |
| `conquest_particles` | Dourado (#fbbf24) | `particle-rise` (confete sobe) | 1200ms | 6px | 10-15 |
| `build_particles` | Cinza (#9ca3af) | `particle-fall` (pó cai) | 600ms | 4px | 6-8 |

**Arquivos:** `src/index.css`, `src/types.ts`

### US-04 — Integração de Partículas no Map.tsx + Testes
**Como** jogador, **quero** ver partículas visuais em batalhas, conquistas e construções **para** receber feedback visual impactante.

**Implementar em `src/components/Map.tsx`:**

Renderizar `<div>` absoluto sobre a província afetada com N partículas:
```tsx
{visualEffects.map(effect => {
  if (!['battle_particles', 'conquest_particles', 'build_particles'].includes(effect.type)) return null;
  
  const provincePos = getProvinceCenter(effect.provinceId);
  const count = effect.particleCount || 8;
  const colorClass = effect.type === 'battle_particles' ? 'bg-orange-500'
    : effect.type === 'conquest_particles' ? 'bg-yellow-400'
    : 'bg-gray-400';
  
  return (
    <div key={effect.id} style={{ left: provincePos.x, top: provincePos.y, position: 'absolute' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`particle ${effect.type === 'battle_particles' ? 'particle-battle'
            : effect.type === 'conquest_particles' ? 'particle-conquest'
            : 'particle-build'} ${colorClass}`}
          style={{
            '--tx': `${(Math.random() - 0.5) * 60}px`,
            '--ty': `${(Math.random() - 0.5) * 60}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
})}
```

**Fila de animações (limite de 3 simultâneas):**
- Se `visualEffects` tem > 3 efeitos de partículas: apenas os 3 mais recentes renderizam
- Restantes entram em fila e renderizam quando um slot liberta
- Efeitos expiram após a duração da animação (removidos do array `visualEffects`)

**Disparo de partículas:**
- `battle_particles`: adicionar efeito em `resolveCombat` (combatLogic.ts)
- `conquest_particles`: adicionar efeito em `finishAttack` quando `result.won` (turnLogic.ts)
- `build_particles`: adicionar efeito em `executeBuilding` (economyLogic.ts)

**Testes manuais:**
- Partículas aparecem na posição correta da província
- Cores diferentes para cada tipo de evento
- Partículas desaparecem após a duração da animação
- Máximo 3 animações simultâneas (fila)
- 10 eventos no mesmo frame → apenas 3 renderizam, resto em fila
- Partícula de conquista sobrepondo batalha → renderiza ambas sem conflito
- `particleCount` não definido → default 8 partículas
- `switch (effect.type)` cobre todos os novos tipos → compilação TypeScript limpa

**Arquivos:** `src/components/Map.tsx`, `src/logic/combatLogic.ts`, `src/logic/turnLogic.ts`, `src/logic/economyLogic.ts`

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/logic/sfxLogic.ts` | Editar — 9 funções play*Sound + isSfxEnabled | US-01, US-02 |
| `src/logic/combatLogic.ts` | Editar — disparar playBattleSound em resolveCombat | US-02 |
| `src/components/BattleOutcomeModal.tsx` | Editar — disparar playVictoryFanfare/playDefeatSound | US-02 |
| `src/hooks/useGameController.ts` | Editar — sons em recrutamento, construção, turno, guerra | US-02 |
| `src/logic/turnLogic.ts` | Editar — playConquestSound em conquista | US-02 |
| `src/hooks/useUI.ts` | Editar — playNotificationSound em showToast | US-02 |
| `src/index.css` | Editar — 3 keyframes + classes .particle-* | US-03 |
| `src/types.ts` | Editar — estender VisualEffect.type + particleCount | US-03 |
| `src/components/Map.tsx` | Editar — renderizar partículas + fila de 3 | US-04 |
| `src/logic/economyLogic.ts` | Editar — disparar build_particles | US-04 |

---

## Critérios de Aceitação

- [ ] Cada ação tem seu som distinto e reconhecível
- [ ] Som de batalha: clash metálico (MetalSynth)
- [ ] Som de vitória: fanfarra de 3 notas (C5→E5→G5)
- [ ] Som de derrota: grave descendente
- [ ] Som de recrutamento: martelo/forja
- [ ] Som de construção: pedra/madeira
- [ ] Som de fim de turno: badalo de relógio
- [ ] Som de conquista: trombeta
- [ ] Som de guerra declarada: tambor
- [ ] Som de notificação: sino suave
- [ ] Toggle 🔈/🔊 liga/desliga todos os sons
- [ ] Sons não tocam quando jogo está em pausa ou menu
- [ ] Sem crash se AudioContext não disponível (fallback silencioso)
- [ ] Preferência SFX persiste após reload (localStorage)
- [ ] localStorage corrompido → fallback `enabled=true`
- [ ] Disparar 10 sons simultâneos → sem crash, sons sobrepostos
- [ ] Toggle durante som tocando → som atual termina, próximos silenciados
- [ ] Chrome com política de autoplay: AudioContext resumed no primeiro clique
- [ ] Partículas aparecem na posição da província
- [ ] Cores diferentes: batalha=laranja/vermelho, conquista=dourado, construção=cinza
- [ ] Partículas desaparecem após duração da animação (sem memory leak)
- [ ] Máximo 3 animações simultâneas (fila)
- [ ] 10 eventos no mesmo frame → 3 renderizam, resto em fila
- [ ] `particleCount` não definido → default 8 partículas
- [ ] `switch (effect.type)` cobre todos os novos tipos → TypeScript compila limpo

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros (tone.js resolve; sem erros de tipo)
- [ ] Dependência `tone` instalada (`npm install tone`)
- [ ] `isSfxEnabled()` verifica localStorage de forma síncrona (sem atraso)
- [ ] Synths são criados e descartados a cada chamada (sem memory leak de áudio)
- [ ] `AudioContext` inicializado apenas no primeiro clique (política de autoplay)
- [ ] TODOS os `switch (effect.type)` no código cobrem os 3 novos casos + `default` fallback
- [ ] Partículas têm `pointer-events: none` (não interferem com cliques no mapa)
- [ ] Animações CSS usam `will-change: transform, opacity` para performance
- [ ] Nenhuma partícula fica "órfã" no DOM após animação (removida do array `visualEffects`)
- [ ] Nenhuma mutação de estado ao adicionar/remover efeitos visuais
- [ ] Testado em Chrome + Firefox (compatibilidade AudioContext e animações CSS)
