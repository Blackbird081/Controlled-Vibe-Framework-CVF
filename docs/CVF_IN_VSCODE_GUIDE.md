# CVF for Agents in VS Code (Detailed Guide)

> **Version:** v1.0-v1.6
> **Purpose:** Practical, step-by-step guidance to run CVF with any agent environment. VS Code is the reference workflow, but the rules apply everywhere.

---

## 1) Choose the Right Version (Decision Matrix)

| Use case | Recommended version | Why |
|---|---|---|
| Coding in VS Code, no web UI | v1.1 + governance tools | Clear 4-phase execution + risk model + audit mindset |
| Need templates and spec export | v1.5.2 (skills) + v1.1 core | Best spec coverage, still lightweight |
| Need agent UI + multi-agent | v1.6 Agent Platform | Full app with chat, tools, workflows |

**Rule of thumb:**
- Use **v1.0/v1.1** for governance-first execution in VS Code.
- Use **v1.6** only if you want built-in UI + tools + multi-agent.

### Quick version selector (VS Code)

```text
Need UI? (yes)  -> v1.6 Agent Platform
Need templates? (yes) -> v1.5.2 + v1.1
Only governance + execution? -> v1.1
```

---

## 1.1) VS Code Workspace Setup (Recommended)

### Option A: Minimal (Governance-first)
1. Open repo in VS Code.
2. Read [START_HERE.md](../START_HERE.md).
3. Use core docs in [v1.0/](../v1.0/) and [v1.1/](../v1.1/).

### Option B: With templates and skills
1. Open repo in VS Code.
2. Browse skills in [EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/](../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/).
3. Use a skill spec as input to your prompt.

### Option C: Full UI
1. Open repo in VS Code.
2. Start v1.6 UI:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

---

## 1.2) VS Code Extension (Optional)

If you want syntax highlighting or validation for CVF contracts, use the VS Code extension:

See: [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md](../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md)

---

## 2) CVF Core Workflow (Applies to All Versions)

CVF is a **4-phase protocol**. You can run it in VS Code by enforcing these phases in your prompt.

### Phase A: Discovery
- Restate the request
- List assumptions
- Clarify scope
- Ask questions if needed

### Phase B: Design
- Propose approach
- Make technical decisions
- Define steps + deliverables

### Phase C: Build
- Implement with approved plan
- Produce complete output

### Phase D: Review
- Verify success criteria
- List deviations
- Ask for acceptance

---

## 3) VS Code Agent Setup (Prompt Template)

Use this in VS Code with your AI assistant:

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL (4-phase protocol).
Rules:
- Follow Phase A -> B -> C -> D in order.
- Stop and ask for confirmation before moving from A to B and B to C.
- No coding in Phase A or B.
- If required inputs are missing, stop and ask for clarification.
- Provide deliverables in Phase C and self-review in Phase D.

Start with Phase A now.
```

**Why this works:**
- It forces the agent to stay structured.
- It avoids rushing into coding.
- It creates a clear audit trail.

### Agent instruction profiles (copy/paste)

**Profile: Full Mode (default for complex work)**
```text
CVF MODE: FULL
PHASE FLOW: A -> B -> C -> D
STOP CONDITIONS:
- Missing required inputs
- Unclear acceptance criteria
- Requires external credentials or access

GUARDRAILS:
- No destructive commands without approval
- No writing outside repo scope
- List assumptions explicitly

Start Phase A only.
```

**Profile: Governance Mode (most tasks)**
```text
CVF MODE: GOVERNANCE
RULES:
- Ask if requirements are incomplete
- Provide structured output
- No hidden assumptions
```

**Profile: Simple Mode (low risk)**
```text
CVF MODE: SIMPLE
RULES:
- Keep output concise
- If anything is ambiguous, ask before proceeding
```

---

## 4) VS Code + CVF (Step-by-Step Example)

### Step 1: Start with Phase A
Example prompt (user -> agent):

```text
Task: Build a small Node.js CLI that formats JSON files.
Constraints: Must be cross-platform, no external binaries.
Output: Code + usage example + tests.
Mode: FULL.
Start Phase A.
```

### Step 2: Phase B approval
You should approve or correct the design plan.

### Step 3: Phase C build
Agent writes the code and explains how to run it.

### Step 4: Phase D review
Agent checks success criteria and asks for acceptance.

---

## 4.1) End-to-End Workflow (Practical)

### Example: Feature build
1. **Phase A**: Restate goal, scope, assumptions
2. **Phase B**: Design plan + decisions + checklist
3. **Phase C**: Implement code + tests
4. **Phase D**: Review, list risks, ask for acceptance

**Tip:** Use the same format for every task. The consistency is the governance.

---

## 5) CVF Governance Constraints (Use in VS Code)

### Minimal constraints
```text
Stop conditions:
- Missing required inputs
- Ambiguous scope

