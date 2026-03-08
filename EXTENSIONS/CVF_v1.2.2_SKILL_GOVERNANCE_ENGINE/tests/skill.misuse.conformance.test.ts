import { describe, expect, it } from 'vitest'
import { SkillRegistry, type RegisteredSkill } from '../internal_ledger/skill.registry.js'
import { RevocationRegistry } from '../internal_ledger/revocation.registry.js'
import { SkillLoader } from '../runtime/skill.loader.js'
import { RefusalRouter } from '../runtime/refusal.router.js'
import { ContractEnforcer } from '../runtime/contract.enforcer.js'
import { CandidateSearch } from '../fusion/candidate.search.js'

function makeRegisteredSkill(overrides: Partial<RegisteredSkill> = {}): RegisteredSkill {
    return {
        id: 'skill-review',
        name: 'Code Review Skill',
        domain: 'application',
        source: 'skills_sh',
        maturity: 'validated',
        integrity_hash: 'sha256:abc',
        created_at: Date.now(),
        usage_count: 0,
        revoked: false,
        ...overrides,
    }
}

describe('skill misuse conformance', () => {
    it('filters revoked skills from candidate search results', () => {
        const registry = new SkillRegistry()
        registry.register(makeRegisteredSkill({ id: 'skill-active', name: 'Active Skill' }))
        registry.register(makeRegisteredSkill({ id: 'skill-revoked', name: 'Revoked Skill', revoked: true }))

        const search = new CandidateSearch(registry)
        const results = search.search({ domain: 'application', keywords: ['skill'] })

        expect(results.map((item) => item.id)).toEqual(['skill-active'])
    })

    it('blocks runtime loading of revoked skills and returns refusal reason', () => {
        const registry = new SkillRegistry()
        const revocations = new RevocationRegistry()
        registry.register(makeRegisteredSkill({ id: 'skill-revoked' }))
        revocations.revoke('skill-revoked', 'forbidden after incident')

        const loader = new SkillLoader(registry, revocations)
        const router = new RefusalRouter()

        expect(() => loader.load('skill-revoked')).toThrow('Skill is revoked')
        expect(router.route('revoked_skill')).toBe('Execution refused: Skill revoked.')
    })

    it('blocks forbidden operations declared by contract', () => {
        const enforcer = new ContractEnforcer()
        const contract = {
            required_inputs: ['prompt'],
            forbidden_operations: ['network_write', 'silent_delete'],
        }

        expect(() => enforcer.validateInput(contract, { prompt: 'review code' })).not.toThrow()
        expect(() => enforcer.validateOperation(contract, 'network_write')).toThrow(
            'Operation forbidden by contract: network_write'
        )
        expect(() => enforcer.validateOperation(contract, 'read_only_analysis')).not.toThrow()
    })
})
