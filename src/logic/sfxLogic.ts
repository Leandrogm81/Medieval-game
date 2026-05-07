import * as Tone from 'tone';

const SFX_STORAGE_KEY = 'sfx_enabled';

function readSfxFlag(): boolean {
  try {
    const raw = globalThis.localStorage?.getItem(SFX_STORAGE_KEY);
    return raw !== 'false';
  } catch {
    return true;
  }
}

function writeSfxFlag(value: boolean): void {
  try {
    globalThis.localStorage?.setItem(SFX_STORAGE_KEY, String(value));
  } catch {
    // Silent fallback for SSR/Node or storage-restricted environments.
  }
}

function disposeLater(instance: { dispose: () => void }, delayMs: number): void {
  setTimeout(() => {
    try {
      instance.dispose();
    } catch {
      // Silent fallback: audio objects must never crash the game.
    }
  }, delayMs);
}

function playSequence(
  synthFactory: () => Tone.Synth | Tone.MetalSynth | Tone.MembraneSynth,
  notes: string[],
  stepMs: number,
  noteDuration: string,
  disposeDelayMs: number
): void {
  if (!isSfxEnabled()) return;

  try {
    const synth = synthFactory().toDestination();
    notes.forEach((note, index) => {
      setTimeout(() => {
        try {
          synth.triggerAttackRelease(note, noteDuration);
        } catch {
          // Silent fallback for timing/audio context issues.
        }
      }, index * stepMs);
    });
    disposeLater(synth, disposeDelayMs);
  } catch {
    // Silent fallback: Tone may be unavailable or not ready yet.
  }
}

function playDualImpact(
  primaryFactory: () => Tone.Synth | Tone.MetalSynth | Tone.MembraneSynth,
  secondaryFactory: () => Tone.NoiseSynth,
  primaryNote: string,
  primaryDuration: string,
  secondaryDuration: string,
  disposeDelayMs: number
): void {
  if (!isSfxEnabled()) return;

  try {
    const primary = primaryFactory().toDestination();
    const secondary = secondaryFactory().toDestination();
    primary.triggerAttackRelease(primaryNote, primaryDuration);
    secondary.triggerAttackRelease('C4', secondaryDuration);
    disposeLater(primary, disposeDelayMs);
    disposeLater(secondary, disposeDelayMs);
  } catch {
    // Silent fallback: Tone may be unavailable or not ready yet.
  }
}

export function initAudio(): void {
  try {
    const tone = (globalThis as typeof globalThis & { Tone?: { start?: () => Promise<unknown> | unknown } }).Tone;
    if (!tone?.start) return;
    void tone.start();
  } catch {
    // Silent fallback: audio init must never crash the game.
  }
}

export function isSfxEnabled(): boolean {
  return readSfxFlag();
}

export function getSfxEnabled(): boolean {
  return isSfxEnabled();
}

export function toggleSfx(): boolean {
  const next = !readSfxFlag();
  writeSfxFlag(next);
  return next;
}

export function playBattleSound(): void {
  if (!isSfxEnabled()) return;
  try {
    const synth = new Tone.MetalSynth({
      harmonicity: 5,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      envelope: {
        attack: 0.001,
        decay: 0.2,
        release: 0.05
      }
    }).toDestination();
    synth.frequency.value = 200;
    synth.triggerAttackRelease('C4', '16n');
    disposeLater(synth, 350);
  } catch {
    // Silent fallback.
  }
}

export function playVictoryFanfare(): void {
  playSequence(
    () => new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.3 }
    }),
    ['C5', 'E5', 'G5'],
    220,
    '8n',
    900
  );
}

export function playDefeatSound(): void {
  playSequence(
    () => new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.35 }
    }),
    ['C4', 'G3', 'C3'],
    240,
    '8n',
    1000
  );
}

export function playRecruitSound(): void {
  playDualImpact(
    () => new Tone.MetalSynth({
      harmonicity: 3,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 1.25
    }),
    () => new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0 }
    }),
    'C4',
    '16n',
    'C4',
    350
  );
}

export function playBuildSound(): void {
  if (!isSfxEnabled()) return;
  try {
    const membrane = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 }
    }).toDestination();
    const noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.06, sustain: 0 }
    }).toDestination();
    membrane.triggerAttackRelease('C2', '16n');
    noise.triggerAttackRelease('C4', '16n');
    disposeLater(membrane, 300);
    disposeLater(noise, 300);
  } catch {
    // Silent fallback.
  }
}

export function playEndTurnSound(): void {
  if (!isSfxEnabled()) return;
  try {
    const synth = new Tone.MetalSynth({
      harmonicity: 1,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.03
      }
    }).toDestination();
    synth.frequency.value = 800;
    synth.triggerAttackRelease('C4', '32n');
    disposeLater(synth, 220);
  } catch {
    // Silent fallback.
  }
}

export function playConquestSound(): void {
  playSequence(
    () => new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0.15, release: 0.25 }
    }),
    ['C5', 'E5', 'G5', 'C6'],
    180,
    '16n',
    900
  );
}

export function playWarDeclaredSound(): void {
  if (!isSfxEnabled()) return;
  try {
    const synth = new Tone.MembraneSynth({
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.05 }
    }).toDestination();
    synth.triggerAttackRelease('C2', '8n');
    disposeLater(synth, 700);
  } catch {
    // Silent fallback.
  }
}

export function playNotificationSound(): void {
  if (!isSfxEnabled()) return;
  try {
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 }
    }).toDestination();
    synth.triggerAttackRelease('C6', '32n');
    disposeLater(synth, 200);
  } catch {
    // Silent fallback.
  }
}
