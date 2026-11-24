// Text Encoding Exception: assertions use the Vietnamese Home specification UI.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecComposer } from './HomeSpecComposer';

const { jev, keywords } = vi.hoisted(() => ({ jev: vi.fn(), keywords: vi.fn() }));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings: { preferences: { defaultProvider: 'openai' }, providers: { openai: {} } } }),
}));
vi.mock('@/lib/hooks/useAuth', () => ({
    useAuth: () => ({ accountScope: undefined, permissions: { canUseSettings: false } }),
}));
vi.mock('@/lib/hooks/useExecute', () => ({
    mapSettingsProviderToExecutionProvider: (provider: string) => provider,
}));
vi.mock('@/lib/quota-manager', () => ({ useQuotaManager: () => ({}) }));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: jev }));
vi.mock('@/lib/intent-router', () => ({ routeHomeSpecKeywords: keywords }));

const original = 'Tôi cần hướng dẫn cho nhân viên mới.';
const clarification = 'Viết quy trình bàn giao đơn hàng.';
const merged = `${original}\n${clarification}`;
const weak = { confidence: 'weak', recommendedTemplateId: null };
const strong = { confidence: 'strong', recommendedTemplateId: 'documentation' };
const firstChoice = { decision: 'clarify', runId: 'first' };
const secondChoice = { decision: 'preselect', templateId: 'documentation', runId: 'second', probability: 0.72 };
const clarifyLabel = 'Trợ lý cần biết thêm chi tiết nào?';

function start(goal = original, language: 'vi' | 'en' = 'vi') {
    render(<HomeSpecComposer language={language} library={<div>Thư viện</div>} providers={[]} />);
    fireEvent.change(screen.getByLabelText(language === 'vi' ? 'Bạn muốn tạo gì?' : 'What do you want to create?'), { target: { value: goal } });
    fireEvent.click(screen.getByRole('button', { name: language === 'vi' ? 'Tiếp tục' : 'Continue' }));
}

async function clarify(detail = clarification) {
    fireEvent.change(await screen.findByLabelText(clarifyLabel), { target: { value: detail } });
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
}

function chooseRequests() {
    return jev.mock.calls.map(([request]) => request).filter(request => request.action === 'choose');
}

beforeEach(() => {
    jev.mockReset().mockResolvedValue({});
    keywords.mockReset().mockReturnValue(weak);
});

