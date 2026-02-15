# Hướng dẫn: Dự án CVF Đầu tiên

**Thời gian:** 30 phút  
**Cấp độ:** Người mới bắt đầu  
**Bạn sẽ xây dựng:** Một trình quản lý bookmark CLI bằng Python  
**Bạn sẽ học:** Quy trình đầy đủ 4 phase của CVF

---

## Trước khi Bắt đầu

Bạn cần:
- Trình soạn thảo (VS Code, hoặc bất kỳ trình nào khác)
- Trợ lý AI (ChatGPT, Claude, Copilot, hoặc Giao diện Web CVF)
- Python 3.10+ đã cài đặt (cho ví dụ trong hướng dẫn này)

Không cần cài đặt CVF — chúng ta sử dụng CVF lõi (chỉ file Markdown).

---

## Bước 1: Thiết lập Thư mục Dự án

```bash
mkdir bookmark-manager
cd bookmark-manager

# Create CVF structure
mkdir specs decisions traces src

# Create empty files
touch specs/INPUT_SPEC.md
touch specs/OUTPUT_SPEC.md
touch decisions/DECISION_LOG.md
```

Thư mục của bạn bây giờ trông như thế này:

```
bookmark-manager/
├── specs/
│   ├── INPUT_SPEC.md
│   └── OUTPUT_SPEC.md
├── decisions/
│   └── DECISION_LOG.md
├── traces/
└── src/
```

---

## Bước 2: Phase A — Khám phá

Mở `specs/INPUT_SPEC.md` và viết những gì bạn muốn:

```markdown
# Bookmark Manager CLI

## Objective
Build a command-line tool to save, list, search, and delete bookmarks.
Each bookmark has a URL, title, and optional tags.

## Functional Requirements
1. `add <url> <title> [--tags tag1,tag2]` — Save a bookmark
2. `list` — Show all bookmarks (newest first)
3. `search <query>` — Search by title or tag
4. `delete <id>` — Delete a bookmark by ID
5. `export` — Export all bookmarks to JSON file

## Out of Scope
- Web UI (CLI only)
- Browser extension
- Bookmark importing from browsers
- User accounts / authentication
- Cloud sync

## Tech Stack
- Python 3.10+
- SQLite for storage (stdlib, no install)
- argparse for CLI (stdlib)
- No external dependencies

## Constraints
- Single-user (no auth needed)
- Data stored in `~/.bookmarks.db`
- Output formatted as table (readable in terminal)

## Acceptance Criteria
- [ ] Can add a bookmark with URL, title, and tags
- [ ] Can list all bookmarks in a table
- [ ] Can search by title (partial match) and by tag
- [ ] Can delete a bookmark by ID
- [ ] Can export to bookmarks.json
- [ ] Handles edge cases: duplicate URL, empty search, invalid ID
- [ ] Help text shows when running with no arguments
```

Bây giờ viết `specs/OUTPUT_SPEC.md`:

```markdown
# Output Specification

## Expected Deliverables
1. `src/bookmarks.py` — Main CLI application (single file)
2. `README.md` — Usage instructions

## Quality Bar
- Works with Python 3.10+ (no external deps)
- Clear error messages for invalid input
- Table output is readable (aligned columns)
- Help text is complete and correct

## Acceptance Checklist
Same as INPUT_SPEC acceptance criteria.
```

**Điểm kiểm tra:** Bạn đã định nghĩa bạn MUỐN GÌ mà không cần nghĩ đến CÁCH xây dựng. Đây là phần khó nhất cho developer — hãy kiềm chế ham muốn thiết kế.

---

## Bước 3: Ghi lại Quyết định Đầu tiên

Mở `decisions/DECISION_LOG.md`:

