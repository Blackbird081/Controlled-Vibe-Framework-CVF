/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { parseNaturalPolicy, getDecisionColor } from './natural-policy-parser';

describe('natural-policy-parser', () => {
    it('returns empty array when no decisions are found', () => {
        const rules = parseNaturalPolicy('just a statement without policy');
        expect(rules).toEqual([]);
    });

    it('parses English allow rule with intent', () => {
        const rules = parseNaturalPolicy('Allow read file access');
        expect(rules).toHaveLength(1);
        expect(rules[0]).toMatchObject({
            decision: 'allow',
            resource: 'filesystem',
            action: 'access',
            confidence: 0.8,
        });
    });

    it('parses Vietnamese deny rule with intent', () => {
        const rules = parseNaturalPolicy('Không cho xóa ngay');
        expect(rules).toHaveLength(1);
        expect(rules[0]).toMatchObject({
            decision: 'deny',
            resource: 'filesystem',
            action: 'delete',
            confidence: 0.8,
        });
    });

    it('prefers higher priority decisions when multiple are present', () => {
        const rules = parseNaturalPolicy('allow but deny sending email');
        expect(rules[0].decision).toBe('deny');
        expect(rules[0].resource).toBe('email');
        expect(rules[0].action).toBe('send');
    });

    it('falls back to unknown intent with lower confidence', () => {
        const rules = parseNaturalPolicy('review this carefully');
        expect(rules).toHaveLength(1);
        expect(rules[0]).toMatchObject({
            decision: 'review',
            resource: 'unknown',
            action: 'unknown',
            confidence: 0.3,
        });
    });

    it('maps decision to UI color tokens', () => {
        expect(getDecisionColor('allow')).toContain('emerald');
        expect(getDecisionColor('deny')).toContain('red');
        expect(getDecisionColor('review')).toContain('amber');
        expect(getDecisionColor('sandbox')).toContain('purple');
        expect(getDecisionColor('other')).toContain('gray');
    });
});
