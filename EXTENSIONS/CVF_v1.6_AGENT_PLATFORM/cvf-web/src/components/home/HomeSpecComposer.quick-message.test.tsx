// Text Encoding Exception: tests use the Vietnamese sentences people type.
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecComposer } from './HomeSpecComposer';

const jev = vi.hoisted(() => vi.fn());
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: jev }));
vi.mock('@/components/Settings', () => ({ useSettings: () => ({ settings: { providers: {} } }) }));

beforeEach(() => jev.mockReset());

describe('a message to one person on Home', () => {
    it.each([
        ['vi', 'unavailable', 'nhắn giúp mình cho anh Dũng là thẻ tập hết hạn hôm 30'],
        ['vi', 'disabled', 'hoi chi Thao xem co qua lay ban sao chieu nay khong'],
        ['en', 'available', 'ask Mrs Patel if she can pick up Sam at 4'],
    ] as const)('offers the assistant as the primary action in %s when Jev is %s', async (language, fallback, goal) => {
        jev.mockResolvedValue(fallback === 'available' ? { decision: 'preselect', templateId: 'documentation' } : { decision: 'fallback', fallback });
        render(<HomeSpecComposer language={language} library={null} />);
        const viLanguage = language === 'vi';
        const quickLabel = viLanguage ? 'Làm ngay với trợ lý AI' : 'Work directly with AI assistant';
        const continueLabel = viLanguage ? 'Tiếp tục' : 'Continue';
        fireEvent.change(screen.getByRole('textbox'), { target: { value: goal } });
        expect(screen.getByRole('button', { name: quickLabel }).className).toContain('bg-indigo-600');
        expect(screen.getByRole('button', { name: continueLabel }).className).not.toContain('bg-indigo-600');

        fireEvent.click(screen.getByRole('button', { name: continueLabel }));
        const assistant = await screen.findByRole('button', { name: quickLabel });
        const spec = screen.getByRole('button', { name: viLanguage ? 'Tạo đặc tả' : 'Create specification' });
        expect(assistant.className).toContain('bg-indigo-600');
        expect(spec.className).not.toContain('bg-indigo-600');
        expect(jev).not.toHaveBeenCalled();

        const opened = vi.fn();
        window.addEventListener('cvf:openAgent', opened, { once: true });
        try {
            fireEvent.click(assistant);
            expect(opened).toHaveBeenCalledWith(expect.objectContaining({ detail: { draft: goal } }));
        } finally {
            window.removeEventListener('cvf:openAgent', opened);
        }
        fireEvent.click(spec);
        expect(screen.getByRole('button', { name: viLanguage ? 'Xem lại đặc tả' : 'Review specification' })).toBeTruthy();
    });

    it('keeps the assistant primary for a personal message after the suggestion service actually failed', async () => {
        jev.mockResolvedValue({ decision: 'fallback', fallback: 'unavailable' });
        render(<HomeSpecComposer language="en" library={null} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Build a planning tool' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        expect(await screen.findByText('The suggestion service did not respond. CVF is using keywords to suggest an outcome.')).toBeTruthy();
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
        try {
            fireEvent.click(screen.getByRole('button', { name: 'Start new work' }));
        } finally {
            confirm.mockRestore();
        }
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Text Maria that the key is in the office' } });
        expect(screen.getByRole('button', { name: 'Work directly with AI assistant' }).className).toContain('bg-indigo-600');
        expect(jev).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['Text Maya that there are sparks coming from the outlet', true],
        ['Book me a room and text Maya the reservation', false],
    ])('leaves safety and external-action checks in charge for %s', async (goal, hazard) => {
        render(<HomeSpecComposer language="en" library={null} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: goal } });
        expect(screen.getByRole('button', { name: 'Continue' }).className).toContain('bg-indigo-600');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        expect(await screen.findByRole('heading', { name: 'CVF cannot take actions outside this site' })).toBeTruthy();
        expect(Boolean(screen.queryByText(/^Move away from the danger/))).toBe(hazard);
        expect(jev).not.toHaveBeenCalled();
    });
});
