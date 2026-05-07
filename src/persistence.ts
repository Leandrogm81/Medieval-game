import { SaveData, GameState } from './types';

const STORAGE_KEY = 'medieval_game_saves';
const AUTOSAVE_KEY = 'medieval_game_autosave';

export const persistence = {
  saveGame: (name: string, state: GameState): SaveData => {
    const saves = persistence.listSaves();
    const newSave: SaveData = {
      id: crypto.randomUUID(),
      name,
      date: new Date().toISOString(),
      state,
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
    return save ? save.state : null;
  },

  saveAutoSave: (state: GameState) => {
    const autoSave: SaveData = {
      id: 'autosave',
      name: 'Salvamento Automático',
      date: new Date().toISOString(),
      state,
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSave));
  },

  loadAutoSave: (): SaveData | null => {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
};
