/**
 * CLI tests – using Node.js built-in test runner (node --test)
 * Run: node --test src/commands.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, unlinkSync, rmdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_BIN = resolve(__dirname, '..', 'bin', 'cvf-skills.js');

function run(args, opts = {}) {
  try {
    const out = execFileSync('node', [CLI_BIN, ...args], {
      encoding: 'utf-8',
      cwd: opts.cwd || resolve(__dirname, '..'),
      timeout: 15000,
    });
    return { stdout: out, code: 0 };
  } catch (e) {
    return { stdout: e.stdout || '', stderr: e.stderr || '', code: e.status || 1 };
  }
}

// ─── Unit Tests: BM25 ──────────────────────────────────────────────

describe('BM25 Engine', () => {
  let BM25;
  before(async () => {
    const mod = await import('./bm25.js');
    BM25 = mod.BM25;
  });

  it('should index documents and search', () => {
    const engine = new BM25();
    engine.index(
      [
        { name: 'landing page builder', desc: 'create a beautiful landing page' },
        { name: 'api design', desc: 'design REST APIs' },
        { name: 'color palette', desc: 'generate color schemes for UI' },
      ],
      ['name', 'desc'],
    );
    const results = engine.search('landing page');
    assert.ok(results.length > 0, 'should find results');
    assert.equal(results[0][0], 0, 'landing page doc should rank first');
  });

  it('should return empty for unmatched query', () => {
    const engine = new BM25();
    engine.index([{ name: 'testing' }], ['name']);
    const results = engine.search('zzzzzzz');
    assert.equal(results.length, 0);
  });

  it('should respect topN limit', () => {
    const engine = new BM25();
    const docs = Array.from({ length: 20 }, (_, i) => ({ name: `skill ${i} page` }));
    engine.index(docs, ['name']);
    const results = engine.search('page', 5);
    assert.ok(results.length <= 5);
  });
});

// ─── Unit Tests: Data ──────────────────────────────────────────────

describe('Data module', () => {
  let parseCSV, loadSkillsIndex, loadReasoningRules, DOMAIN_NAMES;

  before(async () => {
    const mod = await import('./data.js');
    parseCSV = mod.parseCSV;
    loadSkillsIndex = mod.loadSkillsIndex;
    loadReasoningRules = mod.loadReasoningRules;
    DOMAIN_NAMES = mod.DOMAIN_NAMES;
  });

  it('should parse CSV correctly', () => {
    const csv = 'name,value\nAlice,42\nBob,7\n';
    const rows = parseCSV(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'Alice');
    assert.equal(rows[0].value, '42');
  });

  it('should handle quoted CSV fields', () => {
    const csv = 'name,desc\n"Alice","has a ""pet"""\n';
    const rows = parseCSV(csv);
    assert.equal(rows[0].desc, 'has a "pet"');
  });

  it('should load skills_index.csv', () => {
    const skills = loadSkillsIndex();
    assert.ok(skills.length > 100, `expected >100 skills, got ${skills.length}`);
    assert.ok(skills[0].skill_id, 'first record should have skill_id');
    assert.ok(skills[0].domain, 'first record should have domain');
  });

  it('should load skill_reasoning.csv', () => {
    const rules = loadReasoningRules();
    assert.ok(rules.length >= 40, `expected >=40 rules, got ${rules.length}`);
    assert.ok(rules[0].industry, 'first rule should have industry');
  });

  it('should have 12 domain names', () => {
    assert.equal(Object.keys(DOMAIN_NAMES).length, 12);
  });
});

// ─── Unit Tests: Commands ──────────────────────────────────────────

describe('Commands module', () => {
  let cmdSearch, cmdPlan, cmdList, cmdInit, SUPPORTED_AI_PLATFORMS;

  before(async () => {
    const mod = await import('./commands.js');
    cmdSearch = mod.cmdSearch;
    cmdPlan = mod.cmdPlan;
    cmdList = mod.cmdList;
    cmdInit = mod.cmdInit;
    SUPPORTED_AI_PLATFORMS = mod.SUPPORTED_AI_PLATFORMS;
  });

  it('should support 6 AI platforms', () => {
    assert.equal(SUPPORTED_AI_PLATFORMS.length, 6);
    assert.ok(SUPPORTED_AI_PLATFORMS.includes('copilot'));
    assert.ok(SUPPORTED_AI_PLATFORMS.includes('cursor'));
    assert.ok(SUPPORTED_AI_PLATFORMS.includes('claude'));
  });

  it('cmdPlan should return plan object', () => {
    const plan = cmdPlan('build fintech dashboard', { format: 'json' });
    assert.ok(plan, 'should return a plan');
    assert.ok(plan.phases.length > 0, 'should have phases');
    assert.ok(plan.total_skills > 0, 'should have skills');
    assert.ok(plan.industry, 'should detect industry');
  });

  it('cmdInit should dry-run without creating file', () => {
    const result = cmdInit('copilot', { dryRun: true });
    assert.ok(result.filePath, 'should return file path');
    assert.ok(result.content.includes('CVF'), 'should have CVF in content');
  });
});

// ─── Integration Tests: CLI ────────────────────────────────────────

describe('CLI integration', () => {
  it('should show help with --help', () => {
    const { stdout } = run(['--help']);
    assert.ok(stdout.includes('cvf-skills'), 'help should mention cvf-skills');
    assert.ok(stdout.includes('search'), 'help should mention search');
    assert.ok(stdout.includes('plan'), 'help should mention plan');
    assert.ok(stdout.includes('list'), 'help should mention list');
    assert.ok(stdout.includes('init'), 'help should mention init');
  });

  it('should search for landing page skills', () => {
    const { stdout, code } = run(['search', 'landing page']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('Found'), 'should display results');
    assert.ok(stdout.includes('landing') || stdout.includes('page'), 'should contain relevant skills');
  });

  it('should search with JSON output', () => {
    const { stdout, code } = run(['search', 'security audit', '--json']);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.query, 'security audit');
    assert.ok(data.results.length > 0, 'should have results');
    assert.ok(data.results[0].score > 0, 'should have scores');
  });

  it('should filter search by domain', () => {
    const { stdout, code } = run(['search', 'review', '--domain', 'security_compliance', '--json']);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    for (const r of data.results) {
      assert.ok(r.domain.includes('security'), `domain should be security, got ${r.domain}`);
    }
  });

  it('should plan a fintech task', () => {
    const { stdout, code } = run(['plan', '--task', 'fintech payment dashboard', '--format', 'json']);
    assert.equal(code, 0);
    const plan = JSON.parse(stdout);
    assert.ok(plan.industry, 'should detect industry');
    assert.ok(plan.phases.length > 0, 'should have phases');
    assert.ok(plan.total_skills > 0, 'should have skills');
  });

  it('should plan and save to file', () => {
    const outFile = resolve(__dirname, '..', '_test_plan.md');
    try {
      const { code } = run(['plan', '--task', 'beauty spa app', '--output', outFile]);
      assert.equal(code, 0);
      assert.ok(existsSync(outFile), 'output file should exist');
      const content = readFileSync(outFile, 'utf-8');
      assert.ok(content.includes('Skill Execution Plan'), 'should have plan header');
    } finally {
      if (existsSync(outFile)) unlinkSync(outFile);
    }
  });

  it('should list all domains', () => {
    const { stdout, code } = run(['list']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('Skill Library'));
    assert.ok(stdout.includes('Web Development') || stdout.includes('web_development'));
  });

  it('should list skills in domain', () => {
    const { stdout, code } = run(['list', '--domain', 'web_development']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('web_development'));
  });

  it('should list domains as JSON', () => {
    const { stdout, code } = run(['list', '--json']);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.count > 100);
    assert.ok(data.skills.length > 0);
  });

  it('should init copilot in dry-run mode', () => {
    const { stdout, code } = run(['init', 'copilot', '--dry-run']);
    assert.equal(code, 0);
    assert.ok(stdout.includes('copilot-instructions.md'));
    assert.ok(stdout.includes('CVF'));
  });

  it('should error on unknown command', () => {
    const { code } = run(['unknown-cmd']);
    assert.equal(code, 1);
  });

  it('should error on search without query', () => {
    const { code } = run(['search']);
    assert.equal(code, 1);
  });
});
