/**
 * CVF Phase 1.P — PolicyEngine Adapter Map
 * ==========================================
 * Maps all 13 PolicyEngine surfaces from the Phase 1.0 drift inventory to
 * their confirmed disposition and migration path.
 *
 * Source inventory: docs/reviews/CVF_17_05_STABILIZATION_DRIFT_INVENTORY_2026-05-17.md
 * Authorized by:   docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 *
 * SCOPE: Classification and adapter planning only. No existing code modified.
 */

import type { PolicyEngineAdapterMeta } from './policy-decision.contract';

export const POLICY_ENGINE_ADAPTER_MAP: ReadonlyArray<PolicyEngineAdapterMeta> = [
  // ── Canonical contract surfaces (Python governance path) ──────────────────
  {
    adapterId: 'governance-engine-policy-engine-py',
    domain: 'CVF_v1.6.1_GOVERNANCE_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/core/policy_engine.py',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Python canonical path — define Python abstract base class in Phase 1.P
  },
  {
    adapterId: 'governance-engine-server-py',
    domain: 'CVF_v1.6.1_GOVERNANCE_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/api/server.py',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Policy API surface — wraps policy_engine.py; canonical for HTTP governance path
  },
  {
    adapterId: 'governance-engine-orchestrator-py',
    domain: 'CVF_v1.6.1_GOVERNANCE_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/core_orchestrator.py',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Orchestrates policy decisions — canonical for Python governance orchestration
  },
  {
    adapterId: 'governance-engine-main-py',
    domain: 'CVF_v1.6.1_GOVERNANCE_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/main.py',
    disposition: 'canonical_contract',
    hasConformanceStub: false,
    // Entry point — canonical but not a policy surface requiring conformance stub
  },

  // ── Adapter surfaces (domain-specific, consume canonical contract) ─────────
  {
    adapterId: 'model-gateway-index',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Gateway barrel — re-exports routing policy; migrates to PolicyEngine adapter
  },
  {
    adapterId: 'model-gateway-routing-policy',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/src/routing-policy.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Routing policy — domain adapter; must implement PolicyEngine interface
  },
  {
    adapterId: 'external-integration-certification-state-machine',
    domain: 'CVF_v1.2.1_EXTERNAL_INTEGRATION',
    sourcePath: 'EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/certification/certification.state.machine.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Certification state machine — policy adapter for certification domain
  },
  {
    adapterId: 'external-integration-policy-decision-engine',
    domain: 'CVF_v1.2.1_EXTERNAL_INTEGRATION',
    sourcePath: 'EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/policies/policy.decision.engine.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // External integration policy — domain-specific; implements PolicyEngine
  },

  // ── Legacy reference surfaces (test fixtures, not production) ─────────────
  {
    adapterId: 'model-gateway-test-integration',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/tests/model-gateway-runtime.integration.test.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    // Test fixture — no migration required
  },
  {
    adapterId: 'model-gateway-test-routing-policy',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/tests/routing-policy.test.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'starter-template-policy-engine-service',
    domain: 'CVF_STARTER_TEMPLATE_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/src/cvf/policy-engine.service.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    // Illustrative starter template — not production authority; mark legacy_reference
  },
  {
    adapterId: 'external-integration-test-pipeline',
    domain: 'CVF_v1.2.1_EXTERNAL_INTEGRATION',
    sourcePath: 'EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/tests/v1.2.1.pipeline.test.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'external-integration-test-main',
    domain: 'CVF_v1.2.1_EXTERNAL_INTEGRATION',
    sourcePath: 'EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/tests/v1.2.1.test.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
] as const;
