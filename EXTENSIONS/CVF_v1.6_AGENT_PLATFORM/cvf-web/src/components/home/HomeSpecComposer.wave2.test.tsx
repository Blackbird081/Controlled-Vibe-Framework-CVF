// Text Encoding Exception: fixtures cover Vietnamese requests and the Vietnamese readable section.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { getTemplateById } from '@/lib/templates';
import { generateSpec } from '@/components/SpecExport';
import { HomeSpecComposer } from './HomeSpecComposer';
import { generateHomeSpec, makeHomeGeneralTemplate, prepareHomeSpec } from './home-spec-export';
import { homeSpecPreviewCopy } from './home-spec-readable';
import { hasOutsideEffectCue } from '@/lib/home-spec-outside-effect-cues';
import { getHomeOutcomeAuthority } from '@/lib/home-spec-jev-catalog';

const fixture = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: fixture.request }));

const verified = { accountScope: 'wave2-fixture' };
const firstPreviewMarker = 'First local preview is permitted';
const blanket = '**DO NOT** execute code without explicit permission.';
const generic = (language: 'vi' | 'en') => makeHomeGeneralTemplate(language, 'General specification', { goal: 'Goal', deliverable: 'Expected result' });
const packetFor = (request: string, language: 'vi' | 'en' = 'en', values: Record<string, string> = {}) =>
    generateHomeSpec(generic(language), values, values, language, request, request);

describe('A. readable section first', () => {
    it('puts a Vietnamese section above the English agent section and reuses the preview strings', () => {
        const need = 'Tôi muốn một trang nhỏ để ghi lại chỉ số công tơ điện hằng tháng. Tôi chưa biết có cần xuất ra Excel không.';
        const t = homeSpecPreviewCopy.vi;
        const packet = prepareHomeSpec(generic('vi'), {}, {}, 'vi', need, need, undefined, undefined, {
            sections: [{ label: t.outcome, value: 'Đặc tả chung' }, { label: t.description, value: need }],
            references: 'Ảnh chụp công tơ',
        });
        const [readable, agent] = packet.markdown.split('# CVF Agent Handoff Packet');
        expect(packet.markdown.startsWith('# Bản đặc tả của bạn (để bạn kiểm tra)')).toBe(true);
        for (const text of [t.provided, t.userWillSupply, t.openQuestions, t.howTo, t.checkOpen, 'Ảnh chụp công tơ', need, 'Đặc tả chung']) {
            expect(readable).toContain(text);
        }
        for (const question of packet.openQuestions) expect(readable).toContain(`- ${question}`);
        expect(packet.openQuestions.length).toBeGreaterThan(0);
        expect(readable).toContain('tiếng Anh');
        expect(agent).toContain('### Provided');
        expect(agent).toContain('User-selected language: Vietnamese (vi)');
    });

    it('writes the same section in English when the language is en and states the no-material default', () => {
        const need = 'I want a small page to log my monthly meter readings.';
        const packet = prepareHomeSpec(generic('en'), {}, {}, 'en', need, need);
        const t = homeSpecPreviewCopy.en;
        expect(packet.markdown.startsWith('# Your specification (for you to check)')).toBe(true);
        expect(packet.markdown.split('# CVF Agent Handoff Packet')[0]).toContain(t.noMaterials);
        expect(packet.markdown.split('# CVF Agent Handoff Packet')[0]).toContain(t.checkOpen);
        expect(packet.markdown).toContain('### Provided');
    });
});

describe('B. no unsupported statements', () => {
    it('drops the Category and Mode lines and the invented no-inputs sentence', () => {
        const packet = packetFor('Build a small notes page for my family.');
        expect(packet).not.toMatch(/\*\*Category:\*\*|\*\*Mode:\*\*|Packet Mode/);
        expect(packet).not.toContain('No further inputs recorded for delivery by the user.');
        expect(packet).toContain('### User Will Supply\n\nNo files, examples or links were recorded for the user to supply later.');
        expect(packet).toContain('| Phase | INTAKE (first local preview permitted) |');
    });
});

