# Đánh giá tích hợp AI-Research-SKILLs vào CVF

## Tổng quan

| | **CVF** | **AI-Research-SKILLs** |
|---|---------|----------------------|
| **Skills** | 141 (12 domains) | 85 (21 categories) |
| **Focus** | AI governance, coding workflow | AI research engineering |
| **Format** | `.skill.md` flat file | `SKILL.md` + `references/` folder |
| **Metadata** | YAML registry external | YAML frontmatter in-file |
| **License** | CC BY-NC-ND 4.0 | MIT |
| **Language** | Bilingual (VI/EN) | English only |
| **Platform** | Web UI + Agent Chat | CLI, Agent plugins |

---

## Phân tích tương thích

### ✅ Tương thích cao (có thể tích hợp trực tiếp)

| Orchestra Category | Skills | Tương đương CVF | Giá trị bổ sung |
|---|---|---|---|
| **Safety & Alignment** (4) | Constitutional AI, LlamaGuard, NeMo Guardrails, Prompt Guard | CVF kernel safety layer | Bổ sung công cụ thực thi cho kernel |
| **Agents** (4) | LangChain, LlamaIndex, CrewAI, AutoGPT | CVF Multi-Agent workflow | Mở rộng framework agent |
| **RAG** (5) | Chroma, FAISS, Pinecone, Qdrant, Sentence Transformers | CVF RAG agent skill | Vector DB implementation guides |
| **Prompt Engineering** (4) | DSPy, Instructor, Guidance, Outlines | CVF prompt evaluation skills | Structured output patterns |
| **Evaluation** (3) | lm-eval-harness, BigCode, NeMo Evaluator | CVF AI/ML evaluation domain | Benchmark implementation |

**→ 20/85 skills (24%) tương thích trực tiếp**

### 🟡 Tương thích có điều kiện

| Category | Skills | Điều kiện |
|---|---|---|
| **MLOps** (3) | W&B, MLflow, TensorBoard | Cần adapter cho CVF governance model |
| **Observability** (2) | LangSmith, Phoenix | Bổ sung monitoring cho CVF agent platform |
| **Multimodal** (7) | CLIP, Whisper, LLaVA, etc. | CVF có AI Multimodal agent skill — bổ sung chi tiết |

**→ 12/85 skills (14%) cần adapter**

### ⚠️ Ngoài scope CVF (nhưng có giá trị tham khảo)

| Category | Skills | Lý do |
|---|---|---|
| Model Architecture (5) | LitGPT, Mamba, etc. | CVF không train models |
| Fine-Tuning (4) | Axolotl, PEFT, etc. | CVF dùng pre-trained models |
| Distributed Training (6) | DeepSpeed, FSDP, etc. | Infrastructure level |
| Post-Training (8) | TRL, GRPO, RLHF, etc. | Research-specific |
| Optimization (6) | Flash Attention, GPTQ, etc. | Model optimization |
| Inference (4) | vLLM, TensorRT-LLM, etc. | Deployment-specific |

**→ 53/85 skills (62%) ngoài scope chính**

---

## Format khác biệt chính

```diff
# Orchestra SKILL.md format:
---
name: prompt-guard
description: Meta's 86M prompt injection detector...
version: 1.0.0
tags: [Safety, Prompt Injection, Security]
dependencies: [transformers, torch]
---
# Content with code examples

# CVF .skill.md format:
# Tên: 01_model_selection
# Domain: ai_ml_evaluation
# Difficulty: ⭐⭐
# Phase: A (Discovery)
# Content follows CVF 4-phase structure
```

| Khác biệt | Orchestra | CVF |
|---|---|---|
| Phase mapping | Không có | A/B/C/D phase gates |
| Risk level | Không có | R0-R3 risk classification |
| Governance | Không có | Authority matrix, approval flow |
| `references/` | 300KB+ deep docs | Không có (single file) |
| i18n | English only | Bilingual VI/EN |

---

## Đề xuất tích hợp

### Phương án: Reference Library (Khuyến nghị)

> Giữ nguyên AI-Research-SKILLs làm **thư viện tham khảo bên ngoài**, không merge vào skill registry.

**Lý do:**
1. **License conflict** — Orchestra MIT vs CVF CC BY-NC-ND 4.0
2. **Scope khác nhau** — Orchestra = ML research, CVF = AI governance
3. **Format khác nhau** — không thể merge trực tiếp vào 141-skill registry
4. **Maintenance** — Orchestra cập nhật riêng, CVF cập nhật riêng

**Cách thực hiện:**
1. Giữ `AI-Research-SKILLs/` trong `.gitignore` (không push lên CVF repo)
2. Trong Web UI, thêm **"External Skills"** section trỏ tới Orchestra repo
3. Khi cần, tham khảo Orchestra skills cho implementation details (VD: dùng Prompt Guard skill để cải thiện kernel contamination guard)

### Giá trị cụ thể có thể khai thác ngay

| Orchestra Skill | → CVF Enhancement |
|---|---|
| `prompt-guard` | Tham khảo để upgrade kernel contamination guard |
| `constitutional-ai` | Pattern cho refusal router policy |
| `crewai` | Patterns cho CVF Multi-Agent workflow |
| `dspy` | Structured prompt optimization cho agent skills |
| `langsmith` / `phoenix` | Observability patterns cho kernel telemetry |

---

## Kết luận

| Tiêu chí | Đánh giá |
|---|:---:|
| Tích hợp trực tiếp vào CVF skill registry | ❌ Không nên |
| Dùng làm reference library | ✅ Rất tốt |
| Giá trị bổ sung cho kernel | ✅ Cao (safety, agents) |
| Conflict risk | 🟡 License khác nhau |
| Effort cần thiết | 🟢 Thấp (chỉ tham khảo) |

**Verdict: Giữ làm reference → cherry-pick patterns khi cần.**
