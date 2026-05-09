# Tutorial: Intelligence Skills from claudekit-skills Analysis (AGT-021 → AGT-024)

**Time:** 25 minutes  
**Level:** Intermediate → Advanced  
**Prerequisites:** [Agent Platform set up](agent-platform.md), [Using New Skills v1.6.2 (AGT-015–020)](using-new-skills-v2.md)  
**What you'll learn:** How to use 4 new intelligence skills inspired by claudekit-skills patterns — context engineering, problem-solving dispatch, systematic debugging, and MCP context isolation

---

## Overview

CVF v1.6.3 expands from **20 to 24 agent tools** after analyzing the [claudekit-skills](https://github.com/Blackbird081/claudekit-skills) ecosystem (30+ skills, 12 plugin categories). These 4 new skills bring meta-cognitive patterns into CVF's governance framework:

| Skill | What It Does | Risk | When to Use |
|-------|-------------|------|-------------|
| 🧠 **AGT-021: Context Engineering Optimizer** | Token management, degradation detection, compaction | R1 | When context window is filling up or performance degrades |
| 🧭 **AGT-022: Problem-Solving Framework Router** | Stuck-type → technique dispatch | R0 | When stuck on any type of problem |
| 🔍 **AGT-023: Systematic Debugging Engine** | 4-phase root cause methodology | R2 | When debugging code bugs or system failures |
| 🔒 **AGT-024: MCP Context Isolation Manager** | Subagent-based MCP tool delegation | R2 | When using multiple MCP servers |

---

## Updated Risk Distribution (24 Skills)

```
R0 (5 skills) ─── R1 (7 skills) ─── R2 (8 skills) ─── R3 (4 skills)
Safe/Auto         Low/Auto          Medium/Supervised   High/Manual
```

| Risk | New Skills | Approval | Who Can Use |
|------|------------|----------|-------------|
| **R0** (AGT-022) | Problem-Solving Router | Automatic | All |
| **R1** (AGT-021) | Context Engineering Optimizer | Automatic | All |
| **R2** (AGT-023, 024) | Systematic Debugging, MCP Isolation | Supervised | Orchestrator, Builder |

---

## Skill 1: Context Engineering Optimizer (AGT-021)

### What It Does
Framework-level skill for **optimizing token context** in agent workflows. Monitors context health, detects degradation patterns, and triggers compaction when needed.

### When to Use
- Context window approaching 70-80% utilization
- Agent performance degrading over long sessions
- Multi-agent workflows with high token costs
- Need to optimize prompt structure for cache hit rates

### Key Concept: Four-Bucket Strategy
```
Write (save external) → Select (pull relevant) → Compress (reduce tokens) → Isolate (split sub-agents)
```

### Chat Prompt Examples
```
"Analyze my current context health — what's the token utilization?"
"Optimize context: move critical information to beginning/end positions"
"Trigger compaction — target 50-70% reduction with less than 5% quality loss"
"Set up context monitoring for this multi-agent workflow"
```

### TypeScript Integration
```typescript
import { ContextEngineering } from '@cvf/agent-skills';

const optimizer = new ContextEngineering({
  governance: { risk: 'R1', approval: 'auto_audit' }
});

// Monitor context health
const health = await optimizer.analyze({
  currentTokens: 85000,
  maxTokens: 128000,
  criticalSections: ['system-prompt', 'user-context', 'tool-results']
});

console.log(health);
// {
//   utilization: 0.66,
//   warning: false,
//   degradationRisk: 'low',
//   recommendations: ['Move critical info to beginning/end positions']
// }

// Trigger compaction when needed
if (health.utilization > 0.7) {
  const result = await optimizer.compact({
    strategy: 'four-bucket',
    targetReduction: 0.6,       // 60% reduction
    maxQualityLoss: 0.05,       // ≤5% quality degradation
    preserveSections: ['system-prompt', 'recent-context']
  });
  console.log(`Reduced from ${result.before} to ${result.after} tokens`);
}
```

### Anti-Patterns Detected
| Anti-Pattern | Correction |
|-------------|------------|
| Exhaustive context loading | Curated high-signal tokens only |
| Critical info in middle positions | Move to beginning/end (U-shaped attention curve) |
| No compaction before limits | Trigger at 70-80% utilization |
| Tools without descriptions | Apply 4-question framework: what, when, inputs, returns |

---

## Skill 2: Problem-Solving Framework Router (AGT-022)

### What It Does
Meta-skill that **dispatches to the right problem-solving technique** based on how you're stuck. Doesn't solve problems directly — it identifies the optimal approach.

### When to Use
- Architecture is getting too complex
- Need a breakthrough idea
- Seeing the same pattern across multiple places
- Assumptions feel wrong but can't pinpoint why
- Unsure if a solution will scale

### Decision Tree
```
STUCK?
├─ Technical bug?               → AGT-023 (Systematic Debugging)
├─ Architecture too complex?    → Simplification Cascades
├─ Need breakthrough idea?      → Collision Zone Thinking
├─ Seeing repeated patterns?    → Meta-Pattern Recognition
├─ Assumptions feel wrong?      → Inversion Exercise
├─ Unsure about scale?          → Scale Game
└─ Multiple independent issues? → AGT-018 (parallel sub-agents)
```

### Chat Prompt Examples
```
"I'm stuck — this architecture keeps growing more special cases. Help me simplify."
"I need an innovative approach — conventional solutions aren't working."
"I keep seeing the same problem in different parts of the codebase."
"Something feels wrong about our assumptions but I can't figure out what."
"Will this approach work at 1000x the current scale?"
```

### The 6 Techniques

**1. Simplification Cascades** — When complexity spirals
```
Find one insight that eliminates multiple components at once.
Look for: same thing done 5+ ways, growing special cases.
```

**2. Collision Zone Thinking** — When you need innovation
```
Force unrelated concepts together to discover emergent properties.
Example: "What if our auth system worked like a biological immune system?"
```

**3. Meta-Pattern Recognition** — When recurring patterns appear
```
Spot patterns appearing in 3+ domains.
Action: Abstract the pattern, solve it once, apply everywhere.
```

**4. Inversion Exercise** — When forced by assumptions
```
Flip core assumptions to reveal hidden constraints.
Ask: "What if we did the exact opposite?"
```

**5. Scale Game** — When unsure about production
```
Test at extremes: 1000x bigger AND 1000x smaller.
Reveals: true bottlenecks, unnecessary complexity, scale invariants.
```

**6. Combine Techniques**
```
Simplification + Meta-pattern: Find pattern → simplify all instances
Collision + Inversion:         Force metaphor → invert its assumptions
Scale + Simplification:        Extremes reveal what to eliminate
```

---

## Skill 3: Systematic Debugging Engine (AGT-023)

### What It Does
4-phase debugging methodology that ensures **root cause investigation BEFORE any fix attempts**. Prevents the common AI anti-pattern of "guess-and-fix" cycles.

### The Iron Law
> **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

### When to Use
- Code producing wrong behavior
- Tests failing unexpectedly
- System errors after changes
- Performance regressions
- After 2+ failed fix attempts (MUST use this)

### The Four Phases

```
Phase 1: Root Cause     →  Phase 2: Pattern      →  Phase 3: Hypothesis   →  Phase 4: Implementation
      ↓                          ↓                         ↓                         ↓
 Read errors              Find working examples     Form single theory      Create failing test
 Reproduce                Compare differences       Test minimally          Implement single fix
 Check recent changes     Identify gaps             One variable at a time  Verify fix
 Trace data flow          Understand dependencies   Confirm or reject       Document
```

### Chat Prompt Examples
```
"Debug this failing test — start with Phase 1 root cause investigation."
"The API returns 500 after the last deploy. Trace the data flow."
"I've tried fixing this 3 times already — use systematic debugging from scratch."
"Compare this broken module with the working version in the other service."
```

### TypeScript Integration
```typescript
import { SystematicDebugger } from '@cvf/agent-skills';

const debugger = new SystematicDebugger({
  governance: { risk: 'R2', approval: 'supervised' }
});

// Phase 1: Root Cause Investigation
const investigation = await debugger.investigate({
  error: errorMessage,
  stackTrace: trace,
  recentChanges: await git.diff('HEAD~3'),
  affectedFiles: ['src/auth/service.ts', 'src/auth/middleware.ts']
});

// Phase 2: Pattern Analysis
const patterns = await debugger.analyzePatterns({
  workingExample: 'src/user/service.ts',
  brokenComponent: 'src/auth/service.ts',
  differences: investigation.differences
});

// Phase 3: Hypothesis
const hypothesis = debugger.formHypothesis({
  rootCause: investigation.rootCause,
  evidence: patterns.evidence,
  // Single hypothesis: "X is root cause because Y"
});

// Phase 4: Implementation (only after hypothesis confirmed)
if (hypothesis.confirmed) {
  const fix = await debugger.implement({
    failingTest: 'tests/auth.test.ts',
    singleFix: hypothesis.proposedFix,
    verifyCommand: 'npm test'
  });
  // MUST verify: actual test output shows 0 failures
  console.log(fix.verificationEvidence);
}
```

### Red Flags — STOP and Return to Phase 1
- ❌ "Just try changing X and see"
- ❌ "Quick fix for now, investigate later"
- ❌ "Add multiple changes, run tests"
- ❌ "I don't fully understand but this might work"
- ❌ "One more fix attempt" (after 2+ failures)
- ❌ Proposing solutions before tracing data flow

### Escalation Rule
> **If 3+ fixes fail → STOP → Question architecture.** Escalate to Architect role.

---

## Skill 4: MCP Context Isolation Manager (AGT-024)

### What It Does
Architectural pattern for **delegating MCP tool calls to a dedicated subagent**, keeping the main agent's context clean. Solves the "context bloat" problem where loading multiple MCP servers pollutes the primary context window.

### Key Principle
> MCP tool discovery and execution happen in an isolated subagent context. The main agent only receives the result, not the 1000+ tool definitions.

### When to Use
- Working with 3+ MCP servers simultaneously
- Context window getting bloated by tool definitions
- Need to preserve main context quality during MCP-heavy workflows
- Managing 10-80+ MCP servers for enterprise setups

### Architecture
```
┌──────────────────────────┐
│     Main Agent           │
│  (clean context)         │
│                          │
│  "I need to use MCP X"   │
│         │                │
│         ▼                │
│  ┌──────────────┐        │
│  │ Dispatch to   │        │
│  │ MCP Subagent  │        │
│  └──────┬───────┘        │
│         │                │
└─────────┼────────────────┘
          ▼
┌──────────────────────────┐
│   MCP Manager Subagent   │
│  (isolated context)      │
│                          │
│  1. Load .mcp.json       │
│  2. Initialize servers   │
│  3. Discover tools       │
│  4. Select best tool     │
│  5. Execute tool         │
│  6. Return result only   │
└──────────────────────────┘
```

### Chat Prompt Examples
```
"Use the GitHub MCP server to list my open PRs — isolate it from main context."
"Set up context isolation for these 5 MCP servers."
"How much context am I saving with MCP isolation vs direct loading?"
"Run a database query through the MCP subagent and return just the results."
```

### Context Savings
| Metric | Without Isolation | With Isolation |
|--------|-------------------|----------------|
| Context overhead per MCP server | ~500-2000 tokens | ~0 tokens (main) |
| 10 MCP servers cost | ~10,000 tokens | ~50 tokens (dispatch) |
| Tool discovery time | Immediate (bloated) | On-demand (clean) |
| Main context quality | Degraded | Preserved |

### TypeScript Integration
```typescript
import { MCPIsolationManager } from '@cvf/agent-skills';

const mcp = new MCPIsolationManager({
  governance: { risk: 'R2', approval: 'supervised' },
  timeout: 30000,
  maxServers: 80
});

// Configure MCP servers (main context stays clean)
mcp.configure({
  servers: [
    { name: 'github', config: '.mcp/github.json' },
    { name: 'database', config: '.mcp/postgres.json' },
    { name: 'slack', config: '.mcp/slack.json' }
  ],
  security: {
    credentialSource: 'environment',    // Never in context
    allowList: ['github', 'database'],  // Explicit server allowlist
    resultSanitization: true            // Filter sensitive data
  }
});

// Execute via isolated subagent
const result = await mcp.execute({
  server: 'github',
  action: 'list_pull_requests',
  params: { state: 'open', author: '@me' },
  // Only the result comes back to main context
  resultFormat: 'summary'
});

console.log(result);
// { prs: [...], tokensSaved: 1847, subagentDuration: '2.3s' }
```

### Security Model
- MCP credentials managed via **environment variables** (never in context)
- Subagent has **limited permissions**: execute MCP tools only
- Results **filtered for sensitive data** before returning
- Server **allowlist** enforced via governance configuration

---

## How These Skills Work Together

```
Agent encounters problem
       │
       ▼
  AGT-022 (Router)
  "What kind of stuck?"
       │
       ├─ Code bug ──────→ AGT-023 (Debugging)
       │                     4-phase root cause
       │
       ├─ Complex arch ───→ Simplification Cascades
       │
       ├─ Context bloat ──→ AGT-021 (Optimizer)
       │                     Compaction + monitoring
       │
       └─ MCP overload ───→ AGT-024 (Isolation)
                             Subagent delegation
```

### Integration Map
| Skill | Integrates With | How |
|-------|----------------|-----|
| AGT-021 | AGT-019 (Progressive Loader) | Runtime skill loading budget |
| AGT-021 | AGT-018 (Agent Team) | Multi-agent context cost tracking |
| AGT-022 | AGT-023 (Debugging) | Routes "code broken" to debugging |
| AGT-022 | AGT-018 (Agent Team) | Routes "multiple issues" to parallel agents |
| AGT-023 | AGT-022 (Router) | Dispatched from router for code bugs |
| AGT-024 | AGT-014 (MCP Server) | Base MCP connectivity |
| AGT-024 | AGT-021 (Context) | Context quality preservation |

---

## What's Different About v1.6.3?

| Aspect | Previous (v1.6.2) | New (v1.6.3) |
|--------|-------------------|--------------|
| **Focus** | Workflow automation, analytics | Meta-cognitive intelligence |
| **Source** | claude-code-templates (500+ components) | claudekit-skills (30+ skills, 12 plugins) |
| **Key Insight** | Template-based patterns | "Skills ≠ Documentation" — active workflow capabilities |
| **Skills Added** | AGT-015→020 (6 skills) | AGT-021→024 (4 skills) |
| **Total** | 20 agent tools | 24 agent tools |
| **New Concept** | Hook system, agent teams | Context engineering as optimization discipline |

---

## Key Takeaway from claudekit-skills

> **"Skills ≠ Documentation."** — A skill is not a reference guide. It's an active workflow capability with decision trees, anti-patterns, and escalation rules. This philosophy shaped all 4 new skills: each one is a **methodology**, not just a reference.

---

## Next Steps

1. **Try AGT-022 first** — it's R0 (fully automatic) and helps you choose the right approach
2. **Monitor context with AGT-021** — especially during long sessions
3. **Use AGT-023 for debugging** — the Iron Law prevents wasted time
4. **Set up AGT-024** if you use 3+ MCP servers
5. **Review the analysis report** — `docs/CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md`

---

*Last Updated: February 18, 2026 — CVF v1.6.3*
