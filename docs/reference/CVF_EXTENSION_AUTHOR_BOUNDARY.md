<!-- Memory class: FULL_RECORD -->
# CVF Extension Author Boundary

> Status: canonical contributor reference
> Date: 2026-05-08
> Scope: public-release packaging, WPR-1

This document tells external contributors where additions belong and which CVF
surfaces are protected. It is a boundary guide, not authorization to change
runtime behavior.

## Golden Rule

Additions must enter through the smallest governed surface that already owns
that concern. Do not edit frozen doctrine, historical baselines, or broad
runtime files just because a local change seems convenient.

Governance behavior claims still require live provider proof:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode is for UI structure only.

## Add One Trusted Form Template

Use this path when adding a new non-wizard form for the web front door.

1. Add or update the template in the matching file under
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/`.
2. Export it through
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/index.ts`.
3. Add the route entry in
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/trusted-form-corpus.ts`.
4. Add EN/VN activation coverage in
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/trusted-form-corpus.test.ts`.
5. Keep `form-routing.ts` as router behavior only. Do not move corpus data back
   into it.
6. Run targeted form tests, then the release gate before claiming web-facing
   governance behavior.

The current 40-form corpus is the W149 baseline. Adding form coverage is a new
tranche, not a casual README edit.

## Add One Provider Lane

Use this path only after a separate provider-lane tranche is authorized.

1. Add provider configuration in the web provider layer, including secret-free
   environment handling.
2. Add or update provider status metadata under the existing provider-lane
   surfaces.
3. Run the provider canary with saved receipts:

```bash
python scripts/run_cvf_provider_live_canary.py --provider <name> --save-receipt
```

4. Update `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` only after
   receipt evidence exists.
5. Never commit raw keys. Use operator-supplied environment variables.

Provider certification requires evidence. Integration alone is not a certified
lane.

## Add One Skill

Use this path for public skill-library additions.

1. Start from the GC-044 rescreen standard:
   `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`.
2. Map the skill to a real template through
   `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/data/skill-template-map.json`
   when it has a web template surface.
3. Keep benchmark/value-proof claims limited to items classified
   `TRUSTED_FOR_VALUE_PROOF`.
4. Run the skill/template governance tests before publishing front-door claims.

Visible in the public skill library does not automatically mean
benchmark-trusted.

## Add One Governance Guard

Use this path for new governance compatibility gates.

1. Write the guard contract in `governance/toolkit/05_OPERATION/`.
2. Implement the checker in `governance/compat/`.
3. Add focused tests in `governance/compat/test_*.py`.
4. Register the guard in the guard index surfaces required by the existing
   guard registry gate.
5. Wire local/CI execution only after the checker is deterministic and
   non-destructive.

New guards should protect a real recurring risk. They should not encode one-off
review taste.

## Do Not Touch Without Explicit Authorization

- `ECOSYSTEM/doctrine/` frozen doctrine and operating-model surfaces.
- `v1.0/` and `v1.1/` historical baseline layers.
- Frozen or exception-registered large test files merely to make a small public
  doc change easier.
- Existing RC truth, live evidence, or known-limitations packets as if they were
  drafts.
- Trusted-form corpus size or provider-lane status without a fresh scoped
  tranche.
- Raw API key files, `.env.local`, or downstream workspace secrets.

## Required Contributor Checks

For docs-only work:

```bash
git diff --check
```

For release-quality public claims:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

For package-level changes, also run that extension's local test/build command.
Check the package README before choosing broader repo commands.

## Human Gate

External contributors may propose changes. The human maintainer remains the
product owner, release owner, licensing authority, and governance authority.
