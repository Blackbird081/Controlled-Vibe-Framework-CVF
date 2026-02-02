# Asset-to-Funnel Workflow

Workflow LocalAI để biến 1 asset nội dung dài (ebook, transcript, bài viết) thành bộ marketing funnel hoàn chỉnh.

## Output

Từ 1 file input, workflow sinh ra:
- **Email Sequence** (5-7 emails) - nurture leads
- **Social Posts** (5-10 posts) - kéo traffic
- **Short Scripts** (1-2 scripts 30-90s) - video content

## Quickstart

### 1. Cài đặt dependencies

```bash
cd examples/asset-to-funnel-workflow
pip install -r requirements.txt
```

### 2. Cấu hình

```bash
cp config.example.yaml config.yaml
export OPENAI_API_KEY="your-api-key"
```

### 3. Chạy workflow

```bash
python asset2funnel.py input/your-content.docx \
  --output-dir output/my-funnel \
  --user-context "Health coach for women 25-45" \
  --funnel-goal "Sell ebook and invite to free group"
```

### 4. Kết quả

```
output/my-funnel/
├── email_sequence.md    # 5-7 emails với Subject, Preview, Body, CTA
├── social_posts.md      # 5-10 posts với Platform, Caption, Visual idea
└── short_scripts.md     # 1-2 scripts với Hook, Main points, CTA
```

## Supported Formats

- `.docx` - Word documents
- `.pdf` - PDF files
- `.txt` - Plain text
- `.md` - Markdown (nice-to-have)

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--config` | Path to config file | `config.yaml` |
| `--output-dir` | Output directory | `output/` |
| `--user-context` | Your role/persona | None |
| `--funnel-goal` | Funnel objective | None |

## Use Cases

1. **Creator cá nhân**: Ebook chapter → email sequence để nurture list
2. **Coach/Consultant**: Livestream transcript → social posts để kéo traffic
3. **Founder**: Whitepaper → short video scripts để quảng bá
4. **Người viết sách**: Sách → marketing materials

## SaaS được thay thế

- Jasper AI
- Copy.ai
- Repurpose.io
- ContentStudio
- Và các app repurpose content khác...

---

*Workflow này được tạo theo Vibecode Starter Kit framework.*
