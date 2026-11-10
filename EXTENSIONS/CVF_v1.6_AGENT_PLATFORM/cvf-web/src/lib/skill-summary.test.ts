// Text Encoding Exception: Native Vietnamese fixture strings are supplied by the shared ASCII JSON vectors.
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { summarizeSkillContent } from './skill-summary';
import { parseVisibleSkills } from './server/jev-capability-suggestion';
import vectors from '../../scripts/fixtures/skill-summary-vectors.json';

const require = createRequire(import.meta.url);
const common = require('../../scripts/skill-summary.js') as {
    summarizeSkillContent: (content: string) => string;
    serializeAsciiJson: (value: unknown) => string;
};

describe('delivered-content summaries', () => {
    for (const vector of vectors) {
        it(`matches the actual native parser and shared expectation: ${vector.id}`, () => {
            const native = parseVisibleSkills({ categories: [{ id: 'sample', skills: [{
                id: 'v0', title: 'S', domain: 'D', content: vector.content,
                frontDoorVisible: true, allowedRoles: 'User',
            }] }] })[0].description.slice('S (D). '.length);
            // The sole declared native delta removes bold markers after clipping.
            const expected = native.replace(/\*\*/g, '');
            expect(summarizeSkillContent(vector.content)).toBe(expected);
            expect(common.summarizeSkillContent(vector.content)).toBe(expected);
            expect(expected).toBe(vector.expected);
        });
    }
});

describe('canonical ASCII JSON serialization', () => {
    it('preserves BMP, surrogate pairs, lone surrogates and literal escapes as JSON values', () => {
        const value = { bmp: '\u1ee5', pair: '\ud83d\ude80', lone: '\ud800', slash: '\\u1ee5', del: '\u007f' };
        const raw = common.serializeAsciiJson(value);
        expect(raw).toMatch(/^[\x00-\x7f]*$/);
        expect(raw).toContain('\\ud83d\\ude80');
        expect(raw).toContain('\\ud800');
        expect(raw).toContain('\\\\u1ee5');
        expect(JSON.parse(raw)).toEqual(value);
        expect(common.serializeAsciiJson(JSON.parse(raw))).toBe(raw);
    });
});
