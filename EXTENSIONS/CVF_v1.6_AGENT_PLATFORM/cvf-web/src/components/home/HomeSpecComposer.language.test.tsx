// Text Encoding Exception: this regression checks the Vietnamese Home copy verbatim.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { HomeSpecComposer } from './HomeSpecComposer';

const request = vi.hoisted(() => vi.fn());
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: request }));

describe('Home specification plain language', () => {
    beforeEach(() => {
        sessionStorage.clear();
        request.mockReset();
    });
    afterEach(cleanup);

    it('describes the automatic suggestion without naming its technical service', () => {
        render(<HomeSpecComposer language="en" library={null} />);
        expect(screen.queryByText(/when jev is on/i)).toBeNull();
        expect(screen.getByText(/when automatic suggestions are on/i)).toBeTruthy();
    });

    it('uses plain Vietnamese for details taken from the description', async () => {
        request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-vi', templateId: 'web_build_handoff', decision: 'preselect', probability: 0.94 }
            : payload.action === 'fields' ? { missing: [] } : { enabled: true });
        render(<HomeSpecComposer language="vi" library={null} />);
        fireEvent.change(screen.getByRole('textbox', { name: 'Bạn muốn tạo gì?' }), {
            target: { value: 'Soạn nội dung trang giới thiệu cho cửa hàng.' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Dùng loại kết quả này' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Xem lại đặc tả' }));
        const article = screen.getByRole('article', { name: 'Bản đặc tả' });
        expect(article.textContent).toContain('Lấy từ phần bạn mô tả (chưa nhập riêng)');
        expect(article.textContent).not.toContain('User Context');
    });

    it('keeps the agent packet in collapsed technical details without writer identifiers', async () => {
        request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-run', templateId: 'web_build_handoff', decision: 'preselect', probability: 0.94 }
            : payload.action === 'fields' ? { missing: [] } : { enabled: true });
        render(<HomeSpecAccountScope.Provider value={{ accountScope: 'home-language-fixture' }}>
            <HomeSpecComposer language="en" library={null} />
        </HomeSpecAccountScope.Provider>);
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: 'A bakery preorder site' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        await screen.findByRole('button', { name: 'Use this outcome' });
        expect(screen.queryByText('Jev suggestion')).toBeNull();
        expect(screen.getByText('Automatic suggestion')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));

        const details = screen.getByTestId('home-spec-agent-details') as HTMLDetailsElement;
        expect(details?.open).toBe(false);
        expect(details?.querySelector('summary')?.textContent).toContain('Technical details');
        expect(details?.textContent).not.toMatch(/gpt-4o-mini|AI clarification/i);
    });
});