describe('Home specification clarification', () => {
    it('shows first-round candidates beside clarification and permits their confirmation', async () => {
        jev.mockImplementation(async request => request.action === 'choose'
            ? { decision: 'clarify', runId: 'first', candidates: ['documentation'] }
            : request.action === 'fields' ? { missing: [] } : {});
        start();
        expect(await screen.findByLabelText(clarifyLabel)).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Có thể phù hợp' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Không mẫu nào phù hợp — tạo bản chung' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Mở thư viện mẫu' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Quy trình vận hành' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dùng loại kết quả này' }));
        await waitFor(() => expect(jev).toHaveBeenCalledWith({ action: 'fields', runId: 'first', templateId: 'documentation', goal: original }));
        expect(chooseRequests()).toHaveLength(1);
    });

    it('replaces first-round candidates with the latest round', async () => {
        jev.mockImplementation(async request => request.action === 'choose' ? {
            decision: 'clarify', runId: request.goal === original ? 'first' : 'second',
            candidates: request.goal === original ? ['documentation'] : ['email_template'],
        } : {});
        start();
        expect(await screen.findByRole('button', { name: 'Quy trình vận hành' })).toBeTruthy();
        await clarify();
        expect(await screen.findByRole('button', { name: 'Viết email' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Quy trình vận hành' })).toBeNull();
    });
    it('offers below-threshold candidates after clarification and confirms without another choice', async () => {
        jev.mockImplementation(async request => {
            if (request.action === 'choose') return request.goal === original ? firstChoice : {
                decision: 'clarify', runId: 'second', candidates: ['documentation', 'email_template'],
            };
            if (request.action === 'fields') return { missing: [] };
            return {};
        });
        start();
        await clarify();
        expect(await screen.findByRole('heading', { name: 'Có thể phù hợp' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Quy trình vận hành' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dùng loại kết quả này' }));
        await waitFor(() => expect(jev).toHaveBeenCalledWith({ action: 'fields', runId: 'second', templateId: 'documentation', goal: merged }));
        expect(chooseRequests()).toHaveLength(2);
    });

    it('keeps the unmatched screen when the top three contains only no_match', async () => {
        jev.mockImplementation(async request => request.action === 'choose'
            ? { decision: 'clarify', runId: 'second', candidates: [] } : {});
        start();
        await clarify();
        expect(await screen.findByRole('heading', { name: 'CVF chưa có mẫu cho việc này' })).toBeTruthy();
        expect(chooseRequests()).toHaveLength(2);
    });
    it.each([false, true])('shows recovery immediately when latest Jev top is no_match (prior clarification: %s)', async prior => {
        jev.mockImplementation(async request => request.action === 'choose'
            ? prior && request.goal === original ? { decision: 'clarify', runId: 'first', candidates: ['documentation'] }
                : { decision: 'clarify', runId: 'latest', topNoMatch: true, candidates: [] }
            : {});
        start();
        if (prior) await clarify();
        expect(await screen.findByRole('heading', { name: 'CVF chưa có mẫu cho việc này' })).toBeTruthy();
        expect(screen.queryByRole('heading', { name: 'Có thể phù hợp' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Tạo đặc tả chung' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Mở thư viện mẫu' })).toBeTruthy();
    });

    it('validates an empty description and an empty clarification visibly without asking Jev again', async () => {
        jev.mockResolvedValueOnce(firstChoice);
        start('');
        expect(screen.getByRole('alert').textContent).toBe('Nhập ít nhất 8 ký tự.');
        expect(chooseRequests()).toHaveLength(0);
        fireEvent.change(screen.getByLabelText('Bạn muốn tạo gì?'), { target: { value: original } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        await screen.findByLabelText(clarifyLabel);
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        expect(screen.getByRole('alert').textContent).toBe('Bổ sung câu trả lời trước khi tiếp tục.');
        expect(chooseRequests()).toHaveLength(1);
    });

    it.each([
        ['Jev', 'short_message', 'nhắn giúp em cho chị Lan là lịch 9h sáng mai dời qua 2h chiều được không'],
        ['keywords', 'email_template', 'viết thông báo cho cư dân mai cúp nước từ 8h tới 12h, nhờ trữ nước trước'],
    ])('prioritizes the assistant for a short suggestion from %s', async (source, templateId, goal) => {
        jev.mockImplementation(async request => request.action === 'choose' && source === 'Jev'
            ? { decision: 'preselect', runId: 'quick', templateId } : {});
        if (source === 'keywords') keywords.mockReturnValue({ confidence: 'strong', recommendedTemplateId: templateId });
        start(goal);
        const spec = await screen.findByRole('button', { name: 'Tạo đặc tả' });
        const quick = screen.getByRole('button', { name: 'Làm ngay với trợ lý AI' });
        expect(quick.nextElementSibling).toBe(spec);
        expect(quick.className).toContain('bg-indigo-600');
        expect(spec.className).not.toContain('bg-indigo-600');

        const opened = vi.fn();
        window.addEventListener('cvf:openAgent', opened, { once: true });
        try {
            fireEvent.click(quick);
            expect(opened).toHaveBeenCalledWith(expect.objectContaining({ detail: { draft: goal } }));
        } finally {
            window.removeEventListener('cvf:openAgent', opened);
        }
        fireEvent.click(spec);
        expect(await screen.findByRole('button', { name: 'Xem lại đặc tả' })).toBeTruthy();
    });

    it.each([
        ['H8.5', 'vi', 'đặt giúp em 30 hộp khẩu trang y tế trên Shopee giao tới phòng khám', false],
        ['H9.5', 'en', 'order me a flat white and a croissant from the cafe near the venue for 8am', false],
        ['H10.5', 'vi', 'gọi thợ sửa ống nước lên ngay căn 302 giùm mình', true],
        ['V1.4', 'vi', 'Máy lạnh ở tiệm bị chảy nước, tôi phải làm sao?', true],
        ['gas', 'en', 'I smell gas next to the stove. What should I do?', true],
    ] as const)('explains the real-world boundary and offers a draft for %s', async (_case, language, goal, hazard) => {
        jev.mockResolvedValueOnce(secondChoice);
        start(goal, language);
        const viLanguage = language === 'vi';
        expect(await screen.findByRole('heading', {
            name: viLanguage ? 'CVF không thực hiện hành động bên ngoài' : 'CVF cannot take actions outside this site',
        })).toBeTruthy();
        const safety = screen.queryByText(viLanguage ? /Hãy rời vùng nguy hiểm/ : /Move away from the danger/);
        expect(Boolean(safety)).toBe(hazard);
        if (safety) expect(safety.textContent).not.toMatch(/\d/);
        expect(screen.queryByRole('button', { name: /tạo đặc tả chung|create a general specification/i })).toBeNull();
        expect(chooseRequests()).toEqual([]);

        const opened = vi.fn();
        window.addEventListener('cvf:openAgent', opened, { once: true });
        try {
            fireEvent.click(screen.getByRole('button', { name: viLanguage
                ? 'Soạn tin nhắn hoặc danh sách việc cần làm' : 'Draft a message or checklist' }));
            expect(opened).toHaveBeenCalledWith(expect.objectContaining({ detail: {
                draft: expect.stringContaining(goal),
            } }));
        } finally {
            window.removeEventListener('cvf:openAgent', opened);
        }
        fireEvent.click(screen.getByRole('button', { name: viLanguage ? 'Sửa mô tả' : 'Edit your description' }));
        expect((screen.getByLabelText(viLanguage ? 'Bạn muốn tạo gì?' : 'What do you want to create?') as HTMLTextAreaElement).value).toBe(goal);
    });

    it.each(['Tạo mẫu đặt chỗ cho phòng khám', 'Write a guide for staff in case of a gas leak'])(
        'continues to suggestions for a requested deliverable: %s',
        async goal => {
            jev.mockResolvedValueOnce(secondChoice);
            start(goal);
            expect(await screen.findByRole('button', { name: 'Dùng loại kết quả này' })).toBeTruthy();
            expect(chooseRequests()).toHaveLength(1);
        },
    );

    it('keeps creating a specification first for long work', async () => {
        jev.mockResolvedValueOnce(secondChoice);
        start();
        expect(await screen.findByRole('button', { name: 'Dùng loại kết quả này' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Làm ngay với trợ lý AI' })).toBeNull();
    });

    it('asks Jev once more with both answers and uses the calibrated recommendation', async () => {
        jev.mockImplementation(async request => {
            if (request.action === 'choose') return request.goal === original ? firstChoice : secondChoice;
            if (request.action === 'fields') return { missing: [] };
            return {};
        });
        start();
        await clarify();
        expect(await screen.findByText('Gợi ý tự động')).toBeTruthy();
        expect(chooseRequests()).toEqual([{ action: 'choose', goal: original }, { action: 'choose', goal: merged }]);
        fireEvent.click(screen.getByRole('button', { name: 'Dùng loại kết quả này' }));
        await waitFor(() => expect(jev).toHaveBeenCalledWith({
            action: 'fields', runId: 'second', templateId: 'documentation', goal: merged,
        }));
    });

    it.each([null, { decision: 'fallback', fallback: 'disabled', runId: 'second' }])(
        'uses merged keywords and waits for explicit confirmation on fallback %j',
        async fallback => {
            jev.mockImplementation(async request => {
                if (request.action === 'choose') return request.goal === original ? firstChoice : fallback;
                if (request.action === 'fields') return { missing: [{ id: 'process_name' }] };
                return {};
            });
            keywords.mockImplementation(text => text === merged ? strong : weak);
            start();
            await clarify();
            expect(await screen.findByText('Gợi ý theo từ khóa')).toBeTruthy();
            expect(keywords).toHaveBeenCalledWith(merged);
            expect(jev.mock.calls.some(([request]) => request.action === 'fields' || request.event === 'selection')).toBe(false);
            fireEvent.click(screen.getByRole('button', { name: 'Mở thư viện mẫu' }));
            expect((await screen.findByRole<HTMLSelectElement>('combobox')).value).toBe('');
            fireEvent.click(screen.getByRole('button', { name: 'Dùng loại kết quả này' }));
            expect(await screen.findByText('Bổ sung thông tin còn thiếu')).toBeTruthy();
        },
    );

    it.each([
        ['I want to reduce queue times', '', false],
        ['I need a checklist for the Friday close', 'I need a checklist for the Friday close', true],
    ])('keeps known information editable and asks only for an unspecified deliverable: %s', async (goal, expected, known) => {
        jev.mockImplementation(async request => request.action === 'choose' ? firstChoice : {});
        start(goal);
        await clarify('We open at five on Fridays.');
        fireEvent.click(await screen.findByRole('button', { name: 'Tạo đặc tả chung' }));
        const result = screen.getByLabelText('Kết quả cần nhận') as HTMLTextAreaElement;
        expect(result.value).toBe(expected);
        expect(Boolean(result.closest('details'))).toBe(known);
        expect((screen.getByLabelText('Mục tiêu') as HTMLTextAreaElement).value).toBe(goal);
        fireEvent.change(result, { target: { value: 'A one-page checklist' } });
        fireEvent.click(screen.getByRole('button', { name: 'Xem lại đặc tả' }));
        expect(screen.getByRole('article').textContent).toContain('A one-page checklist');
        expect(screen.getByRole('article').textContent).toContain('We open at five');
    });

    it('ends the clarification after a second unmatched result and offers both recovery routes', async () => {
        jev.mockImplementation(async request => request.action === 'choose' ? firstChoice : {});
        start();
        await clarify();
        expect(await screen.findByRole('heading', { name: 'CVF chưa có mẫu cho việc này' })).toBeTruthy();
        expect(screen.queryByLabelText(clarifyLabel)).toBeNull();
        expect(chooseRequests()).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'Mở thư viện mẫu' }));
        expect(await screen.findByRole('combobox')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Tạo đặc tả chung' }));
        expect((screen.getByLabelText('Mục tiêu') as HTMLTextAreaElement).value).toBe(original);
        expect(screen.getByLabelText('Bối cảnh')).toBeTruthy();
        expect((screen.getByLabelText('Kết quả cần nhận') as HTMLTextAreaElement).value).toContain('Viết quy trình');
        expect(screen.getByLabelText('Giới hạn')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Xem lại đặc tả' }));
        expect(screen.getByRole('article').textContent).toContain(original);
        expect(screen.getByRole('article').textContent).toContain(clarification);
        expect(jev.mock.calls.some(([request]) => request.action === 'fields')).toBe(false);
    });

    it('keeps the clarification in the bounded Jev request when the first answer fills the limit', async () => {
        const longGoal = 'Original task '.repeat(80).slice(0, 1000);
        jev.mockImplementation(async request => request.action === 'choose' ? firstChoice : {});
        start(longGoal);
        await clarify();
        expect(await screen.findByRole('heading', { name: 'CVF chưa có mẫu cho việc này' })).toBeTruthy();
        const secondGoal = chooseRequests()[1].goal;
        expect(secondGoal.length).toBeLessThanOrEqual(1000);
        expect(secondGoal).toContain('Original task');
        expect(secondGoal).toContain(clarification);
    });
});
