// Text Encoding Exception: Vietnamese clarification fixtures require UTF-8.
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LanguageProvider } from '@/lib/i18n';
import type { Template } from '@/types';
import { CategoryTabs } from './CategoryTabs';
import { IntentEntry } from './IntentEntry';
import { TemplateCard } from './TemplateCard';

const template: Template = {
  id: 'coverage-template',
  name: 'Coverage Template',
  icon: 'C',
  description: 'Exercises the governed home-surface controls.',
  category: 'development',
  fields: [],
  intentPattern: 'build app',
  outputExpected: ['artifact'],
  sampleOutput: 'sample',
  difficulty: 'easy',
};

function withLanguage(node: React.ReactNode) {
  return render(<LanguageProvider>{node}</LanguageProvider>);
}

describe('home surface controls', () => {
  it('supports keyboard selection plus isolated try and preview actions', () => {
    const onClick = vi.fn();
    const onTry = vi.fn();
    const onPreview = vi.fn((event: React.MouseEvent) => event.stopPropagation());
    withLanguage(
      <TemplateCard template={template} onClick={onClick} onTry={onTry} onPreview={onPreview} />,
    );

    const [, tryButton, previewButton] = screen.getAllByRole('button');
    fireEvent.keyDown(screen.getByRole('button', { name: /Coverage Template/i }), { key: 'Enter' });
    fireEvent.click(tryButton);
    fireEvent.click(previewButton);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onTry).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('routes category selection through the visible tab control', () => {
    const onCategoryChange = vi.fn();
    withLanguage(
      <CategoryTabs activeCategory="all" onCategoryChange={onCategoryChange} counts={{ development: 1 }} />,
    );

    fireEvent.click(screen.getByText('1').closest('button')!);
    expect(onCategoryChange).toHaveBeenCalledWith('development');
  });

  it('routes a strong intent from the front door', () => {
    const onRoute = vi.fn();
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    render(<IntentEntry onRoute={onRoute} language="en" />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'I want to build a mobile application' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Start with governed path/i }));

    expect(onRoute).toHaveBeenCalledTimes(1);
    expect(onRoute.mock.calls[0][0].recommendedTemplateId).toBe('app_builder_wizard');
    vi.unstubAllEnvs();
  });

  it('continues an ambiguous short intent through clarification', () => {
    const onRoute = vi.fn();
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'true');
    render(<IntentEntry onRoute={onRoute} language="en" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'help' } });
    fireEvent.click(screen.getByRole('button', { name: /Start with governed path/i }));

    expect(screen.getByText('CVF needs a bit more context:')).toBeTruthy();
    const clarificationOptions = screen.getAllByRole('button');
    fireEvent.click(clarificationOptions[0]);
    expect(onRoute).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});

describe('IntentEntry clarification language', () => {
  const start = (value: string, language: 'vi' | 'en') => {
    const onRoute = vi.fn();
    vi.stubEnv('NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR', 'true');
    vi.stubEnv('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP', 'true');
    render(<IntentEntry onRoute={onRoute} language={language} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: /Start with governed path|Bắt đầu với governed path/i }));
    return onRoute;
  };

  it('asks in Vietnamese when the user typed Vietnamese even though the UI language is English', () => {
    const onRoute = start('giúp', 'en');
    expect(screen.getByText('Hiện tại bạn đang muốn làm việc gì nhất?')).toBeTruthy();
    expect(screen.getByText(/Tìm hiểu hoặc nghiên cứu một chủ đề/)).toBeTruthy();
    expect(screen.queryByText(/What best describes what you are trying to do/)).toBeNull();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onRoute.mock.calls.length + screen.queryAllByText(/Ai sẽ dùng kết quả của công việc này\?/).length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
  });

  it('asks in English when the user typed English even though the UI language is Vietnamese', () => {
    start('help', 'vi');
    expect(screen.getByText('What best describes what you are trying to do right now?')).toBeTruthy();
    expect(screen.getByText(/Research or explore a topic/)).toBeTruthy();
    expect(screen.queryByText(/Hiện tại bạn đang muốn làm việc gì nhất/)).toBeNull();
    vi.unstubAllEnvs();
  });
});
