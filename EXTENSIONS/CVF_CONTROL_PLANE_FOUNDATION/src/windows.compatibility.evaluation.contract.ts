import type { ExternalAssetIntakeValidationResult } from "./external.asset.intake.profile.contract";

export type WindowsCompatibilityClassification =
  | "WINDOWS_NATIVE"
  | "COMPATIBLE"
  | "REQUIRES_REFACTOR"
  | "REJECTED_FOR_WINDOWS_TARGET";

export interface WindowsCompatibilityEvaluationRequest {
  intakeValidation: ExternalAssetIntakeValidationResult;
  governanceFitPassed?: boolean;
  existingIntakePolicyPassed?: boolean;
  commandsValidated?: boolean;
  unsupportedOperatorsRemoved?: boolean;
  exitCodeHandlingExplicit?: boolean;
  deterministicExecution?: boolean;
  w7RecordsGeneratable?: boolean;
  guardPolicyCompatible?: boolean;
  noUnauthorizedAccessPath?: boolean;
  scopeBoundedCommands?: boolean;
  sandboxOverclaimPresent?: boolean;
}

export interface WindowsCompatibilityEvaluationCriteria {
  executionEnvironmentDeclared: boolean;
  compatibleWithWindowsTarget: boolean;
  powershellSupported: boolean;
  correctScriptFormatDeclared: boolean;
  noUndeclaredBashDependency: boolean;
  commandsValidatedForDeclaredShell: boolean;
  unsupportedOperatorsRemovedOrNormalized: boolean;
  exitCodeHandlingExplicit: boolean;
  deterministicExecution: boolean;
  existingIntakeGatesPassed: boolean;
  w7RecordsGeneratable: boolean;
  guardPolicyCompatible: boolean;
  noSandboxOverclaim: boolean;
  commandsScopeBounded: boolean;
  noUnauthorizedAccessPath: boolean;
}

export interface WindowsCompatibilityEvaluationResult {
  targetOs: "windows";
  targetShell: "powershell";
  classification: WindowsCompatibilityClassification;
  score: number;
  passedCriteria: number;
  totalCriteria: number;
  criteria: WindowsCompatibilityEvaluationCriteria;
  blockers: string[];
  notes: string[];
}

function hasIssue(
  validation: ExternalAssetIntakeValidationResult,
  field: string,
): boolean {
  return validation.issues.some((issue) => issue.field === field);
}

function countPassed(criteria: WindowsCompatibilityEvaluationCriteria): number {
  return Object.values(criteria).filter(Boolean).length;
}

function classify(score: number): WindowsCompatibilityClassification {
  if (score >= 90) {
    return "WINDOWS_NATIVE";
  }

  if (score >= 70) {
    return "COMPATIBLE";
  }

  if (score >= 50) {
    return "REQUIRES_REFACTOR";
  }

  return "REJECTED_FOR_WINDOWS_TARGET";
}

function classificationRank(
  classification: WindowsCompatibilityClassification,
): number {
  switch (classification) {
    case "WINDOWS_NATIVE":
      return 3;
    case "COMPATIBLE":
      return 2;
    case "REQUIRES_REFACTOR":
      return 1;
    case "REJECTED_FOR_WINDOWS_TARGET":
      return 0;
  }
}

function applyClassificationCap(
  current: WindowsCompatibilityClassification,
  ceiling: WindowsCompatibilityClassification,
): WindowsCompatibilityClassification {
  return classificationRank(current) <= classificationRank(ceiling)
    ? current
    : ceiling;
}

