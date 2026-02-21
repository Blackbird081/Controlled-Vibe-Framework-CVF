/**
 * CVF Skill Library CLI commands — search, plan, list, init.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname as pathDirname } from 'node:path';
import { BM25 } from './bm25.js';
import {
  loadSkillsIndex,
  loadReasoningRules,
  DOMAIN_NAMES,
  FIELD_WEIGHTS,
} from './data.js';

// Vietnamese normalization
const VI_MAP = {
  'thời trang': 'fashion', 'thương mại điện tử': 'ecommerce',
  'sức khỏe': 'healthcare', 'y tế': 'healthcare', 'giáo dục': 'education',
  'du lịch': 'travel', 'nhà hàng': 'restaurant', 'bất động sản': 'realestate',
  'làm đẹp': 'beauty', 'trò chơi': 'gaming', 'tin tức': 'media news',
  'tài chính': 'fintech', 'ngân hàng': 'banking',
};

function normalize(text) {
  let t = text.toLowerCase().replace(/-/g, '').replace(/_/g, ' ');
  for (const [vi, en] of Object.entries(VI_MAP)) {
    if (t.includes(vi)) t += ' ' + en;
  }
  return t;
}

const PHASE_ORDER = { discovery: 0, design: 1, build: 2, review: 3, deploy: 4, optimize: 5 };
const EFFORT_MAP = { Easy: 0.5, Medium: 1.0, Advanced: 2.0 };

const DIFFICULTY_ICONS = { Easy: '⭐', Medium: '⭐⭐', Advanced: '⭐⭐⭐' };

// ─── Search Command ──────────────────────────────────────────────────

export function cmdSearch(query, options = {}) {
  const skills = loadSkillsIndex();
  const { domain, risk, phase, difficulty, top = 10, json: jsonOutput } = options;

  // Filter
  let filtered = skills;
  if (domain) {
    const d = domain.toLowerCase().replace(/ /g, '_');
    filtered = filtered.filter(s => s.domain.toLowerCase().includes(d));
  }
  if (risk) {
    const r = risk.toUpperCase();
    filtered = filtered.filter(s => s.risk_level.toUpperCase() === r);
  }
  if (phase) {
    const p = phase.toLowerCase();
    filtered = filtered.filter(s => s.phases.toLowerCase().includes(p));
  }
  if (difficulty) {
    const d = difficulty.toLowerCase();
    filtered = filtered.filter(s => s.difficulty.toLowerCase() === d);
  }

  if (filtered.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ query, count: 0, results: [] }, null, 2));
    } else {
      console.log(`\n🔍 No skills match filters.`);
    }
    return;
  }

  // Build engine
  const engine = new BM25(1.5, 0.75);
  const fields = Object.keys(FIELD_WEIGHTS);
  engine.index(filtered, fields, FIELD_WEIGHTS);

  const start = performance.now();
  const hits = engine.search(normalize(query), top);
  const elapsed = (performance.now() - start).toFixed(1);

  const results = hits.map(([idx, score], rank) => ({
    rank: rank + 1,
    score: Math.round(score * 100) / 100,
    ...filtered[idx],
    domain_display: DOMAIN_NAMES[filtered[idx].domain] || filtered[idx].domain,
  }));

  if (jsonOutput) {
    console.log(JSON.stringify({ query, elapsed_ms: parseFloat(elapsed), count: results.length, results }, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`\n🔍 No results for "${query}"`);
    return;
  }

  console.log(`\n🔍 Found ${results.length} skills for "${query}" (${elapsed}ms):\n`);
  for (const r of results) {
    const diff = DIFFICULTY_ICONS[r.difficulty] || '';
    console.log(`  ${r.rank}. [${r.score.toFixed(1)}] ${r.skill_id}`);
    console.log(`     "${r.skill_name}"`);
    console.log(`     ${r.domain_display} | ${r.risk_level} | ${diff} ${r.difficulty} | ${r.phases}`);
    if (r.description) {
      const desc = r.description.length > 100 ? r.description.slice(0, 100) + '...' : r.description;
      console.log(`     → ${desc}`);
    }
    console.log();
  }
}

// ─── Plan Command ────────────────────────────────────────────────────

export function cmdPlan(task, options = {}) {
  const skills = loadSkillsIndex();
  const rules = loadReasoningRules();
  const skillIndex = new Map(skills.map(s => [s.skill_id, s]));
  const { output, format = 'terminal', max = 15, json: jsonOutput } = options;

  const effectiveFormat = jsonOutput ? 'json' : format;

  // Detect industry
  const taskNorm = normalize(task);
  let bestRule = null;
  let bestScore = 0;
  let bestIndustry = 'Generic';

  for (const rule of rules) {
    const parts = rule.task_pattern.split('|').map(p => p.trim());
    let score = 0;

    for (const p of parts) {
      if (taskNorm.includes(p.toLowerCase())) score += 10;
    }
    if (taskNorm.includes(rule.industry.toLowerCase())) score += 5;
    for (const w of rule.industry.toLowerCase().split(/\s+/)) {
      if (w.length >= 3 && taskNorm.includes(w)) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
      bestIndustry = rule.industry;
    }
  }

  if (!bestRule) {
    bestRule = rules.find(r => r.industry === 'Generic' && r.task_pattern.includes('new project'));
    if (!bestRule) {
      console.error(`\n❌ Could not match task: "${task}"`);
      process.exit(1);
    }
  }

  // Build plan
  const chainIds = bestRule.skill_chain.split('|').slice(0, max);
  const phases = {};
  let step = 0;
  let totalEffort = 0;

  for (const sid of chainIds) {
    const info = skillIndex.get(sid);
    if (!info) continue;

    const phs = info.phases.split(',').map(p => p.trim().toLowerCase());
    const earliest = phs.reduce((min, p) =>
      (PHASE_ORDER[p] ?? 99) < (PHASE_ORDER[min] ?? 99) ? p : min
    );
    const phase = earliest.charAt(0).toUpperCase() + earliest.slice(1);

    if (!phases[phase]) phases[phase] = [];
    step++;
    const difficulty = info.difficulty || 'Medium';
    const effort = EFFORT_MAP[difficulty] || 1.0;
    totalEffort += effort;

    phases[phase].push({
      step, skill_id: sid,
      skill_name: info.skill_name || sid,
      risk_level: info.risk_level || 'R1',
      difficulty, description: info.description || '',
      file_path: info.file_path || '', effort_hours: effort,
    });
  }

  const sortedPhases = Object.entries(phases)
    .sort(([a], [b]) => (PHASE_ORDER[a.toLowerCase()] ?? 99) - (PHASE_ORDER[b.toLowerCase()] ?? 99))
    .map(([phase, skills]) => ({ phase, skills }));

  const effortDays = Math.max(1, Math.round(totalEffort / 6));
  const plan = {
    task, industry: bestIndustry,
    generated: new Date().toISOString().split('T')[0],
    total_skills: step,
    estimated_effort: `${effortDays}-${effortDays + 1} days`,
    total_hours: Math.round(totalEffort * 10) / 10,
    rationale: bestRule.rationale,
    phases: sortedPhases,
  };

  // Format output
  if (effectiveFormat === 'json') {
    const jsonStr = JSON.stringify(plan, null, 2);
    if (output) {
      mkdirSync(pathDirname(output), { recursive: true });
      writeFileSync(output, jsonStr, 'utf-8');
      console.log(`✅ Plan saved to: ${output}`);
    } else {
      console.log(jsonStr);
    }
    return plan;
  }

  if (effectiveFormat === 'md') {
    const md = generateMarkdown(plan);
    if (output) {
      mkdirSync(pathDirname(output), { recursive: true });
      writeFileSync(output, md, 'utf-8');
      console.log(`✅ Plan saved to: ${output}`);
    } else {
      console.log(md);
    }
    return plan;
  }

  // Terminal
  console.log(`\n📋 SKILL EXECUTION PLAN`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Task:     ${plan.task}`);
  console.log(`  Industry: ${plan.industry}`);
  console.log(`  Skills:   ${plan.total_skills}`);
  console.log(`  Effort:   ${plan.estimated_effort} (~${plan.total_hours}h)`);
  console.log();

  for (const p of plan.phases) {
    console.log(`  ── Phase: ${p.phase} (${p.skills.length} skills) ──`);
    for (const s of p.skills) {
      console.log(`    ${s.step}. ${s.skill_name} (${s.risk_level}, ${s.difficulty})`);
      if (s.description) console.log(`       → ${s.description.slice(0, 70)}`);
    }
    console.log();
  }
  console.log(`  💡 ${plan.rationale}\n`);

  if (output) {
    const md = generateMarkdown(plan);
    mkdirSync(pathDirname(output), { recursive: true });
    writeFileSync(output, md, 'utf-8');
    console.log(`  📄 Also saved to: ${output}`);
  }

  return plan;
}

function generateMarkdown(plan) {
  const lines = [];
  lines.push('# Skill Execution Plan', '',
    `> **Task:** ${plan.task}`,
    `> **Industry:** ${plan.industry}`,
    `> **Generated:** ${plan.generated}`,
    `> **Total Skills:** ${plan.total_skills}`,
    `> **Estimated Effort:** ${plan.estimated_effort} (~${plan.total_hours}h)`,
    '', '---', '');

  for (const p of plan.phases) {
    lines.push(`## Phase: ${p.phase} (${p.skills.length} skills)`, '');
    for (const s of p.skills) {
      lines.push(`### ${s.step}. ${s.skill_name}`, '',
        `- **File:** \`${s.file_path}\``,
        `- **Risk:** ${s.risk_level} | **Difficulty:** ${s.difficulty} | **~${s.effort_hours}h**`);
      if (s.description) lines.push(`- **Purpose:** ${s.description.slice(0, 150)}`);
      lines.push('');
    }
    lines.push('---', '');
  }

  lines.push('## Rationale', '', `> ${plan.rationale}`, '',
    '---', '', `*Generated by CVF Skill Planner | ${plan.generated}*`);
  return lines.join('\n');
}

// ─── List Command ────────────────────────────────────────────────────

export function cmdList(options = {}) {
  const skills = loadSkillsIndex();
  const { domain, json: jsonOutput } = options;

  let filtered = skills;
  if (domain) {
    const d = domain.toLowerCase().replace(/ /g, '_');
    filtered = filtered.filter(s => s.domain.toLowerCase().includes(d));
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ count: filtered.length, skills: filtered }, null, 2));
    return;
  }

  if (domain) {
    console.log(`\n📋 Skills in domain "${domain}" (${filtered.length}):\n`);
    for (const s of filtered) {
      console.log(`  • ${s.skill_id} — ${s.skill_name} (${s.risk_level}, ${s.difficulty})`);
    }
    console.log();
    return;
  }

  // List all domains
  const domainCounts = {};
  for (const s of skills) {
    domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
  }

  console.log('\n📂 CVF Skill Library Domains:\n');
  for (const d of Object.keys(domainCounts).sort()) {
    const name = DOMAIN_NAMES[d] || d;
    console.log(`  ${name.padEnd(25)} (${d}) — ${domainCounts[d]} skills`);
  }
  console.log(`\n  Total: ${skills.length} skills\n`);
}

// ─── Init Command ────────────────────────────────────────────────────

const AI_TEMPLATES = {
  copilot: {
    file: '.github/copilot-instructions.md',
    content: (skills) => `# CVF Skill Library Instructions

## Available Skills (${skills.length} total)

When building UI components, use CVF Skill Library for guidance:

### Domains
${Object.entries(DOMAIN_NAMES).map(([id, name]) => `- **${name}** (${id})`).join('\n')}

### How to Use Skills
1. Identify the task domain (e.g., web_development, product_ux)
2. Search for relevant skills by keyword
3. Follow the skill's step-by-step instructions
4. Apply CVF governance (Risk Level, Authority, Audit)

### Key Skills for Common Tasks
- Landing page: \`web_development/07_landing_page_pattern\`
- Color scheme: \`product_ux/color_palette_generator\`
- Typography: \`product_ux/typography_pairing\`
- Security audit: \`security_compliance/security_audit_checklist\`
- Data visualization: \`web_development/06_chart_data_visualization\`

### CVF Risk Levels
- **R0**: No review needed
- **R1**: Self-review
- **R2**: Peer review required
- **R3**: Expert review required
`,
  },
  cursor: {
    file: '.cursorrules',
    content: (skills) => `# CVF Skill Library Rules

You have access to ${skills.length} CVF skills across ${Object.keys(DOMAIN_NAMES).length} domains.

## Skill Domains
${Object.entries(DOMAIN_NAMES).map(([id, name]) => `- ${name} (${id})`).join('\n')}

## Instructions
- When building UI, check CVF skills for best practices
- Follow CVF governance: R0 (safe), R1 (self-review), R2 (peer), R3 (expert)
- Group work by CVF phases: Discovery → Design → Build → Review → Deploy
- Use skill chains for complex tasks (combine multiple skills)

## Quick Reference
- Search skills: cvf-skills search "your query"
- Plan task: cvf-skills plan "task description"
- List domains: cvf-skills list
`,
  },
  claude: {
    file: 'CLAUDE.md',
    content: (skills) => `# CVF Skill Library Context

This project uses the CVF (Controlled Vibe Framework) Skill Library with ${skills.length} skills.

## Available Domains
${Object.entries(DOMAIN_NAMES).map(([id, name]) => `- **${name}**: ${id}`).join('\n')}

## CVF Governance
- **R0**: Autonomous — no review needed
- **R1**: Self-review — check before proceeding
- **R2**: Peer review — needs second opinion
- **R3**: Expert review — specialist required

## Phase Flow
Discovery → Design → Build → Review → Deploy → Optimize

## CLI
\`\`\`bash
cvf-skills search "landing page"
cvf-skills plan "fintech dashboard"
cvf-skills list --domain product_ux
\`\`\`
`,
  },
  chatgpt: {
    file: '.chatgpt-instructions.md',
    content: (skills) => `# CVF Skill Library

${skills.length} skills across ${Object.keys(DOMAIN_NAMES).length} domains for UI/UX development guidance.

## Domains
${Object.entries(DOMAIN_NAMES).map(([id, name]) => `- ${name}`).join('\n')}

## Usage
Use CVF skills to guide UI development decisions. Follow risk levels (R0-R3) and phase ordering.
`,
  },
  gemini: {
    file: '.gemini-instructions.md',
    content: (skills) => `# CVF Skill Library

${skills.length} CVF skills available. Follow governance framework (R0-R3 risk levels).

Domains: ${Object.values(DOMAIN_NAMES).join(', ')}

CLI: cvf-skills search "query" | cvf-skills plan "task"
`,
  },
  windsurf: {
    file: '.windsurfrules',
    content: (skills) => `# CVF Skill Library Rules

${skills.length} skills across ${Object.keys(DOMAIN_NAMES).length} domains.

${Object.entries(DOMAIN_NAMES).map(([id, name]) => `- ${name} (${id})`).join('\n')}

Follow CVF governance: R0/R1/R2/R3 risk levels.
Phases: Discovery → Design → Build → Review → Deploy → Optimize
`,
  },
};

export function cmdInit(aiPlatform, options = {}) {
  const skills = loadSkillsIndex();
  const template = AI_TEMPLATES[aiPlatform.toLowerCase()];

  if (!template) {
    console.log(`\n❌ Unknown AI platform: "${aiPlatform}"`);
    console.log(`   Supported: ${Object.keys(AI_TEMPLATES).join(', ')}\n`);
    process.exit(1);
  }

  const content = template.content(skills);
  const filePath = template.file;

  if (options.dryRun) {
    console.log(`\n📝 Would create: ${filePath}\n`);
    console.log(content);
    return { filePath, content };
  }

  const dir = pathDirname(filePath);
  if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  console.log(`\n✅ Created ${filePath} for ${aiPlatform}`);
  console.log(`   ${skills.length} skills configured\n`);

  return { filePath, content };
}

// ─── Exports ─────────────────────────────────────────────────────────

export { generateMarkdown };
export const SUPPORTED_AI_PLATFORMS = Object.keys(AI_TEMPLATES);
