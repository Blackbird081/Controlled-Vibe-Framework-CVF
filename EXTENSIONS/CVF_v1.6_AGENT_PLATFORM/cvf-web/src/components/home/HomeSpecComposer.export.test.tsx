import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { getJevOutcomeChoices, homeSpecTemplates } from '@/lib/home-spec-jev-catalog';
import { getTemplateById } from '@/lib/templates';
import { generateCompleteSpec, generateSpec } from '@/components/SpecExport';
import { HomeSpecComposer } from './HomeSpecComposer';
import { findHomeSpecDeliverable } from './home-spec-deliverable';
import { generateHomeSpec, makeHomeGeneralTemplate } from './home-spec-export';

// Text Encoding Exception: fixtures cover Vietnamese goals and export labels.
const fixture = vi.hoisted(() => ({ request: vi.fn() }));
const verified = { accountScope: 'spec-export-fixture' };
const receiptKey = 'cvf:home-spec-exports:v1:account:spec-export-fixture';
const template = homeSpecTemplates.find(item => item.id === 'web_build_handoff')!;
const goal = 'A bakery preorder site';
const topic = '  Weekend customers  ';
const appGoal = 'Tôi cần ứng dụng theo dõi đơn đặt bánh của khách.';
const appDetail = 'Cần xem các đơn theo ngày trên điện thoại, chưa cần thanh toán.';
const fromUserContext = "From the user's description in Task (not entered separately)";
const guardStart = '## ⚠️ CVF GOVERNANCE RULES';
const guardContext = '## 🛡️ CVF GOVERNANCE CONTEXT';

vi.mock('@/lib/home-spec-jev-client', () => ({
    requestHomeSpecJev: fixture.request,
}));

function renderComposer(language: 'en' | 'vi' = 'en', initialTemplate?: string) {
    return render(<HomeSpecAccountScope.Provider value={verified}>
        <HomeSpecComposer language={language} initialTemplate={initialTemplate} library={<p>Library</p>} />
    </HomeSpecAccountScope.Provider>);
}

function mockTemplatedJourney(description = goal) {
    fixture.request.mockImplementation(async payload => {
        if (payload.action === 'choose') return payload.goal === description
            ? { runId: 'first-run', decision: 'clarify' }
            : { runId: 'fixture-run', templateId: template.id, decision: 'preselect' };
        return payload.action === 'fields' ? { missing: [{ id: 'audience', label: 'Audience' }] } : { enabled: true };
    });
}

async function openTemplate(description = goal, detail = 'Accept weekend orders') {
    mockTemplatedJourney(description);
    renderComposer();
    fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: description } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: detail } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Who will use this website?' }), { target: { value: topic } });
    fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
    return `${description}\n${detail}`;
}

function captureDownloads() {
    const url = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fixture');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    return {
        async get(index: number) {
            const [blob] = url.mock.calls[index];
            if (!(blob instanceof Blob)) throw new Error('Expected a Markdown Blob');
            const name = (click.mock.instances[index] as HTMLAnchorElement).download;
            const text = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsText(blob);
            });
            return { name, text };
        },
    };
}

