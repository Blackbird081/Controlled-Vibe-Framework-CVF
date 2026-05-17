import { TRUSTED_FORM_MAP } from '../../src/lib/form-routing';
import { getTemplateById } from '../../src/lib/templates';
import type { Template, TemplateField } from '../../src/types';

export type W149CorpusEntry = {
  formType: string;
  templateId: string;
  templateName: string;
  prompt: string;
  topicValue: string;
  inputs: Record<string, string>;
};

const PROMPT_BY_FORM: Record<string, { prompt: string; topic: string }> = {
  email_template: {
    prompt: 'Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng',
    topic: 'Email giới thiệu dịch vụ tư vấn',
  },
  documentation: {
    prompt: 'Tạo tài liệu quy trình onboarding cho nhân viên mới',
    topic: 'Tài liệu onboarding nhân viên mới',
  },
  competitor_review: {
    prompt: 'Phân tích đối thủ cạnh tranh trong lĩnh vực dịch vụ logistics',
    topic: 'Đối thủ logistics B2B',
  },
  risk_assessment: {
    prompt: 'Đánh giá rủi ro cho dự án phần mềm quản lý kho',
    topic: 'Rủi ro dự án phần mềm kho',
  },
  user_persona: {
    prompt: 'Xây dựng hồ sơ khách hàng mục tiêu cho ứng dụng tài chính cá nhân',
    topic: 'Khách hàng mục tiêu app tài chính cá nhân',
  },
  feature_prioritization: {
    prompt: 'Lập danh sách ưu tiên tính năng cho phiên bản tiếp theo của sản phẩm SaaS',
    topic: 'Ưu tiên tính năng SaaS v2',
  },
  pricing_strategy: {
    prompt: 'Xây dựng chiến lược giá cho sản phẩm SaaS B2B trong thị trường SME',
    topic: 'Chiến lược giá SaaS B2B',
  },
  strategy_analysis: {
    prompt: 'Đánh giá cơ hội và thách thức khi ra mắt sản phẩm mới cho phân khúc doanh nghiệp lớn',
    topic: 'Chiến lược ra mắt sản phẩm enterprise',
  },
  meeting_notes: {
    prompt: 'Tóm tắt cuộc họp sprint planning thành biên bản họp rõ ràng',
    topic: 'Biên bản họp sprint planning',
  },
  job_description: {
    prompt: 'Viết mô tả công việc cho vị trí product manager B2B SaaS',
    topic: 'JD Product Manager B2B SaaS',
  },
  performance_review: {
    prompt: 'Viết performance review cho nhân viên chăm sóc khách hàng quý này',
    topic: 'Đánh giá hiệu suất CS quý này',
  },
  seo_audit: {
    prompt: 'Thực hiện SEO audit cho website dịch vụ tư vấn doanh nghiệp',
    topic: 'SEO audit website tư vấn doanh nghiệp',
  },
  data_analysis: {
    prompt: 'Phân tích dữ liệu bán hàng quý gần nhất và rút ra insight hành động',
    topic: 'Phân tích dữ liệu bán hàng quý gần nhất',
  },
  brand_voice: {
    prompt: 'Xây dựng brand voice cho thương hiệu phần mềm quản lý bán hàng',
    topic: 'Brand voice phần mềm quản lý bán hàng',
  },
  landing_page_cro: {
    prompt: 'Tối ưu landing page để tăng conversion rate cho khóa học online',
    topic: 'Landing page CRO khóa học online',
  },
  email_campaign: {
    prompt: 'Review email campaign chăm sóc khách hàng sau khi dùng thử SaaS',
    topic: 'Email campaign trial nurture',
  },
  copywriting_evaluation: {
    prompt: 'Đánh giá copywriting cho quảng cáo ra mắt ứng dụng mới',
    topic: 'Copywriting quảng cáo ra mắt app',
  },
  onboarding_review: {
    prompt: 'Review onboarding cho người dùng mới của ứng dụng quản lý chi tiêu',
    topic: 'Onboarding app quản lý chi tiêu',
  },
  accessibility_audit: {
    prompt: 'Thực hiện accessibility audit cho trang thanh toán của website',
    topic: 'Accessibility audit trang thanh toán',
  },
  api_security: {
    prompt: 'Kiểm tra bảo mật API đăng nhập và quản lý phiên người dùng',
    topic: 'API security đăng nhập',
  },
  gdpr_compliance: {
    prompt: 'Kiểm tra tuân thủ GDPR cho sản phẩm SaaS lưu dữ liệu khách hàng EU',
    topic: 'GDPR SaaS dữ liệu EU',
  },
  privacy_policy_audit: {
    prompt: 'Review privacy policy của ứng dụng mobile thu thập dữ liệu vị trí',
    topic: 'Privacy policy app location',
  },
  incident_response: {
    prompt: 'Tạo incident response plan cho sự cố rò rỉ dữ liệu khách hàng',
    topic: 'Incident response dữ liệu khách hàng',
  },
  data_handling: {
    prompt: 'Review data handling policy cho dữ liệu thanh toán và nhật ký giao dịch',
    topic: 'Data handling thanh toán và nhật ký giao dịch',
  },
  tos_review: {
    prompt: 'Review terms of service cho nền tảng marketplace dịch vụ số',
    topic: 'ToS marketplace dịch vụ số',
  },
  content_quality: {
    prompt: 'Kiểm tra chất lượng nội dung bài viết giới thiệu sản phẩm SaaS',
    topic: 'Content quality bài giới thiệu SaaS',
  },
  social_ad_review: {
    prompt: 'Review quảng cáo Facebook cho chiến dịch thu hút khách hàng mới',
    topic: 'Facebook ad customer acquisition',
  },
  user_flow_analysis: {
    prompt: 'Phân tích user flow đăng ký tài khoản và kích hoạt gói trả phí',
    topic: 'User flow signup to paid activation',
  },
  ux_heuristic_evaluation: {
    prompt: 'Đánh giá UX heuristic cho dashboard quản trị bán hàng',
    topic: 'UX heuristic dashboard quản trị bán hàng',
  },
  error_handling_ux: {
    prompt: 'Cải thiện error messages UX cho form thanh toán bị lỗi',
    topic: 'Error handling UX form thanh toán',
  },
  code_review: {
    prompt: 'Review code cho module xử lý đơn hàng trong ứng dụng Node.js',
    topic: 'Code review order processing module',
  },
  architecture_review: {
    prompt: 'Review kiến trúc hệ thống microservices cho nền tảng logistics',
    topic: 'Architecture review logistics microservices',
  },
  app_requirements_spec: {
    prompt: 'Viết app requirements spec cho ứng dụng đặt lịch tư vấn online',
    topic: 'App requirements đặt lịch tư vấn',
  },
  api_design: {
    prompt: 'Thiết kế API cho hệ thống đặt lịch và nhắc lịch tự động',
    topic: 'API design booking reminder',
  },
  architecture_design: {
    prompt: 'Thiết kế kiến trúc hệ thống cho ứng dụng học online quy mô SME',
    topic: 'Architecture design online learning app',
  },
  auto_documentation: {
    prompt: 'Generate user guide tự động cho dashboard quản trị khách hàng',
    topic: 'Auto documentation CRM dashboard',
  },
  non_coder_debug: {
    prompt: 'Debug app bị lỗi đăng nhập không biết sửa cho người không rành code',
    topic: 'Non-coder debug lỗi đăng nhập',
  },
  project_init_checklist: {
    prompt: 'Tạo checklist khởi tạo dự án CVF cho ứng dụng quản lý nội bộ',
    topic: 'Project init checklist internal app',
  },
  web_ux_redesign_system: {
    prompt: 'Redesign UX website cho dịch vụ tư vấn tài chính doanh nghiệp',
    topic: 'Web UX redesign tư vấn tài chính',
  },
  web_build_handoff: {
    prompt: 'Tạo packet bàn giao web cho agent làm website giới thiệu sản phẩm',
    topic: 'Web build handoff product website',
  },
};

