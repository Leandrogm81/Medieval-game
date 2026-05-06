---
name: medieval-build
description: Implement new Reinos Medievais features and functional improvements with minimal scope. Use when adding gameplay, UI, or state behavior that should be built cleanly without hidden refactors.
---

# Medieval Build Flow

## Goal

Build the smallest useful feature while preserving immutability and clear separation of logic.

## Use When

- New gameplay feature
- Functional improvement
- UI addition tied to existing mechanics
- Controlled expansion of an existing flow

## Core Rules

- Build only what was requested.
- Keep logic in `src/logic/` when possible.
- Do not hide refactors inside the feature.
- Preserve `gameState` immutability.

## Procedure

1. Confirm the smallest viable result.
2. Identify affected layers: UI, logic, state, or types.
3. Check whether `medieval-contracts`, `medieval-logic`, or `medieval-validate` also apply.
4. Implement the change with the fewest files possible.
5. State residual risk and validation needs.
