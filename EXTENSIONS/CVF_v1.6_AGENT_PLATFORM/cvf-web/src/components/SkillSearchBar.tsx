'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  searchSkills,
  loadSkills,
  parseCSV,
  isLoaded,
  getDomains,
  DOMAIN_NAMES,
  type SearchResult,
  type SkillRecord,
  type SearchOptions,
} from '@/lib/skill-search';

// ─── Props ───────────────────────────────────────────────────────────

interface SkillSearchBarProps {
  onSelect?: (skill: SkillRecord) => void;
  onResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  domainFilter?: string;
  riskFilter?: string;
  phaseFilter?: string;
  difficultyFilter?: string;
}

// ─── Difficulty and Risk Display ─────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const RISK_COLORS: Record<string, string> = {
  R0: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  R1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  R2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  R3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// ─── Component ───────────────────────────────────────────────────────

export function SkillSearchBar({
  onSelect,
  onResults,
  placeholder = 'Search skills... (e.g. "landing page", "security audit")',
  domainFilter,
  riskFilter,
  phaseFilter,
  difficultyFilter,
}: SkillSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(isLoaded());
  const [elapsed, setElapsed] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load CSV data on mount
  useEffect(() => {
    if (isLoaded()) {
      setDataLoaded(true);
      return;
    }

    async function load() {
      try {
        const res = await fetch('/data/skills_index.csv');
        if (!res.ok) return;
        const text = await res.text();
        const skills = parseCSV(text);
        if (skills.length > 0) {
          loadSkills(skills);
          setDataLoaded(true);
        }
      } catch {
        console.warn('Failed to load skills index CSV');
      }
    }
    load();
  }, []);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      if (!dataLoaded || !q.trim()) {
        setResults([]);
        onResults?.([]);
        return;
      }

      setLoading(true);
      const start = performance.now();

      const opts: SearchOptions = {
        topN: 10,
        domain: domainFilter,
        risk: riskFilter,
        phase: phaseFilter,
        difficulty: difficultyFilter,
      };

      const hits = searchSkills(q, opts);
      const ms = performance.now() - start;

      setResults(hits);
      setElapsed(Math.round(ms * 10) / 10);
      setLoading(false);
      onResults?.(hits);
    },
    [dataLoaded, domainFilter, riskFilter, phaseFilter, difficultyFilter, onResults],
  );

  // Handle input change with debounce
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 300);
    },
    [doSearch],
  );

  // Handle key press — immediate search on Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        doSearch(query);
      }
    },
    [doSearch, query],
  );

  return (
    <div className="w-full" data-testid="skill-search-bar">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={dataLoaded ? placeholder : 'Loading skills...'}
          disabled={!dataLoaded}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 transition-all text-sm sm:text-base"
          aria-label="Search skills"
          data-testid="skill-search-input"
        />
        {loading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            ⏳
          </span>
        )}
      </div>

      {/* Results Count */}
      {query.trim() && dataLoaded && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" data-testid="skill-search-meta">
          {results.length > 0
            ? `Found ${results.length} skills in ${elapsed}ms`
            : 'No results — try broader keywords'}
        </p>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid="skill-search-results">
          {results.map((r) => (
            <li
              key={r.skill.skill_id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(r.skill)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect?.(r.skill)}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800/50 cursor-pointer
                         hover:border-blue-400 dark:hover:border-blue-500
                         hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {r.skill.skill_name}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_COLORS[r.skill.risk_level] ?? RISK_COLORS.R1}`}>
                      {r.skill.risk_level}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_COLORS[r.skill.difficulty] ?? DIFFICULTY_COLORS.Medium}`}>
                      {r.skill.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {DOMAIN_NAMES[r.skill.domain] ?? r.skill.domain} · {r.skill.phases}
                  </p>
                  {r.skill.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {r.skill.description}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono whitespace-nowrap">
                  {r.score.toFixed(1)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SkillSearchBar;
