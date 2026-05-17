# CVF Policy Engine

> Coordination package for the approved `B* Merge 1` execution form.

This package does not replace its source modules. It provides one ownership umbrella for:

- Python governance enforcement from `CVF_v1.6.1_GOVERNANCE_ENGINE`
- TypeScript natural-language policy compilation from `CVF_ECO_v1.1_NL_POLICY`

## Current execution class

- approved under `GC-019` as a `coordination package`
- physical merge: rejected for the current cycle

## Sources

- governance engine:
  - `../CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/`
- NL policy:
  - `../CVF_ECO_v1.1_NL_POLICY/`

## Package role

- provide one front-door for policy ownership
- preserve Python and TypeScript source lineage
- expose reusable TypeScript policy-authoring surfaces without moving Python code

## Verification

```bash
cd EXTENSIONS/CVF_POLICY_ENGINE
npm install
npm run check
npm run test
```
