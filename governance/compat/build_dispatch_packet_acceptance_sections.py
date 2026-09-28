"""Acceptance and return-contract sections for dispatch scaffolds."""

def required_artifact_manifest() -> str:
    return "## Required Artifact Manifest\n\n| Artifact | Required worker action |\n| --- | --- |\n| FILL_ME | FILL_ME |\n"

def acceptance_ledger_block() -> str:
    return ("## Work-Order Acceptance Requirement Ledger\n\n```acceptance-ledger-json\n"
            '{"schemaVersion":"cvf.workOrderAcceptanceLedger@1.0.0","requirements":[{"requirementId":"REQ-FILL","mandatory":true,"expectedArtifacts":["docs/reviews/FILL_ME.md"],"requiredProofIds":["PROOF-FILL"]}],"proofCatalog":[{"proofId":"PROOF-FILL","kind":"COMMAND","locator":"FILL_ME"}]}\n'
            "```\n\n## Tool / Classifier Block Recovery Contract\n\n"
            "toolClassifierBlockRecoveryApplicability: NOT_APPLICABLE_WITH_REASON - classify before dispatch\n")

def worker_return_packet_shape_contract(path: str) -> str:
    return ("## Worker Return Packet Shape Contract\n\n" f"workerReturnPath: `{path}`\n"
            "contractProfile: WORKER_RETURN_FULL_GATE_V1\nrequiredGate: `python governance/compat/run_worker_return_fast_gate.py`\nindividualCheckerSubstitution: FORBIDDEN\nworkerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED\n\n"
            "Required terms: Purpose; Scope / Methodology; Findings / Position; Risk / Corrective Action; Claim Boundary; Agent Operation Trace Block; Delta Execution Claim Boundary Control Block; Public Export Disposition; executionBaseHead; git status --short.\n\n"
            "Conditional terms: External Knowledge Intake Routing; Rescan Intelligence Hardening; Corpus Completeness And Report Integrity; Finding-To-Governance Learning Disposition; Epistemic Process Block; Machine Closure Package.\n\nUse `N/A with reason` for every non-applicable conditional block.\n\n"
            "Shape-list rule: when listing required worker-output sections, write section names without the `##` prefix. Reserve actual heading syntax for real sections so structural checkers do not treat this checklist as the artifact section body.\n")

def worker_output_checker_read_ahead_mandate() -> str:
    return ("## Worker Output Checker Read-Ahead Mandate\n\nBefore writing each worker-owned output artifact, read checker source for that file's docType, path family, and conditional content class.\n\n"
            "| Output artifact | Required read-ahead result |\n| --- | --- |\n| worker return under `docs/reviews/` | derive exact review headings, worker-return quality terms, trace labels, delta boundary labels, corpus/value/rescan tokens, and no-commit evidence shape before writing |\n| companion reference under `docs/reference/` | derive exact reference headings such as Scope / Applies To, Target / Source, source verification, corpus/value/rescan, trace, and claim-boundary labels before writing |\n\n"
            "Literal-shape reminders: do not list required headings as backticked `## ...` strings before the real section; write source-not-found disposition spelling instead of the exact blocked enum in literalTokensReviewed; avoid `after ... closure` wording unless a dependency-release row cites the accepted artifact path and commit.")
