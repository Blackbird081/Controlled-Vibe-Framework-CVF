/**
 * CVF Phase 1.I — Role Axis Adapter Map
 * =======================================
 * Classifies all 20 AgentRole/ActorRole/CVFRole surfaces from the Phase 1.0
 * drift inventory to their confirmed role axis and disposition.
 *
 * Source inventory: docs/reviews/CVF_17_05_STABILIZATION_DRIFT_INVENTORY_2026-05-17.md
 * Alias table:      docs/reviews/CVF_17_05_KERNEL_TERMINOLOGY_ALIAS_TABLE_2026-05-17.md
 * Authorized by:    docs/baselines/CVF_GC018_PHASE_1I_IDENTITY_ROLE_TAXONOMY_2026-05-18.md
 *
 * SCOPE: Classification and axis assignment only. No existing code modified.
 *
 * Note on node_modules entries: 11 of the 20 inventory hits were lib.dom.d.ts
 * false positives from TypeScript's DOM type library. These are classified as
 * false-positive / legacy_reference — not migration targets.
 */

import type { RoleAxisAdapterMeta } from './role-axis.contract';

export const ROLE_AXIS_ADAPTER_MAP: ReadonlyArray<RoleAxisAdapterMeta> = [
  // ── Agent Function axis — canonical contract surfaces ─────────────────────

  {
    adapterId: 'cpf-agent-definition-boundary-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts',
    primaryAxis: 'agent-function',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Defines AgentRole: executor | observer | orchestrator | reviewer | coordinator
  },
  {
    adapterId: 'cpf-design-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.contract.ts',
    primaryAxis: 'agent-function',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Defines DesignAgentRole — domain-scoped subtype; align to AgentFunctionRole in Phase 2.B',
  },
  {
    adapterId: 'cpf-orchestration-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/orchestration.contract.ts',
    primaryAxis: 'agent-function',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Consumes DesignAgentRole — adapter target in Phase 2.B after axis alignment
  },
  {
    adapterId: 'cpf-continuity-checkpoint-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/continuity.checkpoint.contract.ts',
    primaryAxis: 'agent-function',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── Agent Function axis — barrel adapter surfaces ─────────────────────────

  {
    adapterId: 'cpf-continuation-barrel',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.continuation.barrel.ts',
    primaryAxis: 'agent-function',
    disposition: 'adapter',
    hasConformanceStub: false,
    migrationNote: 'Barrel re-export; no axis type introduced. Phase 2.B may add typed axis re-exports.',
  },
  {
    adapterId: 'cpf-coordination-barrel',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.coordination.barrel.ts',
    primaryAxis: 'agent-function',
    disposition: 'adapter',
    hasConformanceStub: false,
  },
  {
    adapterId: 'cpf-boardroom-barrel',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.design.boardroom.barrel.ts',
    primaryAxis: 'agent-function',
    disposition: 'adapter',
    hasConformanceStub: false,
  },

  // ── Agent Function axis — legacy reference / test fixtures ────────────────

  {
    adapterId: 'cpf-test-batch-contract-fixtures',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts',
    primaryAxis: 'agent-function',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'cpf-test-index',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts',
    primaryAxis: 'agent-function',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'cpf-test-orchestration-batch',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/orchestration.batch.contract.test.ts',
    primaryAxis: 'agent-function',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },

  // ── False positives — node_modules TypeScript lib.dom.d.ts ───────────────
  // These matched the rg pattern but contain no CVF role definitions.
  // They are TypeScript DOM type library stubs — not migration targets.

  {
    adapterId: 'agent-definition-node-modules-dom',
    domain: 'CVF_AGENT_DEFINITION',
    sourcePath: 'EXTENSIONS/CVF_AGENT_DEFINITION/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'agent-definition-src-index',
    domain: 'CVF_AGENT_DEFINITION',
    sourcePath: 'EXTENSIONS/CVF_AGENT_DEFINITION/src/index.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'Matched pattern but no CVF AgentRole/CVFRole/ActorRole found in file',
  },
  {
    adapterId: 'agent-ledger-node-modules-dom',
    domain: 'CVF_AGENT_LEDGER',
    sourcePath: 'EXTENSIONS/CVF_AGENT_LEDGER/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'cpf-node-modules-dom',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-intent-validation-node-modules-dom',
    domain: 'CVF_ECO_v1.0_INTENT_VALIDATION',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-nl-policy-node-modules-dom',
    domain: 'CVF_ECO_v1.1_NL_POLICY',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.1_NL_POLICY/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-llm-risk-engine-node-modules-dom',
    domain: 'CVF_ECO_v1.2_LLM_RISK_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.2_LLM_RISK_ENGINE/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-domain-guards-node-modules-dom',
    domain: 'CVF_ECO_v1.3_DOMAIN_GUARDS',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.3_DOMAIN_GUARDS/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-rag-pipeline-node-modules-dom',
    domain: 'CVF_ECO_v1.4_RAG_PIPELINE',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
  {
    adapterId: 'eco-agent-guard-sdk-node-modules-dom',
    domain: 'CVF_ECO_v2.0_AGENT_GUARD_SDK',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/node_modules/typescript/lib/lib.dom.d.ts',
    primaryAxis: 'false-positive',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'TypeScript lib — not a CVF role surface',
  },
] as const;
