# CLI Tool Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Phase:** Design (Phase B)

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

### Input mẫu:
```
Tool Name: taskflow (alias: tf)
Purpose: Manage tasks from terminal
Commands: add, list, done, delete, search, config
Users: Developers
Language: Python + Click
Config: ~/.taskflow/config.yaml
Data: ~/.taskflow/tasks.db (SQLite)
Completion: bash, zsh
Output: text, json
```

### Output mẫu:
```markdown
# TaskFlow CLI Specification

## Overview
- **Name:** TaskFlow
- **Executable:** `taskflow` (alias: `tf`)
- **Version:** 1.0.0
- **Language:** Python 3.10+
- **Framework:** Click

## Installation

\`\`\`bash
pip install taskflow-cli
# or
pipx install taskflow-cli
\`\`\`

## Global Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| --help | -h | Show help | - |
| --version | -V | Show version | - |
| --config | -c | Config file path | ~/.taskflow/config.yaml |
| --output | -o | Output format (text/json) | text |
| --verbose | -v | Verbose output | false |
| --quiet | -q | Suppress output | false |

---

## Commands

### add
Add a new task

**Usage:**
\`\`\`bash
tf add <title> [options]
\`\`\`

**Arguments:**
| Argument | Required | Description |
|----------|:--------:|-------------|
| title | Yes | Task title |

**Options:**
| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| --category | -c | Task category | inbox |
| --due | -d | Due date (YYYY-MM-DD) | none |
| --priority | -p | Priority (1-3) | 2 |

**Examples:**
\`\`\`bash
tf add "Buy groceries"
tf add "Finish report" -c work -d 2024-02-01
tf add "Urgent task" -p 1
\`\`\`

---

### list
List tasks

**Usage:**
\`\`\`bash
tf list [options]
\`\`\`

**Options:**
| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| --all | -a | Include completed | false |
| --category | -c | Filter by category | all |
| --status | -s | pending/done | pending |
| --limit | -n | Number of tasks | 20 |

**Examples:**
\`\`\`bash
tf list                    # Pending tasks
tf list -a                 # All tasks
tf list -c work            # Work category only
tf list -s done --limit 5  # Last 5 completed
tf list -o json            # JSON output
\`\`\`

**Output (text):**
\`\`\`
ID  TITLE              CATEGORY    DUE         STATUS
1   Buy groceries      personal    -           pending
2   Finish report      work        2024-02-01  pending
3   Call mom           personal    2024-02-02  pending
\`\`\`

**Output (json):**
\`\`\`json
[
  {"id": 1, "title": "Buy groceries", "category": "personal", "status": "pending"},
  ...
]
\`\`\`

---

### done
Mark task as complete

**Usage:**
\`\`\`bash
tf done <id>
\`\`\`

**Arguments:**
| Argument | Required | Description |
|----------|:--------:|-------------|
| id | Yes | Task ID |

**Examples:**
\`\`\`bash
tf done 1
tf done 1 2 3  # Multiple IDs
\`\`\`

---

### delete
Delete a task

**Usage:**
\`\`\`bash
tf delete <id> [options]
\`\`\`

**Options:**
| Option | Short | Description |
|--------|-------|-------------|
| --force | -f | Skip confirmation |

**Examples:**
\`\`\`bash
tf delete 1          # With confirmation
tf delete 1 -f       # Force delete
tf delete 1 2 3 -f   # Delete multiple
\`\`\`

---

### search
Search tasks

**Usage:**
\`\`\`bash
tf search <query> [options]
\`\`\`

**Examples:**
\`\`\`bash
tf search "meeting"
tf search "project" -c work
\`\`\`

---

### config
Manage configuration

**Subcommands:**
\`\`\`bash
tf config list           # Show all settings
tf config get <key>      # Get setting value
tf config set <key> <value>  # Set value
tf config reset          # Reset to defaults
\`\`\`

**Available Settings:**
| Key | Description | Default |
|-----|-------------|---------|
| default_category | Default category for new tasks | inbox |
| date_format | Display date format | YYYY-MM-DD |
| color | Enable colors | true |

**Examples:**
\`\`\`bash
tf config set default_category work
tf config get date_format
\`\`\`

---

## Shell Completion

\`\`\`bash
# Bash
eval "$(_TASKFLOW_COMPLETE=bash_source taskflow)"

# Zsh
eval "$(_TASKFLOW_COMPLETE=zsh_source taskflow)"

# Fish
_TASKFLOW_COMPLETE=fish_source taskflow | source
\`\`\`

## Configuration File

**Location:** ~/.taskflow/config.yaml

\`\`\`yaml
# TaskFlow Configuration
default_category: inbox
date_format: YYYY-MM-DD
color: true
editor: vim

# Database
database_path: ~/.taskflow/tasks.db

# Aliases (optional)
aliases:
  a: add
  l: list
  d: done
\`\`\`

## Data Storage

- **Database:** ~/.taskflow/tasks.db (SQLite)
- **Config:** ~/.taskflow/config.yaml
- **Logs:** ~/.taskflow/taskflow.log

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid command/usage |
| 3 | Task not found |
| 4 | Database error |
| 5 | Config error |

## Error Messages

\`\`\`
Error: Task #42 not found
Error: Invalid date format. Use YYYY-MM-DD
Error: Category 'foo' does not exist. Use: work, personal, inbox
\`\`\`
```

### Đánh giá:
- ✅ All commands documented
- ✅ Clear arguments/options
- ✅ Examples provided
- ✅ Exit codes defined
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có CLI Spec → Build Phase (Phase C)

---

*CLI Tool Spec Skill — CVF v1.5.2 Skill Library*
