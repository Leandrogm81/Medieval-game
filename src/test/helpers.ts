import { generateInitialState } from '../logic/mapGeneration';
import { GameSettings, GameState } from '../types';

export function makeSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    numRealms: 4,
    numProvinces: 25,
    resourceDensity: 'normal',
    aiDifficulty: 'normal',
    victoryCondition: 'conquest',
    ...overrides,
  };
}

export function makeState(overrides: Partial<GameSettings> = {}): GameState {
  return generateInitialState(1280, 720, makeSettings(overrides));
}
