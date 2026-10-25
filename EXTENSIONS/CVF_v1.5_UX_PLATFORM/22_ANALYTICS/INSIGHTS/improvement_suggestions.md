# 💡 Improvement Suggestions

**CVF v1.5 — Analytics Insights**

---

## Overview

Tự động generate suggestions để improve input và outcomes.

---

## Suggestion Types

| Type | Trigger | Example |
|------|---------|---------|
| **Input** | Before submit | "Add more context" |
| **Template** | Template selection | "Try Risk Assessment instead" |
| **Retry** | After reject | "Be more specific about..." |
| **Learning** | Over time | "Users like you often..." |

---

## Input Suggestions

### Before Submit

```
┌─────────────────────────────────────────┐
│ 💡 Suggestions to improve results:      │
│                                         │
│ • Add specific numbers/metrics          │
│ • Include timeline constraints          │
│ • Mention key stakeholders              │
└─────────────────────────────────────────┘
```

### Trigger Rules

```typescript
const inputSuggestions = [
  {
    condition: (input) => input.length < 100,
    suggestion: 'Consider adding more context for better results',
    priority: 'high'
  },
  {
    condition: (input) => !containsNumbers(input),
    suggestion: 'Adding specific numbers/metrics improves accuracy',
    priority: 'medium'
  },
  {
    condition: (input) => !mentionsTimeline(input),
    suggestion: 'Including timeline helps scope the analysis',
    priority: 'low'
  }
];
```

---

## Template Suggestions

### Based on Input Analysis

```typescript
function suggestTemplate(input: string): TemplateSuggestion[] {
  const keywords = extractKeywords(input);
  
  const suggestions = templates
    .map(t => ({
      template: t,
      score: calculateRelevance(t, keywords)
    }))
    .filter(s => s.score > 0.7)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  return suggestions;
}
```

### Display

```
┌─────────────────────────────────────────┐
│ 🎯 Recommended Templates                │
│                                         │
│ 1. Strategy Analysis (95% match)        │
│ 2. Risk Assessment (82% match)          │
│ 3. Competitor Review (70% match)        │
└─────────────────────────────────────────┘
```

---

## Retry Suggestions

### After Reject

```
┌─────────────────────────────────────────┐
│ 💡 To improve results, try:             │
│                                         │
│ Based on your reject reason:            │
│ "Output too vague"                      │
│                                         │
│ Suggestions:                            │
│ • Be more specific about the market     │
│ • Add concrete examples                 │
│ • Define success criteria clearly       │
│                                         │
│ [Apply Suggestions]  [Edit Manually]    │
└─────────────────────────────────────────┘
```

---

## Learning Suggestions

### Based on History

```typescript
function generateLearningSuggestions(userId: string): Suggestion[] {
  const history = getUserHistory(userId);
  const patterns = analyzePatterns(history);
  
  const suggestions = [];
  
  // High success pattern
  if (patterns.highSuccessTemplate) {
    suggestions.push({
      type: 'learning',
      message: `You have 90% success with ${patterns.highSuccessTemplate}`,
      action: 'continue'
    });
  }
  
  // Improvement opportunity
  if (patterns.lowSuccessTemplate) {
    suggestions.push({
      type: 'learning',
      message: `Try adding more context when using ${patterns.lowSuccessTemplate}`,
      action: 'improve'
    });
  }
  
  return suggestions;
}
```

---

## Suggestion Priority

| Priority | Display | Frequency |
|:--------:|---------|-----------|
| High | Alert banner | Always |
| Medium | Inline hint | On hover |
| Low | Help section | On request |

---

*Improvement Suggestions — CVF v1.5 Analytics*
