import { SaveData, GameState } from './types';
import { normalizeNaturalAmount } from './logic/economyLogic';

const STORAGE_KEY = 'medieval_game_saves';
const AUTOSAVE_KEY = 'medieval_game_autosave';

function normalizeMaterialsInState(state: GameState): GameState {
  Object.values(state.realms || {}).forEach(realm => {
    realm.gold = normalizeNaturalAmount(realm.gold);
    realm.food = normalizeNaturalAmount(realm.food);
    realm.materials = normalizeNaturalAmount(realm.materials);
  });

  return state;
}

export const persistence = {
  saveGame: (name: string, state: GameState): SaveData => {
    const saves = persistence.listSaves();
    const normalizedState = normalizeMaterialsInState(JSON.parse(JSON.stringify(state)) as GameState);
    const newSave: SaveData = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      state: normalizedState,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...saves, newSave]));
    return newSave;
  },

  listSaves: (): SaveData[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  deleteSave: (id: string) => {
    const saves = persistence.listSaves();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves.filter(s => s.id !== id)));
  },

  loadSave: (id: string): GameState | null => {
    const saves = persistence.listSaves();
    const save = saves.find(s => s.id === id);
    return save ? normalizeMaterialsInState(save.state) : null;
  },

  saveAutoSave: (state: GameState) => {
    const normalizedState = normalizeMaterialsInState(JSON.parse(JSON.stringify(state)) as GameState);
    const autoSave: SaveData = {
      id: 'autosave',
      name: 'Salvamento Automático',
      date: new Date().toISOString(),
      state: normalizedState,
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSave));
  },

  loadAutoSave: (): SaveData | null => {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data) as SaveData;
      return {
        ...parsed,
        state: normalizeMaterialsInState(parsed.state)
      };
    } catch {
      return null;
    }
  }
};
