import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { HomeSpecComposer } from './HomeSpecComposer';

const request = vi.hoisted(() => vi.fn());
vi.mock('@/components/Settings', () => ({
    useSettings: () => ({
        settings: { providers: { openai: { apiKey: 'synthetic', selectedModel: 'gpt-4o-mini' } }, preferences: { defaultProvider: 'openai' } },
    }),
}));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: request }));

describe('Home specification plain language', () => {
    beforeEach(() => {
        sessionStorage.clear();
        request.mockReset();
    });
    afterEach(cleanup);

    it('describes the automatic suggestion without naming its technical service', () => {
        render(<HomeSpecComposer language="en" providers={[]} library={null} />);
        expect(screen.queryByText(/when jev is on/i)).toBeNull();
        expect(screen.getByText(/when automatic suggestions are on/i)).toBeTruthy();
    });

    it('keeps the writer identifiers inside collapsed technical details', async () => {
        request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-run', templateId: 'web_build_handoff', decision: 'preselect', probability: 0.94 }
            : payload.action === 'fields' ? { missing: [] } : { enabled: true });
        render(<HomeSpecAccountScope.Provider value={{ accountScope: 'home-language-fixture', canUseSettings: true }}>
            <HomeSpecComposer language="en" providers={[]} library={null} />
        </HomeSpecAccountScope.Provider>);
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: 'A bakery preorder site' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('button', { name: 'Use this outcome' });
        expect(screen.queryByText('Jev suggestion')).toBeNull();
        expect(screen.getByText('Automatic suggestion')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));

        const details = screen.getByText(/gpt-4o-mini/i).closest('details');
        expect(details?.open).toBe(false);
        expect(details?.querySelector('summary')?.textContent).toContain('Technical details');
    });
});
