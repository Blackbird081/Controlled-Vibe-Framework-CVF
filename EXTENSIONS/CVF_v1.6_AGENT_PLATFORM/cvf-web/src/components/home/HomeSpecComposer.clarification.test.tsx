// Text Encoding Exception: this exercises the Vietnamese and English labels visible on Home.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { HomeSpecComposer } from './HomeSpecComposer';

const fixtures = vi.hoisted(() => ({ jev: vi.fn(), fetch: vi.fn(), key: '' }));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: fixtures.jev }));
vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ isLoaded:true, settings:{ providers:{ openai:{ apiKey:fixtures.key } } } }),
}));
const key = 'sk-test-home-clarification-secret';
const endpoint = 'https://api.openai.com/v1/chat/completions';
const clarification = { summary: ['Keep one row per shipment.'], questions: ['Who enters the rows?'] };
const providerAnswer = (content:string) => Response.json({
    model:'gpt-6-luna', choices:[{ finish_reason:'stop', message:{ content } }],
});

async function openReview(language: 'en' | 'vi' = 'en', signedIn = true, canUseSavedProviderKey = true) {
    const viLabels = { forGoal: 'Bạn muốn tạo gì?', next: 'Tiếp tục', generic: 'Tạo đặc tả chung', review: 'Xem lại đặc tả' };
    const enLabels = { forGoal: 'What do you want to create?', next: 'Continue', generic: 'Create a general specification', review: 'Review specification' };
    const labels = language === 'vi' ? viLabels : enLabels;
    render(<HomeSpecAccountScope.Provider value={{ accountScope: signedIn ? 'home-clarity-ui' : undefined, canUseSavedProviderKey }}>
        <HomeSpecComposer language={language} library={null} />
    </HomeSpecAccountScope.Provider>);
    fireEvent.change(screen.getByRole('textbox', { name: labels.forGoal }), { target: { value: 'Observe migratory owls' } });
    fireEvent.click(screen.getByRole('button', { name: labels.next }));
    fireEvent.click(await screen.findByRole('button', { name: labels.generic }));
    fireEvent.click(screen.getByRole('button', { name: labels.review }));
}

