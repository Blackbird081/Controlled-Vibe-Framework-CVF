/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillSearchBar } from './SkillSearchBar';
import { SkillPlanner } from './SkillPlanner';
import { IndustryFilter } from './IndustryFilter';
import { SkillGraph } from './SkillGraph';

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'en' }),
  LanguageToggle: () => null,
}));

vi.mock('@/lib/theme', () => ({
  ThemeToggle: () => null,
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// ─── SkillSearchBar Tests ────────────────────────────────────────────

describe('SkillSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
product_ux/ui_style_selection,product_ux,UI Style Selection,Medium,R1,"Discovery,Design","style ui",Helps pick style,test.md
web_development/07_landing_page_pattern,web_development,Landing Page Pattern,Easy,R0,"Discovery,Design","landing page",Select layout,test.md`),
    });
  });

  it('renders search input', async () => {
    render(<SkillSearchBar />);
    await waitFor(() => {
      expect(screen.getByTestId('skill-search-bar')).toBeTruthy();
    });
    expect(screen.getByTestId('skill-search-input')).toBeTruthy();
  });

  it('accepts placeholder prop', async () => {
    render(<SkillSearchBar placeholder="Custom placeholder" />);
    await waitFor(() => {
      const input = screen.getByTestId('skill-search-input') as HTMLInputElement;
      expect(input.placeholder).toBe('Custom placeholder');
    });
  });

  it('calls onSelect when result clicked', async () => {
    const onSelect = vi.fn();
    render(<SkillSearchBar onSelect={onSelect} />);

    // Wait for data load
    await waitFor(() => {
      const input = screen.getByTestId('skill-search-input') as HTMLInputElement;
      expect(input.disabled).toBe(false);
    });

    // Type and wait for debounce
    const input = screen.getByTestId('skill-search-input');
    fireEvent.change(input, { target: { value: 'landing page' } });

    // Trigger immediate search with Enter
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      const results = screen.queryByTestId('skill-search-results');
      expect(results).toBeTruthy();
    });
  });
});

// ─── SkillPlanner Tests ──────────────────────────────────────────────

describe('SkillPlanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock both CSVs
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('skills_index')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
product_ux/ui_style_selection,product_ux,UI Style Selection,Medium,R1,"Discovery,Design","style ui",Helps pick style,test.md`),
        });
      }
      if (url.includes('skill_reasoning')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`industry,task_pattern,skill_chain,rationale
Fintech,dashboard|analytics,product_ux/ui_style_selection,Fintech needs trust design`),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('renders planner input and button', async () => {
    render(<SkillPlanner />);
    expect(screen.getByTestId('skill-planner')).toBeTruthy();
    expect(screen.getByTestId('planner-input')).toBeTruthy();
    expect(screen.getByTestId('planner-generate-btn')).toBeTruthy();
  });

  it('generates plan on button click', async () => {
    const onPlan = vi.fn();
    render(<SkillPlanner onPlanGenerated={onPlan} />);

    // Wait for data load
    await waitFor(() => {
      const input = screen.getByTestId('planner-input') as HTMLInputElement;
      expect(input.disabled).toBe(false);
    });

    fireEvent.change(screen.getByTestId('planner-input'), {
      target: { value: 'fintech dashboard' },
    });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('planner-output')).toBeTruthy();
    });
    expect(onPlan).toHaveBeenCalled();
  });

  it('shows error for unmatched task', async () => {
    render(<SkillPlanner />);

    await waitFor(() => {
      const input = screen.getByTestId('planner-input') as HTMLInputElement;
      expect(input.disabled).toBe(false);
    });

    fireEvent.change(screen.getByTestId('planner-input'), {
      target: { value: 'xyznonexistent12345' },
    });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));

    await waitFor(() => {
      const error = screen.queryByTestId('planner-error');
      expect(error).toBeTruthy();
    });
  });
});

// ─── IndustryFilter Tests ────────────────────────────────────────────

describe('IndustryFilter', () => {
  it('renders with All button', () => {
    render(<IndustryFilter mode="domain" />);
    expect(screen.getByTestId('industry-filter')).toBeTruthy();
    expect(screen.getByTestId('filter-all')).toBeTruthy();
  });

  it('calls onChange when filter clicked', () => {
    const onChange = vi.fn();
    render(<IndustryFilter mode="domain" onChange={onChange} />);

    // Click All to reset
    fireEvent.click(screen.getByTestId('filter-all'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});

// ─── SkillGraph Tests ────────────────────────────────────────────────

describe('SkillGraph', () => {
  it('renders empty state when no data', () => {
    render(<SkillGraph />);
    expect(screen.getByTestId('skill-graph-empty')).toBeTruthy();
  });

  it('renders domain overview with skills', () => {
    const skills = [
      { skill_id: 'a/1', domain: 'product_ux', skill_name: 'Test 1', difficulty: 'Easy', risk_level: 'R0', phases: 'Design', keywords: '', description: '', file_path: '' },
      { skill_id: 'a/2', domain: 'product_ux', skill_name: 'Test 2', difficulty: 'Easy', risk_level: 'R0', phases: 'Design', keywords: '', description: '', file_path: '' },
      { skill_id: 'b/1', domain: 'web_development', skill_name: 'Test 3', difficulty: 'Easy', risk_level: 'R0', phases: 'Build', keywords: '', description: '', file_path: '' },
    ];
    render(<SkillGraph skills={skills} />);
    expect(screen.getByTestId('skill-graph')).toBeTruthy();
  });

  it('renders plan flow when plan provided', () => {
    const plan = {
      task: 'test',
      industry: 'Fintech',
      generated: '2026-02-22',
      total_skills: 2,
      estimated_effort: '1-2 days',
      total_hours: 2,
      rationale: 'Test rationale',
      phases: [
        {
          phase: 'Discovery',
          skills: [
            { step: 1, skill_id: 'a/1', skill_name: 'Skill 1', risk_level: 'R1', difficulty: 'Medium', description: '', file_path: '', effort_hours: 1 },
          ],
        },
        {
          phase: 'Build',
          skills: [
            { step: 2, skill_id: 'b/1', skill_name: 'Skill 2', risk_level: 'R0', difficulty: 'Easy', description: '', file_path: '', effort_hours: 0.5 },
          ],
        },
      ],
    };
    render(<SkillGraph plan={plan} />);
    expect(screen.getByTestId('skill-graph')).toBeTruthy();
    expect(screen.getByText('Discovery')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
  });
});
