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

describe('CVF v1.2.2 upgrade orchestration conformance', () => {
    let registry: SkillRegistry
    let revocations: RevocationRegistry
    let loader: SkillLoader

    beforeEach(() => {
        registry = new SkillRegistry()
        revocations = new RevocationRegistry()
        loader = new SkillLoader(registry, revocations)
    })

    it('resolves a multi-hop deprecated chain to the first active executable successor', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-v3',
            name: 'Skill v3',
            allowed_phases: ['EXECUTION'],
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-v2',
            name: 'Skill v2',
            deprecated: true,
            successor_skill_id: 'skill-v3',
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-v1',
            name: 'Skill v1',
            deprecated: true,
            successor_skill_id: 'skill-v2',
        }))

        const result = loader.loadWithMigration('skill-v1', { current_phase: 'EXECUTION' })

        expect(result.migrated_from).toBe('skill-v1')
        expect(result.skill.id).toBe('skill-v3')
        expect(result.migration_path).toEqual(['skill-v2', 'skill-v3'])
    })

    it('fails closed when the successor chain contains a migration cycle', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-a',
            deprecated: true,
            successor_skill_id: 'skill-b',
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-b',
            deprecated: true,
            successor_skill_id: 'skill-a',
        }))

        expect(() => loader.loadWithMigration('skill-a')).toThrow('Skill successor migration cycle detected')
    })

    it('fails closed when the final migration target violates runtime policy', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-v3',
            allowed_phases: ['EXECUTION'],
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-v2',
            deprecated: true,
            successor_skill_id: 'skill-v3',
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-v1',
            deprecated: true,
            successor_skill_id: 'skill-v2',
        }))

        expect(() => loader.loadWithMigration('skill-v1', { current_phase: 'RISK_EVALUATION' })).toThrow(
            'Skill is not allowed in phase RISK_EVALUATION'
        )
    })
})
