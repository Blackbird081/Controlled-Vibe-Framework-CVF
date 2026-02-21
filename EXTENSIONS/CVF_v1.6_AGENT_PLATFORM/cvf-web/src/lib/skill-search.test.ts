/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  BM25,
  parseCSV,
  loadSkills,
  searchSkills,
  getDomains,
  getAllSkills,
  isLoaded,
  DOMAIN_NAMES,
} from './skill-search';

// ─── Test data ───────────────────────────────────────────────────────

const SAMPLE_CSV = `skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
product_ux/ui_style_selection,product_ux,UI Style Selection Guide,Medium,R1,"Discovery,Design",style ui selection guide,"Helps pick UI style",product_ux/ui_style_selection.skill.md
product_ux/color_palette_generator,product_ux,Color Palette Generator,Easy,R0,Design,"color palette generator brand","Generates color palettes",product_ux/color_palette_generator.skill.md
web_development/07_landing_page_pattern,web_development,Landing Page Pattern Selection,Easy,R0,"Discovery,Design",landing page pattern conversion,"Select landing page layout",web_development/07_landing_page_pattern.skill.md
security_compliance/security_audit_checklist,security_compliance,Security Audit Checklist,Advanced,R3,"Review,Deploy",security audit checklist owasp,"Security audit for apps",security_compliance/security_audit_checklist.skill.md
web_development/06_chart_data_visualization,web_development,Chart Data Visualization,Medium,R1,Build,"chart data visualization d3","Data viz best practices",web_development/06_chart_data_visualization.skill.md`;

// ─── BM25 Engine Tests ───────────────────────────────────────────────

describe('BM25', () => {
  let engine: BM25;

  beforeEach(() => {
    engine = new BM25(1.5, 0.75);
  });

  it('indexes documents and returns scored results', () => {
    const docs = [
      { skill_name: 'Landing Page', keywords: 'page landing', description: 'Build landing pages', domain: 'web', phases: 'Design' },
      { skill_name: 'Security Audit', keywords: 'audit security', description: 'Audit security', domain: 'security', phases: 'Review' },
    ];
    engine.index(docs);

    const results = engine.search('landing page');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0][0]).toBe(0); // First doc is top result
    expect(results[0][1]).toBeGreaterThan(0); // Score > 0
  });

  it('returns empty for no match', () => {
    const docs = [
      { skill_name: 'Color', keywords: 'color', description: 'Color', domain: 'ux', phases: 'Design' },
    ];
    engine.index(docs);

    const results = engine.search('zzzzxyznonexistent');
    expect(results).toHaveLength(0);
  });

  it('returns empty for empty query', () => {
    engine.index([{ skill_name: 'Test', keywords: 'test', description: 'test', domain: 'test', phases: 'Build' }]);
    expect(engine.search('')).toHaveLength(0);
  });

  it('respects topN limit', () => {
    const docs = Array.from({ length: 20 }, (_, i) => ({
      skill_name: `Skill ${i}`,
      keywords: `keyword${i} common`,
      description: `Description ${i}`,
      domain: 'test',
      phases: 'Build',
    }));
    engine.index(docs);

    const results = engine.search('common', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('handles Vietnamese diacritics in tokens', () => {
    const docs = [
      { skill_name: 'Tối ưu', keywords: 'tối ưu conversion', description: 'Tối ưu hóa', domain: 'seo', phases: 'Optimize' },
    ];
    engine.index(docs);

    const results = engine.search('tối ưu');
    expect(results.length).toBeGreaterThan(0);
  });
});

// ─── CSV Parser Tests ────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses valid CSV into SkillRecord array', () => {
    const records = parseCSV(SAMPLE_CSV);
    expect(records).toHaveLength(5);
    expect(records[0].skill_id).toBe('product_ux/ui_style_selection');
    expect(records[0].domain).toBe('product_ux');
    expect(records[0].skill_name).toBe('UI Style Selection Guide');
  });

  it('handles empty CSV', () => {
    expect(parseCSV('')).toHaveLength(0);
    expect(parseCSV('header_only')).toHaveLength(0);
  });

  it('handles CSV with quoted fields', () => {
    const csv = `skill_id,domain,skill_name,difficulty,risk_level,phases,keywords,description,file_path
test/quoted,test,"Skill With, Comma",Easy,R0,Build,"key1,key2","Description with, commas",test.md`;
    const records = parseCSV(csv);
    expect(records).toHaveLength(1);
    expect(records[0].skill_name).toBe('Skill With, Comma');
  });
});

// ─── High-level API Tests ────────────────────────────────────────────

describe('searchSkills API', () => {
  beforeEach(() => {
    const records = parseCSV(SAMPLE_CSV);
    loadSkills(records);
  });

  it('loads skills and reports isLoaded', () => {
    expect(isLoaded()).toBe(true);
    expect(getAllSkills()).toHaveLength(5);
  });

  it('searches by query', () => {
    const results = searchSkills('landing page');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.skill_id).toBe('web_development/07_landing_page_pattern');
  });

  it('searches with domain filter', () => {
    const results = searchSkills('selection', { domain: 'product_ux' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.skill.domain === 'product_ux')).toBe(true);
  });

  it('searches with risk filter', () => {
    const results = searchSkills('audit', { risk: 'R3' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.skill.risk_level === 'R3')).toBe(true);
  });

  it('returns empty for no match', () => {
    const results = searchSkills('nonexistentxyz123');
    expect(results).toHaveLength(0);
  });

  it('results have correct structure', () => {
    const results = searchSkills('security');
    expect(results.length).toBeGreaterThan(0);
    const r = results[0];
    expect(r).toHaveProperty('rank');
    expect(r).toHaveProperty('score');
    expect(r).toHaveProperty('skill');
    expect(r.skill).toHaveProperty('skill_id');
    expect(r.skill).toHaveProperty('domain');
    expect(r.rank).toBe(1);
  });
});

// ─── getDomains Tests ────────────────────────────────────────────────

describe('getDomains', () => {
  beforeEach(() => {
    loadSkills(parseCSV(SAMPLE_CSV));
  });

  it('returns domain list with counts', () => {
    const domains = getDomains();
    expect(domains.length).toBeGreaterThan(0);

    const webDev = domains.find(d => d.id === 'web_development');
    expect(webDev).toBeDefined();
    expect(webDev!.count).toBe(2);
    expect(webDev!.name).toBe('Web Development');
  });
});

// ─── DOMAIN_NAMES Tests ──────────────────────────────────────────────

describe('DOMAIN_NAMES', () => {
  it('covers all 12 domains', () => {
    expect(Object.keys(DOMAIN_NAMES)).toHaveLength(12);
    expect(DOMAIN_NAMES['product_ux']).toBe('Product & UX');
    expect(DOMAIN_NAMES['web_development']).toBe('Web Development');
  });
});