Guardrails:
- Do not invent data
- Ask before executing destructive commands
```

### Strict constraints (recommended)
```text
Stop conditions:
- Missing required inputs
- Unclear acceptance criteria
- Requires credentials or external access

Guardrails:
- No production changes without explicit approval
- No writes outside project scope
- Always cite assumptions
```

### Enforcement checklist (use before Phase C)
- [ ] All required inputs captured
- [ ] Scope defined (IN/OUT)
- [ ] Acceptance criteria are explicit
- [ ] Risk level identified (R0-R3)
- [ ] Any external access is approved

---

## 6) Which Mode Should I Use?

| Mode | When to use | Behavior |
|---|---|---|
| Simple | Quick tasks | Minimal governance, fast output |
| Governance | Most work | Enforces stop conditions + guardrails |
| Full | Complex or risky work | 4-phase protocol with checkpoints |

---

## 7) Version-by-Version Practical Tips

### v1.0 / v1.1 (Core + Execution)
- Use docs in [v1.0/](../v1.0/) and [v1.1/](../v1.1/)
- Always run 4-phase protocol
- Use checklists under v1.0/governance or v1.1/execution

### v1.5.2 (Skill Library)
- Pick a skill from the library to generate a spec
- Paste the spec into your VS Code agent prompt

### v1.6 (Agent Platform)
- Use the UI if you want built-in tooling
- For VS Code only, keep core prompts from this guide

---

## 8) Minimal CVF Starter Template (VS Code)

```text
CVF MODE: Governance
Phase: A (Discovery)
Task:
- [Describe the goal]
Constraints:
- [List constraints]
Success Criteria:
- [List measurable checks]
Stop Conditions:
- Missing required inputs
- Ambiguous scope

Now run Phase A only.
```

---

## 8.1) Detailed Starter Prompt (Recommended)

```text
CVF VERSION: v1.1
CVF MODE: FULL

PHASE A REQUIREMENTS:
- Restate the goal
- List assumptions
- Define scope IN/OUT
- Ask clarifying questions if needed

TASK:
- [Describe the task]

CONSTRAINTS:
- [List constraints]

SUCCESS CRITERIA:
- [Measurable checks]

STOP CONDITIONS:
- Missing required inputs
- Unclear acceptance criteria

Begin Phase A only. Do not propose solutions in Phase A.
```

---

## 9) Common Pitfalls (And Fixes)

| Pitfall | Fix |
|---|---|
| Agent jumps to code | Explicitly say: "No code in Phase A/B" |
| Missing assumptions | Require a list of assumptions |
| Over-confident output | Require self-review in Phase D |
| Scope creep | Define IN/OUT scope in Phase A |

---

## 10) Recommended Reading Order

1. [START_HERE.md](../START_HERE.md)
2. [docs/CVF_LITE.md](./CVF_LITE.md)
3. [v1.1/QUICK_START.md](../v1.1/QUICK_START.md)
4. [docs/HOW_TO_APPLY_CVF.md](./HOW_TO_APPLY_CVF.md)
5. [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

---

## 11) Quick FAQ

**Q: I only use VS Code. Do I need v1.6?**
A: No. v1.1 + governance tools are enough for most teams.

**Q: When should I use Full Mode?**
A: Any task that is complex, ambiguous, or high-risk.

**Q: Which version should I tell the agent to follow?**
A: For VS Code, say "follow CVF v1.1 (Full Mode)". Use v1.6 only when you run the UI.

---

## 12) Task Templates (Copy/Paste)

For quick checklists, see: [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

### A) Code Review (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Scope: Review only. Do not modify code.
Rules:
- Phase A: restate the goal, list risks and assumptions.
- Phase B: define review criteria and prioritization.
- Phase C: produce findings with file/line references.
- Phase D: summarize risks and recommend next steps.

Task:
Review the following codebase/module for bugs, security issues, and regressions.
Constraints:
- No speculative issues without evidence.
- Provide severity and impact.

Start Phase A now.
```

### B) Refactor (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Ask clarification if requirements are missing.
- Do not change behavior unless approved.
- Provide before/after summary and tests impacted.

Task:
Refactor [module/file] to improve readability and maintainability without changing behavior.
Constraints:
- Preserve API contracts.
- Keep performance same or better.

