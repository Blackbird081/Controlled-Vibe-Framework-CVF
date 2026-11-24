// Text Encoding Exception: Vietnamese skill names and use cases are localized UI copy.
import type { Skill, SkillCategory } from '@/types/skill';
import vietnamesePurposes from '@/data/skill-purpose.vi.json';

const localizedPurposes: Readonly<Record<string, string>> = vietnamesePurposes;
const purposeSection = /^##[^\r\n]*(?:Purpose|Mục đích)[ \t]*\r?\n[\s\S]*?(?=^---[ \t]*\r?$|^##[ \t]|(?![\s\S]))/im;

export const categoryNames: Record<string, { vi: string; en: string }> = {
    ai_ml_evaluation: { vi: "Chọn và đánh giá mô hình AI", en: "AI/ML Evaluation" },
    app_development: { vi: "Làm ứng dụng", en: "App Development" },
    business_analysis: { vi: "Phân tích kinh doanh", en: "Business Analysis" },
    content_creation: { vi: "Viết và biên soạn", en: "Content Creation" },
    finance_analytics: { vi: "Phân tích tài chính", en: "Finance Analytics" },
    marketing_seo: { vi: "Tiếp thị và tìm kiếm", en: "Marketing & SEO" },
    product_ux: { vi: "Sản phẩm và trải nghiệm sử dụng", en: "Product & UX" },
    security_compliance: { vi: "Bảo mật và tuân thủ", en: "Security & Compliance" },
    technical_review: { vi: "Rà soát kỹ thuật", en: "Technical Review" },
    agent_system_skills: { vi: "Công cụ dành cho agent", en: "Agent System Skills" },
};

