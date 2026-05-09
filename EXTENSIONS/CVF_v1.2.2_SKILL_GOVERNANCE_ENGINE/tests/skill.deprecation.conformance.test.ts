import { beforeEach, describe, expect, it } from 'vitest'
import { CandidateSearch } from '../fusion/candidate.search.js'
import { SkillRegistry, type RegisteredSkill } from '../internal_ledger/skill.registry.js'
import { RevocationRegistry } from '../internal_ledger/revocation.registry.js'
import { SkillLoader } from '../runtime/skill.loader.js'
import { RefusalRouter } from '../runtime/refusal.router.js'

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

describe('CVF v1.2.2 deprecated-skill conformance', () => {
    let registry: SkillRegistry
    let revocations: RevocationRegistry
    let loader: SkillLoader
    let router: RefusalRouter

    beforeEach(() => {
        registry = new SkillRegistry()
        revocations = new RevocationRegistry()
        loader = new SkillLoader(registry, revocations)
        router = new RefusalRouter()
    })

    it('filters deprecated skills from candidate search results', () => {
        registry.register(makeRegisteredSkill({ id: 'skill-active', name: 'Active Skill' }))
        registry.register(makeRegisteredSkill({ id: 'skill-deprecated', name: 'Deprecated Skill', deprecated: true }))

        const search = new CandidateSearch(registry)
        const results = search.search({ domain: 'application' })

        expect(results.map((item) => item.id)).toEqual(['skill-active'])
    })

    it('blocks runtime loading of deprecated skills and returns refusal reason', () => {
        registry.register(makeRegisteredSkill({ id: 'skill-deprecated', deprecated: true }))

        expect(() => loader.load('skill-deprecated')).toThrow('Skill is deprecated')
        expect(router.route('deprecated_skill')).toBe('Execution refused: Skill deprecated.')
    })

    it('supports runtime deprecation marking through the registry', () => {
        registry.register(makeRegisteredSkill({ id: 'skill-lifecycle' }))
        registry.markDeprecated('skill-lifecycle')

        expect(registry.get('skill-lifecycle')?.deprecated).toBe(true)
        expect(() => loader.load('skill-lifecycle')).toThrow('Skill is deprecated')
    })
})
