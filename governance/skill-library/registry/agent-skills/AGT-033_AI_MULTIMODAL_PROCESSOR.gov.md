# AGT-033: AI Multimodal Processor

## Governance Metadata
- **ID:** AGT-033
- **Name:** AI Multimodal Processor
- **Version:** 1.0.0
- **Risk Level:** R2 — Supervised (external API calls, cost implications, data processing)
- **Authority:** Orchestrator, Builder
- **Phase:** Implementation, Integration, Data Processing
- **Dependencies:** AGT-025 (API Architecture), AGT-028 (Database for storage patterns)
- **Provenance:** Extracted from claudekit-skills/ai-multimodal (Gemini API multimodal processing), rewritten to CVF governance

---

## Purpose

Structured methodology for processing **audio, images, video, and documents** using multimodal AI APIs. Provides capability selection, model decision trees, cost optimization strategies, and quality assurance patterns for multimedia content understanding and generation.

---

## Capability Matrix

| Task | Audio | Image | Video | Document | Generation |
|------|:-----:|:-----:|:-----:|:--------:|:----------:|
| Transcription | ✅ | — | ✅ | — | — |
| Summarization | ✅ | ✅ | ✅ | ✅ | — |
| Q&A | ✅ | ✅ | ✅ | ✅ | — |
| Object Detection | — | ✅ | ✅ | — | — |
| Text Extraction (OCR) | — | ✅ | — | ✅ | — |
| Structured Output | ✅ | ✅ | ✅ | ✅ | — |
| Creation/Generation | TTS | — | — | — | ✅ |
| Timestamps | ✅ | — | ✅ | — | — |
| Segmentation | — | ✅ | — | — | — |

---

## Modality Selection Decision Tree

```
What content type are you processing?
│
├─ Audio file (MP3, WAV, FLAC, etc.)
│  ├─ Need transcription with timestamps? → Audio Transcription pipeline
│  ├─ Need summarization? → Audio Summarization pipeline
│  └─ Need speaker identification? → Multi-speaker Analysis pipeline
│
├─ Image file (PNG, JPEG, WebP)
│  ├─ Need text extraction? → OCR pipeline
│  ├─ Need object detection/bounding boxes? → Vision Detection pipeline
│  ├─ Need description/captioning? → Image Understanding pipeline
│  └─ Need to compare multiple images? → Multi-image Comparison pipeline
│
├─ Video file (MP4, MOV, WebM)
│  ├─ Need scene-by-scene breakdown? → Video Scene Analysis pipeline
│  ├─ Need Q&A about specific moments? → Temporal Q&A pipeline
│  └─ Need transcription + visual? → Video Transcription pipeline
│
├─ Document (PDF)
│  ├─ Need table/form extraction? → Document Extraction pipeline
│  ├─ Need chart/diagram analysis? → Visual Document Analysis pipeline
│  └─ Need structured JSON output? → Schema-based Extraction pipeline
│
└─ Need to CREATE content
   ├─ Text-to-image? → Image Generation pipeline
   ├─ Text-to-speech? → TTS pipeline
   └─ Image editing? → Image Editing pipeline
```

---

## Model Selection Guide

### Decision Tree
```
Need highest quality/accuracy? ──Yes──→ gemini-2.5-pro (most capable)
         │No
Need pixel segmentation? ──Yes──→ gemini-2.5-flash (2.5+ required)
         │No
Need image generation? ──Yes──→ gemini-2.5-flash-image (generation model)
         │No
Budget-sensitive / high volume? ──Yes──→ gemini-2.5-flash-lite (cheapest)
         │No
Standard multimodal task ──→ gemini-2.5-flash (best balance)
```

### Model Comparison
| Model | Quality | Speed | Cost (input) | Context | Best For |
|-------|---------|-------|-------------|---------|----------|
| gemini-2.5-pro | Highest | Slow | $3.00/1M | 2M | Complex analysis, critical accuracy |
| gemini-2.5-flash | High | Fast | $1.00/1M | 2M | General use, best price/perf |
| gemini-2.5-flash-lite | Good | Fastest | $0.50/1M | 1M | High volume, simple tasks |
| gemini-2.5-flash-image | N/A | Medium | $1.00/1M | N/A | Image generation only |

---

## Token Cost Reference

| Content Type | Token Rate | Example |
|-------------|-----------|---------|
| Audio | 32 tokens/second | 1 min = 1,920 tokens |
| Video (default) | ~300 tokens/second | 1 min ≈ 18,000 tokens |
| Video (low-res) | ~100 tokens/second | 1 min ≈ 6,000 tokens |
| PDF | 258 tokens/page | 100 pages ≈ 25,800 tokens |
| Image (small ≤384px) | 258 tokens fixed | — |
| Image (large) | Up to 1,548 tokens | Tiled based on size |

