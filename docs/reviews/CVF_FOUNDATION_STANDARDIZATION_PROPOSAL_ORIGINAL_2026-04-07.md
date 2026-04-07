# Đề Xuất: Chuẩn hóa Cấu hình Install & Test cho 4 Foundation Packages

Tài liệu này đề xuất giải pháp kỹ thuật nhằm chuẩn hóa môi trường (install, test, type-check) cho 4 package nền tảng (CPF, EPF, GEF, LPF) của hệ thống CVF trước khi hệ thống mở rộng sang giai đoạn thi công MC4.

## 1. Hiện trạng (Evidence)

Dựa trên quá trình rà soát mã nguồn trong root workspace, hiện trạng được ghi nhận như sau:

**1.1. Root `package.json` chưa tích hợp npm workspaces**
- Tệp `package.json` tại thư mục root hiện tại rất sơ sài, chỉ chứa dependency duy nhất: `"devDependencies": { "@types/node": "^25.3.0" }`.
- Nó không được thiết lập để quản lý các package con thuộc nhánh `EXTENSIONS/`. Do đó, người dùng hoặc CI không thể dùng duy nhất một lệnh `npm install` tại root để cài đặt và liên kết (hoist) tất cả các package như `vitest` hay `typescript`. 
- **Dẫn chứng:** Không tồn tại key `"workspaces"` trong `package.json`.

**1.2. Mâu thuẫn giữa các package con (GEF vs CPF/EPF/LPF)**
- Các file `package.json` của CPF, EPF và LPF đều có các script rõ ràng:
  - `"test": "vitest run --config vitest.config.ts"`
  - `"test:coverage": "vitest run --coverage --config vitest.config.ts"`
  - `"check": "tsc -p tsconfig.json --noEmit"`
- Trong khi đó, `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package.json` (GEF) lại **bị thiếu**. Script `test` chỉ chạy `"vitest run"` mà không tuân theo config chuẩn. Không tồn tại script `check` (TypeScript validation) như 3 package vệ tinh kia.
- **Dẫn chứng:** Kiểm tra trực tiếp file `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package.json`.

**1.3. Phương pháp chạy lệnh cũ trong `AGENT_HANDOFF.md`**
- Mục `Test Commands` trong file `AGENT_HANDOFF.md` đang chỉ dẫn người dùng phải `cd` vào từng package con để chạy npm test (VD: `cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test`).
- **Dẫn chứng:** Dòng 283-295 file `AGENT_HANDOFF.md` (Version: 2026-04-05).

**1.4. Đề nghị từ người dùng**
- Người dùng ghi nhận `vitest`/`tsc` local không chạy được trong không gian làm việc hiện tại, do các extension không được bootstrap chung với root node_modules.

## 2. Giải pháp Đề xuất

### Giai đoạn 1: Khởi tạo NPM Workspaces ở Root
Sửa đổi `package.json` gốc ở thư mục ngoài cùng để gộp chung 4 target component dưới dạng các workspaces. Giải pháp này giúp cài đặt thống nhất toàn bộ dependency và cho phép chạy CLI từ root.

Thêm vào `package.json` ở root:
```json
{
  "workspaces": [
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION",
    "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION"
  ],
  "scripts": {
    "test:cpf": "npm test --workspace=cvf-control-plane-foundation",
    "test:epf": "npm test --workspace=cvf-execution-plane-foundation",
    "test:gef": "npm test --workspace=cvf-governance-expansion-foundation",
    "test:lpf": "npm test --workspace=cvf-learning-plane-foundation",
    "test:foundations": "npm run test:cpf && npm run test:epf && npm run test:gef && npm run test:lpf",
    "check:foundations": "npm run check --workspace=cvf-control-plane-foundation && npm run check --workspace=cvf-execution-plane-foundation && npm run check --workspace=cvf-governance-expansion-foundation && npm run check --workspace=cvf-learning-plane-foundation"
  },
  "devDependencies": {
    "@types/node": "^25.3.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.1",
    "@vitest/coverage-v8": "^1.6.1"
  }
}
```

