# Tutorial: Creating Custom Skills

**Time:** 20 minutes  
**Level:** Intermediate  
**What you'll learn:** How to create, version, and share reusable CVF skills  
**Prerequisites:** Understanding of [CVF 4-phase process](../concepts/4-phase-process.md)

---

## What is a Skill?

A **skill** in CVF is a pre-structured, form-based template that:
- Guides users in providing the right inputs to AI
- Defines expected outputs and quality criteria
- Includes acceptance checklists and common failure patterns

Skills are **NOT code** and **NOT prompts**. They are **governance artifacts** — structured forms that make AI interactions repeatable and quality-controlled.

### Why Create Custom Skills?

| Without Skills | With Skills |
|---------------|------------|
| Write prompt from scratch each time | Fill out a proven form |
| Forget important inputs | Checklist ensures completeness |
| Inconsistent quality | Acceptance criteria define "done" |
| Can't share knowledge | Skills are reusable by anyone |
| No quality assurance | Built-in evaluation criteria |

---

## Step 1: Choose a Use Case

Think about a task you (or your team) do repeatedly with AI. Good candidates:

| Good Skill Candidates | Why |
|---------------------|-----|
| API endpoint creation | Same pattern every time |
| Code review | Standard checklist |
| Bug report analysis | Structured input needed |
| Database migration | Risk needs to be managed |
| Test suite generation | Consistent quality bar |
| Landing page copy | Same fields: audience, CTA, tone |

**For this tutorial**, we'll create a skill for **"REST API Endpoint"**.

---

## Step 2: Create the Skill File

Skills follow a naming convention: `[number]_[skill_name].skill.md`

Create your file:

```bash
# In your project or in the CVF skill library
touch skills/001_rest_api_endpoint.skill.md
```

---

## Step 3: Write the Skill Template

Here's the complete skill structure:

```markdown
# Skill: REST API Endpoint

> Create a well-structured REST API endpoint with validation, 
> error handling, and tests.

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | App Development |
| **Difficulty** | ⭐⭐ Medium |
| **CVF Version** | v1.0+ |
| **Skill Version** | 1.0.0 |
| **Last Updated** | 2026-02-15 |
| **Author** | @your-name |
| **Risk Level** | R1 (controlled, no external impact) |

---

## 📌 Prerequisites

Before using this skill, ensure:
- [ ] Backend framework is set up (Express, Fastify, Django, etc.)
- [ ] Database schema is defined for the resource
- [ ] Authentication middleware is configured (if needed)
- [ ] API conventions are defined (REST naming, response format)

---

## 🎯 Purpose

### When to Use
- Creating a new CRUD endpoint for a resource
- Adding an API route to an existing service
- Standardizing API patterns across a team

### When NOT to Use
- GraphQL endpoints (different pattern)
- WebSocket connections
- File upload endpoints (use file-upload skill instead)
- Batch/bulk operations

---

## 📋 Form Input

Fill in these fields before giving to AI:

| Field | Required | Description | Example |
|-------|:--------:|-------------|---------|
| **Resource name** | ✅ | The entity this endpoint manages | `User`, `Product`, `Order` |
| **HTTP method** | ✅ | GET, POST, PUT, PATCH, DELETE | `POST` |
| **Endpoint path** | ✅ | RESTful URL pattern | `/api/v1/users` |
| **Request body** | ✅* | JSON schema of request (*for POST/PUT) | `{ name: string, email: string }` |
| **Response body** | ✅ | JSON schema of response | `{ id: number, name: string, ... }` |
| **Query params** | ⬜ | For GET list endpoints | `?page=1&limit=20&sort=name` |
| **Path params** | ⬜ | URL parameters | `:id` (integer) |
| **Auth required** | ✅ | Who can access | `authenticated`, `admin`, `public` |
| **Validation rules** | ✅ | Input validation requirements | `email: valid email, name: 2-100 chars` |
| **Error responses** | ✅ | Expected error cases | `400 Bad Request, 404 Not Found, 409 Conflict` |
| **Framework** | ✅ | Backend framework | `Express + TypeScript` |
| **Database** | ✅ | Data layer | `PostgreSQL + Prisma` |

---

## ✅ Expected Output

AI should produce:

1. **Route handler file** (e.g., `src/routes/users.ts`)
   - Input validation (Zod, Joi, or framework-native)
   - Business logic
   - Database query
   - Response formatting
   - Error handling

2. **Test file** (e.g., `src/routes/users.test.ts`)
   - Happy path test
   - Validation error test
   - Not found test (for GET/PUT/DELETE by ID)
   - Auth test (if auth required)
   - Minimum 4 test cases

3. **Type definitions** (if TypeScript)
   - Request body type
   - Response body type

---

## 🔍 Acceptance Checklist

### Must Pass (all required)
- [ ] Correct HTTP method and path
- [ ] Input validation present and working
- [ ] All error cases handled with correct status codes
- [ ] Response matches specified JSON schema
- [ ] Auth middleware applied (if required)
- [ ] Tests cover happy path AND error cases
- [ ] No SQL injection / input sanitization
- [ ] Consistent with project's API conventions

### Should Pass (recommended)
- [ ] Pagination for list endpoints (GET all)
- [ ] Request logging
- [ ] Rate limiting considered
- [ ] CORS headers handled

### Red Flags 🚩
- ❌ Hardcoded values (IDs, URLs, secrets)
- ❌ No input validation
- ❌ Generic error messages ("Something went wrong")
- ❌ No tests
- ❌ SQL queries built with string concatenation
- ❌ Missing auth on sensitive endpoints

---

## ⚠️ Common Failures

| Failure | Prevention |
|---------|-----------|
| AI adds extra endpoints not requested | Specify "ONLY create [method] [path]" |
| Missing error handling | List all error cases in the form |
| Wrong status codes (200 for everything) | Specify expected status codes |
| Tests only test happy path | Require "minimum 4 tests including error cases" |
| Ignores existing project patterns | Include "follow existing patterns in src/routes/" |

---

## 💡 Tips

1. **Be specific about validation:** "name: string, 2-100 characters, required" is better than "name: string"
2. **Include an example response:** AI matches formats better with examples
3. **Reference existing code:** "Follow the pattern in src/routes/products.ts" 
4. **Specify test framework:** "Use Vitest" or "Use Jest" — don't let AI guess

---

## 📊 Example: Complete Input/Output

### Example Input (filled form)

```
Resource: User
Method: POST
Path: /api/v1/users
Request body: { name: string (2-100), email: string (valid email), role: "user"|"admin" }
Response: { id: number, name: string, email: string, role: string, createdAt: string }
Auth: admin only
Validation: name required 2-100 chars, email required valid format, role required enum
Errors: 400 (validation), 401 (not auth), 403 (not admin), 409 (email exists)
Framework: Express + TypeScript
Database: PostgreSQL + Prisma
```

### Example Output (what AI should produce)

**src/routes/users.ts** — Route handler with Zod validation, Prisma query, error handling  
**src/routes/users.test.ts** — 6 test cases (create success, validation error, duplicate email, unauthorized, forbidden, missing fields)  
**src/types/user.ts** — CreateUserRequest, UserResponse types

### Example Evaluation

```
Checklist:
- [x] POST /api/v1/users ✅
- [x] Zod validation for name, email, role ✅
- [x] 400 for validation errors ✅
- [x] 401 for unauthenticated ✅
- [x] 403 for non-admin ✅
- [x] 409 for duplicate email ✅
- [x] 6 test cases ✅
- [x] No hardcoded values ✅

