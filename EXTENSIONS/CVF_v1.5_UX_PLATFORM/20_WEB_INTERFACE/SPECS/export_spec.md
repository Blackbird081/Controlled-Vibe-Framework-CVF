# 📄 Export Spec

**CVF v1.5 — Web Interface**

---

## Overview

Export output sang các formats phổ biến.

---

## Supported Formats

| Format | Extension | Library |
|--------|-----------|---------|
| PDF | .pdf | jsPDF + html2canvas |
| Word | .docx | docx.js |
| Markdown | .md | Native |
| HTML | .html | Native |
| Plain Text | .txt | Native |

---

## Export Dialog

```
┌─────────────────────────────────────────┐
│ Export Result                           │
│ ─────────────────────────────────────── │
│                                         │
│ Format:                                 │
│ ○ PDF  ○ Word  ● Markdown  ○ HTML      │
│                                         │
│ Options:                                │
│ ☑ Include metadata                     │
│ ☑ Include timestamp                    │
│ ☐ Include input (for reference)        │
│                                         │
│ Filename:                               │
│ [strategy_analysis_2026-02-01.md    ]  │
│                                         │
│        [Cancel]     [Export 📥]         │
└─────────────────────────────────────────┘
```

---

## PDF Layout

```
┌─────────────────────────────────────────┐
│  CVF v1.5 — Strategy Analysis           │
│  Generated: 2026-02-01 15:30            │
│ ─────────────────────────────────────── │
│                                         │
│  [Rendered markdown content]            │
│                                         │
│                                         │
│                                         │
│ ─────────────────────────────────────── │
│  Footer: CVF v1.5 UX Platform     1/3   │
└─────────────────────────────────────────┘
```

---

## Word Template

```xml
<w:document>
  <w:body>
    <w:sdt>
      <w:sdtPr><w:alias w:val="Title"/></w:sdtPr>
      <w:p><w:r><w:t>[Title]</w:t></w:r></w:p>
    </w:sdt>
    <w:p><w:r><w:t>[Content]</w:t></w:r></w:p>
  </w:body>
</w:document>
```

---

## API Integration

```javascript
async function exportResult(executionId, format, options) {
  const result = await api.getResult(executionId);
  
  switch(format) {
    case 'pdf':
      return await exportToPDF(result, options);
    case 'docx':
      return await exportToWord(result, options);
    case 'md':
      return exportToMarkdown(result, options);
    case 'html':
      return exportToHTML(result, options);
  }
}
```

---

*Export Spec — CVF v1.5 Web Interface*
