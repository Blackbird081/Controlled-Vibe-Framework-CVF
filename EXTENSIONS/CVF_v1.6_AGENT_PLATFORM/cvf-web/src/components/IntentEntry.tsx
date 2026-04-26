'use client';

/**
 * IntentEntry — Intent-First Front Door CTA
 * ==========================================
 * Extracted component hosting the intent-first banner/CTA on Home.
 * Rendered only when NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true.
 *
 * W122-T1 — CP1/CP2
 * GC-023: extracted to keep home/page.tsx under 1000-line hard threshold.
 */

import React, { useState } from 'react';
import { routeIntent, type IntentRouteResult } from '@/lib/intent-router';

interface IntentEntryProps {
  onRoute: (result: IntentRouteResult, userInput: string) => void;
  language?: 'vi' | 'en';
}

export function IntentEntry({ onRoute, language = 'vi' }: IntentEntryProps) {
  const [userInput, setUserInput] = useState('');
  const [preview, setPreview] = useState<IntentRouteResult | null>(null);

  const l = language === 'vi' ? {
    heading: '🎯 Mô tả mục tiêu của bạn',
    placeholder: 'Ví dụ: "Tôi muốn tạo ứng dụng quản lý công việc" hoặc "Phân tích chiến lược marketing cho startup"...',
    preview: 'CVF đề xuất:',
    previewWeak: 'Chưa đủ rõ — vui lòng mô tả cụ thể hơn hoặc duyệt template:',
    cta: 'Bắt đầu với governed path →',
    ctaDisabled: 'Mô tả cụ thể hơn để bắt đầu',
    browse: 'Hoặc duyệt template thủ công ↓',
    fallbackHint: 'Gợi ý:',
    confidence: { strong: 'Khớp tốt', weak: 'Cần mô tả rõ hơn' },
  } : {
    heading: '🎯 Describe your goal',
    placeholder: 'e.g. "I want to build a task management app" or "Analyze marketing strategy for my startup"...',
    preview: 'CVF recommends:',
    previewWeak: 'Not enough detail yet — please clarify or browse templates:',
    cta: 'Start with governed path →',
    ctaDisabled: 'Add more detail to start',
    browse: 'Or browse templates manually ↓',
    fallbackHint: 'Tip:',
    confidence: { strong: 'Strong match', weak: 'Needs clarification' },
  };

  function handleChange(value: string) {
    setUserInput(value);
    if (value.trim().length > 5) {
      setPreview(routeIntent(value));
    } else {
      setPreview(null);
    }
  }

  function handleStart() {
    if (!userInput.trim()) return;
    const result = routeIntent(userInput);
    // §8.A4 hard contract: never open a wizard on weak confidence.
    if (result && result.recommendedTemplateId) {
      onRoute(result, userInput);
    }
  }

  const hasRoutedTarget = !!preview?.recommendedTemplateId;
  const ctaDisabled = !userInput.trim() || (preview !== null && !hasRoutedTarget);

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1d2e] p-5 mb-6">
      <h3 className="text-base font-semibold text-white mb-3">{l.heading}</h3>
      <textarea
        value={userInput}
        onChange={e => handleChange(e.target.value)}
        placeholder={l.placeholder}
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-[#0d0f1a] p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-indigo-500 mb-3"
      />

      {preview && (
        <div className={`rounded-lg p-3 mb-3 text-sm border ${
          hasRoutedTarget
            ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-200'
            : 'bg-amber-900/20 border-amber-500/30 text-amber-200'
        }`}>
          <div className="font-medium mb-1">
            {hasRoutedTarget ? l.preview : l.previewWeak}{' '}
            <span className="opacity-60 text-xs">{l.confidence[preview.confidence]}</span>
          </div>
          {hasRoutedTarget && preview.recommendedTemplateLabel && (
            <div className="font-bold">{preview.recommendedTemplateLabel}</div>
          )}
          <div className="opacity-70 text-xs mt-1">{preview.rationale}</div>
          {preview.fallback && (
            <div className="mt-2 text-xs opacity-60">{l.fallbackHint} {preview.fallback.suggestion}</div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleStart}
          disabled={ctaDisabled}
          className="cvf-control px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {ctaDisabled && preview && !hasRoutedTarget ? l.ctaDisabled : l.cta}
        </button>
        <span className="text-xs text-white/30">{l.browse}</span>
      </div>
    </div>
  );
}

export default IntentEntry;
