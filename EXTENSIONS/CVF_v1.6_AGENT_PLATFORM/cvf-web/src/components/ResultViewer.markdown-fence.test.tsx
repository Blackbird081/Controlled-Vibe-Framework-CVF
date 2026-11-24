/**
 * @vitest-environment jsdom
 * Test: ResultViewer - whole-output ```markdown fences render as formatted markdown
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ResultViewer } from './ResultViewer';

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: 'en',
        t: (key: string) => key,
    }),
}));

const FENCED_OUTPUT = '```markdown\n## Section Title\n\nA formatted **paragraph** of text.\n\n- Item A\n- Item B\n```';

const baseExecution = {
    id: 'exec-fence-1',
    templateId: 'business_plan',
    templateName: 'Business Plan',
    intent: 'Create a business plan',
    status: 'completed' as const,
    createdAt: new Date('2026-02-15T10:00:00Z'),
    qualityScore: 85,
    input: { prompt: 'Test' },
};

const baseProps = {
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onRetry: vi.fn(),
    onBack: vi.fn(),
};

describe('ResultViewer whole-output markdown fence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders a fenced-markdown output as an h2 and a p, not a single pre block', () => {
        const { container } = render(
            <ResultViewer
                {...baseProps}
                execution={{ ...baseExecution, output: FENCED_OUTPUT }}
                output={FENCED_OUTPUT}
            />
        );

        const prose = container.querySelector('.prose');
        expect(prose).toBeTruthy();
        const heading = prose!.querySelector('h2');
        expect(heading?.textContent).toBe('Section Title');
        const paragraph = prose!.querySelector('p');
        expect(paragraph?.textContent).toContain('A formatted paragraph of text.');
        expect(prose!.querySelectorAll('li').length).toBe(2);
        expect(prose!.querySelector('pre')).toBeNull();
    });

    it('renders the fenced-markdown main output in the pack preview as formatted markdown', () => {
        const { container } = render(
            <ResultViewer
                {...baseProps}
                onFollowUp={vi.fn()}
                execution={{ ...baseExecution, output: FENCED_OUTPUT }}
                output={FENCED_OUTPUT}
            />
        );

        const preview = container.querySelector('[data-testid="deliverable-pack-preview"]');
        expect(preview).toBeTruthy();
        const mainOutput = preview!.querySelector('.prose');
        expect(mainOutput).toBeTruthy();
        expect(mainOutput!.querySelector('h2')?.textContent).toBe('Section Title');
        expect(mainOutput!.querySelector('pre')).toBeNull();
    });

    it('still renders an ordinary ts fence as a code block', () => {
        const tsOutput = '```ts\nconst a = 1;\n```';
        const { container } = render(
            <ResultViewer
                {...baseProps}
                execution={{ ...baseExecution, output: tsOutput }}
                output={tsOutput}
            />
        );

        const prose = container.querySelector('.prose');
        expect(prose!.querySelector('pre')).toBeTruthy();
    });
});
