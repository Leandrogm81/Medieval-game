# Sprint 07 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_07_audiovisual_sfx_particulas.md
> **Total de tarefas:** 7
> **Ordem de execução:** T1-T2 (SFX); T3-T5 (Partículas); T6 (disparo de partículas); T7 (validação)
> **Regras:** Synths tone.js são descartáveis (criar e destruir). Partículas têm `pointer-events: none`. Verificar `isSfxEnabled()` antes de tocar som. Atualizar TODOS os `switch (effect.type)` para cobrir novos casos.

---

## Tarefa 1 — Implementar biblioteca de sons (9 funções play*Sound no sfxLogic.ts)

- **Objetivo:** Adicionar funções de som para todas as ações do jogo usando tone.js com síntese procedural.
- **Arquivos prováveis:** `src/logic/sfxLogic.ts`
- **Depende de:** Sprint 01 (sfxLogic.ts com `initAudio`, `isSfxEnabled`, `toggleSfx`)
- **Passos:**
  1. Abrir `src/logic/sfxLogic.ts`.
  2. Adicionar helper `isSfxEnabled()` (se ainda não existe no Sprint 01):
     - Lê `localStorage.getItem('sfx_enabled')`. Se `'false'` → false. Caso contrário → true.
     - Se localStorage não disponível → true.
  3. Implementar 9 funções. Cada uma segue o padrão:
     ```typescript
     export function playBattleSound(): void {
       if (!isSfxEnabled()) return;
       try {
         const synth = new Tone.MetalSynth({
           frequency: 200, harmonicity: 5, modulationIndex: 32,
           resonance: 4000, octaves: 1.5
         }).toDestination();
         synth.triggerAttackRelease('16n');
       } catch (e) { /* silencioso — Tone pode não estar inicializado */ }
     }
     ```
  4. Lista completa de funções e parâmetros:

     | Função | Synth | Parâmetros | Duração |
     |--------|-------|-----------|---------|
     | `playBattleSound()` | `MetalSynth` | frequency:200, harmonicity:5, modulationIndex:32, resonance:4000, octaves:1.5 | '16n' |
     | `playVictoryFanfare()` | `Synth` (triangle) | oscillator.type='triangle', notas C5→E5→G5 sequenciais, cada '8n' | total '4n' |
     | `playDefeatSound()` | `Synth` (sawtooth) | oscillator.type='sawtooth', notas C4→G3→C3, cada '8n' | total '4n' |
     | `playRecruitSound()` | `MetalSynth` + `NoiseSynth` | MetalSynth(200,3,16,2000), NoiseSynth({noise:{type:'white'}}) | '16n' |
     | `playBuildSound()` | `MembraneSynth` + ruído | MembraneSynth({pitchDecay:0.05, octaves:4}), NoiseSynth curto | '16n' |
     | `playEndTurnSound()` | `MetalSynth` | frequency:800, harmonicity:1, decay:0.1 | '32n' |
     | `playConquestSound()` | `Synth` (brass-like) | C5→E5→G5→C6, cada '16n' | total '4n' |
     | `playWarDeclaredSound()` | `MembraneSynth` | frequency:100, decay:0.5 | '8n' |
     | `playNotificationSound()` | `Synth` (sine) | frequency:C6, envelope:{attack:0.01, decay:0.1} | '32n' |

  5. Para `playVictoryFanfare` e `playConquestSound` (sequências de notas):
     - Usar `Tone.Transport` ou `synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', undefined, undefined, 0)`? SIMPLIFICAR: criar 3 synths ou usar `synth.triggerAttackRelease` com array de notas e tempo.
     - Alternativa mais simples: `synth.triggerAttackRelease('C5', '8n'); setTimeout(() => synth.triggerAttackRelease('E5', '8n'), 200); setTimeout(() => synth.triggerAttackRelease('G5', '8n'), 400);`.
  6. NÃO usar React, hooks, ou JSX. TypeScript puro.
  7. Cada função tem try/catch para evitar crash se Tone não estiver disponível.
- **Critérios de aceite:**
  - `npm run lint` passa.
  - Cada função existe e é exportada.
  - `isSfxEnabled() === false` → funções retornam imediatamente sem tocar som.
  - Sem crash se Tone não disponível.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `Tone` precisa ser importado. Verificar: `import * as Tone from 'tone'` ou `import { MetalSynth, Synth, ... } from 'tone'`.
  - tone.js pode não ter tipos. Se `npm run lint` falhar com "Cannot find module 'tone'", instalar `@types/tone` NÃO existe. Usar `// @ts-ignore` ou declarar módulo: `declare module 'tone'`.

---

## Tarefa 2 — Integrar disparo de sons nos eventos do jogo

