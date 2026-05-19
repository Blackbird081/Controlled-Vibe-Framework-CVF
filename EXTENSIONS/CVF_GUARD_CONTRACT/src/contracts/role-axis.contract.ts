/**
 * CVF Phase 1.I — Role Axis Taxonomy Contract
 * =============================================
 * Defines the four canonical role axes that separate concerns currently
 * conflated across AgentRole, CVFRole, DesignAgentRole, and RBAC role surfaces.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1I_IDENTITY_ROLE_TAXONOMY_2026-05-18.md
 *
 * SCOPE: Taxonomy definition and axis classification only.
 *   No existing role enum renamed, deleted, or re-typed (Phase 2.B).
 *   No runtime role check changed. No RBAC provider configuration changed.
 *
 * Design principle: Each axis is an independent concern.
 *   An agent may have a value on each axis simultaneously.
 *   The axes do not inherit from one another.
 */

// ─── Axis 1: Agent Function ───────────────────────────────────────────────────

/**
 * What an agent DOES within a governed workflow.
 * Sourced from: AgentRole (CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts)
 * and DesignAgentRole (CVF_CONTROL_PLANE_FOUNDATION/src/design.contract.ts).
 *
 * Canonical production values (as of Phase 1.0 inventory):
 *   AgentRole:       executor | observer | orchestrator | reviewer | coordinator
 *   DesignAgentRole: orchestrator | architect | builder | reviewer
 *
 * Migration note: DesignAgentRole is a domain-scoped subtype of AgentFunctionRole.
 * Phase 2.B will align both to this axis. No change to existing types until then.
 */
export type AgentFunctionRole =
  | 'executor'
  | 'observer'
  | 'orchestrator'
  | 'architect'
  | 'builder'
  | 'reviewer'
  | 'coordinator';

// ─── Axis 2: Operator / Team ──────────────────────────────────────────────────

/**
 * WHO is operating or owning an agent or workflow.
 * This axis maps to team, tenant, or organizational identity — not agent function.
 *
 * In the Phase 1.0 inventory, no explicit OperatorRole type was found in
 * production code. The alias table (CVF_17_05_KERNEL_TERMINOLOGY_ALIAS_TABLE)
 * confirmed: OperatorRole is NOT currently introduced; if introduced it must
 * be a subtype with value "operator" on the agent function axis.
 *
 * This axis is reserved for Phase 2.B wire-up when multi-team or workspace
 * scoping is needed. Defined here as a placeholder to name the concern.
 */
export type OperatorTeamRole =
  | 'operator'      // System operator running a CVF instance
  | 'team-lead'     // Team lead with elevated governance rights
  | 'contributor';  // Regular team contributor

// ─── Axis 3: Auth / RBAC ─────────────────────────────────────────────────────

/**
 * What a USER can ACCESS in the platform UI/API.
 * Source: NextAuth.js RBAC in CVF_v1.6_AGENT_PLATFORM/cvf-web (web-only axis).
 *
 * These values match the existing NextAuth role strings — do NOT rename them.
 * This axis governs UI/API permissions, not agent task assignment.
 * Canonical owner: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web (NextAuth config).
 */
export type AuthRbacRole =
  | 'Owner'
  | 'Admin'
  | 'Developer'
  | 'Reviewer'
  | 'Viewer';

// ─── Axis 4: Governance Actor ─────────────────────────────────────────────────

/**
 * What GOVERNANCE ROLE an agent or human holds in a CVF review chain.
 * Source: CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL and GC-046 (anti-collusion).
 *
 * Per GC-046 (17.05 role convention): Codex=REVIEWER on odd reviews,
 * Claude=PROPOSER on odd reviews — binding for 17.05 chain only.
 * This axis formalizes those governance role strings.
 */
export type GovernanceActorRole =
  | 'PROPOSER'
  | 'REVIEWER'
  | 'OPERATOR'    // Human operator who lifts/sets governance posture
  | 'AUDITOR';    // Read-only audit access to governance records

// ─── Axis Membership Declaration ─────────────────────────────────────────────

/**
 * Mapping of the four axes to their canonical type.
 * Use this to declare which axis a role surface belongs to.
 */
export interface RoleAxisAssignment {
  readonly surfaceId: string;
  readonly primaryAxis: 'agent-function' | 'operator-team' | 'auth-rbac' | 'governance-actor';
  readonly canonicalType: string;
  readonly notes?: string;
}

// ─── Adapter Meta ─────────────────────────────────────────────────────────────

export interface RoleAxisAdapterMeta {
  readonly adapterId: string;
  readonly domain: string;
  readonly sourcePath: string;
  readonly primaryAxis: 'agent-function' | 'operator-team' | 'auth-rbac' | 'governance-actor' | 'false-positive';
  readonly disposition: 'canonical_contract' | 'adapter' | 'legacy_reference' | 'deprecate_candidate';
  readonly hasConformanceStub: boolean;
  readonly migrationNote?: string;
}

// ─── Canonical Role Surface Index ─────────────────────────────────────────────

/**
 * Canonical role surfaces confirmed by Phase 1.0 inventory.
 * These are the production role types — not the 20 files (many were node_modules).
 */
export const CANONICAL_ROLE_SURFACES = [
  {
    surfaceId: 'cpf-agent-role',
    canonicalType: 'AgentRole',
    primaryAxis: 'agent-function' as const,
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts',
    values: ['executor', 'observer', 'orchestrator', 'reviewer', 'coordinator'],
  },
  {
    surfaceId: 'cpf-design-agent-role',
    canonicalType: 'DesignAgentRole',
    primaryAxis: 'agent-function' as const,
    sourcePath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.contract.ts',
    values: ['orchestrator', 'architect', 'builder', 'reviewer'],
    migrationNote: 'Domain-scoped subtype of AgentFunctionRole; Phase 2.B will align to canonical axis',
  },
  {
    surfaceId: 'web-auth-rbac-role',
    canonicalType: 'AuthRbacRole',
    primaryAxis: 'auth-rbac' as const,
    sourcePath: 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web (NextAuth config)',
    values: ['Owner', 'Admin', 'Developer', 'Reviewer', 'Viewer'],
  },
  {
    surfaceId: 'gc046-governance-actor-role',
    canonicalType: 'GovernanceActorRole',
    primaryAxis: 'governance-actor' as const,
    sourcePath: 'governance/toolkit/05_OPERATION/CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md',
    values: ['PROPOSER', 'REVIEWER', 'OPERATOR', 'AUDITOR'],
  },
] as const;
