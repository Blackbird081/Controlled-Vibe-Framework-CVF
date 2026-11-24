// Text Encoding Exception: the request patterns distinguish words in Vietnamese input.
const explicitOutput = /^(?:deliverable|output|kết quả(?: cần nhận)?|đầu ra)\s*:\s*\S/iu;

const englishRequest = /^(?:(?:please|help me(?: to)?)\s+|(?:i|we)\s+(?:need|want|would like)\s+to\s+)?(?:write|draft|create|prepare|design|make|build|produce|send|redesign|rewrite|plan)\s+\S/iu;
const englishOutput = /^(?:(?:i|we)\s+(?:need|want|would like)\s+(?:(?:an?|the)\s+)?|an?\s+)(?:table|checklist|email|message|report|presentation|template|website|spreadsheet|plan|guide)\b/iu;

const vietnameseArtifact = /^(?:(?:một|cái|bản|mẫu|tờ|bộ)\s+)*(?:bảng|danh sách|quy trình|kế hoạch|báo cáo|thư|email|tin nhắn|thông báo|bản nháp|nội quy|tài liệu|biểu mẫu|bài(?:\s+đăng|\s+viết)?|trang|website|trang web|ứng dụng|tệp|hợp đồng|hướng dẫn|kịch bản|bản trình bày|bản đặc tả|đặc tả)(?=$|[^\p{L}\p{M}])/iu;
const vietnameseIntent = /^(?:(?:tôi|chúng tôi|mình|em|anh|chị)\s+)?(?:cần|muốn|mong)\s+/iu;
const vietnameseAction = /^(?:(?:nhờ|giúp)\s+(?:(?:tôi|mình|em)\s+)?)?(?:làm lại|viết|soạn|lập|tạo|thiết kế|chuẩn bị|xây dựng|làm)\s+(?:(?:cho|giúp)\s+(?:tôi|mình|em)\s+)?/iu;
const vietnameseNominal = /^(?:một|bản|mẫu|tờ|bộ)\s+/iu;

export function findHomeSpecDeliverable(statements: string[]): string | undefined {
    let requested: string | undefined;
    let named: string | undefined;
    for (const statement of statements) {
        const text = statement.normalize('NFC');
        if (explicitOutput.test(text)) return statement;

        const withoutIntent = text.replace(vietnameseIntent, '');
        const output = withoutIntent.replace(vietnameseAction, '');
        const namesArtifact = vietnameseArtifact.test(output);
        if (englishRequest.test(text) || (output !== withoutIntent && namesArtifact)) requested ??= statement;
        if (englishOutput.test(text) || ((withoutIntent !== text || vietnameseNominal.test(text)) && namesArtifact)) named ??= statement;
    }
    return requested ?? named;
}
