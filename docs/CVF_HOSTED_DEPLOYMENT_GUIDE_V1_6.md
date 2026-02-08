# CVF v1.6 Hosted Deployment Guide

> **Updated:** 2026-02-08  
> **Scope:** CVF Agent Platform (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`)

## 1) Mục tiêu

- Đưa CVF v1.6 lên môi trường hosted (Vercel/Netlify)
- Non-coders chỉ cần mở URL là dùng được
- Chuẩn hóa biến môi trường và cấu hình build

---

## 2) Biến môi trường bắt buộc

Chỉ cần **1 provider** có API key là chạy được.

```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
DEFAULT_AI_PROVIDER=openai
```

**Optional**
```
NEXT_PUBLIC_CVF_MOCK_AI=1
MODEL_PRICING_JSON={...}
```

Xem mẫu trong:  
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.example`

---

## 3) Deploy lên Vercel (khuyến nghị)

1. Tạo project mới tại Vercel.
2. Select repo → Framework = **Next.js**.
3. Root directory: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
4. Add env vars như trên.
5. Deploy.

**File cấu hình:**  
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/vercel.json`

---

## 4) Deploy lên Netlify

1. New site → Import repo.
2. Base directory: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add env vars như trên.

**File cấu hình:**  
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/netlify.toml`

---

## 5) Post-deploy checklist

- [ ] Trang home load OK  
- [ ] Settings mở được  
- [ ] API key wizard hoạt động  
- [ ] Agent Chat gọi được provider  
- [ ] Mock AI mode hiển thị đúng (nếu bật)  

---

## 6) Lưu ý bảo mật

- Không commit `.env.local`
- Nếu dùng hosted, **ưu tiên server-side key** (env vars platform)
- Nếu demo: bật `NEXT_PUBLIC_CVF_MOCK_AI=1`

---

## 7) Troubleshooting nhanh

- 500 API error → kiểm tra API key env vars
- App trắng → thiếu build artifacts (check root/publish dir)
- “No API key configured” → mở Settings hoặc chạy wizard

