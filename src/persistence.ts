import { GameState, SaveData } from './types';

const SAVE_KEY_PREFIX = 'medieval_realms_save_';
const AUTOSAVE_KEY = 'medieval_realms_autosave';

export const persistence = {
  saveGame: (state: GameState, name: string = 'Manual Save'): void => {
    const saveData: SaveData = {
      id: `save_${Date.now()}`,
      name,
      date: new Date().toISOString(),
      state
    };
    const saves = persistence.listSaves();
    saves.push(saveData);
    localStorage.setItem(`${SAVE_KEY_PREFIX}list`, JSON.stringify(saves));
  },

  autoSave: (state: GameState): void => {
    const saveData: SaveData = {
      id: 'autosave',
      name: 'Autosave',
      date: new Date().toISOString(),
      state
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
  },

  loadAutoSave: (): SaveData | null => {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  },

  listSaves: (): SaveData[] => {
    const list = localStorage.getItem(`${SAVE_KEY_PREFIX}list`);
    return list ? JSON.parse(list) : [];
  },

  loadSave: (id: string): GameState | null => {
    const saves = persistence.listSaves();
    const save = saves.find(s => s.id === id);
    return save ? save.state : null;
  },

  deleteSave: (id: string): void => {
    const saves = persistence.listSaves();
    const filtered = saves.filter(s => s.id !== id);
    localStorage.setItem(`${SAVE_KEY_PREFIX}list`, JSON.stringify(filtered));
  }
};
