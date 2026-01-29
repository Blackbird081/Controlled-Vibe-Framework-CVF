# CVF Dashboard — Capability Lifecycle Monitor

Modern web dashboard for monitoring CVF capabilities, audit logs, and risk distribution.

## Features

### 📊 Overview
- **Stats Cards** — Active, Proposed, Deprecated, Retired counts
- **Risk Distribution** — Visual bar chart of R0/R1/R2/R3 capabilities
- **Execution Stats** — Success rate, average duration, total executions
- **Recent Activity** — Latest audit log entries

### 🎯 Capabilities Management
- **Searchable Table** — Filter by name, domain, description
- **State Filter** — ACTIVE, PROPOSED, APPROVED, DEPRECATED, RETIRED
- **Risk Filter** — R0, R1, R2, R3
- **Detail View** — Full capability info with lifecycle transitions

### 📋 Audit Logs
- **Complete History** — All capability executions
- **Filter by** — Capability, status (SUCCESS/FAILED), date range
- **Detail View** — Full inputs, outputs, context, error messages

### ⚠️ Risk Analysis
- **Risk Level Cards** — R0/R1/R2/R3 with descriptions
- **Required Controls** — Per risk level
- **Active Capabilities** — Grouped by risk level

### ⚙️ Settings
- **Data Source** — Configure registry and audit log paths
- **Display Options** — Auto-refresh, show retired capabilities
- **Import/Export** — Backup and restore dashboard data

## Quick Start

### 1. Open in Browser

```bash
# Simply open the index.html file
start dashboard/index.html    # Windows
open dashboard/index.html     # macOS
xdg-open dashboard/index.html # Linux
```

### 2. With Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

### 3. With Python HTTP Server

```bash
cd EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/dashboard
python -m http.server 8080
# Open http://localhost:8080
```

## File Structure

```
dashboard/
├── index.html          # Main HTML
├── css/
│   └── styles.css      # Modern dark theme
├── js/
│   ├── data.js         # Sample data (replace with real data)
│   └── app.js          # Application logic
└── README.md           # This file
```

## Connecting to Real Data

### Option 1: Replace Sample Data

Edit `js/data.js` to load from your actual registry:

```javascript
// Replace sampleCapabilities with fetch from API
async function loadCapabilities() {
    const response = await fetch('/api/registry');
    return await response.json();
}

// Replace sampleAuditLogs with fetch from API
async function loadAuditLogs() {
    const response = await fetch('/api/audit');
    return await response.json();
}
```

### Option 2: Export from Python SDK

```python
# Generate registry.json from SDK
import json
from sdk import SkillRegistry

registry = SkillRegistry()
# ... register capabilities ...

# Export for dashboard
with open('dashboard/data/registry.json', 'w') as f:
    json.dump(registry.export(), f, indent=2)
```

### Option 3: Read from Audit Files

```python
# Export audit logs for dashboard
import json
from sdk.audit import AuditTracer

tracer = AuditTracer()
with open('dashboard/data/audit_logs.json', 'w') as f:
    json.dump(tracer.export_logs(), f, indent=2)
```

## Customization

### Theme Colors

Edit CSS variables in `css/styles.css`:

```css
:root {
    --bg-primary: #0f0f23;      /* Main background */
    --accent-primary: #6366f1;   /* Primary accent */
    --r0: #22c55e;               /* R0 color (green) */
    --r1: #3b82f6;               /* R1 color (blue) */
    --r2: #f59e0b;               /* R2 color (yellow) */
    --r3: #ef4444;               /* R3 color (red) */
}
```

### Add New Tabs

1. Add nav item in HTML:
```html
<a href="#" class="nav-item" data-tab="newtab">
    <span class="nav-icon">📌</span>
    <span>New Tab</span>
</a>
```

2. Add content section:
```html
<section id="tab-newtab" class="tab-content">
    <!-- Your content -->
</section>
```

## Screenshots

### Overview Tab
```
┌─────────────────────────────────────────────────────┐
│  Active: 4  │  Proposed: 1  │  Deprecated: 1  │  ...│
├─────────────────────────────────────────────────────┤
│  Risk Distribution    │  Execution Stats           │
│  R0 ████ 1           │  Success: 85.7%            │
│  R1 ██████ 2         │  Avg: 715ms                │
│  R2 ████ 2           │  Total: 7                  │
│  R3 ██ 1             │                            │
└─────────────────────────────────────────────────────┘
```

### Capabilities Tab
```
┌──────────────────────────────────────────────────────────────┐
│ [Search...]  [All States ▼]  [All Risk Levels ▼]            │
├──────────────────────────────────────────────────────────────┤
│ Capability ID       │ Domain │ Risk │ State  │ Owner │ ...  │
├──────────────────────────────────────────────────────────────┤
│ CODE_REVIEW_v1     │ dev    │ R1   │ ACTIVE │ dev   │ View │
│ DATABASE_QUERY_v1  │ data   │ R2   │ ACTIVE │ data  │ View │
└──────────────────────────────────────────────────────────────┘
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## License

MIT
