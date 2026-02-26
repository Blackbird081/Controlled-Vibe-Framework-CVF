import { describe, it, expect } from 'vitest';
import { checkResponseGovernance } from './governance-post-check';

describe('checkResponseGovernance', () => {
    describe('Bug fix detection', () => {
        it('should detect bug fix without BUG_HISTORY mention — violation', () => {
            const response = 'I fixed the bug by resolving the null pointer error in Settings.tsx';
            const result = checkResponseGovernance(response, 'fix the settings bug', 'en');
            expect(result.hasBugFixContext).toBe(true);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('bug_doc_missing');
        });

        it('should pass when bug fix mentions BUG_HISTORY.md', () => {
            const response = 'Fixed the hydration error. Please add an entry to docs/BUG_HISTORY.md.';
            const result = checkResponseGovernance(response, 'fix the error', 'en');
            expect(result.hasBugFixContext).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should not false-positive on general text', () => {
            const response = 'Here is a summary of the CVF governance framework.';
            const result = checkResponseGovernance(response, 'explain governance', 'en');
            expect(result.hasBugFixContext).toBe(false);
            expect(result.violations).toHaveLength(0);
        });

        it('should require at least 2 bug patterns to trigger', () => {
            const response = 'The function has an error handling mechanism.';
            const result = checkResponseGovernance(response, 'explain error handling', 'en');
            // Only 1 pattern match ("error") — should not trigger
            expect(result.hasBugFixContext).toBe(false);
        });
    });

    describe('Test execution detection', () => {
        it('should detect test execution without TEST_LOG mention — violation', () => {
            const response = 'Running npm run test... All 51 tests passed with 96% coverage.';
            const result = checkResponseGovernance(response, 'run the tests', 'en');
            expect(result.hasTestContext).toBe(true);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('test_doc_missing');
        });

        it('should pass when test mentions TEST_LOG', () => {
            const response = 'Tests passed. Added batch entry to docs/CVF_INCREMENTAL_TEST_LOG.md.';
            const result = checkResponseGovernance(response, 'run tests', 'en');
            expect(result.hasTestContext).toBe(true);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect vitest context', () => {
            const response = 'Running vitest... 43/43 passed.';
            const result = checkResponseGovernance(response, 'check tests', 'en');
            expect(result.hasTestContext).toBe(true);
        });

        it('should detect .test.ts file mentions', () => {
            const response = 'Modified Settings.test.tsx to add new assertions.';
            const result = checkResponseGovernance(response, 'update tests', 'en');
            expect(result.hasTestContext).toBe(true);
        });
    });

    describe('Combined scenarios', () => {
        it('should detect both bug fix AND test violations', () => {
            const response = 'Fixed the bug and ran npm run test to verify. All 51 tests passed.';
            const result = checkResponseGovernance(response, 'fix and test', 'en');
            expect(result.hasBugFixContext).toBe(true);
            expect(result.hasTestContext).toBe(true);
            expect(result.violations).toHaveLength(2);
        });

        it('should return no violations when all docs mentioned', () => {
            const response = 'Fixed the bug. Updated docs/BUG_HISTORY.md. Ran tests and logged in docs/CVF_INCREMENTAL_TEST_LOG.md.';
            const result = checkResponseGovernance(response, 'fix and test', 'en');
            expect(result.violations).toHaveLength(0);
        });
    });

    describe('Language support', () => {
        it('should return Vietnamese messages when language is vi', () => {
            const response = 'Đã fix lỗi hydration error trong Settings.tsx';
            const result = checkResponseGovernance(response, 'sửa lỗi settings', 'vi');
            expect(result.hasBugFixContext).toBe(true);
            expect(result.violations[0].message).toContain('Governance Check');
            expect(result.violations[0].message).toContain('BUG_HISTORY.md');
        });
    });

    describe('Code change detection', () => {
        it('should detect code changes and suggest compat gate', () => {
            const response = 'Modified the component to use the new API. Created a new module for data fetching.';
            const result = checkResponseGovernance(response, 'update component', 'en');
            expect(result.hasCodeChangeContext).toBe(true);
            expect(result.suggestions.length).toBeGreaterThan(0);
        });

        it('should not suggest compat gate if already mentioned', () => {
            const response = 'Modified the file. Ran check_core_compat to verify.';
            const result = checkResponseGovernance(response, 'update file', 'en');
            expect(result.suggestions).toHaveLength(0);
        });
    });
});