Start with a short plan and request approval if needed.
```

### C) Security Audit (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: define threat model scope and assumptions.
- Phase B: audit plan and areas to inspect.
- Phase C: findings with evidence and exploitability.
- Phase D: remediation roadmap with priorities.

Task:
Perform a security audit on [system/module].
Constraints:
- Focus on injection, auth, data leakage, and unsafe defaults.
- Include high-risk and medium-risk findings with fixes.

Start Phase A now.
```

### D) Migration (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: clarify current state and target state.
- Phase B: migration strategy with rollback plan.
- Phase C: step-by-step migration tasks.
- Phase D: verification checklist.

Task:
Migrate from [old stack/version] to [new stack/version].
Constraints:
- Zero/low downtime.
- Preserve data integrity.

Start Phase A now.
```

### E) Debugging (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Ask for repro steps if missing.
- Isolate root cause before proposing fixes.
- Provide minimal-risk fix first.

Task:
Debug [issue].
Constraints:
- Do not change behavior outside scope.
- Provide a short verification checklist.
```

### F) Performance Tuning (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: define baseline and metrics.
- Phase B: plan measurement and optimization steps.
- Phase C: implement changes.
- Phase D: report gains and regressions.

Task:
Optimize [system/module] for [metric].
Constraints:
- No functional regressions.
- Provide before/after numbers if available.
```

### G) Incident Post-Mortem (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Focus on timeline, root cause, and prevention.
- No blame language.

Task:
Write a post-mortem for [incident].
Constraints:
- Include impact, detection, response, and action items.
```

### H) Data Migration (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: confirm data sources and target schema.
- Phase B: migration and rollback plan.
- Phase C: step-by-step tasks.
- Phase D: validation checklist.

Task:
Migrate data from [source] to [target].
Constraints:
- Ensure data integrity and idempotency.
- Provide validation queries/checks.
```

---

# PHIEN BAN TIENG VIET (Bilingual)

> Muc dich: Huong dan chi tiet cach dung CVF cho agent. VS Code chi la boi canh tham chieu.

---

## 1) Chon dung version (Bang quyet dinh)

| Nhu cau | Version goi y | Ly do |
|---|---|---|
| Lam viec trong VS Code, khong can UI | v1.1 + governance tools | 4-phase ro rang + risk model |
| Can templates va spec export | v1.5.2 (skills) + v1.1 core | Day du spec, giam moi phai tu viet |
| Can UI + multi-agent | v1.6 Agent Platform | UI day du, tools va workflow |

**Quy tac nhanh:**
- Dung **v1.0/v1.1** neu muon governance-first trong VS Code.
- Dung **v1.6** khi can UI + tools + multi-agent.

### Chon nhanh (VS Code)

```text
Can UI? (co)  -> v1.6 Agent Platform
Can templates? (co) -> v1.5.2 + v1.1
Chi can governance + execution? -> v1.1
```

---

## 1.1) Thiet lap Workspace (khuyen nghi)

### A) Toi thieu (Governance-first)
1. Mo repo trong VS Code.
2. Doc [START_HERE.md](../START_HERE.md).
3. Dung docs: [v1.0/](../v1.0/) va [v1.1/](../v1.1/).

### B) Co templates va skills
1. Mo repo trong VS Code.
2. Chon skill: [EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/](../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/).
3. Dung spec cua skill lam prompt cho agent.

### C) Full UI
1. Mo repo trong VS Code.
2. Chay v1.6 UI:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

---

## 1.2) VS Code Extension (tuy chon)

Neu muon syntax highlight/validation cho CVF contracts:

Xem: [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md](../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md)

---

## 2) Quy trinh core (4 phase)

### Phase A: Kham pha
- Dien giai lai yeu cau
- Liet ke gia dinh
- Dinh nghia scope
- Hoi cau hoi neu can

### Phase B: Thiet ke
- De xuat huong tiep can
- Tu quyet dinh ky thuat
- Dinh nghia buoc lam + deliverables

### Phase C: Thuc thi
- Lam theo plan da duyet
- Tao output hoan chinh

### Phase D: Review
- Kiem tra success criteria
- Neu sai lech, neu ro
- Xin acceptance

---

## 3) Cau hinh agent (Prompt mau)

```text
Ban dang van hanh theo CVF (Controlled Vibe Framework).
Mode: FULL (4-phase).
Rules:
- Follow Phase A -> B -> C -> D theo thu tu.
- Dung lai de xin xac nhan truoc khi tu A->B va B->C.
- Khong viet code o Phase A/B.
- Neu thieu input bat buoc, dung lai va hoi.
- Phase C tao deliverables, Phase D tu review.

