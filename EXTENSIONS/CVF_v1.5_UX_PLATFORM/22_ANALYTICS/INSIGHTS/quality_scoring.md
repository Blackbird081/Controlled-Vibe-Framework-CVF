# ⭐ Quality Scoring

**CVF v1.5 — Analytics Insights**

---

## Overview

Automated quality scoring cho mọi execution output.

---

## Score Components

| Component | Weight | Range |
|-----------|:------:|:-----:|
| **Structure** | 25% | 0-10 |
| **Completeness** | 25% | 0-10 |
| **Clarity** | 25% | 0-10 |
| **Actionability** | 25% | 0-10 |

**Final Score** = weighted average (0-10)

---

## Scoring Criteria

### Structure (25%)
```
10: All expected sections present, proper hierarchy
8:  Most sections present, minor hierarchy issues
6:  Some sections missing or misplaced
4:  Significant structural problems
2:  No clear structure
```

### Completeness (25%)
```
10: All required elements + bonus insights
8:  All required elements present
6:  Most required elements present
4:  Several elements missing
2:  Minimal content
```

### Clarity (25%)
```
10: Crystal clear, no ambiguity
8:  Very clear, minor unclear points
6:  Mostly clear, some confusion
4:  Significant clarity issues
2:  Confusing or contradictory
```

### Actionability (25%)
```
10: Clear next steps, specific recommendations
8:  Good recommendations, mostly specific
6:  Some recommendations, vague
4:  Few actionable items
2:  No actionable output
```

---

## Automated Assessment

```typescript
interface QualityAssessment {
  overall: number;
  breakdown: {
    structure: number;
    completeness: number;
    clarity: number;
    actionability: number;
  };
  issues: string[];
  strengths: string[];
}

function assessQuality(output: string, template: Template): QualityAssessment {
  const structure = assessStructure(output, template);
  const completeness = assessCompleteness(output, template);
  const clarity = assessClarity(output);
  const actionability = assessActionability(output);
  
  const overall = (structure + completeness + clarity + actionability) / 4;
  
  return {
    overall: Math.round(overall * 10) / 10,
    breakdown: { structure, completeness, clarity, actionability },
    issues: identifyIssues(output, template),
    strengths: identifyStrengths(output, template)
  };
}
```

---

## Structure Assessment

```typescript
function assessStructure(output: string, template: Template): number {
  let score = 10;
  
  // Check for expected sections
  const expectedSections = template.expectedSections;
  const foundSections = extractSections(output);
  
  const missingCount = expectedSections.filter(
    s => !foundSections.includes(s)
  ).length;
  
  score -= missingCount * 2;
  
  // Check heading hierarchy
  if (!hasProperHierarchy(output)) {
    score -= 2;
  }
  
  return Math.max(0, score);
}
```

---

## Quality Thresholds

| Score | Label | Action |
|:-----:|-------|--------|
| 9-10 | ⭐ Excellent | Auto-accept suggestion |
| 7-8 | ✅ Good | Normal review |
| 5-6 | ⚠️ Acceptable | Careful review |
| 3-4 | ❌ Poor | Recommend reject |
| 0-2 | 🚫 Fail | Auto-reject |

---

## Display

```
┌─────────────────────────────────────────┐
│ Quality Score: 8.5/10 ✅ Good           │
│ ─────────────────────────────────────── │
│                                         │
│ Structure:      ⭐⭐⭐⭐⭐ 10           │
│ Completeness:   ⭐⭐⭐⭐☆  8           │
│ Clarity:        ⭐⭐⭐⭐⭐  9           │
│ Actionability:  ⭐⭐⭐⭐☆  7           │
│                                         │
│ ✅ Strong analysis structure            │
│ ✅ Clear recommendations                │
│ ⚠️ Could be more specific on timeline  │
└─────────────────────────────────────────┘
```

---

*Quality Scoring — CVF v1.5 Analytics*
