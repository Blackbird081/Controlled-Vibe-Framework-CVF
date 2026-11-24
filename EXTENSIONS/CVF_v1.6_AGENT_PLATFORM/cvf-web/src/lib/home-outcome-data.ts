// Text Encoding Exception: localized Home outcome copy.
import type { Template } from '@/types';
import risk0 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/strategy_analysis/risk.profile.json';
import scope0 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/strategy_analysis/authority.scope.json';
import boundary0 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/strategy_analysis/execution.boundary.json';
import risk1 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/product_brief/risk.profile.json';
import scope1 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/product_brief/authority.scope.json';
import boundary1 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/product_brief/execution.boundary.json';
import risk2 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/sop_generator/risk.profile.json';
import scope2 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/sop_generator/authority.scope.json';
import boundary2 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/sop_generator/execution.boundary.json';
import risk3 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/proposal_writer/risk.profile.json';
import scope3 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/proposal_writer/authority.scope.json';
import boundary3 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/proposal_writer/execution.boundary.json';
import risk4 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/meeting_summarizer/risk.profile.json';
import scope4 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/meeting_summarizer/authority.scope.json';
import boundary4 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/meeting_summarizer/execution.boundary.json';
import risk5 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/contract_review/risk.profile.json';
import scope5 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/contract_review/authority.scope.json';
import boundary5 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/contract_review/execution.boundary.json';
import risk6 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/landing_page_builder/risk.profile.json';
import scope6 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/landing_page_builder/authority.scope.json';
import boundary6 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/landing_page_builder/execution.boundary.json';
import risk7 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/competitor_review/risk.profile.json';
import scope7 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/competitor_review/authority.scope.json';
import boundary7 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/competitor_review/execution.boundary.json';
import risk8 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/data_analysis/risk.profile.json';
import scope8 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/data_analysis/authority.scope.json';
import boundary8 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/data_analysis/execution.boundary.json';
import risk9 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/app_requirements_spec/risk.profile.json';
import scope9 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/app_requirements_spec/authority.scope.json';
import boundary9 from '../../../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/_certified/app_requirements_spec/execution.boundary.json';

export const homeCertifiedPacks = {
  strategy_analysis: { id: 'strategy_analysis', risk: risk0, authorityScope: scope0, executionBoundary: boundary0 },
  product_brief: { id: 'product_brief', risk: risk1, authorityScope: scope1, executionBoundary: boundary1 },
  sop_generator: { id: 'sop_generator', risk: risk2, authorityScope: scope2, executionBoundary: boundary2 },
  proposal_writer: { id: 'proposal_writer', risk: risk3, authorityScope: scope3, executionBoundary: boundary3 },
  meeting_summarizer: { id: 'meeting_summarizer', risk: risk4, authorityScope: scope4, executionBoundary: boundary4 },
  contract_review: { id: 'contract_review', risk: risk5, authorityScope: scope5, executionBoundary: boundary5 },
  landing_page_builder: { id: 'landing_page_builder', risk: risk6, authorityScope: scope6, executionBoundary: boundary6 },
  competitor_review: { id: 'competitor_review', risk: risk7, authorityScope: scope7, executionBoundary: boundary7 },
  data_analysis: { id: 'data_analysis', risk: risk8, authorityScope: scope8, executionBoundary: boundary8 },
  app_requirements_spec: { id: 'app_requirements_spec', risk: risk9, authorityScope: scope9, executionBoundary: boundary9 },
} as const;