```markdown
# Decision Log

## DEC-001: Use SQLite for storage
- **Date:** 2026-02-15
- **Context:** Need persistent storage for bookmarks
- **Options:** JSON file, SQLite, TinyDB
- **Decision:** SQLite
- **Reason:** Built into Python (no install), supports search, handles concurrent access
- **Trade-off:** Slightly more complex than JSON, but better for query and scale

## DEC-002: Single-file architecture
- **Date:** 2026-02-15
- **Context:** Project is small, ~200 lines
- **Decision:** Keep everything in one file (src/bookmarks.py)
- **Reason:** Simplicity. If it grows, can refactor later.
```

---

## Bước 4: Phase B — Thiết kế

Tạo `specs/DESIGN.md`:

```markdown
# Design: Bookmark Manager

## Approach
- Single-file Python CLI using argparse + sqlite3
- Database created automatically on first run
- Commands map directly to functions

## Components

### 1. Database Layer
- `init_db()` — Create table if not exists
- `get_connection()` — Return connection to ~/.bookmarks.db
- Schema: `bookmarks(id INTEGER PRIMARY KEY, url TEXT UNIQUE, title TEXT, tags TEXT, created_at TEXT)`

### 2. Command Handlers
- `cmd_add(url, title, tags)` — INSERT bookmark
- `cmd_list()` — SELECT * ORDER BY created_at DESC
- `cmd_search(query)` — SELECT WHERE title LIKE or tags LIKE
- `cmd_delete(id)` — DELETE WHERE id=
- `cmd_export()` — SELECT * → write bookmarks.json

### 3. CLI Parser
- argparse with subcommands (add, list, search, delete, export)
- --tags flag for add command

### 4. Output Formatter
- `print_table(bookmarks)` — Format as aligned table

## Flow
```
CLI input → argparse → validate → db operation → format output → print
```

## How to Verify (Without Reading Code)
1. Run `python bookmarks.py add https://github.com "GitHub" --tags dev,code` → "Bookmark added (ID: 1)"
2. Run `python bookmarks.py list` → See table with 1 row
3. Run `python bookmarks.py search dev` → Find the bookmark by tag
4. Run `python bookmarks.py delete 1` → "Bookmark deleted"
5. Run `python bookmarks.py list` → Empty table
```

**Điểm kiểm tra:** Bây giờ bạn có thiết kế rõ ràng mà AI có thể tuân theo. Không còn mơ hồ về kiến trúc, thành phần, hay hành vi mong đợi.

---

## Bước 5: Phase C — Xây dựng

Bây giờ đưa spec cho AI. Đây là prompt:

```
You are an Execution agent. Your task is to implement code following a frozen spec.

Read the following specifications carefully:

[Paste your INPUT_SPEC.md here]
[Paste your DESIGN.md here]

Rules:
1. Follow the design EXACTLY — do not change the architecture
2. Do NOT add features not in the spec (no "nice to haves")
3. If something in the design is not feasible, STOP and explain why
4. Do NOT optimize unless explicitly asked
5. Use Python stdlib only — no pip install

Create: src/bookmarks.py

The file should be complete and runnable.
```

**AI tạo ra:** Một file `src/bookmarks.py` hoạt động.

**Lưu trace.** Tạo `traces/AU-001.md`:

```markdown
# AU-001: Implement Bookmark Manager

**Date:** 2026-02-15
**Command:** CVF:EXECUTE
**Archetype:** Execution
**AI Used:** Claude 3.5 Sonnet
**Input:** INPUT_SPEC.md + DESIGN.md
**Output:** src/bookmarks.py (~180 lines)
**Time:** 3 minutes

## Summary
AI created bookmarks.py with all 5 commands (add, list, search, delete, export).
Used argparse subparsers. SQLite table created in init_db().
Output formatted as table with f-strings.

## Deviations from Design
- None observed

## Review Status
- Pending (see Phase D)
```

---

## Bước 6: Phase D — Đánh giá

Bây giờ kiểm tra đầu ra so với tiêu chí chấp nhận.

Mở terminal:

```bash
cd src

# Test 1: Add a bookmark
python bookmarks.py add https://github.com "GitHub" --tags dev,code
# Expected: "Bookmark added (ID: 1)" or similar

