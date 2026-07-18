# CVF Workspace Layer Full Package Absorption Inventory

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-27

Owner: Codex

## Purpose

Record the complete non-cache inventory of
`CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE` for governed CVF absorption.
This file turns the frozen package into an inspectable CVF reference input
without promoting the package itself to source of truth.

## Scope / Methodology

Scope: every file under
`CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/`
except Python cache artifacts under `__pycache__`.

Methodology: enumerate files, group by package folder or root filename, record
byte size and SHA-256 digest, then classify CVF absorption disposition by
group.

## Findings / Position

Finding: the package contains `nonCacheFileCount=68` files. The package has
real design value for future workspace-local-runtime work, but its runtime,
MCP, CLI, IDE, schema, and test artifacts remain non-canonical until converted
through fresh CVF governance.

Position: absorb knowledge, not authority. Future agents should cite this
inventory and CVF-owned contracts rather than treating the raw package as an
implementation mandate.

## Source Inventory

| File | Action |
|---|---|
| `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json` | SOURCE_VERIFIED |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | SOURCE_VERIFIED |
| `docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md` | SOURCE_VERIFIED |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | SOURCE_VERIFIED |
| `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/` | READ_ONLY_INVENTORY |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| Package is a frozen reference folder | `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json` | line 80 | `lifecycleClass` | root folder lifecycle registry | ACCEPT |
| Package useful content must be absorbed through governed CVF artifacts | `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json` | line 83 | `relocationPolicy` | root folder lifecycle registry | ACCEPT |
| Prior map classified package smoke as advisory only | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | line 89 | `NON_CANONICAL_ADVISORY` | package absorption map | ACCEPT |
| Two-layer standard rejects external smoke as CVF proof | `docs/reference/agent_workspace/CVF_WORKSPACE_TWO_LAYER_ARCHITECTURE_STANDARD.md` | line 89 | `External package smoke test passed` | workspace two-layer standard | ACCEPT |

## Inventory Summary

| Group | Count | CVF disposition |
|---|---:|---|
| root | 2 | ABSORB_AS_REFERENCE |
| contracts | 5 | ADAPT_TO_CVF_CONTRACTS |
| implementation | 15 | ADAPT_TO_FUTURE_DESIGN |
| integration | 7 | DEFER_TO_SOURCE_VERIFIED_WORK_ORDER |
| schemas | 8 | MAP_TO_CVF_STATE_TOPOLOGY_BEFORE_USE |
| reference_implementation | 15 | KEEP_AS_NON_CANONICAL_TEST_FIXTURE |
| runbooks | 3 | ADVISORY_ONLY |
| scripts | 1 | ADVISORY_ONLY |
| templates | 2 | ADAPT_AS_BOOTSTRAP_CONTEXT_ONLY |
| tests | 10 | NON_CANONICAL_ADVISORY |

Excluded from count: Python cache artifacts under `__pycache__`.

## Full Non-Cache SHA-256 Manifest

