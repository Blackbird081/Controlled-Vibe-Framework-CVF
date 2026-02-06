import { describe, it, expect } from 'vitest';
import {
    calculateQualityScore,
    getQualityBadgeColor,
    getQualityLabel,
    shouldRequireAcceptance,
} from './governance';

describe('governance.ts', () => {
    describe('calculateQualityScore', () => {
        it('returns higher score for structured response with code blocks', () => {
            const response = `
## Solution Approach
Here's the implementation:

\`\`\`typescript
function hello() {
    console.log("Hello World");
}
\`\`\`

### Next Steps
1. Step one
2. Step two
            `;

            const score = calculateQualityScore(response, 'simple');
            expect(score.overall).toBeGreaterThan(60);
            expect(score.clarity).toBeGreaterThan(70);
            expect(score.actionability).toBeGreaterThan(70);
        });

        it('returns lower score for short unstructured response', () => {
            const response = 'OK, I will do that.';

            const score = calculateQualityScore(response, 'simple');
            expect(score.overall).toBeLessThan(60);
            expect(score.completeness).toBeLessThan(60);
        });

        it('applies compliance check for governance mode', () => {
            const responseWithPhase = `
## PHASE A: Discovery
My understanding of the goal...
            `;

            const score = calculateQualityScore(responseWithPhase, 'full');
            expect(score.compliance).toBeGreaterThan(80);
        });

        it('lowers compliance score when no phase detected in full mode', () => {
            const responseNoPhase = 'Here is the solution without phase structure.';

            const score = calculateQualityScore(responseNoPhase, 'full');
            expect(score.compliance).toBeLessThan(70);
        });
    });

    describe('getQualityBadgeColor', () => {
        it('returns green for scores >= 80', () => {
            expect(getQualityBadgeColor(80)).toContain('green');
            expect(getQualityBadgeColor(100)).toContain('green');
        });

        it('returns yellow for scores 60-79', () => {
            expect(getQualityBadgeColor(60)).toContain('yellow');
            expect(getQualityBadgeColor(79)).toContain('yellow');
        });

        it('returns orange for scores 40-59', () => {
            expect(getQualityBadgeColor(40)).toContain('orange');
            expect(getQualityBadgeColor(59)).toContain('orange');
        });

        it('returns red for scores < 40', () => {
            expect(getQualityBadgeColor(39)).toContain('red');
            expect(getQualityBadgeColor(0)).toContain('red');
        });
    });

    describe('getQualityLabel', () => {
        it('returns Vietnamese labels when language is vi', () => {
            expect(getQualityLabel(85, 'vi')).toBe('Xuất sắc');
            expect(getQualityLabel(65, 'vi')).toBe('Tốt');
            expect(getQualityLabel(45, 'vi')).toBe('Cần cải thiện');
            expect(getQualityLabel(30, 'vi')).toBe('Chưa đạt');
        });

        it('returns English labels when language is en', () => {
            expect(getQualityLabel(85, 'en')).toBe('Excellent');
            expect(getQualityLabel(65, 'en')).toBe('Good');
            expect(getQualityLabel(45, 'en')).toBe('Needs improvement');
            expect(getQualityLabel(30, 'en')).toBe('Below standard');
        });
    });

    describe('shouldRequireAcceptance', () => {
        it('returns false for simple mode', () => {
            expect(shouldRequireAcceptance('simple')).toBe(false);
        });

        it('returns true for governance mode', () => {
            expect(shouldRequireAcceptance('governance')).toBe(true);
        });

        it('returns true for full mode', () => {
            expect(shouldRequireAcceptance('full')).toBe(true);
        });
    });
});
