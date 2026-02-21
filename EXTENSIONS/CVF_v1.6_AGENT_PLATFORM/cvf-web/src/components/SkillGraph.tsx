'use client';

import { useState, useMemo } from 'react';
import { DOMAIN_NAMES, type SkillRecord } from '@/lib/skill-search';
import type { SkillPlan, PlanPhase } from '@/lib/skill-planner';

// ─── Props ───────────────────────────────────────────────────────────

interface SkillGraphProps {
  plan?: SkillPlan | null;
  skills?: SkillRecord[];
  onSkillClick?: (skillId: string) => void;
}

// ─── Colors ──────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  product_ux: '#8B5CF6',
  web_development: '#3B82F6',
  app_development: '#10B981',
  marketing_seo: '#F59E0B',
  security_compliance: '#EF4444',
  content_creation: '#EC4899',
  business_analysis: '#6366F1',
  ai_ml_evaluation: '#14B8A6',
  technical_review: '#F97316',
  finance_analytics: '#06B6D4',
  hr_operations: '#84CC16',
  legal_contracts: '#A855F7',
};

const PHASE_COLORS: Record<string, string> = {
  Discovery: '#A855F7',
  Design: '#3B82F6',
  Build: '#10B981',
  Review: '#F59E0B',
  Deploy: '#EF4444',
  Optimize: '#14B8A6',
};

// ─── Component ───────────────────────────────────────────────────────

export function SkillGraph({ plan, skills = [], onSkillClick }: SkillGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build graph from plan phases
  const graphData = useMemo(() => {
    if (!plan || plan.phases.length === 0) {
      // Show domain distribution when no plan
      if (skills.length === 0) return null;

      const domainCounts: Record<string, number> = {};
      for (const s of skills) {
        domainCounts[s.domain] = (domainCounts[s.domain] ?? 0) + 1;
      }

      return {
        type: 'domain-overview' as const,
        domains: Object.entries(domainCounts)
          .map(([id, count]) => ({
            id,
            name: DOMAIN_NAMES[id] ?? id,
            count,
            color: DOMAIN_COLORS[id] ?? '#6B7280',
          }))
          .sort((a, b) => b.count - a.count),
      };
    }

    return {
      type: 'plan-flow' as const,
      phases: plan.phases,
      industry: plan.industry,
    };
  }, [plan, skills]);

  if (!graphData) {
    return (
      <div className="w-full p-8 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm" data-testid="skill-graph-empty">
        No data to visualize
      </div>
    );
  }

  // ─── Domain Overview (bar chart) ─────────────────────────────────

  if (graphData.type === 'domain-overview') {
    const maxCount = Math.max(...graphData.domains.map(d => d.count));

    return (
      <div className="w-full" data-testid="skill-graph">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          📊 Skill Distribution by Domain
        </h4>
        <div className="space-y-2">
          {graphData.domains.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => onSkillClick?.(d.id)}
              onMouseEnter={() => setHoveredNode(d.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate text-right">
                {d.name}
              </span>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    backgroundColor: d.color,
                    opacity: hoveredNode === d.id ? 1 : 0.75,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right font-mono">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Plan Flow (phase → skills pipeline) ─────────────────────────

  return (
    <div className="w-full overflow-x-auto" data-testid="skill-graph">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        🔗 Skill Execution Flow — {graphData.industry}
      </h4>
      <div className="flex gap-4 min-w-max pb-2">
        {graphData.phases.map((phase, phaseIdx) => (
          <div key={phase.phase} className="flex items-start gap-2">
            {/* Phase column */}
            <div className="flex flex-col items-center gap-2 min-w-[160px]">
              {/* Phase header */}
              <div
                className="w-full px-3 py-2 rounded-lg text-center text-xs font-bold text-white"
                style={{ backgroundColor: PHASE_COLORS[phase.phase] ?? '#6B7280' }}
              >
                {phase.phase}
              </div>

              {/* Skill nodes */}
              {phase.skills.map((skill) => {
                const domain = skill.skill_id.split('/')[0] ?? '';
                const color = DOMAIN_COLORS[domain] ?? '#6B7280';

                return (
                  <div
                    key={skill.skill_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSkillClick?.(skill.skill_id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSkillClick?.(skill.skill_id)}
                    onMouseEnter={() => setHoveredNode(skill.skill_id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`w-full px-3 py-2 rounded-md border-2 cursor-pointer transition-all text-left
                      ${hoveredNode === skill.skill_id
                        ? 'shadow-md scale-105'
                        : 'shadow-sm'
                      }`}
                    style={{
                      borderColor: color,
                      backgroundColor: hoveredNode === skill.skill_id
                        ? `${color}15`
                        : 'transparent',
                    }}
                  >
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      {skill.step}
                    </span>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                      {skill.skill_name}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[9px] px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {skill.risk_level}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {skill.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrow connector between phases */}
            {phaseIdx < graphData.phases.length - 1 && (
              <div className="flex items-center self-center text-gray-300 dark:text-gray-600 text-2xl pt-8">
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkillGraph;
