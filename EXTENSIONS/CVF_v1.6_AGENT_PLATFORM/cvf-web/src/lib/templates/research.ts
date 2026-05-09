import { Template } from '@/types';

export const researchTemplates: Template[] = [
    {
        id: 'research_project_wizard',
        name: '🔬 Dự án Nghiên cứu',
        icon: '🔬',
        description: 'Multi-step wizard tạo Research Proposal với governed packet và live path để đối soát',
        category: 'research',
        difficulty: 'medium',
        fields: [],
        intentPattern: '',
        outputExpected: ['Research Proposal', 'Methodology', 'Literature Review Outline', 'Timeline'],
    },
    {
        id: 'data_analysis_wizard',
        name: '📊 Phân tích Dữ liệu',
        icon: '📉',
        description: 'Multi-step wizard tạo Data Analysis Plan với governed packet và live path để đối soát',
        category: 'research',
        difficulty: 'advanced',
        fields: [],
        intentPattern: '',
        outputExpected: ['Analysis Plan', 'Data Profile', 'Methodology', 'Deliverables'],
    },
    {
        id: 'data_analysis',
        name: 'Phân tích Dữ liệu',
        icon: '📈',
        description: 'Biến dữ liệu hoặc báo cáo thô thành insight và khuyến nghị dễ hiểu cho người ra quyết định không chuyên phân tích',
        category: 'research',
        fields: [
            { id: 'dataset', type: 'textarea', label: 'Bạn đang có dữ liệu / báo cáo gì?', placeholder: 'Mô tả nguồn dữ liệu, báo cáo, export hoặc bảng số liệu đang có', required: true, rows: 4, section: 'required', hint: 'Bạn không cần nói tên phương pháp phân tích. Chỉ cần mô tả mình có gì trong tay.', example: 'Export từ Google Analytics 12 tháng gồm sessions, bounce rate, conversion theo ngày và theo channel.' },
            { id: 'questions', type: 'textarea', label: 'Bạn cần ra quyết định gì từ dữ liệu này?', placeholder: 'Những câu hỏi kinh doanh hoặc vận hành cần được trả lời', required: true, rows: 3, section: 'required', hint: 'Đặt câu hỏi theo ngôn ngữ quyết định: nên đầu tư đâu, chỗ nào đang tệ, nhóm nào đáng ưu tiên...', example: '1. Kênh nào đang đem lại lead tốt nhất?\n2. Tháng nào cần tăng ngân sách?\n3. Nhóm khách nào đáng tập trung hơn?' },
            { id: 'importantSlices', type: 'textarea', label: 'Có nhóm, mốc thời gian, hoặc khu vực nào cần tách riêng không?', placeholder: 'Ví dụ: theo tháng, theo kênh, theo khu vực, theo phân khúc khách hàng...', required: false, rows: 2, section: 'advanced', hint: 'Giúp AI nhìn đúng phần dữ liệu quan trọng với bạn.', example: 'So sánh quý 1 với quý 4, và tách riêng paid search vs organic.' },
            { id: 'knownLimitations', type: 'textarea', label: 'Có giới hạn hoặc nghi ngờ nào về dữ liệu không?', placeholder: 'Thiếu dữ liệu, số chưa sạch, tracking chưa chuẩn...', required: false, rows: 2, section: 'advanced', hint: 'Nếu bạn biết dữ liệu chưa hoàn hảo, ghi ở đây để AI diễn giải cẩn thận hơn.', example: 'Tracking TikTok chỉ mới ổn từ tháng 8, nên các tháng trước có thể thiếu số.' },
        ],
        intentPattern: `INTENT:
Tôi muốn biến dữ liệu này thành insight dễ hiểu và có thể dùng để ra quyết định.

NGUỒN DỮ LIỆU / BÁO CÁO:
[dataset]

QUYẾT ĐỊNH / CÂU HỎI CẦN TRẢ LỜI:
[questions]

NHÓM / GIAI ĐOẠN CẦN TÁCH RIÊNG:
[importantSlices]

GIỚI HẠN DỮ LIỆU ĐÃ BIẾT:
[knownLimitations]

SUCCESS CRITERIA:
- Analyze each data slice to answer every question directly with evidence
- Nêu rõ bằng chứng và mức độ tin cậy theo dữ liệu đang có
- Kết thúc bằng các hành động ưu tiên
- Không bắt người dùng đọc hiểu thuật ngữ thống kê để dùng được kết quả

OUTPUT FORMAT (use these exact section headings in English):
## What Data We Looked At
## What The Data Clearly Suggests
## What Needs Caution
## Recommended Actions
## Follow-Up Checklist`,
        outputExpected: ['Tóm tắt dữ liệu', 'Insight chính', 'Điều dữ liệu chưa trả lời chắc chắn', 'Khuyến nghị ưu tiên', 'Checklist theo dõi tiếp'],
        difficulty: 'advanced',
        outputTemplate: `# Decision-Focused Data Analysis

## 1. What Data We Looked At
- Source
- Time range
- Important slices

## 2. What The Data Clearly Suggests
- Finding
- Supporting evidence
- Business meaning

## 3. What Needs Caution
- Data gaps
- Weak signals
- Things not safe to conclude yet

## 4. Recommended Actions
- Highest-priority action
- Secondary action
- What to monitor next

## 5. Follow-Up Checklist
- Extra data to collect
- Questions to revisit later`,
        sampleOutput: `# Decision-Focused Data Analysis

## 1. What Data We Looked At
- 12 months of Google Analytics export split by channel and month.
- Special focus on paid search, organic, and email.

## 2. What The Data Clearly Suggests
- Email is the most efficient channel, with the strongest conversion and best return on effort.
- Paid search creates volume, but quality drops outside campaign peaks.
- November is the strongest month; February is consistently weak.

## 3. What Needs Caution
- TikTok data before August looks incomplete, so its early performance should not drive budget decisions.
- Some smaller segments have too little volume for strong conclusions.

## 4. Recommended Actions
- Increase effort in email first because it converts best with the clearest signal.
- Keep paid search, but tighten campaign targeting in low-performing months.
- Review page-speed and landing-page clarity before spending more on traffic acquisition.

## 5. Follow-Up Checklist
- Verify tracking quality for newer channels.
- Keep monthly channel scorecards.
- Recheck segment performance after one full quarter.`,
    },
];