function expectGuardrails(text: string) {
    expect(text).toContain(guardStart);
    expect(text).toContain(guardContext);
    for (const heading of ['Stop Conditions', 'Guardrails', 'Response Requirements', 'Receiving Agent Authority']) {
        expect(text).toContain(`### ${heading}`);
    }
    expect(text).toMatch(/\| Phase \| INTAKE(?: \(first local preview permitted\))? \|/);
    expect(text).not.toMatch(/^\| Role \||^### Allowed Actions/m);
}

describe('Home specification without a writing provider', () => {
    beforeEach(() => {
        sessionStorage.clear();
        fixture.request.mockReset();
    });

    it.each([
        ...homeSpecTemplates,
        makeHomeGeneralTemplate('en', 'General specification', { goal: 'Goal', deliverable: 'Expected result' }),
    ])('gives a receiving agent an actionable intake path with partial information for $id', outcome => {
        const description = 'Help me build a weekly list of orders awaiting pickup.';
        const en = generateHomeSpec(outcome, {}, {}, 'en', description, description);
        const task = en.split('## 🎯 Task')[1]?.split('\n---\n')[0];
        expect(task).toContain(description);
        expect(task).toContain(en.match(/^\*\*Template:\*\* (.+)$/m)?.[1]);
        for (const heading of ['Provided', 'User Will Supply', 'Open Questions', 'Receiving Agent Continuation']) {
            expect(en).toContain(`### ${heading}`);
        }
        expect(en).not.toMatch(/\| Field \| Provided \||\| [✅❌] \|/);
        expect(en).toContain('Continue independent permitted work');
        expect(en).toContain('Pause only the dependent action');
        expect(en).toContain('Record consequential assumptions');
        expect(en).toContain('Prioritize open questions');
        expect(en).not.toMatch(/not ready|missing required inputs|stop and ask|stop\*\* immediately|do not\*\* assume missing information/i);
    });

    it('lets a Vietnamese user add optional success criteria, exclusions and attachments as text', async () => {
        const captured = captureDownloads();
        renderComposer('vi', 'app_requirements_spec');
        fireEvent.change(screen.getByRole('textbox', { name: 'Bạn muốn tạo gì?' }), { target: { value: appGoal } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Dùng loại kết quả này' }));
        const criteria = await screen.findByRole('textbox', { name: 'Thế nào thì coi là xong?' });
        const exclusions = screen.getByRole('textbox', { name: 'Bản đầu KHÔNG cần làm gì?' });
        const references = screen.getByRole('textbox', { name: 'Bạn sẽ gửi kèm tệp, mẫu hay đường dẫn nào cho người làm?' });
        expect(references.getAttribute('aria-describedby')).toBeTruthy();
        expect(screen.getByText(/chỉ ghi tên hoặc link, không tải lên/i)).toBeTruthy();
        const success = '  Tìm thấy đơn đặt bánh trong 30 giây.  ';
        const excluded = '  Không thanh toán qua mạng.  ';
        const material = '  Danh sách mẫu.xlsx\nhttps://example.test/guide  ';
        for (const [field, value] of [[criteria, success], [exclusions, excluded], [references, material]] as const) {
            expect(field.getAttribute('required')).toBeNull();
            fireEvent.change(field, { target: { value } });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Xem lại đặc tả' }));
        expect(screen.getByRole('heading', { name: 'Đã có' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Người dùng sẽ bổ sung' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Câu hỏi mở' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Tải bản đặc tả' }));
        const { text } = await captured.get(0);
        expect(text.split('### Provided')[1].split('### User Will Supply')[0]).toContain(success);
        expect(text.split('### Provided')[1].split('### User Will Supply')[0]).toContain(excluded);
        expect(text.split('### User Will Supply')[1].split('### Open Questions')[0]).toContain(material);
        expect(fixture.request).not.toHaveBeenCalled();
    });

    it('hides only the optional questions the template confirmation covered', async () => {
        const description = 'A bakery preorder site. Version one does not take payments.';
        fixture.request.mockImplementation(async payload => {
            if (payload.action === 'choose') return { runId: 'common-fields-run', templateId: template.id, decision: 'preselect' };
            return payload.action === 'fields' ? { missing: [
                { id: 'successCriteria', label: 'Success' },
                { id: 'homeInputReferences', label: 'Materials' },
            ] } : { enabled: true };
        });
        renderComposer();
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: description } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        expect(await screen.findByRole('textbox', { name: 'What will tell you the work is done?' })).toBeTruthy();
        expect(screen.getByRole('textbox', { name: 'What files, examples or links will you send to the person doing the work?' })).toBeTruthy();
        expect(screen.queryByRole('textbox', { name: 'What should the first version leave out?' })).toBeNull();
        expect(fixture.request.mock.calls.filter(([payload]) => payload.action === 'fields')).toEqual([
            [{ action: 'fields', runId: 'common-fields-run', templateId: template.id, goal: description }],
        ]);
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        expect(screen.getByRole('button', { name: 'Download specification' })).toBeTruthy();
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('downloads the exact deterministic handoff with zero fetch and retains a local export receipt', async () => {
        vi.setSystemTime(new Date('2031-04-15T12:00:00Z'));
        const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(Error('Unexpected network'));
        const captured = captureDownloads();
        const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const context = await openTemplate();
        const draft = screen.getByRole('article', { name: 'Specification' }).textContent ?? '';
        expect(draft).toContain(goal);
        expect(draft).toContain(topic.trim());
        expect(draft).not.toContain(guardStart);
        expect(screen.queryByRole('link', { name: /setup/i })).toBeNull();
        expect((screen.getByRole('button', { name: 'Ask AI to clarify' }) as HTMLButtonElement).disabled).toBe(true);
        fixture.request.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const file = await captured.get(0);
        expect(file.name).toBe('cvf-spec-web_build_handoff-2031-04-15.md');
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        await waitFor(() => expect(writeText).toHaveBeenCalledWith(file.text));
        if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard);
        else Reflect.deleteProperty(navigator, 'clipboard');
        const [coverage, task] = file.text.split('## ✅ Input Coverage')[1].split('## 🎯 Task');
        expect(coverage.split('### User Will Supply')[0]).toContain(`- **Who will use this website?:** ${topic}`);
        expect(task.split('\n---\n')[0]).toContain(context);
        expect(file.text).toContain(fromUserContext);
        expect(file.text).toContain('User-selected language: English (en)');
        expectGuardrails(file.text);
        const technical = screen.getByTestId('home-spec-agent-details');
        expect(technical.hasAttribute('open')).toBe(false);
        expect(technical.querySelector('pre')?.textContent).toBe(file.text);
        expect(JSON.parse(sessionStorage.getItem(receiptKey) ?? 'null')).toEqual([
            { runId: 'fixture-run', tier: 'local' },
        ]);
        expect(network).not.toHaveBeenCalled();
        expect(fixture.request).toHaveBeenCalledExactlyOnceWith({ action: 'feedback', event: 'export', runId: 'fixture-run' });
    });

    it('shows the same open-question lines in the preview and the downloaded file', async () => {
        const captured = captureDownloads();
        const question = "I don't know who will own the order form.";
        await openTemplate(`Build a page for weekend customers. ${question}`);
        const section = screen.getByRole('heading', { name: 'Open questions' }).parentElement;
        const preview = Array.from(section?.querySelectorAll('li') ?? [], item => item.textContent);
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        const downloaded = text.split('### Open Questions\n')[1].split('\n---\n')[0]
            .split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2));
        expect(downloaded).toContain(question);
        expect(preview).toEqual(downloaded);
    });

    it.each(['Help deploy production', 'Review bảo mật'])('raises risk from the description alone: %s', async description => {
        const captured = captureDownloads();
        await openTemplate(description, 'Routines for staff');
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        expect(text).toContain('| Risk Level | R3 |');
    });

    it('retains the values-based risk when the additional text has a lower rating', () => {
        const values = { audience: 'Production R3 support' };
        const additional = 'Look at the documentation. R0';
        expect(generateSpec(template, values, 'en', 'governance', additional, additional))
            .toBe(generateSpec(template, values, 'en', 'governance', additional));
        expect(generateSpec(template, values, 'en', 'governance', additional, additional)).toContain('| Risk Level | R3 |');
    });

    it('exports the Home general template with limits without changing Jev choices or the frozen inventory', async () => {
        vi.setSystemTime(new Date('2031-04-15T12:00:00Z'));
        const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(Error('Unexpected network'));
        const captured = captureDownloads();
        fixture.request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-generic', decision: 'clarify' } : { enabled: true });
        renderComposer();
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: 'Observe migratory owls' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: 'Record appearances at dawn' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Create a general specification' }));
        expect(screen.getByRole('textbox', { name: 'What will tell you the work is done?' })).toBeTruthy();
        expect(screen.getByRole('textbox', { name: 'What should the first version leave out?' })).toBeTruthy();
        expect(screen.getByRole('textbox', { name: 'What files, examples or links will you send to the person doing the work?' })).toBeTruthy();
        fireEvent.change(screen.getByRole('textbox', { name: 'Context' }), { target: { value: 'North footpath' } });
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fixture.request.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const file = await captured.get(0);
        expect(file.name).toBe('cvf-spec-home-general-2031-04-15.md');
        expect(file.text).toContain('North footpath');
        expectGuardrails(file.text);
        expect(getJevOutcomeChoices().map(item => item.id)).not.toContain('home-general');
        const dir = resolve(process.cwd(), '../../../scripts/ui01-jev-eval');
        const { files } = JSON.parse(readFileSync(resolve(dir, 'freeze.sha256.json'), 'utf8'));
        const frozen = files.find((item: { path: string }) => item.path === 'candidate-inventory.json');
        expect(createHash('sha256').update(readFileSync(resolve(dir, frozen.path))).digest('hex')).toBe(frozen.sha256);
        expect(fixture.request).toHaveBeenCalledExactlyOnceWith({ action: 'feedback', event: 'export', runId: 'fixture-generic' });
        expect(network).not.toHaveBeenCalled();
    });

    it.each([
        ['H7.1', 'Làm lại trang web giới thiệu của trường cho đẹp và dễ xem trên điện thoại, giữ nội dung cũ.',
            'Tôi là giáo viên tin học THCS, kiêm phụ trách website của trường. Dùng máy tính tốt nhưng không biết lập trình, chưa từng nghe về CVF.',
            'Làm lại trang web giới thiệu của trường cho đẹp và dễ xem trên điện thoại, giữ nội dung cũ'],
        ['background: founding a company', 'Tôi muốn giảm thời gian xếp hàng', 'Tôi mới thành lập công ty.', ''],
        ['background: enabling staff', 'Tôi muốn giảm thời gian xếp hàng', 'Tạo điều kiện cho mọi người đi làm đúng giờ.', ''],
        ['background: skills', 'Tôi muốn giảm thời gian xếp hàng', 'Lập trình không phải sở trường của tôi.', ''],
        ['background: past output', 'Tôi muốn giảm thời gian xếp hàng', 'Tôi đã viết báo cáo hôm qua.', ''],
        ['background: restriction', 'Tôi muốn giảm thời gian xếp hàng', 'Không cần soạn email cho khách.', ''],
        ['background: readiness', 'Tôi muốn giảm thời gian xếp hàng', 'Chúng tôi đang chuẩn bị khai trương.', ''],
    ])('only fills a requested deliverable from Vietnamese input: %s', async (_case, goal, detail, expected) => {
        fixture.request.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-g2', decision: 'clarify' } : { enabled: true });
        renderComposer('vi');
        fireEvent.change(screen.getByRole('textbox', { name: 'Bạn muốn tạo gì?' }), { target: { value: goal } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Trợ lý cần biết thêm chi tiết nào?' }), { target: { value: detail } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Tạo đặc tả chung' }));
        const deliverable = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Kết quả cần nhận' });
        expect(deliverable.value).toBe(expected);
        expect(Boolean(deliverable.closest('details'))).toBe(Boolean(expected));
    });

    it('does not infer an artifact from the V1.4 safety request or its background', () => {
        expect(findHomeSpecDeliverable([
            'Máy lạnh ở tiệm bị chảy nước, tôi phải làm sao?',
            'Tôi là chủ tiệm bánh nhỏ ở TP.HCM, dùng máy tính ở mức cơ bản, không biết lập trình.',
        ])).toBeUndefined();
    });

    it('preserves the existing SpecExport caller byte snapshot', () => {
        vi.setSystemTime(new Date('2031-04-15T12:00:00Z'));
        expect(generateCompleteSpec(getTemplateById('web_build_handoff')!, { audience: topic.trim() }, goal)).toMatchSnapshot();
    });

    it('credits inputs skipped by Jev in the Vietnamese sample download', async () => {
        vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
        const captured = captureDownloads();
        fixture.request.mockImplementation(async payload => {
            if (payload.action === 'choose') return payload.goal.includes('\n')
                ? { runId: 'sample-final', templateId: 'app_builder_complete', decision: 'preselect' }
                : { runId: 'sample-first', decision: 'clarify' };
            return payload.action === 'fields' ? { missing: [] } : { enabled: true };
        });
        renderComposer('vi');
        fireEvent.change(screen.getByRole('textbox', { name: 'Bạn muốn tạo gì?' }), { target: { value: appGoal } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Trợ lý cần biết thêm chi tiết nào?' }), { target: { value: appDetail } });
        fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Dùng loại kết quả này' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Xem lại đặc tả' }));
        fireEvent.click(screen.getByRole('button', { name: 'Tải bản đặc tả' }));
        const { text } = await captured.get(0);
        const [coverage, task] = text.split('## ✅ Input Coverage')[1].split('## 🎯 Task');
        expect(coverage.split('### User Will Supply')[0]).toContain(fromUserContext);
        expect(coverage.split('### Open Questions')[1]).not.toContain('- Tên ứng dụng');
        expect(task.split('\n---\n')[0]).toContain(`${appGoal}\n${appDetail}`);
        expect(text).toContain(fromUserContext);
        expect(text).toContain('User-selected language: Vietnamese (vi)');
        expect(text).toContain('Package `app_requirements_spec` has a R1 risk floor');
    });

    it('leaves a separately requested blank field missing while crediting approved omissions', async () => {
        const captured = captureDownloads();
        fixture.request.mockImplementation(async payload => {
            if (payload.action === 'choose') return { runId: 'sample-run', templateId: template.id, decision: 'preselect' };
            return payload.action === 'fields' ? { missing: [{ id: 'audience', label: 'Audience' }] } : { enabled: true };
        });
        renderComposer();
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        expect(await screen.findByRole('textbox', { name: 'Who will use this website?' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        const coverage = text.split('## ✅ Input Coverage')[1].split('---\n\n## 🎯 Task')[0];
        expect(coverage.split('### User Will Supply')[0]).toContain(fromUserContext);
        expect(coverage.split('### Open Questions')[1]).toContain('- Who will use this website?');
        expect(text).toContain(fromUserContext);
    });

    it.each([
        ['no Jev journey', undefined],
        ['unavailable fields request', null],
        ['fallback field list', { fallback: 'disabled', missing: [] }],
        ['missing field list', {}],
        ['unrecognized field ID', { missing: [{ id: 'old_workflow_field' }] }],
    ])('counts only individually entered answers with %s', async (_, response) => {
        const captured = captureDownloads();
        fixture.request.mockImplementation(async payload => {
            if (payload.action === 'choose') return { runId: 'sample-run', templateId: template.id, decision: 'preselect' };
            return payload.action === 'fields' ? response : { enabled: true };
        });
        renderComposer('en', response === undefined ? template.id : undefined);
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Who will use this website?' }), { target: { value: topic } });
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        const coverage = text.split('## ✅ Input Coverage')[1].split('---\n\n## 🎯 Task')[0];
        expect(coverage.split('### User Will Supply')[0]).toContain(`- **Who will use this website?:** ${topic}`);
        expect(coverage.split('### Open Questions')[1]).toContain('- What is this website for?');
        expect(coverage.split('### Open Questions')[1]).not.toContain('- Who will use this website?');
        expect(text).not.toContain(fromUserContext);
    });

    it('keeps previously entered workflow answers without crediting different template fields', async () => {
        sessionStorage.setItem(`cvf:home-spec-input:v1:${verified.accountScope}`, JSON.stringify({
            goal: 'Track weekend bakery orders', extra: '', values: { product_goal: 'Avoid lost preorders' }, draft: '',
        }));
        const captured = captureDownloads();
        renderComposer('en', 'app_builder_complete');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        expect(screen.getByRole('article', { name: 'Specification' }).textContent).toContain('Avoid lost preorders');
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        expect(text).toContain('Avoid lost preorders');
        expect(text.split('### Open Questions')[1]).toContain('- App Name');
        expect(text).not.toContain(fromUserContext);
    });

    it('excludes answers from a different outcome when downloading an email specification', async () => {
        const previousContract = 'Private prior contract test fixture. R4.';
        sessionStorage.setItem(`cvf:home-spec-input:v1:${verified.accountScope}`, JSON.stringify({
            goal: 'Write a message about the delivery date',
            extra: '',
            values: { purpose: 'Confirm the delivery date', contract_text: previousContract },
            draft: '',
        }));
        const captured = captureDownloads();
        renderComposer('en', 'email_template');
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const { text } = await captured.get(0);
        expect(text).toContain('Confirm the delivery date');
        expect(text).not.toContain(previousContract);
        expect(text).toContain('| Risk Level | R3 |');
        expect(sessionStorage.getItem(`cvf:home-spec-input:v1:${verified.accountScope}`)).toContain(previousContract);
    });
});