- **Objetivo:** Chamar as funções `play*Sound()` nos momentos corretos do jogo.
- **Arquivos prováveis:** Múltiplos — ver lista abaixo
- **Depende de:** Tarefa 1
- **Passos:**
  1. Em cada ficheiro abaixo, importar a função de som relevante de `../logic/sfxLogic` e adicionar a chamada no local indicado:

     | Ficheiro | Função de som | Local exato |
     |----------|--------------|-------------|
     | `src/logic/combatLogic.ts` | `playBattleSound` | No início de `resolveCombat` |
     | `src/components/BattleOutcomeModal.tsx` | `playVictoryFanfare` | Dentro de `useEffect` quando `won === true` |
     | `src/components/BattleOutcomeModal.tsx` | `playDefeatSound` | Dentro de `useEffect` quando `won === false` |
     | `src/hooks/useGameController.ts` | `playRecruitSound` | Após `executeRecruitment` com sucesso (retorno `true`) |
     | `src/hooks/useGameController.ts` | `playBuildSound` | Após `executeBuilding` com sucesso |
     | `src/hooks/useGameController.ts` | `playEndTurnSound` | No início de `handleEndTurn` |
     | `src/hooks/useGameController.ts` | `playWarDeclaredSound` | Em `handleDeclareWar` (do Sprint 04) |
     | `src/logic/turnLogic.ts` | `playConquestSound` | Em `finishAttack` quando `result.won` (província conquistada) |
     | `src/hooks/useUI.ts` | `playNotificationSound` | Dentro da função `showToast` |

  2. Em `useUI.ts` — `showToast`:
     - Adicionar `import { playNotificationSound } from '../logic/sfxLogic'`.
     - No corpo de `showToast`, após `setToast(...)`, adicionar `playNotificationSound()`.
  3. NÃO modificar a lógica de negócio — apenas adicionar as chamadas de som.
  4. Verificar que `isSfxEnabled()` cobre todos os casos (toggle SFX desligado = silêncio).
- **Critérios de aceite:**
  - Batalha iniciada → som de clash metálico.
  - Vitória → fanfarra.
  - Derrota → som grave.
  - Recrutamento → som de forja.
  - Construção → som de pedra.
  - Fim de turno → badalo.
  - Conquista → trombeta.
  - Guerra declarada → tambor.
  - Toast → sino suave.
  - Toggle SFX desligado → silêncio total.
- **Como validar:** `npm run lint && npm run build`. Testar no browser com som ligado.
- **Riscos:**
  - Em `useUI.ts`, `showToast` é chamado frequentemente. O som de notificação é curto (32n), não deve sobrecarregar.
  - `BattleOutcomeModal.tsx`: garantir que o som não toca no mount inicial (apenas quando `won` muda). Usar `useEffect` com dependência `[won]`.

---

## Tarefa 3 — Adicionar animações CSS de partículas (index.css)

