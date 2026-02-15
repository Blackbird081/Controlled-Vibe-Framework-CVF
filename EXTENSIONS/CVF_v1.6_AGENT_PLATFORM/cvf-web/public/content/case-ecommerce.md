# Case Study 3: E-Commerce Platform — CVF for Content Moderation

**Date:** January 2026  
**Industry:** E-Commerce  
**Team Size:** 50+ (10 Content Moderators, 8 AI Engineers, 5 Product, 27 Support)  
**CVF Version:** v1.1

---

## Challenge

**Situation:**  
ShopHub, a marketplace with 500K sellers and 50M SKUs, struggled with:
- **Scale problem**: 10K+ listings/day, impossible to manually review all
- **False positives**: AI flagged legitimate products as policy violations
- **Appeal process broken**: Sellers had no recourse when AI made mistakes
- **Liability**: Incorrectly removing sellers' listings = potential legal risk

**Gap:** AI was making content policy decisions at scale with no human oversight or appeal process.

---

## Solution: CVF v1.1 with Tiered Review

### Architecture

```
New Listing Upload
    ↓
INPUT_SPEC: Listing format, image quality, prohibited categories
    ↓
Skill Contract: review_listing_policy (R1 for auto-approve, R2 for flag)
    ↓
IF confidence > 95%: Auto-approve (R0 decision)
   ELSE IF confidence 70-95%: Send to human reviewer (R2 decision)
   ELSE: Reject (R1 decision, allow appeal)
    ↓
Trace: Confidence scores, policy rules triggered, human reviewer notes
    ↓
OUTPUT_SPEC: Listing approved/rejected with explanation
    ↓
Seller notification + appeal option for rejected listings
```

### Implementation (Week 1-3)

**Week 1: Define Policy Spec**
- INPUT_SPEC: Listing title, description, images, category, seller history
- OUTPUT_SPEC: Approved / Needs Review / Rejected, plus explanation
- Policy rules: Prohibited items (weapons, fake products), misleading claims, quality standards

**Week 2: Skill Contracts + Tiers**
- R0 (Auto-approve): Confidence >95%, known seller, clear policy compliance
- R1 (Auto-reject with appeal): Confidence <50% on violations, clear policy breach
- R2 (Human review): Confidence 50-95%, borderline cases, new seller, policy edge case

**Week 3: Human Review Workflow**
- Reviewer can: Approve, Reject, Request Seller Info
- Trace: Every decision logged with reviewer ID, time, reasoning
- Appeal: Rejected listings go to appeal queue (secondary human reviewer)

---

## Results

### Operational Metrics (First month)

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| **Listings reviewed/day** | 100 manual | 8,000 mixed | +80x |
| **Manual review time/listing** | 5 min | 1 min (only 10% require review) | -80% |
| **False positive rate** | 5% (reviewer error) | 2% (AI + review) | -60% |
| **False negative rate** | 3% (missed violations) | 0.5% (AI catch) | -83% |
| **Appeal rate** | 15% (high frustration) | 3% (lower when explained) | -80% |
| **Appeal approval rate** | 20% (many bad rejections) | 5% (stricter policy now) | -75% |
| **Seller satisfaction** | 3.2/5.0 | 4.1/5.0 | +28% |

### Business Impact

**Content Team Efficiency:**
- Reduced review team from 12 to 3 (redirected 9 people to policy/appeals)
- Can now focus on:
  - Policy edge cases (not volume screening)
  - Seller appeals (dignified review process)
  - Fraud pattern detection (proactive, not reactive)

**Seller Trust:**
- Clear explanation with every rejection improves acceptance
- Appeal process (human review) = sellers feel heard
- Transparency: "AI flagged, human verified" builds confidence

---

## CVF Elements Used

| Element | Usage |
|---------|-------|
| **INPUT_SPEC** | ✅ Listing format, required metadata, image requirements |
| **OUTPUT_SPEC** | ✅ Approval status, policy rule triggered, explanation for seller |
| **Skill Contracts** | ✅ R0 (auto-approve), R1 (auto-reject + appeal), R2 (human review) |
| **Confidence Tiers** | ✅ Different contracts based on AI confidence |
| **Human Review** | ✅ Secondary reviewer for appeals |
| **Trace** | ✅ Every decision logged with rationale |
| **Workflow** | ✅ Appeal process built into execution |

---

## Key Learnings

**1. Confidence Thresholds Matter**  
Tiering by confidence (>95% auto-approve, <50% auto-reject, 50-95% human) = best of both

**2. Appeals = Legitimacy**  
Having a human appeal process (even if approval rate low) increases seller trust significantly

**3. Explanation Reduces Disputes**  
When rejection includes "Your listing violates policy X: description claims not verified" — sellers accept it

**4. Scale Requires Automation**  
Manual only = bottleneck; AI only = unfair; hybrid = working solution

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Edge cases in policy** | Build R2 queue for human decision |
| **Seller gaming system** | Monitor appeal patterns, adjust thresholds |
| **New policies** | Quickly label examples, retrain confidence scores |
| **Appeal reviewer bias** | Cross-check appeals (2x reviewer), calibration meetings |

---

## Recommendation

**For e-commerce/content moderation:**
- Use **confidence-based tiering** (R0 high-confidence auto, R2 borderline human, R1 low-confidence auto-reject)
- **Always have appeals** — even if approval rate low, process validates system
- **Clear explanations** reduce disputes by 80%
- **Hybrid scaling** (AI + human) beats pure AI or pure manual at enterprise scale

**Timeline:** 2-3 weeks to MVP, ongoing calibration needed
