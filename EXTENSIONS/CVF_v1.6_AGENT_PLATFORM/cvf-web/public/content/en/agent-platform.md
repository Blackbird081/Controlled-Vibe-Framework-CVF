# Tutorial: Multi-Agent Workflows (v1.6 Agent Platform)

**Time:** 20 minutes  
**Level:** Intermediate  
**Prerequisites:** [Web UI set up and running](web-ui-setup.md)  
**What you'll learn:** How to use multi-agent workflows with specialized AI roles

---

## What is Multi-Agent in CVF?

Instead of one AI doing everything, CVF v1.6 splits work across **4 specialized agents**, each mapped to a CVF phase:

| Agent | Role | CVF Phase | Specialty |
|-------|------|-----------|-----------|
| 🎯 **Orchestrator** | Coordinate & delegate | Phase A (Discovery) | Understanding intent, breaking down tasks |
| 📐 **Architect** | Design solution | Phase B (Design) | Architecture, component design, trade-offs |
| 🔨 **Builder** | Write code | Phase C (Build) | Implementation, following specs precisely |
| 🔍 **Reviewer** | Quality assurance | Phase D (Review) | Testing, finding bugs, compliance checking |

### Why Multi-Agent?

Each AI model has strengths:

| Model | Best At | Recommended For |
|-------|---------|----------------|
| **Gemini** | Reasoning, analysis | Orchestrator |
| **Claude** | Design, thoroughness | Architect, Reviewer |
| **GPT-4** | Fast code generation | Builder |

Multi-agent mode lets you use the right model for the right job.

---

## Step 1: Open Multi-Agent Mode

