// Text Encoding Exception: Vietnamese user-facing copy under test.
import { describe, expect, it } from 'vitest';
import { buildHomeClarifyGuidance, mentionsHomeDevice } from './home-spec-clarify-questions';

describe('buildHomeClarifyGuidance', () => {
    it('asks about the device, the record, the outside part and the unknowns for a plain request (vi)', () => {
        const { questions, hint } = buildHomeClarifyGuidance('vi', 'Cô muốn một trang đếm ngược tới buổi họp');
        expect(questions).toEqual([
            'Ai sẽ dùng, và dùng trên điện thoại hay máy tính?',
            'Cần ghi lại hoặc hiện ra những thông tin gì?',
            'Trang có cần tự gửi, đăng lên mạng hay kết nối tài khoản nào không?',
            'Điều gì bạn chưa chắc hoặc có thể thay đổi?',
        ]);
        expect(hint).toBe("Điều gì chưa biết, cứ ghi 'chưa biết'.");
    });

    it('leaves out the device question when the request already names a device', () => {
        for (const text of ['Một trang mở trên điện thoại', 'trang dung tren may tinh', 'A page for my laptop', 'works on a PHONE', 'tablet only']) {
            const { questions } = buildHomeClarifyGuidance('vi', text);
            expect(questions, text).toHaveLength(3);
            expect(questions[0], text).toBe('Cần ghi lại hoặc hiện ra những thông tin gì?');
        }
    });

    it('does not read a device out of an unrelated word', () => {
        expect(mentionsHomeDevice('Cần hoàn thành phoneme chart cho lớp')).toBe(false);
        expect(mentionsHomeDevice('Danh sách việc cần chuẩn bị')).toBe(false);
    });

    it('asks the general outside-effect question when no cue matches and the specific one when a cue matches', () => {
        const plain = buildHomeClarifyGuidance('vi', 'Một danh sách việc cần làm').questions;
        expect(plain).toContain('Trang có cần tự gửi, đăng lên mạng hay kết nối tài khoản nào không?');
        const cue = buildHomeClarifyGuidance('vi', 'Một trang tự gửi email mời phụ huynh').questions;
        expect(cue).toContain('Nếu việc của bạn có phần tự gửi, đăng lên mạng hoặc kết nối tài khoản: bạn muốn trang tự làm, hay chỉ chuẩn bị sẵn để bạn tự gửi?');
        expect(cue).not.toContain('Trang có cần tự gửi, đăng lên mạng hay kết nối tài khoản nào không?');
    });

    it('always asks what to record and what is uncertain, with 3 or 4 questions in total', () => {
        for (const text of ['x', 'Gửi email trên điện thoại', 'Một trang đếm ngày']) {
            for (const language of ['vi', 'en'] as const) {
                const { questions } = buildHomeClarifyGuidance(language, text);
                expect(questions.length).toBeGreaterThanOrEqual(3);
                expect(questions.length).toBeLessThanOrEqual(4);
            }
        }
    });

    it('has English equivalents for each case', () => {
        const plain = buildHomeClarifyGuidance('en', 'A small countdown page');
        expect(plain.questions).toEqual([
            'Who will use it, and on a phone or a computer?',
            'What information should it record or show?',
            'Does the page need to send anything, post online or connect to any account?',
            'What are you unsure about, or what might change?',
        ]);
        expect(plain.hint).toBe("If you do not know something, just write 'don't know'.");
        const cue = buildHomeClarifyGuidance('en', 'A page on my phone that will email all parents');
        expect(cue.questions).toHaveLength(3);
        expect(cue.questions[1]).toMatch(/^If your request includes sending, posting online or connecting an account/);
    });
});
