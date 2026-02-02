# Vibecode Skills Library

> Skill documents that guide AI agents to produce high-quality, distinctive outputs.

## What are Skills?

Skills are structured documents (~200-400 tokens each) containing:
- Domain-specific guidelines
- Code patterns and examples
- Checklists for quality assurance
- Product-type-specific overrides

They prevent "AI slop" - generic, low-quality outputs that lack distinctiveness.

---

## Skill Categories

### 🎨 UI Skills (`/ui`)

| Skill | Purpose | Tokens |
|-------|---------|--------|
| `frontend-aesthetics.md` | Core UI/UX guidelines | ~400 |
| `typography-guide.md` | Font selection & hierarchy | ~250 |
| `motion-patterns.md` | Animation & transitions | ~300 |

### ✍️ Copy Skills (`/copy`)

| Skill | Purpose | Tokens |
|-------|---------|--------|
| `headline-writing.md` | Headlines & value props | ~250 |
| `cta-optimization.md` | Call-to-action copy | ~200 |

### ♿ Accessibility Skills (`/accessibility`)

| Skill | Purpose | Tokens |
|-------|---------|--------|
| `wcag-aa-checklist.md` | WCAG 2.1 AA compliance | ~300 |

### ⚡ Performance Skills (`/performance`)

| Skill | Purpose | Tokens |
|-------|---------|--------|
| `web-vitals.md` | Core Web Vitals optimization | ~250 |

---

## Skill-to-Product Mapping

| Product Type | Primary Skills | Secondary Skills |
|--------------|----------------|------------------|
| `landing` | frontend-aesthetics, headline-writing | motion-patterns, cta-optimization |
| `dashboard` | frontend-aesthetics, wcag-aa | web-vitals |
| `docs` | typography-guide, wcag-aa | - |
| `saas` | frontend-aesthetics, headline-writing, cta-optimization | motion-patterns |
| `branding` | frontend-aesthetics, typography-guide | motion-patterns |
| `app-shell` | frontend-aesthetics, wcag-aa | web-vitals |
| `app` | frontend-aesthetics, web-vitals | wcag-aa |
| `ui` | frontend-aesthetics, typography-guide, motion-patterns | wcag-aa |

---

## How Skills are Used

### 1. In Architect (Blueprint Generation)
```
Architect reads skills → Generates skill-aware blueprint
```

### 2. In Packer (Coder Prompt)
```
Packer loads skills for product type → Injects into coder_prompt.txt
```

### 3. In Validator (Quality Check)
```
Validator checks code against skill rules → Reports violations
```

---

## Adding New Skills

### 1. Create Skill File
```markdown
# Skill Name

> One-line description

## Token Budget: ~XXX tokens

---

## 1. SECTION TITLE

### Subsection
Content, code examples, guidelines...

---

## CHECKLIST
- [ ] Verification item 1
- [ ] Verification item 2
```

### 2. Register in Skill Loader
```typescript
// skill-loader.ts
const SKILL_REGISTRY: SkillRegistry = {
  'new-skill': {
    path: 'category/new-skill.md',
    productTypes: ['landing', 'saas'],
    priority: 2,
  },
};
```

### 3. Test with Job
```bash
vibe-agent run-coder --job JOB-TEST --step STEP-1 --product-type landing
# Check coder_prompt.txt contains new skill content
```

---

## Skill Best Practices

### DO ✓
- Keep each skill focused (one concern)
- Include code examples
- Provide checklists for verification
- Specify product-type overrides
- Stay within token budget

### DON'T ✗
- Write vague guidelines ("make it look good")
- Include implementation code (that's Coder's job)
- Duplicate content across skills
- Exceed ~400 tokens per skill

---

## Skill Versioning

Skills are versioned with the Vibecode Kit:
- `v2.0.0` - Initial skill system
- Future versions track in CHANGELOG.md

---

## Contributing Skills

1. Identify a quality gap (e.g., "icons are inconsistent")
2. Research best practices
3. Write skill document with examples
4. Test with multiple product types
5. Submit PR with before/after examples

---

*Vibecode Kit v2.0 - Skills-Powered Development*
