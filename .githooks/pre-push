#!/usr/bin/env sh

set -eu

repo_root="$(git rev-parse --show-toplevel)"
expected_remote='https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git'

git fetch origin main --quiet
python "$repo_root/scripts/check_cvf_public_sync_candidate.py" \
  --public-root "$repo_root" \
  --expected-remote "$expected_remote" \
  --baseline-ref origin/main
