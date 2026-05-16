# CVF Model Gateway

`CVF_MODEL_GATEWAY` is the public implementation-owner gateway surface for CVF
16.5 runtime absorption.

It publishes deterministic local contracts for:

- gateway policy decisions;
- provider registry and provider health;
- quota ledger;
- gateway receipts;
- credential boundaries;
- fallback decisions;
- sticky sessions;
- routing policy;
- public skill-intake compatibility helpers.

Current execution class:

- `implementation-owner upgrade`
- runtime-owned gateway policy, provider registry, health, quota, receipt,
  credential, fallback, sticky-session, routing, and skill-compat modules

The private provenance archive keeps the full CVF 16.5 source-intake history.
This public package keeps only the curated runtime-owned surface and its tests.
