# CVF Cross-Agent Memory And Auto-Load Assessment

Memory class: ASSESSMENT_RECORD

docType: concept

Date: 2026-05-26

Status: PROPOSED_AWAITING_OPERATOR_DECISION

Authors:

- Operator (questions, scope direction)
- Claude Opus 4.7 (assessment, analysis, proposal)

---

## Purpose

Record the operator-Claude conversation on 2026-05-26 about CVF's
cross-agent memory mechanism and feasibility of "auto-load" runtime
behavior. Operator deferred decision because multiple work items
compete for attention. This document preserves the assessment and
proposal for future decision without losing context.

This is an assessment + proposal document. It does not authorize any
implementation. Operator reviews and decides which option (if any) to
authorize via fresh GC-018.

## Scope / Target / Owner Boundary

Owner: CVF cross-agent memory infrastructure and session startup
protocol.

Boundary: this document records analysis and proposes options. It does
not modify runtime, change AGENTS.md or CLAUDE.md, build MCP server,
update public-sync, or shift freeze posture. Each proposal item
requires operator authorization before implementation.

## Source / Predecessor Evidence

Direct conversation source 2026-05-26 (this session, after operator
asked two questions in sequence):

- Question 1: "Memory files cho cross-session persistence — cái này
  dành cho bạn hay tất cả agent?"
- Question 2: "CVF_SESSION_MEMORY.md có công dụng như Claude Code's
  auto-memory system không?"
- Question 3: "CVF_SESSION_MEMORY.md có thể làm thành auto-memory tự
  load (runtime feature) được không?"

Predecessor documents:

- `docs/concepts/CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
  (canonical rules document committed earlier this session)
- `docs/concepts/archive/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`
  (4-layer architecture)
- `CVF_SESSION_MEMORY.md` (existing cross-agent front door)
- `CLAUDE.md` (Claude-specific front door)
- `AGENTS.md` (Codex + generic agent front door)
- `CVF_SESSION/ACTIVE_SESSION_STATE.json` (machine-readable state)

Claude's auto-memory artifacts (Claude-private, not in repo):

- `C:\Users\DELL\.claude\projects\d--UNG-DUNG-AI-TOOL-AI-2026-Controlled-Vibe-Framework-CVF\memory\MEMORY.md`
- Per-topic feedback files in same path

---

## Part 1: Two Distinct Memory Systems Identified

### System A: Claude Code's auto-memory (tool-internal)

| Attribute | Value |
|---|---|
| Path | `C:\Users\<user>\.claude\projects\<repo-slug>\memory\` |
| Owner | Anthropic's Claude Code tooling |
| Audience | Claude Code runtime ONLY |
| Loading | Automatic at session start (runtime feature) |
| Storage | Outside repo (per-user, per-machine) |
| Cross-agent | NO — Codex/Gemini/MCP cannot access |
| Cross-machine | NO — local to operator's machine |
| Cross-user | NO — per Claude Code user |
| Governance | None (tool-internal convenience) |
| Indexing | `MEMORY.md` pointer file |
| Schema | Frontmatter: `name`, `description`, `metadata.type` |

### System B: CVF_SESSION_MEMORY.md (project-internal)

| Attribute | Value |
|---|---|
| Path | `<repo-root>/CVF_SESSION_MEMORY.md` |
| Owner | CVF project governance |
| Audience | ALL agents reading the repo (Claude, Codex, Gemini, future) |
| Loading | Manual (agent reads because instructed by CLAUDE.md/AGENTS.md) |
| Storage | Inside repo (git-tracked) |
| Cross-agent | YES |
| Cross-machine | YES (in git) |
| Cross-user | YES (all repo collaborators) |
| Governance | Yes (GC-023 size guard, markdown structure checks, active session state guard) |
| Indexing | Section headings + handoff cross-refs |
| Schema | Free-form markdown sections |

### Comparison

Both systems are "memory" in functional sense (persistent agent context
for session start). They differ in:

- **Scope:** Claude-private vs project-wide
- **Loading mechanism:** runtime auto-inject vs instruction-driven
- **Lifecycle:** per Claude Code installation vs git lifecycle
- **Authority:** tool convenience vs governance artifact

CVF already has the cross-agent equivalent (System B). The gap is in
**loading reliability**: System A is enforced by Anthropic runtime;
System B depends on agents obeying CLAUDE.md/AGENTS.md instructions.

---

## Part 2: The Mistake That Surfaced This Question

Earlier this session 2026-05-26, Claude created 2 feedback memory
files in System A path (Claude auto-memory):

- `feedback_operator_is_noncoder_not_proxy.md`
- `feedback_surface_fidelity_gate_before_review.md`

These captured rules from
`docs/concepts/CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
(System B, cross-agent).

