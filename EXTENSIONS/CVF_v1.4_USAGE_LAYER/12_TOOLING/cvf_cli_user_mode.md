# 🔧 CVF CLI – User Mode

**CVF v1.4 – Usage Layer**

---

## Tổng quan

CLI User Mode wrap các command CVF v1.3 với giao diện đơn giản hơn cho end-user.

User không cần biết về execution rules, trace, hay audit — chỉ cần submit intent.

---

## Yêu cầu

- **CVF v1.3 SDK** đã cài đặt
- Xem: [CVF v1.3 CLI Setup](../../CVF_v1.3_IMPLEMENTATION_TOOLKIT/cli/)

```bash
# Cài đặt CVF CLI
pip install cvf-sdk

# Verify
cvf --version
```

---

## Commands cho User

### Submit Intent với Preset

```bash
# Submit intent với preset analysis
cvf user submit --preset analysis --intent "Phân tích rủi ro của việc migrate sang microservices"

# Submit intent với preset decision_support
cvf user submit --preset decision --intent "Khuyến nghị database cho real-time analytics"

# Submit intent với file
cvf user submit --preset technical_review --file ./code_to_review.py
```

### Xem các Preset có sẵn

```bash
# List tất cả presets
cvf user presets

# Output:
# Available presets:
#   analysis       - Phân tích, hiểu vấn đề
#   decision       - Hỗ trợ ra quyết định
#   content        - Tạo nội dung
#   technical      - Review kỹ thuật
```

### Xem kết quả

```bash
# Xem kết quả gần nhất
cvf user result --last

# Xem kết quả theo ID
cvf user result --id abc123

# Export kết quả
cvf user result --last --format markdown > result.md
```

---

## Flow nội bộ (User không cần biết)

```
User: cvf user submit --preset analysis --intent "..."
         │
         ▼
┌─────────────────────────────┐
│  1. Validate Intent (v1.4)  │
│     - Check format          │
│     - Map to preset         │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  2. Build Contract (v1.3.1) │
│     - Input contract        │
│     - Execution rules       │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  3. Execute via CVF Core    │
│     - Controlled execution  │
│     - Trace (internal)      │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  4. Format Output (v1.4 UX) │
│     - User-friendly format  │
│     - Hide trace            │
└─────────────────────────────┘
```

---

## Khác biệt với Operator Mode

| Feature | User Mode | Operator Mode |
|---------|:---------:|:-------------:|
| View trace | ❌ | ✅ |
| Custom execution rules | ❌ | ✅ |
| Audit access | ❌ | ✅ |
| Preset required | ✅ | ❌ |
| Direct input contract | ❌ | ✅ |
| Modify output | ❌ | ✅ |

---

## Error Handling

User mode hiển thị lỗi thân thiện:

```bash
# Thay vì: ValidationError: Input contract missing required field 'objective'
# User thấy:
# ❌ Yêu cầu chưa đủ thông tin. Vui lòng mô tả rõ hơn bạn muốn đạt được gì.
```

---

## Ví dụ sử dụng đầy đủ

```bash
# 1. Xem presets
cvf user presets

# 2. Submit intent
cvf user submit \
  --preset analysis \
  --intent "Tôi muốn hiểu các rủi ro khi deploy containerized app lên production" \
  --context "Stack: Docker, K8s. Team: 5 devs. First time using containers."

# 3. Đợi kết quả (async)
# Processing... [████████████████████] 100%

# 4. Xem kết quả
cvf user result --last
```

---

*CLI User Mode thuộc CVF v1.4 Usage Layer*  
*Powered by CVF v1.3.1 Operator Edition*
