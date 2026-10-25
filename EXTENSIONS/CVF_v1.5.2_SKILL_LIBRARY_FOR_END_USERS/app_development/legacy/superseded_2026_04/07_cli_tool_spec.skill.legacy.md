# CLI Tool Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
>
> - [Tech Stack Selection](./02_tech_stack_selection.skill.md) — Cần biết language/framework sẽ dùng
> - [Architecture Design](./03_architecture_design.skill.md) — Cần hiểu cấu trúc CLI

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Building command-line tools
- Script automation với multiple commands
- Developer utilities

**Không phù hợp khi:**

- GUI application → Dùng [Desktop App Spec](./06_desktop_app_spec.skill.md)
- Single-file simple script
- Web service

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Build |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [07_cli_tool_spec](../../../governance/skill-library/uat/results/UAT-07_cli_tool_spec.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tool Name** | Tên CLI tool | ✅ | "taskflow" hoặc "tf" |
| **Purpose** | Tool làm gì? | ✅ | "Manage tasks from terminal" |
| **Commands** | Các commands chính | ✅ | "add, list, done, search, config" |
| **Target Users** | Ai sẽ dùng? | ✅ | "Developers working in terminal" |
| **Language** | Python/Rust/Go/Node? | ✅ | "Python với Click" |
| **Config Location** | Config lưu ở đâu? | ❌ | "~/.taskflow/config.yaml" |
| **Data Storage** | Lưu data thế nào? | ❌ | "~/.taskflow/tasks.json" |
| **Shell Completion** | Cần autocomplete? | ❌ | "Yes - bash, zsh, fish" |
| **Output Formats** | Formats hỗ trợ? | ❌ | "text, json, table" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# CLI Tool Specification

## Overview
- **Name:** [tool name]
- **Executable:** [binary name]
- **Version:** [version]

## Global Options

| Option | Short | Description |
|--------|-------|-------------|
| --help | -h | Show help |
| --version | -v | Show version |
| --config | -c | Config file path |
| --output | -o | Output format |

## Commands

### [command name]
[Description]

**Usage:**
\`\`\`bash
tool command [options] [arguments]
\`\`\`

**Arguments:**
| Argument | Required | Description |
|----------|:--------:|-------------|
| [arg] | Yes/No | Description |

**Options:**
| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| --flag | -f | Description | value |

**Examples:**
\`\`\`bash
tool command arg --flag value
\`\`\`

[More commands...]

## Configuration

**Location:** ~/.toolname/config.yaml

**Format:**
\`\`\`yaml
setting1: value
setting2: value
\`\`\`

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid usage |
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] All commands documented
- [ ] Arguments và options clear
- [ ] Exit codes defined
- [ ] Config file format shown
- [ ] Examples cho mỗi command

**Red flags (cần Reject):**

- ⚠️ Missing examples
- ⚠️ Unclear arguments
- ⚠️ No exit codes
- ⚠️ Inconsistent option naming

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Too many commands | Start với 5-7 core commands |
| Inconsistent flags | Use same style: --verbose / -v |
| No examples | 2-3 examples per command |
| Silent failures | Always output something |
| No config | Even simple tools need config |

---

## 💡 Tips

1. **Verb-First Commands** — `add`, `list`, `delete` (not `task-add`)
2. **Consistent Flags** — -v for verbose, -q for quiet everywhere
3. **Examples are Docs** — Show real-world usage
4. **Exit Codes Matter** — Scripts depend on them
5. **Sensible Defaults** — Zero-config to start

---

## 📊 Common Patterns

### CRUD Pattern

```bash
tool add <item>
tool list [--filter]
tool show <id>
tool edit <id>
tool delete <id>
```

### Config Pattern

```bash
tool config get <key>
tool config set <key> <value>
tool config list
```

### Interactive Pattern

```bash
tool init          # Interactive setup
tool wizard        # Guided flow
tool --interactive # Force prompts
```

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Tool Name: stockflow-cli
Use Cases: bulk import products, export low-stock report
Environments: Admin laptop, CI jobs
Auth: API token
```

### Output mẫu

```markdown
# stockflow-cli Spec

## Commands
- import products --file products.csv --dry-run
- report low-stock --warehouse w_1 --format csv
- sync --force

## Example
stockflow import products --file products.csv --dry-run
```

### Đánh giá

- ✅ Command rõ và có flags
- ✅ Hỗ trợ dry-run
- ✅ Phù hợp automation
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Desktop App Spec](./06_desktop_app_spec.skill.md)
- [Local Deployment Spec](./08_local_deployment.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có CLI Spec → [Local Deployment Spec](./08_local_deployment.skill.md) (nếu cần đóng gói) hoặc → Build Phase (Phase C)

---

*CLI Tool Spec Skill — CVF v1.5.2 Skill Library*
