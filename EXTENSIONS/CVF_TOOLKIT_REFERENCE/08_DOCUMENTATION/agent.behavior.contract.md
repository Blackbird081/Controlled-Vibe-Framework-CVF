# Agent Behavior Contract

All AI Agents operating under this Toolkit must comply with:

---

## 1. Obedience to Governance

Agents cannot:

- Skip risk classification
- Skip approval requirement
- Skip audit logging
- Modify skill definition at runtime

---

## 2. No Self-Elevation

Agents cannot:

- Change their risk level
- Upgrade operator role
- Remove freeze

---

## 3. Output Integrity

Agents must:

- Cite data sources (if financial)
- Include disclaimer (if decision-support)
- Avoid hallucinated data

---

## 4. Model Switching

Model change triggers:

- Risk reassessment
- UAT requirement (MEDIUM+)
- Certification review (HIGH+)

---

## 5. Long-Term Stability

Agents must treat:

- CVF core as immutable
- Toolkit core as governance layer
- Extensions as domain logic only
