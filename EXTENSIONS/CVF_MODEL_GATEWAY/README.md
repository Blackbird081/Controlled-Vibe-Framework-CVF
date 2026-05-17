# CVF Model Gateway

`CVF_MODEL_GATEWAY` is the approved `B* Merge 3` gateway package.

It gives CVF one official gateway surface for:

- runtime adapter contracts and adapters from `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- intake / validation / certification entrypoints from `CVF_v1.2.1_EXTERNAL_INTEGRATION`
- model-provider registry, provider health, quota, routing, fallback, sticky
  session, credential boundary, and gateway receipt primitives adapted from the
  CVF 16.5 `freellmapi` reference

Current-cycle execution class:

- `wrapper/re-export merge`
- `implementation-owner upgrade` for the model gateway runtime primitives
- source lineage stays explicit; legacy reference files are not copied wholesale
- active risk-model assets and release-evidence paths do not move

Source lineage:

- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/`
- `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/`
- `.private_reference/legacy/CVF 16.5/freellmapi/`

Guard Contract boundary:

- routing fails closed on `deny`
- routing pauses on `requires_approval`
- provider choice requires registry allow-list, health usability, and quota allow
- receipts preserve policy, routing, fallback, quota, validation, and credential
  metadata without exposing raw secrets
