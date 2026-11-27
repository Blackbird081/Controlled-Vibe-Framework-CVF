// Text Encoding Exception: headings retain the existing Markdown export symbols.
export const homeIntakeExecution = `
## ⛔ Execution Constraints
- Treat this specification as one intake input. Read permitted sources and existing decisions before asking the user.
- Stay within the agreed scope and current permissions. Mark unavailable facts as unknown.
- Use the Output Template to organize permitted work. Identify which parts remain conditional and what would unblock them.
`;

export const homeIntakeValidation = `
## ✅ Validation Hooks
- Check the result against the requested outcome, supplied acceptance criteria, and applicable Expected Output sections.
- Identify completed and conditional parts, state the evidence you used, and record what still needs a decision or verification.
`;

export const homeIntakeRules = `
## ⚠️ CVF GOVERNANCE RULES (AI MUST FOLLOW)

### Stop Conditions
- Pause only the dependent action when it needs unavailable access, approval, or a material decision. Continue independent permitted work and explain what can proceed.

### Guardrails
- **DO NOT** execute code without explicit permission.
- **DO NOT** make financial, legal, or medical recommendations without disclaimers.
- Protect existing constraints. An assumption cannot substitute for consent or extend authority.

### Response Requirements
- Explain the basis for conclusions and acknowledge limitations.
- Provide sources or references when applicable.

### Receiving Agent Continuation
- Record consequential assumptions and keep them distinguishable from supplied facts and decisions.
- Prioritize open questions by the effect of an answer on the next permitted action. Read permitted sources first and resolve ordinary technical details within scope.
- Ask the appropriate owner about material decisions affecting the goal, result, scope, rights, data, budget, or acceptance. Name the dependent action and continue the permitted work that can proceed independently.
`;

export const homeNoInputsRecorded = 'No files, examples or links were recorded for the user to supply later.';

const executeGuardrail = '- **DO NOT** execute code without explicit permission.';

// Used only for a generic low-risk request (R0/R1) with no outside-effect cue and no external action or physical-safety hazard.
// Safety rests on the limits written here, not on the cue check: a request that slips past the cues still gets only a bounded local mock.
const firstPreviewGuardrail = [
    "- **First local preview is permitted.** The user's request plus this file is permission to create and run code inside the receiving project's own folder to produce one first local preview, within the limits below.",
    '- Build that first preview now. Write down every assumption as an assumption, list the open questions, and then ask the user. Do not hold the whole job at intake.',
    "- Limits of the first preview: create new files only; do not edit or delete any existing file except the project's own record files; one result the user can open locally; sample data or data the user types into it only.",
    '- The preview makes no network or provider call, sends nothing (no message, email, call or notification), publishes or deploys nothing, connects to no account, site, sheet or database, moves no money, stores no real personal, payment or secret data, reads nothing outside the project folder, installs nothing on the machine, and accesses no device, location or other program.',
    "- If part of the request needs any of those, do not build or imitate that part. Leave it out (a text the user can copy and send themselves is fine) and say in the handoff, in the user's language, what was not built and why.",
    "- Where the receiving project's own rules are stricter, those rules still apply.",
].join('\n');

// Every other Home packet says plainly that it grants no first preview, so the receiving project's first-preview route does not apply.
const noFirstPreviewGuardrail = [
    executeGuardrail,
    '- **First local preview is NOT granted by this packet.** The request may involve an outside effect or sensitive data, or it is not a generic small request. Complete intake with the user before running any code; this is a specific reason not to run code yet.',
].join('\n');

export const homeIntakeRulesNoFirstPreview = homeIntakeRules.replace(executeGuardrail, noFirstPreviewGuardrail);

export const homeIntakeRulesFirstPreview = homeIntakeRules.replace(executeGuardrail, firstPreviewGuardrail);

export const homeFirstPreviewPurposeLine = "- For this low-risk request the packet also permits building a first local preview inside the project folder (see Guardrails); assumptions and open questions are then reviewed with the user.";

export const homeIntakeExecutionFirstPreview = homeIntakeExecution.replace(
    'Treat this specification as one intake input.',
    'Treat this specification as the input for a first local preview plus open questions.',
);

export const homeFirstPreviewPhase = 'INTAKE (first local preview permitted)';

export const homeFirstPreviewAuthoritySentence = "This packet grants no rights beyond the bounded first local preview described under Guardrails, inside the receiving project's folder.";

export const homeFirstPreviewIntakeLine = "- Use this packet to begin intake and the first local preview for the user's requested outcome. Continue with permitted work using the available information.";
