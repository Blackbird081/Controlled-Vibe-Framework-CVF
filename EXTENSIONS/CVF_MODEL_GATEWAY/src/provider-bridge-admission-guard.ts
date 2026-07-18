/**
 * Provider Bridge Admission Guard
 *
 * Deterministic, provider-agnostic bridge admission boundary for P5-C.
 * Consumes AdapterAdmissionRecord from P5-A and returns a BridgeAdmissionGuardResult.
 * This module is purely record-based: it reads the AdapterAdmissionRecord only.
 * No adapter invocation, no registry mutation, no credential access, no network IO.
 *
 * Contract version: cvf.bridgeAdmissionBoundary.p5c.v1
 */

import type { AdapterAdmissionRecord, AdapterAdmissionStatus } from "./provider-adapter-admission";

export const BRIDGE_ADMISSION_BOUNDARY_VERSION =
  "cvf.bridgeAdmissionBoundary.p5c.v1" as const;

export type BridgeAdmissionVerdict = "pass" | "block";

export interface BridgeAdmissionGuardResult {
  verdict: BridgeAdmissionVerdict;
  admissionStatus: AdapterAdmissionStatus;
  reasonCodes: readonly string[];
  reasons: readonly string[];
}

/**
 * checkBridgeAdmission
 *
 * Returns verdict="pass" only when record.status === "admitted".
 * All other statuses ("blocked", "needs_operator_authorization") produce verdict="block".
 * The function is pure and deterministic: same input always produces same output.
 */
export function checkBridgeAdmission(
  record: AdapterAdmissionRecord,
): BridgeAdmissionGuardResult {
  if (record.status === "admitted") {
    return {
      verdict: "pass",
      admissionStatus: record.status,
      reasonCodes: [],
      reasons: [],
    };
  }
  const reasonCodes: readonly string[] = record.reasonCodes.length > 0
    ? record.reasonCodes
    : ["admission_not_admitted"];
  const reasons: readonly string[] = record.reasons.length > 0
    ? record.reasons
    : [`bridge_admission_blocked:status=${record.status}`];
  return {
    verdict: "block",
    admissionStatus: record.status,
    reasonCodes,
    reasons,
  };
}
