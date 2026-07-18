# CVF LPCI2-T11 Real Use-Case Bundle Inventory

Memory class: FULL_RECORD

Status: REVIEWED_PASS_BOUNDED

docType: bundle_inventory

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI2_T11A_SUPPLEMENT_REAL_USE_CASE_BUNDLE_INVENTORY_FOR_CLAUDE_2026-06-07.md`

executionBaseHead: `34f1c4ec`

bundleRoot: `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex`

---

## Purpose

T11A supplement: filesystem metadata inventory and lineage mapping for the full
real use-case bundle. No document body extraction, OCR, summarization, or
semantic evaluation performed.

---

## Scope / Applies To

This inventory applies only to files present under the external
`Law use case_Codex` bundle at enumeration time. It includes source inputs, the
operator request artifact, pre-CVF extracted text artifacts, and pre-CVF rendered
output variants.

It does not apply to any later document versions, online legal sources, current
law validation, body text extraction, semantic evaluation, corpus ingestion,
runtime search behavior, provider behavior, public-sync, or release readiness.

---

## Scope / Target / Owner Boundary

Target directory:

`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex`

Worker-owned evidence is limited to filesystem enumeration, file sizes,
SHA-256 hashes, artifact roles, and folder-level lineage. Codex owns review,
closure, session sync, and any later T11B/T11C/T11D work orders.

---

## Bundle Structure

```
Law use case_Codex/
  3094.pdf                                          [source_input]
  BC- Ket qua ra soat du an cham trien khai *.pdf   [source_input]
  Kien nghi thanh uy ha noi (1).docx               [source_input]
  Phu luc danh sach du an.pdf                       [source_input]
  QD cham dut.pdf                                   [source_input]
  Request for agent.docx                            [agent_request]
  Thong bao thu hoi 24 du an.pdf                    [source_input]
  _extracted_text/
    3094.txt                                        [ungoverned_extracted_text]
    BC- Ket qua ra soat ... Phu Xuyen *.txt         [ungoverned_extracted_text]
    INDEX.txt                                       [ungoverned_extracted_text]
    Kien nghi thanh uy ha noi (1).txt               [ungoverned_extracted_text]
    Phu luc danh sach du an.txt                     [ungoverned_extracted_text]
    QD cham dut.txt                                 [ungoverned_extracted_text]
    Thong bao thu hoi 24 du an.txt                  [ungoverned_extracted_text]
  _rendered_don_kien_nghi/
    Don kien nghi (sua lai) - Truong CD KTKT.docx   [rendered_output_variant]
    Don_kien_nghi_sau_QD_thu_hoi_03-06-2026.docx    [rendered_output_variant]
```

---

## Bundle Inventory Table

| Artifact ID | Relative Path | Extension | Size (bytes) | Bundle Artifact Role | Ungoverned Codex Baseline | SHA-256 |
|---|---|---|---|---|---|---|
| `BNDL-001` | `3094.pdf` | `.pdf` | 842159 | `source_input` | `false` | `61fafa4b69e9b0423c9bd3533ba6b5be531b9b73c26c6cfb62933008bfecc4d5` |
| `BNDL-002` | `BC- Kết quả rà soát dự án chậm triển khai - Phú Xuyên 10.5.2026.pdf` | `.pdf` | 933326 | `source_input` | `false` | `2e7ed68a7814ff04e8246dbfb179f928d4d952b30169685f73115f2702459adc` |
| `BNDL-003` | `Kien nghi thành ủy hà nội (1).docx` | `.docx` | 45314 | `source_input` | `false` | `265047c2ca26b13f2c6212313f550f3ce0f66f85bd7470ec9c3618d4c54cb4f6` |
| `BNDL-004` | `Phu luc danh sach du an.pdf` | `.pdf` | 537770 | `source_input` | `false` | `cf4fa584fc62ea1edc9c9d27e7396040c7036b2f313c8f5586df04d5529ee46e` |
| `BNDL-005` | `QD chấm dứt.pdf` | `.pdf` | 1292455 | `source_input` | `false` | `47460fdfbdde10d69ae4838b711e086f4037cfd2609d6a4263caefbb1e9fabe7` |
| `BNDL-006` | `Request for agent.docx` | `.docx` | 15248 | `agent_request` | `false` | `29281becea319d5985298cd34a6a66a6b1e2a051a4f157a254d18aebfa734806` |
| `BNDL-007` | `Thong bao thu hoi 24 du an.pdf` | `.pdf` | 1076338 | `source_input` | `false` | `4522d37bf8da78fb41d01d97cdb2bff3f7133af2b02e146f3537132ce603bee6` |
| `BNDL-008` | `_extracted_text/3094.txt` | `.txt` | 10745 | `ungoverned_extracted_text` | `true` | `34b5a6d06ec6e58ed88dd73a30450ba571437b9c663c62582d998b05f6894823` |
| `BNDL-009` | `_extracted_text/BC- Kết quả rà soát dự án chậm triển khai - Phú Xuyên 10.5.2026.txt` | `.txt` | 14434 | `ungoverned_extracted_text` | `true` | `701a422e010ce5750e2d9b2ebc2ab4b2fa418cc47557bedbf8145ef842dad2f0` |
| `BNDL-010` | `_extracted_text/INDEX.txt` | `.txt` | 411 | `ungoverned_extracted_text` | `true` | `86e1dd47c8634e422cd470dae996eacfb2c4dbef03f492d1921b264ce741148f` |
| `BNDL-011` | `_extracted_text/Kien nghi thành ủy hà nội (1).txt` | `.txt` | 32252 | `ungoverned_extracted_text` | `true` | `47739804e5a4bc756067e275349205f1c56c4d2452c7b848699127f1a3ff0330` |
| `BNDL-012` | `_extracted_text/Phu luc danh sach du an.txt` | `.txt` | 4411 | `ungoverned_extracted_text` | `true` | `6dc4f5337f127669bd29cae321c3b7b5e6bdcf80c48a91d9871bebf085dea3af` |
| `BNDL-013` | `_extracted_text/QD chấm dứt.txt` | `.txt` | 8142 | `ungoverned_extracted_text` | `true` | `55b2a731a4ebe628e4e0de1a1af70b8ee61599cc3211928e32d63af77b77938f` |
| `BNDL-014` | `_extracted_text/Thong bao thu hoi 24 du an.txt` | `.txt` | 2499 | `ungoverned_extracted_text` | `true` | `2d2921d6b6aeaab21d4481e2592a4911e15b0b13c6eb9027917269d39a813b0f` |
| `BNDL-015` | `_rendered_don_kien_nghi/Don kien nghi (sua lai) - Truong CD KTKT.docx` | `.docx` | 19909 | `rendered_output_variant` | `true` | `a84fe4d5101ff80ab30dadc5df6e0c6ecf2a79c72f66e971dbe339b5bc204133` |
| `BNDL-016` | `_rendered_don_kien_nghi/Don_kien_nghi_sau_QD_thu_hoi_03-06-2026.docx` | `.docx` | 42322 | `rendered_output_variant` | `true` | `fbf527cc89588139b3d9e46d151578cb7ab07b9faa18de8fc3fb1c20788ce2fc` |

**Total artifact count: 16**

---

## Role Counts

| Role | Count |
|---|---|
| `source_input` | 6 |
| `agent_request` | 1 |
| `ungoverned_extracted_text` | 7 |
| `rendered_output_variant` | 2 |
| **Total** | **16** |

---

## Lineage Map

```
agent_request
  BNDL-006  Request for agent.docx
    references source_input files:
      BNDL-001  3094.pdf
      BNDL-002  BC- Ket qua ra soat du an cham trien khai *.pdf
      BNDL-003  Kien nghi thanh uy ha noi (1).docx
      BNDL-004  Phu luc danh sach du an.pdf
      BNDL-005  QD cham dut.pdf
      BNDL-007  Thong bao thu hoi 24 du an.pdf