Bat dau Phase A ngay.
```

---

## 3.1) Profile mau (copy/paste)

**Full Mode (mac dinh cho viec phuc tap)**
```text
CVF MODE: FULL
PHASE FLOW: A -> B -> C -> D
STOP CONDITIONS:
- Thieu input bat buoc
- Tieu chi chap nhan chua ro
- Can credentials hoac truy cap ben ngoai

GUARDRAILS:
- Khong chay lenh destructive neu chua duyet
- Khong ghi ngoai scope repo
- Liet ke gia dinh ro rang

Bat dau Phase A thoi.
```

**Governance Mode (da so cong viec)**
```text
CVF MODE: GOVERNANCE
RULES:
- Hoi neu requirements chua du
- Output co cau truc
- Khong gia dinh ngam
```

**Simple Mode (rui ro thap)**
```text
CVF MODE: SIMPLE
RULES:
- Output ngan gon
- Neu mo ho, hoi truoc khi lam
```

---

## 4) Vi du tung buoc trong VS Code

### Buoc 1: Phase A
```text
Task: Viet CLI Node.js format JSON.
Constraints: Cross-platform, khong dung binary ngoai.
Output: Code + usage + tests.
Mode: FULL.
Bat dau Phase A.
```

### Buoc 2: Duyet Phase B
Xac nhan ke hoach hoac yeu cau dieu chinh.

### Buoc 3: Phase C
Agent viet code + huong dan chay.

### Buoc 4: Phase D
Agent tu review va hoi acceptance.

---

## 5) Rang buoc governance (dung trong VS Code)

### Toi thieu
```text
Stop conditions:
- Thieu input bat buoc
- Scope mo ho

Guardrails:
- Khong tu tao du lieu
- Hoi truoc khi chay lenh destructive
```

### Chat (khuyen nghi)
```text
Stop conditions:
- Thieu input bat buoc
- Tieu chi chap nhan chua ro
- Can credentials hoac external access

Guardrails:
- Khong thay doi production neu chua duyet
- Khong ghi ngoai scope repo
- Luon liet ke gia dinh
```

### Checklist enforcement (truoc Phase C)
- [ ] Du input bat buoc
- [ ] Scope IN/OUT ro rang
- [ ] Tieu chi chap nhan ro
- [ ] Xac dinh risk level (R0-R3)
- [ ] External access da duyet

---

## 6) Chon Mode nao?

| Mode | Khi nao dung | Hanh vi |
|---|---|---|
| Simple | Viec nho, nhanh | Governance toi thieu |
| Governance | Phan lon cong viec | Stop conditions + guardrails |
| Full | Viec phuc tap/rui ro | 4-phase + checkpoints |

---

## 7) Tips theo version

### v1.0 / v1.1 (Core + Execution)
- Dung docs: [v1.0/](../v1.0/) va [v1.1/](../v1.1/)
- Luon chay 4-phase
- Dung checklist trong v1.0/governance hoac v1.1/execution

### v1.5.2 (Skill Library)
- Chon 1 skill -> lay spec -> paste vao prompt

### v1.6 (Agent Platform)
- Dung UI neu can tools
- Neu chi VS Code, dung prompt tu guide nay

---

## 8) Template toi thieu (VS Code)

```text
CVF MODE: Governance
Phase: A (Discovery)
Task:
- [Mo ta muc tieu]
Constraints:
- [Rang buoc]
Success Criteria:
- [Tieu chi do duoc]
Stop Conditions:
- Thieu input bat buoc
- Scope mo ho

Bat dau Phase A thoi.
```

---

## 8.1) Prompt chi tiet (khuyen nghi)

```text
CVF VERSION: v1.1
CVF MODE: FULL

PHASE A REQUIREMENTS:
- Dien giai lai muc tieu
- Liet ke gia dinh
- Dinh nghia scope IN/OUT
- Hoi neu can

TASK:
- [Mo ta task]

CONSTRAINTS:
- [Rang buoc]

SUCCESS CRITERIA:
- [Tieu chi do duoc]

STOP CONDITIONS:
- Thieu input bat buoc
- Tieu chi chap nhan chua ro

