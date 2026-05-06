---
name: medieval-validate
description: Run the final technical gate for Reinos Medievais changes. Use when a change is implemented and needs lint, build, state, and visual readiness checked before completion or release.
---

# Medieval Validate Gate

## Goal

Confirm the change is technically ready and safe to close.

## Checklist

- `npm run lint`
- `npm run build`
- No obvious state mutation
- Relevant flow tested end to end
- UI remains coherent and responsive

## Procedure

1. Review the final diff.
2. Run lint and build.
3. Confirm the affected flow works.
4. Check the MAESTRO rules are respected.
5. Decide PASS or FAIL and report the blocker if any.

## Rules

- Final gate only.
- No implementation.
- Fail fast with the specific blocker.