ungoverned_extracted_text (derived from source_input files by pre-CVF Codex)
  BNDL-008  _extracted_text/3094.txt              <- BNDL-001
  BNDL-009  _extracted_text/BC-*.txt              <- BNDL-002
  BNDL-011  _extracted_text/Kien nghi*.txt        <- BNDL-003
  BNDL-012  _extracted_text/Phu luc*.txt          <- BNDL-004
  BNDL-013  _extracted_text/QD cham dut.txt       <- BNDL-005
  BNDL-014  _extracted_text/Thong bao*.txt        <- BNDL-007
  BNDL-010  _extracted_text/INDEX.txt             (index manifest, no direct source parent)

rendered_output_variant (generated by pre-CVF Codex from extracted text + request)
  BNDL-015  _rendered_don_kien_nghi/Don kien nghi (sua lai) - Truong CD KTKT.docx
  BNDL-016  _rendered_don_kien_nghi/Don_kien_nghi_sau_QD_thu_hoi_03-06-2026.docx
```

**Lineage interpretation:** `source_input` files were provided as real case
inputs. `agent_request` specifies the task for Codex. Codex extracted text
from each source into `_extracted_text/` (pre-CVF, ungoverned). Codex then
generated petition draft variants into `_rendered_don_kien_nghi/` (pre-CVF,
ungoverned). The entire bundle constitutes the baseline of prior ungoverned
Codex behavior that CVF corpus/memory/context governance will compare against.

---

## Ungoverned Codex Baseline Summary

| Artifact class | Ungoverned baseline | Count |
|---|---|---|
| `source_input` | false — originals, not generated | 6 |
| `agent_request` | false — originals, not generated | 1 |
| `ungoverned_extracted_text` | **true** — pre-CVF extraction | 7 |
| `rendered_output_variant` | **true** — pre-CVF generation | 2 |

Artifacts marked `ungovernedCodexBaseline=true` represent prior Codex outputs
without CVF scan-layer, memory-context, or boundary governance. They are
preserved as evidence for later CVF context comparison. They must not be
promoted to corpus ingestion without a separate governed authorization.

---

## EC-02 Boundary Statement

The source input files are the same six files inventoried in the original T11A
work order. All carry `ec02Applies=true` from that inventory. No current-law
claim is made for any source or derived artifact in this bundle.

---

## Claim Boundary

This inventory claims only filesystem metadata, file hashes, and folder-level
lineage roles observed at enumeration time. It does not claim:

- document readability or extracted text correctness;
- source authenticity or legal authority;
- extraction quality or completeness;
- current-law status or effective date;
- legal advice quality;
- corpus ingestion eligibility;
- search runtime behavior;
- production, hosted, public, or release readiness.

---

## Note On Filenames

Source filenames include Vietnamese Unicode characters. The inventory table
records exact original filesystem filenames as source evidence per the
existing-filename exception in
`docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`.
ASCII-transliterated display names are used in the lineage map section for
prose readability only.
