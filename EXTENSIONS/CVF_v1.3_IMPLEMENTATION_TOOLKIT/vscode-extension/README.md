# CVF Contracts — VS Code Extension

Syntax highlighting, validation, and snippets for CVF Skill Contract files.

## Features

### ✅ Syntax Highlighting

- **Risk Levels** with distinct colors:
  - `R0` - Green (safe)
  - `R1` - Blue (controlled)
  - `R2` - Yellow (warning)
  - `R3` - Red (critical)

- **Section Keywords** highlighted (capability_id, governance, input_spec, etc.)
- **Archetypes** and **Phases** recognized
- **Lifecycle States** (PROPOSED, ACTIVE, DEPRECATED, RETIRED)

### ✅ Real-time Validation

Validates contracts on save with checks for:
- Required fields (capability_id, domain, risk_level, etc.)
- Valid risk levels (R0-R3)
- Valid archetypes (Analysis, Decision, Planning, Execution, Supervisor, Exploration)
- Valid phases (A, B, C, D)
- R2/R3 contracts have required_decisions

### ✅ Code Snippets

| Prefix | Description |
|--------|-------------|
| `cvf-contract` | Full contract template |
| `cvf-input` | Input field |
| `cvf-output` | Output field |
| `cvf-governance` | Governance block |
| `cvf-execution` | Execution properties |
| `cvf-audit` | Audit requirements |
| `cvf-failure` | Failure info |
| `cvf-risk-r0` | R0 with description |
| `cvf-risk-r1` | R1 with description |
| `cvf-risk-r2` | R2 with required decisions |
| `cvf-risk-r3` | R3 with human approval |

### ✅ Hover Information

Hover over keywords to see documentation:
- Risk level descriptions
- Archetype explanations
- Field requirements

### ✅ Commands

| Command | Description |
|---------|-------------|
| `CVF: Validate Contract` | Validate current file |
| `CVF: Lint Contract` | Check for style issues |
| `CVF: Create New Contract` | Wizard to create new contract |

## Installation

### From VSIX (Recommended)

1. Build the extension:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   npx vsce package
   ```

2. Install in VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P`
   - Run "Extensions: Install from VSIX..."
   - Select the generated `.vsix` file

### Manual Installation

1. Copy the `vscode-extension` folder to your VS Code extensions directory:
   - Windows: `%USERPROFILE%\.vscode\extensions\cvf-contracts`
   - macOS/Linux: `~/.vscode/extensions/cvf-contracts`

2. Restart VS Code

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `cvf.validateOnSave` | `true` | Validate contracts on save |
| `cvf.showRiskLevelWarnings` | `true` | Show warnings for R2/R3 |
| `cvf.pythonPath` | `python` | Path to Python for cvf-validate |

## Supported File Extensions

- `.contract.yaml`
- `.contract.yml`

## Screenshots

### Syntax Highlighting

```yaml
# Example with highlighting
capability_id: "CODE_REVIEW_v1"     # Blue - entity
risk_level: "R2"                     # Yellow - warning
governance:                          # Purple - section
  allowed_archetypes:
    - "Execution"                    # Cyan - archetype
  allowed_phases:
    - "C"                            # Green - phase
```

### Validation Errors

```
❌ Missing required field: audit
❌ Invalid risk level: R5. Expected R0, R1, R2, or R3
⚠️ Risk level R2 requires at least one required_decision
```

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Package for distribution
npx vsce package
```

## License

MIT
