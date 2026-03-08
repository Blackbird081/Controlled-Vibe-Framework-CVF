import { expect, test, describe } from "vitest"
import { SkillRegistry } from "../skill_lifecycle/skill.lifecycle.js"

describe('SkillLifecycle', () => {
    test('register and verify pass gate', () => {
        const registry = new SkillRegistry();

        registry.registerSkill({
            skill_id: 'spec-writer',
            version: '1.0.0',
            description: 'writes spec',
            commit_types: ['SPEC'],
            test_coverage: 0
        });

        const s1 = registry.getSkill('spec-writer');
        expect(s1?.status).toBe('REGISTERED');

        // Verify with >= 80% coverage and commits
        const verified = registry.verifySkill('spec-writer', 85, true);
        expect(verified.status).toBe('VERIFIED');

        // Cannot verify with < 80%
        registry.registerSkill({
            skill_id: 'bad-skill',
            version: '1.0.0',
            description: 'bad',
            commit_types: ['SPEC'],
            test_coverage: 0
        });
        const bad = registry.verifySkill('bad-skill', 70, true);
        expect(bad.status).toBe('REGISTERED'); // Still registered
    });

    test('activate and check dependencies', () => {
        const registry = new SkillRegistry();

        registry.registerSkill({
            skill_id: 'base-skill',
            version: '1.0.0',
            description: 'base',
            commit_types: ['TEST'],
            test_coverage: 0
        });
        registry.verifySkill('base-skill', 90, true);
        registry.activateSkill('base-skill');

        registry.registerSkill({
            skill_id: 'dependent-skill',
            version: '1.0.0',
            description: 'dep',
            commit_types: ['TEST'],
            test_coverage: 0,
            depends_on: ['base-skill']
        });
        registry.verifySkill('dependent-skill', 90, true);
        const dep = registry.activateSkill('dependent-skill');
        expect(dep.status).toBe('ACTIVE');

        // Cascade deprecation
        registry.revokeSkill('base-skill', 'deprecated API');
        expect(registry.getSkill('base-skill')?.status).toBe('REVOKED');
        expect(registry.getSkill('dependent-skill')?.status).toBe('DEPRECATED');
    });

    test('activate should fail when dependency is not ACTIVE', () => {
        const registry = new SkillRegistry();

        registry.registerSkill({
            skill_id: 'dep-required',
            version: '1.0.0',
            description: 'dep',
            commit_types: ['TEST'],
            test_coverage: 0
        });
        registry.verifySkill('dep-required', 90, true);
        // intentionally do not activate dependency

        registry.registerSkill({
            skill_id: 'consumer',
            version: '1.0.0',
            description: 'consumer',
            commit_types: ['TEST'],
            test_coverage: 0,
            depends_on: ['dep-required']
        });
        registry.verifySkill('consumer', 90, true);

        expect(() => registry.activateSkill('consumer')).toThrow('Dependency dep-required is not ACTIVE');
    });

    test('canAcceptCommit rules', () => {
        const registry = new SkillRegistry();
        registry.registerSkill({ skill_id: 's1', version: '1', description: 's', commit_types: ['TEST'], test_coverage: 0 });

        // Not verified yet => false
        expect(registry.canAcceptCommit('s1').allowed).toBe(false);

        registry.verifySkill('s1', 100, true);
        // Verified => true
        expect(registry.canAcceptCommit('s1').allowed).toBe(true);

        registry.activateSkill('s1');
        // Active => true
        expect(registry.canAcceptCommit('s1').allowed).toBe(true);

        registry.deprecateSkill('s1');
        // Deprecated => true with warning
        expect(registry.canAcceptCommit('s1').allowed).toBe(true);
        expect(registry.canAcceptCommit('s1').warning).toBe('DEPRECATED_SKILL');

        registry.revokeSkill('s1', 'End of life');
        // Revoked => false
        expect(registry.canAcceptCommit('s1').allowed).toBe(false);
    });
});
