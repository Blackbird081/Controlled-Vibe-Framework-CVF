# CVF User Requirements & Support Needed

> **Date:** 2026-03-10
> **Context:** What the project owner needs to provide/decide for each sprint

---

## Sprint 0: Foundation Fix

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | What should `vibcode.netlify.app` display? | (A) CVF Web UI v1.6 (B) New landing page (C) Both with routing | Determines netlify.toml config |
| 2 | Merge strategy for cvf-next → main? | (A) Squash merge (B) Merge commit (C) Rebase | Affects git history |
| 3 | Keep or archive old `Mini_Game/webapp` reference in netlify.toml? | (A) Remove (B) Point to CVF-Ecosystem | Deployment fix |

### User Actions Required

- [ ] Create PR on GitHub: `cvf-next` → `main` (link: https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/compare/main...cvf-next)
- [ ] Approve and merge the PR
- [ ] Verify Netlify deployment after merge

### Provided

- [x] Gemini API Key: stored securely (never in git)

---

## Sprint 1: MCP HTTP Bridge

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | MCP HTTP Bridge port? | Default: 3001 | Must not conflict with Web UI (3000) |
| 2 | Authentication for guard API? | (A) None (local only) (B) Simple token (C) Full auth | Security level |
| 3 | Deploy bridge as separate service or embedded in Web UI? | (A) Separate Node process (B) Next.js API route | Architecture |

### No User Actions Required

- Cascade handles all implementation
- User reviews and tests

---

## Sprint 2: Agent Execution Runtime

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | AI Provider for execution | (A) Gemini only (B) Gemini + OpenAI (C) All 3 | Complexity vs flexibility |
| 2 | Execution scope for MVP | (A) Text generation only (B) Text + code gen (C) Text + code + file ops | Risk level |
| 3 | HITL approval method | (A) In-app modal (B) Email notification (C) Both | UX complexity |
| 4 | Max tokens per session (free tier) | Suggested: 100K tokens/day | Cost control |

### User Actions Required

- [ ] Test execution loop with real use cases
- [ ] Provide 3-5 example "vibes" (natural language requests) for testing:
  - Example: "Build me a landing page for my coffee shop"
  - Example: "Analyze my sales data and create a report"
  - Example: "Create a marketing plan for my new product"

---

## Sprint 3: Golden Screens UI

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | UI framework for Golden Screens | (A) Extend existing Next.js (B) New standalone app | Architecture |
| 2 | Language default | (A) Vietnamese first (B) English first (C) Auto-detect | UX |
| 3 | Voice input for Vibe Box | (A) Browser Web Speech API (B) Whisper API (C) Skip for MVP | Feature scope |
| 4 | Intention Map visualization | (A) Simple tree (B) Interactive mindmap (C) Flowchart | Complexity |

### User Actions Required

- [ ] User testing: try all 5 Golden Screens and provide feedback
- [ ] Provide Vietnamese translations for UI labels (or approve auto-translations)

---

## Sprint 4: Production Hardening

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | Free tier limits | Suggested: 100 req/day, 100K tokens | Cost |
| 2 | Domain name | (A) Keep vibcode.netlify.app (B) Custom domain | Branding |
| 3 | Analytics | (A) None (B) Simple page views (C) Full telemetry | Privacy |

### User Actions Required

- [ ] If custom domain: purchase and configure DNS
- [ ] Review and approve CI/CD pipeline
- [ ] Provide Netlify account access if needed for environment variables

---

## Sprint 5: Cleanup & Documentation

### Decisions Needed

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | Archive legacy extensions? | (A) Move to legacy/ folder (B) Delete (C) Separate repo | Repo cleanliness |
| 2 | Open source strategy | (A) Keep CC BY-NC-ND (B) Switch to MIT (C) Dual license | Community adoption |
| 3 | README audience | (A) Developers (B) Non-coders (C) Both with tabs | First impression |

### User Actions Required

- [ ] Review final README
- [ ] Record demo video (optional but high impact)
- [ ] Announce on GitHub / social media

---

## Ongoing Support Throughout All Sprints

### What Cascade Handles (No User Action Needed)

- All coding and implementation
- Test writing and execution
- Git commits and branch management
- Documentation updates
- Architecture decisions (with user approval)

### What User Provides

1. **Decisions** on the questions listed above (before each sprint starts)
2. **Testing** — try features after each sprint and provide feedback
3. **API Keys** — already provided (Gemini)
4. **Domain/Hosting** — Netlify account access if environment variables needed
5. **Real Use Cases** — 3-5 example "vibes" for testing agent execution
6. **Feedback Loop** — quick Yes/No on UI/UX choices during sprints

### Communication Protocol

- Before each sprint: Cascade presents plan, user approves
- During sprint: Cascade implements, user tests incrementally
- After sprint: Cascade presents results, user evaluates score
- Blockers: Cascade asks immediately, user responds when available

---

## Immediate Next Steps

### To Start Sprint 0 RIGHT NOW:

1. **User decides:** What should `vibcode.netlify.app` display?
2. **User creates PR:** https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/compare/main...cvf-next
3. **Cascade fixes:** `netlify.toml` → correct build path
4. **Cascade sets up:** `.env.local` with Gemini API key
5. **Cascade verifies:** Web UI runs locally with real AI

**Estimated time for Sprint 0: 1-2 hours**

---

*This document is updated as sprints progress. Check off completed items after each sprint.*