Verdict: ✅ ACCEPT
```

---

## 🔗 Related Skills

- Database Migration Skill
- Authentication Middleware Skill
- API Documentation Skill (Swagger/OpenAPI)
- Integration Test Skill

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-15 | Initial release |

---
```

---

## Step 4: Version Your Skills

Use semantic versioning:

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| Fix typo, clarify wording | 1.0.0 → 1.0.1 | Fix field description |
| Add new section, examples | 1.0.0 → 1.1.0 | Add "Common Failures" section |
| Major restructure, new form fields | 1.0.0 → 2.0.0 | Change input schema |

Track changes in the Version History section.

---

## Step 5: Add Governance (v1.2+)

For teams and enterprise, each skill should have a governance record:

```markdown
# Governance: REST API Endpoint Skill

**Skill ID:** USR-001
**Risk Level:** R1
**Authority:** BUILDER can use, ARCHITECT must approve for R2+ endpoints

## Risk Assessment
| Dimension | Level | Reason |
|-----------|-------|--------|
| Authority | R0 | No autonomous decisions |
| Scope Expansion | R1 | Could generate extra code |
| Irreversibility | R0 | Code can be reverted |
| Interpretability | R0 | Output is standard code |
| External Impact | R0 | No external calls |

**Aggregate Risk: R1** (highest dimension)

## Lifecycle
- Status: ACTIVE
- Review cycle: Quarterly
- Owner: @team-lead
- Last review: 2026-02-15

## UAT Requirements
- [ ] Skill produces working code in target framework
- [ ] All acceptance criteria are testable
- [ ] No false positives (accepts bad output)
- [ ] No false negatives (rejects good output)
```

---

## Step 6: Share Your Skills

### Option A: Add to CVF Skill Library

If your skill is generally useful, contribute it:

```bash
# Copy to the CVF skill library
cp skills/001_rest_api_endpoint.skill.md \
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/app-development/

# Create governance record
cp skills/001_rest_api_endpoint.gov.md \
   governance/skill-library/
```

### Option B: Team-Only Skills

Keep skills in your team's repo:

```
your-team-repo/
├── skills/
│   ├── 001_rest_api_endpoint.skill.md
│   ├── 002_database_migration.skill.md
│   └── 003_code_review.skill.md
└── ...
```

### Option C: Use in Web UI (v1.6)

The v1.6 web app can load skills as templates. Place skill files in the appropriate directory and they'll appear in the template picker.

---

## Skill Domain Reference

The CVF Skill Library organizes skills by domain:

| Domain | Count | Example Skills |
|--------|:-----:|---------|
| Marketing & SEO | 9 | SEO audit, content strategy, A/B test plan |
| Product & UX | 8 | User story, wireframe spec, UX audit |
| Security & Compliance | 6 | Threat model, compliance check, pen test plan |
| Finance & Analytics | 8 | Financial model, KPI dashboard, forecast |
| App Development | 8 | REST API, database migration, test suite |
| HR & Operations | 5 | Job description, onboarding plan, OKR |
| Legal & Contracts | 5 | Contract review, NDA template, ToS draft |
| AI/ML Evaluation | 6 | Model evaluation, bias audit, dataset review |
| Web Development | 6 | Landing page, responsive layout, performance |
| **Total** | **114** | |

Browse all skills: [`EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)

---

## What's Next

| I want to... | Go to... |
|-------------|---------|
| Understand the skill system deeper | [Skill System Concept](../concepts/skill-system.md) |
| Learn about risk levels for skills | [Risk Model](../concepts/risk-model.md) |
| Browse existing skills | [Skill Library](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |
| Set up team skill governance | [Team Guide](../guides/team-setup.md) |
| Use skills in the Web UI | [Web UI Tutorial](web-ui-setup.md) |

---

*Last updated: February 15, 2026 | CVF v1.6*
