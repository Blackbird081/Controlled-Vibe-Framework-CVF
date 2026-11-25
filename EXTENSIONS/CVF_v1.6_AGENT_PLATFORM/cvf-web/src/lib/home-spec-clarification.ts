import type { HomeSpecLocale } from './home-spec-jev-catalog';

// Text Encoding Exception: displayed and exported titles match in both languages.
export const homeClarificationTitle = {
    vi: 'AI làm rõ — chỉ để tham khảo', en: 'AI clarification — for reference only',
} as const;

export type HomeClarification = { summary: string[]; questions: string[] };
export type HomeClarificationAvailability = 'ready' | 'missing_key' | 'unavailable';
export type HomeClarificationInput = { language: HomeSpecLocale; goal: string; extra: string; answers: string[] };

function markdownText(value: string) {
    return value.replace(/[\\`*_{}[\]<>#+|]/g, '\\$&');
}

export function appendHomeSpecClarification(markdown: string, result: HomeClarification | null, language: HomeSpecLocale): string {
    if (!result) return markdown;
    const paragraphs = result.summary.map(markdownText).join('\n\n');
    const questions = result.questions.map((question, index) => `${index + 1}. ${markdownText(question)}`).join('\n');
    const appendix = [paragraphs, questions].filter(Boolean).join('\n\n');
    return `${markdown}\n\n---\n\n## ${homeClarificationTitle[language]}\n\n${appendix}\n`;
}
