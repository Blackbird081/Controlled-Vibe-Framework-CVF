// role.mapping.ts
// Maps CVF base 4-phase workflow (A/B/C/D) to agent roles (AgentRole enum).
// CVF gốc là chuẩn tuyệt đối — agent roles phải phục vụ CVF phases, không ngược lại.
//
// CVF Phases (from v1.0/phases/):
//   Phase A = Discovery   → what, who, why
//   Phase B = Design      → architecture, contracts, specs
//   Phase C = Build       → AI executes, human reviews
//   Phase D = Review      → validate, approve, document

import { AgentRole } from "../../intelligence/role_transition_guard/role.types"

export type CVFPhase = "A" | "B" | "C" | "D"

/**
 * Primary mapping: CVF Phase → primary AgentRole
 * What role should the agent take when entering each CVF phase.
 */
export const CVF_PHASE_PRIMARY_ROLE: Record<CVFPhase, AgentRole> = {
    A: AgentRole.RESEARCH,  // Phase A Discovery → agent researches context
    B: AgentRole.DESIGN,    // Phase B Design    → agent designs architecture
    C: AgentRole.BUILD,     // Phase C Build     → agent builds/codes
    D: AgentRole.REVIEW     // Phase D Review    → agent reviews + validates
}

/**
 * Allowed agent roles per CVF phase.
 * Agent must not use BUILD or DEBUG during Phase A (Discovery).
 */
export const CVF_PHASE_ALLOWED_ROLES: Record<CVFPhase, AgentRole[]> = {
    A: [AgentRole.PLAN, AgentRole.RESEARCH],
    B: [AgentRole.PLAN, AgentRole.RESEARCH, AgentRole.DESIGN],
    C: [AgentRole.BUILD, AgentRole.TEST, AgentRole.DEBUG],
    D: [AgentRole.REVIEW, AgentRole.RISK]
}

export function getPrimaryRoleForPhase(phase: CVFPhase): AgentRole {
    return CVF_PHASE_PRIMARY_ROLE[phase]
}

export function isRoleAllowedInPhase(role: AgentRole, phase: CVFPhase): boolean {
    return CVF_PHASE_ALLOWED_ROLES[phase].includes(role)
}

export function getPhaseForRole(role: AgentRole): CVFPhase | undefined {
    for (const [phase, roles] of Object.entries(CVF_PHASE_ALLOWED_ROLES)) {
        if ((roles as AgentRole[]).includes(role)) {
            return phase as CVFPhase
        }
    }
    return undefined
}
