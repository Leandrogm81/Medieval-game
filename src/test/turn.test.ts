import { describe, it, expect } from 'vitest';
import { findPath, calculateVisibility, checkGameOver } from '../logic/turnLogic';
import { makeState } from './helpers';
import { GameState } from '../types';

describe('turnLogic — findPath', () => {
  it('retorna [] para origem === destino', () => {
    const state = makeState();
    const provId = Object.keys(state.provinces)[0];
    expect(findPath(state, provId, provId, 'realm_0')).toEqual([]);
  });

  it('retorna [] para província inexistente', () => {
    const state = makeState();
    expect(findPath(state, 'prov_nao_existe', 'prov_1', 'realm_0')).toEqual([]);
  });

  it('permite marcha direta para vizinho amigo', () => {
    const state = makeState();
    const player = state.realms[state.playerRealmId];
    const prov = Object.values(state.provinces).find(p => p.ownerId === player.id)!;
    const friendlyNeighbor = prov.neighbors
      .map(id => state.provinces[id])
      .find(p => p && p.ownerId === player.id);
    if (friendlyNeighbor) {
      const path = findPath(state, prov.id, friendlyNeighbor.id, player.id);
      expect(path).toEqual([friendlyNeighbor.id]);
    }
  });

  it('scouts atravessam território inimigo', () => {
    const state = makeState();
    // Província de outro reino ALCANÇÁVEL por terra (mesmo continente)
    const player = state.realms[state.playerRealmId];
    const playerProv = Object.values(state.provinces).find(p => p.ownerId === player.id)!;
    if (!playerProv) return;

    // BFS por terra (ignora oceano) para achar alvo inimigo alcançável
    const visited = new Set<string>([playerProv.id]);
    const queue = [...playerProv.neighbors];
    let otherProv = null;
    while (queue.length > 0 && !otherProv) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const p = state.provinces[id];
      if (!p || p.isWater) continue;
      if (p.ownerId !== player.id) { otherProv = p; break; }
      queue.push(...p.neighbors);
    }
    if (!otherProv) return;
    // Scout pode marchar para qualquer província de terra (isScout=true)
    const path = findPath(state, playerProv.id, otherProv.id, player.id, true);
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
  });

  it('tropas regulares NÃO marcham para província inimiga não-adjacente sem allowEnemyDestination', () => {
    const state = makeState();
    const player = state.realms[state.playerRealmId];
    const prov = Object.values(state.provinces).find(p => p.ownerId === player.id)!;
    const enemy = Object.values(state.provinces).find(p => p.ownerId !== player.id && p.ownerId !== 'neutral')!;
    if (enemy) {
      const path = findPath(state, prov.id, enemy.id, player.id);
      // Se não é vizinho direto, deve retornar [] (não pode atravessar território inimigo)
      const isAdjacent = prov.neighbors.includes(enemy.id);
      if (!isAdjacent) {
        expect(path).toEqual([]);
      }
    }
  });
});

describe('turnLogic — calculateVisibility', () => {
  it('retorna lista de províncias visíveis', () => {
    const state = makeState();
    const visible = calculateVisibility(state);
    expect(Array.isArray(visible)).toBe(true);
    expect(visible.length).toBeGreaterThan(0);
  });

  it('inclui províncias recém-descobertas em recentlyScoutedProvinceIds', () => {
    const state = makeState();
    state.recentlyScoutedProvinceIds = ['prov-scout-1', 'prov-scout-2'];
    const visible = calculateVisibility(state);
    expect(visible).toContain('prov-scout-1');
    expect(visible).toContain('prov-scout-2');
  });
});

describe('turnLogic — checkGameOver', () => {
  it('retorna null com múltiplos reinos ativos', () => {
    const state = makeState();
    expect(checkGameOver(state)).toBeNull();
  });
});
