# Data Handling Review

> **Domain:** Security & Compliance  
> **Difficulty:** Medium  
> **CVF Version:** v1.5.2  
> **Inspired by:** antigravity-awesome-skills/data-handling

## 🎯 Mục đích

Đánh giá cách organization xử lý, lưu trữ, và bảo vệ data. Đảm bảo data lifecycle management theo best practices và compliance.

**Khi nào nên dùng:**
- Setup data governance
- Annual data audit
- New data source/system
- Compliance preparation

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả |
|-------|----------|-------|
| **Data Types** | ✅ | PII, PCI, PHI, Business data |
| **Data Sources** | ✅ | Where data comes from |
| **Storage Systems** | ✅ | Databases, cloud, files |
| **Data Flows** | ✅ | How data moves |
| **Current Controls** | ❌ | Existing security measures |
| **Regulations** | ❌ | GDPR, HIPAA, PCI-DSS |

---

## ✅ Checklist - Data Classification

### Data Inventory
- [ ] All data sources identified?
- [ ] Data types categorized?
- [ ] Owners assigned cho mỗi dataset?
- [ ] Data flow diagrams documented?

### Classification Levels
- [ ] Classification scheme defined?
- [ ] Labels applied to data?
- [ ] Handling rules per level?
- [ ] Regular reclassification?

### Sensitive Data
- [ ] PII identified và mapped?
- [ ] PCI data scope minimized?
- [ ] PHI properly segregated?
- [ ] Trade secrets protected?

---

## ✅ Checklist - Data Collection

### Minimization
- [ ] Only necessary data collected?
- [ ] Retention limits defined?
- [ ] Collection methods documented?

### Consent
- [ ] Proper consent obtained?
- [ ] Purpose stated clearly?
- [ ] Opt-out mechanism?

### Source Validation
- [ ] Data quality checks?
- [ ] Third-party source vetting?
- [ ] Import validation rules?

---

## ✅ Checklist - Data Storage

### Security
- [ ] Encryption at rest?
- [ ] Access controls (RBAC)?
- [ ] Audit logging enabled?
- [ ] Regular access reviews?

### Availability
- [ ] Backup procedures?
- [ ] Disaster recovery plan?
- [ ] Backup testing schedule?
- [ ] Geographic redundancy?

### Retention
- [ ] Retention periods defined?
- [ ] Automated deletion?
- [ ] Archive policies?
- [ ] Legal hold capability?

---

## ✅ Checklist - Data Processing

### Security During Processing
- [ ] Encryption in transit?
- [ ] Secure processing environments?
- [ ] No data in temporary files/logs?
- [ ] Memory protection?

### Third-Party Processing
- [ ] Vendor agreements (DPA)?
- [ ] Security assessments?
- [ ] Subprocessor visibility?
- [ ] Cross-border transfer compliance?

---

## ✅ Checklist - Data Disposal

### Secure Deletion
- [ ] Deletion procedures documented?
- [ ] Cryptographic erasure for encrypted data?
- [ ] Physical destruction for hardware?
- [ ] Certificate of destruction?

### Verification
- [ ] Deletion verification?
- [ ] Audit trail of deletions?
- [ ] Backup data included?

---

## ⚠️ Lỗi Thường Gặp

| Lỗi | Risk | Fix |
|-----|------|-----|
| **No data inventory** | Unknown exposure | Map all data |
| **Unclear ownership** | Accountability gaps | Assign owners |
| **Over-collection** | Liability increase | Collect minimum |
| **No encryption** | Breach exposure | Encrypt all sensitive |
| **Indefinite retention** | Compliance risk | Define retention limits |
| **Insecure deletion** | Data recovery | Secure erase procedures |

---

## 💡 Tips & Examples

### Data Classification Levels:
| Level | Description | Examples | Controls |
|-------|-------------|----------|----------|
| **Public** | No harm if disclosed | Marketing, docs | None |
| **Internal** | Internal use only | Procedures, plans | Basic access |
| **Confidential** | Limited disclosure | Customer data, PII | Encryption, RBAC |
| **Restricted** | Strict controls | PCI, PHI, secrets | Max security |

### Data Lifecycle:
```
Collection → Processing → Storage → Usage → Archival → Disposal
     ↓           ↓           ↓         ↓         ↓          ↓
  Consent    Encryption   Access    Logging   Retention  Secure
             validation   control   audit     policy     deletion
```

### Encryption Standards:
| Use Case | Recommendation |
|----------|---------------|
| At rest | AES-256 |
| In transit | TLS 1.3 |
| Database fields | Tokenization or encryption |
| Backups | Same as production |
| Key management | HSM or KMS |

### Data Flow Documentation Template:
```markdown
## Data Flow: [Name]

**Source:** [System/User]
**Destination:** [System]
**Data Elements:** [List]
**Classification:** [Level]
**Transfer Method:** [API/File/etc]
**Security Controls:**
- [ ] Encrypted in transit (TLS)
- [ ] Source authenticated
- [ ] Destination validated
- [ ] Logged for audit
```

### Retention Schedule Example:
| Data Type | Retention | Reason |
|-----------|-----------|--------|
| User accounts | Active + 1 year | Business need |
| Transaction records | 7 years | Tax/legal |
| Access logs | 2 years | Security audit |
| Marketing consent | Until withdrawal | GDPR |
| Backups | 30 days | Recovery |

---

## 📤 Expected Output từ AI

Khi paste spec này vào AI, bạn sẽ nhận được:

1. **Data Governance Score** - Overall maturity
2. **Data Inventory** - Classification of known data
3. **Gap Analysis** - Missing controls
4. **Risk Assessment** - Exposure areas
5. **Policy Templates** - Data handling policies
6. **Retention Schedule** - Recommended periods
7. **Implementation Roadmap** - Priority improvements

---

*CVF Skill Library v1.5.2 | Security & Compliance Domain*