export class WindowsCompatibilityEvaluationContract {
  evaluate(
    request: WindowsCompatibilityEvaluationRequest,
  ): WindowsCompatibilityEvaluationResult {
    const profile = request.intakeValidation.normalizedProfile;
    const environment = profile.execution_environment;
    const executionEnvironmentMissing = hasIssue(
      request.intakeValidation,
      "execution_environment",
    );

    const criteria: WindowsCompatibilityEvaluationCriteria = {
      executionEnvironmentDeclared: environment !== undefined,
      compatibleWithWindowsTarget:
        environment?.os === "windows" ||
        environment?.compatibility === "cross-platform",
      powershellSupported:
        environment?.shell === "powershell" ||
        (environment?.os === "windows" &&
          environment?.compatibility === "cross-platform"),
      correctScriptFormatDeclared:
        environment?.script_type === "ps1" ||
        environment?.script_type === "cmd" ||
        environment?.script_type === "bat",
      noUndeclaredBashDependency:
        !executionEnvironmentMissing &&
        environment?.shell !== "bash" &&
        environment?.shell !== "zsh" &&
        environment?.shell !== "sh",
      commandsValidatedForDeclaredShell: request.commandsValidated === true,
      unsupportedOperatorsRemovedOrNormalized:
        request.unsupportedOperatorsRemoved === true,
      exitCodeHandlingExplicit: request.exitCodeHandlingExplicit === true,
      deterministicExecution: request.deterministicExecution === true,
      existingIntakeGatesPassed:
        request.governanceFitPassed !== false &&
        request.existingIntakePolicyPassed !== false &&
        request.intakeValidation.valid,
      w7RecordsGeneratable: request.w7RecordsGeneratable !== false,
      guardPolicyCompatible: request.guardPolicyCompatible !== false,
      noSandboxOverclaim: request.sandboxOverclaimPresent !== true,
      commandsScopeBounded: request.scopeBoundedCommands !== false,
      noUnauthorizedAccessPath: request.noUnauthorizedAccessPath !== false,
    };

    const passedCriteria = countPassed(criteria);
    const totalCriteria = Object.keys(criteria).length;
    let score = Math.round((passedCriteria / totalCriteria) * 100);

    const blockers: string[] = [];
    const notes: string[] = [];

    if (!criteria.executionEnvironmentDeclared) {
      blockers.push("MISSING_EXECUTION_ENVIRONMENT_DECLARATION");
    }

    if (!criteria.compatibleWithWindowsTarget) {
      blockers.push("WINDOWS_TARGET_MISMATCH");
    }

    if (!criteria.powershellSupported) {
      blockers.push("POWERSHELL_NOT_SUPPORTED");
    }

    if (!criteria.correctScriptFormatDeclared) {
      blockers.push("WINDOWS_SCRIPT_FORMAT_UNDECLARED");
    }

    if (!criteria.noUndeclaredBashDependency) {
      blockers.push("BASH_DEPENDENCY_PRESENT_OR_UNDECLARED");
    }

    if (!criteria.existingIntakeGatesPassed) {
      blockers.push("PREVIOUS_GOVERNANCE_GATES_NOT_PASSED");
    }

    if (!criteria.noSandboxOverclaim) {
      blockers.push("SANDBOX_OVERCLAIM_PRESENT");
    }

    if (environment?.compatibility === "cross-platform") {
      notes.push("CROSS_PLATFORM_CLAIM_REQUIRES_TARGET_VALIDATION");
    }

    if (criteria.executionEnvironmentDeclared && !executionEnvironmentMissing) {
      notes.push(
        `DECLARED_ENVIRONMENT_${environment?.os?.toUpperCase() ?? "UNKNOWN"}_${environment?.shell?.toUpperCase() ?? "UNKNOWN"}`,
      );
    }

    const executionReadinessFailures = [
      criteria.commandsValidatedForDeclaredShell,
      criteria.unsupportedOperatorsRemovedOrNormalized,
      criteria.exitCodeHandlingExplicit,
      criteria.deterministicExecution,
    ].filter((value) => value === false).length;

    let classification = classify(score);

    if (
      environment !== undefined &&
      environment.compatibility === "cross-platform" &&
      environment.os !== "windows"
    ) {
      score = Math.min(score, 89);
      classification = applyClassificationCap(classification, "COMPATIBLE");
    }

    if (executionReadinessFailures >= 2) {
      score = Math.min(score, 69);
      classification = applyClassificationCap(classification, "REQUIRES_REFACTOR");
    }

    if (
      blockers.includes("MISSING_EXECUTION_ENVIRONMENT_DECLARATION") ||
      blockers.includes("WINDOWS_TARGET_MISMATCH") ||
      blockers.includes("POWERSHELL_NOT_SUPPORTED")
    ) {
      score = Math.min(score, 49);
      classification = "REJECTED_FOR_WINDOWS_TARGET";
    }

    return {
      targetOs: "windows",
      targetShell: "powershell",
      classification,
      score,
      passedCriteria,
      totalCriteria,
      criteria,
      blockers: Array.from(new Set(blockers)),
      notes,
    };
  }
}

export function createWindowsCompatibilityEvaluationContract(): WindowsCompatibilityEvaluationContract {
  return new WindowsCompatibilityEvaluationContract();
}