**Operator caught the inconsistency:** rules are intended cross-agent,
but Claude saved them to Claude-only memory. Codex pick up next session
would not see those memory files.

**Acknowledgment:** Claude's intent was correct (rules cross-agent via
concept doc), but the memory file step was Claude-private. Concept doc
is the cross-agent source of truth; memory files in System A are
Claude-specific reinforcements.

This is not a defect of the rules themselves — it is an
implementation mismatch between intent (cross-agent) and execution
(Claude-private). Future agents should treat governed concept doc as
canonical, not Claude memory files.

---

## Part 3: Feasibility Of Making CVF_SESSION_MEMORY.md Auto-Load

Three levels of "auto-load" with different feasibility:

### Level 1: Runtime context inject (NOT feasible)

Claude Code's auto-memory works because Anthropic's runtime reads
files in `.claude/projects/.../memory/` and injects into context
window before LLM receives prompt.

**Why not feasible for CVF:**

- Repo does not control tooling runtime (Claude Code, Codex CLI,
  Gemini CLI, future MCP clients)
- Each tool is vendor-specific (Anthropic, OpenAI, Google)
- No standard for "repo tells tool to load file into context"
- Hard architectural constraint, not a CVF gap

### Level 2: Magic filename auto-load (PARTIALLY feasible, already exploited)

Each AI coding tool has filenames that auto-load when present in repo
root:

| Tool | Magic filename | Status |
|---|---|---|
| Claude Code | `CLAUDE.md` | Already exploited |
| Codex CLI | `AGENTS.md` | Already exploited |
| Gemini CLI | (unclear / no official) | Gap |
| Cursor | (different convention) | Out of scope |
| Aider | (different convention) | Out of scope |

**Current state:**

- `CLAUDE.md` has "Session Memory Front Door" section instructing
  Claude to read `CVF_SESSION_MEMORY.md`
- `AGENTS.md` has equivalent instruction for Codex
- Both files cite `CVF_SESSION_MEMORY.md` as required first read

**Loading is "soft" because:**

- Agent reads CVF_SESSION_MEMORY.md only if it obeys the instruction
- No tooling-level enforcement
- Compliance is behavioral, not architectural

### Level 3: Tooling integration mechanisms (CAN BUILD)

Three sub-options:

#### Level 3A: Mandatory startup acknowledgment

Add to AGENTS.md + CLAUDE.md:

```markdown
## Mandatory Startup Acknowledgment

Before responding to ANY user input in a new or resumed session, you
MUST:

1. Read CVF_SESSION_MEMORY.md (entire file)
2. Resolve CVF_SESSION/ACTIVE_SESSION_STATE.json (parse JSON)
3. Output one acknowledgment sentence:
   "I have read CVF_SESSION_MEMORY.md. Current mode: <mode marker>.
   Active handoff: <handoff filename>."

Failure to output acknowledgment = governance violation per GC-020.
```

**Pros:**

- Low effort (docs edit only)
- Cross-agent (both CLAUDE.md and AGENTS.md amended)
- Visible accountability (operator sees acknowledgment)
- Pattern proven in strict instruction-following system prompts

**Cons:**

- Still soft (agent could ignore; only verifiable post-action)
- Adds friction every session (1 extra sentence per session)
- Could be gamed (agent outputs ack without actually reading)

#### Level 3B: cvf-mcp-server (planned, not yet built)

CVF_SESSION_MEMORY.md already references this as planned product:

> "future cvf-cli, and future cvf-mcp-server startup"

Build MCP server exposing tools:

```typescript
- get_session_memory() → CVF_SESSION_MEMORY.md content
- get_active_handoff() → current AGENT_HANDOFF*.md
- get_session_state() → ACTIVE_SESSION_STATE.json parsed
- get_rules(topic: string) → relevant rules from concept docs
- check_governance(action: string) → allow/deny + reason
```

MCP-compatible clients (Claude Code, Codex CLI, Gemini, future)
connect to server. System prompt or first-message instruction triggers
agent to call `get_session_memory()` early.

**Pros:**

- True cross-tool (MCP is standard)
- Tools available in context (agent sees signatures)
- Cached / typed / auditable
- Server can push updates
- Aligns with CVF product roadmap (cvf-mcp-server is planned)
- Differentiates CVF as governance layer that works with any tool

