/**
 * CVF Phase 1.P — RiskEngine / RiskScorer Adapter Map
 * =====================================================
 * Maps all 26 RiskEngine/RiskScorer surfaces from the Phase 1.0 drift
 * inventory to their confirmed disposition and migration path.
 *
 * Source inventory: docs/reviews/CVF_17_05_STABILIZATION_DRIFT_INVENTORY_2026-05-17.md
 * Authorized by:   docs/baselines/CVF_GC018_PHASE_1P_POLICY_RISK_GUARD_CONVERGENCE_2026-05-18.md
 *
 * SCOPE: Classification and adapter planning only. No existing code modified.
 */

import type { RiskEngineAdapterMeta } from './risk-engine.contract';

export const RISK_ENGINE_ADAPTER_MAP: ReadonlyArray<RiskEngineAdapterMeta> = [
  // ── Canonical contract surfaces ────────────────────────────────────────────
  {
    adapterId: 'eco-llm-risk-engine-scorer',
    domain: 'CVF_ECO_v1.2_LLM_RISK_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.2_LLM_RISK_ENGINE/src/risk.scorer.ts',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Primary risk scorer for ECO risk domain — canonical for LLM risk assessment
  },
  {
    adapterId: 'safety-runtime-risk-engine',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/policy/risk.engine.ts',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Safety runtime risk engine — canonical for safety domain risk assessment
  },
  {
    adapterId: 'safety-runtime-risk-detector',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_detector.ts',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Contamination guard risk detector — canonical detection surface
  },
  {
    adapterId: 'safety-runtime-risk-evolution',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/internal_ledger/risk_evolution.ts',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Risk evolution ledger — canonical for tracking risk state changes
  },
  {
    adapterId: 'safety-runtime-refusal-risk',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/04_refusal_router/refusal.risk.ts',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    // Refusal router risk surface — canonical for refusal risk classification
  },

  // ── Adapter surfaces ───────────────────────────────────────────────────────
  {
    adapterId: 'eco-llm-risk-aggregator',
    domain: 'CVF_ECO_v1.2_LLM_RISK_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_ECO_v1.2_LLM_RISK_ENGINE/src/risk.aggregator.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Aggregates multiple risk signals — adapter consuming canonical RiskEngine output
  },
  {
    adapterId: 'eco-agent-guard-sdk-risk-module',
    domain: 'CVF_ECO_v2.0_AGENT_GUARD_SDK',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/src/risk.module.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'mcp-server-risk-gate-guard',
    domain: 'CVF_ECO_v2.5_MCP_SERVER',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards/risk-gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'guard-contract-risk-gate-guard',
    domain: 'CVF_GUARD_CONTRACT',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/risk-gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Risk gate guard in canonical package — adapter over RiskEngine contract
  },
  {
    adapterId: 'phase-governance-risk-gate-guard',
    domain: 'CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL',
    sourcePath: 'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/risk.gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'external-integration-risk-scoring-hook',
    domain: 'CVF_v1.2.1_EXTERNAL_INTEGRATION',
    sourcePath: 'EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/governance_hooks/risk.scoring.hook.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'skill-governance-risk-scorer',
    domain: 'CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE',
    sourcePath: 'EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/skill_system/governance/risk.scorer.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Skill governance domain risk scorer — adapter consuming risk engine output
  },
  {
    adapterId: 'safety-runtime-risk-propagation-engine',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_propagation_engine.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Bounded domain adapter within contamination guard kernel
  },
  {
    adapterId: 'safety-runtime-contamination-risk-scorer',
    domain: 'CVF_v1.7.1_SAFETY_RUNTIME',
    sourcePath: 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture/kernel/03_contamination_guard/risk_scorer.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'safety-hardening-risk-lock',
    domain: 'CVF_v1.8_SAFETY_HARDENING',
    sourcePath: 'EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/core/risk/risk.lock.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
  },
  {
    adapterId: 'safety-hardening-risk-scorer',
    domain: 'CVF_v1.8_SAFETY_HARDENING',
    sourcePath: 'EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/core/risk/risk.scorer.ts',
    disposition: 'adapter',
    hasConformanceStub: true,
    // Inherits from safety runtime domain — adapter in hardening layer
  },
  {
    adapterId: 'agent-platform-risk-gate-guard-node-modules',
    domain: 'CVF_v1.6_AGENT_PLATFORM',
    sourcePath: 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/node_modules/cvf-guard-contract/src/guards/risk-gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: false,
    // node_modules copy — not a manual migration target; npm install manages it
  },
  {
    adapterId: 'plane-facades-risk-gate-guard-node-modules',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-guard-contract/src/guards/risk-gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: false,
  },
  {
    adapterId: 'mcp-server-risk-gate-guard-node-modules',
    domain: 'CVF_ECO_v2.5_MCP_SERVER',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/node_modules/cvf-guard-contract/src/guards/risk-gate.guard.ts',
    disposition: 'adapter',
    hasConformanceStub: false,
  },

  // ── Legacy reference surfaces (templates, dist, test fixtures) ─────────────
  {
    adapterId: 'starter-template-error-types',
    domain: 'CVF_STARTER_TEMPLATE_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/src/core/error.types.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'starter-template-risk-classifier-service',
    domain: 'CVF_STARTER_TEMPLATE_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/src/cvf/risk-classifier.service.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'starter-template-risk-escalation-service',
    domain: 'CVF_STARTER_TEMPLATE_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/src/cvf/risk-escalation.service.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'toolkit-reference-errors',
    domain: 'CVF_TOOLKIT_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_TOOLKIT_REFERENCE/02_TOOLKIT_CORE/errors.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'toolkit-reference-domain-risk-profile-template',
    domain: 'CVF_TOOLKIT_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_TOOLKIT_REFERENCE/04_EXTENSION_LAYER/_extension.template/domain.risk.profile.template.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'toolkit-reference-financial-risk-profile',
    domain: 'CVF_TOOLKIT_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_TOOLKIT_REFERENCE/04_EXTENSION_LAYER/financial.extension/financial.risk.profile.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'toolkit-reference-financial-risk-profile-dist',
    domain: 'CVF_TOOLKIT_REFERENCE',
    sourcePath: 'EXTENSIONS/CVF_TOOLKIT_REFERENCE/dist/04_EXTENSION_LAYER/financial.extension/financial.risk.profile.d.ts',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    // Dist artifact — not a migration target
  },
] as const;
