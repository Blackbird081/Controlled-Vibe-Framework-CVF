import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestHomeSpecJev } from '@/lib/home-spec-jev-client';
import { HomeAssfSuggestion } from './HomeAssfSuggestion';

vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: vi.fn() }));

const runId = '32bd4677-5320-42c6-953e-7111bf502fe8';
const goal = 'Test the rendered checkout before release';
const suggestion = {
    title: 'CVF Engineering Browser Runtime Verification',
    href: '/skills/agent_system_skills/cvf-engineering-browser-runtime-verification',
};

describe('Home ASSF suggestion', () => {
    beforeEach(() => vi.resetAllMocks());

    it('requests an advisory package only when the operator chooses the action', async () => {
        const onSuggestion = vi.fn();
        vi.mocked(requestHomeSpecJev).mockResolvedValue({ skill: suggestion });
        render(<HomeAssfSuggestion runId={runId} goal={goal} language="en" onSuggestion={onSuggestion} />);
        expect(requestHomeSpecJev).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Suggest a skill for the assistant doing the work' }));
        const link = await screen.findByRole('link', { name: suggestion.title });
        expect(link.getAttribute('href')).toBe(suggestion.href);
        expect(requestHomeSpecJev).toHaveBeenCalledExactlyOnceWith({ action: 'skills', runId, goal });
        expect(onSuggestion).toHaveBeenCalledWith('cvf-engineering-browser-runtime-verification');
    });

    it('keeps the existing handoff when the response has no valid ASSF route', async () => {
        const onSuggestion = vi.fn();
        vi.mocked(requestHomeSpecJev).mockResolvedValue({ skill: { ...suggestion, href: 'https://example.test/' } });
        render(<HomeAssfSuggestion runId={runId} goal={goal} language="en" onSuggestion={onSuggestion} />);
        fireEvent.click(screen.getByRole('button', { name: 'Suggest a skill for the assistant doing the work' }));
        await waitFor(() => expect(screen.getByRole('status').textContent).toBe('No additional package was suggested.'));
        expect(onSuggestion).not.toHaveBeenCalled();
        expect(screen.queryByRole('link')).toBeNull();
    });
});
