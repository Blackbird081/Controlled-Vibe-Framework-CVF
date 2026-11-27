// Text Encoding Exception: Vietnamese request text used to check that the export states it once.
import { describe, expect, it } from 'vitest';
import { generateHomeSpec, makeHomeGeneralTemplate } from './home-spec-export';
import { dedupeHomeReadableSections, homeSpecPreviewCopy } from './home-spec-readable';

const description = 'Cô là giáo viên chủ nhiệm lớp mẫu giáo, sắp có buổi họp phụ huynh. Cô muốn một trang nhỏ mở trên điện thoại, hiện còn bao nhiêu ngày nữa tới buổi họp, và có một danh sách việc cần chuẩn bị để cô tích từng việc đã xong. Cô muốn trang tự gửi email mời tất cả phụ huynh. Cô chưa chắc ngày họp, có thể sẽ đổi. Dữ liệu chỉ cần nằm trên máy của cô.';
const clarification = 'Cô là giáo viên chủ nhiệm lớp mẫu giáo. Sắp có buổi họp phụ huynh. Cô muốn một trang nhỏ mở trên điện thoại, để thấy còn bao nhiêu ngày nữa tới buổi họp, và có danh sách việc cần chuẩn bị để cô tích từng việc đã xong. Cô muốn trang tự gửi email mời tất cả phụ huynh. Cô chưa chắc ngày họp, có thể đổi. Dữ liệu chỉ cần nằm trên máy cô. Ngoài những điều trên, cô chưa biết: số phụ huynh, ngày họp cụ thể, loại điện thoại, ai khác sẽ dùng trang, có in ra không, có đưa lên mạng không, và danh sách việc cụ thể gồm những gì.';
const request = `${description}\n${clarification}`;
const labels = { goal: 'Mục tiêu', deliverable: 'Kết quả cần nhận' };
const divider = 'PHẦN DƯỚI ĐÂY VIẾT BẰNG TIẾNG ANH CHO TRỢ LÝ AI THỰC HIỆN CÔNG VIỆC';
const occurrences = (text: string, needle: string) => text.split(needle).length - 1;

// The exact run-B trial: the "Mục tiêu" answer equals the description, as the Home flow stores it.
function runB(extraValues: Record<string, string> = {}, extraSections: { label: string; value: string }[] = []) {
    const template = makeHomeGeneralTemplate('vi', 'Đặc tả chung', labels);
    const entered = { goal: description, ...extraValues };
    const sections = [
        { label: 'Loại kết quả', value: 'Đặc tả chung' },
        { label: 'Mô tả công việc', value: description },
        { label: 'Thông tin làm rõ', value: clarification },
        { label: 'Mục tiêu', value: description },
        ...extraSections,
    ];
    const markdown = generateHomeSpec(template, entered, entered, 'vi', request, request, undefined, labels, { sections });
    const [readable, agent] = markdown.split(divider);
    return { markdown, readable, agent };
}

describe('Home export states the request once', () => {
    it('shows the description and the clarification once in the readable part', () => {
        const { readable } = runB();
        expect(occurrences(readable, 'Dữ liệu chỉ cần nằm trên máy của cô.')).toBe(1);
        expect(occurrences(readable, 'Dữ liệu chỉ cần nằm trên máy cô.')).toBe(1);
        expect(readable).not.toContain('**Mục tiêu**');
        expect(readable).toContain('**Mô tả công việc**');
        expect(readable).toContain('**Thông tin làm rõ**');
    });

    it('shows the full request once in the Task of the agent part and refers to it elsewhere', () => {
        const { agent } = runB();
        expect(occurrences(agent, 'Dữ liệu chỉ cần nằm trên máy của cô.')).toBe(1);
        expect(occurrences(agent, 'Dữ liệu chỉ cần nằm trên máy cô.')).toBe(1);
        const task = agent.split('## 🎯 Task')[1].split('\n---\n')[0];
        expect(task).toContain(description);
        expect(task).toContain(clarification);
        expect(agent).toContain('- **Mục tiêu:** see Task');
        expect(task).not.toContain('Mục tiêu:');
        expect(agent).not.toContain('## 👤 User Context');
        expect(agent).toContain('See Task for the original request');
        expect(agent).toContain('- **Mục tiêu:** (see Task)');
    });

    it('keeps a distinct answer exactly once, in the readable part and in the agent part', () => {
        const distinct = 'Một trang có nút tích, in được ra giấy A4.';
        const { readable, agent } = runB({ deliverable: distinct }, [{ label: 'Kết quả cần nhận', value: distinct }]);
        expect(occurrences(readable, distinct)).toBe(1);
        expect(occurrences(agent, distinct)).toBe(1);
        expect(agent).toContain(`- **Kết quả cần nhận:** ${distinct}`);
    });

    it('still lists the clarification in full when it is the only place the request text differs', () => {
        const { agent } = runB();
        expect(agent).toContain('Ngoài những điều trên, cô chưa biết: số phụ huynh');
    });
});