1. Open the CVF Web UI (http://localhost:3000)
2. Navigate to **Agent Chat**
3. Click the **Multi-Agent** toggle (usually in chat settings)
4. You'll see the 4 agent roles appear

---

## Step 2: Configure Agents

### Single AI Mode (Simple)
All 4 agents use the same AI provider. Good for starting out.

**Settings:**
- Provider: Choose one (Gemini/OpenAI/Anthropic)
- All agents inherit the same provider

### Multi AI Mode (Advanced)
Each agent uses a different AI provider.

**Recommended configuration:**

| Agent | Provider | Model | Why |
|-------|----------|-------|-----|
| 🎯 Orchestrator | Gemini | gemini-pro | Strong reasoning |
| 📐 Architect | Claude | claude-3.5-sonnet | Excellent design |
| 🔨 Builder | OpenAI | gpt-4o | Fast code generation |
| 🔍 Reviewer | Claude | claude-3.5-sonnet | Thorough review |

> **Note:** You need API keys for each provider you want to use. See [Web UI Setup](web-ui-setup.md).

---

## Step 3: Run a Multi-Agent Workflow

### Example: Build a Weather Dashboard

**1. Start with the Orchestrator (Phase A)**

Type your intent:
```
I want to build a weather dashboard web app. 
It should show current weather for a city and a 5-day forecast.
Use a free weather API. Keep it simple — just HTML/CSS/JS, no frameworks.
```

The **Orchestrator** will:
- Clarify your intent
- Define scope (in/out)
- Break the project into tasks
- Identify constraints
- Create a structured brief for the Architect

**Example Orchestrator output:**
```
## Discovery Summary

### Intent
Build a single-page weather dashboard showing current conditions 
and 5-day forecast for a searched city.

### Scope
IN: Current weather, 5-day forecast, city search, responsive layout
OUT: User accounts, favorites, weather alerts, PWA

### Tasks
1. Design HTML structure + API integration plan
2. Build HTML/CSS layout
3. Implement JavaScript API calls + rendering
4. Review and test edge cases

### Constraints
- No frameworks (vanilla HTML/CSS/JS)
- Free API (OpenWeatherMap)
- Single page
```

**2. Hand off to the Architect (Phase B)**

The Architect receives the Orchestrator's brief and designs the solution:

```
## Architecture Design

### Components
1. index.html — Single page with search bar, current weather card, forecast cards
2. style.css — Responsive grid, weather icons, dark/light theme
3. app.js — API calls, DOM manipulation, error handling

### API Integration
- OpenWeatherMap API (free tier)
- Endpoints: /weather (current), /forecast (5-day)
- API key stored in app.js (for demo) or .env

### Data Flow
User types city → app.js calls API → parse JSON → update DOM

### UI Layout
┌──────────────────────────────────┐
│  🔍 Search: [City name] [Search] │
├──────────────────────────────────┤
│  Current Weather                  │
│  🌤️ 25°C  Partly Cloudy         │
│  Humidity: 60%  Wind: 12 km/h    │
├──────────────────────────────────┤
│  5-Day Forecast                   │
│  Mon | Tue | Wed | Thu | Fri      │
│  22° | 24° | 20° | 18° | 23°     │
└──────────────────────────────────┘

### Error Handling
- City not found → "City not found. Try again."
- API limit → "API limit reached. Try later."
- No internet → "Check your connection."
```

**3. Builder executes (Phase C)**

The Builder receives the design and writes code:
- Creates `index.html` with semantic structure
- Creates `style.css` with responsive grid
- Creates `app.js` with API calls and error handling
- Follows the design exactly — no "improvements"

**4. Reviewer checks quality (Phase D)**

The Reviewer evaluates the Builder's code against the original intent:

```
## Review Report

### Compliance Check
- [x] Shows current weather ✅
- [x] Shows 5-day forecast ✅  
- [x] City search works ✅
- [x] No frameworks used ✅
- [x] Responsive layout ✅
- [x] Error handling for bad city ✅
- [x] Error handling for API limit ✅

### Issues Found
1. ⚠️ API key hardcoded in app.js (acceptable for demo, 
   should use env variable in production)
2. ⚠️ No loading indicator while fetching (minor UX issue)

### Quality Score: 85/100

### Verdict: ✅ ACCEPT (with minor notes)
```

---

## Step 4: Understanding Agent Handoffs

### Automatic Handoff
In Full CVF governance mode, agents hand off automatically:
```
Orchestrator → (Phase A complete?) → Architect → (Phase B complete?) → Builder → (Phase C complete?) → Reviewer
```

Each transition requires the previous phase's checklist to be completed.

### Manual Handoff
In Simple or Rules mode, you control when to switch agents. Click on the agent you want to activate.

### Going Back
If the Reviewer finds issues, the workflow can loop back:
- Minor issues → Back to **Builder** (re-execute)
- Design issues → Back to **Architect** (re-design)
- Intent issues → Back to **Orchestrator** (re-clarify)

---

## Step 5: Phase Gates in Multi-Agent

When using **Full CVF governance mode**, phase gates enforce quality:

### Phase A → B Gate (Orchestrator → Architect)
```
Checklist:
- [ ] Intent clearly stated
- [ ] Scope defined (in/out)
- [ ] Constraints identified
- [ ] Success criteria defined
```
All boxes must be checked before Architect starts.

### Phase B → C Gate (Architect → Builder)
```
Checklist:
- [ ] Architecture components defined
- [ ] Data flow described
- [ ] Interface/API contracts specified
- [ ] Error handling strategy defined
- [ ] Build is feasible within constraints
```

### Phase C → D Gate (Builder → Reviewer)
```
Checklist:
- [ ] All components implemented
- [ ] No pending build actions
- [ ] Output is testable
- [ ] No scope expansion from design
```

---

## Risk Levels in Multi-Agent

Each agent mode has an inherent risk level:

| Mode | Risk | Why |
|------|------|-----|
| Templates only | **R0** | Passive, no AI execution |
| Single agent chat | **R1** | Controlled, logged, bounded |
| Multi-agent workflow | **R2** | Can chain actions, needs approval |

In practice:
- **R0-R1:** Agents can proceed automatically
- **R2:** You see an approval prompt before each phase transition
- **R3:** Would require human-in-the-loop for every action (not typical for web UI)

---

## Tips for Effective Multi-Agent Workflows

### 1. Be Specific with the Orchestrator
The quality of the entire workflow depends on Phase A. Give the Orchestrator:
- Clear intent (what, not how)
- Explicit constraints
- Success/failure criteria

### 2. Review the Architect's Design Before Building
Don't rush to Phase C. A bad design = bad code. Take 2 minutes to review the Architect's output.

### 3. Let the Builder Follow the Spec
Don't intervene during Phase C unless something is clearly wrong. The Builder should follow the Architect's design, not improvise.

### 4. Use the Reviewer's Feedback
The Reviewer isn't just checking boxes — it's finding edge cases. Pay attention to warnings, not just pass/fail.

### 5. Track Token Usage
Multi-agent uses 3–4x more tokens than single-agent. Monitor the usage tracker in the UI.

---

## What's Next

| I want to... | Go to... |
|-------------|---------|
| Create reusable skill templates | [Custom Skills Tutorial](custom-skills.md) |
| Understand phase gates deeper | [4-Phase Process](../concepts/4-phase-process.md) |
| Learn about risk levels | [Risk Model](../concepts/risk-model.md) |
| Deploy the web UI for my team | [Deployment Guide](../CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md) |
| Set up team governance | [Team Setup Guide](../guides/team-setup.md) |

---

*Last updated: February 15, 2026 | CVF v1.6*
