import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, fireEvent, within } from '@testing-library/react';
import { TemplateCard } from './TemplateCard';
import { templates } from '@/lib/templates';

vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));

const template = templates.find(item => item.id === 'strategy_analysis')!;

describe('TemplateCard hydration readiness', () => {
    it('marks server HTML and its child actions unavailable before handlers exist', () => {
        const host = document.createElement('div');
        host.innerHTML = renderToString(<TemplateCard template={template} onClick={vi.fn()}
            onTry={vi.fn()} onPreview={vi.fn()} />);
        const card = host.querySelector('[role="button"]')!;
        expect(card.getAttribute('aria-disabled')).toBe('true');
        expect(card.getAttribute('tabindex')).toBe('-1');
        for (const button of host.querySelectorAll('button')) expect(button.disabled).toBe(true);
    });

    it('enables hydrated actions and dispatches one card selection', async () => {
        const select = vi.fn();
        const host = document.createElement('div');
        document.body.appendChild(host);
        const element = <TemplateCard template={template} onClick={select} />;
        host.innerHTML = renderToString(element);
        let root: ReturnType<typeof hydrateRoot>;
        try {
            await act(async () => { root = hydrateRoot(host, element); });
            const card = within(host).getByRole('button');
            expect(card.getAttribute('aria-disabled')).toBe('false');
            expect(card.getAttribute('tabindex')).toBe('0');
            fireEvent.click(card);
            expect(select).toHaveBeenCalledTimes(1);
        } finally {
            await act(async () => { root!.unmount(); });
            host.remove();
        }
    });
});
