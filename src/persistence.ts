import { GameState, SaveData } from './types';

const AUTO_SAVE_KEY = 'medieval_realms_autosave';
const SAVES_KEY = 'medieval_realms_saves';

export const persistence = {
  saveAutoSave(state: GameState) {
    const data: SaveData = {
      id: 'autosave',
      name: 'Salvamento Automático',
      date: new Date().toISOString(),
      state
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
  },

  loadAutoSave(): SaveData | null {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveGame(state: GameState, name: string) {
    const saves = this.listSaves();
    const id = `save_${Date.now()}`;
    const data: SaveData = { id, name, date: new Date().toISOString(), state };
    saves.push(data);
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  },

  listSaves(): SaveData[] {
    const raw = localStorage.getItem(SAVES_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  loadGame(id: string): SaveData | null {
    if (id === 'autosave') return this.loadAutoSave();
    const saves = this.listSaves();
    return saves.find(s => s.id === id) || null;
  },

  deleteSave(id: string) {
    if (id === 'autosave') {
      localStorage.removeItem(AUTO_SAVE_KEY);
      return;
    }
    const saves = this.listSaves().filter(s => s.id !== id);
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  }
};
