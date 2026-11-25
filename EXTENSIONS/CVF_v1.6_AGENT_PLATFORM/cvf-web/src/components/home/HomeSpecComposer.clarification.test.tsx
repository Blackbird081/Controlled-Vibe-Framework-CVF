// Text Encoding Exception: this exercises the Vietnamese and English labels visible on Home.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { HomeSpecClarificationAvailability } from './HomeSpecClarification';
import { HomeSpecComposer } from './HomeSpecComposer';

const fixtures = vi.hoisted(() => ({ jev: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: fixtures.jev }));
const clarification = { summary: ['Keep one row per shipment.'], questions: ['Who enters the rows?'] };

async function openReview(availability: 'ready' | 'missing_key' = 'ready', language: 'en' | 'vi' = 'en') {
    const viLabels = { forGoal: 'Bạn muốn tạo gì?', next: 'Tiếp tục', generic: 'Tạo đặc tả chung', review: 'Xem lại đặc tả' };
    const enLabels = { forGoal: 'What do you want to create?', next: 'Continue', generic: 'Create a general specification', review: 'Review specification' };
    const labels = language === 'vi' ? viLabels : enLabels;
    render(<HomeSpecAccountScope.Provider value={{ accountScope: 'home-clarity-ui' }}>
        <HomeSpecClarificationAvailability.Provider value={availability}>
            <HomeSpecComposer language={language} library={null} />
        </HomeSpecClarificationAvailability.Provider>
    </HomeSpecAccountScope.Provider>);
    fireEvent.change(screen.getByRole('textbox', { name: labels.forGoal }), { target: { value: 'Observe migratory owls' } });
    fireEvent.click(screen.getByRole('button', { name: labels.next }));
    fireEvent.click(await screen.findByRole('button', { name: labels.generic }));
    fireEvent.click(screen.getByRole('button', { name: labels.review }));
}

describe('Optional AI clarification of the Home specification', () => {
    beforeEach(() => {
        sessionStorage.clear();
        fixtures.jev.mockReset().mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'clarification-ui', decision: 'clarify', topNoMatch: true } : { enabled: false });
        fixtures.fetch.mockReset().mockImplementation(async () => Response.json({ status: 'ready', clarification }));
        vi.stubGlobal('fetch', fixtures.fetch);
    });

    afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

    it('only runs on click and uses the same optional text in preview and download', async () => {
        const blob = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fixture');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        const read = (index: number) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(blob.mock.calls[index][0] as Blob);
        });
        await openReview();
        expect(fixtures.fetch).not.toHaveBeenCalled();
        const download = screen.getByRole('button', { name: 'Download specification' });
        fireEvent.click(download);
        const original = await read(0);
        const button = screen.getByRole('button', { name: 'Ask AI to clarify' });
        fireEvent.click(button);
        fireEvent.click(button);
        const panel = await screen.findByRole('region', { name: 'AI clarification — for reference only' });
        expect(within(panel).getByText(clarification.summary[0])).toBeTruthy();
        expect(within(panel).getByText(clarification.questions[0])).toBeTruthy();
        expect(panel.textContent).not.toMatch(/gpt|processing|\d+%/i);
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
        expect(JSON.parse(fixtures.fetch.mock.calls[0][1].body)).toMatchObject({ goal: 'Observe migratory owls', language: 'en' });
        fireEvent.click(download);
        const enriched = await read(1);
        expect(Buffer.from(enriched).subarray(0, Buffer.byteLength(original))).toEqual(Buffer.from(original));
        expect(enriched.slice(original.length)).toContain('## AI clarification — for reference only');
        expect(enriched.slice(original.length)).toContain(clarification.summary[0]);
        expect(enriched.slice(original.length)).toContain(clarification.questions[0]);
    });

    it('shows a disabled action and a plain explanation in Vietnamese when there is no server key', async () => {
        await openReview('missing_key', 'vi');
        const button = screen.getByRole('button', { name: 'Nhờ AI làm rõ' });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/chưa có khóa để dùng AI/i)).toBeTruthy();
        expect((screen.getByRole('button', { name: 'Tải bản đặc tả' }) as HTMLButtonElement).disabled).toBe(false);
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('accepts a clarification with questions and no summary', async () => {
        fixtures.fetch.mockResolvedValueOnce(Response.json({ status: 'ready', clarification: { summary: [], questions: clarification.questions } }));
        await openReview();
        fireEvent.click(screen.getByRole('button', { name: 'Ask AI to clarify' }));
        const panel = await screen.findByRole('region', { name: 'AI clarification — for reference only' });
        expect(within(panel).getByText(clarification.questions[0])).toBeTruthy();
        expect(panel.querySelector('p')).toBeNull();
    });

    it.each([
        ['timeout', /took too long/i], ['format_error', /could not use the answer/i],
        ['limit', /reached today's limit/i], ['provider_error', /could not connect/i],
    ])('keeps the original available when clarification returns %s', async (status, message) => {
        fixtures.fetch.mockResolvedValueOnce(Response.json({ status }, { status: 503 }));
        await openReview();
        fireEvent.click(screen.getByRole('button', { name: 'Ask AI to clarify' }));
        expect(await screen.findByText(message)).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'AI clarification — for reference only' })).toBeNull();
        expect((screen.getByRole('button', { name: 'Download specification' }) as HTMLButtonElement).disabled).toBe(false);
    });
});