**Cons:**

- High effort (build, host, maintain MCP server)
- Requires MCP-compatible clients (most modern AI tools support, but
  not universal)
- Server availability becomes dependency (if server down, agents lose
  governed context)
- Latency on first call

#### Level 3C: Custom slash command (per-tool, manual)

Define `/cvf-startup` slash command per tool:

- Claude Code: `~/.claude/commands/cvf-startup.md`
- User types `/cvf-startup` at session start

**Pros:**

- Low effort (markdown command file per tool)
- User controls when to load

**Cons:**

- Manual trigger (user must remember)
- Per-tool (Claude Code, Codex, others all need separate config)
- Not auto

### Comparison summary

| Approach | Effort | Cross-agent | Truly auto |
|---|---|---|---|
| Level 1 inject | N/A | N/A | N/A (impossible) |
| Level 2A: Magic filename instruction | Already done | Yes | Soft |
| Level 2B: Add Gemini-specific config | Low | Expands cross-agent | Soft |
| Level 3A: Mandatory startup ack | Low | Yes | Soft (with accountability) |
| Level 3B: cvf-mcp-server | High | Yes (MCP) | Tool-trigger (smart prompt makes it auto-ish) |
| Level 3C: Slash command | Low | No (per-tool) | Manual |

---

## Part 4: Three Proposal Options For Operator

Operator deferred decision because multiple work items compete. Options
preserved here for future decision.

### Option Alpha: Strengthen Level 2 (cheapest)

**Scope:**

- Add "Mandatory Startup Acknowledgment" section to AGENTS.md
- Add equivalent section to CLAUDE.md
- Acknowledgment requires reading CVF_SESSION_MEMORY.md +
  ACTIVE_SESSION_STATE.json + outputting one summary sentence before
  responding to user

**Estimated effort:** 1 docs edit tranche, ~50 lines additions across
2 files. No GC-018 if treated as front-door update.

**Outcome:**

- Soft auto-load improved with accountability
- Agents must prove read before action
- Operator sees acknowledgment as first response in any new session

**Risk:**

- Could be gamed (agent outputs ack without truly reading)
- Adds friction (1 sentence per session)

### Option Beta: Add Gemini and other tools to magic filename coverage

**Scope:**

- Audit which AI coding tools the project must support
- For each, add tool-specific config file with same instruction pattern
- Examples:
  - Gemini: `.gemini/instructions.md` or equivalent
  - Cursor: `.cursorrules` or equivalent
  - Aider: `.aider.conf.yml` or equivalent

**Estimated effort:** Low per-tool, but research needed for each.
Maybe 1 small tranche per tool.

**Outcome:**

- Same soft auto-load pattern, but covers more tools

**Risk:**

- Tool-specific syntax fragments
- Need to maintain across tool updates

### Option Gamma: Build cvf-mcp-server (proper architecture)

**Scope:**

- Build TypeScript MCP server exposing CVF session memory + governance
  tools
- Host (locally or as service)
- Document setup for MCP-compatible clients

**Estimated effort:** Medium-high. Multi-tranche project:

- Tranche 1: MCP server scaffold + minimum tools (get_session_memory,
  get_active_handoff, get_session_state)
- Tranche 2: Governance tools (check_governance, get_rules)
- Tranche 3: Live deployment + client setup guides
- Tranche 4: Cross-tool verification (test from Claude Code, Codex,
  Gemini)

**Outcome:**

- Closest to true cross-tool auto-load CVF can achieve
- Aligns with planned product roadmap (cvf-mcp-server already
  referenced in CVF_SESSION_MEMORY.md)
- CVF differentiates as governance layer that works with any
  MCP-compatible AI tool

**Risk:**

- Significant effort
- Operational complexity (server maintenance, availability)
- Requires MCP-compatible clients

### Option Delta: Defer everything

**Scope:** Do nothing now. Current soft auto-load (Level 2 already in
place) is sufficient pending other priorities.

**Outcome:** No improvement. Memory loading remains instruction-based.

**Risk:** Future agents may continue to mishandle cross-agent vs
Claude-private memory distinction. Operator must catch errors
manually.

---

## Part 5: Recommendation

**Claude recommends Option Alpha now + Option Gamma later** (not
combined; Option Alpha first as bridge, Option Gamma as long-term
investment).

**Reasoning:**

- Option Alpha is low-cost immediate improvement. Adds accountability
  without large effort.
