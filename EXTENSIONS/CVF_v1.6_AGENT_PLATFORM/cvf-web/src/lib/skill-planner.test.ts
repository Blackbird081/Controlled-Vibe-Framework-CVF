/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseReasoningCSV,
  detectIndustry,
  buildPlan,
  getIndustries,
  loadReasoning,
  planTask,
  isReasoningLoaded,
  getAvailableIndustries,
  type ReasoningRule,
} from './skill-planner';
import { parseCSV, loadSkills, type SkillRecord } from './skill-search';

// ─── Test Data ───────────────────────────────────────────────────────

const SAMPLE_SKILLS_CSV = `skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
product_ux/ui_style_selection,product_ux,UI Style Selection Guide,Medium,R1,"Discovery,Design",style ui selection,"Helps pick UI style",product_ux/ui_style_selection.skill.md
product_ux/color_palette_generator,product_ux,Color Palette Generator,Easy,R0,Design,"color palette","Generates color palettes",product_ux/color_palette_generator.skill.md
web_development/07_landing_page_pattern,web_development,Landing Page Pattern Selection,Easy,R0,"Discovery,Design","landing page","Select landing page layout",web_development/07_landing_page_pattern.skill.md
web_development/06_chart_data_visualization,web_development,Chart Data Visualization,Medium,R1,Build,"chart data visualization","Data viz best practices",web_development/06_chart_data_visualization.skill.md
app_development/industry_ui_reasoning,app_development,Industry UI Reasoning,Medium,R1,Discovery,"industry reasoning","Design reasoning for industry",app_development/industry_ui_reasoning.skill.md`;

const SAMPLE_REASONING_CSV = `industry,task_pattern,skill_chain,rationale
Fintech,dashboard|analytics|data viz,app_development/industry_ui_reasoning|product_ux/ui_style_selection|web_development/06_chart_data_visualization,Fintech needs trust-focused design and data visualization
Ecommerce,product listing|cart|checkout|marketplace,"web_development/07_landing_page_pattern|product_ux/ui_style_selection|product_ux/color_palette_generator",Ecommerce needs visual product showcase
Beauty,booking|portfolio|spa,"product_ux/ui_style_selection|product_ux/color_palette_generator|web_development/07_landing_page_pattern",Beauty needs elegant visual style
Generic,new project|redesign|audit,"app_development/industry_ui_reasoning|product_ux/ui_style_selection",Generic fallback for unknown industries`;

// ─── parseReasoningCSV Tests ─────────────────────────────────────────

describe('parseReasoningCSV', () => {
  it('parses valid reasoning CSV', () => {
    const rules = parseReasoningCSV(SAMPLE_REASONING_CSV);
    expect(rules).toHaveLength(4);
    expect(rules[0].industry).toBe('Fintech');
    expect(rules[0].task_pattern).toBe('dashboard|analytics|data viz');
    expect(rules[0].skill_chain).toContain('industry_ui_reasoning');
  });

  it('returns empty for empty input', () => {
    expect(parseReasoningCSV('')).toHaveLength(0);
  });
});

// ─── detectIndustry Tests ────────────────────────────────────────────

describe('detectIndustry', () => {
  let rules: ReasoningRule[];

  beforeEach(() => {
    rules = parseReasoningCSV(SAMPLE_REASONING_CSV);
  });

  it('detects fintech from "fintech dashboard"', () => {
    const { industry, score } = detectIndustry('fintech dashboard', rules);
    expect(industry).toBe('Fintech');
    expect(score).toBeGreaterThan(0);
  });

  it('detects ecommerce from "product listing marketplace"', () => {
    const { industry } = detectIndustry('product listing marketplace', rules);
    expect(industry).toBe('Ecommerce');
  });

  it('detects beauty from "beauty spa booking"', () => {
    const { industry } = detectIndustry('beauty spa booking', rules);
    expect(industry).toBe('Beauty');
  });

  it('handles Vietnamese input with normalization', () => {
    const { industry } = detectIndustry('Tạo dashboard cho tài chính', rules);
    expect(industry).toBe('Fintech');
  });

  it('falls back to Generic when no match', () => {
    const { rule } = detectIndustry('zzz unknown thing', rules);
    // Should get generic fallback
    expect(rule).not.toBeNull();
  });
});

// ─── buildPlan Tests ─────────────────────────────────────────────────

describe('buildPlan', () => {
  let rules: ReasoningRule[];
  let skillIndex: Map<string, SkillRecord>;

  beforeEach(() => {
    rules = parseReasoningCSV(SAMPLE_REASONING_CSV);
    const skills = parseCSV(SAMPLE_SKILLS_CSV);
    skillIndex = new Map(skills.map(s => [s.skill_id, s]));
  });

  it('builds a plan from a matched rule', () => {
    const rule = rules[0]; // Fintech
    const plan = buildPlan('fintech dashboard', rule, skillIndex);

    expect(plan.industry).toBe('Fintech');
    expect(plan.task).toBe('fintech dashboard');
    expect(plan.total_skills).toBeGreaterThan(0);
    expect(plan.phases.length).toBeGreaterThan(0);
    expect(plan.total_hours).toBeGreaterThan(0);
    expect(plan.estimated_effort).toMatch(/\d+-\d+ days/);
  });

  it('groups skills by phase', () => {
    const rule = rules[0];
    const plan = buildPlan('fintech dashboard', rule, skillIndex);

    for (const phase of plan.phases) {
      expect(phase.phase).toBeTruthy();
      expect(phase.skills.length).toBeGreaterThan(0);
      for (const skill of phase.skills) {
        expect(skill.skill_id).toBeTruthy();
        expect(skill.step).toBeGreaterThan(0);
      }
    }
  });

  it('respects maxSkills limit', () => {
    const rule = rules[0];
    const plan = buildPlan('test', rule, skillIndex, 1);
    expect(plan.total_skills).toBeLessThanOrEqual(1);
  });
});

// ─── Module-level API Tests ──────────────────────────────────────────

describe('planTask API', () => {
  beforeEach(() => {
    const skills = parseCSV(SAMPLE_SKILLS_CSV);
    const rules = parseReasoningCSV(SAMPLE_REASONING_CSV);
    loadSkills(skills);
    loadReasoning(rules, skills);
  });

  it('reports isReasoningLoaded', () => {
    expect(isReasoningLoaded()).toBe(true);
  });

  it('planTask returns plan for matching task', () => {
    const plan = planTask('fintech dashboard');
    expect(plan).not.toBeNull();
    expect(plan!.industry).toBe('Fintech');
    expect(plan!.total_skills).toBeGreaterThan(0);
  });

  it('getAvailableIndustries returns industry list', () => {
    const industries = getAvailableIndustries();
    expect(industries.length).toBeGreaterThan(0);
    expect(industries.find(i => i.name === 'Fintech')).toBeDefined();
  });
});

// ─── getIndustries Tests ─────────────────────────────────────────────

describe('getIndustries', () => {
  it('counts rules per industry', () => {
    const rules = parseReasoningCSV(SAMPLE_REASONING_CSV);
    const industries = getIndustries(rules);

    const fintech = industries.find(i => i.name === 'Fintech');
    expect(fintech).toBeDefined();
    expect(fintech!.ruleCount).toBe(1);
  });
});
