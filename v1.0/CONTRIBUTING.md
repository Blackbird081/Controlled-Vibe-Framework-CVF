# CONTRIBUTING  
## Controlled Vibe Framework (CVF)

---

## Nguyên tắc đóng góp

CVF v1.0 đang ở trạng thái **FREEZE**. Điều này có nghĩa:

- ❌ **KHÔNG** chấp nhận thay đổi logic, cấu trúc, hoặc vai trò file
- ❌ **KHÔNG** merge PR làm thay đổi nội dung core
- ✅ **CHỈ** chấp nhận sửa lỗi chính tả, typo, formatting

---

## Đóng góp cho phiên bản mới (v1.1+)

Nếu bạn muốn đề xuất tính năng mới hoặc thay đổi logic:

1. **Mở Issue** mô tả rõ:
   - Vấn đề cần giải quyết
   - Đề xuất cách tiếp cận
   - Tác động đến framework hiện tại

2. **Chờ phản hồi** từ maintainer

3. **Nếu được chấp thuận**, đóng góp sẽ được đưa vào **v1.1** hoặc phiên bản tiếp theo

---

## Quy trình đóng góp

### 1. Fork repository
```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
```

### 2. Tạo branch mới
```bash
git checkout -b fix/typo-readme
# hoặc
git checkout -b feature/v1.1-input-output-spec
```

### 3. Commit theo convention
```bash
git commit -m "fix: sửa typo trong README.md"
# hoặc
git commit -m "feat(v1.1): thêm INPUT_OUTPUT_SPEC.md"
```

### 4. Push và tạo Pull Request
```bash
git push origin fix/typo-readme
```

---

## Commit Convention

| Prefix | Mô tả |
|--------|-------|
| `fix:` | Sửa lỗi chính tả, typo |
| `docs:` | Cập nhật documentation |
| `feat(v1.1):` | Tính năng mới cho v1.1 |
| `refactor:` | Tái cấu trúc (chỉ cho version mới) |

---

## Liên hệ

Nếu có thắc mắc, vui lòng mở Issue trên GitHub.

---

**Cảm ơn bạn đã quan tâm đến CVF!**