# Test 2: Add another
python bookmarks.py add https://docs.python.org "Python Docs" --tags python,docs

# Test 3: List all
python bookmarks.py list
# Expected: Table with 2 rows, newest first

# Test 4: Search by title
python bookmarks.py search python
# Expected: Find "Python Docs"

# Test 5: Search by tag
python bookmarks.py search dev
# Expected: Find "GitHub"

# Test 6: Export
python bookmarks.py export
# Expected: bookmarks.json created

# Test 7: Delete
python bookmarks.py delete 1
# Expected: "Bookmark deleted" or similar

# Test 8: Edge cases
python bookmarks.py add https://github.com "Duplicate" 
# Expected: Error (duplicate URL)

python bookmarks.py delete 999
# Expected: Error (not found)

python bookmarks.py
# Expected: Help text
```

**Điền vào danh sách kiểm tra** (cập nhật INPUT_SPEC.md):

```markdown
## Acceptance Criteria — RESULTS
- [x] Can add a bookmark with URL, title, and tags ✅
- [x] Can list all bookmarks in a table ✅
- [x] Can search by title (partial match) and by tag ✅
- [x] Can delete a bookmark by ID ✅
- [x] Can export to bookmarks.json ✅
- [x] Handles edge cases: duplicate URL ✅, empty search ✅, invalid ID ✅
- [x] Help text shows when running with no arguments ✅

## Verdict: ✅ ACCEPT
```

**Cập nhật trace** (`traces/AU-001.md`):

```markdown
## Review Status
- ✅ ACCEPTED — All 8 tests pass. All acceptance criteria met.
```

---

## Bước 7: Nhìn lại

Chúc mừng! Bạn đã hoàn thành một chu kỳ CVF đầy đủ:

| Phase | Bạn đã làm gì | Thời gian |
|-------|---------------|-----------|
| A — Khám phá | Viết INPUT_SPEC + OUTPUT_SPEC | 5 phút |
| B — Thiết kế | Phác thảo kiến trúc | 5 phút |
| C — Xây dựng | Đưa spec cho AI, lưu trace | 5 phút |
| D — Đánh giá | Kiểm tra theo tiêu chí chấp nhận | 10 phút |
| **Tổng cộng** | | **~25 phút** |

**Không có CVF**, bạn có thể đã hỏi AI: *"Xây cho tôi một bookmark manager bằng Python"* và mất 45 phút đi qua đi lại:
- "Không, tôi muốn CLI, không phải web"
- "Đừng dùng thư viện ngoài"
- "Nó lưu dữ liệu ở đâu?"
- "Tìm kiếm không hoạt động với tag"

**Với CVF**, AI làm đúng ngay lần đầu vì bạn đã nói chính xác những gì bạn muốn.

---

## Bạn đã Học được gì

1. **Spec ngăn ngừa làm lại** — 5 phút viết tiết kiệm 30 phút gửi lại prompt
2. **Decision Log tồn tại cho "bạn trong tương lai"** — Khi bạn quay lại sau 3 tháng, bạn sẽ biết TẠI SAO chọn SQLite
3. **Trace giúp công việc AI có thể kiểm toán** — Bạn biết AI đã làm gì và có thể tái tạo
4. **Phase D bắt vấn đề** — Một danh sách kiểm tra nhanh hơn "nó có hoạt động không?"

---

## Bước tiếp theo

| Tôi muốn... | Đi đến... |
|-------------|-----------|
| Tìm hiểu sâu về 4 phase | 4-Phase Process |
| Cài đặt Giao diện Web | Hướng dẫn Web UI |
| Dùng template skill có sẵn | Hướng dẫn Skill Tùy chỉnh |
| Làm việc với nhóm | Hướng dẫn Thiết lập Nhóm |
| Hiểu mức rủi ro | Risk Model |

---

*Cập nhật lần cuối: 15 tháng 2, 2026 | CVF v1.6*
