'use client';

/**
 * IntentEntry — Intent-First Front Door CTA
 * ==========================================
 * Extracted component hosting the intent-first banner/CTA on Home.
 * Rendered only when NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true.
 *
 * W122-T1 — CP1/CP2
 * W124-T1 — CP2: clarification loop extension
 * GC-023: extracted to keep home/page.tsx under 1000-line hard threshold.
 */

import React, { useState } from 'react';
import { routeIntent, type IntentRouteResult } from '@/lib/intent-router';
import {
  isClarificationLoopEnabled,
  isClarificationEligible,
  startClarification,
  submitClarificationAnswer,
  buildClarificationState,
  advanceClarificationState,
  type ClarificationState,
  type ClarificationResult,
} from '@/lib/intent-router-clarification';
import { trackEvent } from '@/lib/analytics';

interface IntentEntryProps {
  onRoute: (result: IntentRouteResult, userInput: string) => void;
  language?: 'vi' | 'en';
}

export function IntentEntry({ onRoute, language = 'vi' }: IntentEntryProps) {
  const [userInput, setUserInput] = useState('');
  const [preview, setPreview] = useState<IntentRouteResult | null>(null);
  const [clarState, setClarState] = useState<ClarificationState | null>(null);
  const [clarResult, setClarResult] = useState<ClarificationResult | null>(null);

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
    clarQuestion: 'CVF cần thêm thông tin:',
    clarBrowse: 'Không thể xác định đường dẫn phù hợp — vui lòng duyệt template:',
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
    clarQuestion: 'CVF needs a bit more context:',
    clarBrowse: 'Could not find a confident match — please browse templates:',
  };

  function handleChange(value: string) {
    setUserInput(value);
    setClarState(null);
    setClarResult(null);
    if (value.trim().length > 5) {
      setPreview(routeIntent(value));
    } else {
      setPreview(null);
    }
  }

  function handleStart() {
    if (!userInput.trim()) return;
    const result = routeIntent(userInput);
    if (!result) return;
    if (result.confidence === 'strong' && result.recommendedTemplateId) {
      // W127: track successful intent routing (wizard or form)
      trackEvent('intent_routed', {
        routeType: result.routeType,
        templateId: result.recommendedTemplateId,
      });
      onRoute(result, userInput);
      return;
    }
    // Weak confidence — try clarification loop if enabled and eligible
    if (
      isClarificationLoopEnabled() &&
      result.fallback &&
      isClarificationEligible(result.fallback)
    ) {
      trackEvent('clarification_weak_confidence_detected', { input: userInput });
      const state = buildClarificationState(userInput);
      setClarState(state);
      const cr = startClarification(result);
      setClarResult(cr);
      if (cr.recoveryMode === 'clarify') {
        trackEvent('clarification_question_asked', { depth: cr.depth });
      }
    }
  }

  function handleClarificationAnswer(answer: string) {
    if (!clarState || !clarResult) return;
    trackEvent('clarification_answered', { depth: clarResult.depth, answer });
    const nextState = advanceClarificationState(clarState, answer);
    setClarState(nextState);
    const nextResult = submitClarificationAnswer(clarState, answer);
    setClarResult(nextResult);
    if (nextResult.recoveryMode === 'route' && nextResult.routeResult) {
      trackEvent('clarification_route_recovered', { depth: nextResult.depth });
      onRoute(nextResult.routeResult, clarState.originalInput);
    } else if (nextResult.recoveryMode === 'browse') {
      trackEvent('clarification_browse_fallback', { depth: nextResult.depth });
    } else {
      trackEvent('clarification_question_asked', { depth: nextResult.depth });
    }
  }

  const hasRoutedTarget = !!preview?.recommendedTemplateId;
  const ctaDisabled = !userInput.trim() || (preview !== null && !hasRoutedTarget);
  const showClarification = !!clarResult && clarResult.recoveryMode !== 'route';

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

      {/* Clarification loop UI (W124) */}
      {showClarification && clarResult && (
        <div className="rounded-lg p-3 mb-3 text-sm border bg-amber-900/20 border-amber-500/30 text-amber-200">
          {clarResult.recoveryMode === 'clarify' && clarResult.clarificationQuestion && (
            <>
              <div className="font-medium mb-2">{l.clarQuestion}</div>
              <div className="mb-2 text-amber-100">{clarResult.clarificationQuestion}</div>
              <div className="flex flex-col gap-1.5">
                {clarResult.clarificationOptions?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleClarificationAnswer(opt)}
                    className="text-left px-3 py-1.5 rounded bg-amber-800/30 hover:bg-amber-700/40 border border-amber-500/20 text-amber-100 text-xs transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
          {clarResult.recoveryMode === 'browse' && (
            <div>
              <div className="font-medium mb-1">{l.clarBrowse}</div>
              <div className="opacity-70 text-xs">{clarResult.browseReason}</div>
            </div>
          )}
        </div>
      )}

      {/* Standard preview (shown when no clarification active) */}
      {!showClarification && preview && (
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
        {!showClarification && (
          <button
            onClick={handleStart}
            disabled={ctaDisabled}
            className="cvf-control px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {ctaDisabled && preview && !hasRoutedTarget ? l.ctaDisabled : l.cta}
          </button>
        )}
        <span className="text-xs text-white/30">{l.browse}</span>
      </div>
    </div>
  );
}

export default IntentEntry;
