"""Exact-SHA public health verification for the existing sync promotion owner."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import time
from pathlib import Path

REQUIRED_WORKFLOWS = (
    "public-sync-preflight.yml", "ci.yml", "cvf-ci.yml",
    "cvf-static-ci.yml", "cvf-web-ci.yml", "documentation-testing.yml",
)
ZERO_SHA = "0" * 40
CANDIDATE_BASE_EXPRESSION = (
    "${{ github.event_name == 'pull_request' && github.event.pull_request.base.sha "
    "|| (github.event.before != '" + ZERO_SHA + "' && github.event.before) || 'origin/main' }}"
)


def project_candidate_trigger(text: str) -> str:
    """Public promotion must run health checks even for docs-only changes."""
    pattern = r"(?ms)^  push:\r?\n.*?(?=^  pull_request:)"
    matches = list(re.finditer(pattern, text))
    if len(matches) != 1:
        raise ValueError("Expected one push trigger before pull_request")
    push = matches[0].group(0)
    branch_lines = re.findall(r"(?m)^    branches: \[([^\r\n]*)\]\s*$", push)
    if re.search(r"(?m)^    branches:", push) and len(branch_lines) != 1:
        raise ValueError("Expected one literal inline push branch list")
    if re.search(r"(?m)^    branches-ignore:", push):
        raise ValueError("Push branch exclusions require explicit candidate review")
    projected = "  push:\n"
    if branch_lines:
        branches = branch_lines[0].strip()
        if "cvf-public-sync-candidate-*" not in branches:
            branches += ", 'cvf-public-sync-candidate-*'"
        projected += f"    branches: [{branches}]\n"
    # An unfiltered push already includes candidate branches; keep it unfiltered.
    text = re.sub(pattern, lambda _: projected, text)
    def project_base(match: re.Match) -> str:
        expression = match.group(2)
        if "github.event.before" not in expression or "github.event.pull_request.base.sha" not in expression:
            raise ValueError("Unknown BASE_SHA expression requires review")
        return match.group(1) + CANDIDATE_BASE_EXPRESSION
    # A newly created branch has an all-zero 'before', which is truthy in
    # Actions expressions but is not a Git commit. Full-history checkouts make
    # origin/main available for this first-push comparison; never use HEAD as
    # an empty self-comparison. PR and ordinary push ranges keep their real base.
    return re.sub(r"(?m)^(\s*BASE_SHA:\s*)(\$\{\{[^\r\n]*\}\})", project_base, text)


def classify_runs(runs: list[dict], sha: str, branch: str) -> dict:
    selected = {}
    for run in runs:
        if (run.get("head_sha") != sha or run.get("head_branch") != branch
                or run.get("event") != "push"):
            continue
        name = str(run.get("path", "")).rsplit("/", 1)[-1]
        if name not in REQUIRED_WORKFLOWS:
            continue
        rank = (int(run.get("id", 0)), int(run.get("run_attempt", 1)))
        old = selected.get(name)
        if old is None or rank > (int(old["id"]), int(old.get("run_attempt", 1))):
            selected[name] = run
    missing = sorted(set(REQUIRED_WORKFLOWS) - set(selected))
    pending = sorted(k for k, v in selected.items() if v.get("status") != "completed")
    failed = {k: v.get("conclusion") for k, v in selected.items()
              if v.get("status") == "completed" and v.get("conclusion") != "success"}
    return {"status": "FAIL" if failed else "WAIT" if missing or pending else "PASS",
            "sha": sha, "branch": branch, "missing": missing, "pending": pending,
            "failed": failed,
            "runs": {k: {f: v.get(f) for f in ("id", "run_attempt", "html_url", "conclusion")}
                     for k, v in selected.items()}}


def gh_json(*args: str):
    result = subprocess.run(["gh", *args], text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def wait_for_health(repo: str, sha: str, branch: str, timeout: float, receipt: Path) -> int:
    deadline = time.monotonic() + timeout
    while True:
        # head_sha limits the query; branch/event filtering avoids accepting a PR or
        # another branch's green run for the same commit. Pages preserve all runs.
        pages = gh_json("api", "--paginate", "--slurp",
                        f"repos/{repo}/actions/runs?head_sha={sha}&event=push&per_page=100")
        result = classify_runs([r for page in pages for r in page["workflow_runs"]], sha, branch)
        result["repository"] = repo
        if result["status"] == "PASS":
            # Fail closed if main/candidate moved during verification.
            tip = gh_json("api", f"repos/{repo}/git/ref/heads/{branch}")["object"]["sha"]
            if tip != sha:
                result.update(status="FAIL", refMismatch=tip)
        if result["status"] == "WAIT" and time.monotonic() >= deadline:
            result["status"] = "TIMEOUT"
        receipt.parent.mkdir(parents=True, exist_ok=True)
        receipt.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result), flush=True)
        if result["status"] != "WAIT":
            return 0 if result["status"] == "PASS" else 1
        time.sleep(10)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-workflows", type=Path)
    parser.add_argument("--repo")
    parser.add_argument("--sha")
    parser.add_argument("--branch")
    parser.add_argument("--timeout", type=float, default=1800)
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    if args.project_workflows:
        for name in REQUIRED_WORKFLOWS:
            if name == "public-sync-preflight.yml":
                continue
            path = args.project_workflows / ".github/workflows" / name
            path.write_text(project_candidate_trigger(path.read_text(encoding="utf-8")), encoding="utf-8")
        return 0
    if not all((args.repo, args.sha, args.branch, args.receipt)) or not re.fullmatch(r"[0-9a-f]{40}", args.sha):
        parser.error("repo, exact SHA, branch and receipt required")
    if args.timeout <= 0:
        parser.error("timeout must be positive")
    return wait_for_health(args.repo, args.sha, args.branch, args.timeout, args.receipt)


if __name__ == "__main__":
    raise SystemExit(main())
