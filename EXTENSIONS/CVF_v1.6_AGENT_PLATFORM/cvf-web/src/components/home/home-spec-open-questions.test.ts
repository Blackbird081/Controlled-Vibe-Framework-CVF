// Text Encoding Exception: these excerpts keep the Vietnamese answers from the intake examples verbatim.
import { describe, expect, it } from 'vitest';
import { getHomeExportTemplate } from '@/lib/home-spec-jev-catalog';
import { generateHomeSpec, makeHomeGeneralTemplate } from './home-spec-export';
import { collectHomeOpenQuestions } from './home-spec-open-questions';

const general = makeHomeGeneralTemplate('en', 'General specification', {
    goal: 'Goal', context: 'Context', constraints: 'Constraints', deliverable: 'Expected result',
});

function openQuestions(description: string, answers: Record<string, string> = {}, template = general) {
    const specification = generateHomeSpec(template, answers, answers, 'vi', description, description);
    const section = specification.split('### Open Questions\n')[1].split('\n---\n')[0];
    return section.split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(2));
}

describe('Home specification open questions', () => {
    it.each([
        ['H10.1', '40 căn, phí 350.000đ/tháng/căn, hạn đóng ngày 10. Thu tiền mặt và chuyển khoản. Người thu: trưởng ban và một kế toán tình nguyện. Nhắc qua Zalo nhóm. Chưa biết có phí phạt trễ không.', 'Chưa biết có phí phạt trễ không.'],
        ['H10.3', '2 thang máy. Hầm xe máy 60 chỗ, không có ô tô. Cấm xe sau 23h. Chưa nghĩ tới mức phạt.', 'Chưa nghĩ tới mức phạt.'],
        ['H8.2', 'file Excel lịch hẹn năm ngoái, khoảng 2.400 dòng. có cột ngày, giờ, bác sĩ, loại dịch vụ, trạng thái (đến/không đến/hủy), số điện thoại. không có cột lý do', 'không có cột lý do'],
        ['VI không dấu', 'Toi can bang theo doi. Chua biet muc phi.', 'Chua biet muc phi.'],
        ['EN not sure', "I'm not sure who owns the source file.", "I'm not sure who owns the source file."],
        ['EN no … yet', 'We have no test data yet.', 'We have no test data yet.'],
        ['EN thought', "I haven't thought about insurance yet.", "I haven't thought about insurance yet."],
    ])('keeps the source wording for %s before blank required fields', (_id, request, excerpt) => {
        expect(openQuestions(request)).toContain(excerpt);
        expect(openQuestions(request).indexOf(excerpt)).toBeLessThan(openQuestions(request).indexOf('Goal'));
    });

    it('H8.1 lists two unknown answers separately and retains their field labels', () => {
        const template = getHomeExportTemplate('app_requirements_spec', 'en')!;
        const [name, exclusions] = openQuestions('em muốn có cái trang cho bệnh nhân tự đặt lịch khám, chọn bác sĩ với giờ trống, rồi hệ thống nhắn Zalo nhắc trước 1 ngày', {
            appName: 'chưa nghĩ tới', outOfScope: 'chưa nghĩ tới',
        }, template);
        expect(name).toBe('Tên ứng dụng: bạn chưa biết');
        expect(exclusions).toBe('Bản đầu KHÔNG cần làm gì: bạn chưa biết');
    });

    it('H7.1 marks a short “Không biết.” as an open answer and skips a completed negative answer', () => {
        const rows = openQuestions('Làm lại trang web giới thiệu của trường cho đẹp và dễ xem trên điện thoại, giữ nội dung cũ.', {
            goal: 'Giữ nội dung cũ của trang giới thiệu.', context: 'Không biết.',
            outOfScope: 'không cần', homeInputReferences: 'không có',
        });
        expect(rows).toEqual(['Context: bạn chưa biết']);
    });

    it('H7.1 keeps field-specific answers and drops the two topicless lines from run four', () => {
        const goal = 'Làm lại trang web giới thiệu của trường cho đẹp và dễ xem trên điện thoại, giữ nội dung cũ.';
        const context = 'Tôi là giáo viên tin học THCS, kiêm phụ trách website của trường. Dùng máy tính tốt nhưng không biết lập trình, chưa từng nghe về CVF.';
        const description = `${goal}\n${context} Giữ nội dung cũ của trang giới thiệu. Các chi tiết khác: không biết.`;
        expect(openQuestions(description, {
            goal, context, constraints: 'Giữ nội dung cũ của trang giới thiệu. Chỗ không biết: không biết.',
            successCriteria: 'Không biết.', outOfScope: 'Chưa nghĩ tới.', homeInputReferences: 'Không biết.',
        })).toEqual([
            'Thế nào thì coi là xong: bạn chưa biết',
            'Bản đầu KHÔNG cần làm gì: bạn chưa biết',
            'Bạn sẽ gửi kèm tệp, mẫu hay đường dẫn nào cho người làm: bạn chưa biết',
        ]);
    });

    it('puts a concrete unknown first, then an answered required field, then optional answers', () => {
        const rows = openQuestions('Tôi không biết. Other details: I don’t know.', {
            homeInputReferences: 'Không biết.',
            outOfScope: 'Chưa nghĩ tới.',
            goal: 'Không biết.',
            context: 'Chưa biết có phí phạt trễ không.',
        });
        expect(rows).toEqual([
            'Chưa biết có phí phạt trễ không.',
            'Goal: bạn chưa biết',
            'Bạn sẽ gửi kèm tệp, mẫu hay đường dẫn nào cho người làm: bạn chưa biết',
            'Bản đầu KHÔNG cần làm gì: bạn chưa biết',
        ]);
    });

    it('skips conversational negatives and caps the list at five in input order', () => {
        expect(openQuestions('Không có gì khó. Không có vấn đề. No problem.', { goal: 'Viết báo cáo' })).toEqual([]);
        const six = ['one', 'two', 'three', 'four', 'five', 'six'].map(item => `I don't know ${item}.`);
        expect(openQuestions(six.join(' '))).toEqual(six.slice(0, 5));
    });

    it('drops the topicless replies from H11.5 and H12.1 but keeps a specific unknown', () => {
        const goal = 'Tạo bảng theo dõi ca làm';
        const description = "Chưa biết cụ thể là gì. Not sure yet, haven't thought about it. I don't know what it is. Chưa biết có phí phạt trễ không.";
        expect(openQuestions(description, { goal })).toEqual(['Chưa biết có phí phạt trễ không.']);
    });

    it('adds the field name when an otherwise topicless answer has one', () => {
        const rows = openQuestions('Lập bảng theo dõi', {
            goal: 'Đơn hàng theo ngày', context: "not sure yet, haven't thought about it",
        });
        expect(rows).toEqual(['Context: bạn chưa biết']);
    });

    it.each([
        'chưa biết', 'không biết.', 'chưa nghĩ tới', 'chua biet', 'khong biet', 'chua nghi toi',
        "don't know", 'do not know', 'not sure', "I’m not sure yet", "I haven't thought about it", 'Unknown',
    ])('records %s once as a field status', answer => {
        const labels = new Map([['limits', 'Giới hạn']]);
        const rows = collectHomeOpenQuestions('Viết bản hướng dẫn', {limits: `${answer}\n${answer}`}, labels, new Set(), 'bạn chưa biết');
        expect(rows).toEqual(['Giới hạn: bạn chưa biết']);
    });

    it('uses the English field label and preserves an answer with a topic verbatim', () => {
        const question = 'I don’t know if the office needs printed copies.';
        const labels = new Map([['limits', 'Constraints'], ['output', 'Output']]);
        const rows = collectHomeOpenQuestions('Write an office procedure', {limits:'not sure', output:question}, labels, new Set(), 'user does not know');
        expect(rows).toEqual([question, 'Constraints: user does not know']);
    });

    it('keeps the first source wording when H11.1 is repeated without accents, punctuation, or lowercase', () => {
        const first = 'Chưa biết có cần phụ huynh đăng nhập riêng không';
        const rows = openQuestions(`${first}\nCHUA BIET CO CAN PHU HUYNH DANG NHAP RIENG KHONG.`, {
            goal: 'Thiết kế trang theo dõi lớp', context: `${first}.`, constraints: 'không có cột lý do',
        });
        expect(rows).toEqual([first, 'không có cột lý do']);
    });
});
