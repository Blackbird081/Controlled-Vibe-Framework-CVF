# Architecture Review

> **Domain:** Technical Review  
> **Difficulty:** ⭐⭐⭐ Advanced  
> **CVF Version:** v1.5.2

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Review system design documents
- Evaluate architecture decisions
- Identify scalability concerns
- Check for best practices
- Compare architecture options

**Không phù hợp khi:**
- Code-level review → Code Review
- Security-specific → Security Audit
- Performance benchmarking → Cần load testing

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Architecture** | Design description/diagram | ✅ | [description or diagram] |
| **Requirements** | Functional requirements | ✅ | "1M users, real-time updates" |
| **Constraints** | Technical constraints | ✅ | "AWS only, budget $5K/month" |
| **Scale** | Expected load | ✅ | "10K concurrent users" |
| **Concerns** | Known worries | ❌ | "Worried about database bottleneck" |

---

## ✅ Expected Output

**Kết quả:**
- Architecture assessment
- Strengths và weaknesses
- Scalability analysis
- Recommendations
- Alternative options

**Cấu trúc output:**
```
ARCHITECTURE REVIEW

1. OVERVIEW
   - Summary of proposed architecture
   - Key components

2. ASSESSMENT BY AREA
   
   SCALABILITY
   - Current capacity estimate
   - Bottlenecks identified
   - Scaling strategy
   
   RELIABILITY
   - Single points of failure
   - Disaster recovery
   - Fault tolerance
   
   MAINTAINABILITY
   - Complexity assessment
   - Coupling issues
   - Technical debt risks
   
   COST
   - Estimated running costs
   - Cost optimization opportunities

3. STRENGTHS
   ✅ [What's good]

4. CONCERNS
   ⚠️ [Issues to address]

5. RECOMMENDATIONS
   - Priority 1: [action]
   - Priority 2: [action]

6. ALTERNATIVES CONSIDERED
   Option A vs Option B comparison
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Addresses all constraint areas
- [ ] Identifies bottlenecks
- [ ] Provides alternatives
- [ ] Recommendations actionable
- [ ] Considers cost
- [ ] Scalability assessed

**Red flags (cần Reject):**
- ⚠️ Missing scalability analysis
- ⚠️ Ignores stated constraints
- ⚠️ No concrete recommendations
- ⚠️ Generic without specifics

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Too theoretical | Provide specific requirements |
| Missing scale analysis | State expected load clearly |
| Ignores costs | Include budget constraint |
| No alternatives | Ask explicitly for options |

---

## 💡 Tips

1. **Provide diagrams** — Visual helps understanding
2. **State scale clearly** — Users, requests/second
3. **Include budget** — Constraints costs decisions
4. **Mention technology preferences** — Cloud provider, languages
5. **Ask for trade-offs** — Pros/cons of each choice

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Architecture: E-commerce platform
- React frontend → API Gateway → Microservices → PostgreSQL
- Services: User, Product, Order, Payment
- Each service has own database (PostgreSQL)
- Redis for caching
- RabbitMQ for async

Requirements: Handle flash sales (100K concurrent users)
Constraints: AWS, budget $10K/month
Scale: Normal 10K, peak 100K concurrent
Concerns: Database bottleneck during flash sales
```

### Output mẫu:
```
ARCHITECTURE REVIEW: E-Commerce Platform

1. OVERVIEW
   Microservices architecture with 4 core services.
   Follows database-per-service pattern.
   Good foundation but needs optimization for flash sales.

2. ASSESSMENT

   SCALABILITY ⭐⭐⭐ (7/10)
   ━━━━━━━━━━━━━━━━━━━━━━━
   Current: Can handle 20K concurrent (estimate)
   Target: 100K concurrent (flash sales)
   
   Bottlenecks:
   • PostgreSQL write capacity during orders
   • API Gateway may throttle at 50K
   • Payment service single-threaded
   
   Recommendations:
   • Add read replicas for Product DB
   • Implement order queue (already have RabbitMQ)
   • Consider DynamoDB for Order write-heavy
   
   RELIABILITY ⭐⭐⭐⭐ (8/10)
   ━━━━━━━━━━━━━━━━━━━━━━━
   Good:
   • Service isolation
   • Message queue for async
   
   Concerns:
   • Single PostgreSQL per service = SPOF
   • No mention of multi-AZ
   
   Recommendations:
   • Add RDS Multi-AZ for critical DBs
   • Implement circuit breakers
   
   COST 💰 $8-12K/month (estimate)
   ━━━━━━━━━━━━━━━━━━━━━━━
   • RDS x 4: $2K
   • EC2/ECS for services: $3K
   • Redis/RabbitMQ: $1K
   • API Gateway: $1K
   • Data transfer: $1K
   
   Optimization: Use reserved instances

3. STRENGTHS
   ✅ Clean service separation
   ✅ Async messaging for decoupling
   ✅ Caching layer present
   ✅ Scalable horizontally

4. CONCERNS
   ⚠️ PostgreSQL won't handle 100K writes/sec
   ⚠️ No CDN mentioned for static assets
   ⚠️ Payment service needs redundancy

5. RECOMMENDATIONS

   Priority 1 (Before flash sale):
   • Implement order queue + async processing
   • Add CDN for product images
   • Load test to 100K
   
   Priority 2:
   • Consider DynamoDB for orders
   • Add read replicas
   • Implement circuit breakers

6. ALTERNATIVES

   Option A: Keep PostgreSQL + Heavy caching
   - Pro: Simpler, known tech
   - Con: Limited write scale
   
   Option B: DynamoDB for hot path (Orders)
   - Pro: Handles any write load
   - Con: Learning curve, consistency model
   
   Recommendation: Start with A, plan for B
```

### Đánh giá:
- ✅ Addresses all areas (scale, reliability, cost)
- ✅ Specific bottlenecks identified
- ✅ Actionable recommendations with priority
- ✅ Alternatives with trade-offs
- ✅ Within stated constraints
- **Kết quả: ACCEPT**

---

*Architecture Review Skill — CVF v1.5.2 Skill Library*
