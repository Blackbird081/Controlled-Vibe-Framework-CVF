// Text Encoding Exception: the duplicate fixture preserves the two Vietnamese questions heard in Wave 7B.
import { describe, expect, it } from 'vitest';
import { parseHomeClarification } from './home-spec-clarification-provider';
import { wave7ClarificationFixtures } from './home-spec-clarification.wave7.fixtures';

describe('Home clarification reads the measured model replies', () => {
    it.each(wave7ClarificationFixtures)('preserves every complete question item in $id', ({ reply, questions }) => {
        const parsed = parseHomeClarification(reply);
        expect(parsed).not.toBeNull();
        expect(parsed?.questions).toEqual(questions);
        expect(parsed?.questions.length).toBeLessThanOrEqual(5);
    });
});

describe('Home clarification reads optional summaries and notes', () => {
    it('accepts question-only output and strips the question heading', () => {
        expect(parseHomeClarification('## Open questions\n\n1. Who owns the log?')).toEqual({ summary: [], questions: ['Who owns the log?'] });
    });

    it.each([
        ['Unknown: “who verifies the log after 5 p.m.?”', '“Who verifies the log after 5 p.m.?”'],
        ['Chưa rõ: địa điểm giao chìa khóa ở đâu?', 'Địa điểm giao chìa khóa ở đâu?'],
        ['Question: who called? who picked up?', 'Who called? who picked up?'],
    ])('capitalizes the first letter without editing the rest of %s', (source, expected) => {
        const summary = 'the log is on paper.';
        expect(parseHomeClarification(`${summary}\n\nOpen questions\n- ${source}`))
            .toEqual({ summary:[summary], questions:[expected] });
    });

    it('keeps a full item and indented explanation together, with trailing free text kept as notes', () => {
        expect(parseHomeClarification('### Open questions\n1. Who signs? Who keeps the log?\n   If nobody knows, leave it open.\n\nUnknowns: The format is unsettled.')).toEqual({
            questions: ['Who signs? Who keeps the log? If nobody knows, leave it open.'],
            summary: ['The format is unsettled.'],
        });
    });

    it('keeps a free-form line whole even when it contains two question marks', () => {
        expect(parseHomeClarification('Who will confirm? The lead or the shift manager?')?.questions)
            .toEqual(['Who will confirm? The lead or the shift manager?']);
    });

    it('merges the live Vietnamese duplicate before applying the five-item limit', () => {
        const reply = [
            '### Những điểm cần làm rõ',
            '1. Chưa rõ: Ai xác nhận việc bàn giao?',
            '2. Câu hỏi: Ai là người xác nhận bàn giao chìa khóa?',
            '3. Giờ nhận chìa khóa ghi ở đâu?',
            '4. Ai cập nhật sổ khi đổi ca?',
            '5. Vị trí cất sổ ở đâu?',
            '6. Nếu chìa khóa thất lạc thì báo ai?',
            '7. Ai in sổ cuối tháng?',
        ].join('\n');
        expect(parseHomeClarification(reply)).toEqual({ summary: [], questions: [
            'Ai xác nhận việc bàn giao?', 'Giờ nhận chìa khóa ghi ở đâu?', 'Ai cập nhật sổ khi đổi ca?',
            'Vị trí cất sổ ở đâu?', 'Nếu chìa khóa thất lạc thì báo ai?',
        ] });
    });

    it('does not merge two distinct questions about the same subject', () => {
        const text = 'Open questions\n- Ai xác nhận bàn giao chìa khóa sáng thứ Ba?\n- Ai xác nhận bàn giao chìa khóa sáng thứ Tư?';
        expect(parseHomeClarification(text)?.questions).toHaveLength(2);
    });

    it('accepts list items in a question section even without a question mark', () => {
        expect(parseHomeClarification('Open questions\n- Question: Identify the approver.\n- When is the deadline?')?.questions)
            .toEqual(['Identify the approver.', 'When is the deadline?']);
    });

    it('accepts useful summary-only text', () => {
        expect(parseHomeClarification('The goal is a shared key log.')).toEqual({ summary: ['The goal is a shared key log.'], questions: [] });
    });

    it.each([null, '   ', '### Open questions', '```js\nconst test = 1;\n```', 'a'.repeat(12_001)])('rejects unusable, fenced, or oversized content', text => {
        expect(parseHomeClarification(text)).toBeNull();
    });
});
