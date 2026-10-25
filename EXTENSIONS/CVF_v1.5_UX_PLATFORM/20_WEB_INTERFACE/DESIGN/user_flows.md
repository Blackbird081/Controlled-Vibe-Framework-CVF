# 🔀 User Flows

**CVF v1.5 — Web Interface**

---

## Flow 1: Happy Path (Normal Execution)

```
┌───────────┐     ┌───────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│   Home    │ ──► │  Select   │ ──► │  Fill    │ ──► │  Process  │ ──► │  Accept  │
│           │     │  Template │     │  Form    │     │           │     │          │
└───────────┘     └───────────┘     └──────────┘     └───────────┘     └──────────┘
```

**Steps:**

1. User opens app
2. Browses template categories
3. Selects a template
4. Fills required fields
5. Submits
6. Waits for result
7. Accepts result
8. (Optional) Exports

---

## Flow 2: Reject & Retry

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Result  │ ──► │  Reject  │ ──► │  Edit    │ ──► │  Retry   │
│          │     │          │     │  Input   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                         │
                                         ▼
                                  ┌──────────┐
                                  │  Accept  │
                                  └──────────┘
```

**Steps:**

1. User receives result
2. Result doesn't meet expectations
3. Clicks Reject
4. Reviews/edits input
5. Resubmits
6. Gets new result
7. Accepts

---

## Flow 3: View History

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   Home   │ ──► │  History │ ──► │  View    │
│          │     │  List    │     │  Detail  │
└──────────┘     └──────────┘     └──────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                  ┌──────────┐   ┌──────────┐   ┌──────────┐
                  │  Export  │   │  Re-run  │   │  Delete  │
                  └──────────┘   └──────────┘   └──────────┘
```

---

## Flow 4: Export Result

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Result  │ ──► │  Export  │ ──► │  Download│
│          │     │  Dialog  │     │          │
└──────────┘     └──────────┘     └──────────┘
                      │
              ┌───────┼───────┐
              ▼       ▼       ▼
           [ PDF ] [DOCX] [Markdown]
```

---

## Error Flows

### Input Validation Error

```
Fill Form → Submit → ❌ Validation Error → Fix Fields → Submit
```

### Processing Error

```
Submit → Processing → ❌ Error → [Retry] or [Edit Input]
```

### Session Timeout

```
Processing (too long) → ⚠️ Timeout → [Retry] or [Cancel]
```

---

## State Diagram

```
                    ┌──────────────────────────────────────────┐
                    ▼                                          │
             ┌──────────┐                                      │
             │   HOME   │◄─────────────────────────────────────┤
             └────┬─────┘                                      │
                  │                                            │
                  ▼                                            │
         ┌────────────────┐                                    │
         │ TEMPLATE SELECT │                                   │
         └───────┬────────┘                                    │
                 │                                             │
                 ▼                                             │
         ┌────────────────┐          ┌──────────┐              │
         │   FORM INPUT   │◄─────────│  EDITING │              │
         └───────┬────────┘          └────┬─────┘              │
                 │                        ▲                    │
                 ▼                        │                    │
         ┌────────────────┐               │                    │
         │   PROCESSING   │───────────────┤ (on error)         │
         └───────┬────────┘               │                    │
                 │ (success)              │                    │
                 ▼                        │                    │
         ┌────────────────┐               │                    │
         │    RESULT      │───────────────┤ (reject)           │
         └───────┬────────┘               │                    │
                 │ (accept)                                    │
                 ▼                                             │
         ┌────────────────┐                                    │
         │    HISTORY     │────────────────────────────────────┘
         └────────────────┘
```

---

*User Flows — CVF v1.5 Web Interface*