describe('C. risk fallback', () => {
    const risk = (packet: string) => /\| Risk Level \| (R\d) \|/.exec(packet)?.[1];

    it('is R1 on the generic path with no floor and no keyword', () => {
        expect(risk(packetFor('Build a small notes page for my family.'))).toBe('R1');
    });

    it.each([
        'Help me deploy the page to production',
        'Please send an email reminder every Monday',
        'Delete data older than a year from the files',
        'Kiểm tra bảo mật cho trang này',
    ])('stays R3 for a keyword request: %s', request => {
        expect(risk(packetFor(request))).toBe('R3');
    });

    it('keeps R2 for an elevated keyword and an explicit R2 marker', () => {
        expect(risk(packetFor('A page that reads from our database'))).toBe('R2');
        expect(risk(packetFor('Small notes page, R2'))).toBe('R2');
    });

    it('keeps a template without an authority floor at the R3 fallback', () => {
        const template = getTemplateById('web_build_handoff')!;
        const request = 'A page for my family.';
        expect(risk(generateHomeSpec({ ...template, id: 'unlisted-template' }, {}, {}, 'en', request, request))).toBe('R3');
    });
});

describe('D. first local preview permission', () => {
    it('is granted at R1 and replaces the blanket prohibition', () => {
        const packet = packetFor('Build a small notes page for my family.');
        expect(packet).toContain(firstPreviewMarker);
        expect(packet).toContain("inside the receiving project's own folder");
        expect(packet).toContain('Write down every assumption as an assumption');
        expect(packet).toContain('The preview makes no network or provider call, sends nothing (no message, email, call or notification), publishes or deploys nothing, connects to no account, site, sheet or database, moves no money, stores no real personal, payment or secret data, reads nothing outside the project folder, installs nothing on the machine, and accesses no device, location or other program.');
        expect(packet).toContain('do not build or imitate that part');
        expect(packet).toContain('what was not built and why');
        expect(packet).not.toContain('First local preview is NOT granted');
        expect(packet).toContain("project's own rules are stricter");
        expect(packet).toContain('also permits building a first local preview');
        expect(packet).not.toContain(blanket);
        expect(packet).toContain('| Phase | INTAKE (first local preview permitted) |');
    });

    it('is absent at R3 and the old wording is unchanged', () => {
        const packet = packetFor('Help me deploy the page to production');
        expect(packet).not.toContain(firstPreviewMarker);
        expect(packet).not.toContain('also permits building a first local preview');
        expect(packet).toContain(blanket);
        expect(packet).toContain('**First local preview is NOT granted by this packet.**');
        expect(packet).toContain('this is a specific reason not to run code yet');
    });

    it('is absent at R2', () => {
        const packet = packetFor('A page that reads from our database');
        expect(packet).toContain(blanket);
        expect(packet).not.toContain(firstPreviewMarker);
    });

    it('is absent for a request flagged as an external action', () => {
        const packet = packetFor('Book me a table for four at a restaurant tomorrow evening');
        expect(packet).toContain('| Risk Level | R1 |');
        expect(packet).toContain(blanket);
        expect(packet).not.toContain(firstPreviewMarker);
    });
});

