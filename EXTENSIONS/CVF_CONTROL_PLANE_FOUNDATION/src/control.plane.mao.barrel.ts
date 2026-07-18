// CVF MAO-OA-T1 - Control Plane MAO Domain Barrel
//
// Domain barrel forwarding the existing MAO-T2 role resolver and the new
// MAO-OA-T1 pure orchestration composition contract through the
// control-plane package root. This barrel does not add a second resolver,
// a new risk policy, or any runtime/provider/storage owner - it only
// re-exports the two existing local module owners so they are discoverable
// from the package entrypoint (src/index.ts).

export type {
  MaoRoleResolutionDecision,
  MaoRoleResolutionReasonCode,
  MaoRoleResolutionReceipt,
  MaoRoleResolverInput,
} from "./mao/role.resolver.contract";

export { resolveRole } from "./mao/role.resolver.contract";

export type {
  MaoOrchestrationCompositionInput,
  MaoOrchestrationCompositionResult,
} from "./mao/orchestration.composition.contract";

export { composeOrchestrationPlan } from "./mao/orchestration.composition.contract";
