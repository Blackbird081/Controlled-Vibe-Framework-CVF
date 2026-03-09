/**
 * Template Recommender — v1.6 Enhancement Track 3.1
 *
 * Suggests the best templates based on user intent (free-text).
 * Uses keyword scoring + category affinity + difficulty matching
 * to rank templates for non-coder users.
 *
 * No external dependencies — pure string matching, no ML required.
 *
 * @module lib/template-recommender
 */

import { Template } from '@/types';
import { templates as allTemplates } from './templates';

// ─── Types ────────────────────────────────────────────────────────────

export interface RecommendationResult {
  template: Template;
  score: number;
  reason: string;
}

export interface RecommenderOptions {
  maxResults?: number;
  preferredCategory?: string;
  preferredDifficulty?: 'easy' | 'medium' | 'advanced';
  lang?: 'vi' | 'en';
}

// ─── Intent Keywords → Category Mapping ───────────────────────────────

interface CategoryKeywords {
  category: string;
  keywords: string[];
  viKeywords: string[];
}

export const CATEGORY_KEYWORDS: CategoryKeywords[] = [
  {
    category: 'business',
    keywords: ['business', 'strategy', 'plan', 'revenue', 'startup', 'competitor', 'market', 'swot', 'growth', 'profit', 'company'],
    viKeywords: ['kinh doanh', 'chiến lược', 'kế hoạch', 'doanh thu', 'khởi nghiệp', 'đối thủ', 'thị trường', 'lợi nhuận', 'công ty'],
  },
  {
    category: 'technical',
    keywords: ['code', 'review', 'architecture', 'system', 'design', 'technical', 'refactor', 'debug', 'performance'],
    viKeywords: ['mã nguồn', 'kiến trúc', 'hệ thống', 'thiết kế', 'kỹ thuật', 'tối ưu'],
  },
  {
    category: 'content',
    keywords: ['content', 'write', 'blog', 'article', 'documentation', 'copy', 'email', 'newsletter', 'report'],
    viKeywords: ['nội dung', 'viết', 'bài viết', 'tài liệu', 'báo cáo', 'email'],
  },
  {
    category: 'research',
    keywords: ['research', 'analyze', 'study', 'data', 'survey', 'insight', 'trend', 'report'],
    viKeywords: ['nghiên cứu', 'phân tích', 'dữ liệu', 'khảo sát', 'xu hướng'],
  },
  {
    category: 'marketing',
    keywords: ['marketing', 'seo', 'campaign', 'ads', 'social', 'brand', 'promotion', 'landing', 'conversion', 'copywriting'],
    viKeywords: ['tiếp thị', 'quảng cáo', 'thương hiệu', 'chiến dịch', 'chuyển đổi'],
  },
  {
    category: 'product',
    keywords: ['product', 'feature', 'roadmap', 'user story', 'sprint', 'backlog', 'prd', 'requirements', 'spec', 'ux', 'ui'],
    viKeywords: ['sản phẩm', 'tính năng', 'lộ trình', 'yêu cầu', 'đặc tả'],
  },
  {
    category: 'security',
    keywords: ['security', 'vulnerability', 'audit', 'penetration', 'threat', 'compliance', 'risk', 'gdpr', 'privacy'],
    viKeywords: ['bảo mật', 'lỗ hổng', 'kiểm toán', 'tuân thủ', 'rủi ro', 'quyền riêng tư'],
  },
  {
    category: 'development',
    keywords: ['app', 'build', 'develop', 'create', 'web', 'mobile', 'api', 'database', 'deploy', 'stack', 'framework', 'cli', 'desktop'],
    viKeywords: ['ứng dụng', 'xây dựng', 'phát triển', 'tạo', 'web', 'di động', 'triển khai', 'cơ sở dữ liệu'],
  },
];

// ─── Scoring Engine ───────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function computeCategoryScore(intentTokens: string[], lang: 'vi' | 'en'): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const ck of CATEGORY_KEYWORDS) {
    let count = 0;
    const keywords = lang === 'vi'
      ? [...ck.keywords, ...ck.viKeywords]
      : ck.keywords;

    for (const token of intentTokens) {
      for (const kw of keywords) {
        if (kw.includes(token) || token.includes(kw)) {
          count++;
        }
      }
    }
    scores[ck.category] = count;
  }

  return scores;
}

