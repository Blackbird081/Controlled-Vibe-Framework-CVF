// Text Encoding Exception: the duplicate fixture preserves the two Vietnamese questions heard in Wave 7B.
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { HOME_CLARIFICATION_PROMPT, parseHomeClarification, requestHomeClarification } from './home-spec-clarification';
import { wave7ClarificationFixtures } from './home-spec-clarification.wave7.fixtures';

it.each([
    ['vi','80f673b76225a76e7a6a9d966f1386e278af6aa5da63886bbc246aa9757cd412'],
    ['en','c44c61c0cb7c078afa869b9123bc9a883664d47b7cb26587b8f346c373558f42'],
] as const)('preserves the measured %s prompt byte for byte', (language, hash) => {
    expect(createHash('sha256').update(HOME_CLARIFICATION_PROMPT[language]).digest('hex')).toBe(hash);
});

describe('Home clarification on browsers without AbortSignal.any', () => {
    it.each(['cancel', 'timeout'] as const)('aborts one request on %s without retrying', async (reason) => {
        const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any');
        Object.defineProperty(AbortSignal, 'any', { configurable: true, value: undefined });
        vi.useFakeTimers();
        const fetch = vi.fn((_url: string, { signal }: RequestInit) => new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
        }));
        vi.stubGlobal('fetch', fetch);
        try {
            const request = new AbortController();
            const result = requestHomeClarification({ language: 'en', goal: 'Track handoffs in a paper log', extra: '', answers: [] }, 'fixture', request.signal)
                .catch(error => error);
            expect(fetch).toHaveBeenCalledTimes(1);
            await vi.advanceTimersByTimeAsync(24_999);
            expect(fetch.mock.calls[0][1].signal?.aborted).toBe(false);
            if (reason === 'cancel') request.abort();
            else await vi.advanceTimersByTimeAsync(1);
            expect(await result).toEqual({ status: reason === 'timeout' ? 'timeout' : 'provider_error' });
            expect(fetch.mock.calls[0][1].signal?.aborted).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.unstubAllGlobals();
            vi.useRealTimers();
            if (descriptor) Object.defineProperty(AbortSignal, 'any', descriptor);
            else Reflect.deleteProperty(AbortSignal, 'any');
        }
    });
});

it.each([
    ['The outlet is sparking and smells burnt.', ''],
    ['Book me a room for tomorrow.', ''],
    ['Check the equipment outside the office.', 'There is water dripping onto the power socket.'],
])('blocks a restricted input before the browser fetch: %s', async (goal, extra) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch',fetch);
    try {
        expect(await requestHomeClarification({language:'en',goal,extra,answers:[]},'fixture',new AbortController().signal))
            .toEqual({status:'outside_scope'});
        expect(fetch).not.toHaveBeenCalled();
    } finally {
        vi.unstubAllGlobals();
    }
});

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
