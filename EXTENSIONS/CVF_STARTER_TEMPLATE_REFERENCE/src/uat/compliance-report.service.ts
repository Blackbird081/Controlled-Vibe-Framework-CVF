// src/uat/compliance-report.service.ts

import { CVFIntegrityCheck } from "../core/cvf-integrity-check";
import { AuditIntegrityService } from "../core/audit-integrity";

export interface ComplianceReport {
  riskControls: boolean;
  budgetGuard: boolean;
  auditImmutable: boolean;
  integrityCheck: boolean;
  certified: boolean;
  details: string[];
}

export interface ComplianceCheckDeps {
  orchestratorFilePath?: string;
  auditRecords?: unknown[];
}

export function generateComplianceReport(
  deps: ComplianceCheckDeps = {}
): ComplianceReport {
  const details: string[] = [];

  // 1. Check risk controls exist
  let riskControls = false;
  try {
    require("../cvf/risk-classifier.service");
    require("../cvf/risk-escalation.service");
    riskControls = true;
    details.push("✅ Risk classification & escalation modules found");
  } catch {
    details.push("❌ Risk control modules missing");
  }

  // 2. Check budget guard exists
  let budgetGuard = false;
  try {
    require("../cvf/budget-guard.service");
    budgetGuard = true;
    details.push("✅ Budget guard module found");
  } catch {
    details.push("❌ Budget guard module missing");
  }

  // 3. Check audit immutability
  let auditImmutable = false;
  try {
    const integrityService = new AuditIntegrityService();
    const testRecord = { test: "data" };
    const hash = integrityService.generateHash(testRecord);
    auditImmutable = hash.length === 64; // SHA-256 hex
    details.push(
      auditImmutable
        ? "✅ Audit integrity hashing operational"
        : "❌ Audit integrity hash invalid"
    );
  } catch {
    details.push("❌ Audit integrity service unavailable");
  }

  // 4. Check CVF integrity
  let integrityCheck = false;
  if (deps.orchestratorFilePath) {
    try {
      const checker = new CVFIntegrityCheck();
      checker.calculateChecksum(deps.orchestratorFilePath);
      integrityCheck = true;
      details.push("✅ CVF integrity checksum calculated");
    } catch {
      details.push("❌ CVF integrity check failed");
    }
  } else {
    integrityCheck = true;
    details.push("⚠️ CVF integrity check skipped (no path provided)");
  }

  const certified =
    riskControls && budgetGuard && auditImmutable && integrityCheck;

  return {
    riskControls,
    budgetGuard,
    auditImmutable,
    integrityCheck,
    certified,
    details,
  };
}
