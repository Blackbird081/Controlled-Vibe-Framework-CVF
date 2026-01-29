# 📝 CVF Documentation Style Guide

**Version:** 1.0  
**Effective Date:** 29/01/2026  
**Status:** ENFORCED (CI/CD checks automated)

---

## I. Purpose

This guide ensures consistency across all CVF documentation, making it easier to read, maintain, and automatically validate.

**Scope:** All `.md` files in the repository  
**Tool:** markdownlint (with custom rules)  
**Enforcement:** Git pre-commit hooks + GitHub Actions CI

---

## II. File Structure & Naming

### File Naming
```
[SUBJECT]_[DESCRIPTOR].md

Examples:
✅ DOCUMENTATION_STYLE_GUIDE.md
✅ CVF_EXPERT_REVIEW_v1.2.md
✅ SKILL_CONTRACT_SPEC.md
✅ HOW_TO_APPLY_CVF.md
❌ doc.md (too vague)
❌ CVF v1.2 review.md (spaces in filename)
```

### File Organization
```
docs/                              # Main documentation
├── README.md                       # Entry point
├── DOCUMENTATION_STYLE_GUIDE.md    # This file
├── EXPERT_ASSESSMENT_ROADMAP.md
├── CVF_EXPERT_REVIEW_v1.2.md
├── VERSION_COMPARISON.md
├── HOW_TO_APPLY_CVF.md
└── case-studies/                   # Subfolders for topics
    ├── case-study-template.md
    └── CASE_01_FinTech.md

v1.0/                              # Version-specific
├── README.md
├── USAGE.md
├── docs/
├── governance/
└── ...

v1.1/
├── README.md
├── QUICK_START.md
├── ...
```

---

## III. Heading Hierarchy

### Rules

**H1 = Document Title (exactly 1 per file)**
```markdown
# CVF Documentation Style Guide  ✅ CORRECT

### Subsection      ❌ WRONG - should be H2 first
```

**H2 = Major Sections**
```markdown
## I. Purpose          ✅ CORRECT (numbered for outline clarity)
## II. File Structure  ✅ CORRECT

### Content nested under H2
```

**H3 = Subsections within H2**
```markdown
### File Naming
### File Organization
```

**H4 & beyond = Avoid**
```markdown
#### Too deep        ❌ Rarely needed, use lists instead
```

### Heading Numbering (Optional but Recommended)

For long documents (>5 sections), use Roman numerals for H2:
```markdown
## I. Purpose
## II. Structure
## III. Examples
## IV. Checklist
## V. FAQ
```

For shorter documents, no prefix needed:
```markdown
## Getting Started
## Usage Examples
## Troubleshooting
```

---

## IV. Content Format

### Front Matter
Every file should start with:
```markdown
# Document Title

**Version:** X.Y  
**Last Updated:** DD/MM/YYYY  
**Author(s):** [Name]  
**Status:** DRAFT | REVIEW | FINAL | FROZEN  

---
```

### Sections
Start each major section with a brief purpose statement:

```markdown
## I. Purpose

One-sentence summary of this section's value.

---
```

### Subsection Format
```markdown
### Subsection Title

**Context:** Brief intro if needed.

Content here...
```

---

## V. Code & Code Blocks

### Code Blocks - Format

```markdown
❌ WRONG - No language specified
``
code here
``

✅ CORRECT - Language specified
\`\`\`python
def my_function():
    pass
\`\`\`
```

### Languages to Specify
```
python, typescript, javascript, yaml, json, bash, shell, markdown, sql, html, css
```

### Multi-line Bash
```bash
# ✅ CORRECT - clear commands
python -m pip install -e ./sdk
cd typescript-sdk && npm install

# ❌ WRONG - unclear
do something; then do another
```

### Inline Code
```markdown
Use `SkillRegistry` for accessing registered skills  ✅ CORRECT
Use 'SkillRegistry' for accessing registered skills  ❌ WRONG
```

### YAML Examples
```yaml
# Always include comments explaining fields
CAPABILITY_ID: my-skill-v1
DOMAIN: devops
RISK_LEVEL: Medium

ALLOWED_ARCHETYPES:
  - executor
  - designer
```

---

## VI. Lists & Formatting

### Unordered Lists
```markdown
✅ CORRECT - Hyphens with space
- Item 1
- Item 2
  - Nested item 2a
  - Nested item 2b

❌ WRONG - Mixed bullets
* Item 1
- Item 2
```

### Ordered Lists
```markdown
✅ CORRECT
1. First step
2. Second step
   1. Sub-step 2a
   2. Sub-step 2b
3. Third step

❌ WRONG - Wrong numbering
1. First step
2. Second step
1. Third step (should be 3)
```