| Group | Bytes | SHA-256 | Path |
|---|---:|---|---|
| contracts | 1018 | `6b476405f8befa17185ea347f303e64d38e0a271a07645b5eb4ed48e148eeb33` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/contracts/IDE_BRIDGE_CONTRACT.md` |
| contracts | 1264 | `52b458d57fc443cf579196db5517811718bdf84e2ad6b84896c92cbc1e182956` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/contracts/STATE_PROJECTION_CONTRACT.md` |
| contracts | 1628 | `545ca7842f447c5de5f17ca0788e05b29748770bb450d808a9bd6e30b4297e93` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/contracts/WORKSPACE_MCP_CONTRACT.md` |
| contracts | 2626 | `f4bff9e935e2afcb4bb8afb34265774c6b84d19277e0b1d32b222ae050c4ba7a` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/contracts/WORKSPACE_RUNTIME_CONTRACT.md` |
| contracts | 1174 | `90ee73611aa63dff8e32d7d3129eb38689574a028834a106ae0559d9fb437703` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/contracts/WORKSPACE_UI_CONTRACT.md` |
| implementation | 2411 | `642ec7b4b6bf0a169b4b871d6dffaff718d10caf6a004ac25e3dc413977092cb` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/CVF_CORE_BINDING.md` |
| implementation | 1591 | `1e02cff4fd2f9c3bc8287870605316c41f796da7eacd575821c6c8afb8aa2e34` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/GOVERNANCE_PROJECTION_ENGINE.md` |
| implementation | 6047 | `691b2906537b0221b706233e71ada7f702905d4a09e14288fee4939addafd8fd` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/IDE_BRIDGE_INTEGRATION.md` |
| implementation | 1300 | `0597321d78d1d75aac587017ed4219a966e612646eded5ee3607e6ff981c472b` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/IDE_BRIDGE_RUNTIME.md` |
| implementation | 1043 | `0fe9b926c844102d9c7bd76bb5dc353e4fe0472a7523071817de3ccfd658d096` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/LOCAL_RUNTIME_INTEGRATION.md` |
| implementation | 1246 | `4fce23dc02d35f5cef6a9362b636d56e1715f63b8259bf2853a79cc3d6e85326` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/MCP_SERVER_ARCHITECTURE.md` |
| implementation | 7682 | `485ecb54f8cee7de1403c4145a89e26081c7e9e1abac46f7257c185b601d6fb7` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/STATE_FILE_DEFINITIONS.md` |
| implementation | 5961 | `f2591e02c43a4695817e985eaa79acb2451bc1043de7f8b590ec73f5801a2723` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_BOOTSTRAP_FLOW.md` |
| implementation | 6851 | `d85b40d0543d94fe56c083583b96fe3b5b747a5d7d3cdab6b22040ecd98f364f` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_EVENT_MODEL.md` |
| implementation | 7156 | `b3897e04801b6fdadf70c0ca46be579e3e64149eef40b74778fb4942d6cff3d7` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_MCP_API.md` |
| implementation | 6170 | `064075760bc1754597ec99fb26ebe6e2da158d189ce759dcde5513d0feba1955` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_ROLLOUT_PLAN.md` |
| implementation | 7107 | `08fa15295ebba24faba26ebf9bc1382a98abf7e5cc43dd212a5e87c10b001f96` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_RUNTIME_TREEVIEW.md` |
| implementation | 6012 | `6508565572db474845cf6804e65b1f39ea74a7cc4e61a018c8c4d577006ac74f` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_STORAGE_MODEL.md` |
| implementation | 1066 | `9323687eb34276fca1cf2f51e3acb7a27a3c521f4f243c2710b1f1b7757f4e44` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_SURFACE_ARCHITECTURE.md` |
| implementation | 931 | `05b5979edc2c61b1e0c7a74181388be38abd266388ee71cb8b817c720766fa7a` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/implementation/WORKSPACE_WEB_ARCHITECTURE.md` |
| integration | 838 | `81a8afacde971b4def6f8d652a2d5c9a5720a3bfb4a49e4c0869f6399ad4afd8` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/CVF_CLI_COMMAND_MAPPING.md` |
| integration | 755 | `e8d79b61d8b5de71ddb43154d413e6c8eca5ac83ed6a3cfeac9e02b357b7f282` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/CVF_CORE_ADAPTER_SPEC.md` |
| integration | 817 | `63880bfe47c0cff8ddb8244cd6f977703f73d7c8ee7d4a7d27fcdbe413ec0827` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/CVF_REPO_INTEGRATION_PLAN.md` |
| integration | 623 | `fc55ab1cbe18268fd163a21a805ee746ac538e12bb1a7fcc17f0ffa1921c76fa` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/IDE_AGENT_CONFIG_TEMPLATES.md` |
| integration | 472 | `9df1a95ad3e2eec5796c8bbfd0a7c04cb4fa70c467cf9b77a0db0a13e7e605f6` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/PRODUCTION_MCP_SERVER_SPEC.md` |
| integration | 337 | `f7507d234a21fce5121bdb425d419c94f4080b123333b4393a4bf2e19f0423fb` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/RELEASE_GATE_CHECKLIST.md` |
| integration | 507 | `f8bd5262a119c32cc9c77621ae85620415b1e932aa1a96244fa43f6316c48be2` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/integration/SECURITY_HARDENING_CHECKLIST.md` |
| root | 3476 | `c8f475d0462b8810728a279971590641bdd9e9749923d48114208631cd6c73c9` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/PACKAGE_MANIFEST.json` |
| root | 2876 | `a267edd4f9702daa1047034520f3e24b0c7321b17d1451a858b12a2845b7cd82` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/README.md` |
| reference_implementation | 148 | `2a9dc022288eec68c8adc3f5c2d77cfd93eb45477223415ab272bc45c7af1ddd` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/__init__.py` |
| reference_implementation | 3263 | `1afdcda276d3853d60772ee39fa1aa5f358904c6ec1aa9216ba942363dcb8e33` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/cli.py` |
| reference_implementation | 3288 | `6bdaf6e69f458d074b9e69f25294ee55cbfadce8ead6df7cf101d8740312fea8` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/core_binding.py` |
| reference_implementation | 1289 | `a3fb544ca36f4a45a9734030ec0ee656e551be58abaf6792c97db7a658cf16ea` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/cvf_core_adapter.py` |
| reference_implementation | 6307 | `d69eb2d5e469738894e528a7e190caf5b965d0bfe4c99a91b811d8a38bd58d36` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/mcp_like.py` |
| reference_implementation | 5507 | `e5ba05283f2559ddebd7589afa2a7e340004318714ae1635e29b7c24a43c33d6` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/mcp_stdio_server.py` |
| reference_implementation | 876 | `d58977359b9bfac0d98b36adbb4c0ac0574b403813e39e5b32a0340ee849d8ef` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/models.py` |
| reference_implementation | 25354 | `2aabff8942970ffe2a4e30907aada8c5e5370f599df9fcbe946cb5bb77f6b3a4` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/runtime.py` |
| reference_implementation | 2651 | `25c37135a1ddcb22e226c272b975661d101b6669c09cc0d78b1129f2b5fbea70` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/storage.py` |
| reference_implementation | 5198 | `b18513a85e5dad3e97b1563f9ed3c31a5d1ce46fc492344a49dac7a51ad17d73` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/cvf_workspace/surface_server.py` |
| reference_implementation | 1549 | `0f1f1afadbbaf0b32c9241fb8f62a2ed0b193a00e54ea8492c6649999571086e` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/demo_end_to_end.py` |
| reference_implementation | 2403 | `d5630e4d39364077302a797791959cccc059faaa9e4055e84a7ea03b8b9063ce` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/README.md` |
| reference_implementation | 1356 | `3bf3188b63ccf092b26311ba610315b5c01b113b507689357f43b38a408540f8` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/sample_bootstrap.py` |
| reference_implementation | 2868 | `9891f57baa65fc94f2ead8eb4d58560a80260c693b3e09f38ea6a44703d8f5af` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/workspace_mcp_stub.py` |
| reference_implementation | 14748 | `418a98be42d1b2f81ce4383167527bf90c6e175d2c8e087510a4adccd02aca72` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/reference_implementation/workspace_runtime.py` |
| runbooks | 1827 | `9dba4554ea0de055bc7086e6e13d093a4e01892f6f8dab21c45e4ef02a914274` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/runbooks/LOCAL_RUNNABLE_RUNBOOK.md` |
| runbooks | 680 | `5837bd55f7abd3cfca956a97c8f1c57d310720e135573ea8097761569bc139e0` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/runbooks/LOCAL_SURFACE_REFERENCE.md` |
| runbooks | 1078 | `308a11588bf4bab9e25631d321b10766bbce6b700281713e3140957f8921e992` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/runbooks/MCP_STDIO_REFERENCE.md` |
| schemas | 703 | `258b6ff15eb183953e71fe6a0861befee98025b2bbf71f365e3b39fcfdceea94` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/agent_state.schema.json` |
| schemas | 1417 | `be26bf5462e1fc8cfb93b81c0cc41548a85ca41479d0466e21d0e2e4dc42dd40` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/event.schema.json` |
| schemas | 729 | `ff55a289b47013d2244fa493e969f419d41535e16a32339f61e845515a290310` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/evidence_state.schema.json` |
| schemas | 1620 | `a24b4267421b89355f4798603bb1920ab95a72452418fc1a45f2bd3354b379f9` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/governance_state.schema.json` |
| schemas | 1301 | `7c322bc2bef2e649bbb8a4af1d7970cdbc295a861d8b48185f9012e57e167352` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/proposal.schema.json` |
| schemas | 993 | `1ee99385e7fe3cc5e61071fa4d48b698c9762270d0d75eb27e9122eaa1f68f22` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/receipt.schema.json` |
| schemas | 1494 | `4b74d469effcafe1d0cc2993e4479f4f9431cda3c62963084df860f07cb8a9b5` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/workflow_state.schema.json` |
| schemas | 1436 | `49a1392284661117c863dc849c95a38c9e7c9cb8d2413af9fd77503680f7c6f9` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/schemas/workspace_state.schema.json` |
| scripts | 2081 | `2409c7465ae73e8800a03ab73d3bf565bbf74b4cb3602aa88b8a8faaf2301a37` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/scripts/run_local_smoke_test.py` |
| templates | 442 | `605267faae96ca7e69f2b58a9c60b7ca8497edabeca7e0602301bf748fc6149e` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/templates/AGENT_BOOT_INSTRUCTION.md` |
| templates | 287 | `e842636962214795185cb4651aa601e2bb119a4d15b505e44de8b3eea210c0a7` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/templates/generic_mcp_config.example.json` |
| tests | 2232 | `79a214b42cc2d71c081b1532a1e92a9e5e7758fee83c3d703fa777c2dbe33983` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/AGENT_IMPLEMENTATION_GUARDRAILS.md` |
| tests | 913 | `906b41ba4f20f27c7056d0c4e06c91a30e9977310ae68a39e9b7297ace9151fc` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/INTEGRATION_READY_CHECKLIST.md` |
| tests | 1134 | `9d8d1a80647a0860cbf25d38f8355b9ba83e3baa2c0df92839d0fcbb2a1eff7e` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/INTEGRATION_SMOKE_TEST_RESULT.json` |
| tests | 462 | `b1ebea022bdaf043de3ee775b43dd017d53d163c4d98d99efb7dfc2839d4f72e` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/LOCAL_RUNNABLE_SMOKE_TEST.md` |
| tests | 422 | `251fc930658c3481a9565abac5160f6b532f4e5a8c79f192a7e76c76bdbddd42` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/LOCAL_RUNNABLE_SMOKE_TEST_RESULT.json` |
| tests | 190 | `1900be01745d5568c4040108938fc8b79a0b7eb6248a4805253578eecb41de6f` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/PRODUCTION_HANDOFF_SMOKE_RESULT.json` |
| tests | 2565 | `6d3142a8093e2b7372d6721a130f40dc10f046f0b00c8f5017f9fae8924b3b79` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/REFERENCE_EXECUTION_SMOKE_TEST.md` |
| tests | 2021 | `b57dda829cbf7995c7ea1985c4388c99f5f4e50e3675a75f6a1b3747063f7f38` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/REFERENCE_IMPLEMENTATION_TEST_PLAN.md` |
| tests | 1130 | `8fa27bb6c5d0eb5b772426d9d443b6ffb11f671a4e50a0ad04649b23892d9d38` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/SMOKE_TEST_RESULT.json` |
| tests | 3997 | `01bcddb6eb80d2dc4e020c138bc4a0f0a4bf634af6fb7013a3204c320f3cb943` | `CVF_WORKSPACE_LAYER_PRODUCTION_HANDOFF_PACKAGE/EXTENSIONS/CVF_WORKSPACE_LAYER/tests/WORKSPACE_LAYER_ACCEPTANCE_CHECKLIST.md` |

## Absorption Decision Matrix

| Package group | Accepted knowledge | Rejected or parked use | Required future gate |
|---|---|---|---|
| root | package scope and self-description | package status as CVF authority | fresh source verification |
| contracts | projection, proposal, receipt, and non-bypass vocabulary | direct contract adoption | fresh CVF contract or work order |
| implementation docs | design hints for future Local Workspace Runtime | implementation by implication | fresh GC-018 |
| integration docs | possible CLI/MCP/IDE bridge requirements | direct adapter mutation | source-verified implementation work order |
| schemas | useful state-shape comparison input | schema-as-runtime-authority | topology contract mapping |
| reference implementation | possible fixture and comparison source | raw code import | implementation-specific GC-018 |
| runbooks and templates | bootstrap and operator context | operational authority | CVF-owned runbook adaptation |
| tests and smoke results | sample expectation vocabulary | CVF proof | CVF local/live proof as applicable |

## Next-Roadmap Recommendation

The highest-value follow-on is a decision-first local workspace projection
read-model roadmap. It should map package event, receipt, proposal, and state
concepts onto existing CVF generated state and governed artifact surfaces
without creating an executable queue or MCP tool.

Runtime, MCP, CLI, IDE bridge, provider/live proof, and public-sync remain
parked until a later explicitly authorized roadmap.

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | root/folder lifecycle classification plus absorption map when retained |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_agent_absorption_table.py`; `governance/compat/check_foundation_storage_layout.py` |
| Owner surface | `docs/reference/agent_workspace/` |
| Disposition | ADAPT through governed CVF reference; BLOCK runtime use until fresh GC-018 |
| Claim boundary | no raw external package authority, runtime, MCP, provider, public-sync, or readiness claim |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | full non-cache package absorption inventory |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| actionEvidence | ACTION_EVIDENCE_PRESENT: full non-cache SHA-256 manifest and absorption matrix |
| invocationBoundary | local file inspection and governed markdown edit only |
| interceptionBoundary | N/A with reason: no runtime interception or provider route changed |
| claimLanguage | reference inventory only |
| forbiddenExpansion | no runtime, MCP, CLI, IDE bridge, provider/live, public-sync, resolver, adapter, or generated aggregate mutation beyond GC-051 corpus registry generation |
| executionBaseHead | `e83ad19e` |
| changedSetScope | reference inventory only |
| receiptEvidence | `CVF_RECEIPT_PRESENT`: local enumeration command output |
| excludedRuntime | runtime, MCP adapter, CLI adapter, IDE bridge, provider/live proof, public-sync |
| equivalenceDisposition | N/A with reason: no runtime equivalence claim |
| boundaryDecision | complete inventory is evidence, not implementation authority |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-27 full workspace-layer package inventory |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, python, rg, apply_patch |
| Target paths | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` |
| Allowed scope source | operator authorized CVF foundation absorption T0 through T4 |
| Before status evidence | HEAD `e83ad19e` |
| After status evidence | inventory reference pending material commit |
| Diff evidence | `git diff --name-status e83ad19e..HEAD` |
| Approval boundary | package inventory and absorption decision only |
| Claim boundary | no raw package import, runtime proof, MCP/CLI/IDE implementation, public-sync, or production readiness |
| Agent type | Codex implementer/closer |
| Invocation ID | `workspace-layer-full-package-inventory-2026-06-27` |
| Expected manifest | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` |
| Actual changed set | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Machine Closure Package