function computeTemplateScore(
  template: Template,
  intentTokens: string[],
  intentRaw: string,
  categoryScores: Record<string, number>,
  options: RecommenderOptions,
): number {
  let score = 0;

  // 1. Category affinity (0-30 points)
  const catScore = categoryScores[template.category] || 0;
  score += Math.min(catScore * 10, 30);

  // 2. Name match (0-25 points)
  const nameTokens = tokenize(template.name);
  for (const nt of nameTokens) {
    if (intentTokens.some(it => it.includes(nt) || nt.includes(it))) {
      score += 5;
    }
  }
  score = Math.min(score, 55); // cap name + category at 55

  // 3. Description match (0-15 points)
  const descTokens = tokenize(template.description);
  let descHits = 0;
  for (const dt of descTokens) {
    if (intentTokens.some(it => it.includes(dt) || dt.includes(it))) {
      descHits++;
    }
  }
  score += Math.min(descHits * 3, 15);

  // 4. intentPattern match (0-15 points)
  const patternTokens = tokenize(template.intentPattern);
  let patternHits = 0;
  for (const pt of patternTokens) {
    if (intentTokens.some(it => it.includes(pt) || pt.includes(it))) {
      patternHits++;
    }
  }
  score += Math.min(patternHits * 3, 15);

  // 5. Preferred category bonus (+10)
  if (options.preferredCategory && template.category === options.preferredCategory) {
    score += 10;
  }

  // 6. Difficulty preference bonus (+5)
  if (options.preferredDifficulty && template.difficulty === options.preferredDifficulty) {
    score += 5;
  }

  // 7. Easy templates get slight boost for non-coders (+3)
  if (template.difficulty === 'easy') {
    score += 3;
  }

  // 8. Exact substring match in intent → template name (bonus +10)
  const intentLower = intentRaw.toLowerCase();
  const nameLower = template.name.toLowerCase();
  if (intentLower.includes(nameLower) || nameLower.includes(intentLower)) {
    score += 10;
  }

  // 9. Skip folder templates (they are containers, not actionable)
  if (template.isFolder) {
    score = Math.max(score - 20, 0);
  }

  return score;
}

function generateReason(
  template: Template,
  score: number,
  categoryScores: Record<string, number>,
  lang: 'vi' | 'en',
): string {
  const catScore = categoryScores[template.category] || 0;

  if (score >= 60) {
    return lang === 'vi'
      ? `Rất phù hợp với yêu cầu của bạn`
      : `Great match for your request`;
  }
  if (score >= 40) {
    return lang === 'vi'
      ? `Phù hợp với yêu cầu của bạn`
      : `Good match for your request`;
  }
  if (catScore > 0) {
    return lang === 'vi'
      ? `Liên quan đến lĩnh vực bạn quan tâm`
      : `Related to your area of interest`;
  }
  return lang === 'vi'
    ? `Có thể hữu ích cho bạn`
    : `Might be useful for you`;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Recommend templates based on free-text user intent.
 * Returns sorted results by relevance score (descending).
 */
export function recommendTemplates(
  intent: string,
  options: RecommenderOptions = {},
): RecommendationResult[] {
  const {
    maxResults = 5,
    lang = 'en',
  } = options;

  if (!intent || !intent.trim()) {
    return [];
  }

  const intentTokens = tokenize(intent);
  if (intentTokens.length === 0) {
    return [];
  }

  const categoryScores = computeCategoryScore(intentTokens, lang);

  const scored = allTemplates
    .filter(t => !t.parentFolder) // skip child-only templates at top level
    .map(template => ({
      template,
      score: computeTemplateScore(template, intentTokens, intent, categoryScores, options),
      reason: '',
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Add reasons after sorting
  return scored.map(r => ({
    ...r,
    reason: generateReason(r.template, r.score, categoryScores, lang),
  }));
}

/**
 * Quick check: does the user intent clearly map to a single template?
 * Returns null if ambiguous (user should see the full recommendation list).
 */
export function getExactMatch(intent: string): Template | null {
  if (!intent || !intent.trim()) return null;

  const intentLower = intent.toLowerCase().trim();

  // Try exact name match first
  const exact = allTemplates.find(
    t => t.name.toLowerCase() === intentLower && !t.isFolder,
  );
  if (exact) return exact;

  // Try ID match
  const byId = allTemplates.find(
    t => t.id === intentLower && !t.isFolder,
  );
  if (byId) return byId;

  return null;
}

// ─── Smart Defaults from History (Track 3.2) ─────────────────────────

const HISTORY_KEY = 'cvf_template_history';
const MAX_HISTORY = 20;

export interface TemplateHistoryEntry {
  templateId: string;
  category: string;
  timestamp: number;
}

/**
 * Record a template usage in localStorage history.
 */
export function recordTemplateUsage(templateId: string, category: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: TemplateHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift({ templateId, category, timestamp: Date.now() });
    // Keep only recent entries
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // Silent fail
  }
}

/**
 * Get the user's most-used template category from history.
 */
export function getPreferredCategory(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return undefined;
    const history: TemplateHistoryEntry[] = JSON.parse(raw);
    if (history.length === 0) return undefined;

    // Count category frequency
    const counts: Record<string, number> = {};
    for (const entry of history) {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    }

    // Return most frequent
    let maxCat = '';
    let maxCount = 0;
    for (const [cat, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCat = cat;
        maxCount = count;
      }
    }
    return maxCat || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get recently used templates (for "Recent" section in UI).
 */
export function getRecentTemplates(limit = 5): Template[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const history: TemplateHistoryEntry[] = JSON.parse(raw);

    // Deduplicate by templateId, keep most recent
    const seen = new Set<string>();
    const recent: Template[] = [];
    for (const entry of history) {
      if (seen.has(entry.templateId)) continue;
      seen.add(entry.templateId);
      const t = allTemplates.find(t => t.id === entry.templateId);
      if (t) recent.push(t);
      if (recent.length >= limit) break;
    }
    return recent;
  } catch {
    return [];
  }
}