describe('dedupeHomeReadableSections', () => {
    it('drops a later section that only repeats the description, ignoring spacing, and keeps the first', () => {
        const kept = dedupeHomeReadableSections([
            { label: homeSpecPreviewCopy.vi.description, value: 'Một  trang\nnhỏ' },
            { label: 'B', value: 'Khác' },
            { label: 'C', value: ' Một trang nhỏ ' },
        ]);
        expect(kept.map(section => section.label)).toEqual([homeSpecPreviewCopy.vi.description, 'B']);
    });

    it('keeps a placeholder value for every field that uses it', () => {
        const placeholder = homeSpecPreviewCopy.vi.fromUserContext;
        const kept = dedupeHomeReadableSections([
            { label: 'A', value: placeholder },
            { label: 'B', value: placeholder },
        ], [placeholder]);
        expect(kept).toHaveLength(2);
    });
});

describe('Home export never drops a distinct answer', () => {
    it('keeps two different fields that share the same short answer in the readable part', () => {
        const kept = dedupeHomeReadableSections([
            { label: homeSpecPreviewCopy.vi.description, value: 'Một trang nhỏ ghi việc nhà.' },
            { label: 'Bối cảnh', value: 'Không có' },
            { label: 'Giới hạn', value: 'Không có' },
            { label: 'Câu hỏi khác', value: 'chưa biết' },
            { label: 'Câu hỏi nữa', value: 'chưa biết' },
        ]);
        expect(kept.map(section => section.label)).toEqual([homeSpecPreviewCopy.vi.description, 'Bối cảnh', 'Giới hạn', 'Câu hỏi khác', 'Câu hỏi nữa']);
    });

    it('keeps an answer that is only part of the request text in the agent part', () => {
        const need = 'Cô muốn một trang nhỏ đếm ngày tới buổi họp. Cô chưa chắc có nên cho phụ huynh xem danh sách việc cần chuẩn bị hay không.';
        const answer = 'cho phụ huynh xem danh sách việc cần chuẩn bị';
        const template = makeHomeGeneralTemplate('vi', 'Đặc tả chung', labels);
        const entered = { goal: need, deliverable: answer };
        const markdown = generateHomeSpec(template, entered, entered, 'vi', need, need, undefined, labels);
        const agent = markdown.split(divider)[1];
        expect(agent).toContain(`${answer}`);
        expect(agent).toMatch(/Kết quả cần nhận:?\*?\*?:? cho phụ huynh xem danh sách việc cần chuẩn bị|Deliverable:?\*?\*?:? cho phụ huynh xem/);
        expect(agent).not.toMatch(/Kết quả cần nhận:?\*?\*?:? see Task/);
    });

    it('tells the agent to build nothing when no local part remains', () => {
        const template = makeHomeGeneralTemplate('vi', 'Đặc tả chung', labels);
        const need = 'Một trang nhỏ ghi việc nhà, có nút xóa việc đã xong.';
        const markdown = generateHomeSpec(template, { goal: need }, { goal: need }, 'vi', need, need, undefined, labels);
        expect(markdown).toContain('If nothing useful remains once those parts are left out, build nothing');
        expect(markdown).toContain('Ordinary page features such as a button that deletes an item the user typed are local and stay in.');
        expect(markdown).toContain('Nếu việc của bạn có phần gửi tin');
    });
});

describe('a short line of the request never swallows an identical short answer', () => {
    it('keeps "Không" answers in the agent part when the clarification also has a line "Không"', () => {
        const need = 'Làm trang ghi việc nhà trong tuần.\nCó gửi Zalo cho cả nhà không?\nKhông';
        const template = makeHomeGeneralTemplate('vi', 'Đặc tả chung', { goal: 'Mục tiêu', constraints: 'Giới hạn' });
        const entered = { goal: 'Làm trang ghi việc nhà trong tuần.', constraints: 'Không' };
        const markdown = generateHomeSpec(template, entered, entered, 'vi', need, need, undefined, { goal: 'Mục tiêu', constraints: 'Giới hạn' });
        const agent = markdown.split(divider)[1];
        expect(agent).not.toMatch(/Giới hạn:?\*?\*?:? see Task/);
        expect(agent).not.toMatch(/Constraints:?\*?\*?:? see Task/);
    });
});
