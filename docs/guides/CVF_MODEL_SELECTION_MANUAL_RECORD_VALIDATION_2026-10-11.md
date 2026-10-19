# CVF Model Selection Manual Record Validation Guide

Memory class: bounded-manual-validation-guide
docType: reference
Status: active task guide
Date: 2026-10-11
Profile ID: `cvf.model-selection-manual-record@0.1.0`
rawMemoryReleased=false

## Purpose

Use the optional S2-R1 validator to check declared consistency in one manual AGENT_SEAT selection record before a person reviews it. The helper implements only the locked task, candidate, evidence, selection, admission, cost and LOCAL_OBSERVATION shapes.

## Scope / Applies To

The validator reads one explicitly supplied UTF-8 JSON file and prints one JSON result. It does not open reference locators, authenticate source hashes, choose a model, admit a dispatch, or change a record. A valid result never supplies execution authority.

## Prepare a Record

Start from the locked profile in `docs/reference/CVF_MODEL_SELECTION_MANUAL_RECORD_PROFILE_2026-10-11.md`. Each object has a closed field set. Keep requested identity separate from observed identity; use null plus a reason for unknown values. Preserve money, tokens, quota, worker time and human time as separate units. Do not turn an unknown amount into zero.

Freeze the `task`, `candidates` and `evidence` values independently with SHA-256 over UTF-8 JSON serialized using `ensure_ascii=False`, sorted keys, compact separators `(',', ':')`, and `allow_nan=False`. Array order is part of each digest. The validator reports drift; it never repairs the declared digest.

## Validate with the CLI

From the repository root, pass the record path explicitly:

```powershell
python governance/compat/model_selection_manual_record.py --input docs/reviews/evidence/model-selection-s2-r1-example-20261011.json
```

The S4-derived example is included as a manual validation projection. Run the same command after preparing any separate record. The CLI does not follow the example's source locators.

## Read the Result

Every result has exactly `profileVersion`, `disposition`, `executionAuthorized`, and `errors`. `VALID_RECORD_ONLY` exits 0 and means the declared record passes this profile. `INVALID_RECORD` exits 1 and lists stable field pointers. `INPUT_ERROR` exits 2 for file, size, encoding, or JSON ingestion failures. `executionAuthorized` is always false.

For example, an unsupported `evidenceUse` label returns `INVALID_RECORD` with code `ENUM` at `/learningLinks/0/evidenceUse`. Correct the source record under its existing owner, recompute its freeze digests deliberately, and rerun validation; do not patch the validator's output.

## Example Provenance and Limits

`docs/reviews/evidence/model-selection-s2-r1-example-20261011.json` pins the S4 work order, S3 completion and S4 Local completion by their declared SHA-256 values. It keeps the operator-requested `gpt-6-luna/xhigh` separate from unresolved runtime identity, records `INSUFFICIENT` quality with `HONORED_WITH_EVIDENCE_GAP`, retains unknown money and usage, and cites the S3 packet-completeness mechanism with `PARTIAL` applicability. Its learning link preserves the S4 reviewer-verified consumption of S3 as `ACTION_VERIFIED`, with the S3 source pin and S4 verification pin. S3 reported Claude Haiku; its configuration is separate from the requested Luna assignment. Current S2 consumption of the S4 enum gap is a different observation owned by the S2 Local completion.

The S4 projection is not a replacement outcome, benchmark, source-authentication result, or retroactive admission certificate. Its declared pins are not checked against source bytes by this tool. The profile digests freeze this derived projection, including retrospective S4 review context; they are not the original dispatch freeze or proof that post-review evidence existed at dispatch time.

## Unsupported Branches and Continuation

This profile supports only explicit assignment or delegated selection for `AGENT_SEAT`, separate admission summaries, unit-safe cost declarations, and `LOCAL_OBSERVATION`. It rejects parent-control/PLL fields and does not implement `ReviewedOutcomeLink`, quality scoring, ranking, persistent storage, a selector, hook/autorun/CI wiring, Gateway use, provider calls, or runtime interception. Route those needs to their existing owners and a separately authorized work order.

## Claim Boundary

`VALID_RECORD_ONLY` proves only that supplied values and declared joins are internally consistent under this bounded profile. It cannot prove that a source exists or is current, that a person read it, that the selected model is suitable, that the observed identity is genuine, that usage or billing is accurate, or that execution is authorized.
