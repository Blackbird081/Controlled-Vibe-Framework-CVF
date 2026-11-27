// Text Encoding Exception: Vietnamese user-facing copy shared by the Home preview and the downloaded file.
import type { HomeSpecLocale } from '@/lib/home-spec-jev-catalog';

/** Strings shown in the on-screen preview; the downloaded file reuses them so the two cannot disagree. */
export const homeSpecPreviewCopy = {
    vi: {
        outcome: 'Loại kết quả', description: 'Mô tả công việc', clarification: 'Thông tin làm rõ',
        fromUserContext: 'Lấy từ phần bạn mô tả (chưa nhập riêng)',
        howTo: 'Cách dùng tệp này',
        provided: 'Đã có', userWillSupply: 'Người dùng sẽ bổ sung', openQuestions: 'Câu hỏi mở',
        noMaterials: 'Chưa ghi tệp, mẫu hay đường dẫn sẽ gửi thêm.',
        nothingOpen: 'Chưa thấy chi tiết nào cần hỏi thêm theo mẫu này.',
        checkOpen: 'Trợ lý sẽ xác định chi tiết nào còn cần làm rõ trước khi làm phần phụ thuộc.',
    },
    en: {
        outcome: 'Outcome', description: 'Work description', clarification: 'Clarification',
        fromUserContext: 'Taken from the description you entered',
        howTo: 'How to use this file',
        provided: 'Provided', userWillSupply: 'User will supply', openQuestions: 'Open questions',
        noMaterials: 'No files, examples or links listed for later.',
        nothingOpen: 'This template has no unanswered details flagged.',
        checkOpen: 'These details will be clarified before any work that depends on them.',
    },
} as const;

const downloadCopy = {
    vi: {
        title: 'Bản đặc tả của bạn (để bạn kiểm tra)',
        howToText: 'Phần này tóm tắt bằng tiếng Việt những gì bạn đã nêu, để bạn kiểm tra trước khi giao. Phần bên dưới đường kẻ được viết bằng tiếng Anh cho trợ lý AI sẽ thực hiện công việc. Hãy gửi nguyên tệp cho trợ lý đó.',
        divider: 'PHẦN DƯỚI ĐÂY VIẾT BẰNG TIẾNG ANH CHO TRỢ LÝ AI THỰC HIỆN CÔNG VIỆC',
    },
    en: {
        title: 'Your specification (for you to check)',
        howToText: 'This part summarizes what you provided so you can check it before handing the file over. The part below the divider is the technical version for the AI assistant that will do the work. Send the whole file to that assistant.',
        divider: 'THE PART BELOW IS WRITTEN FOR THE AI ASSISTANT THAT WILL DO THE WORK',
    },
} as const;

export type HomeReadableSection = { label: string; value: string };

export function buildHomeReadableSection(
    language: HomeSpecLocale,
    sections: readonly HomeReadableSection[],
    references: string | undefined,
    openQuestions: readonly string[],
): string {
    const t = homeSpecPreviewCopy[language];
    const d = downloadCopy[language];
    return [
        `# ${d.title}`,
        `## ${t.provided}`,
        ...sections.map(section => `**${section.label}**\n\n${section.value}`),
        `## ${t.userWillSupply}`,
        references?.trim() ? references : t.noMaterials,
        `## ${t.openQuestions}`,
        openQuestions.length ? t.checkOpen : t.nothingOpen,
        ...(openQuestions.length ? [openQuestions.map(question => `- ${question}`).join('\n')] : []),
        `## ${t.howTo}`,
        d.howToText,
        `---\n\n**${d.divider}**`,
    ].join('\n\n') + '\n\n';
}

export const HOME_TEXT_LIMIT = 3000;

const groupThousands = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Same grouping in both languages, for example "1 054 / 3 000". */
export function formatHomeCharacterCount(length: number): string {
    return `${groupThousands(length)} / ${groupThousands(HOME_TEXT_LIMIT)}`;
}
