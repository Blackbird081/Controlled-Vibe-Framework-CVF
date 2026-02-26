# 🐛 Bug History & Troubleshooting Guide

> **Purpose**: Document all bugs encountered during development, their root causes, solutions, and prevention strategies.  
> **Last Updated**: 2026-02-26  
> **Maintained by**: CVF Development Team

---

## 📋 Table of Contents

- [How to Use This Document](#how-to-use-this-document)
- [Bug Log](#bug-log)
  - [BUG-001: Next.js Hydration Error](#bug-001-nextjs-hydration-error)
- [Quick Reference: Common Error Patterns](#quick-reference-common-error-patterns)
- [Prevention Checklist](#prevention-checklist)

---

## How to Use This Document

### When You Encounter a Bug:
1. **Search first** — Use `Ctrl+F` to search for the error message or keyword
2. **Check Quick Reference** — Common patterns are listed at the bottom
3. **If not found** — Add a new entry following the template below

### Adding a New Bug Entry:
Copy the template below and fill in all fields:

```markdown
---

### BUG-XXX: [Short Title]

| Field | Detail |
|-------|--------|
| **Date** | YYYY-MM-DD |
| **Severity** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Component** | e.g., cvf-web, kernel, governance |
| **File(s)** | Path to affected files |
| **Status** | ✅ Fixed / 🔄 Workaround / ⏳ Open |

**Error Message:**
\`\`\`
Paste the exact error message here
\`\`\`

**Root Cause:**
Explain WHY the bug happened.

**Solution:**
Step-by-step fix with code changes.

**Prevention:**
How to avoid this in the future.

**Related Commits:** `abc1234`
```

---

## Bug Log

---

### BUG-001: Next.js Hydration Error

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-26 |
| **Severity** | 🟠 High |
| **Component** | cvf-web (Agent Platform) |
| **File(s)** | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.tsx` |
| **Status** | ✅ Fixed |

**Error Message:**
```
Recoverable Error
Hydration failed because the server rendered HTML didn't match the client.
This can happen if a SSR-ed Client Component used:
- A server/client branch `if (typeof window !== 'undefined')`
- Variable input such as `Date.now()` or `Math.random()`
```

**Root Cause:**  
The `useSettings()` hook in `Settings.tsx` called `loadInitialSettings()` during the initial `useState` initialization. This function reads from `localStorage`:

- **On Server (SSR):** `typeof window === 'undefined'` → returns `defaultSettings` (no API keys)
- **On Client:** Reads from `localStorage` → may return saved settings with API keys

This caused the `hasAnyApiKey` check in `page.tsx` to evaluate differently on server vs. client, producing different HTML structures (the API key warning div was present on server but absent on client, or vice versa).

**Solution:**

```diff
// Settings.tsx - useSettings hook

- const [settings, setSettings] = useState<SettingsData>(() => loadInitialSettings());
- const [isLoaded] = useState(true);
+ const [settings, setSettings] = useState<SettingsData>(defaultSettings);
+ const [isLoaded, setIsLoaded] = useState(false);
+
+ // Load settings from localStorage AFTER hydration
+ useEffect(() => {
+     const loaded = loadInitialSettings();
+     setSettings(loaded);
+     setIsLoaded(true);
+ }, []);
```

**Key Principle:** Never read `localStorage`, `sessionStorage`, or any browser-only API during the initial render of a component that runs on the server. Always defer to `useEffect`.

**Prevention:**
- ✅ Always use `useEffect` for `localStorage`/`sessionStorage` reads
- ✅ Initialize state with static default values that match SSR output
- ✅ Use `isLoaded` flag to handle loading states gracefully
- ✅ Test with SSR disabled to catch hydration mismatches early
- ❌ Never use `useState(() => browserOnlyFunction())` in SSR components

**Related Commits:** `8c7fbb7`

---

## Quick Reference: Common Error Patterns

### Next.js / React

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `Hydration failed` | Server/client HTML mismatch | Defer browser APIs to `useEffect` |
| `Text content mismatch` | Dynamic text (dates, random) on SSR | Use `suppressHydrationWarning` or `useEffect` |
| `Invalid hook call` | Hook called outside component or conditionally | Check hook rules |
| `Module not found` | Wrong import path or missing dependency | Check `tsconfig.json` paths, run `npm install` |
| `ChunkLoadError` | Stale cached chunks after deployment | Clear `.next` cache, hard refresh |

### TypeScript

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `Type 'X' is not assignable to 'Y'` | Type mismatch | Check interface definitions |
| `Property 'X' does not exist` | Missing field in type | Update interface or add optional `?` |
| `Cannot find module '@/...'` | Path alias issue | Check `tsconfig.json` `paths` config |

### Build & Deploy

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `ENOSPC` | Disk full or too many file watchers | Increase `fs.inotify.max_user_watches` |
| `Port already in use` | Another process on same port | Kill process or change port |
| `CORS error` | API domain mismatch | Check API route config and middleware |

---

## Prevention Checklist

Use this checklist before submitting code:

### SSR Safety
- [ ] No `localStorage`/`sessionStorage` reads during initial render
- [ ] No `window`/`document` access outside `useEffect`
- [ ] No `Date.now()` or `Math.random()` in SSR render paths
- [ ] Dynamic imports with `{ ssr: false }` for browser-only components

### Type Safety
- [ ] No `any` types without justification
- [ ] All API responses properly typed
- [ ] Null checks on optional fields

### Performance
- [ ] No unnecessary re-renders (check `useMemo`/`useCallback`)
- [ ] Images optimized with `next/image`
- [ ] No memory leaks in `useEffect` cleanup

### Testing
- [ ] Unit tests for new utility functions
- [ ] Manual test in both light/dark mode
- [ ] Test with empty `localStorage` (incognito mode)

---

> 💡 **Tip:** When you fix a bug, always add it here BEFORE pushing the commit. This builds our knowledge base over time and saves hours of debugging for the team.
