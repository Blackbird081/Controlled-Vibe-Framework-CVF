# 🧙 CVF Web - Controlled Vibe Framework UI

> Next.js web interface for CVF prompt templates and multi-step wizards.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✨ Features

### 📋 40+ Prompt Templates

Categorized templates for various use cases:

- Business, Marketing, Product, Technical
- Research, Content, Security, DevOps

### 🧙 9 Multi-Step Wizards

Interactive wizards that guide you through complex tasks:

| Wizard | Category | Steps | Description |
|--------|----------|-------|-------------|
| 🛠️ **App Builder** | App Dev | 8 | Complete app specification |
| 🎨 **Product Design** | Product | 6 | Product design document |
| 📣 **Marketing Campaign** | Marketing | 5 | Campaign brief & strategy |
| 📈 **Business Strategy** | Business | 4 | Strategic decision document |
| 🔐 **Security Assessment** | Security | 5 | Security assessment report |
| 🔬 **Research Project** | Research | 4 | Research proposal |
| 🔧 **System Design** | Technical | 5 | System design document |
| ✍️ **Content Strategy** | Content | 5 | Content strategy plan |
| 📊 **Data Analysis** | Research | 5 | Data analysis plan |

**Wizard Features:**

- ✅ Click-to-jump step navigation
- ✅ Auto-save drafts (localStorage)
- ✅ Field tips and guidance
- ✅ Progress bar
- ✅ Export to clipboard / download .md

---

## 📁 Project Structure

```
src/
├── app/
│   └── page.tsx          # Main app with routing
├── components/
│   ├── AppBuilderWizard.tsx
│   ├── ProductDesignWizard.tsx
│   ├── MarketingCampaignWizard.tsx
│   ├── BusinessStrategyWizard.tsx
│   ├── SecurityAssessmentWizard.tsx
│   ├── ResearchProjectWizard.tsx
│   ├── SystemDesignWizard.tsx
│   ├── ContentStrategyWizard.tsx
│   ├── DataAnalysisWizard.tsx
│   └── ... other components
├── lib/
│   ├── templates.ts      # All templates
│   ├── cvf-engine.ts     # CVF processing
│   └── theme.ts          # Theme toggle
└── types/
    └── index.ts          # TypeScript types
```

---

## 🎯 How to Use

### Templates

1. Browse categories (Business, Technical, etc.)
2. Select a template
3. Fill in the fields
4. Generate your prompt

### Wizards

1. Navigate to category
2. Click the wizard (marked with icon like 🛠️ 🎨 📣)
3. Complete steps sequentially
4. Review and export

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **State**: React useState/useCallback
- **Storage**: localStorage (drafts)
- **Language**: TypeScript

---

## 📝 License

CC BY-NC-ND 4.0 License - Part of Controlled Vibe Framework (CVF)
