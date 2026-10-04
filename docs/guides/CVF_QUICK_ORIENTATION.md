# CVF Quick Orientation — Hiểu CVF khi giao AI việc code

> **Mục đích:** Một trang giúp người mới hiểu CVF dùng để làm gì khi bạn giao AI viết hoặc sửa code, ai làm gì, và đi đâu tiếp.
> **Thời gian đọc:** ~15 phút
> **Viết lại:** 2026-10-02. Trang này không còn là bảng trạng thái hiện hành; các mốc tháng 4/2026 được giữ như bằng chứng lịch sử ở phần 6.

---

## Phần 1 — CVF Là Gì? (3 phút)

**CVF (Controlled Vibe Framework)** là hạ tầng quản trị cho AI agent: một lớp luật và bằng chứng nằm giữa người giao việc, AI agent và nơi agent thực thi. CVF không viết code thay bạn.

| CVF **là** | CVF **không phải** |
|---|---|
| Bộ quy tắc, quy trình và bằng chứng để kiểm soát việc AI làm | IDE hay công cụ tự viết code |
| Lớp quản trị cho tool và agent | Công cụ tạo agent (agent builder) |
| Độc lập với mô hình AI cụ thể | Gắn với một AI model hay một nhà cung cấp |
| Kiểm soát tại những điểm đã được tích hợp | Hệ thống kiểm soát mọi phiên agent ở mọi nơi |

Nguyên lý gốc: **kiểm soát luật chơi, không kiểm soát từng agent.** Nguồn: [Product Positioning](../../ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md).

Bốn trụ cột mà CVF quản trị: **Policy** (quy tắc), **Identity** (ai đang làm, quyền gì), **Execution** (thực thi có kiểm soát) và **Audit** (ghi vết để truy lại).

## Phần 2 — Ai Làm Gì? (3 phút)

| Vai trò | Việc của vai trò này |
|---|---|
| **Bạn (Human)** | Nêu mục tiêu và ranh giới; xem kết quả; quyết định những tác động cần phê duyệt (gửi dữ liệu ra ngoài, đổi phạm vi, đưa lên môi trường thật) |
| **AI agent** | Thực hiện đúng phần việc được giao, trong phạm vi file và hành động đã nêu, rồi trả bằng chứng |
| **CVF** | Đặt policy, danh tính, quyền và bằng chứng **tại những điểm thuộc phạm vi kiểm soát**: các bề mặt đã tích hợp CVF, hoặc quy trình bạn yêu cầu agent tuân theo |

Điểm cần nhớ: nếu bạn dùng một AI IDE hoặc chat bên ngoài và chỉ bảo AI "đọc luật CVF", đó là một quy trình làm việc bằng văn bản. Việc đó giúp ích, nhưng không có nghĩa CVF đang chặn hay ghi lại mọi thao tác của phiên đó.

## Phần 3 — Bảy Quyết Định Của Công Việc Có Quản Trị (3 phút)

Chuỗi chuẩn của công việc có quản trị (nguồn: [Governed Work Lifecycle](../reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md)):

```
INTAKE → DESIGN → SPEC → WORK ORDER → BUILD → REVIEW → FREEZE
```

| Quyết định | Câu hỏi trả lời |
|---|---|
| Intake | Bạn muốn gì, rủi ro và nguồn nào liên quan? |
| Design | Phạm vi, ngoài phạm vi, tiêu chí đạt là gì? |
| Spec | Kết quả đúng trông như thế nào, kiểm chứng ra sao? |
| Work Order | Agent được sửa file nào, làm hành động nào, dừng khi nào? |
| Build | Agent thực hiện và tự kiểm tra |
| Review | Người xem bằng chứng, đối chiếu tiêu chí, quyết định |
| Freeze | Chốt kết quả và việc được làm tiếp |

