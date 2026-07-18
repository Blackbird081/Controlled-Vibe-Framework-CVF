# CVF Corpus Source Hash Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-06-02

Authority: docs/baselines/CVF_GC018_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_2026-06-02.md

---

## Purpose

Establish the per-file `sourceHash` requirement for CVF corpus intelligence
readiness packets. This standard ensures that future packets can demonstrate
drift resistance for individual source files before a corpus is used for
retrieval, chatbot intake, product classification, or knowledge-map work.

Without per-file hashes, a structural checker cannot detect drift between the
corpus snapshot taken at scan time and the actual file content at retrieval
or ingestion time. A manifest-level hash covers only the manifest itself — it
does not prove that individual file content is unchanged.

---

## Scope

Applies to all corpus intelligence readiness packets produced under the CVF
corpus intelligence workflow, including:

- legacy folder rescan packets (`LHW-RESCAN-*`);
- user project corpus readiness packets;
- internal policy or company document corpus packets;
- source-code documentation corpus packets;
- any corpus packet that feeds a retrieval surface, chatbot, advisory agent,
  or LPCI intake chain.

This standard does not govern manifest-level hashes, runtime proof hashes,
embedding vector checksums, or provider receipt tokens. Those are separate
concerns with separate standards.

---

## Authority

This standard is authorized by:

1. NR-04 decision in CI1-T6 Checker Decision document (line 75, Decision
   Table row NR-04): `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md`

2. Stub 1 checker spec (lines 111–119, Stub 1 — per-file sourceHash checker):
   `docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md`

3. CI2 GC-018 authorization (CI2-T1 authorized scope — governance standards
   for per-file source hashes):
   `docs/baselines/CVF_GC018_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_2026-06-02.md`

The T6 decision classified NR-04 as `STRUCTURAL_CHECK_REQUIRED` and specified
that a standard entry in the readiness packet template is the
`STANDARD_REQUIRED_FIRST` prerequisite before the checker stub
(`check_corpus_packet_source_hash`) can be implemented.

---

## Canonical Algorithm

**Algorithm:** SHA-256 applied to the raw byte content of the source file.

**Encoding:** hexadecimal, all lowercase, no prefix.

**Field name:** `sourceHash`

**Companion field:** `sourceHashAlgorithm` — records the algorithm used for
the hash in the corresponding row. Default value: `"sha256"`. Packet authors
must populate this field when recording a non-default algorithm. When omitted,
reviewers may assume `"sha256"` if the packet was produced under this standard.

### Example (Python)

```python
import hashlib

def compute_source_hash(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()
```

### Example field values in a classification ledger row

```json
{
  "sourcePath": "docs/policies/CVF_POLICY_EXAMPLE.md",
  "sourceHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "sourceHashAlgorithm": "sha256"
}
```

---

## What sourceHash IS and IS NOT

| sourceHash IS | sourceHash IS NOT |
| --- | --- |
| SHA-256 of the file's raw byte content | A hash of the file path or filename |
| A per-file drift check control | A manifest-level hash of the entire corpus manifest |
| A snapshot assertion tied to scan time | A semantic hash of document meaning or topics |
| A structural integrity check for ingestion | A runtime proof of retrieval quality |
| Evidence that a specific file has not changed | Authorization for semantic correctness claims |

---

## Field Requirements

### Rule NR-04-A (per-file hash required by default)

Every row in a classification ledger MUST include a non-empty `sourceHash`
field conforming to the canonical algorithm above.

### Rule NR-04-B (manifest proxy exception)

When per-file hashes cannot be computed (for example: read-only legacy
archive, filesystem snapshot without shell access, or operator-sealed corpus),
the packet MAY omit per-row `sourceHash` fields only if ALL of the following
conditions are satisfied:

1. The packet sets `manifestHashProxy: true` at packet level (not row level).
2. The packet includes a non-empty `manifestProxyException` string that states:
   - the reason per-file hashes are unavailable;
   - what the manifest-level hash covers (the manifest file itself, not
     per-file content);
   - the coverage limitation: individual file drift between scan time and
     retrieval time is NOT detectable via the manifest proxy.
3. The packet author and reviewer both acknowledge the weaker drift guarantee
   in the completion review.

