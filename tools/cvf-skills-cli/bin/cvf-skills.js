#!/usr/bin/env node

/**
 * cvf-skills — CVF Skill Library CLI
 *
 * Commands:
 *   search <query>         Search skills using BM25
 *   plan <task>            Generate a Skill Execution Plan
 *   list                   List domains and skills
 *   init <ai-platform>     Generate AI config file
 *
 * Usage:
 *   cvf-skills search "landing page conversion"
 *   cvf-skills plan "fintech dashboard" --output plan.md
 *   cvf-skills list --domain product_ux
 *   cvf-skills init copilot
 */

import { cmdSearch, cmdPlan, cmdList, cmdInit, SUPPORTED_AI_PLATFORMS } from '../src/commands.js';

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name, short = null) {
  const idx = args.indexOf(`--${name}`);
  const shortIdx = short ? args.indexOf(`-${short}`) : -1;
  const foundIdx = idx >= 0 ? idx : shortIdx;
  if (foundIdx >= 0 && foundIdx + 1 < args.length) {
    return args[foundIdx + 1];
  }
  return null;
}

function hasFlag(name, short = null) {
  return args.includes(`--${name}`) || (short && args.includes(`-${short}`));
}

function showHelp() {
  console.log(`
🔍 cvf-skills — CVF Skill Library CLI

Commands:
  search <query>          Search skills using BM25 ranking
  plan --task <text>      Generate a Skill Execution Plan
  list                    List all domains with skill counts
  init <ai-platform>      Generate AI-specific config file

Search Options:
  --domain, -d <name>     Filter by domain
  --risk, -r <R0-R3>      Filter by risk level
  --phase, -p <name>      Filter by CVF phase
  --difficulty <level>    Filter by difficulty (Easy/Medium/Advanced)
  --top, -n <N>           Max results (default: 10)
  --json, -j              Output as JSON

Plan Options:
  --task, -t <text>       Task description (required)
  --output, -o <file>     Save plan to file
  --format, -f <type>     Output format: md|json|terminal (default: terminal)
  --max, -m <N>           Max skills (default: 15)

List Options:
  --domain, -d <name>     Filter by domain
  --json, -j              Output as JSON

Init Options:
  <ai-platform>           One of: ${SUPPORTED_AI_PLATFORMS.join(', ')}
  --dry-run               Preview without creating file

Examples:
  cvf-skills search "landing page conversion"
  cvf-skills search "security" --domain security_compliance --json
  cvf-skills plan --task "fintech dashboard" --output plan.md
  cvf-skills plan --task "beauty spa app" --format json
  cvf-skills list
  cvf-skills list --domain product_ux
  cvf-skills init copilot
  cvf-skills init cursor --dry-run
`);
}

// ─── Route Commands ──────────────────────────────────────────────────

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

switch (command) {
  case 'search': {
    const query = args[1];
    if (!query || query.startsWith('-')) {
      console.error('\n❌ Usage: cvf-skills search <query>');
      process.exit(1);
    }
    cmdSearch(query, {
      domain: getFlag('domain', 'd'),
      risk: getFlag('risk', 'r'),
      phase: getFlag('phase', 'p'),
      difficulty: getFlag('difficulty'),
      top: parseInt(getFlag('top', 'n') || '10', 10),
      json: hasFlag('json', 'j'),
    });
    break;
  }

  case 'plan': {
    const task = getFlag('task', 't') || args[1];
    if (!task || task.startsWith('-')) {
      console.error('\n❌ Usage: cvf-skills plan --task "task description"');
      process.exit(1);
    }
    cmdPlan(task, {
      output: getFlag('output', 'o'),
      format: getFlag('format', 'f') || 'terminal',
      max: parseInt(getFlag('max', 'm') || '15', 10),
      json: hasFlag('json', 'j'),
    });
    break;
  }

  case 'list': {
    cmdList({
      domain: getFlag('domain', 'd'),
      json: hasFlag('json', 'j'),
    });
    break;
  }

  case 'init': {
    const platform = args[1];
    if (!platform) {
      console.error(`\n❌ Usage: cvf-skills init <ai-platform>`);
      console.error(`   Supported: ${SUPPORTED_AI_PLATFORMS.join(', ')}\n`);
      process.exit(1);
    }
    cmdInit(platform, {
      dryRun: hasFlag('dry-run'),
    });
    break;
  }

  default:
    console.error(`\n❌ Unknown command: "${command}"`);
    console.error('   Run: cvf-skills --help\n');
    process.exit(1);
}