type NewOutcome = { id: string; vi: string; en: string; descriptionVi: string; descriptionEn: string; fields: Array<[string, string, string]> };
export const newHomeOutcomes: NewOutcome[] = [
  { id: 'short_message', vi: 'Tin nhắn ngắn', en: 'Short message', descriptionVi: 'Soạn tin nhắn Zalo, SMS hoặc email ngắn.', descriptionEn: 'Draft a short message for Zalo, SMS or email.', fields: [['channel','Bạn muốn nhắn qua đâu?','Where will you send it?'],['recipient','Bạn nhắn cho ai?','Who are you writing to?'],['message','Bạn muốn nói gì?','What should the message say?'],['tone','Bạn muốn giọng văn thế nào?','How should it sound?']] },
  { id: 'social_post', vi: 'Bài đăng mạng xã hội', en: 'Social media post', descriptionVi: 'Soạn bài đăng phù hợp với người đọc và kênh.', descriptionEn: 'Draft a social post for the audience and channel.', fields: [['channel','Bạn định đăng ở đâu?','Where will you post?'],['audience','Ai sẽ đọc bài đăng?','Who will read the posts?'],['message','Bạn muốn chia sẻ điều gì?','What do you want to share?'],['preferences','Số bài và giọng văn mong muốn','How many posts and what tone?']] },
  { id: 'tracking_table', vi: 'Bảng theo dõi', en: 'Tracking table', descriptionVi: 'Thiết kế bảng theo dõi đơn hàng, công nợ hoặc công việc.', descriptionEn: 'Design a tracking table for orders, balances or tasks.', fields: [['subject','Bạn cần theo dõi việc gì?','What do you need to track?'],['details','Mỗi dòng cần ghi thông tin gì?','What information should each row contain?'],['followUp','Khi nào cần xử lý tiếp?','How should the table show follow-up?'],['sample','Có dữ liệu mẫu không?','Do you have sample data?']] },
  { id: 'lesson_or_test', vi: 'Bài giảng hoặc đề kiểm tra', en: 'Lesson or test', descriptionVi: 'Soạn bài giảng hoặc đề kiểm tra phù hợp người học.', descriptionEn: 'Prepare a lesson or assessment for the learners.', fields: [['format','Bạn muốn bài giảng hay đề kiểm tra?','Would you like a lesson or a quiz?'],['topic','Chủ đề và người học là ai?','What is the topic and who is it for?'],['objectives','Người học cần hiểu hoặc làm được gì?','What should learners understand or do?'],['limits','Thời lượng hoặc số câu mong muốn','What time limit or number of questions?']] },
  { id: 'summary_translation', vi: 'Tóm tắt và dịch', en: 'Summary and translation',
    descriptionVi: 'Tóm tắt đoạn văn được cung cấp, rồi dịch bản tóm tắt sang ngôn ngữ mong muốn. Không dùng để dịch một câu hoặc một dòng.',
    descriptionEn: 'Summarize a supplied passage, then translate the summary into the chosen language. Not for translating a single sentence or line.',
    fields: [['sourceText','Dán nội dung cần tóm tắt','Paste the text to summarize'],['targetLanguage','Dịch sang ngôn ngữ nào?','What language should the translation use?'],['preferences','Độ dài và người đọc mong muốn','How long and for whom?'],['terminology','Tên hoặc thuật ngữ cần giữ nguyên','Which names or terms must stay unchanged?']] },
  { id: 'home_proposal', vi: 'Bản đề xuất', en: 'Proposal', descriptionVi: 'Soạn bản đề xuất về nhu cầu, phạm vi và điều kiện.', descriptionEn: 'Draft a proposal with need, scope and constraints.', fields: [['customer_need','Nhu cầu là gì?','What is the need?'],['scope','Phạm vi đề xuất là gì?','What is the proposed scope?'],['timeline','Mốc thời gian dự kiến','What is the timeline?'],['constraints','Các giới hạn là gì?','What constraints apply?']] },
  { id: 'home_contract_review', vi: 'Rà soát hợp đồng', en: 'Contract review', descriptionVi: 'Rà các điều khoản và câu hỏi cần người có thẩm quyền xem xét.', descriptionEn: 'Identify contract terms and questions for human review.', fields: [['contract_text','Nội dung hợp đồng cần rà','What contract text should be reviewed?'],['review_goal','Bạn muốn rà điều gì?','What should the review cover?'],['jurisdiction_context','Bối cảnh và nơi áp dụng','What is the context and jurisdiction?']] },
];
const outputSections: Record<string, { vi: string; en: string; sections: string[] }> = {
  short_message: { vi: 'Bản nháp tin nhắn; thêm tiêu đề nếu là email. Giữ đúng tên, thời gian và yêu cầu đã cho.', en: 'Provide a copy-ready message; include a subject for email and preserve supplied names, dates and requests.', sections: ['Message', 'Subject if email'] },
  social_post: { vi: 'Mỗi bài trong một khối riêng; mặc định một bài, chỉ dùng giá và thông tin đã cung cấp.', en: 'Give each post its own copy-ready block; default to one post and use only supplied facts and prices.', sections: ['Post', 'Assumptions'] },
  tracking_table: { vi: 'Tạo bảng có cột rõ ràng, dòng ví dụ được đánh dấu và hướng dẫn cập nhật; giữ đơn vị và dữ liệu đã cho.', en: 'Provide clear table headers, a labeled example row and updating instructions; preserve supplied units and data.', sections: ['Tracking table', 'How to update'] },
  lesson_or_test: { vi: 'Bài giảng có mục tiêu, các bước và ví dụ; đề kiểm tra có câu hỏi và đáp án riêng.', en: 'Provide goals, teaching steps and a quick check for a lesson, or questions and a separate answer key for a test.', sections: ['Learning goals', 'Lesson or questions', 'Answer key if applicable'] },
  summary_translation: { vi: 'Tách bản tóm tắt bằng ngôn ngữ gốc và bản dịch; giữ đúng ý, tên, con số và độ chắc chắn.', en: 'Provide a source-language summary and its translation, preserving names, numbers and certainty.', sections: ['Summary in source language', 'Translated summary'] },
  home_proposal: { vi: 'Trình bày nhu cầu, phạm vi, thời gian, giả định và bước tiếp theo.', en: 'Present the need, proposed scope, timeline, assumptions and next steps.', sections: ['Need', 'Proposed scope', 'Timeline', 'Assumptions', 'Next steps'] },
  home_contract_review: { vi: 'Nêu nghĩa vụ, trích đoạn cần làm rõ và câu hỏi cho người duyệt.', en: 'Identify obligations, excerpts needing clarification and questions for human review.', sections: ['Obligations', 'Excerpts to clarify', 'Questions for review'] },
};
const outputSectionsVi: Readonly<Record<string, string[]>> = {
  short_message: ['Tin nhắn', 'Tiêu đề nếu gửi email'],
  social_post: ['Bài đăng', 'Giả định'],
  tracking_table: ['Bảng theo dõi', 'Cách cập nhật'],
  lesson_or_test: ['Mục tiêu học tập', 'Nội dung hoặc câu hỏi', 'Đáp án nếu cần'],
  summary_translation: ['Tóm tắt bằng ngôn ngữ gốc', 'Bản dịch'],
  home_proposal: ['Nhu cầu', 'Phạm vi đề xuất', 'Thời gian', 'Giả định', 'Bước tiếp theo'],
  home_contract_review: ['Nghĩa vụ', 'Trích đoạn cần làm rõ', 'Câu hỏi cho người duyệt'],
};
export function getNewHomeOutcomeContent(id: string, locale: 'vi' | 'en') {
  const item = newHomeOutcomes.find(outcome => outcome.id === id);
  const output = outputSections[id];
  if (!item || !output) return null;
  const title = item[locale];
  const sections = locale === 'vi' ? outputSectionsVi[id] : output.sections;
  const labels = item.fields.map(([field,vi,en]) => `${locale === 'vi' ? vi : en}: [${field}]`).join('\n');
  return { intentPattern: `${locale === 'vi' ? 'YÊU CẦU' : 'INTENT'}: ${title}\n${labels}\nOUTPUT REQUIREMENTS: ${output[locale]}\nSUCCESS CRITERIA: ${locale === 'vi' ? 'Giữ nguyên thông tin đã cho và nêu rõ thông tin còn thiếu.' : 'Preserve supplied facts and identify missing information.'}`,
    outputTemplate: `# ${title}\n\n${sections.map(section => `## ${section}\n`).join('\n')}`, outputExpected: sections };
}
export const newHomeTemplates: Template[] = newHomeOutcomes.map(outcome => ({
  id: outcome.id, name: outcome.vi, icon: '📄', description: outcome.descriptionVi, category: 'content',
  fields: outcome.fields.map(([id, vi], index) => ({ id, type: 'textarea', label: vi, required: index < 3 })),
  ...getNewHomeOutcomeContent(outcome.id, 'vi')!,
}));

/** Home presentation only. The internal web-build template and pilot remain unchanged. */
export function homeLandingContent(locale: 'vi' | 'en') {
  const vi = locale === 'vi';
  const fields = vi
    ? ['Mục tiêu trang: [websiteGoal]', 'Người đọc: [audience]', 'Việc người đọc cần làm: [mustDo]', 'Các trang hoặc phần cần có: [screens]', 'Những gì cần giữ: [mustPreserve]', 'Phong cách mong muốn: [lookAndFeel]', 'Ghi chú: [references]']
    : ['Page goal: [websiteGoal]', 'Audience: [audience]', 'Reader actions: [mustDo]', 'Pages or sections: [screens]', 'Preserve: [mustPreserve]', 'Preferred style: [lookAndFeel]', 'Notes: [references]'];
  const sections = vi ? ['Mục tiêu và người đọc', 'Nội dung từng phần', 'Lời mời hành động', 'Giới hạn cần giữ', 'Kiểm tra trước khi dùng']
    : ['Goal and audience', 'Section content', 'Call to action', 'Preservation constraints', 'Review checklist'];
  return {
    intentPattern: `${vi ? 'YÊU CẦU: Soạn nội dung trang giới thiệu theo thông tin người dùng.' : 'INTENT: Draft landing-page content using the information supplied.'}\n${fields.join('\n')}\nOUTPUT REQUIREMENTS: ${vi ? 'Dùng lời dễ hiểu, giữ đúng thông tin và nêu rõ dữ liệu còn thiếu.' : 'Use clear language, preserve supplied facts and identify missing information.'}\nSUCCESS CRITERIA: ${vi ? 'Người dùng có thể xem lại nội dung và lời mời hành động trước khi dùng.' : 'The user can review the content and call to action before use.'}`,
    outputTemplate: `# ${vi ? 'Nội dung trang giới thiệu' : 'Landing page content'}\n\n${sections.map(section => `## ${section}\n`).join('\n')}`,
    outputExpected: sections,
  };
}