**Tại sao chọn cách này?**
- Phù hợp nhất với chuẩn cấu hình multi-level/monorepo của NPM/Yarn/PNPM. 
- Chỉ tốn 1 lệnh `npm install` gốc là mọi package con đều có thể dùng chung `vitest` được hoist lên `node_modules` ngoài root.

### Giai đoạn 2: Lấp khoảng trống config cho GEF
Chuẩn hóa `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package.json` cho trùng khớp quy ước của CPF. Thay đổi nhánh `scripts` bao gồm:
```json
  "scripts": {
    "test": "vitest run --config vitest.config.ts",
    "test:coverage": "vitest run --coverage --config vitest.config.ts",
    "test:watch": "vitest",
    "check": "tsc -p tsconfig.json --noEmit"
  }
```

### Giai đoạn 3: Rà soát & Cập nhật Docs / CI
- **AGENT_HANDOFF.md**: Sửa lại mục cấu trúc `Test Commands`, thay các lệnh `cd` bằng lệnh root-scoped `npm run test:foundations` nhằm cập nhật quy trình làm việc chuẩn cho developer.
- **CI / .github/workflows** (Nếu có / Cần thảo luận): Do repo hiện cho CI chạy một phần theo pipeline cô lập, cần xác định xem chúng ta có trực tiếp dọn dẹp các script bash trong CI để trỏ thẳng tới workspace `check` và `test` hay không.

## 3. Câu hỏi phản biện cho Agent

- **Tính tương thích:** CVF có tính đóng mở cao. Cấu trúc npm workspaces có ảnh hưởng tới cơ chế publish độc lập của từng foundation đang có không?
- **Phạm vi CI:** Bạn có muốn đẩy thay đổi lên luồng tích hợp hệ thống (CI workflows) ngay lập tức không?
- **Sức chứa repo:** Nếu hoist toàn bộ dependency của 4 package ra ngoài, có tiềm ẩn xung đột version giữa bộ core và các foundation mở rộng cho hệ thống (ECOSYSTEM) khác hay không? (Ví dụ: Các project trong ECOSYSTEM hay ui_governance_engine).

---------------------------------------------------------------------------
Tôi đồng ý một phần, không đồng ý toàn phần.

Tôi đồng ý với chẩn đoán vấn đề và với hướng chuẩn hóa GEF trong proposal, đặc biệt phần nêu root package.json đang quá mỏng và GEF thiếu script check/test:coverage so với CPF/EPF/LPF tại CVF_FOUNDATION_STANDARDIZATION_PROPOSAL.md, CVF_FOUNDATION_STANDARDIZATION_PROPOSAL.md, package.json, package.json. Phần này là hợp lý và đáng làm.

Nhưng tôi không đồng ý với việc đưa root npm workspaces thành chuẩn mặc định ngay bây giờ như ở CVF_FOUNDATION_STANDARDIZATION_PROPOSAL.md. Lý do chính là nó xung đột trực tiếp với posture hiện tại của repo: tài liệu setup chính thức đang yêu cầu “chỉ npm ci trong extension đang dùng”, không preinstall toàn bộ stack, tại CVF_NEW_MACHINE_SETUP_CHECKLIST.md và CVF_NEW_MACHINE_SETUP_CHECKLIST.md. Nói ngắn gọn: proposal đúng về pain point, nhưng giải pháp Giai đoạn 1 là một thay đổi policy cấp repo, không còn là một fix hẹp để chuẩn bị cho MC4.

Quan điểm của tôi:

Đồng ý với Giai đoạn 2.
Chưa đồng ý với Giai đoạn 1 nếu áp dụng làm default.
Chưa nên đụng CI ngay ở Giai đoạn 3 trước khi chốt policy install.
Nếu cần hướng an toàn hơn, tôi khuyên:

chuẩn hóa ngay GEF scripts/config;
thêm một script orchestration ở root như scripts/run_foundation_checks.ps1 hoặc root scripts dùng npm --prefix, nhưng vẫn giữ mô hình install theo từng extension;
chỉ xem xét workspaces sau, nếu muốn đổi luôn policy setup của toàn repo và cập nhật toàn bộ canon docs tương ứng.