The manifest proxy exception is an acceptable interim state; it is not a
permanent exemption. Any corpus packet that graduates from legacy archive
status to active retrieval use must compute per-file hashes before claiming
drift resistance for individual files.

### Rule NR-04-C (sourceHashAlgorithm companion)

When `sourceHash` is present, the companion field `sourceHashAlgorithm` SHOULD
be present in the same row or declared once at packet level when all rows use
the same algorithm. Omitting `sourceHashAlgorithm` is permitted only when the
packet is produced under this standard (implying SHA-256 by default).

---

## Manifest Proxy Exception Rule (detail)

When a packet uses the manifest proxy exception:

```json
{
  "manifestHashProxy": true,
  "manifestProxyException": "Per-file hashes cannot be computed for this corpus because the source archive is read-only and no shell access is available at scan time. The manifest-level hash (SHA-256 of the manifest file) covers only the manifest document itself. Individual file drift between scan time and retrieval time is not detectable via this proxy. Future rescans with shell access must compute per-file sourceHash values."
}
```

The `manifestProxyException` value must be a human-readable statement, not a
code token. It must explain both the reason and the coverage limitation
explicitly. A bare `"no shell access"` string without the coverage limitation
does not satisfy this rule.

---

## Reviewer Verification Rule

A reviewer examining a corpus intelligence readiness packet MUST confirm one
of the following before approving the packet:

**Option A — per-file hashes present:**
Every row in every classification ledger in the packet has a non-empty
`sourceHash` field. The `sourceHashAlgorithm` field is present or the packet
was produced under this standard (implying SHA-256).

**Option B — manifest proxy exception declared:**
The packet sets `manifestHashProxy: true` at packet level AND includes a
non-empty `manifestProxyException` string that names both the reason and the
coverage limitation. The reviewer records this weaker drift guarantee in the
completion review.

If neither condition is satisfied, the reviewer must block the packet from
advancing to retrieval, product intake, or LPCI use.

---

## Checker Spec Stub Reference

The NR-04 structural checker stub is defined in CI1-T6 Checker Decision as
Stub 1 (lines 111–119):

```text
checker-id: check_corpus_packet_source_hash
trigger: any changed corpus intelligence readiness packet under docs/audits/
         or docs/reviews/ that is either docType: audit or has a
         READINESS_PACKET filename marker; docType: review artifacts are
         explicitly excluded.
rule: each classification-ledger row must include a sourceHash field, OR
      the packet-level manifest must declare manifestHashProxy: true with
      an explicit documented trade-off.
prerequisite: NR-04 standard entry in readiness packet template
              (STANDARD_REQUIRED_FIRST satisfied for this stub to become
              executable).
implementation-tranche: separate governed roadmap; not authorized in CI1-T6.
```

**Implementation status:** CI2-T1 authored this standard only. CI2-T2 later
implemented `governance/compat/check_corpus_packet_source_hash.py`, its focused
tests, and hook/autorun wiring. This standard remains the canonical authoring
and review authority for the checker.

---

## T2 Unblock Statement

This standard satisfied the `STANDARD_REQUIRED_FIRST` prerequisite for
Stub 1 (`check_corpus_packet_source_hash`) as stated in
`docs/reference/CVF_CI1_T6_CHECKER_DECISION_2026-06-02.md` lines 111–119.

CI2-T2 implemented the checker after CI2-T1 closure. Future packet authors and
reviewers must still read this standard before claiming NR-04 compliance and
must validate both the per-file hash path and the manifest proxy exception path.

---

## Claim Boundary

This standard is documentation-only. It:

- does NOT implement a checker, guard, hook, test file, or runtime component;
- does NOT mutate any runtime TypeScript or Python source;
- does NOT scan a corpus, read legacy files, or produce a classification ledger;
- does NOT authorize LPCI implementation, chatbot routes, vector stores,
  embeddings, or provider calls;
- does NOT claim semantic correctness, retrieval quality, or production
  readiness for any corpus.

The governed outputs of CI2-T1 were this standard document, the readiness
packet template update (sections 4.4, 4.5, and two new rows in 4.1), and the
CI2-T1 completion review. CI2-T2 separately implemented the structural checker.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard governs the CVF internal corpus intelligence workflow
and references internal GC-018 authorization baselines and CI1 work order
paths that are not exported to the public-sync repository.
