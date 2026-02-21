/**
 * CVF Skill Planner — TypeScript port of tools/skill-search/reason_skills.py + plan_skills.py
 *
 * Detects industry from task description, matches reasoning rules,
 * and generates a structured Skill Execution Plan grouped by CVF phases.
 */

import type { SkillRecord } from './skill-search';

// ─── Types ───────────────────────────────────────────────────────────

export interface ReasoningRule {
  industry: string;
  task_pattern: string;
  skill_chain: string;
  rationale: string;
}

export interface PlanSkill {
  step: number;
  skill_id: string;
  skill_name: string;
  risk_level: string;
  difficulty: string;
  description: string;
  file_path: string;
  effort_hours: number;
}

export interface PlanPhase {
  phase: string;
  skills: PlanSkill[];
}

export interface SkillPlan {
  task: string;
  industry: string;
  generated: string;
  total_skills: number;
  estimated_effort: string;
  total_hours: number;
  rationale: string;
  phases: PlanPhase[];
}

export interface IndustryInfo {
  name: string;
  score: number;
  ruleCount: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const PHASE_ORDER: Record<string, number> = {
  discovery: 0,
  design: 1,
  build: 2,
  review: 3,
  deploy: 4,
  optimize: 5,
};

const EFFORT_MAP: Record<string, number> = {
  Easy: 0.5,
  Medium: 1.0,
  Advanced: 2.0,
};

const VI_MAP: Record<string, string> = {
  'thời trang': 'fashion',
  'thương mại điện tử': 'ecommerce',
  'sức khỏe': 'healthcare',
  'y tế': 'healthcare',
  'giáo dục': 'education',
  'du lịch': 'travel',
  'nhà hàng': 'restaurant',
  'bất động sản': 'realestate',
  'làm đẹp': 'beauty',
  'trò chơi': 'gaming',
  'tin tức': 'media news',
  'tài chính': 'fintech',
  'ngân hàng': 'banking',
};

// ─── CSV Parser ──────────────────────────────────────────────────────

export function parseReasoningCSV(csvText: string): ReasoningRule[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rules: ReasoningRule[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current);

    const row: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = (values[h] ?? '').replace(/^"|"$/g, '');
    }

    if (row['industry'] && row['task_pattern']) {
      rules.push(row as unknown as ReasoningRule);
    }
  }

  return rules;
}

// ─── Normalize ───────────────────────────────────────────────────────

function normalize(text: string): string {
  let t = text.toLowerCase().replace(/-/g, '').replace(/_/g, ' ');
  for (const [vi, en] of Object.entries(VI_MAP)) {
    if (t.includes(vi)) {
      t += ' ' + en;
    }
  }
  return t;
}

// ─── Industry Detection ─────────────────────────────────────────────

export function detectIndustry(
  task: string,
  rules: ReasoningRule[],
): { industry: string; rule: ReasoningRule | null; score: number } {
  const taskLower = normalize(task);
  let bestRule: ReasoningRule | null = null;
  let bestScore = 0;
  let bestIndustry = 'Generic';

  for (const rule of rules) {
    const pattern = rule.task_pattern;
    const industry = rule.industry;
    let score = 0;

    // Pattern match
    const parts = pattern.split('|').map(p => p.trim());
    for (const p of parts) {
      if (taskLower.includes(p.toLowerCase())) {
        score += 10.0;
      }
    }

    // Industry name match
    if (taskLower.includes(industry.toLowerCase())) {
      score += 5.0;
    }

    // Partial industry words
    for (const w of industry.toLowerCase().split(/\s+/)) {
      if (w.length >= 3 && taskLower.includes(w)) {
        score += 2.0;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
      bestIndustry = industry;
    }
  }

  if (!bestRule) {
    // Fallback to generic
    const generic = rules.find(r => r.industry === 'Generic' && r.task_pattern.includes('new project'));
    if (generic) bestRule = generic;
  }

  return { industry: bestIndustry, rule: bestRule, score: bestScore };
}

// ─── Plan Builder ────────────────────────────────────────────────────

function getFirstPhase(phasesStr: string): string {
  const phases = phasesStr.split(',').map(p => p.trim().toLowerCase());
  const earliest = phases.reduce((min, p) =>
    (PHASE_ORDER[p] ?? 99) < (PHASE_ORDER[min] ?? 99) ? p : min
  );
  return earliest.charAt(0).toUpperCase() + earliest.slice(1);
}

export function buildPlan(
  task: string,
  rule: ReasoningRule,
  skillIndex: Map<string, SkillRecord>,
  maxSkills = 15,
): SkillPlan {
  const skillIds = rule.skill_chain.split('|').slice(0, maxSkills);

  const phases: Record<string, PlanSkill[]> = {};
  let step = 0;
  let totalEffort = 0;

  for (const sid of skillIds) {
    const info = skillIndex.get(sid);
    if (!info) continue;

    const phase = getFirstPhase(info.phases || 'Build');
    if (!phases[phase]) phases[phase] = [];

    step++;
    const difficulty = info.difficulty || 'Medium';
    const effort = EFFORT_MAP[difficulty] ?? 1.0;
    totalEffort += effort;

    phases[phase].push({
      step,
      skill_id: sid,
      skill_name: info.skill_name || sid,
      risk_level: info.risk_level || 'R1',
      difficulty,
      description: info.description || '',
      file_path: info.file_path || '',
      effort_hours: effort,
    });
  }

  // Sort phases by order
  const sortedPhases: PlanPhase[] = Object.entries(phases)
    .sort(([a], [b]) => (PHASE_ORDER[a.toLowerCase()] ?? 99) - (PHASE_ORDER[b.toLowerCase()] ?? 99))
    .map(([phase, skills]) => ({ phase, skills }));

  const effortDays = Math.max(1, Math.round(totalEffort / 6));

  return {
    task,
    industry: rule.industry,
    generated: new Date().toISOString().split('T')[0],
    total_skills: step,
    estimated_effort: `${effortDays}-${effortDays + 1} days`,
    total_hours: Math.round(totalEffort * 10) / 10,
    rationale: rule.rationale,
    phases: sortedPhases,
  };
}

// ─── Available Industries ────────────────────────────────────────────

export function getIndustries(rules: ReasoningRule[]): IndustryInfo[] {
  const map: Record<string, number> = {};
  for (const r of rules) {
    map[r.industry] = (map[r.industry] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([name, ruleCount]) => ({ name, score: 0, ruleCount }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Module State ────────────────────────────────────────────────────

let _rules: ReasoningRule[] = [];
let _skillIndex: Map<string, SkillRecord> = new Map();

export function loadReasoning(rules: ReasoningRule[], skills: SkillRecord[]): void {
  _rules = rules;
  _skillIndex = new Map(skills.map(s => [s.skill_id, s]));
}

export function planTask(task: string, maxSkills = 15): SkillPlan | null {
  if (_rules.length === 0) return null;

  const { rule } = detectIndustry(task, _rules);
  if (!rule) return null;

  return buildPlan(task, rule, _skillIndex, maxSkills);
}

export function getAvailableIndustries(): IndustryInfo[] {
  return getIndustries(_rules);
}

export function isReasoningLoaded(): boolean {
  return _rules.length > 0;
}
