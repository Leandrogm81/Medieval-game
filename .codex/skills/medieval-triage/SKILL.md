---
name: medieval-triage
description: Classify and route Reinos Medievais requests by type, risk, and next workflow. Use when a new request is ambiguous, mixed, or needs triage before implementation, debugging, refactoring, validation, or release.
---

# Medieval Triage

## Goal

Turn an incoming request into a clear operational path before any code changes.

## Inputs

- User intent
- Affected area: UI, state, logic, types, deploy, incident
- Evidence: logs, screenshots, diff, reproduction steps
- Expected vs actual behavior

## Procedure

1. Normalize the request into one sentence.
2. Identify the main type: `bug`, `feature`, `improvement`, `refactor`, `state`, `logic`, `ui`, `deploy`, `incident`, or `unknown`.
3. Assign risk: `trivial`, `standard`, `risky`, or `structural`.
4. Choose the next workflow:
   - `bug` -> `medieval-bugfix`
   - `feature` or `improvement` -> `medieval-build`
   - `refactor` -> `medieval-refactor`
   - `state` or contract changes -> `medieval-contracts`
   - `logic` changes -> `medieval-logic`
   - final check -> `medieval-validate`
5. State the minimum validation needed.

## Output

Return a compact triage note with type, risk, next workflow, and required validation.
