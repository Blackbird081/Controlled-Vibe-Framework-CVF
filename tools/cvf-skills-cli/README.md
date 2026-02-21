# cvf-skills

> CVF Skill Library CLI — Search, Plan, and Apply 141 skills across 12 domains.

**Zero dependencies. Pure Node.js. Works offline.**

## Install

```bash
# Global install
npm install -g cvf-skills

# Or use directly with npx
npx cvf-skills search "landing page"

# Or link locally during development
cd tools/cvf-skills-cli
npm link
```

## Quick Start

```bash
# Search for skills
cvf-skills search "landing page conversion"

# Generate a Skill Execution Plan
cvf-skills plan --task "fintech payment dashboard"

# List all domains
cvf-skills list

# Generate AI config file
cvf-skills init copilot
```

## Commands

### `search <query>`

Search the skill library using BM25 ranking with field-weighted scoring.

```bash
cvf-skills search "security audit"
cvf-skills search "color palette" --domain product_ux
cvf-skills search "api design" --risk R2 --json
cvf-skills search "responsive layout" --difficulty Advanced --top 5
```

**Options:**

| Flag | Short | Description |
|------|-------|-------------|
| `--domain` | `-d` | Filter by domain (e.g., `web_development`) |
| `--risk` | `-r` | Filter by risk level (`R0`, `R1`, `R2`, `R3`) |
| `--phase` | `-p` | Filter by CVF phase (e.g., `build`, `design`) |
| `--difficulty` | | Filter by difficulty (`Easy`, `Medium`, `Advanced`) |
| `--top` | `-n` | Max results (default: 10) |
| `--json` | `-j` | Output as JSON |

### `plan --task <text>`

Generate a Skill Execution Plan with industry-aware reasoning.

```bash
cvf-skills plan --task "build a beauty spa booking app"
cvf-skills plan --task "fintech dashboard" --output plan.md
cvf-skills plan --task "ecommerce product catalog" --format json
cvf-skills plan --task "healthcare patient portal" --max 8
```

**Options:**

| Flag | Short | Description |
|------|-------|-------------|
| `--task` | `-t` | Task description (required) |
| `--output` | `-o` | Save plan to file |
| `--format` | `-f` | Output format: `terminal` (default), `md`, `json` |
| `--max` | `-m` | Max skills in plan (default: 15) |
| `--json` | `-j` | Shortcut for `--format json` |

**Supported Industries (auto-detected):**
Fintech, Healthcare, Ecommerce, SaaS, Education, Beauty, Food, RealEstate, Gaming, Travel, Media, Generic

**Vietnamese Input:**
```bash
cvf-skills plan --task "xây dựng ứng dụng thương mại điện tử"
cvf-skills plan --task "dashboard tài chính ngân hàng"
```

### `list`

List all domains with skill counts, or skills in a specific domain.

```bash
cvf-skills list
cvf-skills list --domain web_development
cvf-skills list --json
```

### `init <ai-platform>`

Generate AI-specific configuration file for your project.

```bash
cvf-skills init copilot          # → .github/copilot-instructions.md
cvf-skills init cursor           # → .cursorrules
cvf-skills init claude           # → CLAUDE.md
cvf-skills init chatgpt          # → .chatgpt-instructions.md
cvf-skills init gemini           # → .gemini-instructions.md
cvf-skills init windsurf         # → .windsurfrules
cvf-skills init copilot --dry-run  # Preview without creating
```

## Domains (12)

| Domain | Name | Skills |
|--------|------|--------|
| `ai_ml_evaluation` | AI/ML Evaluation | 10+ |
| `app_development` | App Development | 15+ |
| `business_analysis` | Business Analysis | 10+ |
| `content_creation` | Content Creation | 10+ |
| `finance_analytics` | Finance & Analytics | 10+ |
| `hr_operations` | HR & Operations | 10+ |
| `legal_contracts` | Legal & Contracts | 10+ |
| `marketing_seo` | Marketing & SEO | 10+ |
| `product_ux` | Product & UX | 15+ |
| `security_compliance` | Security & Compliance | 10+ |
| `technical_review` | Technical Review | 10+ |
| `web_development` | Web Development | 15+ |

## Programmatic Usage

```javascript
import { cmdSearch, cmdPlan, BM25, loadSkillsIndex } from 'cvf-skills';

// Load all skills
const skills = loadSkillsIndex();

// Use BM25 engine directly
const engine = new BM25(1.5, 0.75);
engine.index(skills, ['skill_name', 'keywords', 'description'], {
  skill_name: 3.0,
  keywords: 2.5,
  description: 2.0,
});
const results = engine.search('landing page', 5);
```

## Architecture

```
cvf-skills-cli/
├── bin/
│   └── cvf-skills.js     # CLI entry point
├── src/
│   ├── index.js           # Package exports
│   ├── bm25.js            # BM25 scoring engine
│   ├── data.js            # CSV parser + data loaders
│   ├── commands.js        # search/plan/list/init commands
│   └── commands.test.js   # 23 tests (node --test)
├── data/
│   ├── skills_index.csv   # 141 skill records
│   └── skill_reasoning.csv # 50 industry reasoning rules
├── package.json
└── README.md
```

## Testing

```bash
node --test src/commands.test.js
```

23 tests covering:
- BM25 engine (indexing, search, ranking)
- CSV parsing (standard and quoted fields)
- Data loading (skills index, reasoning rules)
- All CLI commands (search, plan, list, init)
- Error handling (unknown commands, missing args)

## Requirements

- Node.js >= 18
- No dependencies

## License

Part of the CVF (Controlled Vibe Framework) project.