| Closure item | Required artifact/path | Machine-readable evidence | Final status |
|---|---|---|---|
| Work order status | `docs/work_orders/CVF_AGENT_WORK_ORDER_WLFA_T0_T4_FULL_PACKAGE_ABSORPTION_FOUNDATION_FOR_CODEX_2026-06-27.md` | `Status: CLOSED_PASS_BOUNDED` | PASS |
| Completion or reviewer artifact | `docs/reviews/CVF_WLFA_T0_T4_FULL_PACKAGE_ABSORPTION_FOUNDATION_COMPLETION_2026-06-27.md` | `Status: CLOSED_PASS_BOUNDED` | PASS |
| Roadmap state | `docs/roadmaps/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_FOUNDATION_ROADMAP_2026-06-27.md` | `Status: ROADMAP_CLOSED_PASS_BOUNDED` | PASS |
| Registry JSON | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` | `id=workspace-layer-production-handoff-package` | PASS |
| Registry Markdown | BLOCKED with reason: no registry Markdown edit authorized | N/A | BLOCKED with reason: no registry Markdown edit authorized |
| External evidence digest | this file | `nonCacheFileCount=68` | PASS |

## Acceptance Receipt Assertion Matrix

| Assertion | Receipt source | Disposition |
|---|---|---|
| Non-cache inventory count is recorded | Inventory Summary | PASS |
| Digest manifest is recorded | Full Non-Cache SHA-256 Manifest | PASS |
| Absorption dispositions are recorded | Absorption Decision Matrix | PASS |
| Implementation remains out of scope | Claim Boundary | PASS |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance reference inventory. No public-sync batch is
authorized.

## Claim Boundary

This inventory is a governed reference artifact. It does not authorize raw
package import, runtime implementation, MCP or CLI adapter changes, IDE bridge,
provider/live proof, public-sync, registry edit beyond GC-051 corpus registry
generation, generated aggregate mutation beyond GC-051 corpus registry generation,
or production/public readiness.