Đây là bảy **quyết định**, không phải bảy tài liệu hay bảy lần xin phép. Việc nhỏ có thể gộp nhiều quyết định vào một yêu cầu rõ ràng. Bằng chứng đã được chấp nhận ở bước trước được dùng lại, không chạy lại từ đầu. Trong phạm vi đã được cho phép, agent tiếp tục công việc và các sửa chữa liên quan khi mục tiêu, phạm vi file/hành động, mức rủi ro, loại tác động ngoài và người có quyền commit không đổi. Nếu một trong các ranh giới đó đổi, cần đúng thẩm quyền trước khi tiếp tục. Xem [Approval Continuity](../../governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md#governance-latency-and-approval-continuity).

Hướng dẫn cũ theo bốn bước (Discovery → Design → Build → Review) trong [VOM Quick Start](../../ECOSYSTEM/operating-model/CVF_VOM_QUICK_START.md) và theo version trong [HOW_TO_APPLY_CVF](../HOW_TO_APPLY_CVF.md) là các cách nhìn riêng cho người không viết code hoặc cho từng version; chúng không thay thế chuỗi bảy quyết định ở trên.

## Phần 4 — Ví Dụ Minh Họa: Giao AI Lọc Danh Sách Chi Tiêu (5 phút)

> **Ví dụ minh họa, chưa chạy thật.** Dữ liệu là dữ liệu giả. Không có lệnh nào của ví dụ được thực thi, và trang này không khẳng định CVF đang kiểm soát IDE của bạn.

**Tình huống.** Bạn có một ứng dụng nhỏ liệt kê chi tiêu. Bạn muốn thêm bộ lọc theo tháng.

**Bước 1 — Mục tiêu.** "Người dùng chọn một tháng và chỉ thấy các khoản chi của tháng đó."

**Bước 2 — Giao việc có ranh giới.** Một yêu cầu bạn có thể sao chép và sửa:

```
Mục tiêu: thêm bộ lọc theo tháng cho danh sách chi tiêu.
Được sửa: src/expenses/ExpenseList.tsx và src/expenses/ExpenseList.test.tsx.
Không được: sửa file khác, thêm thư viện, gọi mạng, dùng dữ liệu thật.
Kết quả đúng: chọn "2026-03" chỉ hiện khoản chi tháng 3; chọn tháng không có
khoản nào thì hiện dòng "Không có khoản chi trong tháng này"; để trống bộ lọc thì
hiện tất cả; ngày sai định dạng bị bỏ qua và không làm app lỗi.
Dữ liệu thử: 5 khoản chi giả do bạn tự nhập trong test.
Khi xong: liệt kê file đã sửa, kết quả test, và những gì bạn chưa kiểm tra.
Dừng và hỏi nếu cần sửa file ngoài danh sách trên.
```

**Bước 3 — Agent làm.** Agent chỉ sửa hai file, thêm vài test cho bốn trường hợp trên và chạy test của hai file đó.

**Bước 4 — Bằng chứng bạn xem.**

- Danh sách file đã đổi: đúng hai file, không thêm gì.
- Kết quả test: có ca "tháng không có khoản nào" và ca "ngày sai định dạng".
- Phần agent nói **chưa** kiểm tra (ví dụ chưa thử trên trình duyệt).

**Bước 5 — Bạn quyết định.** Chấp nhận, yêu cầu sửa, hoặc dừng. Nếu agent muốn sửa thêm file ngoài danh sách, đó là đổi ranh giới: bạn phải quyết định lại, agent không tự làm.

**Việc tiếp theo** sau khi chấp nhận: chỉ thực hiện bước đã được giao đúng thẩm quyền (ví dụ commit nếu bạn là người có quyền commit). Đưa lên môi trường thật, gửi dữ liệu ra ngoài hoặc dùng dữ liệu thật là tác động mới và cần phê duyệt riêng.

## Phần 5 — Mức Rủi Ro Và Khi Nào Cần Phép (2 phút)

Mức rủi ro phụ thuộc hành động và môi trường, không chỉ số file được sửa. [Carrier hiện hành — Risk Classification](../../governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md#risk-classification) phân biệt R0–R3; dữ liệu production, API ngoài, thay đổi bảo mật hoặc hành vi liên quan governance thuộc ít nhất R2. Dùng policy của workspace và đúng người có thẩm quyền để xác định mức áp dụng.

Ví dụ ở phần 4 chỉ minh họa phạm vi nhỏ với dữ liệu giả; trang này không tự phân loại hay phê duyệt một tác vụ thật. Việc có thể hoàn tác vẫn phải nằm trong phạm vi đã được cho phép.

## Phần 6 — Đã Chứng Minh Gì, Chưa Chứng Minh Gì

Có ba loại thông tin khác nhau, đừng nhầm lẫn:

- **Quy tắc bằng văn bản:** doctrine, chuẩn và hướng dẫn như trang này.
- **Mã nguồn đã có:** các thành phần trong repository, ví dụ Web UI và guard contract.
- **Bằng chứng đã được chấp nhận trong phạm vi hẹp:** ví dụ kiểm thử mô phỏng hoặc một lần chạy có ghi nhận. Chúng đúng cho đúng điều kiện đó.

Trang này **không** chứng minh: CVF chặn mọi agent hay mọi phiên làm việc; một nhà cung cấp AI cụ thể đã sẵn sàng; việc chuyển giao kết quả giữa người dùng đã được chấp nhận bền vững; hay hệ thống đã sẵn sàng cho môi trường thật.

Các mốc tháng 4/2026 (Release Candidate, bằng chứng live, tình trạng nhà cung cấp) là **bằng chứng lịch sử đã ghi ngày**, không phải trạng thái hôm nay. Xem [Live Evidence Packet 2026-04-21](../reference/CVF_LIVE_EVIDENCE_PUBLICATION_PACKET_2026-04-21.md), [RC Truth Packet 2026-04-21](../reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md) và [Known Limitations](../reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md) kèm ngày của chúng.

## Phần 7 — Đi Đâu Tiếp?

| Bạn muốn gì? | Đọc gì? |
|---|---|
| Cài đặt và bắt đầu một project | [`GET_STARTED.md`](../GET_STARTED.md) |
| Áp dụng theo từng version | [`HOW_TO_APPLY_CVF.md`](../HOW_TO_APPLY_CVF.md) và [`VERSION_COMPARISON.md`](../VERSION_COMPARISON.md) |
| Hướng dẫn cho người không viết code | [`CVF_VOM_QUICK_START.md`](../../ECOSYSTEM/operating-model/CVF_VOM_QUICK_START.md) |
| Hiểu cấu trúc repo | [`CVF_PUBLIC_STRUCTURE_OVERVIEW.md`](../reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md) |
| Hiểu kiến trúc đầy đủ | [`CVF_CORE_KNOWLEDGE_BASE.md`](../CVF_CORE_KNOWLEDGE_BASE.md) |
| Xem quyết định kiến trúc | [`CVF_ARCHITECTURE_DECISIONS.md`](../CVF_ARCHITECTURE_DECISIONS.md) |
| Thư viện skill | [`CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS`](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |
| Web UI | [`CVF_v1.6_AGENT_PLATFORM`](../../EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/) |
| Hướng dẫn chi tiết solo/team/enterprise | [`docs/guides/`](./) |

> **Cập nhật file này khi:** doctrine hoặc chuỗi quyết định thay đổi. Không thêm bảng trạng thái hay số liệu đếm; hãy dẫn tới nguồn có ngày.

Text Encoding Exception: this bilingual guide preserves pre-existing Vietnamese
text and the arrow and dash separators used throughout; the 2026-10-02 rewrite
adds no new non-ASCII symbol class beyond Vietnamese letters, the arrow, the
em dash and the middle-dot-free table layout.