describe('D2. the permission fails closed', () => {
    const meter = 'Tôi muốn một trang nhỏ để ghi lại chỉ số công tơ điện hằng tháng của nhà tôi và xem tháng nào dùng nhiều nhất.';
    const fridge = 'Làm cho tôi một trang danh sách việc nhà để in ra dán tủ lạnh.';
    const webPage = 'Làm cho tôi một trang web nhỏ để ghi chỉ số công tơ điện hằng tháng.';
    const englishPage = 'Make me a small website to track my reading list.';
    const refused = [
        'Sửa trang web bán hàng đang chạy của tôi cho nút thanh toán to hơn',
        'Làm công cụ tự động gửi tin nhắn Zalo nhắc học phí cho tất cả phụ huynh',
        'Trang lưu tên và số điện thoại 40 phụ huynh',
        'Đưa trang lên mạng cho cả nhóm',
        'Email all my customers each Monday',
        'Use my OpenAI key to summarise',
        'xóa dữ liệu cũ',
        'xoá dữ liệu cũ',
        'xoá dữ liệu cũ'.normalize('NFD'),
        'xóa dữ liệu cũ'.normalize('NFD'),
        'gui tin nhan nhac hoc phi',
        'Chia sẻ trang này với cả lớp',
        'Mình cần đăng bài lên fanpage',
        'Cập nhật khoá API của tôi',
        'Ghi nhớ mật khẩu wifi',
    ];

    it.each(refused)('does not grant the permission for: %s', request => {
        const packet = packetFor(request, 'vi');
        expect(packet).not.toContain(firstPreviewMarker);
        expect(packet).toContain(blanket);
        expect(packet).toContain('| Phase | INTAKE |');
        expect(packet).toContain('This packet cannot grant new rights.');
        expect(packet).toContain('Treat this specification as one intake input.');
    });

    it('keeps R1 as the displayed level while refusing the permission', () => {
        expect(packetFor('Làm công cụ tự động gửi tin nhắn Zalo nhắc học phí cho tất cả phụ huynh', 'vi')).toMatch(/\| Risk Level \| R1 \|/);
    });

    it('checks the clarification and the optional answers too', () => {
        const packet = generateHomeSpec(generic('en'), { goal: 'A notes page', extra: 'Send it to everyone by SMS' }, { goal: 'A notes page' }, 'en', 'A notes page', 'A notes page');
        expect(packet).not.toContain(firstPreviewMarker);
    });

    it.each([meter, fridge, webPage, englishPage])('still grants the permission for a plain local request: %s', request => {
        const packet = packetFor(request, 'vi');
        expect(packet).toContain(firstPreviewMarker);
        expect(packet).not.toContain(blanket);
        expect(packet).toContain('| Phase | INTAKE (first local preview permitted) |');
    });

    it('does not trigger on short common Vietnamese words', () => {
        for (const text of ['để in ra', 'cho tôi một trang nhỏ', 'tháng này dùng nhiều', 'nhân viên nghỉ phép', 'đang muốn ghi lại', 'khoa học tự nhiên']) {
            expect(hasOutsideEffectCue(text)).toBe(false);
        }
        expect(hasOutsideEffectCue('đang chạy')).toBe(true);
        expect(hasOutsideEffectCue('XOÁ file')).toBe(true);
    });

    it('is not granted to a matched template with a real authority floor', () => {
        const request = 'A page for my family.';
        for (const id of ['app_requirements_spec', 'web_build_handoff']) {
            const template = getTemplateById(id)!;
            const packet = generateHomeSpec(template, {}, {}, 'en', request, request);
            expect(packet).toContain('| Phase | INTAKE |');
            expect(packet).not.toContain(firstPreviewMarker);
            expect(packet).toContain(blanket);
            expect(packet).toContain('**First local preview is NOT granted by this packet.**');
        }
        expect(getHomeOutcomeAuthority('app_requirements_spec')?.riskLevel).toBe('R1');
    });

    it('makes the granted packet consistent about what it permits', () => {
        const packet = packetFor('Build a small notes page for my family.');
        expect(packet).not.toContain('This packet cannot grant new rights.');
        expect(packet).toContain("This packet grants no rights beyond the bounded first local preview described under Guardrails, inside the receiving project's folder.");
        expect(packet).toContain('| Phase | INTAKE (first local preview permitted) |');
        expect(packet).toContain('Treat this specification as the input for a first local preview plus open questions.');
        expect(packet).not.toContain('Treat this specification as one intake input.');
        expect(packet).not.toContain("Use this packet to begin intake for the user's requested outcome.");
        expect(packet).toContain("create new files only; do not edit or delete any existing file except the project's own record files; one result the user can open locally; sample data or data the user types into it only");
    });
});

describe('non-Home output', () => {
    it('keeps the Category and Mode lines and the original guardrail', () => {
        const spec = generateSpec(getTemplateById('web_build_handoff')!, { audience: 'Family' }, 'en', 'governance', 'ctx');
        expect(spec).toMatch(/\*\*Category:\*\*/);
        expect(spec).toMatch(/\*\*Mode:\*\*/);
        expect(spec).toContain('**DO NOT** execute code without explicit permission');
        expect(spec).not.toContain(firstPreviewMarker);
    });
});

describe('F. open question cap', () => {
    it('keeps ten open questions in input order', () => {
        const items = Array.from({ length: 12 }, (_, index) => `I don't know item${index + 1}.`);
        const request = `Write a report. ${items.join(' ')}`;
        const packet = prepareHomeSpec(generic('en'), {}, {}, 'en', request, request);
        expect(packet.openQuestions).toEqual(items.slice(0, 10));
    });
});

