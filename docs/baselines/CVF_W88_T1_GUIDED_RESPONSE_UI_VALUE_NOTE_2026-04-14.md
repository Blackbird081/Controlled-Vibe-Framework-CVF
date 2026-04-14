# CVF W88-T1 Guided Response UI — Value Note

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W88-T1
> Audience: operators, product owners, non-technical reviewers

---

## What Changed

Before W88-T1, when a non-coder user submitted a request that was blocked or flagged by CVF governance (e.g. asking how to store passwords, use API keys in a frontend, or copy-paste code without attribution), the user saw:

> ⚠️ Execution blocked by CVF policy. — Using demo mode

That's it. No guidance. No next step. The user had no idea what to do next.

After W88-T1, the same blocked request now shows:

> 💡 Safe next step  
> ⚠️ This request needs review: Execution blocked by CVF policy.  
> *Storing passwords securely is a critical security concern. Safe approach: (1) Never store plaintext passwords. (2) Use a strong hashing library — bcrypt (cost factor ≥12) or Argon2id are recommended. (3) Store only the hash in your database...*

The user receives specific, actionable guidance without inspecting raw JSON or reading logs.

---

## Why This Matters For Non-Coders

A non-coder user interacts with CVF through templates and the execution flow. When CVF blocks a request, the value proposition depends on whether the user:

- understands WHY it was blocked
- knows WHAT to do instead

W87 gave CVF the ability to produce that guidance at the API layer. W88-T1 makes that guidance actually visible in the front-door product experience.

This converts CVF from a system that **only restricts** to one that **restricts AND guides**.

---

## What Was NOT Changed

- Guard policy: unchanged
- Enforcement logic: unchanged
- Guided response content: unchanged (W87 authored these)
- Normal task paths: unaffected (no guided response panel shown on success)
- Provider configuration: unchanged

---

## Product-Value Outcome

| User scenario | Before W88-T1 | After W88-T1 |
|---|---|---|
| Asks to store passwords unsafely | sees bare block error | sees bcrypt + hashing guidance |
| Copies code without attribution | sees bare block error | sees CC BY-SA 4.0 attribution guidance |
| Puts API key in frontend | sees bare block error | sees server-side proxy guidance |
| Submits normal task | normal output | unchanged |

---

*Filed: 2026-04-14 — W88-T1 Guided Response UI Value Note*