function valueForField(formType: string, field: TemplateField, topic: string): string {
  if (field.default) return field.default;
  if (field.options?.length) return field.options[0];
  const label = field.label || field.id;
  if (/name|title|subject|topic|product|company|position|role|project/i.test(field.id)) {
    return topic;
  }
  if (field.example) return field.example;
  if (field.placeholder) return field.placeholder;
  return `W149 ${formType}: ${label} - thông tin kiểm thử live có ngữ cảnh, mục tiêu, ràng buộc và tiêu chí thành công.`;
}

function buildInputs(template: Template, formType: string, topic: string): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const field of template.fields) {
    inputs[field.id] = valueForField(formType, field, topic);
  }
  if (!Object.keys(inputs).length) {
    inputs.subject = topic;
    inputs.context = `W149 ${formType}: kiểm thử live trusted-form corpus.`;
  }
  inputs._w149Corpus = formType;
  return inputs;
}

export function getW149TrustedFormCorpus(): W149CorpusEntry[] {
  return Object.keys(TRUSTED_FORM_MAP).map((formType) => {
    const template = getTemplateById(formType);
    if (!template) {
      throw new Error(`W149 corpus template missing: ${formType}`);
    }
    const promptSpec = PROMPT_BY_FORM[formType];
    if (!promptSpec) {
      throw new Error(`W149 corpus prompt missing: ${formType}`);
    }
    return {
      formType,
      templateId: template.id,
      templateName: template.name,
      prompt: promptSpec.prompt,
      topicValue: promptSpec.topic,
      inputs: buildInputs(template, formType, promptSpec.topic),
    };
  });
}

export const W149_DEEPSEEK_SUBSET = [
  'email_template',
  'documentation',
  'seo_audit',
  'data_analysis',
  'api_security',
  'gdpr_compliance',
  'user_flow_analysis',
  'code_review',
  'app_requirements_spec',
  'api_design',
  'non_coder_debug',
  'web_build_handoff',
] as const;
