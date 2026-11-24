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
