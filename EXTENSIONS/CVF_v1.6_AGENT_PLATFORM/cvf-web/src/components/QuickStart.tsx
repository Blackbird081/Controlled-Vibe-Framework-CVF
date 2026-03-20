'use client';

/**
 * QuickStart Component — Guided Governed Intake
 * ==========================================
 * Step 1: Choose provider + paste API key
 * Step 2: Describe the goal so CVF can bind a governed intake path
 * Step 3: Review routed phase/risk before launching the next surface
 *
 * Sprint 7 — Task 7.5
 */

import React, { useState } from 'react';
import { detectIntent, type DetectedIntent } from '@/lib/intent-detector';

interface QuickStartProps {
  onComplete: (result: {
    provider: string;
    apiKey: string;
    userInput: string;
    detectedIntent: DetectedIntent;
  }) => void;
  onSkip?: () => void;
  language?: 'vi' | 'en';
}

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', icon: '✨', desc: 'Free tier lớn', recommended: true },
  { id: 'openai', name: 'OpenAI', icon: '🤖', desc: 'GPT-4o' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', desc: 'Claude' },
  { id: 'alibaba', name: 'Alibaba Qwen', icon: '🌏', desc: 'Qwen Turbo' },
  { id: 'openrouter', name: 'OpenRouter', icon: '🔀', desc: 'Multi-model' },
];

export default function QuickStart({ onComplete, onSkip, language = 'vi' }: QuickStartProps) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [userInput, setUserInput] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<DetectedIntent | null>(null);

  const l = language === 'vi' ? {
    title: '🚀 Governed Quick Start',
    step1: 'Bước 1: Chọn AI Provider',
    step2: 'Bước 2: Bạn muốn CVF xử lý mục tiêu nào?',
    step3: 'Bước 3: Xác nhận governed routing',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Paste API key tại đây...',
    inputPlaceholder: 'Mô tả yêu cầu của bạn bằng ngôn ngữ tự nhiên...\n\nVí dụ:\n• "Tôi muốn tạo app quản lý công việc"\n• "Phân tích chiến lược marketing cho startup"\n• "Review code bảo mật cho ứng dụng web"',
    detected: 'CVF chuẩn bị bind:',
    phase: 'Giai đoạn',
    risk: 'Mức rủi ro',
    templates: 'Templates gợi ý',
    start: 'Mở governed path! 🚀',
    next: 'Tiếp tục →',
    back: '← Quay lại',
    skip: 'Bỏ qua',
    recommended: '⭐ Khuyên dùng',
  } : {
    title: '🚀 Governed Quick Start',
    step1: 'Step 1: Choose AI Provider',
    step2: 'Step 2: What goal should CVF route?',
    step3: 'Step 3: Confirm governed routing',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'Paste your API key here...',
    inputPlaceholder: 'Describe your request in natural language...\n\nExamples:\n• "I want to build a task management app"\n• "Analyze marketing strategy for my startup"\n• "Review security of my web application"',
    detected: 'CVF is preparing to bind:',
    phase: 'Phase',
    risk: 'Risk Level',
    templates: 'Suggested Templates',
    start: 'Open governed path! 🚀',
    next: 'Continue →',
    back: '← Back',
    skip: 'Skip',
    recommended: '⭐ Recommended',
  };

  const handleInputChange = (value: string) => {
    setUserInput(value);
    if (value.trim().length > 5) {
      setDetectedIntent(detectIntent(value));
    } else {
      setDetectedIntent(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">{l.title}</h2>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s === step ? 'bg-blue-500 text-white scale-110' :
              s < step ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {s < step ? '✓' : s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Provider */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{l.step1}</h3>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  provider === p.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{p.name} {p.recommended && <span className="text-xs text-amber-500">{l.recommended}</span>}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{l.apiKeyLabel}</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={l.apiKeyPlaceholder}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-between">
            {onSkip && <button onClick={onSkip} className="text-sm text-gray-500 hover:underline">{l.skip}</button>}
            <button
              onClick={() => setStep(2)}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {l.next}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Input */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{l.step2}</h3>
          <textarea
            value={userInput}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={l.inputPlaceholder}
            rows={6}
            className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-800 dark:border-gray-600 resize-none"
          />

          {detectedIntent && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4 border border-green-200 dark:border-green-800">
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">{l.detected}</div>
              <div className="space-y-1 text-sm">
                <div>{l.phase}: <strong>{detectedIntent.friendlyPhase}</strong></div>
                <div>{l.risk}: <strong>{detectedIntent.friendlyRisk}</strong></div>
                {detectedIntent.suggestedTemplates.length > 0 && (
                  <div>{l.templates}: <strong>{detectedIntent.suggestedTemplates.join(', ')}</strong></div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600 hover:underline">{l.back}</button>
            <button
              onClick={() => setStep(3)}
              disabled={!userInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              {l.next}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{l.step3}</h3>
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Provider</div>
              <div className="font-medium">{PROVIDERS.find(p => p.id === provider)?.icon} {PROVIDERS.find(p => p.id === provider)?.name}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">{l.phase}</div>
              <div className="font-medium">{detectedIntent?.friendlyPhase ?? 'Governed intake'}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">{l.risk}</div>
              <div className="font-medium">{detectedIntent?.friendlyRisk ?? 'Routed by CVF'}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Request</div>
              <div className="text-sm">{userInput}</div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-600 hover:underline">{l.back}</button>
            <button
              onClick={() => onComplete({
                provider,
                apiKey,
                userInput,
                detectedIntent: detectedIntent ?? detectIntent(userInput),
              })}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
            >
              {l.start}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
