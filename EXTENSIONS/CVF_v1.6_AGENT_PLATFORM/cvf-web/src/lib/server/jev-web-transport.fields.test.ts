import { CredentialBoundary } from 'cvf-model-gateway';
import { describe, expect, it, vi } from 'vitest';
import { getHomeSpecFields, homeSpecTemplates } from '@/lib/home-spec-jev-catalog';
import { getHomeCommonQuestions } from '@/lib/home-spec-common-questions';
import { WebJevTransport } from './jev-web-transport';
import type { WebJevStore } from './jev-web-store';

describe('Home description field confirmation', () => {
    it('checks optional details in the existing narrow format without duplicating template fields', async () => {
        const reserve = vi.fn(() => 'attempt');
        const settle = vi.fn();
        const store = { reserve, settle } as unknown as WebJevStore;
        const seen: string[] = [];
        const referencePrompts: string[] = [];
        const transport = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body));
            const entries = Object.entries(body.questions.which.criteria) as [string, string][];
            expect(entries.length).toBeLessThanOrEqual(3);
            seen.push(...entries.map(([, label]) => label));
            const pointer = entries.find(([, label]) => label.includes('specific files, examples or references'));
            if (pointer) {
                referencePrompts.push(body.questions[`fits_${pointer[0]}`].instructions);
            }
            const [first] = entries[0];
            const answers = Object.fromEntries(entries.map(([id, label]) => [
                `fits_${id}`, { type: 'noul', noul: label === 'items explicitly excluded from the first version' ? 0.1 : 0.9 },
            ]));
            return Response.json({
                model: 'typesafe/jev-1.14-20261014',
                answers: {
                    which: { type: 'choice', choice: first, probabilities: Object.fromEntries(entries.map(([id]) => [id, Number(id === first)])) },
                    ...answers,
                },
                usage: { input_tokens: 60, output_tokens: 0, cost: 0.000005 },
            });
        });
        const client = new WebJevTransport(store, 'fixture-user', async () => true, new AbortController().signal, {
            credential: new CredentialBoundary({ OPENROUTER_API_KEY: 'synthetic' }), transport,
        });

        for (const { id } of homeSpecTemplates) {
            seen.length = 0;
            referencePrompts.length = 0;
            vi.clearAllMocks();
            const result = await client.fields('Build a simple page for local orders.', id);
            const questions = getHomeCommonQuestions('en');
            expect(result).toEqual([{ id: 'outOfScope', label: questions[1].descriptionField }]);
            for (const { descriptionField } of questions) {
                expect(seen.filter(label => label === descriptionField)).toHaveLength(1);
            }
            expect(referencePrompts).toHaveLength(1);
            expect(referencePrompts[0]).toContain('Count an explicit name or link even if the user says they will send it later.');
            expect(referencePrompts[0]).toContain('A vague promise without a name or link does not count.');
            expect(referencePrompts[0]).not.toMatch(/do not give credit for promised future information/i);
            const previousCalls = Math.ceil(getHomeSpecFields(id).length / 3);
            expect(transport.mock.calls.length).toBeLessThanOrEqual(previousCalls + 1);
            expect(transport.mock.calls.length).toBeLessThanOrEqual(4);
            expect(reserve).toHaveBeenCalledTimes(transport.mock.calls.length);
            expect(settle).toHaveBeenCalledTimes(transport.mock.calls.length);
        }
    });
});
