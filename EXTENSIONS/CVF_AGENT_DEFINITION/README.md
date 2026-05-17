# CVF Agent Definition

> Coordination package for the approved `B* Merge 2` execution form.

This package does not replace its source modules. It provides one ownership umbrella for:

- runtime identity and credential management from `CVF_ECO_v2.3_AGENT_IDENTITY`
- frozen capability governance baseline from `CVF_v1.2_CAPABILITY_EXTENSION`

## Current execution class

- approved under `GC-019` as a `coordination package`
- physical merge: rejected for the current cycle

## Sources

- runtime identity:
  - `../CVF_ECO_v2.3_AGENT_IDENTITY/`
- capability baseline:
  - `../CVF_v1.2_CAPABILITY_EXTENSION/`

## Package role

- provide one front-door for `agent definition` ownership
- preserve source lineage
- avoid fake consolidation of docs-only capability assets into runtime code

## Verification

```bash
cd EXTENSIONS/CVF_AGENT_DEFINITION
npm install
npm run check
npm run test
```
