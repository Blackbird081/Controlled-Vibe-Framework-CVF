// Text Encoding Exception: Vietnamese user-facing copy for the guiding questions of the Home clarification step.
import { hasOutsideEffectCue } from '@/lib/home-spec-outside-effect-cues';
import type { HomeSpecLocale } from '@/lib/home-spec-jev-catalog';

export interface HomeClarifyGuidance {
    questions: string[];
    hint: string;
}

const copy = {
    vi: {
        device: 'Ai sẽ dùng, và dùng trên điện thoại hay máy tính?',
        record: 'Cần ghi lại hoặc hiện ra những thông tin gì?',
        outsideMentioned: 'Nếu việc của bạn có phần tự gửi, đăng lên mạng hoặc kết nối tài khoản: bạn muốn trang tự làm, hay chỉ chuẩn bị sẵn để bạn tự gửi?',
        outsideAsk: 'Trang có cần tự gửi, đăng lên mạng hay kết nối tài khoản nào không?',
        uncertain: 'Điều gì bạn chưa chắc hoặc có thể thay đổi?',
        hint: "Điều gì chưa biết, cứ ghi 'chưa biết'.",
    },
    en: {
        device: 'Who will use it, and on a phone or a computer?',
        record: 'What information should it record or show?',
        outsideMentioned: 'If your request includes sending, posting online or connecting an account: should the page do it by itself, or only get it ready for you to send?',
        outsideAsk: 'Does the page need to send anything, post online or connect to any account?',
        uncertain: 'What are you unsure about, or what might change?',
        hint: "If you do not know something, just write 'don't know'.",
    },
} as const;

const stripAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');

// Checked on accent-stripped, lower-cased text so typing without accents still counts as a mention.
const DEVICE_MENTION = /(?<![\p{L}\p{N}])(?:dien thoai|may tinh|may tinh bang|laptop|tablet|ipad|iphone|android|smartphone|mobile|phone|computer|desktop|pc|macbook|windows)(?![\p{L}\p{N}])/u;

export function mentionsHomeDevice(text: string): boolean {
    return DEVICE_MENTION.test(stripAccents(text.normalize('NFC').toLowerCase()));
}

/** Three or four plain-language questions chosen only from the request text: no AI, no network. */
export function buildHomeClarifyGuidance(language: HomeSpecLocale, requestText: string): HomeClarifyGuidance {
    const c = copy[language];
    const questions: string[] = [];
    if (!mentionsHomeDevice(requestText)) questions.push(c.device);
    questions.push(c.record);
    questions.push(hasOutsideEffectCue(requestText) ? c.outsideMentioned : c.outsideAsk);
    questions.push(c.uncertain);
    return { questions, hint: c.hint };
}
