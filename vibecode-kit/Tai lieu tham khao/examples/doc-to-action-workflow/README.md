# Doc-to-Action Workflow

Mini-workflow dùng AI để biến 1 tài liệu (PDF/Docx) thành:
- **Summary**: tóm tắt cô đọng, có cấu trúc.
- **Action List**: checklist hành động áp dụng được.
- **Script Draft**: nháp kịch bản nói 3–5 phút.

## 1. Cài đặt nhanh

### 1.1. Cài dependencies

```bash
pip install -r requirements.txt
```

Hoặc cài thủ công:

```bash
pip install pyyaml pypdf python-docx openai
```

### 1.2. Tạo file config

```bash
cp config.example.yaml config.yaml
```

Chỉnh `config.yaml` theo model bạn muốn dùng.

### 1.3. Set API key

```bash
export OPENAI_API_KEY="your-api-key-here"
```

## 2. Cách chạy

### Cách chạy cơ bản

```bash
python doc2action.py input/your-document.pdf
```

### Với options

```bash
python doc2action.py input/your-document.pdf \
    --config config.yaml \
    --output-dir output \
    --user-context "health coach building a 4-week program"
```

### Xem help

```bash
python doc2action.py --help
```

## 3. Output

Sau khi chạy, bạn sẽ có 3 file trong thư mục `output/`:

| File | Mô tả |
|------|-------|
| `summary.md` | Tóm tắt có cấu trúc, 3-5 key insights |
| `action_list.md` | Checklist hành động theo phases (⭐ Must-do / ➕ Optional) |
| `script_draft.md` | Kịch bản nói 3-5 phút (Hook → Main → Takeaway) |

## 4. Cấu trúc thư mục

```text
examples/doc-to-action-workflow/
├── README.md
├── doc2action.py          # CLI script chính
├── config.example.yaml    # Template config
├── config.yaml            # Config thật (gitignore)
├── requirements.txt       # Python dependencies
├── prompts/
│   ├── summary_prompt.md
│   ├── action_prompt.md
│   └── script_prompt.md
├── input/
│   └── (đặt PDF/Docx của bạn ở đây)
└── output/
    ├── summary.md
    ├── action_list.md
    └── script_draft.md
```

## 5. Use cases

1. **Đọc sách/chương chuyên môn → Action plan cá nhân**
   - Input: sách về sức khỏe, dinh dưỡng, mindset
   - Output: summary + checklist áp dụng + script chia sẻ

2. **Paper/báo cáo AI/tech → Action cho dự án**
   - Input: bài báo về AI, workflow, sản phẩm số
   - Output: summary + checklist cho project + script giải thích

3. **Tài liệu phương pháp → Checklist coaching**
   - Input: framework, lộ trình, phương pháp
   - Output: summary + checklist theo tuần + script workshop

4. **Ebook/whitepaper → Content cho kênh cá nhân**
   - Input: ebook free, blog dài
   - Output: summary + ý tưởng content + script video

## 6. Config options

Xem `config.example.yaml` để biết các tùy chọn:

- `llm_provider`: hiện hỗ trợ `openai`
- `model_name`: model để dùng (vd: `gpt-4.1-mini`)
- `max_tokens`: giới hạn output
- `temperature`: độ sáng tạo (0.0 - 1.0)

## 7. Ghi chú

- Workflow này được build bằng **Vibecode Starter Kit**.
- Tham khảo `jobs/JOB-201-intake.md` để xem use cases & tiêu chí quality chi tiết.
- Prompts có thể customize trong `prompts/*.md`.