### Context Window Capacity
| Window | Video (default) | Video (low-res) | Audio | PDF |
|--------|----------------|-----------------|-------|-----|
| 2M tokens | ~2 hours | ~6 hours | ~17 hours | ~7,750 pages |
| 1M tokens | ~1 hour | ~3 hours | ~8.5 hours | ~3,875 pages |

---

## Implementation Patterns

### Pattern 1: Audio Transcription
```python
import google.genai as genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Upload audio (>20MB use File API)
audio_file = client.files.upload(file="podcast.mp3")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        audio_file,
        "Transcribe this audio with timestamps. Format: [MM:SS] Speaker: text"
    ]
)
print(response.text)
```

### Pattern 2: Document Table Extraction
```python
# Extract structured data from PDF
pdf_file = client.files.upload(file="invoice.pdf")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        pdf_file,
        "Extract all line items as JSON array: [{item, quantity, unit_price, total}]"
    ],
    generation_config={"response_mime_type": "application/json"}
)
```

### Pattern 3: Video Scene Analysis
```python
video_file = client.files.upload(file="product_demo.mp4")

# Wait for processing
import time
while video_file.state == "PROCESSING":
    time.sleep(5)
    video_file = client.files.get(video_file.name)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[
        video_file,
        "Analyze this video scene by scene. For each scene: timestamp, description, key objects."
    ]
)
```

### Pattern 4: Image Generation
```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents="A modern dashboard UI with dark theme, showing analytics charts",
    generation_config={
        "response_modalities": ["IMAGE", "TEXT"],
        "image_generation_config": {"aspect_ratio": "16:9"}
    }
)

# Save generated image
for part in response.candidates[0].content.parts:
    if part.inline_data:
        with open("dashboard.png", "wb") as f:
            f.write(part.inline_data.data)
```

---

## Cost Optimization Strategy

### Tier System
| Tier | Budget | Strategy |
|------|--------|----------|
| **Free** | $0 | 10-15 RPM, use flash-lite, optimize file sizes |
| **Low** | <$10/mo | Use flash for all, batch processing, cache results |
| **Medium** | $10-100/mo | Flash default, Pro for critical only, parallel batch |
| **High** | >$100/mo | Pro for quality, caching layer, preprocess media |

### Optimization Checklist
- [ ] Use `gemini-2.5-flash` as default (best price/performance)
- [ ] Use File API for files >20MB (avoids repeated upload)
- [ ] Compress media before upload (target reasonable quality)
- [ ] Process specific segments instead of full videos
- [ ] Use lower FPS for static/slow content
- [ ] Implement response caching for repeated queries
- [ ] Batch multiple files when possible
- [ ] Set appropriate character limits on responses
- [ ] Use `concise` format by default, `detailed` on request

---

## Size Limits Reference

| Method | Max Size | Retention |
|--------|---------|-----------|
| Inline (base64) | 20MB total request | N/A |
| File API | 2GB per file | 48 hours |
| Project quota | 20GB total | Rolling |

### Format Support
| Type | Formats | Limits |
|------|---------|--------|
| Audio | WAV, MP3, AAC, FLAC, OGG, AIFF | Max 9.5 hours |
| Image | PNG, JPEG, WebP, HEIC, HEIF | Max 3,600 per request |
| Video | MP4, MOV, AVI, WebM, MKV, FLV | Max 6 hours (low-res) |
| Document | PDF (vision), TXT, HTML, MD (text) | Max 1,000 pages |

---

## Error Handling Strategy

| Error Code | Meaning | Action |
|-----------|---------|--------|
| 400 | Invalid format/size | Validate before upload, check format support |
| 401 | Invalid API key | Check GEMINI_API_KEY env var |
| 403 | Permission denied | Verify API key restrictions/quotas |
| 404 | File not found | File may have expired (48h retention) — re-upload |
| 429 | Rate limit exceeded | Implement exponential backoff (2^n seconds) |
| 500 | Server error | Retry with backoff, max 3 attempts |

### Retry Pattern
```python
import time

async def api_call_with_retry(func, *args, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await func(*args)
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                time.sleep(wait)
                continue
            raise
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Upload uncompressed 4K video | Compress to reasonable quality first |
| Process entire 6-hour video for a 30s clip | Extract time segment before processing |
| Use Pro model for simple tasks | Use Flash for standard, Pro only for critical accuracy |
| Ignore File API for large files | Always use File API for >20MB |
| Hardcode API keys | Use environment variables with fallback chain |
| Skip error handling on API calls | Wrap all calls with retry + backoff |
| Request "detailed" format by default | Use "concise" default, "detailed" on explicit request |

---

## Constraints
- External API usage requires Orchestrator/Builder supervision (R2)
- Cost must be estimated BEFORE batch processing large media sets
- API keys must NEVER be hardcoded — use environment variable chain
- File API uploads expire after 48 hours — plan for re-upload if needed
- Rate limits must be respected — implement exponential backoff
- Generated content must pass safety filters before use
