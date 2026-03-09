/**
 * Template Recommender — Tests
 * Track 3.1: Intent-based template suggestion
 * Track 3.2: Smart defaults from history
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  recommendTemplates,
  getExactMatch,
  CATEGORY_KEYWORDS,
  recordTemplateUsage,
  getPreferredCategory,
  getRecentTemplates,
} from './template-recommender';

// ═══════════════════════════════════════════════════════════════════════
// recommendTemplates
// ═══════════════════════════════════════════════════════════════════════

describe('recommendTemplates', () => {
  test('returns empty for empty intent', () => {
    expect(recommendTemplates('')).toEqual([]);
    expect(recommendTemplates('   ')).toEqual([]);
  });

  test('returns results for business intent', () => {
    const results = recommendTemplates('I need a business strategy plan');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].reason).toBeTruthy();
    // Should lean toward business templates
    const hasBusinessTemplate = results.some(r => r.template.category === 'business');
    expect(hasBusinessTemplate).toBe(true);
  });

  test('returns results for development intent', () => {
    const results = recommendTemplates('build a web app with API');
    expect(results.length).toBeGreaterThan(0);
    const hasDev = results.some(r => r.template.category === 'development');
    expect(hasDev).toBe(true);
  });

  test('returns results for marketing intent', () => {
    const results = recommendTemplates('SEO audit for my website');
    expect(results.length).toBeGreaterThan(0);
    const hasMarketing = results.some(r => r.template.category === 'marketing');
    expect(hasMarketing).toBe(true);
  });

  test('returns results for security intent', () => {
    const results = recommendTemplates('security vulnerability audit');
    expect(results.length).toBeGreaterThan(0);
    const hasSecurity = results.some(r => r.template.category === 'security');
    expect(hasSecurity).toBe(true);
  });

  test('respects maxResults', () => {
    const results = recommendTemplates('business plan strategy', { maxResults: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test('preferredCategory boosts score', () => {
    const withPref = recommendTemplates('analyze data', { preferredCategory: 'research' });
    const withoutPref = recommendTemplates('analyze data');
    // With preference, research templates should rank higher
    const researchIdxWith = withPref.findIndex(r => r.template.category === 'research');
    const researchIdxWithout = withoutPref.findIndex(r => r.template.category === 'research');
    if (researchIdxWith >= 0 && researchIdxWithout >= 0) {
      expect(researchIdxWith).toBeLessThanOrEqual(researchIdxWithout);
    }
  });

  test('Vietnamese intent works', () => {
    const results = recommendTemplates('kinh doanh chiến lược', { lang: 'vi' });
    expect(results.length).toBeGreaterThan(0);
    const hasBusiness = results.some(r => r.template.category === 'business');
    expect(hasBusiness).toBe(true);
  });

  test('Vietnamese reason text', () => {
    const results = recommendTemplates('kinh doanh chiến lược', { lang: 'vi' });
    if (results.length > 0) {
      // Reason should be in Vietnamese
      expect(results[0].reason).toMatch(/[àáảãạ]/);
    }
  });

  test('results are sorted by score descending', () => {
    const results = recommendTemplates('build a web application');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  test('each result has template, score, reason', () => {
    const results = recommendTemplates('code review');
    for (const r of results) {
      expect(r.template).toBeDefined();
      expect(r.template.id).toBeTruthy();
      expect(typeof r.score).toBe('number');
      expect(typeof r.reason).toBe('string');
    }
  });

  test('content creation intent', () => {
    const results = recommendTemplates('write documentation for my project');
    expect(results.length).toBeGreaterThan(0);
    const hasContent = results.some(r => r.template.category === 'content');
    expect(hasContent).toBe(true);
  });

  test('product intent', () => {
    const results = recommendTemplates('create a product roadmap with features');
    expect(results.length).toBeGreaterThan(0);
    const hasProduct = results.some(r => r.template.category === 'product');
    expect(hasProduct).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getExactMatch
// ═══════════════════════════════════════════════════════════════════════

describe('getExactMatch', () => {
  test('returns null for empty intent', () => {
    expect(getExactMatch('')).toBeNull();
    expect(getExactMatch('   ')).toBeNull();
  });

  test('returns null for non-matching intent', () => {
    expect(getExactMatch('xyzzy random nonexistent template')).toBeNull();
  });

  test('matches by template ID', () => {
    const result = getExactMatch('code_review');
    if (result) {
      expect(result.id).toBe('code_review');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATEGORY_KEYWORDS
// ═══════════════════════════════════════════════════════════════════════

describe('CATEGORY_KEYWORDS', () => {
  test('covers all expected categories', () => {
    const cats = CATEGORY_KEYWORDS.map(ck => ck.category);
    expect(cats).toContain('business');
    expect(cats).toContain('technical');
    expect(cats).toContain('content');
    expect(cats).toContain('research');
    expect(cats).toContain('marketing');
    expect(cats).toContain('product');
    expect(cats).toContain('security');
    expect(cats).toContain('development');
  });

  test('all entries have both en and vi keywords', () => {
    for (const ck of CATEGORY_KEYWORDS) {
      expect(ck.keywords.length).toBeGreaterThan(0);
      expect(ck.viKeywords.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// History: recordTemplateUsage / getPreferredCategory / getRecentTemplates
// ═══════════════════════════════════════════════════════════════════════

describe('template history', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('getPreferredCategory returns undefined when no history', () => {
    expect(getPreferredCategory()).toBeUndefined();
  });

  test('recordTemplateUsage + getPreferredCategory', () => {
    recordTemplateUsage('code_review', 'technical');
    recordTemplateUsage('architecture_review', 'technical');
    recordTemplateUsage('business_strategy_wizard', 'business');
    expect(getPreferredCategory()).toBe('technical');
  });

  test('getRecentTemplates returns empty when no history', () => {
    expect(getRecentTemplates()).toEqual([]);
  });

  test('getRecentTemplates returns recent unique templates', () => {
    recordTemplateUsage('code_review', 'technical');
    recordTemplateUsage('seo_audit', 'marketing');
    recordTemplateUsage('code_review', 'technical'); // duplicate
    const recent = getRecentTemplates(5);
    // Should deduplicate — code_review appears once (most recent)
    const ids = recent.map(t => t.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  test('getRecentTemplates respects limit', () => {
    for (let i = 0; i < 10; i++) {
      recordTemplateUsage(`template_${i}`, 'business');
    }
    const recent = getRecentTemplates(3);
    expect(recent.length).toBeLessThanOrEqual(3);
  });

  test('history capped at 20 entries', () => {
    for (let i = 0; i < 30; i++) {
      recordTemplateUsage(`t_${i}`, 'business');
    }
    const raw = localStorage.getItem('cvf_template_history');
    const history = raw ? JSON.parse(raw) : [];
    expect(history.length).toBeLessThanOrEqual(20);
  });
});
