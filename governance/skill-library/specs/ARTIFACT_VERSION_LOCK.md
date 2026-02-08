# Artifact Version Lock Specification

> **Created:** Feb 08, 2026  
> **Purpose:** Đảm bảo traceability giữa `.skill.md` (source) và `.gov.md` (governance record)

---

## 1. Vấn Đề

Khi `.skill.md` được cập nhật (nội dung, version), `.gov.md` tương ứng có thể trở nên **stale** mà không ai biết. Cần cơ chế tự động phát hiện drift giữa hai artifact.

---

## 2. Schema

Thêm block `## Version Lock` vào mỗi `.gov.md`:

```markdown
## Version Lock

| Field | Value |
|-------|-------|
| Skill Version | 1.0.1 |
| Skill Hash | a3f2b1 |
| Locked At | 2026-02-08 |
| Lock Status | ✅ SYNCED |
```

### Trường

| Field | Type | Mô tả |
|-------|------|--------|
| `Skill Version` | semver | Version từ header `.skill.md` |
| `Skill Hash` | hex (6 chars) | SHA-256 truncated của nội dung `.skill.md` |
| `Locked At` | date | Ngày tạo/cập nhật lock |
| `Lock Status` | enum | `✅ SYNCED` / `⚠️ DRIFT` / `❌ BROKEN` |

---

## 3. Lock States

| State | Icon | Meaning |
|-------|------|---------|
| SYNCED | ✅ | `.gov.md` version_lock khớp với `.skill.md` hiện tại |
| DRIFT | ⚠️ | `.skill.md` đã thay đổi, `.gov.md` chưa cập nhật |
| BROKEN | ❌ | Source link broken hoặc `.skill.md` không tồn tại |

---

## 4. Detection Logic

```python
# Pseudocode
for gov_file in registry:
    skill_path = resolve_source_link(gov_file)
    if not skill_path.exists():
        status = "BROKEN"
    else:
        current_hash = sha256(skill_path.read())[:6]
        current_version = extract_version(skill_path)
        if gov_file.lock_hash == current_hash:
            status = "SYNCED"
        else:
            status = "DRIFT"
```

---

## 5. Quy Trình

### 5.1 Khi tạo `.gov.md` mới
1. Script `generate_user_skills.py` tự động inject `## Version Lock` block
2. Hash và version lấy từ `.skill.md` tại thời điểm generate

### 5.2 Khi cập nhật `.skill.md`
1. Chạy `check_version_sync.py` → phát hiện DRIFT
2. Developer review changes
3. Chạy `check_version_sync.py --fix` → cập nhật hash + version + date

### 5.3 CI/CD Integration
- `validate_registry.py` gọi version lock check
- DRIFT → warning (không fail build)
- BROKEN → error (fail build)

---

## 6. CLI Usage

```bash
# Check all governance files
python check_version_sync.py

# Check specific domain
python check_version_sync.py --domain ai_ml_evaluation

# Auto-fix drifted locks
python check_version_sync.py --fix

# Dry run (preview changes)
python check_version_sync.py --fix --dry-run

# JSON output
python check_version_sync.py --json
```

---

## 7. Backward Compatibility

- `.gov.md` files **without** `## Version Lock` block → reported as `NOT_LOCKED`
- `check_version_sync.py --fix` will **add** the block to unlocked files
- Existing validation (`validate_registry.py`) NOT affected — version lock is additive