Bat dau Phase A thoi. Khong de xuat giai phap o Phase A.
```

---

## 9) Loi thuong gap (va cach sua)

| Loi | Cach sua |
|---|---|
| Agent nhay vao code som | Noi ro: "Khong viet code o Phase A/B" |
| Thieu gia dinh | Bat buoc liet ke gia dinh |
| Output qua tu tin | Yeu cau tu review Phase D |
| Scope lech | Dinh nghia IN/OUT tu Phase A |

---

## 10) Thu tu doc khuyen nghi

1. [START_HERE.md](../START_HERE.md)
2. [docs/CVF_LITE.md](./CVF_LITE.md)
3. [v1.1/QUICK_START.md](../v1.1/QUICK_START.md)
4. [docs/HOW_TO_APPLY_CVF.md](./HOW_TO_APPLY_CVF.md)
5. [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

---

## 11) FAQ nhanh

**Q: Chi dung VS Code thi co can v1.6 khong?**
A: Khong. v1.1 + governance tools la du cho da so team.

**Q: Khi nao dung Full Mode?**
A: Viec phuc tap, mo ho, hoac rui ro cao.

**Q: Bao agent follow version nao?**
A: Neu dung VS Code, noi "follow CVF v1.1 (Full Mode)".

---

## 12) Mau prompt theo task (copy/paste)

Xem checklist nhanh: [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

### A) Review code (Full)
```text
Ban dang van hanh theo CVF.
Mode: FULL.
Scope: chi review, khong sua code.
Rules:
- Phase A: muc tieu, gia dinh, rui ro.
- Phase B: tieu chi review + muc do uu tien.
- Phase C: findings co file/line.
- Phase D: tong ket rui ro + next steps.

Task:
Review [module] cho bugs/security/regressions.
Constraints:
- Khong neu loi neu khong co bang chung.
- Danh muc do anh huong.

Bat dau Phase A.
```

### B) Refactor (Governance)
```text
Ban dang van hanh theo CVF.
Mode: GOVERNANCE.
Rules:
- Hoi neu yeu cau chua du.
- Khong doi behavior neu chua duyet.
- Neu summary truoc/sau + tests bi anh huong.

Task:
Refactor [file] de de doc, khong doi behavior.
Constraints:
- Giu API contract.
- Hieu nang khong giam.
```

### C) Security Audit (Full)
```text
Ban dang van hanh theo CVF.
Mode: FULL.
Rules:
- Phase A: threat model + scope.
- Phase B: ke hoach audit.
- Phase C: findings co bang chung.
- Phase D: roadmap khac phuc.

Task:
Audit bao mat cho [system/module].
Constraints:
- Tap trung injection/auth/data leakage/unsafe defaults.
- Co muc nguy hiem va trung binh.

Bat dau Phase A.
```

### D) Migration (Full)
```text
Ban dang van hanh theo CVF.
Mode: FULL.
Rules:
- Phase A: hien trang vs muc tieu.
- Phase B: strategy + rollback.
- Phase C: tung buoc thuc thi.
- Phase D: checklist verify.

Task:
Migrate tu [old] sang [new].
Constraints:
- Low downtime.
- Bao toan du lieu.

Bat dau Phase A.
```

### E) Debugging (Governance)
```text
Ban dang van hanh theo CVF.
Mode: GOVERNANCE.
Rules:
- Hoi repro neu chua co.
- Xac dinh root cause truoc khi sua.
- Dua ra fix rui ro thap truoc.

Task:
Debug [issue].
Constraints:
- Khong doi behavior ngoai scope.
- Co checklist verify.
```

### F) Performance (Full)
```text
Ban dang van hanh theo CVF.
Mode: FULL.
Rules:
- Phase A: baseline + metrics.
- Phase B: ke hoach do va toi uu.
- Phase C: implement.
- Phase D: bao cao gains/regressions.

Task:
Toi uu [module] cho [metric].
Constraints:
- Khong co regression ve functional.
- Neu co so lieu truoc/sau.
```

### G) Post-mortem (Governance)
```text
Ban dang van hanh theo CVF.
Mode: GOVERNANCE.
Rules:
- Tap trung timeline, root cause, prevention.
- Khong blame.

Task:
Viet post-mortem cho [incident].
Constraints:
- Co impact, detection, response, action items.
```

### H) Data Migration (Full)
```text
Ban dang van hanh theo CVF.
Mode: FULL.
Rules:
- Phase A: xac nhan source/target schema.
- Phase B: migration + rollback.
- Phase C: step-by-step.
- Phase D: validation queries/checks.

Task:
Migrate data tu [source] sang [target].
Constraints:
- Dam bao integrity va idempotency.
- Dua ra validation queries/checks.
```
