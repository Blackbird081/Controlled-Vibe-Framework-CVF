/**
 * trusted-form-corpus.test.ts
 * W151-T1 — Data-driven activation coverage for the 40-form trusted corpus.
 */

import { describe, expect, it } from 'vitest';
import { routeToTrustedForm, TRUSTED_FORM_MAP } from './form-routing';

const ACTIVATION_CASES = [
  ['email_template', 'EN', 'draft an email to my client'],
  ['email_template', 'VN', 'viết email cho khách hàng'],
  ['documentation', 'EN', 'document this process for the team'],
  ['documentation', 'VN', 'viết tài liệu quy trình onboarding'],
  ['faq_outline', 'EN', 'create an FAQ for the checkout flow'],
  ['faq_outline', 'VN', 'tạo FAQ cho khách hàng mới'],
  ['acceptance_criteria', 'EN', 'write acceptance criteria for the dashboard'],
  ['acceptance_criteria', 'VN', 'viết tiêu chí nghiệm thu cho workflow thanh toán'],
  ['competitor_review', 'EN', 'analyze my competitors in the market'],
  ['competitor_review', 'VN', 'phân tích đối thủ cạnh tranh của tôi'],
  ['risk_assessment', 'EN', 'identify the risks for this project launch'],
  ['risk_assessment', 'VN', 'đánh giá rủi ro cho kế hoạch mở rộng'],
  ['user_persona', 'EN', 'create a user persona for my target audience'],
  ['user_persona', 'VN', 'xác định người dùng mục tiêu và buyer persona'],
  ['feature_prioritization', 'EN', 'help me prioritize features for the next sprint'],
  ['feature_prioritization', 'VN', 'ưu tiên tính năng nào cần làm trước'],
  ['pricing_strategy', 'EN', 'help me define a pricing model for my consulting service'],
  ['pricing_strategy', 'VN', 'chiến lược giá cho sản phẩm mới'],
  ['strategy_analysis', 'EN', 'analyze this strategy for entering a new market'],
  ['strategy_analysis', 'VN', 'phân tích chiến lược mở rộng thị trường'],
  ['operator_plan', 'EN', 'create a 30-day operations plan for launch'],
  ['operator_plan', 'VN', 'lập kế hoạch vận hành 30 ngày cho marketplace'],
  ['decision_memo', 'EN', 'write a decision memo to compare three growth channels'],
  ['decision_memo', 'VN', 'so sánh các lựa chọn kênh marketing và đưa recommendation'],
  ['meeting_notes', 'EN', 'take meeting notes for today'],
  ['meeting_notes', 'VN', 'tạo biên bản họp sprint review tuần này'],
  ['job_description', 'EN', 'write a job description for a senior developer'],
  ['job_description', 'VN', 'viết mô tả công việc cho vị trí sales executive'],
  ['performance_review', 'EN', 'write a performance review for my employee'],
  ['performance_review', 'VN', 'đánh giá hiệu suất nhân viên quý 2'],
  ['seo_audit', 'EN', 'do an SEO audit for my website'],
  ['seo_audit', 'VN', 'kiểm tra SEO cho website của tôi'],
  ['data_analysis', 'EN', 'analyze my sales data for Q2'],
  ['data_analysis', 'VN', 'phân tích dữ liệu khách hàng từ Google Analytics'],
  ['brand_voice', 'EN', 'review our brand voice and tone consistency across channels'],
  ['brand_voice', 'VN', 'đồng bộ giọng điệu thương hiệu cho các kênh truyền thông'],
  ['landing_page_cro', 'EN', 'optimize my landing page conversion rate'],
  ['landing_page_cro', 'VN', 'tối ưu landing page để tăng conversion rate'],
  ['email_campaign', 'EN', 'review my email campaign for the product launch'],
  ['email_campaign', 'VN', 'đánh giá email campaign cho chiến dịch ra mắt sản phẩm'],
  ['copywriting_evaluation', 'EN', 'evaluate my ad copy for the Facebook campaign'],
  ['copywriting_evaluation', 'VN', 'đánh giá copywriting cho trang sản phẩm của tôi'],
  ['onboarding_review', 'EN', 'review my onboarding flow and identify friction points'],
  ['onboarding_review', 'VN', 'đánh giá onboarding của app và tối ưu trải nghiệm người dùng mới'],
  ['accessibility_audit', 'EN', 'do an accessibility audit for my website'],
  ['accessibility_audit', 'VN', 'kiểm tra accessibility và WCAG compliance cho trang checkout'],
  ['api_security', 'EN', 'do an API security review for our payment flows'],
  ['api_security', 'VN', 'kiểm tra bảo mật API cho luồng thanh toán'],
  ['gdpr_compliance', 'EN', 'check GDPR compliance for my SaaS product'],
  ['gdpr_compliance', 'VN', 'kiểm tra tuân thủ GDPR cho ứng dụng của chúng tôi'],
  ['privacy_policy_audit', 'EN', 'audit my privacy policy for gaps and coverage'],
  ['privacy_policy_audit', 'VN', 'review chính sách bảo mật của website'],
  ['incident_response', 'EN', 'create an incident response plan for our startup'],
  ['incident_response', 'VN', 'xây dựng kế hoạch ứng phó sự cố bảo mật'],
  ['data_handling', 'EN', 'review our data handling and retention policy'],
  ['data_handling', 'VN', 'review cách xử lý dữ liệu khách hàng trong hệ thống'],
  ['tos_review', 'EN', 'review my terms of service for a SaaS product'],
  ['tos_review', 'VN', 'kiểm tra điều khoản sử dụng của ứng dụng'],
  ['content_quality', 'EN', 'check the content quality of my blog posts'],
  ['content_quality', 'VN', 'kiểm tra chất lượng nội dung bài viết website'],
  ['social_ad_review', 'EN', 'review my Facebook ad for the summer campaign'],
  ['social_ad_review', 'VN', 'đánh giá quảng cáo Facebook cho chiến dịch tháng 6'],
  ['user_flow_analysis', 'EN', 'analyze my user flow from landing page to checkout'],
  ['user_flow_analysis', 'VN', 'phân tích user flow từ trang chủ đến thanh toán'],
  ['ux_heuristic_evaluation', 'EN', 'do a UX heuristic evaluation of my dashboard'],
  ['ux_heuristic_evaluation', 'VN', 'đánh giá UX heuristic cho giao diện quản lý đơn hàng'],
  ['error_handling_ux', 'EN', 'review my error messages and improve the error handling UX'],
  ['error_handling_ux', 'VN', 'cải thiện thông báo lỗi cho trang checkout'],
  ['code_review', 'EN', 'do a code review of this TypeScript module'],
  ['code_review', 'VN', 'review code module xử lý thanh toán của tôi'],
  ['architecture_review', 'EN', 'do an architecture review of our microservices backend'],
  ['architecture_review', 'VN', 'đánh giá kiến trúc hệ thống microservices của chúng tôi'],
  ['app_requirements_spec', 'EN', 'create an app requirements spec for the new project'],
  ['app_requirements_spec', 'VN', 'viết spec yêu cầu ứng dụng quản lý nhân sự'],
  ['api_design', 'EN', 'design an API for my inventory management system'],
  ['api_design', 'VN', 'thiết kế API cho hệ thống quản lý đơn hàng'],
  ['architecture_design', 'EN', 'design the system architecture for a SaaS platform'],
  ['architecture_design', 'VN', 'thiết kế kiến trúc hệ thống cho ứng dụng web'],
  ['auto_documentation', 'EN', 'generate a user guide for my app'],
  ['auto_documentation', 'VN', 'tạo user guide tự động cho ứng dụng quản lý kho'],
  ['non_coder_debug', 'EN', 'debug my app - it keeps crashing on the checkout page'],
  ['non_coder_debug', 'VN', 'app bị lỗi không biết sửa, hiện màn hình trắng'],
  ['project_init_checklist', 'EN', 'run the project init checklist before starting'],
  ['project_init_checklist', 'VN', 'checklist khởi tạo dự án mới theo CVF'],
  ['web_ux_redesign_system', 'EN', 'do a UX redesign for my website dashboard'],
  ['web_ux_redesign_system', 'VN', 'redesign UX website quản lý vận hành nội bộ'],
  ['web_build_handoff', 'EN', 'create a web build handoff packet for the agent'],
  ['web_build_handoff', 'VN', 'tạo packet bàn giao web để agent xây website'],
] as const;

describe('trusted-form-corpus — activation matrix', () => {
  it('covers every trusted form with EN and VN cases', () => {
    const covered = new Set(ACTIVATION_CASES.map(([templateId]) => templateId));
    expect(covered.size).toBe(44);
    expect([...covered].sort()).toEqual(Object.keys(TRUSTED_FORM_MAP).sort());
  });

  it.each(ACTIVATION_CASES)('%s — %s activation', (expectedTemplateId, _language, input) => {
    const match = routeToTrustedForm(input);
    expect(match, input).not.toBeNull();
    expect(match!.id).toBe(expectedTemplateId);
  });
});