### Tables
```markdown
✅ CORRECT - Aligned
| Header 1 | Header 2 | Status |
|----------|----------|--------|
| Value    | Value    | ✅     |

✅ Also correct - Compact
|Header|Value|
|-----|-----|
|Key|Value|

❌ WRONG - Inconsistent separators
| Header 1 | Header 2
|-------|---
| Value | Value
```

---

## VII. Links & References

### Internal Links
```markdown
✅ CORRECT - Relative paths, no leading slash
See [QUICK_START.md](QUICK_START.md) for details
See [example](../v1.1/examples/my-example.md) in v1.1

❌ WRONG - Absolute paths or file://
See [QUICK_START.md](/QUICK_START.md)
See [QUICK_START.md](file:///absolute/path/QUICK_START.md)
```

### External Links
```markdown
✅ CORRECT
Visit [GitHub](https://github.com/org/cvf) for source code.

✅ Also correct - Descriptive text
The [CVF specification](https://github.com/org/cvf) is well-documented.

❌ WRONG - Non-descriptive text
Click [here](https://github.com/org/cvf) for more info.
```

### File References
```markdown
✅ Point to files that exist
See [SKILL_CONTRACT_SPEC.md](../EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/SKILL_CONTRACT_SPEC.md)

❌ Dead links
See [NONEXISTENT.md](NONEXISTENT.md)
```

---

## VIII. Images & Diagrams

### Image Format
```markdown
![Alt text describing the image](../images/diagram.png)

# ✅ CORRECT
![CVF Architecture overview showing layers](docs/images/cvf-architecture.png)

# ❌ WRONG - Vague alt text
![diagram](../images/diagram.png)
```

### Diagram Tools
- **Mermaid** (preferred, renders on GitHub)
  ```markdown
  \`\`\`mermaid
  graph TD
      A[Start] --> B[Process]
      B --> C[End]
  \`\`\`
  ```

- **ASCII art** (for simple diagrams only)
  ```markdown
  \`\`\`
  CVF Core
    ├── v1.0 (Frozen)
    ├── v1.1 (Stable)
    └── v1.2+ (Extensions)
  \`\`\`
  ```

---

## IX. Emphasis & Styling

### Bold (Strong Emphasis)
```markdown
✅ CORRECT - Use for important terms
**Deny-first policy** prevents unintended execution.

❌ WRONG - Over-emphasized
**This is very important**
```

### Italic (Weak Emphasis)
```markdown
✅ CORRECT - Use for optional/nuanced points
*This approach is recommended but not required.*

❌ WRONG - Over-emphasized
*All teams must*
```

### Strikethrough (Deprecated Features)
```markdown
✅ CORRECT
~~Old approach~~ → New approach

❌ Don't use for humor
This is ~~impossible~~ very difficult
```

### Blockquotes (Principles & Philosophy)
```markdown
✅ CORRECT - For quotes, principles, or important callouts
> **Principle:** Outcome matters more than code.

✅ Also correct
> "CVF is not about control; it's about clarity." — Author
```

---

## X. Special Blocks & Callouts

### Callout Format (Using Blockquotes)
```markdown
> **⚠️ WARNING:** This action cannot be undone.

> **ℹ️ NOTE:** This is optional but recommended.

> **✅ SUCCESS:** Implementation complete.

> **🔴 ERROR:** This will cause failure.
```

### Checklist Format
```markdown
- [ ] Task not completed
- [x] Task completed
  - [x] Subtask
  - [ ] Another subtask
```

### Status Badges
```markdown
**Status:** DRAFT | REVIEW | FINAL | FROZEN | DEPRECATED
**Version:** 1.0 | 1.1 | 1.2 | 1.3
**Priority:** CRITICAL | HIGH | MEDIUM | LOW
```

---

## XI. Examples Section

Every technical document should include:

### Template
```markdown
## Examples

### Example 1: Basic Usage
**Context:** When you want to X

\`\`\`python
# Your code here
\`\`\`

**Output:**
\`\`\`
Expected output
\`\`\`

### Example 2: Advanced Usage
...
```

---

## XII. FAQ & Troubleshooting

### Format
```markdown
## FAQ

### Q: How do I do X?

**A:** Steps to do X:

1. First step
2. Second step

See [Related Document](link) for more details.

### Q: What if Y happens?

**A:** Solution to Y...
```

---

## XIII. Common Issues & Fixes

### Issue 1: Unclosed Code Blocks
```markdown
❌ WRONG - Missing closing backticks
\`\`\`python
def my_function():
    pass

### Issue 2: Inconsistent Heading Levels
❌ WRONG - Jumps from H2 to H4
## Section
#### Subsection (should be H3)
```

