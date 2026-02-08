# CVF Skill Deduplication Policy

> **Version:** 1.0.0  
> **Status:** Active  
> **Date:** 2026-02-08

---

## 1. Purpose

Prevent skill library from growing noisy with near-duplicate entries.

## 2. Similarity Threshold

| Threshold | Action |
|-----------|--------|
| ≥ 0.80 (Jaccard) | **Auto-quarantine** — almost certainly duplicate |
| 0.60 – 0.79 | **Manual review** — likely overlap, may need merge |
| 0.40 – 0.59 | **Flag for attention** — possible overlap within same domain |
| < 0.40 | **No action** — sufficiently distinct |

## 3. Comparison Method

- **Algorithm:** Jaccard similarity on tokenized content
- **Scope:** Purpose section by default; full-document for cross-domain
- **Cross-domain:** Enabled for broad deduplication passes
- **Token limit:** 120 unique tokens per skill

## 4. Process

1. Run `dedupe_skill_similarity.py --dry-run` → review report
2. Skills above threshold → quarantine (moved, not deleted)
3. Quarantined skills retained in `dupe-quarantine/` for audit trail
4. Higher quality_score skill is always kept

## 5. Integration

- Run deduplication before any bulk import
- Run monthly as maintenance check
- Quarantine report included in governance dashboard

## 6. Current State (2026-02-08)

- 124 skills analyzed (cross-domain, threshold 0.40)
- 1 near-duplicate found and flagged
- Library is **clean** — previous deduplication passes were effective

## 7. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial policy |