// Hints use the indexed skill's purpose, summary or recommendedWhen.
export const skillCopy: Record<string, { title: string; hint: { vi: string; en: string } }> = {
    'agent_system_skills/cvf-dispatch-quality-reviewer': { title: "Kiểm tra giao việc cho agent", hint: { vi: "Kiểm tra lệnh giao việc và tài liệu làm căn cứ trước khi agent thực hiện.", en: "Check work orders and baselines before an agent starts work." } },
    'agent_system_skills/cvf-engineering-spec-driven-development': { title: "Phát triển theo đặc tả", hint: { vi: "Viết thỏa thuận triển khai trước khi sửa mã nếu yêu cầu còn mơ hồ hoặc rủi ro cao.", en: "Write an implementation specification when requirements are unclear or the change is high risk." } },
    'agent_system_skills/cvf-engineering-planning-task-breakdown': { title: "Lập kế hoạch và chia việc", hint: { vi: "Chia công việc và sắp thứ tự thực hiện khi cần một kế hoạch hoặc lộ trình.", en: "Turn requirements into a roadmap or a sequence of tasks." } },
    'agent_system_skills/cvf-engineering-api-interface-design': { title: "Thiết kế giao diện giữa các phần mềm", hint: { vi: "Xác định quy ước trao đổi dữ liệu giữa các phần mềm.", en: "Define API endpoints, module interfaces, or data schemas." } },
    'agent_system_skills/cvf-engineering-browser-runtime-verification': { title: "Kiểm tra trang trong trình duyệt", hint: { vi: "Xác minh hành vi trên trang web, lỗi trình duyệt hoặc ảnh chụp giao diện.", en: "Verify web page behavior, browser errors, or screenshots." } },
    'agent_system_skills/cvf-engineering-ci-cd-quality-gates': { title: "Đặt điều kiện kiểm tra tự động", hint: { vi: "Xác định điều kiện kiểm tra trong quy trình tích hợp, triển khai hoặc GitHub Actions.", en: "Plan checks for a CI pipeline, GitHub Actions, or a deployment." } },
    'agent_system_skills/cvf-engineering-code-review-quality': { title: "Rà soát chất lượng thay đổi mã", hint: { vi: "Đối chiếu thay đổi mã của agent và đánh giá chất lượng triển khai.", en: "Review a change or assess another agent's implementation." } },
    'agent_system_skills/cvf-engineering-code-simplification': { title: "Đơn giản hóa mã", hint: { vi: "Giảm trùng lặp hoặc làm mã dễ bảo trì hơn.", en: "Refactor code to remove duplication or improve maintainability." } },
    'agent_system_skills/cvf-governance-context-engineering': { title: "Chuẩn bị ngữ cảnh cho agent", hint: { vi: "Rà soát thông tin, quy tắc khởi động hoặc bộ nhớ mà agent nhận được.", en: "Set up agent context, including startup rules or memory." } },
    'agent_system_skills/cvf-engineering-debugging-error-recovery': { title: "Tìm lỗi và khôi phục", hint: { vi: "Tìm nguyên nhân khi test, bản dựng hoặc hành vi của phần mềm gặp lỗi.", en: "Diagnose a failing test, broken build, exception, or unexpected behavior." } },
    'agent_system_skills/cvf-engineering-deprecation-migration': { title: "Thay thế thành phần cũ", hint: { vi: "Lên kế hoạch chuyển đổi phiên bản hoặc ngừng API cũ có tính đến tương thích.", en: "Plan a migration or the retirement of an old API while managing compatibility." } },
    'agent_system_skills/cvf-governance-documentation-adrs': { title: "Ghi lại quyết định kiến trúc", hint: { vi: "Lưu quyết định thiết kế, tiêu chuẩn hoặc lý do cần dùng lâu dài.", en: "Document an architecture decision, standard, or long-term rationale." } },
    'agent_system_skills/cvf-governance-doubt-driven-development': { title: "Kiểm tra giả định trước khi quyết định", hint: { vi: "Rà soát giả định chưa chắc chắn trong quyết định rủi ro cao hoặc tuyên bố vượt bằng chứng.", en: "Review uncertain assumptions or claims in a high-risk decision." } },
    'agent_system_skills/cvf-engineering-frontend-ui': { title: "Thiết kế giao diện web", hint: { vi: "Xây dựng hoặc chỉnh bố cục, thành phần và thao tác trên giao diện web.", en: "Design or refine web components, layouts, or interactions." } },
    'agent_system_skills/cvf-governance-git-workflow-versioning': { title: "Quản lý thay đổi bằng Git", hint: { vi: "Xử lý commit, nhánh, xung đột hoặc quản lý phiên bản.", en: "Manage Git branches, commits, conflicts, or versioning." } },
    'agent_system_skills/cvf-governance-idea-refinement': { title: "Làm rõ ý tưởng", hint: { vi: "Định hình ý tưởng còn sơ khai hoặc mơ hồ trước khi thực hiện.", en: "Turn an early idea into options and a clear next step." } },
    'agent_system_skills/cvf-engineering-incremental-implementation': { title: "Triển khai theo từng phần", hint: { vi: "Chia việc lớn hoặc rủi ro qua nhiều giai đoạn triển khai.", en: "Split a large or risky change into small implementation steps." } },
    'agent_system_skills/cvf-governance-operator-interview': { title: "Hỏi người dùng để làm rõ yêu cầu", hint: { vi: "Hỏi khi thông tin thiếu khiến một giả định có thể làm đổi đáng kể công việc.", en: "Ask the operator when a missing detail could materially change the work." } },
    'agent_system_skills/cvf-engineering-observability-instrumentation': { title: "Theo dõi hoạt động hệ thống", hint: { vi: "Bổ sung nhật ký, số đo, dấu vết hoặc cảnh báo để chẩn đoán hệ thống.", en: "Add logs, metrics, traces, or alerts to diagnose system behavior." } },
    'agent_system_skills/cvf-engineering-performance-optimization': { title: "Cải thiện tốc độ hệ thống", hint: { vi: "Đo độ trễ và tìm điểm nghẽn khi hệ thống hoặc trang web hoạt động chậm.", en: "Investigate slow behavior, latency, or performance bottlenecks." } },
    'agent_system_skills/cvf-engineering-security-hardening': { title: "Củng cố bảo mật ứng dụng", hint: { vi: "Xử lý yêu cầu về đăng nhập, phân quyền, dữ liệu nhạy cảm hoặc đầu vào không đáng tin.", en: "Review authentication, access control, secrets, or untrusted input." } },
    'agent_system_skills/cvf-engineering-shipping-launch': { title: "Chuẩn bị phát hành", hint: { vi: "Kiểm tra mức sẵn sàng, phát hành theo đợt, theo dõi và chuẩn bị quay lui.", en: "Prepare a release, staged rollout, monitoring, or rollback." } },
    'agent_system_skills/cvf-engineering-source-driven-development': { title: "Phát triển dựa trên tài liệu nguồn", hint: { vi: "Đối chiếu hành vi của thư viện hoặc framework với tài liệu chính thức.", en: "Check an implementation decision against official framework or library documentation." } },
    'agent_system_skills/cvf-engineering-test-driven-development': { title: "Phát triển có kiểm thử", hint: { vi: "Dùng test để tái hiện lỗi hoặc xác nhận hành vi sau thay đổi.", en: "Reproduce a bug or verify a change with tests." } },
    'agent_system_skills/cvf-governance-skill-discovery-invocation': { title: "Tìm kỹ năng phù hợp cho agent", hint: { vi: "Xác định kỹ năng phù hợp và giới hạn quyền khi dùng kỹ năng đó.", en: "Choose a skill and check the authority needed to use it." } },
    'agent_system_skills/cvf-governance-worker-return-review': { title: "Rà soát kết quả agent bàn giao", hint: { vi: "Kiểm tra kết quả agent gửi về sau khi thực hiện việc đã giao.", en: "Review work returned by an internal agent." } },
    'agent_system_skills/cvf-engineering-test-evidence-audit': { title: "Đối chiếu bằng chứng kiểm thử", hint: { vi: "Kiểm tra tuyên bố rằng một phần mã đã được kiểm thử hoặc có độ bao phủ.", en: "Check whether an existing test supports a claim that specific code is covered." } },
};

