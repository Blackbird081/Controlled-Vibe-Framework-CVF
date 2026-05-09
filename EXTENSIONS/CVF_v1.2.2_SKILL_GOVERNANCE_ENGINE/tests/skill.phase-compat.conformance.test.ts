import { beforeEach, describe, expect, it } from 'vitest'
import { SkillRegistry, type RegisteredSkill } from '../internal_ledger/skill.registry.js'
import { RevocationRegistry } from '../internal_ledger/revocation.registry.js'
import { SkillLoader } from '../runtime/skill.loader.js'

function makeRegisteredSkill(overrides: Partial<RegisteredSkill> = {}): RegisteredSkill {
    return {
        id: 'skill-default',
        name: 'Default Skill',
        domain: 'application',
        source: 'ai_research_skills',
        maturity: 'validated',
        integrity_hash: 'hash-default',
        created_at: Date.now(),
        usage_count: 0,
        revoked: false,
        deprecated: false,
        dependency_status: 'ready',
        ...overrides,
    }
}

describe('CVF v1.2.2 phase/dependency compatibility conformance', () => {
    let registry: SkillRegistry
    let revocations: RevocationRegistry
    let loader: SkillLoader

    beforeEach(() => {
        registry = new SkillRegistry()
        revocations = new RevocationRegistry()
        loader = new SkillLoader(registry, revocations)
    })

    it('blocks runtime loading when dependency status is blocked', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-blocked-dependency',
            dependency_status: 'blocked',
        }))

        expect(() => loader.load('skill-blocked-dependency')).toThrow('Skill dependencies are blocked')
    })

    it('blocks runtime loading when the current phase is not allowed', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-phase-bound',
            allowed_phases: ['EXECUTION'],
        }))

        expect(() => loader.load('skill-phase-bound', { current_phase: 'SKILL_DISCOVERY' })).toThrow(
            'Skill is not allowed in phase SKILL_DISCOVERY'
        )
    })

    it('does not allow successor migration to bypass dependency or phase checks', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-successor',
            dependency_status: 'ready',
            allowed_phases: ['EXECUTION'],
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-legacy',
            deprecated: true,
            successor_skill_id: 'skill-successor',
        }))

        expect(() => loader.loadWithMigration('skill-legacy', { current_phase: 'RISK_EVALUATION' })).toThrow(
            'Skill is not allowed in phase RISK_EVALUATION'
        )

        registry.revoke('skill-successor')
        expect(() => loader.loadWithMigration('skill-legacy', { current_phase: 'EXECUTION' })).toThrow(
            'Successor skill is revoked'
        )
    })
})
