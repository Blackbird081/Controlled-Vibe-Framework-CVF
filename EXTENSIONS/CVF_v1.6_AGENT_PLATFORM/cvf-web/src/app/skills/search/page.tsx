'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import { SkillSearchBar } from '@/components/SkillSearchBar';
import { SkillPlanner } from '@/components/SkillPlanner';
import { IndustryFilter } from '@/components/IndustryFilter';
import { SkillGraph } from '@/components/SkillGraph';
import type { SkillRecord, SearchResult } from '@/lib/skill-search';
import type { SkillPlan } from '@/lib/skill-planner';

type ActiveTab = 'search' | 'planner';

export default function SkillSearchPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [domainFilter, setDomainFilter] = useState('');
  const [plan, setPlan] = useState<SkillPlan | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);

  const handleSkillSelect = useCallback((skill: SkillRecord) => {
    setSelectedSkill(skill);
  }, []);

  const handleResults = useCallback((results: SearchResult[]) => {
    setSearchResults(results);
  }, []);

  const handlePlanGenerated = useCallback((p: SkillPlan) => {
    setPlan(p);
  }, []);

  const handleSkillClick = useCallback((skillId: string) => {
    // Could navigate to skill detail or show modal
    console.log('Skill clicked:', skillId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              CVF v1.6
            </Link>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <h1 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Skill Search & Planner
            </h1>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/skills" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('skills.title') || 'Skills'}
            </Link>
            <Link href="/docs" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('nav.docs') || 'Docs'}
            </Link>
            <ThemeToggle />
            <LanguageToggle />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab Switcher */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6 w-fit" data-testid="tab-switcher">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'search'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            data-testid="tab-search"
          >
            🔍 Search
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${activeTab === 'planner'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            data-testid="tab-planner"
          >
            📋 Planner
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'search' ? (
              <>
                {/* Domain Filter */}
                <IndustryFilter
                  mode="domain"
                  selected={domainFilter}
                  onChange={setDomainFilter}
                />

                {/* Search Bar */}
                <SkillSearchBar
                  onSelect={handleSkillSelect}
                  onResults={handleResults}
                  domainFilter={domainFilter || undefined}
                />
              </>
            ) : (
              <>
                {/* Industry Filter */}
                <IndustryFilter
                  mode="industry"
                  onChange={(v) => {/* Used for display; planner detects industry from task */}}
                />

                {/* Planner */}
                <SkillPlanner
                  onPlanGenerated={handlePlanGenerated}
                  onSkillClick={handleSkillClick}
                />
              </>
            )}
          </div>

          {/* Side Panel — Graph + Detail */}
          <div className="space-y-6">
            {/* Skill Graph */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30">
              <SkillGraph
                plan={activeTab === 'planner' ? plan : null}
                skills={activeTab === 'search' ? searchResults.map(r => r.skill) : []}
                onSkillClick={handleSkillClick}
              />
            </div>

            {/* Skill Detail Card */}
            {selectedSkill && (
              <div
                className="p-4 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                data-testid="skill-detail-card"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {selectedSkill.skill_name}
                  </h4>
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                    aria-label="Close detail"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Domain:</span> {selectedSkill.domain}</p>
                  <p><span className="font-medium">Risk:</span> {selectedSkill.risk_level}</p>
                  <p><span className="font-medium">Difficulty:</span> {selectedSkill.difficulty}</p>
                  <p><span className="font-medium">Phases:</span> {selectedSkill.phases}</p>
                  {selectedSkill.keywords && (
                    <p><span className="font-medium">Keywords:</span> {selectedSkill.keywords}</p>
                  )}
                  {selectedSkill.description && (
                    <p className="mt-2">{selectedSkill.description}</p>
                  )}
                </div>
                <div className="mt-3">
                  <Link
                    href={`/skills/${selectedSkill.domain}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View in Skill Library →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700/50 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
          <p>CVF Skill Search — BM25 Engine + Industry Reasoning | 141 Skills · 12 Domains · 50 Rules</p>
        </div>
      </footer>
    </div>
  );
}