- Option Gamma is the proper architectural solution but high effort
  and competes with other CVF priorities.
- Option Beta (Gemini etc.) is opportunistic — add when need arises.
- Option Delta loses the lesson from this session.

**Sequence:**

1. Operator authorizes Option Alpha → quick tranche, AGENTS.md +
   CLAUDE.md amended
2. CVF continues other priority work (VI5-T3, web export i18n,
   non-coder usability test redo, etc.)
3. When operator decides cvf-mcp-server is high priority, authorize
   Option Gamma as multi-tranche project
4. After cvf-mcp-server proven, deprecate Option Alpha mandatory
   acknowledgment (MCP tool calls replace it)

This is Claude's recommendation. Operator may select any combination
or none.

---

## Part 6: Default Behavior If Operator Defers

If operator does not authorize any option:

- Current state remains: soft auto-load via CLAUDE.md/AGENTS.md
  instructions
- Agents reading CLAUDE.md or AGENTS.md at session start will follow
  instructions to read CVF_SESSION_MEMORY.md (this is current behavior)
- No change to runtime, no change to repo

This is acceptable but does not address the underlying weakness
(soft loading depends on agent compliance).

---

## Part 7: Open Questions For Operator

These do not need answers now. Recorded for future decision session:

1. Is cvf-mcp-server still on roadmap? (CVF_SESSION_MEMORY.md
   references it as "future" — is timing still open?)
2. Does CVF need to support tools beyond Claude Code + Codex CLI?
   (If yes, Option Beta becomes relevant.)
3. Should mandatory startup acknowledgment be human-readable
   (Vietnamese friendly) or machine-readable (parseable by guard)?
4. Should Mandatory Startup Acknowledgment fail commits via pre-commit
   hook, or remain advisory?

---

## Part 8: Implications For Today's Session

Regardless of which option operator selects later, immediate
consequence for THIS session:

- Operator has flagged that 2 feedback memory files Claude saved
  earlier today are Claude-private, not cross-agent
- Cross-agent rules are correctly captured in
  `docs/concepts/CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
- Codex picking up handoff next session will see the concept doc (via
  handoff HEAD pointer chain) but NOT the Claude memory files
- This is acceptable because the concept doc IS the canonical source;
  Claude memory is reinforcement, not the source of truth
- No additional action required for the rules themselves to be
  cross-agent

The implementation question (auto-load mechanism) is separate from the
rules transmission question (which is already solved via governed
artifacts).

---

## Findings / Position

Position summary:

- CVF already has cross-agent memory equivalent (CVF_SESSION_MEMORY.md
  + AGENTS.md + CLAUDE.md + AGENT_HANDOFF*.md combination).
- Claude Code's auto-memory is a tool-internal convenience, not
  intended as cross-agent infrastructure.
- Mistake of saving cross-agent rules to Claude-private memory was
  Claude's implementation error, not a CVF architecture gap.
- "True auto-load" (Level 1) is not achievable because tooling
  runtime is vendor-controlled.
- "Functional auto-load" (Levels 2-3) is achievable with varying
  effort and trade-offs.

Overall position: current state is acceptable. Improvement options
exist with clear trade-offs. Operator decides which option (if any) to
prioritize given competing work.

## Risk / Corrective Action

Risk 1: Future agents may repeat Claude's mistake (saving cross-agent
content to tool-private memory).

Corrective action: this document records the distinction. Concept doc
`CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
Rule A1-A4 + SF1-SF4 should be referenced; agents must check whether
content is intended cross-agent before choosing storage location.

Risk 2: Soft auto-load (Level 2) means agents may skip
CVF_SESSION_MEMORY.md if instructions are too implicit.

Corrective action: Option Alpha (mandatory startup acknowledgment)
addresses this. If not implemented, instructions in CLAUDE.md and
AGENTS.md should remain strong with "MUST" / "MANDATORY" language.

Risk 3: cvf-mcp-server is referenced as future product but no
roadmap exists.

Corrective action: if operator considers Option Gamma, schedule a
dedicated roadmap tranche to scope cvf-mcp-server before
implementation. This document is assessment input, not roadmap.

Risk 4: Adding more startup instructions could conflict with
existing F-1 diminishing returns rule (do not add ceremony for
small gain).

Corrective action: Option Alpha is low ceremony (1 sentence). If
operator feels it's already too much ceremony, defer indefinitely.

Risk 5: Multiple options proposed could overwhelm operator's
decision capacity.

