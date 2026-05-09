'use client';

/**
 * Template Suggester Component
 * ==============================
 * Based on detected intent, suggests top 3 templates
 * instead of requiring the user to browse the marketplace.
 *
 * Sprint 7 — Task 7.4
 */

import React from 'react';

interface TemplateSuggesterProps {
  suggestedTemplateIds: string[];
  onSelect: (templateId: string) => void;
  onBrowseAll?: () => void;
  language?: 'vi' | 'en';
}

const TEMPLATE_INFO: Record<string, { name: string; nameEn: string; desc: string; descEn: string; icon: string }> = {
  'app-builder': { name: 'App Builder', nameEn: 'App Builder', desc: 'Xây dựng ứng dụng web/mobile', descEn: 'Build web/mobile applications', icon: '📱' },
  'business-strategy': { name: 'Chiến lược kinh doanh', nameEn: 'Business Strategy', desc: 'Lập kế hoạch chiến lược doanh nghiệp', descEn: 'Business strategy planning', icon: '📈' },
  'marketing-campaign': { name: 'Chiến dịch Marketing', nameEn: 'Marketing Campaign', desc: 'Thiết kế chiến dịch marketing hiệu quả', descEn: 'Design effective campaigns', icon: '📣' },
  'content-strategy': { name: 'Chiến lược nội dung', nameEn: 'Content Strategy', desc: 'Lên kế hoạch content đa kênh', descEn: 'Multi-channel content planning', icon: '✍️' },
  'data-analysis': { name: 'Phân tích dữ liệu', nameEn: 'Data Analysis', desc: 'Phân tích và trực quan hóa dữ liệu', descEn: 'Data analysis and visualization', icon: '📊' },
  'system-design': { name: 'Thiết kế hệ thống', nameEn: 'System Design', desc: 'Kiến trúc và thiết kế hệ thống phần mềm', descEn: 'Software architecture design', icon: '🏗️' },
  'security-assessment': { name: 'Đánh giá bảo mật', nameEn: 'Security Assessment', desc: 'Kiểm tra và đánh giá an ninh hệ thống', descEn: 'Security audit and assessment', icon: '🔒' },
  'product-design': { name: 'Thiết kế sản phẩm', nameEn: 'Product Design', desc: 'UX/UI design và product strategy', descEn: 'UX/UI and product strategy', icon: '🎨' },
  'research-project': { name: 'Dự án nghiên cứu', nameEn: 'Research Project', desc: 'Nghiên cứu chuyên sâu có phương pháp', descEn: 'Methodical deep research', icon: '🔬' },
};

export default function TemplateSuggester({ suggestedTemplateIds, onSelect, onBrowseAll, language = 'vi' }: TemplateSuggesterProps) {
  const l = language === 'vi' ? {
    title: '💡 Templates phù hợp với yêu cầu của bạn',
    browseAll: 'Xem tất cả templates →',
    select: 'Chọn',
    noSuggestion: 'Hãy mô tả yêu cầu để CVF gợi ý template phù hợp.',
  } : {
    title: '💡 Templates matching your request',
    browseAll: 'Browse all templates →',
    select: 'Select',
    noSuggestion: 'Describe your request so CVF can suggest matching templates.',
  };

  if (suggestedTemplateIds.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-500 text-center">
        {l.noSuggestion}
      </div>
    );
  }

  const suggestions = suggestedTemplateIds
    .map(id => TEMPLATE_INFO[id])
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">{l.title}</h4>
      <div className="grid gap-2">
        {suggestions.map((t, i) => {
          const id = suggestedTemplateIds[i];
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
            >
              <span className="text-2xl">{t.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{language === 'vi' ? t.name : t.nameEn}</div>
                <div className="text-xs text-gray-500">{language === 'vi' ? t.desc : t.descEn}</div>
              </div>
              <span className="text-xs text-blue-500 font-medium">{l.select}</span>
            </button>
          );
        })}
      </div>
      {onBrowseAll && (
        <button onClick={onBrowseAll} className="text-xs text-blue-500 hover:underline mt-2">
          {l.browseAll}
        </button>
      )}
    </div>
  );
}
