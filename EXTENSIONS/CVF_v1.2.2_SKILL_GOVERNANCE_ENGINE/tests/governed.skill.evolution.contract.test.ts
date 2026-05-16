import { describe, expect, it } from 'vitest'
import {
    GovernedSkillEvolutionContract,
    createGovernedSkillEvolutionContract,
    type SkillFailureSignal,
    type SkillIdentity,
    type SkillMutationProposal,
} from '../evolution_engine/governed.skill.evolution.contract.js'

const FIXED_NOW = '2026-05-16T12:00:00.000Z'

function makeContract(): GovernedSkillEvolutionContract {
    return new GovernedSkillEvolutionContract({ now: () => FIXED_NOW })
}

function makeSkill(overrides: Partial<SkillIdentity> = {}): SkillIdentity {
    return {
        skillId: 'skill-doc-handoff',
        name: 'Documentation Handoff',
        version: '1.0.0',
        domain: 'documentation',
        riskClass: 'MEDIUM',
        ...overrides,
    }
}

function makeSignal(overrides: Partial<SkillFailureSignal> = {}): SkillFailureSignal {
    return {
        signalId: 'sig-001',
        skill: makeSkill(),
        trigger: 'QUALITY_DROP',
        occurredAt: FIXED_NOW,
        source: 'LEARNING_PLANE',
        summary: 'quality drop from missing acceptance checks',
        evidenceRefs: ['evt4:sample-001'],
        severity: 'MEDIUM',
        ...overrides,
    }
}

function makeProposal(overrides: Partial<SkillMutationProposal> = {}): SkillMutationProposal {
    const reflection = makeContract().reflect(makeSignal())
    return {
        ...makeContract().planMutation(reflection, 'Add acceptance-check section.'),
        ...overrides,
    }
}

describe('GovernedSkillEvolutionContract', () => {
    it('factory returns a contract instance', () => {
        expect(createGovernedSkillEvolutionContract()).toBeInstanceOf(GovernedSkillEvolutionContract)
    })

    it('reflects a failure signal into a skill-specific root cause', () => {
        const reflection = makeContract().reflect(makeSignal())
        expect(reflection.signalId).toBe('sig-001')
        expect(reflection.skill.skillId).toBe('skill-doc-handoff')
        expect(reflection.rootCause).toBe('LOW_OUTPUT_QUALITY')
        expect(reflection.evidenceRefs).toEqual(['evt4:sample-001'])
    })

    it('maps policy near-miss signals to restrict-scope proposals', () => {
        const reflection = makeContract().reflect(makeSignal({
            trigger: 'POLICY_NEAR_MISS',
            summary: 'unsafe policy-adjacent tool instruction',
        }))
        expect(reflection.recommendation).toBe('RESTRICT_SKILL_SCOPE')
    })

    it('creates mutation proposals without production write authority', () => {
        const reflection = makeContract().reflect(makeSignal())
        const proposal = makeContract().planMutation(reflection, 'Patch skill wording.')
        expect(proposal.productionWriteAllowed).toBe(false)
        expect(proposal.mutationType).toBe('PATCH_EXISTING_SKILL')
        expect(proposal.proposedVersion).toBe('1.0.1')
    })

    it('requires evidence on failure signals', () => {
        expect(() => makeContract().reflect(makeSignal({ evidenceRefs: [] }))).toThrow('evidenceRefs')
    })

    it('auto-rejects proposals when sandbox verification fails', () => {
        const proposal = makeProposal()
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: false,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        expect(verification.approvalClass).toBe('AUTO_REJECT')
        expect(verification.errors).toContain('sandbox verification failed')
    })

    it('requires positive evidence before lowering skill risk class', () => {
        const proposal = makeProposal({
            mutationType: 'LOWER_SKILL_RISK_CLASS',
            riskImpact: 'MEDIUM',
        })
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        expect(verification.approvalClass).toBe('AUTO_REJECT')
        expect(verification.errors).toContain('risk lowering requires positive evidence')
    })

    it('allows production approval for low-risk patch after all verification gates pass', () => {
        const proposal = makeProposal()
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        expect(verification.approvalClass).toBe('APPROVED_FOR_PRODUCTION')
        expect(verification.errors).toEqual([])
    })

    it('requires human approval for high-risk reinjection', () => {
        const proposal = makeProposal({
            mutationType: 'CREATE_NEW_SKILL',
            riskImpact: 'HIGH',
            requiresHumanReview: true,
        })
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        const decision = makeContract().decideReinjection(
            proposal,
            verification,
            'EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/skills/new-skill.md',
            'POLICY',
        )
        expect(decision.status).toBe('PROPOSAL_REJECTED')
        expect(decision.notes).toContain('human approval required')
    })

    it('blocks reinjection to non-governed target paths', () => {
        const proposal = makeProposal()
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        const decision = makeContract().decideReinjection(proposal, verification, '.private_reference/skill.md', 'SYSTEM')
        expect(decision.status).toBe('PROPOSAL_REJECTED')
        expect(decision.productionWriteAllowed).toBe(false)
        expect(decision.notes).toContain('target path is not governed')
    })

    it('approves governed production reinjection after verification and allowed target', () => {
        const proposal = makeProposal()
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        const decision = makeContract().decideReinjection(
            proposal,
            verification,
            'EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/skills/doc-handoff.md',
            'SYSTEM',
        )
        expect(decision.status).toBe('PROPOSAL_APPROVED_FOR_PRODUCTION')
        expect(decision.productionWriteAllowed).toBe(true)
    })

    it('creates immutable receipts with full lineage', () => {
        const signal = makeSignal()
        const reflection = makeContract().reflect(signal)
        const proposal = makeContract().planMutation(reflection, 'Patch skill wording.')
        const verification = makeContract().verifyProposal(proposal, {
            sandboxPassed: true,
            policyPassed: true,
            regressionPassed: true,
            securityPassed: true,
        })
        const decision = makeContract().decideReinjection(
            proposal,
            verification,
            'EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/skills/doc-handoff.md',
            'SYSTEM',
        )
        const receipt = makeContract().issueReceipt(signal, reflection, proposal, verification, decision)
        expect(receipt.immutable).toBe(true)
        expect(receipt.lineage.signalId).toBe(signal.signalId)
        expect(receipt.lineage.reflectionId).toBe(reflection.reflectionId)
        expect(receipt.lineage.verificationId).toBe(verification.verificationId)
        expect(receipt.lineage.decisionId).toBe(decision.decisionId)
    })

    it('is deterministic for the same signal and timestamp', () => {
        const first = makeContract().reflect(makeSignal())
        const second = makeContract().reflect(makeSignal())
        expect(first.reflectionId).toBe(second.reflectionId)
    })
})
