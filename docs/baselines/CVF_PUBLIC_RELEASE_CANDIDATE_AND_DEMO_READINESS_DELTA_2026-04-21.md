# CVF Public Release Candidate And Demo Readiness Delta

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Roadmap: `docs/roadmaps/CVF_PUBLIC_RELEASE_CANDIDATE_AND_DEMO_READINESS_ROADMAP_2026-04-21.md`
> Status: DELIVERED - CP1-CP5 verified

---

## Closure Summary

The public release candidate and demo readiness roadmap is delivered for the current scope.

Delivered artifacts:

- Release Candidate Truth Packet: `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md`
- Demo Script: `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md`
- Known Limitations Register: `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md`
- Release Gate Bundle: `scripts/run_cvf_release_gate_bundle.py`
- Public README / docs index links for RC navigation

## Verification

Commands run on 2026-04-21:

```bash
python scripts/check_cvf_provider_release_readiness.py --json
python scripts/run_cvf_release_gate_bundle.py --dry-run --json
DASHSCOPE_API_KEY=<key> python scripts/run_cvf_release_gate_bundle.py --json
rg "sk-[A-Za-z0-9]{20,}" scripts -n
```

Results:

- Provider readiness: PASS, `certified_count=2` (Alibaba `qwen-turbo`, DeepSeek `deepseek-chat`)
- Release gate bundle: PASS; current gate includes mandatory live governance E2E plus UI-only mock E2E
- Web build: PASS
- Guard Contract TypeScript check: PASS
- Secrets scan: PASS
- Docs governance: PASS
- E2E Playwright UI (mock): PASS
- E2E Playwright Governance (live): PASS
- Script key scan: no hardcoded `sk-*` keys found under `scripts/`

## Remediation Applied During Verification

- Removed committed hardcoded Alibaba key values from `scripts/w91_benchmark.js` and `scripts/w93_benchmark.js`; both now read `ALIBABA_API_KEY` plus compatibility aliases from environment / local env loader.
- Fixed `scripts/check_cvf_provider_release_readiness.py --json` so machine output is JSON-only and exits immediately with the correct status.
- Fixed `scripts/run_cvf_release_gate_bundle.py` on Windows by resolving `.cmd` shims for commands such as `npm`.
- Fixed subprocess output decoding with UTF-8 replacement handling for non-ASCII build output.
- Tightened release-gate secret scanning to skip local tool state and known test/placeholder fixtures while still catching real committed keys in source scripts and docs.
- Superseded mock-only release gate closure: live API-backed governance E2E is now mandatory for release-quality proof; mock remains UI-only.

## Claim Boundary

This delta does not add new provider capability claims.

Current claim remains:

- Multi-provider operability is proven for Alibaba and DeepSeek.
- Provider parity is not claimed.
- Provider speed, cost, strength, and reliability remain provider-specific and user-cost-dependent.
- CVF is release-candidate-ready as a local governed development/demo framework, not a production SaaS service.
