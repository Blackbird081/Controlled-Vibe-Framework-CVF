# Incident Response Plan

> **Domain:** Security & Compliance  
> **Difficulty:** Advanced  
> **CVF Version:** v1.5.2  
> **Inspired by:** antigravity-awesome-skills/incident-response

## 🎯 Mục đích

Xây dựng hoặc review Incident Response Plan. Đảm bảo team prepared để handle security incidents và breaches effectively.

**Khi nào nên dùng:**
- Chưa có incident response plan
- Annual plan review
- Sau khi có incident xảy ra
- Compliance requirements (SOC 2, ISO 27001)

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Company Size** | ✅ | Startup, SMB, Enterprise |
| **Industry** | ✅ | Tech, Finance, Healthcare, etc. |
| **Current Plan** | ❌ | Existing IRP if any |
| **Past Incidents** | ❌ | Previous incident history |
| **Critical Systems** | ✅ | Most important systems/data |
| **Team Structure** | ❌ | Who handles incidents |

---

## ✅ Checklist - Preparation Phase

### Team & Roles
- [ ] Incident Response Team identified?
- [ ] Roles và responsibilities clear?
- [ ] Contact info updated (24/7)?
- [ ] Backup contacts for each role?
- [ ] Escalation paths defined?

### Tools & Resources
- [ ] Có incident management tool?
- [ ] Communication channels (Slack, phone)?
- [ ] Access to logs và forensics tools?
- [ ] Backup restoration tested?
- [ ] War room location (virtual/physical)?

### Documentation
- [ ] Runbooks for common incidents?
- [ ] System architecture diagrams?
- [ ] Data flow documentation?
- [ ] Vendor contact list?
- [ ] Legal/PR contacts?

### Training
- [ ] Team trained on procedures?
- [ ] Tabletop exercises conducted?
- [ ] New team members onboarded?
- [ ] Regular drills scheduled?

---

## ✅ Checklist - Detection & Analysis

### Detection
- [ ] Monitoring systems in place?
- [ ] Alert thresholds defined?
- [ ] On-call rotation?
- [ ] Incident classification criteria?

### Initial Analysis
- [ ] Scope assessment process?
- [ ] Impact evaluation criteria?
- [ ] Severity levels defined?
- [ ] Initial triage checklist?

---

## ✅ Checklist - Containment & Eradication

### Short-term Containment
- [ ] Isolation procedures?
- [ ] Network segmentation ready?
- [ ] Account suspension process?
- [ ] Service shutdown procedures?

### Long-term Containment
- [ ] Root cause analysis process?
- [ ] Evidence preservation?
- [ ] Forensic imaging capability?

### Eradication
- [ ] Malware removal procedures?
- [ ] System rebuild/restore?
- [ ] Credential rotation?
- [ ] Patch application?

---

## ✅ Checklist - Recovery & Post-Incident

### Recovery
- [ ] Service restoration priority?
- [ ] Validation testing?
- [ ] Monitoring enhancement?
- [ ] User communication?

### Post-Incident
- [ ] Incident report template?
- [ ] Lessons learned process?
- [ ] Plan update procedure?
- [ ] Improvement tracking?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Impact | Fix |
|-----|--------|-----|
| **No plan exists** | Chaos during incident | Create basic plan |
| **Outdated contacts** | Can't reach people | Monthly updates |
| **No practice** | Slow response | Quarterly drills |
| **Single point of failure** | Key person unavailable | Backup for each role |
| **No communication plan** | PR disaster | Pre-approved templates |
| **Poor documentation** | Reinventing wheel | Detailed runbooks |

---

## 💡 Tips & Examples

### Incident Severity Levels:
| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **SEV1** | Critical - Business down | 15 min | Data breach, ransom |
| **SEV2** | High - Major impact | 1 hour | Partial outage |
| **SEV3** | Medium - Limited impact | 4 hours | Minor security issue |
| **SEV4** | Low - Minimal impact | 24 hours | Policy violation |

### CSIRT Team Roles:
```markdown
## Core Team
- **Incident Commander:** Overall coordination
- **Technical Lead:** Investigation, remediation
- **Communications Lead:** Internal/external comms
- **Legal Advisor:** Legal implications
- **Executive Sponsor:** Decision authority

## Extended Team
- IT Operations
- Security Team
- PR/Communications
- HR (if people involved)
- Customer Support
```

### Incident Response Playbook Template:
```markdown
# [Incident Type] Playbook

## Detection
- Alert sources
- Indicators of compromise

## Triage (First 15 min)
1. Confirm incident
2. Assess immediate risk
3. Notify on-call
4. Open incident channel

## Containment
1. [Specific steps]
2. [Specific steps]

## Investigation
1. Collect logs from [systems]
2. Check [indicators]
3. Interview [people if needed]

## Remediation
1. [Recovery steps]
2. [Validation steps]

## Communication
- Internal: [template]
- External: [template]
- Regulatory: [checklist]
```

### Communication Templates:
```markdown
## Internal (Slack/Email)
🚨 [SEV X] Incident: [Brief description]
Status: [Investigating/Contained/Resolved]
Impact: [Who/what affected]
Lead: @[name]
Channel: #incident-[number]

## Customer Notice
We are aware of [issue] affecting [service].
Our team is actively working on resolution.
ETA: [time or "investigating"]
Updates: [status page/email]
```

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Plan Assessment** - Overall readiness
2. **Gap Analysis** - What's missing
3. **Role Definitions** - Team structure
4. **Playbook Templates** - For common incidents
5. **Communication Templates** - Internal/external
6. **Training Recommendations** - Drills and exercises
7. **Metrics to Track** - Response time KPIs

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*