describe('E. character limits and counter', () => {
    beforeEach(() => {
        sessionStorage.clear();
        fixture.request.mockReset();
        fixture.request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'wave2-run', decision: 'clarify' } : { enabled: true });
    });
    afterEach(() => cleanup());

    function renderComposer(language: 'en' | 'vi') {
        return render(<HomeSpecAccountScope.Provider value={verified}>
            <HomeSpecComposer language={language} library={<p>Library</p>} />
        </HomeSpecAccountScope.Provider>);
    }

    it('allows 3000 characters and shows a live counter on the goal box', () => {
        renderComposer('en');
        const box = screen.getByRole('textbox', { name: 'What do you want to create?' });
        expect(box.getAttribute('maxlength')).toBe('3000');
        expect(screen.getByTestId('home-spec-goal-count').textContent).toBe('0 / 3 000');
        fireEvent.change(box, { target: { value: 'x'.repeat(1054) } });
        expect(screen.getByTestId('home-spec-goal-count').textContent).toBe('1 054 / 3 000');
    });

    it('keeps a 1500-character clarification answer whole in the preview and the download', async () => {
        const url = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:wave2');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        renderComposer('en');
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: 'Make a small notes page for family' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        const answer = `${'a'.repeat(1499)}Z`;
        const box = await screen.findByRole('textbox', { name: 'What other details should the assistant know?' });
        expect(box.getAttribute('maxlength')).toBe('3000');
        fireEvent.change(box, { target: { value: answer } });
        expect(screen.getByTestId('home-spec-clarify-count').textContent).toBe('1 500 / 3 000');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'None fit — create a general specification' }).catch(() => screen.findByRole('button', { name: 'Create a general specification' })));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const [blob] = url.mock.calls[0];
        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(blob as Blob);
        });
        expect(text).toContain(answer);
        expect(text.split(answer).length - 1).toBeGreaterThanOrEqual(2);
        expect(text.startsWith('# Your specification (for you to check)')).toBe(true);
    });

    it('shows a notice when a paste is cut at the limit and clears it when the text is shorter', () => {
        renderComposer('en');
        const box = screen.getByRole('textbox', { name: 'What do you want to create?' });
        fireEvent.paste(box, { clipboardData: { getData: () => 'y'.repeat(3500) } });
        fireEvent.change(box, { target: { value: 'y'.repeat(3000) } });
        expect(screen.getByTestId('home-spec-goal-cut').textContent).toContain('shortened to 3 000 characters');
        fireEvent.change(box, { target: { value: 'y'.repeat(100) } });
        expect(screen.queryByTestId('home-spec-goal-cut')).toBeNull();
    });

    it('shows the notice in Vietnamese and not for a paste that fits', () => {
        renderComposer('vi');
        const box = screen.getByRole('textbox', { name: 'Bạn muốn tạo gì?' });
        fireEvent.paste(box, { clipboardData: { getData: () => 'ngắn' } });
        expect(screen.queryByTestId('home-spec-goal-cut')).toBeNull();
        fireEvent.paste(box, { clipboardData: { getData: () => 'y'.repeat(4000) } });
        expect(screen.getByTestId('home-spec-goal-cut').textContent).toContain('rút gọn còn 3 000 ký tự');
    });

    it('gives the Goal field of the generic path a 3000 limit and a counter', async () => {
        renderComposer('en');
        const goal = `Make a small notes page for family. ${'a'.repeat(1500)}`;
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: 'One page' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'None fit — create a general specification' }).catch(() => screen.findByRole('button', { name: 'Create a general specification' })));
        const field = await screen.findByRole('textbox', { name: 'Goal' });
        expect(field.getAttribute('maxlength')).toBe('3000');
        expect(screen.getByTestId('home-spec-field-goal-count').textContent).toContain('/ 3 000');
    });

    it('shows the same open questions and provided text in the preview and in the downloaded readable section', async () => {
        const url = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:wave2-same');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        renderComposer('en');
        const need = "Make a small notes page for my family. I don't know which colours to use.";
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: need } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        const answer = 'Keep it to one page. I do not know how many people will use it.';
        fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: answer } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'None fit — create a general specification' }).catch(() => screen.findByRole('button', { name: 'Create a general specification' })));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        const preview = screen.getByRole('article', { name: 'Specification' });
        const shown = [...preview.querySelectorAll('li')].map(item => item.textContent ?? '');
        expect(shown.length).toBeGreaterThan(0);
        const previewText = preview.textContent ?? '';
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const [blob] = url.mock.calls[0];
        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(blob as Blob);
        });
        const readable = text.split('# CVF Agent Handoff Packet')[0];
        for (const question of shown) expect(readable).toContain(`- ${question}`);
        expect(readable).toContain(homeSpecPreviewCopy.en.checkOpen);
        for (const provided of [need, answer]) {
            expect(previewText).toContain(provided);
            expect(readable).toContain(provided);
        }
    });
});
