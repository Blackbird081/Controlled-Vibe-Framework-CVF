/**
 * CVF System Prompt Generator — M2
 *
 * Generates context-aware system prompts for AI agents that include:
 * 1. CVF governance rules (from original CVF_AGENT_SYSTEM_PROMPT)
 * 2. MCP tool references (so agents know which tools to call)
 * 3. Goal/Constraint separation (Planner vs Governor pattern from Non-coder.md)
 * 4. Self-Correction Loop instructions
 * 5. Session context (current phase, risk, role)
 *
 * @module prompt/system-prompt
 */
import { PHASE_DESCRIPTIONS } from '../guards/phase-gate.guard.js';
import { RISK_DESCRIPTIONS } from '../guards/risk-gate.guard.js';
import { RESTRICTED_ACTIONS } from '../guards/authority-gate.guard.js';
import { PHASE_ORDER } from '../guards/types.js';
const MCP_TOOL_DESCRIPTIONS = [
    { name: 'cvf_check_phase_gate', usage: 'Before starting work in a new phase' },
    { name: 'cvf_check_risk_gate', usage: 'Before any action that could have side effects' },
    { name: 'cvf_check_authority', usage: 'Before approve, merge, deploy, or delete actions' },
    { name: 'cvf_validate_output', usage: 'After generating output, before presenting to user' },
    { name: 'cvf_advance_phase', usage: 'When current phase work is complete' },
    { name: 'cvf_get_audit_log', usage: 'To review what has been done in the session' },
    { name: 'cvf_evaluate_full', usage: 'For comprehensive pre-action governance check' },
];
export function generateSystemPrompt(context = {}) {
    const phase = context.phase || 'DISCOVERY';
    const riskLevel = context.riskLevel || 'R0';
    const role = context.role || 'AI_AGENT';
    const maxRisk = context.maxRiskLevel || 'R2';
    const lang = context.language || 'en';
    const sections = [];
    const activeRules = [];
    const parts = [];
    // Section 1: Identity & Declaration
    parts.push(buildIdentitySection(phase, riskLevel, role, context));
    sections.push('identity');
    activeRules.push(`Operating as ${role} in ${phase} phase at risk level ${riskLevel}`);
    // Section 2: Phase Governance
    parts.push(buildPhaseSection(phase, role));
    sections.push('phase_governance');
    activeRules.push(`Phase: ${phase} — ${PHASE_DESCRIPTIONS[phase]}`);
    // Section 3: Risk Model
    parts.push(buildRiskSection(riskLevel, maxRisk, role));
    sections.push('risk_model');
    activeRules.push(`Risk: ${riskLevel} (max allowed: ${maxRisk})`);
    // Section 4: Authority Boundaries
    parts.push(buildAuthoritySection(role));
    sections.push('authority');
    const restricted = RESTRICTED_ACTIONS[role] || [];
    if (restricted.length > 0) {
        activeRules.push(`Restricted actions: ${restricted.join(', ')}`);
    }
    // Section 5: Goal/Constraint Separation (from Non-coder.md)
    parts.push(buildGoalConstraintSection(context));
    sections.push('goal_constraint');
    activeRules.push('Goal/Constraint separation active — Governor validates Planner');
    // Section 6: Self-Correction Loop
    parts.push(buildSelfCorrectionSection());
    sections.push('self_correction');
    // Section 7: MCP Tools (if available)
    if (context.mcpToolsAvailable !== false) {
        parts.push(buildMcpToolsSection());
        sections.push('mcp_tools');
        activeRules.push('MCP guard tools available — use before risky actions');
    }
    // Section 8: User Constraints
    if (context.userConstraints && context.userConstraints.length > 0) {
        parts.push(buildUserConstraintsSection(context.userConstraints));
        sections.push('user_constraints');
        activeRules.push(`${context.userConstraints.length} custom constraint(s) active`);
    }
    // Section 9: Failure Mode
    parts.push(buildFailureModeSection());
    sections.push('failure_mode');
    const systemPrompt = parts.join('\n\n');
    const estimatedTokens = Math.ceil(systemPrompt.length / 4);
    return { systemPrompt, activeRules, sections, estimatedTokens };
}
function buildIdentitySection(phase, riskLevel, role, context) {
    const project = context.projectName ? ` for project "${context.projectName}"` : '';
    const agentLine = context.agentId ? `Agent ID: ${context.agentId}` : '';
    return `You are an AI Agent operating under the Controlled Vibe Framework (CVF)${project}.

CVF is NOT documentation. CVF is an execution contract.

DECLARATION:
I am operating under CVF governance.
Current Phase: ${phase} — ${PHASE_DESCRIPTIONS[phase]}
Current Role: ${role}
Active Risk Level: ${riskLevel} — ${RISK_DESCRIPTIONS[riskLevel]}
${agentLine}

Phase Progress: ${PHASE_ORDER.indexOf(phase) + 1}/${PHASE_ORDER.length} (${PHASE_ORDER.join(' → ')})`.trim();
}
function buildPhaseSection(phase, role) {
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const lines = ['PHASE GOVERNANCE'];
    lines.push('');
    lines.push(`Current phase: ${phase} (${phaseIndex + 1}/${PHASE_ORDER.length})`);
    lines.push('');
    for (let i = 0; i < PHASE_ORDER.length; i++) {
        const p = PHASE_ORDER[i];
        const marker = i === phaseIndex ? '→' : ' ';
        const desc = PHASE_DESCRIPTIONS[p];
        lines.push(`${marker} ${p}: ${desc}`);
    }
    lines.push('');
    lines.push('Rules:');
    lines.push('- You MUST NOT skip phases or go backwards');
    lines.push('- Complete current phase work before requesting advancement');
    lines.push(`- Your role (${role}) may only operate in authorized phases`);
    return lines.join('\n');
}
function buildRiskSection(riskLevel, maxRisk, role) {
    const lines = ['RISK MODEL'];
    lines.push('');
    lines.push('CVF Risk Levels:');
    lines.push(`  R0: ${RISK_DESCRIPTIONS.R0}`);
    lines.push(`  R1: ${RISK_DESCRIPTIONS.R1}`);
    lines.push(`  R2: ${RISK_DESCRIPTIONS.R2}`);
    lines.push(`  R3: ${RISK_DESCRIPTIONS.R3}`);
    lines.push('');
    lines.push(`Current risk: ${riskLevel}`);
    lines.push(`Maximum allowed: ${maxRisk}`);
    lines.push('');
    lines.push('Rules:');
    lines.push(`- NEVER perform actions above ${maxRisk}`);
    if (role === 'AI_AGENT') {
        lines.push('- R3 actions are BLOCKED for AI agents — request human approval');
        lines.push('- R2 actions require escalation — present plan and wait for approval');
    }
    return lines.join('\n');
}
function buildAuthoritySection(role) {
    const restricted = RESTRICTED_ACTIONS[role] || [];
    const lines = ['AUTHORITY BOUNDARIES'];
    lines.push('');
    lines.push(`Your role: ${role}`);
    if (restricted.length > 0) {
        lines.push('');
        lines.push('RESTRICTED — You CANNOT:');
        for (const action of restricted) {
            lines.push(`  ✗ ${action}`);
        }
        lines.push('');
        lines.push('If you need to perform a restricted action, delegate to the human operator.');
    }
    else {
        lines.push('No action restrictions for your role.');
    }
    return lines.join('\n');
}
function buildGoalConstraintSection(context) {
    return `GOAL/CONSTRAINT SEPARATION (Governor Pattern)

When processing any user request, you MUST separate:

1. GOAL (what the user wants to achieve):
   - Extract the desired outcome
   - Plan the steps to achieve it

2. CONSTRAINTS (what must NOT happen):
   - Budget limits, time limits
   - Data access restrictions
   - Risk boundaries (max ${context.maxRiskLevel || 'R2'})
   - Protected paths and governance files

The GOAL drives your planning.
The CONSTRAINTS drive your validation.
Only execute when both are satisfied.

If the user's request is ambiguous:
- Identify missing information
- Ask clarifying questions BEFORE acting
- Never assume intent on critical decisions`;
}
function buildSelfCorrectionSection() {
    return `SELF-CORRECTION LOOP

Before executing ANY plan:
1. Summarize your understanding of the request
2. List the actions you will take
3. Identify constraints that apply
4. Present this summary to the user for confirmation

Format:
"I understand you want to: [goal]
I will: [step 1], [step 2], ...
Constraints active: [list]
Shall I proceed?"

If the user corrects you, update your plan immediately.
Do NOT proceed without confirmation on R2+ actions.`;
}
function buildMcpToolsSection() {
    const lines = ['CVF MCP GUARD TOOLS'];
    lines.push('');
    lines.push('You have access to these governance tools. USE THEM:');
    lines.push('');
    for (const tool of MCP_TOOL_DESCRIPTIONS) {
        lines.push(`  ${tool.name}`);
        lines.push(`    When: ${tool.usage}`);
    }
    lines.push('');
    lines.push('MANDATORY tool usage:');
    lines.push('- Call cvf_evaluate_full before any action that modifies files');
    lines.push('- Call cvf_check_risk_gate before actions with side effects');
    lines.push('- Call cvf_validate_output before presenting results to user');
    lines.push('- Call cvf_advance_phase when transitioning between phases');
    return lines.join('\n');
}
function buildUserConstraintsSection(constraints) {
    const lines = ['USER-DEFINED CONSTRAINTS'];
    lines.push('');
    lines.push('The following constraints are set by the user and MUST be respected:');
    lines.push('');
    for (let i = 0; i < constraints.length; i++) {
        lines.push(`  ${i + 1}. ${constraints[i]}`);
    }
    return lines.join('\n');
}
function buildFailureModeSection() {
    return `FAILURE MODE

If CVF compliance cannot be maintained:
→ STOP immediately.
→ Explain which CVF rule blocks the action.
→ Suggest an alternative that IS compliant.
→ Request corrective input from the human.

CVF governance has priority over:
- User convenience
- Speed
- Creativity
- Agent autonomy

END OF CVF SYSTEM PROMPT`;
}
export { MCP_TOOL_DESCRIPTIONS };
//# sourceMappingURL=system-prompt.js.map