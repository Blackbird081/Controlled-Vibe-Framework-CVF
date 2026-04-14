# CVF Template Skill Corpus Rescreen Roadmap
Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Class: PRODUCT / CORPUS_QUALITY / STRATEGIC_ROADMAP
> Status: ACTIVE PREREQUISITE FOR NON-CODER VALUE PROOF
> Authority: operator-confirmed quality-over-quantity decision, 2026-04-14

---

## 0. Why This Roadmap Exists

Much of the current template/skill corpus comes from earlier CVF stages, when the system was simpler and the intake bar was lower.

That means:

- some templates may be weak even if they are numerous
- some skills may be legacy imports from other repositories with insufficient CVF-native screening
- benchmark results can be distorted by weak corpus quality instead of showing the true value of CVF

Therefore:

**quality must come before quantity**

and corpus rescreen must happen before any template-based product-value proof is treated as trustworthy.

---

## 1. Binding Rule

This roadmap is a hard prerequisite for:

- `W91-T1 Template Output Quality Benchmark`
- `W93-T1 Knowledge-Native Non-Coder Benefit Validation`
- `W96-T1 Non-Coder End-to-End Success Rate Benchmark`

These tranches may not claim trustworthy product-value proof from legacy corpus elements unless those elements have passed the rescreen protocol below.

This roadmap is not a prerequisite for:

- `W90-T1` HIGH_RISK pattern expansion
- future additive guided-response work that does not use the corpus as benchmark evidence

### 1.1 Screening Standard

This roadmap must use:

- `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`

as its scoring and classification authority.

This makes the rescreen rule reusable for future intake and future corpus cleanup, not just this one wave.

`GC-044` is the active guard that keeps this rule binding after the current rescreen wave closes.

---

## 2. Corpus Classification Model

Every evaluated template or mapped skill must end in one of four classes:

| Class | Meaning | Allowed use |
|---|---|---|
| `TRUSTED_FOR_VALUE_PROOF` | strong enough for benchmark truth | may be used in W91/W93/W96 |
| `REVIEW_REQUIRED` | promising but still incomplete | may not be used for value proof yet |
| `LEGACY_LOW_CONFIDENCE` | legacy or weak quality, not reliable | excluded from benchmark truth |
| `REJECT_FOR_NON_CODER_FRONTDOOR` | actively unsuitable for front-door non-coder use | must not be used in value-proof lanes |

---

## 3. Screening Criteria

Each template/skill pair should be screened against the canonical standard and classified with:

- `PASS`
- `MIXED`
- `FAIL`

Minimum dimensions:

- Unique Value
- Domain / Phase Fit
- Risk / Authority Fit
- Input Discipline
- Output Actionability
- Governance Compatibility
- Front-Door Suitability
- Legacy Contamination Risk

---

## 4. Mandatory Deliverables

### D1 — Corpus Inventory

Create one inventory of:

- current template IDs
- category
- mapped skill if any
- current front-door visibility

### D2 — Rescreen Matrix

Create one matrix classifying each evaluated item into:

- `TRUSTED_FOR_VALUE_PROOF`
- `REVIEW_REQUIRED`
- `LEGACY_LOW_CONFIDENCE`
- `REJECT_FOR_NON_CODER_FRONTDOOR`

### D3 — Trusted Benchmark Subset

Freeze the subset that may be used by `W91/W93/W96`.

### D4 — Legacy Quarantine Note

Document which items remain visible only as legacy/reference surfaces and must not be used as proof of product value.

### D5 — Handoff Sync

Update handoff so future agents cannot benchmark on non-trusted items by accident.

---

## 5. Exit Criteria

This roadmap is complete only if:

1. every benchmark-bound template in `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md` is explicitly classified
2. the trusted benchmark subset is frozen in repo truth
3. legacy low-confidence items are clearly excluded from non-coder value proof
4. handoff says exactly which corpus class future agents may use for public-value claims

---

## 6. Recommended Work Sequence

1. inventory current `cvf-web` templates
2. map template-to-skill relationships where they exist
3. classify the benchmark-relevant subset first
4. classify the remaining front-door-visible items second
5. file trusted subset + quarantine note
6. sync handoff

---

## 7. Relationship To The Non-Coder Value Roadmap

This roadmap does not replace `CVF_NON_CODER_VALUE_REALIZATION_ROADMAP_2026-04-14.md`.

It serves as the corpus-quality gate in front of the benchmark tranches.

Practical order:

1. formalize the non-coder value guard direction
2. rescreen the corpus
3. run benchmark/value-proof tranches on the trusted subset

---

## 8. What Must NOT Happen

- do not use sheer template count as a quality signal
- do not benchmark random legacy templates just to hit a number
- do not promote `REVIEW_REQUIRED` items into the trusted set without evidence
- do not hide weak corpus quality by changing rubric or benchmark thresholds

---

## 9. Completion Consequence

Once this roadmap is complete:

- benchmark truth becomes more reliable
- provider/model evaluation is less contaminated by bad template quality
- future public claims about CVF for non-coders become more honest

This is the direct reason quality must win over quantity here.
