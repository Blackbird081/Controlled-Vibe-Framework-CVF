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
        ...overrides,
    }
}

describe('CVF v1.2.2 deprecated-skill successor conformance', () => {
    let registry: SkillRegistry
    let revocations: RevocationRegistry
    let loader: SkillLoader

    beforeEach(() => {
        registry = new SkillRegistry()
        revocations = new RevocationRegistry()
        loader = new SkillLoader(registry, revocations)
    })

    it('migrates deprecated skills to an active successor when available', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-successor',
            name: 'Successor Skill',
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-deprecated',
            name: 'Deprecated Skill',
            deprecated: true,
            successor_skill_id: 'skill-successor',
        }))

        const result = loader.loadWithMigration('skill-deprecated')

        expect(result.migrated_from).toBe('skill-deprecated')
        expect(result.skill.id).toBe('skill-successor')
    })

    it('supports deprecation marking with successor metadata through the registry', () => {
        registry.register(makeRegisteredSkill({ id: 'skill-successor' }))
        registry.register(makeRegisteredSkill({ id: 'skill-legacy' }))

        registry.markDeprecated('skill-legacy', 'skill-successor')

        expect(registry.get('skill-legacy')?.deprecated).toBe(true)
        expect(registry.get('skill-legacy')?.successor_skill_id).toBe('skill-successor')
        expect(registry.getSuccessor('skill-legacy')?.id).toBe('skill-successor')
    })

    it('fails closed when the declared successor is not executable', () => {
        registry.register(makeRegisteredSkill({
            id: 'skill-successor',
            revoked: true,
        }))
        registry.register(makeRegisteredSkill({
            id: 'skill-deprecated',
            deprecated: true,
            successor_skill_id: 'skill-successor',
        }))

        expect(() => loader.loadWithMigration('skill-deprecated')).toThrow('Successor skill is revoked')
    })
})
