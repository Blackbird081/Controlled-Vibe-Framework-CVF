// Text Encoding Exception: Vietnamese and English labels for the optional Home questions.
import type { HomeSpecLocale } from './home-spec-jev-catalog';

const questions = [
    {
        id: 'successCriteria',
        exportLabel: 'Success criteria',
        descriptionField: 'specific observable criteria the result must meet to count as complete',
        en: { label: 'What will tell you the work is done?', help: 'For example, a new employee can follow the checklist without help.' },
        vi: { label: 'Thế nào thì coi là xong?', help: 'Ví dụ: Nhân viên mới có thể tự làm theo danh sách từng bước.' },
    },
    {
        id: 'outOfScope',
        exportLabel: 'First-version exclusions',
        descriptionField: 'items explicitly excluded from the first version',
        en: { label: 'What should the first version leave out?', help: 'For example, leave online payments for a later version.' },
        vi: { label: 'Bản đầu KHÔNG cần làm gì?', help: 'Ví dụ: Để phần thanh toán trực tuyến cho bản sau.' },
    },
    {
        id: 'homeInputReferences',
        exportLabel: 'Files, examples or links the user will send',
        descriptionField: 'names or links of specific files, examples or references the user says they will send or include as inputs',
        en: { label: 'What files, examples or links will you send to the person doing the work?', help: 'Enter names or links only. There is no upload here.' },
        vi: { label: 'Bạn sẽ gửi kèm tệp, mẫu hay đường dẫn nào cho người làm?', help: 'Chỉ ghi tên hoặc link, không tải lên.' },
    },
] as const;

export function getHomeCommonQuestions(locale: HomeSpecLocale) {
    return questions.map(({ id, exportLabel, descriptionField, [locale]: copy }) => ({
        id, exportLabel, descriptionField, ...copy,
    }));
}

export function isHomeCommonQuestion(id: string) {
    return questions.some(question => question.id === id);
}
