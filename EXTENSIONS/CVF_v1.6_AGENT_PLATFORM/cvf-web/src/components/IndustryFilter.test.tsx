/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustryFilter } from './IndustryFilter';
import { getDomains } from '@/lib/skill-search';
import { getAvailableIndustries, isReasoningLoaded } from '@/lib/skill-planner';

vi.mock('@/lib/skill-search', () => ({
  getDomains: vi.fn(),
}));

vi.mock('@/lib/skill-planner', () => ({
  getAvailableIndustries: vi.fn(),
  isReasoningLoaded: vi.fn(),
}));

describe('IndustryFilter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDomains).mockReturnValue([
      { id: 'ai_ml_evaluation', name: 'AI/ML', count: 4 },
      { id: 'web_development', name: 'Web Dev', count: 6 },
    ]);
    vi.mocked(isReasoningLoaded).mockReturnValue(true);
    vi.mocked(getAvailableIndustries).mockReturnValue([
      { name: 'Fintech', score: 0, ruleCount: 5 },
      { name: 'UnknownIndustry', score: 0, ruleCount: 2 },
    ]);
  });

  it('renders domain mode with counts and supports selecting/all reset', () => {
    const onChange = vi.fn();
    render(<IndustryFilter onChange={onChange} />);

    expect(screen.getByTestId('filter-all').textContent).toContain('(10)');
    expect(screen.getByTestId('filter-ai_ml_evaluation')).toBeTruthy();
    expect(screen.getByTestId('filter-web_development')).toBeTruthy();

    fireEvent.click(screen.getByTestId('filter-web_development'));
    expect(onChange).toHaveBeenCalledWith('web_development');

    fireEvent.click(screen.getByTestId('filter-all'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('toggles selected item back to empty value', () => {
    const onChange = vi.fn();
    render(<IndustryFilter selected="web_development" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('filter-web_development'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('renders industry mode only when reasoning data is loaded', () => {
    vi.mocked(isReasoningLoaded).mockReturnValue(false);
    render(<IndustryFilter mode="industry" />);

    expect(screen.queryByTestId('filter-Fintech')).toBeNull();
    expect(screen.getByTestId('filter-all').textContent).not.toContain('(');
  });

  it('uses fallback icon branch and hides counts when showCounts=false', () => {
    const onChange = vi.fn();
    render(<IndustryFilter mode="industry" showCounts={false} onChange={onChange} />);

    const unknownButton = screen.getByTestId('filter-UnknownIndustry');
    expect(unknownButton.textContent).toContain('UnknownIndustry');
    expect(unknownButton.textContent).not.toContain('(2)');
    expect(screen.getByTestId('filter-all').textContent).toBe('All ');

    fireEvent.click(unknownButton);
    expect(onChange).toHaveBeenCalledWith('UnknownIndustry');
  });
});

