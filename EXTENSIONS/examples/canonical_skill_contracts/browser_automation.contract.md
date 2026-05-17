1. Capability Metadata

CAPABILITY_ID: BROWSER_AUTOMATION

DOMAIN: web-interaction

DESCRIPTION:
Điều khiển trình duyệt web qua Playwright trong container Docker cô lập.
Hỗ trợ điều hướng, đọc DOM, điền form, click, cuộn, chụp ảnh màn hình,
và tìm kiếm text. Dùng cho E2E testing và web scraping có quản trị.

RISK_LEVEL: High (R3)

2. Governance Constraints

ALLOWED_ARCHETYPES: Builder

ALLOWED_PHASES: Build

REQUIRED_DECISIONS:

DOMAIN_ALLOWLIST_APPROVED (list of permitted URLs/domains)
CONTAINER_RUNNING (Docker with XVFB must be active)
TEST_DATA_ONLY (no real credentials)

REQUIRED_STATUS:

DOCKER_CONTAINER_ACTIVE
XVFB_DISPLAY_READY
DOMAIN_ALLOWLIST_LOADED

3. Input Specification

INPUT_FIELDS:

url
  type: string (URL)
  validation: must match domain allowlist
  required

actions
  type: array[action_object]
  action_types: navigate, screenshot, read_page, form_input, left_click, scroll_down, scroll_up, search_text, wait, go_back
  validation: at least 1 action
  required

domain_allowlist
  type: array[string]
  validation: non-empty, valid domain patterns
  required

timeout
  type: integer (milliseconds)
  validation: > 0, <= 120000
  default: 30000

screenshot_dir
  type: string
  validation: writable directory path
  default: ./test-results/screenshots/

4. Output Specification

OUTPUT_FIELDS:

execution_log
  type: array[{action: string, timestamp: string, success: boolean, details: string}]

screenshots
  type: array[{name: string, path: string, timestamp: string}]

page_content
  type: object
  fields: {title: string, url: string, interactive_elements: array, text_content: string}

final_status
  type: enum(completed, timeout, error, blocked_domain)

5. Execution Properties

SIDE_EFFECTS:
  - Network requests to allowed domains
  - Form submissions may trigger server-side actions
  - Screenshot files written to disk
  - Browser process spawned in container

ROLLBACK_POSSIBILITY: Partial (cannot undo form submissions)

IDEMPOTENCY: No (form submissions, clicks have side effects)

EXPECTED_DURATION: Medium (seconds to minutes)

CONCURRENCY: Single browser session per container

6. Failure & Risk Notes

KNOWN_FAILURE_MODES:

  Navigation to blocked domain (mitigated by allowlist enforcement)
  Container escape attempt (mitigated by Docker isolation)
  Credential leak (mitigated by test-data-only policy)
  Session timeout (mitigated by configurable timeout)
  DOM element not found (handled gracefully with error logging)

WORST_CASE_IMPACT:

  Unintended form submission on production site
  Credential exposure (if policy violated)
  IP ban from target site (excessive requests)

HUMAN_INTERVENTION_REQUIRED: Yes (approve domain allowlist + any new domains)

ESCALATION_RULES:
  - Navigation to domain not in allowlist → immediate block + request approval
  - Real credentials detected in form input → immediate halt + alert
  - 3 consecutive action failures → pause + request human guidance
  - Container health check failure → terminate session

7. Audit & Trace Requirements

AUDIT_FIELDS:

  timestamp
  actor (agent ID)
  action_type
  target_url
  target_element (CSS selector or ref)
  input_value (redacted if flagged)
  action_result
  screenshot_path
  session_id
  container_id

TRACE_LEVEL: Full (every action, every navigation, every screenshot)

8. Security Model

SANDBOX_TYPE: Docker container with XVFB virtual display

CONTAINER_REQUIRED: Mandatory (cannot run on bare metal)

NETWORK_ACCESS: Restricted to domain allowlist only

CREDENTIAL_HANDLING:
  - No real passwords, tokens, or API keys
  - Test data only
  - Input values scanned for credential patterns before submission

PROCESS_ISOLATION: Full container isolation, no host filesystem access
