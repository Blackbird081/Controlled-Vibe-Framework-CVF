# ⚡ Performance Review Template

**Domain:** Technical  
**Preset:** `technical`

---

## Mô tả ngắn

Phân tích performance của hệ thống, database, hoặc code.

---

## Khi nào dùng

- Slow query investigation
- System optimization
- Capacity planning
- Performance regression

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Component | ✅ | text | Phần cần review |
| Symptoms | ✅ | textarea | Vấn đề đang gặp |
| Metrics | ❌ | textarea | Data có sẵn |
| Target | ❌ | text | Performance goal |

---

## Intent Pattern

```
INTENT:
Tôi cần review performance của [component].

CONTEXT:
- Component: [database/API/frontend/etc.]
- Symptoms: [slow queries, high latency, etc.]
- Current metrics: [response time, throughput, etc.]
- Target: [< 200ms, 1000 rps, etc.]

SUCCESS CRITERIA:
- Identify bottlenecks
- Root cause analysis
- Optimization recommendations
- Estimated improvement
```

---

## Output Expected

```markdown
## Performance Review: [Component]

### Current State
| Metric | Current | Target | Gap |
|--------|:-------:|:------:|:---:|
| Response Time | 800ms | 200ms | 4x |
| Throughput | 100 rps | 500 rps | 5x |
| Error Rate | 2% | <0.1% | 20x |

### Bottleneck Analysis
1. **[Bottleneck 1]** - [impact: 60% of latency]
2. **[Bottleneck 2]** - [impact: 25% of latency]

### Root Causes
- [Cause 1]: [explanation]
- [Cause 2]: [explanation]

### Optimization Recommendations
| Priority | Action | Effort | Expected Improvement |
|:--------:|--------|:------:|:--------------------:|
| 1 | [action] | 2 days | 50% latency reduction |
| 2 | [action] | 1 week | 3x throughput |

### Quick Wins
- [Win 1] - [5 minutes, 20% improvement]
- [Win 2] - [1 hour, 30% improvement]

### Long-term Improvements
[Architectural changes for sustainable performance]
```

---

## Examples

### Ví dụ: Database

```
INTENT:
Tôi cần review performance của PostgreSQL database.

CONTEXT:
- Component: PostgreSQL 15
- Symptoms: Queries > 5s, timeout during peak
- Metrics: 10M rows, 50 concurrent connections
- Target: < 500ms average query time

SUCCESS CRITERIA:
- Identify slow queries
- Index recommendations
- Query optimization
```

---

*Template thuộc CVF v1.5 UX Platform*
