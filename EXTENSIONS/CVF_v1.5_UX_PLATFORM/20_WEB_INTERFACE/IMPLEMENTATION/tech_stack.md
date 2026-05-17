# 🛠️ Tech Stack

**CVF v1.5 — Web Interface Implementation**

---

## Recommended Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14 | SSR, App Router, built-in API |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Components** | shadcn/ui | Accessible, customizable |
| **State** | Zustand | Simple, lightweight |
| **Forms** | React Hook Form | Performance, validation |
| **Markdown** | react-markdown | Render output |
| **Export** | jsPDF, docx | PDF/Word export |

---

## Project Structure

```
cvf-web/
├── app/
│   ├── page.tsx              # Home / Template selection
│   ├── form/
│   │   └── [template]/
│   │       └── page.tsx      # Dynamic form
│   ├── result/
│   │   └── [id]/
│   │       └── page.tsx      # Result display
│   ├── history/
│   │   └── page.tsx          # History list
│   └── api/
│       └── execute/
│           └── route.ts      # CVF SDK integration
│
├── components/
│   ├── ui/                   # shadcn components
│   ├── forms/
│   │   ├── FormBuilder.tsx
│   │   └── fields/
│   ├── result/
│   │   ├── ResultViewer.tsx
│   │   └── ExportButton.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── cvf-sdk.ts           # CVF SDK wrapper
│   ├── templates.ts         # Template definitions
│   └── export.ts            # Export utilities
│
├── hooks/
│   ├── useForm.ts
│   └── useExecution.ts
│
└── types/
    ├── template.ts
    └── execution.ts
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    "react-markdown": "^9.0.0",
    "jspdf": "^2.5.0",
    "docx": "^8.5.0",
    "zod": "^3.22.0"
  }
}
```

---

## Setup Commands

```bash
# Create project
npx create-next-app@latest cvf-web --typescript --tailwind --app

# Install dependencies
cd cvf-web
npm install zustand react-hook-form react-markdown jspdf docx zod

# Add shadcn
npx shadcn@latest init
npx shadcn@latest add button input textarea select card
```

---

## Environment Variables

```env
# .env.local
CVF_SDK_URL=http://localhost:8000
CVF_API_KEY=your-api-key
```

---

*Tech Stack — CVF v1.5 Web Interface*