Corrective action: Option Alpha is single recommendation. Other
options are optional. Operator can choose subset.

## Decision / Recommendation / Disposition

Decision: assessment complete; awaiting operator decision.

Recommendation: Option Alpha now (low cost), Option Gamma later
(strategic investment).

Disposition: this document remains in PROPOSED state until operator
explicitly authorizes one or more options via GC-018.

Implementation of ANY option requires:

- Operator authorization (ACCEPT / HOLD / REJECT)
- Fresh GC-018 for the selected scope
- Work order if implementation involves code
- Standard convergence loop (Multi-Role Orchestrated Convergence Form)
  if scope is contested

## Operator Delivery Packet

Operator may select one of:

- `ACCEPT Option Alpha`: authorize mandatory startup acknowledgment
  tranche (low cost, immediate)
- `ACCEPT Option Beta`: authorize per-tool magic filename expansion
  (low cost per tool, gradual)
- `ACCEPT Option Gamma`: authorize cvf-mcp-server roadmap (high
  effort, strategic)
- `ACCEPT Option Alpha + later Option Gamma`: Claude's recommendation
- `DEFER`: no action; current soft auto-load remains
- `HOLD with specific objection`: return packet to Claude with
  question
- `REJECT`: reject all options, request different framing

Operator does not need to decide now. Document preserves context for
later decision session.

## Claim Boundary

This document does not claim:

- Implementation of any option
- Authorization for any tranche
- Resolution of cross-agent memory gap (rules transmission already
  works via concept doc; auto-load is separate improvement)
- cvf-mcp-server architecture (placeholder reference only; actual
  design would require dedicated roadmap)
- Universal AI tool support
- Runtime context injection capability (architecturally impossible
  for repo-level control)
- Hosted readiness
- Production readiness
- Public release readiness
- Freeze posture changes

The document records assessment of cross-agent memory mechanism and
auto-load feasibility, with options preserved for operator's future
decision.

## Evidence / Verification

This assessment is documentation-only. No code, no live proof, no
runtime change. Verification consists of:

- **Source-fidelity inspection**: Claude inspected
  `C:\Users\DELL\.claude\projects\d--UNG-DUNG-AI-TOOL-AI-2026-Controlled-Vibe-Framework-CVF\memory\`
  path to confirm Claude auto-memory location and structure.
- **Repo path inspection**: `CVF_SESSION_MEMORY.md`, `CLAUDE.md`,
  `AGENTS.md`, and `AGENT_HANDOFF_V13_2026-05-25.md` confirmed present
  at repo root with expected content (Session Memory Front Door
  sections, handoff HEAD pointers).
- **Cross-reference**: cited concept doc
  `CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
  exists at expected path (committed earlier this session at HEAD
  `6ef22800`).
- **Live proof**: N/A — assessment proposes future work; no current
  implementation to verify.
- **Test evidence**: N/A — no code paths added.
- **Diagnostic**: N/A — no live runs.

Future implementation of any option (Alpha/Beta/Gamma) requires its
own evidence per the standard tranche pattern (focused tests +
typecheck + live proof when applicable).

## Related Artifacts

Predecessor documents:

- `docs/concepts/CVF_OPERATOR_AGENT_AUTHORITY_AND_SURFACE_FIDELITY_2026-05-26.md`
  (rules that must be cross-agent — already governed)
- `docs/concepts/archive/CVF_LAYERED_PRODUCT_ARCHITECTURE_AND_VIBE_DIALOG_PATTERN_2026-05-25.md`
  (4-layer architecture)

Current cross-agent infrastructure:

- `CVF_SESSION_MEMORY.md` (front door)
- `CLAUDE.md` (Claude-specific)
- `AGENTS.md` (Codex + generic)
- `AGENT_HANDOFF_V13_2026-05-25.md` (active handoff)
- `CVF_SESSION/ACTIVE_SESSION_STATE.json` (machine-readable state)

Future product referenced (not yet built):

- `cvf-mcp-server` (referenced in CVF_SESSION_MEMORY.md purpose line)
- `cvf-cli` (referenced in CVF_SESSION_MEMORY.md purpose line)

Standards relevant:

- F-1 Diminishing Returns Stop Rule (do not add ceremony for small
  gain — Risk 4 cross-reference)
- GC-018 Continuation Candidate Template (required for any
  implementation tranche)
- GC-020 Handoff In-Place Update Rule (handoff HEAD pointer
  requirement)
- GC-023 Governed File Size Guard (size thresholds for active markdown)
