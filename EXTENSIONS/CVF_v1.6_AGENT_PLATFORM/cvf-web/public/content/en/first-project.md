# Tutorial: Your First CVF Project

**Time:** 30 minutes  
**Level:** Beginner  
**What you'll build:** A CLI bookmark manager using Python  
**What you'll learn:** The complete CVF 4-phase workflow

---

## Before You Start

You need:
- A text editor (VS Code, any other)
- An AI assistant (ChatGPT, Claude, Copilot, or the [CVF Web UI](web-ui-setup.md))
- Python 3.10+ installed (for this tutorial's example)

No CVF installation needed — we're using core CVF (Markdown files only).

---

## Step 1: Set Up Project Folder

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

Your folder now looks like:

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

## Step 2: Phase A — Discovery

Open `specs/INPUT_SPEC.md` and write what you want:

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

Now write `specs/OUTPUT_SPEC.md`:

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

**Checkpoint:** You've defined WHAT you want without thinking about HOW to build it. This is the hardest part for developers — resist the urge to design.

---

## Step 3: Log Your First Decision

Open `decisions/DECISION_LOG.md`:

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

## Step 4: Phase B — Design

Create `specs/DESIGN.md`:

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

**Checkpoint:** Now you have a clear design that AI can follow. No ambiguity about architecture, components, or expected behavior.

---

## Step 5: Phase C — Build

Now give your spec to AI. Here's the prompt:

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

**What AI produces:** A working `src/bookmarks.py` file.

**Save the trace.** Create `traces/AU-001.md`:

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

## Step 6: Phase D — Review

Now test the output against your acceptance criteria.

Open your terminal:

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

**Fill in the checklist** (update INPUT_SPEC.md):

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

**Update your trace** (`traces/AU-001.md`):

```markdown
## Review Status
- ✅ ACCEPTED — All 8 tests pass. All acceptance criteria met.
```

---

## Step 7: Reflect

Congratulations! You've completed a full CVF cycle:

| Phase | What You Did | Time |
|-------|-------------|------|
| A — Discovery | Wrote INPUT_SPEC + OUTPUT_SPEC | 5 min |
| B — Design | Sketched architecture | 5 min |
| C — Build | Gave specs to AI, saved trace | 5 min |
| D — Review | Tested against acceptance criteria | 10 min |
| **Total** | | **~25 min** |

**Without CVF**, you might have asked AI: *"Build me a bookmark manager in Python"* and spent 45 minutes going back and forth:
- "No, I wanted CLI, not web"
- "Don't use external libraries"
- "Where does it save data?"
- "The search doesn't work with tags"

**With CVF**, AI got it right on the first try because you told it exactly what you wanted.

---

## What You've Learned

1. **Specs prevent re-work** — 5 minutes of writing saves 30 minutes of re-prompting
2. **Decisions log exists for "future you"** — When you come back in 3 months, you'll know WHY you chose SQLite
3. **Traces make AI work auditable** — You know what AI did and can reproduce it
4. **Phase D catches problems** — A checklist is faster than "does it work?"

---

## What's Next

| I want to... | Go to... |
|-------------|---------|
| Learn about the 4 phases in depth | [4-Phase Process](../concepts/4-phase-process.md) |
| Set up the Web UI | [Web UI Tutorial](web-ui-setup.md) |
| Use pre-built skill templates | [Custom Skills Tutorial](custom-skills.md) |
| Work with a team | [Team Setup Guide](../guides/team-setup.md) |
| Understand risk levels | [Risk Model](../concepts/risk-model.md) |

---

*Last updated: February 15, 2026 | CVF v1.6*
