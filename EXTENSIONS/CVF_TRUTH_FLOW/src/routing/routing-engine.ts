/**
 * Deterministic recipient/role/task/phase routing scope resolution
 * (T2 DistributionPackage field minimums; T5 Required Invariant 6). This
 * module performs no trust evaluation and holds no Kernel authority; it
 * only validates that a routing request names a complete scope before the
 * caller passes it to DistributionEngine.create().
 */
export interface RoutingScope {
  recipient: string;
  role: string;
  task: string;
  phase: string;
}

export type RoutingRejectionReason = "INCOMPLETE_ROUTING_SCOPE";

export interface RoutingScopeResult {
  valid: boolean;
  reasons: RoutingRejectionReason[];
}

export function validateRoutingScope(scope: RoutingScope): RoutingScopeResult {
  const missing = [scope.recipient, scope.role, scope.task, scope.phase].some(
    (value) => value.trim().length === 0,
  );
  if (missing) {
    return { valid: false, reasons: ["INCOMPLETE_ROUTING_SCOPE"] };
  }
  return { valid: true, reasons: [] };
}
