import { SaveData, GameState } from './types';
import { normalizeNaturalAmount } from './logic/economyLogic';

const STORAGE_KEY = 'medieval_game_saves';
const AUTOSAVE_KEY = 'medieval_game_autosave';
const LAST_SAVE_NAME_KEY = 'medieval_game_last_save_name';

function getSaveListFromStorage(): SaveData[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMaterialsInState(state: GameState): GameState {
  Object.values(state.realms || {}).forEach(realm => {
    realm.gold = normalizeNaturalAmount(realm.gold);
    realm.food = normalizeNaturalAmount(realm.food);
    realm.materials = normalizeNaturalAmount(realm.materials);
  });

  return state;
}

function normalizeSaveName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function dedupeSavesById(saves: SaveData[]): SaveData[] {
  const byId = new Map<string, SaveData>();
  saves.forEach(save => {
    byId.set(save.id, save);
  });
  return Array.from(byId.values());
}

export const persistence = {
  saveGame: (name: string, state: GameState): SaveData => {
    const saves = getSaveListFromStorage();
    const saveName = normalizeSaveName(name) || persistence.getLastSaveName() || 'Salvamento Rápido';
    const normalizedState = normalizeMaterialsInState(JSON.parse(JSON.stringify(state)) as GameState);
    const existingIndex = saves.findIndex(save => save.name.trim().toLowerCase() === saveName.toLowerCase());
    const newSave: SaveData = {
      id: existingIndex >= 0 ? saves[existingIndex].id : crypto.randomUUID(),
      name: saveName,
      date: new Date().toISOString(),
      state: normalizedState,
    };
    if (existingIndex >= 0) {
      saves[existingIndex] = newSave;
    } else {
      saves.push(newSave);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeSavesById(saves)));
    localStorage.setItem(LAST_SAVE_NAME_KEY, saveName);
    return newSave;
  },

  listSaves: (): SaveData[] => {
    const manualSaves = getSaveListFromStorage();
    const autoSave = persistence.loadAutoSave();
    return dedupeSavesById([
      ...manualSaves,
      ...(autoSave ? [autoSave] : [])
    ]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  deleteSave: (id: string) => {
    if (id === 'autosave') {
      localStorage.removeItem(AUTOSAVE_KEY);
      return;
    }

    const saves = getSaveListFromStorage();
    const removed = saves.find(s => s.id === id);
    const filtered = saves.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    if (removed) {
      const lastName = normalizeSaveName(localStorage.getItem(LAST_SAVE_NAME_KEY) || '');
      if (lastName && removed.name.trim().toLowerCase() === lastName.toLowerCase()) {
        const stillExists = filtered.some(save => save.name.trim().toLowerCase() === lastName.toLowerCase());
        if (!stillExists) {
          localStorage.removeItem(LAST_SAVE_NAME_KEY);
        }
      }
    }
  },

  loadSave: (id: string): GameState | null => {
    if (id === 'autosave') {
      const autoSave = persistence.loadAutoSave();
      return autoSave ? normalizeMaterialsInState(autoSave.state) : null;
    }

    const saves = getSaveListFromStorage();
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
  },

  getLastSaveName: (): string => {
    const value = localStorage.getItem(LAST_SAVE_NAME_KEY);
    return value ? normalizeSaveName(value) : '';
  },

  setLastSaveName: (name: string) => {
    const normalized = normalizeSaveName(name);
    if (normalized) {
      localStorage.setItem(LAST_SAVE_NAME_KEY, normalized);
    }
  }
};
