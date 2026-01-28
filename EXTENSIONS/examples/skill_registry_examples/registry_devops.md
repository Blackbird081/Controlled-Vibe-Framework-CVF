1. Registry Purpose

Registry này minh họa cách đăng ký, kiểm soát và truy xuất capability trong domain DevOps theo CVF v1.2.

Registry KHÔNG thực thi
Registry KHÔNG mô tả tool
Registry chỉ ánh xạ capability ↔ contract ↔ governance

2. Registry Scope

DOMAIN: devops

CVF_VERSION: 1.2

GOVERNANCE_LEVEL: Strict

3. Registered Capabilities
3.1 DEVOPS_GIT_PUSH

CAPABILITY_ID: DEVOPS_GIT_PUSH

CONTRACT_FILE:
examples/canonical_skill_contracts/devops_git_push.contract.md

Governance Summary

Risk Level: High

Allowed Archetypes: Executor

Allowed Phases: Implementation

Human Approval Required: Yes

Registry Rules

Không được gọi trực tiếp

Chỉ được resolve sau:

APPROVED_CHANGESET

APPROVED_COMMIT_INTENT

Execution phải log đầy đủ audit fields

3.2 FILESYSTEM_FILE_WRITE

CAPABILITY_ID: FILESYSTEM_FILE_WRITE

CONTRACT_FILE:
examples/canonical_skill_contracts/filesystem_file_write.contract.md

Governance Summary

Risk Level: Medium

Allowed Archetypes: Executor

Allowed Phases: Implementation

Human Approval Required: Conditional

Registry Rules

Bắt buộc PATH_VALIDATED

Không được dùng để ghi file ngoài scope đã approve

Không chaining với deployment capability

4. Resolution Rules (CRITICAL)

Registry KHÔNG chọn agent
Registry KHÔNG trigger execution

Registry chỉ:

Nhận request capability

Kiểm tra:

Phase

Archetype

Decision

Status

Trả về:

Contract reference

Governance constraints

Nếu fail → DENY

5. Explicit Prohibitions

Registry KHÔNG ĐƯỢC:

Gắn agent cụ thể

Gắn tool / API / SDK

Chứa execution logic

Thay đổi Skill Contract

6. Audit Implications

Mọi lần resolve capability phải log:

capability_id

requester

phase

decision snapshot

registry_decision (ALLOW / DENY)

7. Canonical Status

Registry này là ví dụ chuẩn cho domain DevOps trong CVF v1.2
Có thể copy cho domain khác mà không cần sửa core