'use client';

import { useState, useEffect } from 'react';

export type PipelineTab = 'template' | 'chat' | 'wizard';

type Step = {
  icon: string;
  label: { vi: string; en: string };
  detail: { vi: string; en: string };
  badge: string;
};

const PIPELINES: Record<PipelineTab, Step[]> = {
  template: [
    { icon: '📋', label: { vi: 'Template', en: 'Template' }, detail: { vi: 'Chọn từ 20+ template sẵn có cho mọi ngành', en: 'Pick from 20+ ready templates for any industry' }, badge: 'Start' },
    { icon: '📝', label: { vi: 'Form Input', en: 'Form Input' }, detail: { vi: 'Điền thông tin bằng ngôn ngữ tự nhiên, tiếng Việt hoặc Anh', en: 'Fill in details in plain language, Vietnamese or English' }, badge: 'User' },
    { icon: '🛡️', label: { vi: 'Safety Filter', en: 'Safety Filter' }, detail: { vi: 'CVF Guard kiểm tra tính hợp lệ và an toàn của đầu vào', en: 'CVF Guard validates input for safety and compliance' }, badge: 'Guard' },
    { icon: '🤖', label: { vi: 'AI Execute', en: 'AI Execute' }, detail: { vi: 'AI engine xử lý và tạo output theo context của bạn', en: 'AI engine processes and generates output from your context' }, badge: 'AI' },
    { icon: '✅', label: { vi: 'Governance Check', en: 'Governance Check' }, detail: { vi: '45 lớp kiểm duyệt chất lượng đảm bảo output chuẩn xác', en: '45-layer quality governance ensures accurate output' }, badge: 'Guard' },
    { icon: '🎯', label: { vi: 'Output', en: 'Output' }, detail: { vi: 'Kết quả chuyên nghiệp, sẵn sàng export Word/PDF', en: 'Professional result, ready to export as Word/PDF' }, badge: 'Done' },
  ],
  chat: [
    { icon: '💬', label: { vi: 'Câu hỏi', en: 'User Query' }, detail: { vi: 'Nhập câu hỏi bằng tiếng Việt hoặc tiếng Anh tự nhiên', en: 'Type your question in Vietnamese or natural English' }, badge: 'User' },
    { icon: '🧠', label: { vi: 'Context Build', en: 'Context Build' }, detail: { vi: 'AI tổng hợp ngữ cảnh công việc và lịch sử hội thoại', en: 'AI builds work context and conversation history' }, badge: 'AI' },
    { icon: '⚡', label: { vi: 'AI Process', en: 'AI Process' }, detail: { vi: 'Suy luận đa bước, tổng hợp thông tin và tạo phản hồi', en: 'Multi-step reasoning, synthesis and response generation' }, badge: 'AI' },
    { icon: '🛡️', label: { vi: 'Guard Gate', en: 'Guard Gate' }, detail: { vi: 'Kiểm tra an toàn, độ chính xác và phù hợp ngữ cảnh', en: 'Safety, accuracy and context relevance check' }, badge: 'Guard' },
    { icon: '💡', label: { vi: 'Phản hồi', en: 'Response' }, detail: { vi: 'Câu trả lời thông minh, có ngữ cảnh và actionable', en: 'Smart, contextual and actionable response' }, badge: 'Done' },
  ],
  wizard: [
    { icon: '🎯', label: { vi: 'Xác định mục tiêu', en: 'Define Goal' }, detail: { vi: 'Mô tả ý tưởng app của bạn bằng ngôn ngữ thường ngày', en: 'Describe your app idea in plain everyday language' }, badge: 'Start' },
    { icon: '📋', label: { vi: 'Yêu cầu', en: 'Requirements' }, detail: { vi: 'Xác định chức năng, người dùng và luồng nghiệp vụ chính', en: 'Define features, user types and main business flows' }, badge: 'User' },
    { icon: '🗄️', label: { vi: 'Schema dữ liệu', en: 'Data Schema' }, detail: { vi: 'Cấu trúc database tự động tạo dựa trên yêu cầu của bạn', en: 'Database structure auto-generated from your requirements' }, badge: 'AI' },
    { icon: '🎨', label: { vi: 'UI Design', en: 'UI Design' }, detail: { vi: 'Wireframe và giao diện được đề xuất theo best practice', en: 'Wireframe and interface proposed following best practices' }, badge: 'AI' },
    { icon: '✅', label: { vi: 'Validation', en: 'Validation' }, detail: { vi: 'Review toàn bộ spec, điều chỉnh trước khi xuất', en: 'Full spec review and adjustment before export' }, badge: 'Guard' },
    { icon: '📤', label: { vi: 'Xuất kết quả', en: 'Export' }, detail: { vi: 'Spec app hoàn chỉnh dạng Word/PDF sẵn sàng bàn giao', en: 'Complete app spec as Word/PDF ready for handoff' }, badge: 'Done' },
  ],
};

const BADGE_COLORS: Record<string, string> = {
  Start: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  User:  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  AI:    'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  Guard: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  Done:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
};

export default function WorkflowVisualizer({ tab, lang }: { tab: PipelineTab; lang: 'vi' | 'en' }) {
  const [revealed, setRevealed] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const steps = PIPELINES[tab];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealed(0);
    setExpanded(null);
    const timers = steps.map((_, i) =>
      setTimeout(() => setRevealed(i + 1), (i + 1) * 650)
    );
    return () => timers.forEach(clearTimeout);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div
          key={`${tab}-${i}`}
          className={`transition-all duration-500 ${i < revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-700/60 bg-gray-800 p-3 text-left transition-colors hover:border-indigo-600/40 hover:bg-gray-750"
          >
            <span className="text-lg">{step.icon}</span>
            <span className="flex-1 text-sm font-semibold text-gray-200">
              {lang === 'vi' ? step.label.vi : step.label.en}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_COLORS[step.badge]}`}>
              {step.badge}
            </span>
            <span className="text-xs text-gray-500">{expanded === i ? '▲' : '▼'}</span>
          </button>
          {expanded === i && (
            <div className="mx-3 rounded-b-xl border border-t-0 border-indigo-900/40 bg-indigo-950/30 px-4 py-2.5 text-xs leading-relaxed text-gray-400">
              {lang === 'vi' ? step.detail.vi : step.detail.en}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
