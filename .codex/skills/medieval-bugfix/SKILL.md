---
name: medieval-bugfix
description: Diagnose and fix Reinos Medievais bugs with a surgical, minimal change. Use when behavior is broken, calculations are wrong, state is inconsistent, or a visual regression must be reproduced and corrected.
---

# Medieval Bugfix Flow

## Goal

Find the root cause, fix only the broken part, and prove the bug is gone.

## Use When

- Unexpected behavior
- Broken calculation
- State corruption or mutation
- Visual regression
- Turn or combat issue

## Procedure

1. Reproduce the issue if possible.
2. Localize the root cause to UI, state, logic, or contract.
3. Apply the smallest safe fix.
4. Check for nearby regressions.
5. Validate the original behavior and the corrected one.

## Rules

- Do not add new features while fixing.
- Prefer deep clone over mutation.
- Treat "looks fixed" as insufficient without evidence.
