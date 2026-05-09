/**
 * GateResult
 *
 * Represents the outcome of a phase gate validation.
 * Includes CVF canonical risk level (R0–R3) mapping.
 */

export type GateStatus =
  | "APPROVED"
  | "REJECTED";

/**
 * CVF canonical risk levels:
 * R0 = No risk (all checks pass)
 * R1 = Low risk (1 non-critical check failed)
 * R2 = Medium risk (2-3 checks failed)
 * R3 = Critical risk (4+ checks failed or critical check failed)
 */
export type CVFRiskLevel = "R0" | "R1" | "R2" | "R3";

export interface GateCheckResult {
  rule: string;
  passed: boolean;
  critical?: boolean;
  message?: string;
}

export interface GateResult {
  component: string;
  status: GateStatus;
  riskLevel: CVFRiskLevel;
  checks: GateCheckResult[];
  timestamp: number;
}

function deriveRiskLevel(checks: GateCheckResult[]): CVFRiskLevel {
  const failed = checks.filter(c => !c.passed);
  const criticalFailed = failed.some(c => c.critical);

  if (failed.length === 0) return "R0";
  if (criticalFailed || failed.length >= 4) return "R3";
  if (failed.length >= 2) return "R2";
  return "R1";
}

export function createGateResult(
  component: string,
  checks: GateCheckResult[]
): GateResult {

  const failed = checks.some(c => !c.passed);
  const riskLevel = deriveRiskLevel(checks);

  return {
    component,
    status: failed ? "REJECTED" : "APPROVED",
    riskLevel,
    checks,
    timestamp: Date.now()
  };
}