describe('Optional AI clarification of the Home specification', () => {
    beforeEach(() => {
        sessionStorage.clear();
        fixtures.key = key;
        fixtures.jev.mockReset().mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'clarification-ui', decision: 'clarify', topNoMatch: true } : { enabled: false });
        fixtures.fetch.mockReset().mockImplementation(async () => providerAnswer(clarification.summary[0] + '\n\nOpen questions\n1. ' + clarification.questions[0]));
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
        const [url, request] = fixtures.fetch.mock.calls[0];
        expect(url).toBe(endpoint);
        expect(request).toMatchObject({
            method:'POST', credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', redirect:'error',
            headers:{ authorization:`Bearer ${key}`, 'content-type':'application/json' },
        });
        expect(JSON.parse(request.body)).toMatchObject({
            model:'gpt-6-luna', reasoning_effort:'high', store:false,
            messages:[{role:'system',content:expect.any(String)},{role:'user',content:'Observe migratory owls'}],
        });
        expect(request.body).not.toContain(key);
        fireEvent.click(download);
        const enriched = await read(1);
        expect(Buffer.from(enriched).subarray(0, Buffer.byteLength(original))).toEqual(Buffer.from(original));
        expect(enriched.slice(original.length)).toContain('## AI clarification — for reference only');
        expect(enriched.slice(original.length)).toContain(clarification.summary[0]);
        expect(enriched.slice(original.length)).toContain(clarification.questions[0]);
        expect(enriched).not.toContain(key);
        expect(window.location.href).not.toContain(key);
    });

    it('shows a disabled action and a Settings link in Vietnamese when there is no personal key', async () => {
        fixtures.key = '';
        await openReview('vi');
        const button = screen.getByRole('button', { name: 'Nhờ AI làm rõ' });
        expect((button as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/Cần khóa OpenAI của bạn/i)).toBeTruthy();
        expect(screen.getByRole('link',{name:'Cài đặt'}).getAttribute('href')).toMatch(/\?open=settings$/);
        expect((screen.getByRole('button', { name: 'Tải bản đặc tả' }) as HTMLButtonElement).disabled).toBe(false);
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('accepts a clarification with questions and no summary', async () => {
        fixtures.fetch.mockResolvedValueOnce(providerAnswer('Open questions\n1. ' + clarification.questions[0]));
        await openReview('en',false);
        fireEvent.click(screen.getByRole('button', { name: 'Ask AI to clarify' }));
        const panel = await screen.findByRole('region', { name: 'AI clarification — for reference only' });
        expect(within(panel).getByText(clarification.questions[0])).toBeTruthy();
        expect(panel.querySelector('p')).toBeNull();
    });

    it.each([
        [401, /key was refused/i], [403, /key was refused/i],
        [429, /OpenAI is limiting requests/i], [502, /could not connect/i],
    ])('keeps the original available when clarification returns %s', async (status, message) => {
        fixtures.fetch.mockResolvedValueOnce(Response.json({ error:{message:key} }, { status }));
        await openReview();
        fireEvent.click(screen.getByRole('button', { name: 'Ask AI to clarify' }));
        expect(await screen.findByText(message)).toBeTruthy();
        expect(screen.queryByRole('region', { name: 'AI clarification — for reference only' })).toBeNull();
        expect((screen.getByRole('button', { name: 'Download specification' }) as HTMLButtonElement).disabled).toBe(false);
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(key)).toBeNull();
    });

    it.each([
        'A key should not appear in any result: ' + key,
        '```broken output```',
    ])('does not expose unusable provider text in the result or copy', async (content) => {
        fixtures.fetch.mockResolvedValueOnce(providerAnswer(content));
        const write = vi.spyOn(navigator.clipboard,'writeText').mockResolvedValue(undefined);
        await openReview();
        fireEvent.click(screen.getByRole('button', { name:'Ask AI to clarify' }));
        expect(await screen.findByText(/could not use the answer/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button',{name:'Copy'}));
        expect(write).toHaveBeenCalledTimes(1);
        expect(write.mock.calls[0][0]).not.toContain(key);
        expect(screen.queryByRole('region', { name:'AI clarification — for reference only' })).toBeNull();
    });

    it('reports a 25-second timeout and leaves downloading enabled without a retry', async () => {
        const deadline = new AbortController();
        const timeout = vi.spyOn(AbortSignal,'timeout').mockReturnValue(deadline.signal);
        fixtures.fetch.mockImplementationOnce(async (_url, init) => new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort',() => reject(init.signal.reason),{once:true});
        }));
        await openReview();
        fireEvent.click(screen.getByRole('button',{name:'Ask AI to clarify'}));
        expect(timeout).toHaveBeenCalledWith(25_000);
        deadline.abort(new DOMException('Timed out','TimeoutError'));
        expect(await screen.findByText(/AI took too long/)).toBeTruthy();
        expect(fixtures.fetch).toHaveBeenCalledTimes(1);
        expect((screen.getByRole('button',{name:'Download specification'}) as HTMLButtonElement).disabled).toBe(false);
    });

    it.each([
        'The air conditioner is leaking water onto a wall outlet.',
        'Book me a room for tomorrow.',
    ])('keeps the clarification control absent for restricted work: %s', async goal => {
        render(<HomeSpecComposer language="en" library={null} />);
        fireEvent.change(screen.getByRole('textbox',{name:'What do you want to create?'}), {target:{value:goal}});
        fireEvent.click(screen.getByRole('button',{name:'Continue'}));
        expect(await screen.findByRole('heading',{name:'CVF cannot take actions outside this site'})).toBeTruthy();
        expect(screen.queryByRole('button',{name:'Ask AI to clarify'})).toBeNull();
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });

    it('does not reuse a saved key when the dashboard already limits access to Settings', async () => {
        await openReview('en',true,false);
        expect((screen.getByRole('button',{name:'Ask AI to clarify'}) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByRole('link',{name:'View setup instructions'}).getAttribute('href')).toBe('/help/setup');
        expect(fixtures.fetch).not.toHaveBeenCalled();
    });
});
