# CVF Live Evidence Manifest And Rerun Standard

Memory class: POINTER_RECORD

Status: canonical standard for secret-safe live-run evidence manifests.

## Purpose

CVF live governance evidence must be reproducible enough for an independent
reviewer to rerun or verify the exact artifact hashes without receiving raw API
keys. This standard defines the minimum manifest for live governance smoke and
release-gate evidence.

## Scope

Applies to CVF live provider proof artifacts, scheduled live smoke outputs,
release-gate outputs, and public-safe evidence packets that cite live
governance behavior.

## Required Manifest

Use:

```powershell
python scripts/build_cvf_live_evidence_manifest.py --evidence <artifact.json> --command "<secret-safe rerun command>" --output <manifest.json>
```

For release-gate evidence, prefer the canonical integrated command:

```powershell
python scripts/run_cvf_release_gate_bundle.py --json --output <artifact.json> --manifest-output <manifest.json>
```

The manifest must record:

- `schema`;
- UTC generation timestamp;
- repository origin, branch, commit, and dirty status;
- rerun command;
- accepted secret environment variable names only;
- evidence file path, byte length, and sha256;
- optional external anchor ID or URL;
- optional HMAC signature using `CVF_AUDIT_SIGNING_KEY`;
- claim boundary.

## Signature Boundary

If `CVF_AUDIT_SIGNING_KEY` is present, the script writes an HMAC-SHA256 digest
over the canonical manifest payload before the `signature` block is attached.
The signing key must never be printed, committed, or copied into public-sync.

If no signing key is present, the manifest remains useful as a hash/rerun
record and must state `signature.status=UNSIGNED`.

## External Anchor Boundary

An HMAC-signed manifest is tamper-evident for parties that trust the signing
key. It is not, by itself, a third-party immutable anchor. External audit claims
require `externalAnchor.status=PROVIDED` with an anchor ID or URL from a system
outside the local workspace.

## Scheduled Live Smoke

The scheduled smoke workflow is:

`.github/workflows/cvf-scheduled-live-governance-smoke.yml`

It runs:

```powershell
python scripts/run_cvf_release_gate_bundle.py --e2e-live --json --output cvf-scheduled-live-governance-smoke-result.json --manifest-output cvf-scheduled-live-governance-smoke-manifest.json
```

This is a minimal live-governance behavioral check. It does not replace the
protected release-quality command:

```powershell
python scripts/run_cvf_release_gate_bundle.py --json --output cvf-release-gate-result.json --manifest-output cvf-release-gate-manifest.json
```

## Failure Handling

Any failed live run must follow
`docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md` before repeated
quota-consuming reruns.

## Claim Boundary

This standard improves auditability and third-party rerun readiness. It does
not prove production readiness, public readiness, independent certification, or
external immutability unless the required release gate and external anchor
evidence are also present.
