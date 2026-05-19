/**
 * CVF Phase 1.R — Receipt Envelope Adapter Map
 * ==============================================
 * Classifies all 27 Receipt/Ledger/AuditLog surfaces from the Phase 1.0
 * drift inventory to their confirmed payload type and disposition.
 *
 * Source inventory: docs/reviews/CVF_17_05_STABILIZATION_DRIFT_INVENTORY_2026-05-17.md
 * Authorized by:    docs/baselines/CVF_GC018_PHASE_1R_RECEIPT_ENVELOPE_2026-05-18.md
 *
 * SCOPE: Classification and payload type assignment only. No existing code modified.
 */

import type { ReceiptEnvelopeAdapterMeta } from './receipt-envelope.contract';

export const RECEIPT_ENVELOPE_ADAPTER_MAP: ReadonlyArray<ReceiptEnvelopeAdapterMeta> = [
  // ── CVF_CONTROL_PLANE_FOUNDATION canonical contract surfaces ──────────────

  {
    adapterId: 'cpf-agent-governed-session-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.governed.session.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
    migrationNote: 'Phase 2.B: wrap existing session contract output in Receipt<GovernanceLedgerReceiptPayload>',
  },
  {
    adapterId: 'cpf-consumer-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/consumer.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'cpf-design-consumer-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'cpf-gateway-consumer-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.contract.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'cpf-packaging-contract',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/packaging.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── CVF_EXECUTION_PLANE_FOUNDATION canonical contract surfaces ────────────

  {
    adapterId: 'epf-execution-bridge-consumer-batch-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.batch.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'epf-execution-bridge-consumer-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'epf-execution-observer-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.observer.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'epf-execution-pipeline-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.pipeline.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'epf-mcp-business-adapter-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp.business.adapter.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },
  {
    adapterId: 'epf-tool-call-trace-contract',
    domain: 'CVF_EXECUTION_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/tool.call.trace.contract.ts',
    payloadType: 'ExecutionBridgeReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── CVF_LEARNING_PLANE_FOUNDATION canonical contract surface ──────────────

  {
    adapterId: 'lpf-controlled-memory-gateway-contract',
    domain: 'CVF_LEARNING_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts',
    payloadType: 'ControlledMemoryReceiptPayload',
    disposition: 'canonical_contract',
    hasConformanceStub: true,
  },

  // ── CVF_MODEL_GATEWAY adapter surfaces ────────────────────────────────────

  {
    adapterId: 'model-gateway-gateway-receipt',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/src/gateway-receipt.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'adapter',
    hasConformanceStub: true,
    migrationNote: 'Primary gateway receipt surface — Phase 2.B: wrap in Receipt<GatewayReceiptPayload>',
  },
  {
    adapterId: 'model-gateway-index-receipt',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/src/index.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'adapter',
    hasConformanceStub: false,
    migrationNote: 'Barrel re-export — no independent receipt surface; tracks gateway-receipt.ts',
  },

  // ── CVF_GUARD_CONTRACT adapter surface ────────────────────────────────────

  {
    adapterId: 'guard-contract-types',
    domain: 'CVF_GUARD_CONTRACT',
    sourcePath: 'EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'adapter',
    hasConformanceStub: false,
    migrationNote: 'Guard audit/receipt types — Phase 2.B: align audit entry to receipt envelope',
  },

  // ── CVF_CONTROL_PLANE_FOUNDATION adapter surface ──────────────────────────

  {
    adapterId: 'cpf-knowledge-vault-intake-types',
    domain: 'CVF_CONTROL_PLANE_FOUNDATION',
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.vault.intake.types.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'adapter',
    hasConformanceStub: false,
    migrationNote: 'Intake types — not a primary receipt surface; classify as adapter for Phase 2.B review',
  },

  // ── CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL adapter surface ─────────────────

  {
    adapterId: 'phase-governance-extension-bridge',
    domain: 'CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL',
    sourcePath: 'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/wiring/extension.bridge.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'adapter',
    hasConformanceStub: false,
  },

  // ── node_modules copies — not manual migration targets ────────────────────

  {
    adapterId: 'mcp-server-node-modules-guard-types',
    domain: 'CVF_ECO_v2.5_MCP_SERVER',
    sourcePath: 'EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/node_modules/cvf-guard-contract/src/types.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target; npm install manages it',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-session',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/agent.governed.session.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-consumer',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/consumer.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-design-consumer',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/design.consumer.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-gateway-consumer',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/gateway.consumer.contract.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-knowledge-vault',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/knowledge.vault.intake.types.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-cpf-packaging',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-control-plane-foundation/src/packaging.contract.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },
  {
    adapterId: 'plane-facades-node-modules-guard-types',
    domain: 'CVF_PLANE_FACADES',
    sourcePath: 'EXTENSIONS/CVF_PLANE_FACADES/node_modules/cvf-guard-contract/src/types.ts',
    payloadType: 'GovernanceLedgerReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
    migrationNote: 'node_modules copy — not a manual migration target',
  },

  // ── Test fixtures ─────────────────────────────────────────────────────────

  {
    adapterId: 'model-gateway-test-gateway-receipt',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/tests/gateway-receipt.test.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
  {
    adapterId: 'model-gateway-test-integration-receipt',
    domain: 'CVF_MODEL_GATEWAY',
    sourcePath: 'EXTENSIONS/CVF_MODEL_GATEWAY/tests/model-gateway-runtime.integration.test.ts',
    payloadType: 'GatewayReceiptPayload',
    disposition: 'legacy_reference',
    hasConformanceStub: false,
  },
] as const;
