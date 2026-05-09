/**
 * BM25 Skill Search Engine — TypeScript port of tools/skill-search/bm25.py
 *
 * Pure client-side search over CVF Skill Library.
 * No external dependencies — runs in browser.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface SkillRecord {
  skill_id: string;
  domain: string;
  skill_name: string;
  difficulty: string;
  risk_level: string;
  phases: string;
  keywords: string;
  description: string;
  file_path: string;
}

export interface SearchResult {
  rank: number;
  score: number;
  skill: SkillRecord;
}

export interface SearchOptions {
  topN?: number;
  domain?: string;
  risk?: string;
  phase?: string;
  difficulty?: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const FIELD_WEIGHTS: Record<string, number> = {
  skill_name: 3.0,
  keywords: 2.5,
  description: 2.0,
  domain: 1.5,
  phases: 1.0,
};

const INDEXED_FIELDS = Object.keys(FIELD_WEIGHTS);

export const DOMAIN_NAMES: Record<string, string> = {
  ai_ml_evaluation: 'AI/ML Evaluation',
  app_development: 'App Development',
  business_analysis: 'Business Analysis',
  content_creation: 'Content Creation',
  finance_analytics: 'Finance & Analytics',
  hr_operations: 'HR & Operations',
  legal_contracts: 'Legal & Contracts',
  marketing_seo: 'Marketing & SEO',
  product_ux: 'Product & UX',
  security_compliance: 'Security & Compliance',
  technical_review: 'Technical Review',
  web_development: 'Web Development',
};

const STOPWORDS = new Set([
  // Vietnamese
  'và', 'cho', 'của', 'các', 'với', 'được', 'để', 'trong', 'theo',
  'khi', 'không', 'là', 'có', 'này', 'từ', 'một', 'những', 'hoặc',
  'nếu', 'đã', 'sẽ', 'tới', 'nào', 'về', 'như', 'cần', 'thể',
  // English
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on',
  'at', 'by', 'with', 'from', 'as', 'is', 'are', 'was', 'were',
  'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could',
  'not', 'no', 'but', 'if', 'then', 'than', 'that', 'this',
  'it', 'its', 'my', 'your', 'our', 'their', 'we', 'you', 'they',
]);

// Vietnamese → English mapping for normalization
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

// ─── Tokenizer ───────────────────────────────────────────────────────

const TOKEN_RE = /[a-zA-ZÀ-ỹ0-9]+/g;

function tokenize(text: string): string[] {
  if (!text) return [];
  const matches = text.toLowerCase().match(TOKEN_RE);
  if (!matches) return [];
  return matches.filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function normalize(text: string): string {
  let t = text.toLowerCase().replace(/-/g, '').replace(/_/g, ' ');
  for (const [vi, en] of Object.entries(VI_MAP)) {
    if (t.includes(vi)) {
      t += ' ' + en;
    }
  }
  return t;
}

// ─── BM25 Engine ─────────────────────────────────────────────────────

interface TokenizedDoc {
  [field: string]: string[];
}

export class BM25 {
  private k1: number;
  private b: number;
  private corpus: TokenizedDoc[] = [];
  private docCount = 0;
  private avgLengths: Record<string, number> = {};
  private idfCache: Record<string, number> = {};

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  index(documents: Record<string, string>[]): void {
    this.corpus = [];

    for (const doc of documents) {
      const tokenized: TokenizedDoc = {};
      for (const field of INDEXED_FIELDS) {
        tokenized[field] = tokenize(doc[field] ?? '');
      }
      this.corpus.push(tokenized);
    }

    this.docCount = this.corpus.length;

    // Average field lengths
    for (const field of INDEXED_FIELDS) {
      const lengths = this.corpus.map(d => (d[field] ?? []).length);
      this.avgLengths[field] = lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1);
    }

    // Pre-compute IDF
    this.computeIdf();
  }

  search(query: string, topN = 10): Array<[number, number]> {
    const queryTokens = tokenize(normalize(query));
    if (queryTokens.length === 0) return [];

    const scores: Array<[number, number]> = [];

    for (let i = 0; i < this.corpus.length; i++) {
      const doc = this.corpus[i];
      let score = 0;

      for (const field of INDEXED_FIELDS) {
        const tokens = doc[field] ?? [];
        const weight = FIELD_WEIGHTS[field] ?? 1.0;
        score += this.scoreField(queryTokens, tokens, field) * weight;
      }

      if (score > 0) {
        scores.push([i, score]);
      }
    }

    scores.sort((a, b) => b[1] - a[1]);
    return scores.slice(0, topN);
  }

  private computeIdf(): void {
    const termDocCount: Record<string, number> = {};

    for (const doc of this.corpus) {
      const docTerms = new Set<string>();
      for (const field of INDEXED_FIELDS) {
        for (const token of (doc[field] ?? [])) {
          docTerms.add(token);
        }
      }
      for (const term of docTerms) {
        termDocCount[term] = (termDocCount[term] ?? 0) + 1;
      }
    }

    for (const [term, df] of Object.entries(termDocCount)) {
      this.idfCache[term] = Math.log(
        (this.docCount - df + 0.5) / (df + 0.5) + 1.0
      );
    }
  }

  private scoreField(queryTokens: string[], fieldTokens: string[], field: string): number {
    if (fieldTokens.length === 0) return 0;

    const docLen = fieldTokens.length;
    const avgLen = this.avgLengths[field] ?? 1;

    // Term frequency map
    const tfMap: Record<string, number> = {};
    for (const token of fieldTokens) {
      tfMap[token] = (tfMap[token] ?? 0) + 1;
    }

    let score = 0;
    for (const qt of queryTokens) {
      const idf = this.idfCache[qt];
      if (idf === undefined) continue;

      const tf = tfMap[qt] ?? 0;
      if (tf === 0) continue;

      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * docLen / Math.max(avgLen, 1));
      score += idf * numerator / denominator;
    }

    return score;
  }
}

// ─── CSV Parser ──────────────────────────────────────────────────────

export function parseCSV(csvText: string): SkillRecord[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records: SkillRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV fields
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

    if (row['skill_id']) {
      records.push(row as unknown as SkillRecord);
    }
  }

  return records;
}

// ─── High-level API ──────────────────────────────────────────────────

let _engine: BM25 | null = null;
let _skills: SkillRecord[] = [];

export function loadSkills(skills: SkillRecord[]): void {
  _skills = skills;
  _engine = new BM25(1.5, 0.75);
  _engine.index(skills as unknown as Record<string, string>[]);
}

function filterSkills(
  skills: SkillRecord[],
  opts: SearchOptions,
): SkillRecord[] {
  let result = skills;

  if (opts.domain) {
    const d = opts.domain.toLowerCase().replace(/ /g, '_');
    result = result.filter(s => s.domain.toLowerCase().includes(d));
  }
  if (opts.risk) {
    const r = opts.risk.toUpperCase();
    result = result.filter(s => s.risk_level.toUpperCase() === r);
  }
  if (opts.phase) {
    const p = opts.phase.toLowerCase();
    result = result.filter(s => s.phases.toLowerCase().includes(p));
  }
  if (opts.difficulty) {
    const d = opts.difficulty.toLowerCase();
    result = result.filter(s => s.difficulty.toLowerCase() === d);
  }

  return result;
}

export function searchSkills(
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  if (!_engine || _skills.length === 0) return [];

  const { topN = 10, ...filters } = options;

  // If filters are set, create a filtered engine
  const hasFilters = filters.domain || filters.risk || filters.phase || filters.difficulty;

  if (hasFilters) {
    const filtered = filterSkills(_skills, filters);
    if (filtered.length === 0) return [];

    const tempEngine = new BM25(1.5, 0.75);
    tempEngine.index(filtered as unknown as Record<string, string>[]);
    const hits = tempEngine.search(query, topN);

    return hits.map(([idx, score], rank) => ({
      rank: rank + 1,
      score: Math.round(score * 100) / 100,
      skill: filtered[idx],
    }));
  }

  const hits = _engine.search(query, topN);

  return hits.map(([idx, score], rank) => ({
    rank: rank + 1,
    score: Math.round(score * 100) / 100,
    skill: _skills[idx],
  }));
}

export function getAllSkills(): SkillRecord[] {
  return _skills;
}

export function getDomains(): Array<{ id: string; name: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const s of _skills) {
    counts[s.domain] = (counts[s.domain] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, name: DOMAIN_NAMES[id] ?? id, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isLoaded(): boolean {
  return _skills.length > 0;
}
