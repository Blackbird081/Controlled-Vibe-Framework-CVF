# Case Study 2: Healthcare SaaS — CVF for AI-Assisted Diagnostics

**Date:** January 2026  
**Industry:** Healthcare Technology  
**Team Size:** 25 (5 ML Engineers, 8 Clinical Staff, 12 Product/Support)  
**CVF Version:** v1.2

---

## Challenge

**Situation:**  
MediScan, a healthcare SaaS providing AI-assisted radiology screening, faced:
- **Liability exposure**: Hospitals worried about AI recommendations influencing physician decisions
- **Validation chaos**: No standardized way to validate AI outputs before clinical use
- **Integration friction**: Different hospital systems had different governance requirements
- **Regulatory uncertainty**: FDA wanted proof of human oversight for all AI decisions

**Gap:** AI was generating diagnostic suggestions, but no framework to ensure physician remained decision-maker.

---

## Solution: CVF v1.2 with Skill Contracts

### Architecture

**Key Challenge:** Make AI a support tool, never autonomous decision-maker

```
Patient Scan Upload
    ↓
INPUT_SPEC validation (scan quality, metadata)
    ↓
Skill Contract: diagnose_radiology (R3 - CRITICAL)
    ↓
Execute: AI generates 3 possible diagnoses + confidence scores
    ↓
Trace: Which anatomical regions flagged, confidence by region, model version used
    ↓
Human Review: Radiologist reviews AI suggestions + original scan
    ↓
OUTPUT_SPEC: Radiologist decision + relationship to AI output
    ↓
Patient Report + Liability acknowledgment
```

### Implementation (Week 1-4)

**Week 1-2: Skill Contract Design**  
Created `diagnose_radiology` contract:
- Input: DICOM image, patient demographics, prior scans, clinical history
- Output: Top 3 diagnoses, confidence per diagnosis, anatomical findings, recommendation (approve AI / request second opinion / reject)
- Risk level: **R3** — system-wide impact on patient care
- Human approval: **MANDATORY** — physician must review and approve
- Audit: **CRITICAL** — logged to hospital EMR system
- Liability: Physician remains decision-maker, AI is support

**Week 3: Validation Framework**  
Established OUTPUT_SPEC with validation:
- Radiologist must confirm/modify each AI finding
- Confidence score must meet threshold (>85%) OR require manual review
- Prior scan comparison (AI flagged change but physician might disagree)
- Final report must include: "Reviewed with AI assistance" statement

**Week 4: Integration + Compliance**  
- Connected to hospital EHR systems (FHIR compliance)
- Set up audit logging to hospital compliance system
- Created liability documentation proving physician oversight
- Trained radiologists on new workflow (half-day training)

---

## Results

### Clinical Metrics (90-day pilot with 4 hospitals)

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| **Time/scan** | 8-10 min (radiologist alone) | 6-7 min (AI + radiologist) | -25% time |
| **Diagnostic accuracy** | 94% baseline | 97.5% (with AI suggestions) | +3.5pp |
| **Missed findings** | 2% baseline | 0.5% | -75% |
| **Physician confidence** | High (experienced radiologist) | Very High (AI safety net) | +30% |
| **Liability incidents** | 3 over 12 months | 0 over 3 months (pilot) | TBD at scale |
| **Radiologist burnout** | High (fatigue on long days) | Lower (AI catches edge cases) | Qualitative ↓ |

### Business Impact

**Hospital Adoption:**
- 4 hospitals expanded to 12 hospitals in 6 months
- Average case volume: +15% (radiologists can handle more cases)
- Throughput not just speed — also reduced errors (liability reduction)

**Regulatory Wins:**
- FDA pre-submission meeting: Approved architecture (human-in-loop + R3 contract)
- State medical boards: No concerns (clear audit trail)
- Hospital legal teams: Comfortable with liability structure

---

## CVF Elements Used

| Element | Purpose |
|---------|---------|
| **Skill Contract (R3)** | ✅ Enforced human physician approval for every diagnosis |
| **INPUT_SPEC** | ✅ Scan quality requirements, required metadata |
| **OUTPUT_SPEC** | ✅ Diagnosis format, liability statement, physician signature |
| **Human Approval** | ✅ Zero AI decisions without physician review |
| **Audit Logging** | ✅ Every suggestion logged to hospital EMR for compliance |
| **Liability Model** | ✅ Clear: Physician = decision maker, AI = support |
| **v1.2 Extensions** | ✅ Capability versioning, external skill ingestion |

---

## Key Learnings

**1. R3 Contracts = Patient Safety**  
Highest risk level with mandatory human approval was essential for regulatory confidence

**2. Audit Trail = Liability Reduction**  
Complete record of AI suggestions + physician decisions = stronger legal defense

**3. Workflow Integration Matters**  
Simply inserting AI into existing workflow doesn't work — must redesign workflow with AI as support

**4. Transparency Builds Trust**  
Radiologists initially skeptical; showed them: "AI catches things you miss, you catch AI errors"

---

## Technical Debt & Future

**Current Challenges:**
- Different hospitals want different OUTPUT_SPEC (some want ML confidence scores, others don't)
- Integrating with 20+ EMR systems = significant engineering effort
- Regulatory compliance varies by jurisdiction (FDA vs state boards)

**Next Phase (Year 2):**
- Capability registry for versioned skills (different diagnoses by organ system)
- External skill ingestion (hospital can plug in custom training data)
- Monitoring dashboard for radiologist feedback loop

---

## Recommendation

**For healthcare AI:**
- **Always use R3 contracts** for clinical decision support
- **Mandatory human approval** is not optional — it's liability insurance
- **Clear OUTPUT_SPEC** saves months of regulatory back-and-forth
- **Audit trail is your friend** — complete record protects both provider and patient

**Timeline:** 4-6 weeks for healthcare integration (depends on EHR complexity)
