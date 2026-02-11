import { Template } from '@/types';

export const researchTemplates: Template[] = [
    {
        id: 'research_project_wizard',
        name: '🔬 Dự án Nghiên cứu',
        icon: '🔬',
        description: 'Multi-step wizard tạo Research Proposal qua 4 bước. Question → Methodology → Resources → Review',
        category: 'research',
        fields: [],
        intentPattern: '',
        outputExpected: ['Research Proposal', 'Methodology', 'Literature Review Outline', 'Timeline'],
    },
    {
        id: 'data_analysis_wizard',
        name: '📊 Phân tích Dữ liệu',
        icon: '📉',
        description: 'Multi-step wizard tạo Data Analysis Plan qua 5 bước. Problem → Understanding → Methodology → Deliverables → Review',
        category: 'research',
        fields: [],
        intentPattern: '',
        outputExpected: ['Analysis Plan', 'Data Profile', 'Methodology', 'Deliverables'],
    },
    {
        id: 'data_analysis',
        name: 'Phân tích Dữ liệu',
        icon: '📈',
        description: 'Phân tích dữ liệu và rút insights',
        category: 'research',
        fields: [
            { id: 'dataset', type: 'textarea', label: 'Mô tả dataset', placeholder: 'Loại data, sources, format...', required: true, rows: 4, section: 'required', hint: 'Mô tả nguồn dữ liệu, định dạng, và quy mô', example: 'CSV file 50K rows từ Google Analytics: sessions, bounce rate, conversion theo ngày. Từ 01/2025 đến 12/2025.' },
            { id: 'questions', type: 'textarea', label: 'Câu hỏi nghiên cứu', placeholder: 'Bạn muốn tìm hiểu điều gì?', required: true, rows: 3, section: 'required', hint: 'Đặt câu hỏi cụ thể, tránh câu hỏi quá chung chung', example: '1. Các yếu tố nào ảnh hưởng lớn nhất đến conversion?\n2. Seasonal patterns ra sao?\n3. Segment nào có ROI cao nhất?' },
            { id: 'methods', type: 'text', label: 'Phương pháp', placeholder: 'VD: Regression, clustering...', required: false, section: 'advanced', hint: 'Để trống nếu muốn AI tự đề xuất phương pháp phù hợp', example: 'Correlation analysis, time series decomposition' },
        ],
        intentPattern: `INTENT:
Tôi muốn phân tích dữ liệu.

DATASET:
[dataset]

RESEARCH QUESTIONS:
[questions]

METHODS: [methods]

SUCCESS CRITERIA:
- Insights rõ ràng
- Có supporting evidence
- Actionable recommendations`,
        outputExpected: ['Dataset Overview', 'Key Findings', 'Statistical Analysis', 'Visualizations', 'Insights', 'Recommendations'],
    },
];
