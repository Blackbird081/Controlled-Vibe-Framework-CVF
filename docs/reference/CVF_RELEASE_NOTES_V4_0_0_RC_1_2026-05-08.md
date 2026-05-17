<!-- Memory class: FULL_RECORD -->
# CVF Release Notes - v4.0.0-rc.1

Date: 2026-05-08

Status: RELEASE CANDIDATE

## What This Tag Represents

`v4.0.0-rc.1` is the first public release-candidate binding for the current CVF
mainline. It is not GA.

This tag binds:

- RC truth packet and known limitations published on 2026-04-21.
- W114-W152 non-coder governance, runtime stability, trusted-form corpus, and
  claim-sync closures.
- WPR-1 contributor boundary.
- WPR-2 deploy guide.
- WPR-3 public exposure audit.

## Highlights

- Trusted-form non-coder web front door live-usable under W149 evidence:
  Alibaba direct API 40/40, Alibaba browser UI 40/40, DeepSeek confirmatory
  12/12.
- CVF ADD doctrine is runtime-readable in the external-asset governance lane,
  with registry persistence, operator UI readout, and metadata filters.
- Contributor boundary reference created:
  `docs/reference/CVF_EXTENSION_AUTHOR_BOUNDARY.md`.
- Deploy guide created:
  `docs/guides/CVF_DEPLOY_GUIDE.md`.
- Public exposure audit passed with accepted boundaries:
  `docs/reviews/CVF_PUBLIC_EXPOSURE_AUDIT_2026-05-08.md`.

## Verification

Release-quality governance proof:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Latest WPR-4 verification passed:

- Web build PASS
- TypeScript guard contract PASS
- Provider readiness PASS
- Secrets scan PASS
- Docs governance PASS
- UI mock Playwright PASS
- Live governance Playwright PASS

## Boundaries

- This is RC, not GA.
- Web is governance-inherited on the active governed AI path, not the full CVF
  runtime.
- Certified provider lanes are bounded to current evidence.
- Mock mode is UI-only and is not governance proof.
- No raw provider keys are distributed with this release.

## Primary References

- `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md`
- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- `docs/reference/CVF_LIVE_EVIDENCE_PUBLICATION_PACKET_2026-04-21.md`
- `docs/reviews/CVF_W149_CLOSURE_DECISION_2026-05-08.md`
- `docs/reviews/CVF_WPR_1_CONTRIBUTOR_EXTENSION_BOUNDARY_CLOSURE_DECISION_2026-05-08.md`
- `docs/reviews/CVF_WPR_2_MULTI_TARGET_DEPLOY_GUIDE_CLOSURE_DECISION_2026-05-08.md`
- `docs/reviews/CVF_WPR_3_PUBLIC_EXPOSURE_AUDIT_CLOSURE_DECISION_2026-05-08.md`
