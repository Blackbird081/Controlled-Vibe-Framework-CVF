// Text Encoding Exception: Vietnamese fixture text in the non-Home export guard.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSpec } from './SpecExport';
import type { Template } from '@/types';

// The Home de-duplication must never change the export of any other template. The fixture was captured
// from the generator before that change; compare it byte for byte.
const template: Template = {
    id: 'non-home-fixed-input',
    name: 'Fixed input template',
    icon: '',
    description: 'Template used only to guard the non-Home export.',
    category: 'business',
    intentPattern: 'Plan [goal] for [audience]. Goal again: [goal]',
    outputExpected: ['Plan', 'Risks'],
    outputTemplate: '## Plan for [goal]\n- ...\n\n## Audience\n- [audience]',
    fields: [
        { id: 'goal', type: 'text', label: 'Goal', required: true },
        { id: 'audience', type: 'textarea', label: 'Audience', required: true },
        { id: 'notes', type: 'text', label: 'Notes', required: false },
    ],
};
const values = { goal: 'Run a parent meeting for the kindergarten class', audience: 'Parents', notes: 'Run a parent meeting for the kindergarten class' };
const userContext = 'Run a parent meeting for the kindergarten class';
const fixturePath = join(__dirname, '__fixtures__', 'non-home-spec-export.fixture.json');

function build() {
    const out: Record<string, string> = {};
    for (const lang of ['en', 'vi'] as const) {
        for (const mode of ['simple', 'governance', 'full'] as const) {
            out[`${lang}-${mode}`] = generateSpec(template, values, lang, mode, userContext, 'low risk context');
        }
    }
    return out;
}

describe('non-Home generateSpec output', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-01-02T03:04:05Z')); });
    afterEach(() => { vi.useRealTimers(); });

    it('is byte-identical to the captured output for one fixed input', () => {
        const expected = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, string>;
        const actual = build();
        expect(Object.keys(actual)).toEqual(Object.keys(expected));
        for (const key of Object.keys(expected)) expect(actual[key], key).toBe(expected[key]);
    });

    it('still repeats the request wherever the template asks for it', () => {
        const text = build()['en-governance'];
        expect(text.split('Run a parent meeting for the kindergarten class').length - 1).toBeGreaterThan(3);
    });
});
