1️⃣ Định nghĩa Supreme Layer của CVF Ecosystem

Supreme Layer là:

Foundational doctrine of the CVF ecosystem

Các tài liệu ở tầng này:

định nghĩa tầm nhìn hệ sinh thái

định nghĩa định vị sản phẩm

định nghĩa nguyên tắc kiến trúc

Chúng không thay đổi theo version.

2️⃣ Bộ tài liệu Supreme Layer (đã hoàn chỉnh)

Hiện tại hệ thống đã đủ 3 tài liệu cốt lõi:

CVF_ECOSYSTEM_MAP.md
CVF_PRODUCT_POSITIONING.md
CVF_ARCHITECTURE_PRINCIPLES.md

Vai trò:

| File                           | Vai trò             |
| ------------------------------ | ------------------- |
| CVF_ECOSYSTEM_MAP.md           | bản đồ hệ sinh thái |
| CVF_PRODUCT_POSITIONING.md     | định vị sản phẩm    |
| CVF_ARCHITECTURE_PRINCIPLES.md | hiến pháp kiến trúc |

3️⃣ Quan hệ giữa 3 tài liệu

Hierarchy logic:

ECOSYSTEM_MAP
     │
     │ defines the world
     ▼
PRODUCT_POSITIONING
     │
     │ defines CVF role
     ▼
ARCHITECTURE_PRINCIPLES

Nghĩa là:

World → Product → Architecture
4️⃣ Quy tắc bổ sung tài liệu Supreme

Chỉ được thêm tài liệu nếu nó:

1️⃣ định nghĩa doctrine của ecosystem

2️⃣ không phụ thuộc version

3️⃣ không mô tả implementation

4️⃣ có hiệu lực trong nhiều năm

5️⃣ Những thứ KHÔNG được đưa vào Supreme Layer

Không được thêm các loại sau:

spec
implementation
build plan
task graph
repo structure
module design
feature list

Những thứ này thuộc:

Version Layer
6️⃣ Freeze Rule cho Supreme Layer

Nên thêm rule chung cho cả 3 file:

SUPREME DOCTRINE RULE

Documents in this layer define the fundamental doctrine
of the CVF ecosystem.

They must remain stable and should not change frequently.

Modifications require explicit architectural approval.
7️⃣ Kiến trúc documentation cuối cùng

Cấu trúc chuẩn nên là:

CVF_ECOSYSTEM/

docs/
│
├── doctrine/
│   ├── CVF_ECOSYSTEM_MAP.md
│   ├── CVF_PRODUCT_POSITIONING.md
│   └── CVF_ARCHITECTURE_PRINCIPLES.md
│
└── versions/
    └── v0.1/
        ├── README.md
        ├── CVF_v0.1_MASTER_SPEC.md
        ├── CVF_v0.1_IMPLEMENTATION_PLAN.md
        ├── CVF_v0.1_TASK_GRAPH.md
        ├── CVF_REPO_TREE_FINAL.md
        └── CVF_BUILD_PROMPT.md