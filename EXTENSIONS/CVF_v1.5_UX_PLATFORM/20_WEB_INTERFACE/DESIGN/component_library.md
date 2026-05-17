# 🧩 Component Library

**CVF v1.5 — Web Interface**

---

## Overview

Reusable UI components cho CVF Web Interface.

---

## Form Components

### TextField
```jsx
<TextField
  label="Chủ đề chiến lược"
  placeholder="Nhập chủ đề..."
  required={true}
  maxLength={200}
/>
```

### TextArea
```jsx
<TextArea
  label="Bối cảnh"
  placeholder="Mô tả bối cảnh..."
  rows={5}
  required={true}
/>
```

### Select
```jsx
<Select
  label="Ưu tiên"
  options={["Growth", "Stability", "Cost"]}
  defaultValue="Growth"
/>
```

### MultiSelect
```jsx
<MultiSelect
  label="Focus areas"
  options={["Security", "Performance", "Style"]}
/>
```

---

## Button Components

### Primary Button
```jsx
<Button variant="primary" icon="🚀">Submit</Button>
```

### Secondary Button
```jsx
<Button variant="secondary">Cancel</Button>
```

### Action Buttons
```jsx
<ButtonGroup>
  <Button variant="success" icon="✅">Accept</Button>
  <Button variant="danger" icon="❌">Reject</Button>
  <Button variant="secondary" icon="↻">Retry</Button>
</ButtonGroup>
```

---

## Card Components

### Template Card
```jsx
<TemplateCard
  icon="📊"
  title="Strategy Analysis"
  description="Phân tích chiến lược kinh doanh"
  onClick={() => navigate('/form/strategy')}
/>
```

### History Card
```jsx
<HistoryCard
  status="accepted" // or "rejected"
  title="Strategy Analysis"
  subtitle="Mở rộng thị trường miền Trung"
  timestamp="Today 15:20"
/>
```

---

## Feedback Components

### Loading
```jsx
<Loading
  progress={60}
  message="Processing..."
  estimatedTime="15 seconds"
/>
```

### Error
```jsx
<Error
  title="Unable to process"
  message="Please add more context."
  actions={["Try Again", "Edit Input"]}
/>
```

### Success
```jsx
<Success
  title="Analysis Complete"
  message="Your result is ready."
/>
```

---

## Layout Components

### Container
```jsx
<Container maxWidth="lg" padding="xl">
  {children}
</Container>
```

### Grid
```jsx
<Grid columns={4} gap="md">
  <TemplateCard />
  <TemplateCard />
</Grid>
```

---

*Component Library — CVF v1.5 Web Interface*
