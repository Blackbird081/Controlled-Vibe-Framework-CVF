export type SemanticPolicyIntentClass =
  | "guard_alias"
  | "policy_intent"
  | "output_contract"
  | "eval_signal";

export interface SemanticPolicyIntentRegistryEntry {
  semanticItem: string;
  semanticClass: SemanticPolicyIntentClass;
  primaryOwner: string;
  useSurface: string;
}

export interface SemanticPolicyIntentCandidate {
  semanticItem: string;
  declaredClass?: SemanticPolicyIntentClass;
}

export interface SemanticPolicyIntentClassMismatch {
  semanticItem: string;
  declaredClass: SemanticPolicyIntentClass;
  canonicalClass: SemanticPolicyIntentClass;
}

export interface SemanticPolicyIntentRegistryRequest {
  items: Array<string | SemanticPolicyIntentCandidate>;
}

export interface SemanticPolicyIntentRegistryResult {
  valid: boolean;
  classifiedItems: SemanticPolicyIntentRegistryEntry[];
  unknownItems: string[];
  duplicateItems: string[];
  classMismatches: SemanticPolicyIntentClassMismatch[];
}

const CANONICAL_ENTRIES: SemanticPolicyIntentRegistryEntry[] = [
  {
    semanticItem: "EXPLICIT_APPROVAL_REQUIRED",
    semanticClass: "guard_alias",
    primaryOwner: "AuthorityGateGuard",
    useSurface: "approval gate before sensitive mutation or runtime",
  },
  {
    semanticItem: "SCOPE_BOUND_EXECUTION",
    semanticClass: "guard_alias",
    primaryOwner: "ScopeGuard",
    useSurface: "task-bound execution scope",
  },
  {
    semanticItem: "FILE_SCOPE_RESTRICTION",
    semanticClass: "guard_alias",
    primaryOwner: "FileScopeGuard",
    useSurface: "allowed file mutation boundary",
  },
  {
    semanticItem: "NO_UNAPPROVED_DEPENDENCIES",
    semanticClass: "guard_alias",
    primaryOwner: "RiskGateGuard",
    useSurface: "dependency-addition and compatibility risk gate",
  },
  {
    semanticItem: "MUTATION_CONTROL",
    semanticClass: "guard_alias",
    primaryOwner: "MutationBudgetGuard",
    useSurface: "bounded change volume and mutation safety",
  },
  {
    semanticItem: "AUDITABILITY_REQUIRED",
    semanticClass: "guard_alias",
    primaryOwner: "AuditTrailGuard",
    useSurface: "traceability and audit evidence requirements",
  },
  {
    semanticItem: "CONTEXT_VALIDATION_REQUIRED",
    semanticClass: "guard_alias",
    primaryOwner: "context trust / validation gate",
    useSurface: "external material validation before context packaging",
  },
  {
    semanticItem: "NO_ASSUMPTION",
    semanticClass: "policy_intent",
    primaryOwner: "Intake / Clarification / Boardroom",
    useSurface: "require clarification instead of unsupported inference",
  },
  {
    semanticItem: "REQUIRE_CLARIFICATION",
    semanticClass: "policy_intent",
    primaryOwner: "Intake / Reverse Prompting / Boardroom",
    useSurface: "clarification-first behavior when required inputs are missing",
  },
  {
    semanticItem: "CODEBASE_IS_SOURCE_OF_TRUTH",
    semanticClass: "policy_intent",
    primaryOwner: "truth precedence model",
    useSurface: "repo truth over chat history or external prose",
  },
  {
    semanticItem: "SECURITY_FIRST_POLICY",
    semanticClass: "policy_intent",
    primaryOwner: "policy engine + validation policy",
    useSurface: "security-sensitive routing and review priority",
  },
  {
    semanticItem: "COMPLETE_OUTPUT_REQUIRED",
    semanticClass: "output_contract",
    primaryOwner: "output validation / review",
    useSurface: "reject placeholder or omitted deliverables",
  },
  {
    semanticItem: "RUNNABLE_OUTPUT_ONLY",
    semanticClass: "output_contract",
    primaryOwner: "output validation / review",
    useSurface: "reject non-runnable deliverables when runnable output is required",
  },
  {
    semanticItem: "ERROR_HANDLING_REQUIRED",
    semanticClass: "output_contract",
    primaryOwner: "review + output validation",
    useSurface: "require explicit failure-path handling",
  },
  {
    semanticItem: "FUNCTIONAL_UI_REQUIRED",
    semanticClass: "output_contract",
    primaryOwner: "review + UI acceptance checks",
    useSurface: "require working user-facing flow",
  },
  {
    semanticItem: "EXPLAIN_WHY_ONLY",
    semanticClass: "output_contract",
    primaryOwner: "review/style checks",
    useSurface: "comment discipline rule",
  },
  {
    semanticItem: "STYLE_CONSISTENCY_REQUIRED",
    semanticClass: "output_contract",
    primaryOwner: "review/style checks",
    useSurface: "preserve local codebase conventions",
  },
  {
    semanticItem: "WORKSPACE_HYGIENE_REQUIRED",
    semanticClass: "output_contract",
    primaryOwner: "review/workspace checks",
    useSurface: "keep bounded, declared workspace state",
  },
  {
    semanticItem: "NO_UNRELATED_CHANGES",
    semanticClass: "output_contract",
    primaryOwner: "review/scope checks",
    useSurface: "reject edits beyond declared task",
  },
  {
    semanticItem: "INPUT_VALIDATION_REQUIRED",
    semanticClass: "eval_signal",
    primaryOwner: "LPF signal capture + review evidence",
    useSurface: "measure absent input validation and surface remediation",
  },
  {
    semanticItem: "INJECTION_PREVENTION",
    semanticClass: "eval_signal",
    primaryOwner: "LPF signal capture + security review",
    useSurface: "measure injection exposure or missing mitigation",
  },
  {
    semanticItem: "XSS_PREVENTION",
    semanticClass: "eval_signal",
    primaryOwner: "LPF signal capture + security review",
    useSurface: "measure front-end output risk where applicable",
  },
];

