'use client';

import { useMemo } from 'react';
import { getDomains } from '@/lib/skill-search';
import {
  getAvailableIndustries,
  isReasoningLoaded,
} from '@/lib/skill-planner';

// ─── Props ───────────────────────────────────────────────────────────

interface IndustryFilterProps {
  mode?: 'domain' | 'industry';
  selected?: string;
  onChange?: (value: string) => void;
  showCounts?: boolean;
}

// ─── Industry Colors ─────────────────────────────────────────────────

const INDUSTRY_ICONS: Record<string, string> = {
  Fintech: '💰',
  Healthcare: '🏥',
  Ecommerce: '🛒',
  SaaS: '☁️',
  Education: '📚',
  Beauty: '💄',
  Food: '🍽️',
  RealEstate: '🏠',
  Gaming: '🎮',
  Travel: '✈️',
  Media: '📰',
  Generic: '🌐',
};

const DOMAIN_ICONS: Record<string, string> = {
  ai_ml_evaluation: '🤖',
  app_development: '📱',
  business_analysis: '📊',
  content_creation: '✍️',
  finance_analytics: '💹',
  hr_operations: '👥',
  legal_contracts: '⚖️',
  marketing_seo: '📣',
  product_ux: '🎨',
  security_compliance: '🔒',
  technical_review: '🔧',
  web_development: '🌐',
};

// ─── Component ───────────────────────────────────────────────────────

export function IndustryFilter({
  mode = 'domain',
  selected = '',
  onChange,
  showCounts = true,
}: IndustryFilterProps) {
  const items = useMemo<Array<{ id: string; label: string; icon: string; count: number }>>(() => {
    if (mode === 'industry') {
      if (!isReasoningLoaded()) return [];
      const industries = getAvailableIndustries();
      return industries.map((ind) => ({
        id: ind.name,
        label: ind.name,
        icon: INDUSTRY_ICONS[ind.name] ?? '📋',
        count: ind.ruleCount,
      }));
    }
    const domains = getDomains();
    return domains.map((d) => ({
      id: d.id,
      label: d.name,
      icon: DOMAIN_ICONS[d.id] ?? '📂',
      count: d.count,
    }));
  }, [mode]);

  return (
    <div className="w-full" data-testid="industry-filter">
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <button
          onClick={() => onChange?.('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
            ${!selected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          data-testid="filter-all"
        >
          All {showCounts && items.length > 0 && `(${items.reduce((s, i) => s + i.count, 0)})`}
        </button>

        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange?.(item.id === selected ? '' : item.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${item.id === selected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            data-testid={`filter-${item.id}`}
          >
            {item.icon} {item.label}
            {showCounts && <span className="ml-1 opacity-70">({item.count})</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default IndustryFilter;
