'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  planTask,
  loadReasoning,
  parseReasoningCSV,
  isReasoningLoaded,
  detectIndustry,
  getAvailableIndustries,
  type SkillPlan,
  type PlanPhase,
  type ReasoningRule,
} from '@/lib/skill-planner';
import { parseCSV, isLoaded, loadSkills, type SkillRecord } from '@/lib/skill-search';

// ─── Props ───────────────────────────────────────────────────────────

interface SkillPlannerProps {
  initialTask?: string;
  onPlanGenerated?: (plan: SkillPlan) => void;
  onSkillClick?: (skillId: string) => void;
}

// ─── Phase Colors ────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  Discovery: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  Design: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  Build: 'border-green-400 bg-green-50 dark:bg-green-900/20',
  Review: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
  Deploy: 'border-red-400 bg-red-50 dark:bg-red-900/20',
  Optimize: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20',
};

const PHASE_ICONS: Record<string, string> = {
  Discovery: '🔍',
  Design: '🎨',
  Build: '🔨',
  Review: '✅',
  Deploy: '🚀',
  Optimize: '📈',
};

const RISK_BADGE: Record<string, string> = {
  R0: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  R1: 'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  R2: 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  R3: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

// ─── Component ───────────────────────────────────────────────────────

export function SkillPlanner({
  initialTask = '',
  onPlanGenerated,
  onSkillClick,
}: SkillPlannerProps) {
  const [task, setTask] = useState(initialTask);
  const [plan, setPlan] = useState<SkillPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(isReasoningLoaded());
  const [error, setError] = useState('');

  // Load reasoning + skills data
  useEffect(() => {
    if (isReasoningLoaded()) {
      setDataReady(true);
      return;
    }

    async function load() {
      try {
        const [skillsRes, reasoningRes] = await Promise.all([
          fetch('/data/skills_index.csv'),
          fetch('/data/skill_reasoning.csv'),
        ]);

        if (!skillsRes.ok || !reasoningRes.ok) {
          setError('Failed to load skill data');
          return;
        }

        const [skillsText, reasoningText] = await Promise.all([
          skillsRes.text(),
          reasoningRes.text(),
        ]);

        const skills = parseCSV(skillsText);
        const rules = parseReasoningCSV(reasoningText);

        if (skills.length > 0 && rules.length > 0) {
          if (!isLoaded()) loadSkills(skills);
          loadReasoning(rules, skills);
          setDataReady(true);
        } else {
          setError('No skill or reasoning data found');
        }
      } catch {
        setError('Failed to load planner data');
      }
    }
    load();
  }, []);

  // Generate plan
  const generate = useCallback(() => {
    if (!task.trim() || !dataReady) return;

    setLoading(true);
    setError('');

    try {
      const result = planTask(task.trim());
      if (result) {
        setPlan(result);
        onPlanGenerated?.(result);
      } else {
        setError('Could not match industry. Try including keywords like "fintech", "ecommerce", "healthcare".');
        setPlan(null);
      }
    } catch {
      setError('Plan generation failed');
    } finally {
      setLoading(false);
    }
  }, [task, dataReady, onPlanGenerated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') generate();
    },
    [generate],
  );

  // Export plan as markdown
  const exportPlan = useCallback(() => {
    if (!plan) return;

    let md = `# Skill Execution Plan\n\n`;
    md += `> **Task:** ${plan.task}\n`;
    md += `> **Industry:** ${plan.industry}\n`;
    md += `> **Generated:** ${plan.generated}\n`;
    md += `> **Total Skills:** ${plan.total_skills}\n`;
    md += `> **Estimated Effort:** ${plan.estimated_effort} (~${plan.total_hours}h)\n\n---\n\n`;

    for (const phase of plan.phases) {
      md += `## Phase: ${phase.phase} (${phase.skills.length} skills)\n\n`;
      for (const skill of phase.skills) {
        md += `### ${skill.step}. ${skill.skill_name}\n\n`;
        md += `- **Risk:** ${skill.risk_level} | **Difficulty:** ${skill.difficulty} | **~${skill.effort_hours}h**\n`;
        if (skill.description) md += `- **Purpose:** ${skill.description.slice(0, 150)}\n`;
        md += `\n`;
      }
      md += `---\n\n`;
    }

    md += `## Rationale\n\n> ${plan.rationale}\n\n---\n\n`;
    md += `*Generated by CVF Skill Planner | ${plan.generated}*\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-plan-${plan.industry.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [plan]);

  return (
    <div className="w-full" data-testid="skill-planner">
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dataReady ? 'Describe your task... (e.g. "fintech dashboard", "beauty spa app")' : 'Loading...'}
          disabled={!dataReady}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     disabled:opacity-50 transition-all text-sm sm:text-base"
          aria-label="Task description"
          data-testid="planner-input"
        />
        <button
          onClick={generate}
          disabled={!dataReady || !task.trim() || loading}
          className="px-5 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base
                     whitespace-nowrap"
          data-testid="planner-generate-btn"
        >
          {loading ? '⏳' : '📋 Plan'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" data-testid="planner-error">
          {error}
        </p>
      )}

      {/* Plan Output */}
      {plan && (
        <div className="mt-6 space-y-4" data-testid="planner-output">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Skill Execution Plan
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Industry: <span className="font-medium text-purple-600 dark:text-purple-400">{plan.industry}</span>
                {' · '}{plan.total_skills} skills{' · '}{plan.estimated_effort} (~{plan.total_hours}h)
              </p>
            </div>
            <button
              onClick={exportPlan}
              className="px-3 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200
                         dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
              data-testid="planner-export-btn"
            >
              📥 Export .md
            </button>
          </div>

          {/* Phase Cards */}
          {plan.phases.map((phase) => (
            <div
              key={phase.phase}
              className={`border-l-4 rounded-lg p-4 ${PHASE_COLORS[phase.phase] ?? 'border-gray-400 bg-gray-50 dark:bg-gray-800/30'}`}
            >
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3">
                {PHASE_ICONS[phase.phase] ?? '📋'} {phase.phase} ({phase.skills.length} skills)
              </h4>
              <div className="space-y-2">
                {phase.skills.map((skill) => (
                  <div
                    key={skill.skill_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSkillClick?.(skill.skill_id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSkillClick?.(skill.skill_id)}
                    className="flex items-start gap-3 p-2 rounded-md bg-white/60 dark:bg-gray-800/40
                               hover:bg-white dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 w-5 text-right">
                      {skill.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {skill.skill_name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_BADGE[skill.risk_level] ?? RISK_BADGE.R1}`}>
                          {skill.risk_level}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {skill.difficulty} · ~{skill.effort_hours}h
                        </span>
                      </div>
                      {skill.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {skill.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Rationale */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">💡 Rationale:</span> {plan.rationale}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SkillPlanner;