### Issue 2: Too Many Inline Code Segments
```markdown
❌ WRONG - Overdone
The `SkillRegistry` uses `ContractValidator` to validate `Skill` objects.

✅ CORRECT - Use inline code sparingly
The SkillRegistry uses ContractValidator to validate Skill objects.
```

### Issue 3: Inconsistent List Markers
```markdown
❌ WRONG - Mixed markers
- Item 1
* Item 2
+ Item 3

✅ CORRECT - Consistent hyphens
- Item 1
- Item 2
- Item 3
```

---

## XIV. Markdown Linting Rules

### Enabled Rules (markdownlint config)

| Rule | Description | Severity |
|------|-------------|----------|
| `MD001` | Heading increment | ERROR |
| `MD002` | First heading level | ERROR |
| `MD003` | Heading style | ERROR (hyphens: ---) |
| `MD004` | Unordered list style | ERROR (hyphens: -) |
| `MD005` | List indentation | ERROR |
| `MD007` | List indentation spacing | ERROR |
| `MD009` | Trailing spaces | WARN |
| `MD010` | Hard tabs | ERROR |
| `MD011` | Reversed link syntax | ERROR |
| `MD012` | Multiple blank lines | WARN (max 1) |
| `MD018` | Space after heading | ERROR |
| `MD019` | Multiple spaces after heading | ERROR |
| `MD020` | Space inside headings | ERROR |
| `MD021` | Multiple spaces inside headings | ERROR |
| `MD022` | Blank line after heading | WARN |
| `MD023` | Heading not at document start | ERROR |
| `MD024` | Duplicate headings | WARN |
| `MD025` | Multiple top-level headings | ERROR |
| `MD026` | Heading punctuation | WARN |
| `MD027` | Multiple spaces after blockquote | ERROR |
| `MD028` | Blank line inside blockquote | WARN |
| `MD029` | Ordered list item prefix | ERROR |
| `MD030` | Spaces after list markers | WARN |
| `MD031` | Blank lines around code fences | ERROR |
| `MD032` | Blank lines around lists | WARN |
| `MD034` | Bare URL | WARN |
| `MD035` | Horizontal rule style | ERROR (---) |
| `MD036` | Emphasis used for heading | ERROR |
| `MD037` | Spaces inside emphasis | ERROR |
| `MD038` | Spaces inside code spans | ERROR |
| `MD040` | Fenced code block language | WARN |
| `MD041` | First line in file | WARN (should be H1) |

---

## XV. Automated Validation

### Pre-commit Hook
```bash
# Install in .git/hooks/pre-commit
markdownlint '**/*.md' || exit 1
```

### GitHub Actions
```yaml
name: Markdown Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: nosborn/github-action-markdown-cli@v3
        with:
          files: .
          config_file: .markdownlintrc
```

---

## XVI. Checklist: Before Publishing

```markdown
- [ ] Document has proper H1 title
- [ ] All headings follow hierarchy (H1 > H2 > H3)
- [ ] All code blocks have language specified
- [ ] All links are relative & verify existence
- [ ] No trailing whitespace
- [ ] No hard tabs (use spaces)
- [ ] Consistent list markers (hyphens for unordered)
- [ ] Tables properly formatted & aligned
- [ ] No dead internal links
- [ ] Images have descriptive alt text
- [ ] Front matter complete (Version, Status, Author)
- [ ] markdownlint passes with 0 errors
- [ ] Content reviewed by 2nd person
- [ ] Spelling & grammar checked
```

---

## XVII. Deprecation & Updates

### When Updating Existing Documents

1. Update `Last Updated` date in front matter
2. Add entry to document's CHANGELOG (if large doc)
3. Add note at top if document is DEPRECATED:
   ```markdown
   > ⚠️ **DEPRECATED:** This document is no longer maintained.
   > See [NEW_DOCUMENT.md](NEW_DOCUMENT.md) instead.
   ```

### Versioning Strategy
```
v1.0 → FINAL (no more changes)
v1.1 → DRAFT (open to feedback)
v1.2 → REVIEW (pending approval)
v2.0 → FROZEN (major change, migration guide required)
```

---

## XVIII. Questions & Clarifications

For style questions not covered here:

1. **Check existing similar documents** — follow their pattern
2. **Ask in GitHub Discussions** — tag with `#documentation`
3. **Submit RFC** — propose new style rule via RFC process

---

**Last Updated:** 29/01/2026  
**Maintained by:** CVF Documentation Team  
**Next Review:** 30/04/2026
