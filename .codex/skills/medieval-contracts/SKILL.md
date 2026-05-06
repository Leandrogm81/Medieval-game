---
name: medieval-contracts
description: Protect Reinos Medievais data contracts, types, and payload shapes. Use when changing `src/types.ts`, game state structure, action payloads, or any interface between UI and logic.
---

# Medieval Contract Guardian

## Goal

Keep the game data model stable, typed, and aligned across producers and consumers.

## Use When

- `src/types.ts` changes
- Action payload changes
- `GameState`, `Province`, `Kingdom`, or troop structure changes
- "field undefined" or type mismatch bugs

## Procedure

1. Map the contract and all consumers.
2. Check producer and consumer alignment.
3. Verify strict typing, no `any`, no unsafe casts.
4. If `GameState` changed, update initialization and persistence paths.
5. Confirm the data survives the full UI -> controller -> logic -> state path.

## Rules

- `src/types.ts` is the source of truth.
- No silent contract breaks.
- Keep state shape and payload shape synchronized.