export function skillCategoryName(categoryId: string, fallback: string, vietnamese: boolean) {
    const names = categoryNames[categoryId];
    return (vietnamese ? names?.vi : names?.en) ?? fallback;
}

export function skillPresentation(domain: string, skill: Skill, vietnamese: boolean) {
    const english = skill.title.replace(/^\d+[\s._-]+/, '');
    const copy = skillCopy[`${domain}/${skill.id}`];
    return { title: vietnamese ? copy?.title ?? english : english, english, hint: vietnamese ? copy?.hint.vi : copy?.hint.en };
}

export function skillContentInLanguage(skill: Skill | null, categoryId: string | null, language: 'vi' | 'en') {
    const content = skill?.content ?? '';
    const purpose = language === 'vi' && skill && categoryId ? localizedPurposes[categoryId + '/' + skill.id] : undefined;
    return purpose ? content.replace(purposeSection, () => purpose) : content;
}

export function skillDifficulty(value: string, vietnamese: boolean) {
    const level = value.toLowerCase().match(/easy|medium|advanced|hard/)?.[0];
    if (level === 'easy') return vietnamese ? 'Dễ' : 'Easy';
    if (level === 'medium') return vietnamese ? 'Vừa' : 'Medium';
    if (level === 'advanced' || level === 'hard') return vietnamese ? 'Khó' : 'Advanced';
    return value === 'Governed' && vietnamese ? 'Có kiểm soát' : value;
}

export function normalizeSkillSearch(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').trim();
}

export async function fetchSkillIndex(): Promise<SkillCategory[]> {
    const response = await fetch('/data/skills-index.json', { cache: 'no-store' });
    const location = response.url || response.headers?.get('location') || '';
    if (response.status === 401 || response.status === 403 || /(?:^|\/)login(?:[/?#]|$)/.test(location)) {
        throw new SkillSessionExpired();
    }
    if (!response.ok) throw new Error('Failed to load skill index');
    const payload = await response.json();
    const categories = Array.isArray(payload) ? payload : payload?.categories;
    if (!Array.isArray(categories)) throw new Error('Invalid skill index');
    return categories;
}

export class SkillSessionExpired extends Error {}
