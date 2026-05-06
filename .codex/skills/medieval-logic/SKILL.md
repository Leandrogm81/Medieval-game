---
name: medieval-logic
description: Verify Reinos Medievais game logic, including combat, economy, turns, and AI. Use when formulas, balance, or pure logic functions need correctness, determinism, or immutability checks.
---

# Medieval Logic Verifier

## Goal

Keep gameplay math correct, deterministic, and isolated from React.

## Use When

- Combat logic changes
- Economy or upkeep changes
- Turn processing changes
- AI decision logic changes

## Procedure

1. Find the affected function in `src/logic/`.
2. Test edge cases and canonical cases.
3. Verify the function is pure.
4. Verify the returned state is new and the input is untouched.
5. Check that UI output matches the computed result.

## Rules

- Pure logic first.
- No React concerns in game logic.
- Resources should not go negative unless a rule explicitly allows it.
