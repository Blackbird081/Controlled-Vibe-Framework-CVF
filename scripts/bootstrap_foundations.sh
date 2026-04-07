#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

FOUNDATIONS="
EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION
EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION
EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION
"

FAILED=""

for pkg in $FOUNDATIONS; do
  full_path="$REPO_ROOT/$pkg"
  package_json="$full_path/package.json"
  package_lock="$full_path/package-lock.json"

  if [ ! -f "$package_json" ]; then
    printf '%s\n' "SKIP: $pkg - no package.json found"
    continue
  fi

  if [ -f "$package_lock" ]; then
    install_command="ci"
  else
    install_command="install"
  fi

  printf '\n%s\n' "=== Installing $pkg (npm $install_command) ==="

  (
    cd "$full_path"
    npm "$install_command"
  ) || {
    printf '%s\n' "FAIL: $pkg - npm $install_command failed"
    FAILED="$FAILED $pkg"
  }
done

printf '\n'
if [ -z "$FAILED" ]; then
  printf '%s\n' "All 4 foundations bootstrapped successfully."
else
  printf '%s\n' "Failed packages:$FAILED"
  exit 1
fi
