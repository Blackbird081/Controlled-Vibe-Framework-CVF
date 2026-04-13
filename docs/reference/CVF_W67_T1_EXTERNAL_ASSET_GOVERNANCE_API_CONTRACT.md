# CVF W67-T1 External Asset Governance — API Contract

Memory class: FULL_RECORD

> Wave: W67-T1 External Asset Productization
> Status: ACTIVE — CP1+CP2+CP3 DELIVERED 2026-04-13
> Authorization: `docs/baselines/CVF_GC018_W67_T1_EXTERNAL_ASSET_PRODUCTIZATION_AUTHORIZATION_2026-04-13.md`

---

## Overview

Two governed routes form the external asset preparation + registration path.
Both routes are isolated from `/api/execute`, provider adapters, and PVV evidence files.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/governance/external-assets/prepare` | POST | Run governance pipeline; return workflowStatus + review data |
| `/api/governance/external-assets/register` | POST | Persist an approved asset in the governed registry |
| `/api/governance/external-assets/register` | GET | List all registered governed assets |

---

## Authentication

Both routes accept either:
- **Session cookie** — set by NextAuth.js login (`verifySessionCookie`)
- **Service token** — `x-cvf-service-token: <CVF_SERVICE_TOKEN env>` header

Unauthenticated requests return `401 Unauthorized`.

---

## POST `/api/governance/external-assets/prepare`

Runs the full bounded governance pipeline:
`intake validation → semantic classification → planner heuristics → provisional signal capture → W7 normalization → registry-ready preparation`

### Request Body

```jsonc
{
  // REQUIRED
  "profile": {
    "source_ref": "CVF_ADDING_NEW/skill.md",          // string — asset source path or identifier
    "source_kind": "document_bundle",                  // "document_bundle" | "repo" | "external_url" | "inline"
    "source_quality": "internal_design_draft",         // "internal_design_draft" | "community_analysis" | "verified_external" | "operator_supplied"
    "officially_verified": false,                      // boolean
    "provenance_notes": "Curated from...",             // string (required for registry_ready)
    "candidate_asset_type": "W7SkillAsset",            // "W7SkillAsset" | "W7ToolAsset" | "W7PolicyAsset"
    "description_or_trigger": "Normalize PowerShell…", // string
    "instruction_body": "...",                         // string
    // OPTIONAL
    "tools": ["powershell"],
    "execution_environment": {
      "os": "windows",
      "shell": "powershell",
      "shell_version": "7.5",
      "script_type": "ps1",
      "compatibility": "native"
    }
  },
  // OPTIONAL
  "semanticItems": [
    "CONTEXT_VALIDATION_REQUIRED",
    { "semanticItem": "COMPLETE_OUTPUT_REQUIRED", "declaredClass": "output_contract" }
  ],
  "windows": {
    "commandsValidated": true,
    "unsupportedOperatorsRemoved": true,
    "exitCodeHandlingExplicit": true,
    "deterministicExecution": true
  },
  "registry": {
    "governanceOwner": "cvf-architecture",
    "approvalState": "approved",   // "draft" | "pending_review" | "approved"
    "riskLevel": "R1",             // "R0" | "R1" | "R2" | "R3"
    "registryRefs": ["cvf://registry/w7/..."],
    "evaluationEnabled": true
  },
  "diagnostic": {
    "taskId": "task-001",
    "runId": "run-001",
    "runtimeIndicator": "NOT_PROVIDED"
  }
}
```

### Response — 200 OK

```jsonc
{
  "success": true,
  "data": {
    // CP1 — Workflow status (explicit closure state)
    "workflowStatus": "registry_ready",   // "invalid" | "review_required" | "registry_ready"
    "readyForRegistry": true,             // boolean (derived from all checks passing)
    "warnings": [],                       // string[] — coded warning keys by category

    // Pipeline stage outputs
    "intake": { "valid": true, "issues": [], "normalizedProfile": {...} },
    "semanticPolicy": { "valid": true, "unknownItems": [], "classMismatches": [] } | null,
    "plannerTrigger": { "confidence": "HIGH", "clarification_needed": false, "negative_matches": [], ... },
    "provisionalSignal": { "name": "...", ... } | null,
    "normalizedCandidate": { "valid": true, "issues": [], ... },
    "registryReady": {
      "valid": true,
      "governedAsset": {
        "name": "...",
        "version": "1.0.0",
        "governance": {
          "owner": "cvf-architecture",
          "approvalState": "approved",
          "riskLevel": "R1",
          "registryRefs": [...]
        }
      },
      "issues": []
    },
    "windowsCompatibility": {
      "classification": "WINDOWS_NATIVE",  // "WINDOWS_NATIVE" | "CROSS_PLATFORM" | "REJECTED_FOR_WINDOWS_TARGET" | ...
      "blockers": []
    } | null,
    "diagnosticPacket": {
      "primaryAttribution": "INTAKE_SHAPE",  // "INTAKE_SHAPE" | "PLANNER_TRIGGER_QUALITY" | ... | "RUNTIME_OR_PROVIDER_BEHAVIOR"
      "executionEnvironmentSummary": { "declared": true, ... }
    }
  }
}
```

### workflowStatus Derivation

| workflowStatus | Condition |
|---|---|
| `registry_ready` | `readyForRegistry === true` (all checks pass) |
| `invalid` | `intake.valid === false` (cannot proceed) |
| `review_required` | `intake.valid === true` AND `readyForRegistry === false` |

### Warning Key Format

Warnings follow the pattern `{CATEGORY}_{CODE}_{FIELD}`:

| Prefix | Category |
|--------|----------|
| `INTAKE_` | Intake validation issues |
| `SEMANTIC_UNKNOWN_` | Unrecognized semantic items |
| `SEMANTIC_CLASS_MISMATCH_` | Semantic class conflicts |
| `PLANNER_CLARIFICATION_REQUIRED` | Planner needs more inputs |
| `PLANNER_NEGATIVE_MATCH_` | Planner negative signal |
| `PROVISIONAL_SIGNAL_` | Weak trigger definition captured |
| `NORMALIZATION_` | W7 normalization issues |
| `REGISTRY_` | Registry preparation issues |

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Missing `profile` field |
| 401 | Unauthenticated |
| 500 | Internal pipeline error |

---

## POST `/api/governance/external-assets/register`

Persists a governed asset in the governed registry after independently re-running the
full governance pipeline on the submitted profile. Callers cannot self-declare
`approvalState` or `workflowStatus` — the server is the authority. Only assets the
server independently classifies as `workflowStatus === 'registry_ready'` are persisted.

Write path is isolated from `/api/execute` and PVV evidence files.
Persistence: append-only JSONL at `data/governed-asset-registry.jsonl`.

### Request Body

Same shape as `POST /prepare` — submit the full governance profile, not a pre-assembled asset record.

```jsonc
{
  // REQUIRED
  "profile": {
    "source_ref": "CVF_ADDING_NEW/skill.md",
    "source_kind": "document_bundle",
    "source_quality": "internal_design_draft",
    "officially_verified": false,
    "provenance_notes": "Curated from...",
    "candidate_asset_type": "W7SkillAsset",
    "description_or_trigger": "Normalize PowerShell skills for CVF",
    "instruction_body": "..."
  },
  // OPTIONAL — same optional fields as /prepare
  "semanticItems": [...],
  "registry": {
    "governanceOwner": "cvf-architecture",
    "riskLevel": "R1",
    "registryRefs": ["cvf://registry/..."]
  },
  "windows": { ... },
  "planner": { ... }
}
```

### Response — 200 OK (registry_ready confirmed by server)

```jsonc
{
  "success": true,
  "entry": {
    "id": "uuid-v4",
    "registeredAt": "2026-04-13T10:00:00.000Z",
    "workflowStatus": "registry_ready",
    "source_ref": "CVF_ADDING_NEW/skill.md",
    "candidate_asset_type": "W7SkillAsset",
    "description_or_trigger": "...",
    "approvalState": "approved",
    "governanceOwner": "cvf-architecture",
    "riskLevel": "R1",
    "registryRefs": ["cvf://registry/w7/..."],
    "assetName": "skill.md",
    "assetVersion": "1.0.0"
  }
}
```

### Response — 422 Unprocessable (pipeline did not reach registry_ready)

Returned when the server re-derives `workflowStatus !== 'registry_ready'`. The caller cannot override this by self-declaring `approvalState`.

```jsonc
{
  "success": false,
  "error": "Asset is not registry_ready (workflowStatus: review_required); resolve all issues via /prepare before registering",
  "workflowStatus": "review_required",  // or "invalid"
  "warnings": ["PLANNER_CLARIFICATION_REQUIRED"]
}
```

---

## GET `/api/governance/external-assets/register`

Returns all registered governed assets (auditable registry read).

### Response — 200 OK

```jsonc
{
  "success": true,
  "count": 2,
  "entries": [
    { ...AssetRegistryEntry },
    { ...AssetRegistryEntry }
  ]
}
```

---

## Operator UI

The operator-facing page is available at `/governance/external-assets` in the cvf-web dashboard.

Tabs:
- **Prepare Asset** — submit a profile, view `workflowStatus` badge + closure guidance, register if ready
- **Registry** — list all registered governed assets with audit metadata

---

## Governance Boundaries

- Does NOT call `/api/execute` or any provider adapter
- Does NOT write to PVV evidence files (`pvv_*`, `batch_evidence.jsonl`)
- Registry sink is isolated to `data/governed-asset-registry.jsonl`
- All writes are append-only (auditable)
- MVP persistence: local server file. Serverless deployment requires external store (future scope)

---

*Filed: 2026-04-13*
*Wave: W67-T1 CP1+CP2+CP3 DELIVERED*
