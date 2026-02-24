/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillPlanner } from './SkillPlanner';
import {
  planTask,
  loadReasoning,
  parseReasoningCSV,
  isReasoningLoaded,
} from '@/lib/skill-planner';
import { parseCSV, isLoaded, loadSkills } from '@/lib/skill-search';

vi.mock('@/lib/skill-planner', () => ({
  planTask: vi.fn(),
  loadReasoning: vi.fn(),
  parseReasoningCSV: vi.fn(),
  isReasoningLoaded: vi.fn(),
}));

vi.mock('@/lib/skill-search', () => ({
  parseCSV: vi.fn(),
  isLoaded: vi.fn(),
  loadSkills: vi.fn(),
}));

const mockPlan = {
  task: 'fintech dashboard',
  industry: 'Fintech',
  generated: '2026-02-24',
  total_skills: 2,
  estimated_effort: '1-2 days',
  total_hours: 2,
  rationale: 'Matched by industry keywords',
  phases: [
    {
      phase: 'Discovery',
      skills: [
        {
          step: 1,
          skill_id: 'skill-1',
          skill_name: 'Requirements',
          risk_level: 'R1',
          difficulty: 'Medium',
          description: 'Gather requirements',
          file_path: 'path/one',
          effort_hours: 1,
        },
      ],
    },
    {
      phase: 'Build',
      skills: [
        {
          step: 2,
          skill_id: 'skill-2',
          skill_name: 'Build UI',
          risk_level: 'R2',
          difficulty: 'Advanced',
          description: '',
          file_path: 'path/two',
          effort_hours: 1,
        },
      ],
    },
  ],
};

describe('SkillPlanner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();

    vi.mocked(isReasoningLoaded).mockReturnValue(true);
    vi.mocked(isLoaded).mockReturnValue(true);
    vi.mocked(planTask).mockReturnValue(null);
    vi.mocked(parseCSV).mockReturnValue([]);
    vi.mocked(parseReasoningCSV).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('generates plan and calls onPlanGenerated', async () => {
    vi.mocked(planTask).mockReturnValue(mockPlan);
    const onPlanGenerated = vi.fn();
    render(<SkillPlanner onPlanGenerated={onPlanGenerated} />);

    fireEvent.change(screen.getByTestId('planner-input'), {
      target: { value: ' fintech dashboard ' },
    });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));

    await waitFor(() => expect(screen.getByTestId('planner-output')).toBeTruthy());
    expect(planTask).toHaveBeenCalledWith('fintech dashboard');
    expect(onPlanGenerated).toHaveBeenCalledWith(mockPlan);
    expect(screen.getByText(/Skill Execution Plan/i)).toBeTruthy();
  });

  it('shows matching error when no plan returned', async () => {
    render(<SkillPlanner />);

    fireEvent.change(screen.getByTestId('planner-input'), {
      target: { value: 'unknown domain task' },
    });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('planner-error').textContent).toContain('Could not match industry');
    });
    expect(screen.queryByTestId('planner-output')).toBeNull();
  });

  it('shows planner exception error when planning throws', async () => {
    vi.mocked(planTask).mockImplementation(() => {
      throw new Error('planner exploded');
    });
    render(<SkillPlanner />);

    fireEvent.change(screen.getByTestId('planner-input'), {
      target: { value: 'fintech task' },
    });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('planner-error').textContent).toContain('Plan generation failed');
    });
  });

  it('supports Enter key to trigger generation', async () => {
    vi.mocked(planTask).mockReturnValue(mockPlan);
    render(<SkillPlanner />);

    const input = screen.getByTestId('planner-input');
    fireEvent.change(input, { target: { value: 'fintech task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(screen.getByTestId('planner-output')).toBeTruthy());
    expect(planTask).toHaveBeenCalledTimes(1);
  });

  it('auto-generates when initialTask is provided and data is ready', async () => {
    vi.mocked(planTask).mockReturnValue(mockPlan);
    render(<SkillPlanner initialTask="fintech dashboard" />);

    await waitFor(() => expect(planTask).toHaveBeenCalledWith('fintech dashboard'));
    expect(screen.getByTestId('planner-output')).toBeTruthy();
  });

  it('loads csv data and initializes planner when reasoning is not loaded', async () => {
    vi.mocked(isReasoningLoaded).mockReturnValue(false);
    vi.mocked(isLoaded).mockReturnValue(false);
    vi.mocked(parseCSV).mockReturnValue([
      {
        skill_id: 'skill-1',
        skill_name: 'Requirements',
        domain: 'business_analysis',
        category: 'analysis',
        difficulty: 'Medium',
        risk_level: 'R1',
        phases: 'discovery',
        keywords: 'requirements,discovery',
        description: 'desc',
        file_path: 'file',
      },
    ]);
    vi.mocked(parseReasoningCSV).mockReturnValue([
      {
        industry: 'Fintech',
        task_pattern: 'fintech',
        skill_chain: 'skill-1',
        rationale: 'match',
      },
    ]);
    vi.mocked(planTask).mockReturnValue(mockPlan);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'skills-csv',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'reasoning-csv',
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<SkillPlanner />);

    await waitFor(() => expect(loadReasoning).toHaveBeenCalledTimes(1));
    expect(loadSkills).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows load error when fetch response is not ok', async () => {
    vi.mocked(isReasoningLoaded).mockReturnValue(false);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, text: async () => '' })
      .mockResolvedValueOnce({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    render(<SkillPlanner />);

    await waitFor(() => {
      expect(screen.getByTestId('planner-error').textContent).toContain('Failed to load skill data');
    });
  });

  it('shows empty-data error when parsed csv does not contain data', async () => {
    vi.mocked(isReasoningLoaded).mockReturnValue(false);
    vi.mocked(parseCSV).mockReturnValue([]);
    vi.mocked(parseReasoningCSV).mockReturnValue([]);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'skills-csv',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'reasoning-csv',
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<SkillPlanner />);

    await waitFor(() => {
      expect(screen.getByTestId('planner-error').textContent).toContain('No skill or reasoning data found');
    });
  });

  it('shows network error when loading planner data fails', async () => {
    vi.mocked(isReasoningLoaded).mockReturnValue(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    render(<SkillPlanner />);

    await waitFor(() => {
      expect(screen.getByTestId('planner-error').textContent).toContain('Failed to load planner data');
    });
  });

  it('exports markdown plan via object URL flow', async () => {
    vi.mocked(planTask).mockReturnValue(mockPlan);

    const anchor = {
      click: vi.fn(),
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement;

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') return anchor;
      return originalCreateElement(tagName);
    });

    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:plan');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<SkillPlanner />);
    fireEvent.change(screen.getByTestId('planner-input'), { target: { value: 'fintech dashboard' } });
    fireEvent.click(screen.getByTestId('planner-generate-btn'));
    await waitFor(() => expect(screen.getByTestId('planner-output')).toBeTruthy());

    fireEvent.click(screen.getByTestId('planner-export-btn'));

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:plan');
  });
});