- **Objetivo:** Criar keyframes e classes CSS para três tipos de partículas: batalha, conquista, construção.
- **Arquivos prováveis:** `src/index.css`
- **Passos:**
  1. Abrir `src/index.css`.
  2. Adicionar os 3 keyframes:
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
     ```
  3. Adicionar classes CSS:
     ```css
     .particle {
       position: absolute;
       width: 6px;
       height: 6px;
       border-radius: 50%;
       pointer-events: none;
       will-change: transform, opacity;
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
  4. NÃO remover CSS existente. Apenas adicionar no final.
- **Critérios de aceite:**
  - `npm run build` processa o CSS sem erros.
  - Animações definidas e disponíveis.
- **Como validar:** `npm run build`
- **Riscos:**
  - Conflito com classes existentes chamadas `.particle`. Verificar com search_files antes.

---

## Tarefa 4 — Estender VisualEffect em types.ts + atualizar switches

- **Objetivo:** Adicionar 3 novos tipos de efeito visual e garantir que todos os `switch (effect.type)` no código os tratam.
- **Arquivos prováveis:** `src/types.ts`, + todos os ficheiros com `switch (effect.type)`
- **Passos:**
  1. Abrir `src/types.ts`. Localizar `VisualEffect`.
  2. No campo `type` (union type), adicionar 3 novos valores: `'conquest_particles'`, `'battle_particles'`, `'build_particles'`.
  3. Adicionar campo opcional `particleCount?: number` (default será 8 quando não definido).
  4. **CRÍTICO — atualizar TODOS os `switch (effect.type)` no código:**
     - Usar `search_files` com pattern `effect.type` para encontrar todos.
     - Em cada switch, adicionar `case 'battle_particles': case 'conquest_particles': case 'build_particles':` — mesmo que o tratamento seja `return null` ou `break`.
     - Adicionar `default:` fallback em switches que não têm.
     - Sem isto, TypeScript falha com "not all code paths return a value".
  5. NÃO alterar tipos existentes.
- **Critérios de aceite:**
  - `npm run lint` passa (TypeScript não reclama de switches não-exaustivos).
  - `npm run build` passa.
  - `search_files "effect.type"` retorna ficheiros. Todos foram atualizados.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Esquecer algum switch → build falha. O `search_files` deve encontrar todos. Verificar também `effect?.type` e `e.type`.
  - Os switches podem estar em Map.tsx, turnLogic.ts, ou outros.

---

## Tarefa 5 — Renderizar partículas no Map.tsx

- **Objetivo:** Adicionar renderização de partículas visuais sobre o mapa, com fila de máximo 3 animações simultâneas.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Depende de:** Tarefa 4 (tipos atualizados)
- **Passos:**
  1. Abrir `src/components/Map.tsx`.
  2. No render, após os elementos do mapa (províncias), adicionar renderização de partículas:
     - Mapear `visualEffects` que são do tipo `battle_particles`, `conquest_particles`, `build_particles`.
     - Para cada efeito, obter a posição da província (`getProvinceCenter(effect.provinceId)` — função que retorna `{x, y}` em px).
     - Criar container `<div>` absoluto na posição da província.
     - Dentro, renderizar `effect.particleCount || 8` partículas, cada uma com:
       - Classe CSS correspondente (`particle-battle`, `particle-conquest`, `particle-build`).
       - Cor de fundo: batalha=`bg-orange-500`/`bg-red-500` (alternar), conquista=`bg-yellow-400`, build=`bg-gray-400`.
       - CSS custom properties `--tx` e `--ty` com valores aleatórios entre −30 e +30px.
  3. **Fila de animações (limite 3):**
     - Filtrar `visualEffects`: apenas os 3 efeitos mais recentes (por `startTime`) renderizam.
     - Os restantes ficam em fila — o `useEffect` de limpeza existente em App.tsx remove efeitos expirados, libertando slots.
  4. NÃO usar hooks dentro do loop de renderização de partículas.
  5. Garantir `pointer-events: none` via classe CSS (já definido na Tarefa 3).
- **Critérios de aceite:**
  - Partículas aparecem na posição correta da província.
  - Cores diferentes por tipo.
  - Partículas desaparecem após duração da animação.
  - Máximo 3 animações simultâneas.
  - 10 eventos no mesmo frame → 3 renderizam, resto em fila.
  - `particleCount` não definido → default 8.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `getProvinceCenter` pode não existir. Verificar se há função para obter centroide em px. Alternativa: usar `province.centroid` e converter coordenadas SVG para px.
  - Performance: 8 partículas × 3 efeitos = 24 elementos DOM. OK.
  - `Math.random()` nas CSS props causa valores diferentes a cada render. Usar seed baseado no índice da partícula para consistência.

---

## Tarefa 6 — Disparar partículas a partir dos eventos do jogo

- **Objetivo:** Adicionar efeitos de partículas quando batalhas, conquistas e construções ocorrem.
- **Arquivos prováveis:** `src/logic/combatLogic.ts`, `src/logic/turnLogic.ts`, `src/logic/economyLogic.ts`
- **Depende de:** Tarefas 4, 5
- **Passos:**
  1. Em `src/logic/combatLogic.ts` — `resolveCombat`:
     - Após resolver o combate, adicionar ao estado um `VisualEffect`:
       ```typescript
       state.visualEffects.push({
         type: 'battle_particles',
         provinceId: defenderProvinceId, // ou a província onde ocorreu o combate
         particleCount: 10,
         startTime: Date.now(),
         duration: 800,
         id: 'battle_fx_' + Math.random()
       });
       ```
  2. Em `src/logic/turnLogic.ts` — `finishAttack`, quando `result.won`:
     - Adicionar `conquest_particles` na província conquistada, `particleCount: 12`, `duration: 1200`.
  3. Em `src/logic/economyLogic.ts` — `executeBuilding`, quando build bem-sucedida:
     - Adicionar `build_particles` na província, `particleCount: 8`, `duration: 600`.
  4. Garantir que `VisualEffect` tem todos os campos necessários (`provinceId`, `type`, `startTime`, `duration`, `id`, `particleCount?`).
  5. NOTA: `state.visualEffects` pode já ter lógica de limpeza (ver App.tsx useEffect). As partículas serão removidas quando `Date.now() - startTime > duration`.
- **Critérios de aceite:**
  - Batalha iniciada → partículas laranja/vermelhas na província.
  - Província conquistada → partículas douradas (confete).
  - Construção concluída → partículas cinzas (pó).
  - Partículas não interferem com cliques.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `state.visualEffects` pode ser `undefined`. Inicializar como `[]` se necessário.
  - O useEffect de limpeza em App.tsx remove efeitos expirados. Verificar se o intervalo (100ms) é suficiente.

---

## Tarefa 7 — Validação final

- **Objetivo:** Verificar sons e partículas.
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. Testar no browser:
     - Cada ação tem som distinto.
     - Toggle SFX funciona.
     - Partículas aparecem e desaparecem.
     - 3+ eventos simultâneos → fila de partículas funciona.
     - localStorage persiste preferência SFX.
     - Sem crash com AudioContext não disponível.
- **Critérios de aceite:** (checklist completa da sprint original)
- **Como validar:** `npm run lint && npm run build`. Testar manualmente no browser.
