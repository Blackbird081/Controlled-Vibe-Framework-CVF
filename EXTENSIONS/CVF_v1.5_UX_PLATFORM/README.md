> [!WARNING]
> **v1.5 UX Platform đã FROZEN (maintenance-only).** Vui lòng sử dụng **v1.6 Agent Platform** tại [`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`](../CVF_v1.6_AGENT_PLATFORM/cvf-web/) — bao gồm tất cả tính năng v1.5 + AI Agent Chat, Multi-Agent Workflow, và nhiều hơn nữa.

# CVF v1.5 — USER EXPERIENCE PLATFORM

> **User không cần biết CVF để dùng CVF**

---

## Đây là gì?

CVF v1.5 là **lớp trải nghiệm người dùng (UX Platform)** đặt trên CVF v1.4.x, được thiết kế để:

- 🌐 **Web Interface** — Không cần CLI
- 📚 **Template Library** — Chọn sẵn, không cần viết prompt
- 📊 **Analytics** — Tự cải thiện theo thời gian

---

## User Journey

```
┌─────────────────────────────────────────────────┐
│  1. Mở Web UI                                   │
│  2. Chọn Template (Business / Tech / Content)   │
│  3. Điền form đơn giản                          │
│  4. Submit → Nhận kết quả                       │
│  5. Accept / Reject                             │
└─────────────────────────────────────────────────┘
```

**Bạn KHÔNG cần:**
- ❌ Học CVF
- ❌ Viết prompt
- ❌ Dùng CLI
- ❌ Hiểu execution rules

---

## Cấu trúc

```
CVF_v1.5_UX_PLATFORM/
│
├── README.md                 ← (file này)
├── ROADMAP.md                ← Kế hoạch triển khai
├── CHANGELOG.md
│
├── 20_WEB_INTERFACE/         ← UI specs & implementation
│   ├── DESIGN/
│   ├── SPECS/
│   └── IMPLEMENTATION/
│
├── 21_TEMPLATE_LIBRARY/      ← 15+ templates sẵn sàng
│   ├── BUSINESS/
│   ├── TECHNICAL/
│   ├── CONTENT/
│   └── RESEARCH/
│
├── 22_ANALYTICS/             ← Tracking & insights
│   ├── TRACKING/
│   ├── INSIGHTS/
│   └── REPORTS/
│
└── GOVERNANCE/               ← Policies
```

---

## Quick Start

### Dùng Templates (Ngay bây giờ)

1. Vào `21_TEMPLATE_LIBRARY/`
2. Chọn domain: `BUSINESS/`, `TECHNICAL/`, `CONTENT/`
3. Mở template phù hợp
4. Copy intent pattern, điền thông tin
5. Submit qua CVF CLI hoặc Web UI

### Dùng Web UI (Coming soon)

1. Mở `http://localhost:3000`
2. Chọn template
3. Điền form
4. Submit

---

## Nguyên tắc bất biến

✅ Không override CVF core rules  
✅ Không bypass audit/trace  
✅ User chỉ focus vào intent  
✅ Có thể bỏ v1.5 mà CVF vẫn chạy  

---

## Dependencies

| Layer | Version | Status |
|-------|:-------:|:------:|
| CVF Core | v1.3.x | ✅ FROZEN |
| Usage Layer | v1.4.x | ✅ FROZEN |
| UX Platform | v1.5 | ✅ FROZEN |

---

## Status

**Policy:** v1.5 đóng băng (maintenance-only). Các cải tiến mới chuyển sang v1.6, trong khi v1.5.2 Skill Library tiếp tục mở rộng để v1.6 thừa hưởng.

- **ROADMAP.md** — ✅ Complete (Frozen)
- **21_TEMPLATE_LIBRARY** — ✅ Complete (Frozen)
- **20_WEB_INTERFACE** — ✅ Complete (Frozen)
- **22_ANALYTICS** — ✅ Complete (Frozen)

---

*CVF v1.5 — Making CVF accessible to everyone*
