# CVF Workspace Setup Guide

## Architecture Principle
> **CVF root = governance layer — downstream apps live in separate workspaces**

## Recommended Organization

### Option 1: Personal Account Structure (Legacy)
```
github.com/Blackbird081/
├── Controlled-Vibe-Framework-CVF     ← Framework (main/cvf-next)
└── CVF_Apps                          ← Catalog repo
```

### Option 2: CVF-Ecosystem Organization ✅ **ACTIVE**
```
github.com/CVF-Ecosystem/
├── controlled-vibe-framework        ← Framework fork (from Blackbird081)
├── cvf-task-manager                  ← App 1
├── cvf-code-review-assistant         ← App 2
├── cvf-website-builder               ← App 3
├── cvf-docs                          ← Documentation
└── cvf-apps-catalog                  ← Central catalog
```

## App Development Workflow

### 1. Initialize New App
```bash
# Create repo in organization
gh repo create CVF-Ecosystem/cvf-my-app --private
cd cvf-my-app

# Reference governance (read-only)
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git --depth 1 cvf-ref

# Copy governance rules
cp cvf-ref/GOVERNANCE_RULES.md .
cp cvf-ref/docs/CVF_ARCHITECTURE_DECISIONS.md .
rm -rf cvf-ref

# Initialize app
npm init -y
# Add CVF dependency if needed
npm install @cvf/eco-mcp-server@2.5.0
```

### 2. During Development
- App repo **independent** — không fork từ CVF
- Reference CVF rules as documentation
- Use MCP Server if app needs guard checks
- Follow CVF naming conventions in app's own scope

### 3. When App is Ready
```bash
# Push app (separate repo)
git push origin main

# Update catalog (in organization)
gh repo create CVF-Ecosystem/cvf-apps-catalog --public
cd ../cvf-apps-catalog
echo "- [cvf-my-app](https://github.com/CVF-Ecosystem/cvf-my-app) — Description" >> README.md
git push origin main
```

## Integration Patterns

### Pattern A: MCP Server Integration
```typescript
// App calls CVF guards via MCP
import { createMCPClient } from '@cvf/eco-mcp-server';

const client = createMCPClient();
const result = await client.call('cvf_check_phase_gate', {
  currentPhase: 'BUILD',
  requestedPhase: 'REVIEW'
});
```

### Pattern B: Rules Reference
```markdown
# My App Governance

This app follows CVF governance principles:
- [GOVERNANCE_RULES.md](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/blob/main/GOVERNANCE_RULES.md)
- [CVF_ARCHITECTURE_DECISIONS.md](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/blob/main/docs/CVF_ARCHITECTURE_DECISIONS.md)

App-specific rules:
- No direct database writes without approval
- All code changes must pass phase gate
```

### Pattern C: Submodule (for complex apps)
```bash
# Pin specific CVF version
git submodule add -b v2.1.0 https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git cvf-reference
```

## Benefits of This Approach

1. **Clear Separation** — Framework vs apps
2. **Independent CI/CD** — Each app can deploy separately
3. **Version Control** — Apps can pin specific CVF versions
4. **Scalability** — Unlimited apps without cluttering framework repo
5. **Collaboration** — Different teams can own different apps

## Migration Path

1. Create `CVF-Ecosystem/cvf-apps-catalog` repo in organization
2. Move any existing apps to `CVF-Ecosystem/` repos
3. Update references in documentation to point to organization
4. Establish CI/CD patterns for apps

## Quick Start with CVF-Ecosystem

```bash
# 1. Create first app in organization
gh repo create CVF-Ecosystem/cvf-task-manager --private

# 2. Create catalog
gh repo create CVF-Ecosystem/cvf-apps-catalog --public
cd cvf-apps-catalog
echo "# CVF Apps Catalog\n\n## Apps\n- [Task Manager](https://github.com/CVF-Ecosystem/cvf-task-manager) — Task management with CVF governance" > README.md
git push origin main

# 3. Reference framework (still in personal account)
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git --depth 1 cvf-ref
```
