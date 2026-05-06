---
name: medieval-refactor
description: Refactor Reinos Medievais code for structure, readability, and immutability without changing behavior. Use when the task is primarily about moving logic, reducing coupling, or cleaning state handling.
---

# Medieval Refactor Flow

## Goal

Improve structure while keeping the game behavior identical.

## Use When

- Moving logic out of React
- Replacing mutation with immutable updates
- Simplifying controllers
- Untangling types or component boundaries

## Procedure

1. State the structural problem in one sentence.
2. Define the scope and the non-goals.
3. Preserve the exact behavior of the game.
4. Move logic to `src/logic/` when appropriate.
5. Verify immutability and final behavior.

## Rules

- Do not change rules or balance.
- Prefer the narrowest useful edit.
- Keep the output behavior identical unless explicitly asked otherwise.
