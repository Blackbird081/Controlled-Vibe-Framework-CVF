# CVF vs LangChain / MCP / OpenAI Assistants

> **Ngày:** 08/02/2026  
> **Mục tiêu:** Làm rõ CVF **bổ trợ** (không cạnh tranh) với các nền tảng agent khác.

---

## 1. CVF là gì (cốt lõi)

- **CVF = Governance Framework** cho AI/Agent.  
- Cung cấp **spec chuẩn**, **risk/authority model**, **phase gate**, **UAT**, **audit log**.  
- Trọng tâm: **kiểm soát + minh bạch + traceability** cho người dùng không biết code.

---

## 2. LangChain là gì

- **LangChain = Orchestration framework** để xây agent/tool chain.  
- Giỏi về: tools, memory, chain, routing, multi-step agent.  
- Không tập trung vào governance hoặc compliance ở mức framework.

**CVF bổ trợ:**  
CVF cung cấp “luật chơi”, LangChain thực thi agent pipeline theo luật đó.

---

## 3. MCP là gì

- **MCP = Protocol** chuẩn hóa việc kết nối tool/data.  
- Giúp agent gọi tool một cách consistent và an toàn hơn.

**CVF bổ trợ:**  
CVF định nghĩa “được phép gọi tool nào, ở phase nào”. MCP là cơ chế kết nối kỹ thuật.

---

## 4. OpenAI Assistants là gì

- **Assistants = Hosted agent runtime** (storage, tool calls, thread).  
- Mạnh ở việc triển khai nhanh, nhưng governance/control phụ thuộc vào prompt + setup.

**CVF bổ trợ:**  
CVF chuẩn hóa spec + UAT + enforcement logic trước khi gửi vào Assistants.

---

## 5. Khi nào dùng CVF, khi nào dùng bên khác

| Nhu cầu | CVF | LangChain | MCP | Assistants |
|---|---|---|---|---|
| Governance / Risk / Audit | ✅ Core | ❌ | ❌ | ❌ |
| Tool orchestration | ⚪ (không phải core) | ✅ | ✅ | ⚪ |
| Hosted runtime | ❌ | ❌ | ❌ | ✅ |
| Non-coder usage | ✅ | ⚪ | ❌ | ⚪ |

---

## 6. Cách kết hợp khuyến nghị

1. **CVF + LangChain**  
   CVF định nghĩa spec + governance → LangChain thực thi orchestration.

2. **CVF + MCP**  
   CVF điều khiển quyền tool + scope → MCP đảm nhiệm kết nối tool.

3. **CVF + Assistants**  
   CVF chuẩn hóa input/output + UAT → Assistants chạy theo spec đã kiểm soát.

---

## 7. Thông điệp rõ ràng

- **CVF không thay thế** LangChain/MCP/Assistants.  
- **CVF là lớp governance** nằm *trên* hoặc *bọc ngoài* chúng.  
- Điều này giúp người dùng non-coder **tin tưởng kết quả** hơn.

