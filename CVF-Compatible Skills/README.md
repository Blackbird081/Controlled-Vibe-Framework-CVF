# CVF-Compatible Skills

> **Behavioral Directives cho AI Agent** | **Đối tượng:** Non-coder | **Ngôn ngữ:** Tiếng Việt

## 📋 Tổng quan

Folder này chứa **16 Behavioral Directives** — các quy tắc hành vi ngắn gọn giúp AI agent tuân thủ CVF khi phục vụ người dùng **không biết lập trình**. Mỗi directive có 3 phần:

- **Context** — Khi nào kích hoạt
- **Constraints** — Những việc CẤM làm
- **Definition of Done** — Tiêu chuẩn hoàn thành

## 🔗 Quan hệ với CVF

| Layer | Vai trò |
|---|---|
| CVF User Skills (v1.5.2) | 141 form-based templates cho người dùng |
| CVF Agent Skills (v1.6) | 34 agent tools với governance records |
| **→ CVF-Compatible Skills** | **16 behavioral rules cho Non-coder workflows** |
| CVF Safety Runtime (v1.7) | 5-layer kernel architecture |

Các directives này **bổ sung** cho hệ thống skill chính, không thay thế. Chúng đặc biệt hữu ích khi:
- AI phục vụ người dùng không biết code
- Dự án sử dụng Streamlit + SQLite + Python
- Cần giao tiếp hoàn toàn bằng tiếng Việt

## 📊 Phân loại

| Nhóm | Skills | Focus |
|---|---|---|
| 🔧 Quản trị (Core) | #1–4 | Standardization, Vibe translation, QA, Safety |
| 💻 Thực thi (Dev) | #5–7 | Streamlit UI, SQLite, Vibe Logic |
| 🛟 Hỗ trợ (Support) | #8–10 | Debug, UX, Documentation |
| ⚡ Nâng cao (Pro) | #11–14 | Token saving, Self-healing, Packaging, Init |
| 📊 Dữ liệu (Data) | #15–16 | Excel import, Trend prediction |

## 🔄 CVF Overlap Map

Một số directives có overlap một phần với agent skills hiện tại, nhưng focus khác (đơn giản hơn, tiếng Việt, Non-coder):

| Directive | CVF Agent Skill tương ứng |
|---|---|
| The Critic (#3) | AGT-031 Code Review |
| Human-in-the-loop (#4) | v1.7.1 Refusal Router |
| Streamlit Master (#5) | AGT-029 Frontend Forge |
| Local SQLite (#6) | AGT-028 Database Architect |
| Self-Healing (#12) | AGT-022/023 Problem-Solving/Debug |
| Token Efficiency (#11) | AGT-021 Context Engineering |
| Excel to SQLite (#15) | AGT-017/028 Doc Converter/DB |

## 💡 Cách sử dụng

Paste nội dung [CVF_SKILLS_INDEX.md](CVF_SKILLS_INDEX.md) cho AI:

> *"Đây là kho kỹ năng của tôi. Hãy tuân thủ CVF và sử dụng các Skill phù hợp để thực thi dự án này."*

## 📁 Cấu trúc

```
CVF-Compatible Skills/
├── CVF_SKILLS_INDEX.md           ← Danh sách 16 skills
├── README.md                     ← File này
├── analytics/                    ← Trend Prediction
├── data/                         ← SQLite, Excel Converter
├── deployment/                   ← Portable Packaging
├── development/                  ← Streamlit Master
├── docs/                         ← Auto Documentation
├── economy/                      ← Token Efficiency
├── governance/                   ← Standardization, Project Init
├── interface/                    ← Vibe-to-Spec, Vibe Logic
├── logic/                        ← Non-coder Debug, Self-Healing
├── quality/                      ← The Critic
├── safety/                       ← Human-in-the-loop
└── ux/                           ← Grandma Test
```