const CANONICAL_ENTRY_MAP = new Map(
  CANONICAL_ENTRIES.map((entry) => [entry.semanticItem, entry]),
);

function normalizeSemanticItem(value: string): string {
  return value.trim().replace(/\s+/g, "_").toUpperCase();
}

function normalizeCandidate(
  candidate: string | SemanticPolicyIntentCandidate,
): SemanticPolicyIntentCandidate | null {
  if (typeof candidate === "string") {
    const semanticItem = normalizeSemanticItem(candidate);
    return semanticItem.length === 0 ? null : { semanticItem };
  }

  const semanticItem = normalizeSemanticItem(candidate.semanticItem);
  if (semanticItem.length === 0) {
    return null;
  }

  return {
    semanticItem,
    declaredClass: candidate.declaredClass,
  };
}

export class SemanticPolicyIntentRegistryContract {
  classify(
    request: SemanticPolicyIntentRegistryRequest,
  ): SemanticPolicyIntentRegistryResult {
    const seenItems = new Set<string>();
    const classifiedItems: SemanticPolicyIntentRegistryEntry[] = [];
    const unknownItems = new Set<string>();
    const duplicateItems = new Set<string>();
    const classMismatches: SemanticPolicyIntentClassMismatch[] = [];

    for (const rawCandidate of request.items) {
      const candidate = normalizeCandidate(rawCandidate);
      if (candidate === null) {
        continue;
      }

      if (seenItems.has(candidate.semanticItem)) {
        duplicateItems.add(candidate.semanticItem);
        continue;
      }

      seenItems.add(candidate.semanticItem);

      const canonicalEntry = CANONICAL_ENTRY_MAP.get(candidate.semanticItem);
      if (canonicalEntry === undefined) {
        unknownItems.add(candidate.semanticItem);
        continue;
      }

      classifiedItems.push(canonicalEntry);

      if (
        candidate.declaredClass !== undefined &&
        candidate.declaredClass !== canonicalEntry.semanticClass
      ) {
        classMismatches.push({
          semanticItem: candidate.semanticItem,
          declaredClass: candidate.declaredClass,
          canonicalClass: canonicalEntry.semanticClass,
        });
      }
    }

    return {
      valid: unknownItems.size === 0 && classMismatches.length === 0,
      classifiedItems,
      unknownItems: Array.from(unknownItems),
      duplicateItems: Array.from(duplicateItems),
      classMismatches,
    };
  }
}

export function createSemanticPolicyIntentRegistryContract(): SemanticPolicyIntentRegistryContract {
  return new SemanticPolicyIntentRegistryContract();
}
