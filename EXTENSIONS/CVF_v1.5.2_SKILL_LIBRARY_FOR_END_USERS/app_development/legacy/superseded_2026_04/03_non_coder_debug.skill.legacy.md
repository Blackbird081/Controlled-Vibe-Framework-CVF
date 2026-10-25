# Non-Coder Debug

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> No prerequisites — this skill activates when the app encounters an error, regardless of phase.

---

## 🎯 Purpose

**When to use this skill:**

- App crashes, fails to open, or displays a blank white screen
- Calculation or display results are incorrect
- User sees an error message but does not understand what it means
- Phase C (Build) or Phase D (Review) — when an error occurs

**Not suitable when:**

- Debugging complex performance issues (use AGT-023 Systematic Debugging Engine)
- Error relates to infrastructure or server

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Builder, Reviewer |
| Allowed Phases | Build, Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Error captured, Root cause identified, Fix verified by test run |

---

## ⛔ Execution Constraints

- AI MUST NOT expose raw technical error messages (Error Codes, Stack Traces) to the User
- AI MUST NOT blame the computer environment before first checking the logic
- AI MUST run a test after fixing to confirm the error is gone
- Explain in plain language: "Symptom → Root Cause → How I Fixed It"

---

## ✅ Validation Hooks

- Check that the error symptom is described before the root cause is explained
- Check that the root cause explanation uses no technical jargon
- Check that a test run is included after the fix
- Check that the output is in plain language, not code

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-03_non_coder_debug.md`
- UAT Objective: Skill must explain errors without technical jargon and confirm the fix with a test run

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **Error Symptom** | What the User sees when the error occurs | ✅ | "Clicking Save makes the app go blank" |
| **Steps to Reproduce** | What to do to trigger the error again | ✅ | "Enter a negative number in the Income field, then click Save" |
| **When it First Appeared** | Context of when the issue started | ❌ | "After I added the Notes column" |

---

## ✅ Expected Output

**What you will receive — a plain-language Bug Report:**

```markdown
# Bug Report

## Symptom
When you enter a negative number in the Income field and click Save, the app goes blank.

## Root Cause (in plain terms)
Your app only knows how to handle positive numbers. When it receives a negative number,
it gets "confused" and stops — just like a calculator when you divide by zero.

## How I Fixed It
I added a "filter" at the input gate: if you enter a negative number, the app will now
show a message "Please enter a number greater than 0" instead of going blank.

## Test Results
✅ Tested with -100 → App shows message, no longer goes blank.
✅ Tested with 0 → App also shows valid message.
✅ Tested with 5000 → App saves normally as before.
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**

- [ ] Symptom description matches what the User reported
- [ ] Root cause explained without code or jargon
- [ ] Test run results included (at least 3 cases)
- [ ] Error does not reappear after the fix

**Red Flags (Reject):**

- ⚠️ Explanation contains "TypeError", "NullPointerException", "500 error"
- ⚠️ No test step after fixing
- ⚠️ Blame attributed to "low RAM" without checking code first

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Stack trace in explanation | Translate the stack trace into plain language |
| No test after fixing | Always run tests with both valid and invalid inputs |
| Fix creates another bug | Check related cases after fixing |

---

## 💡 Tips

1. **Use real-world analogies** — "Like dividing by zero on a calculator"
2. **Minimum 3 test cases** — Valid input / Invalid input / Edge case
3. **Symptom first, cause second** — User needs to see that you understand the problem before the explanation
4. **When unsure of root cause** — Say "I'm not certain, but here is what I tried"

---

## 📊 Example

### Sample Input

```
Error Symptom: "App shows strange number like 1e+06 instead of 1,000,000"
Steps to Reproduce: "Enter an amount larger than 1 million then click Calculate"
```

### Sample Output

```markdown
## Symptom
When you enter an amount larger than 1 million, the app shows "1e+06" instead of "1,000,000".

## Root Cause
This is the computer's way of abbreviating large numbers — called "scientific notation".
It is accurate but not user-friendly. Like writing "1×10⁶" instead of "one million".

## How I Fixed It
I added automatic number formatting to the display results.

## Test Results
✅ 1,500,000 → shows "1,500,000"
✅ 500 → shows "500" (small numbers unchanged)
✅ 0 → shows "0"
```

### Evaluation

- ✅ No technical jargon used
- ✅ Plain-language analogy
- ✅ 3 test cases sufficient
- **Result: ACCEPT**

---

## 🔗 Next Step

After the fix → [Grandma UX Test](../product_ux/04_grandma_ux_test.skill.md) for full UX review

---

## 🔗 Related Skills

- [Grandma UX Test](../product_ux/04_grandma_ux_test.skill.md) — Confirm usability after bugfix

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; domain corrected to App Development |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Non-Coder Debug — CVF v1.5.2 App Development Skill Library*
