1. Capability Metadata

CAPABILITY_ID: AGENTIC_LOOP_CONTROLLER

DOMAIN: agentic-operations

DESCRIPTION:
Thực thi tác vụ tự động nhiều bước theo spec, với persistence qua git,
sandbox enforcement, và human review checkpoints. Quản lý toàn bộ vòng
đời build từ decompose task → execute → commit → review.

RISK_LEVEL: High (R3)

2. Governance Constraints

ALLOWED_ARCHETYPES: Orchestrator (primary), Builder (with approval)

ALLOWED_PHASES: Build, Review

REQUIRED_DECISIONS:

EXECUTION_PLAN_APPROVED (human must approve task list before start)
ITERATION_LIMIT_SET (mandatory, no default)
BASH_ALLOWLIST_CONFIRMED (approved command set)

REQUIRED_STATUS:

PROJECT_DIRECTORY_IDENTIFIED
GIT_REPO_INITIALIZED
SANDBOX_ACTIVE

3. Input Specification

INPUT_FIELDS:

task_spec
  type: string | file
  validation: non-empty, parseable specification
  required

feature_list
  type: array[{id: string, name: string, status: enum(pending, in-progress, done, failed)}]
  validation: at least 1 task
  required

max_iterations
  type: integer
  validation: > 0, <= 100
  required (no default — must be explicit)

allowed_commands
  type: array[string]
  validation: subset of [ls, cat, npm, node, git, grep, ps, lsof, pwd, echo, mkdir, rm, cp, mv, touch]
  default: [ls, cat, npm, node, git, grep]

project_dir
  type: string
  validation: existing directory, within workspace
  required

review_interval
  type: integer
  validation: > 0
  default: 5

auto_commit
  type: boolean
  default: true

4. Output Specification

OUTPUT_FIELDS:

execution_report
  type: object
  fields: {tasks_completed: int, tasks_failed: int, total_iterations: int, git_commits: array[string]}

per_task_result
  type: array[{task_id: string, status: enum(done, failed, skipped), commit_hash: string?, error: string?}]

audit_trail
  type: array[{iteration: int, command: string, output_summary: string, files_changed: array[string], timestamp: string}]

5. Execution Properties

SIDE_EFFECTS:
  - File system mutation (create, edit, delete files)
  - Git commits to repository
  - npm/node process execution
  - Terminal command execution

ROLLBACK_POSSIBILITY: Yes (git revert to pre-loop commit)

IDEMPOTENCY: No (each run creates new commits)

EXPECTED_DURATION: Long (minutes to hours)

CONCURRENCY: Single instance only (no parallel loops)

6. Failure & Risk Notes

KNOWN_FAILURE_MODES:

  Infinite loop (mitigated by mandatory iteration limit)
  Command injection (mitigated by bash allowlist)
  Scope creep (mitigated by filesystem sandbox)
  Cascading errors (mitigated by auto-escalation after 3 failures)
  Resource exhaustion (mitigated by iteration limit + timeout)

WORST_CASE_IMPACT:

  Repository corruption (recoverable via git)
  Unintended file deletion (recoverable via git)
  API quota exhaustion

HUMAN_INTERVENTION_REQUIRED: Yes (initial approval + periodic review)

ESCALATION_RULES:
  - 3 consecutive task failures → auto-pause + request human review
  - Any command not in allowlist → immediate halt
  - Any file access outside project directory → immediate halt + alert

7. Audit & Trace Requirements

AUDIT_FIELDS:

  timestamp
  iteration_number
  actor (agent ID)
  command_executed
  command_output_hash
  files_changed (paths + checksums)
  task_id
  task_status
  git_commit_hash
  approval_status

TRACE_LEVEL: Full (every command, every file change, every decision)

8. Security Model

SANDBOX_TYPE: Filesystem restriction + bash allowlist

CONTAINER_REQUIRED: Recommended but not mandatory

NETWORK_ACCESS: Limited to npm registry (if npm in allowlist)

CREDENTIAL_HANDLING: No credentials in command arguments or logs

PROCESS_ISOLATION: Child processes inherit sandbox restrictions
