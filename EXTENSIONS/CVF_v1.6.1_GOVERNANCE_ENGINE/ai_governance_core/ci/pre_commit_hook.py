#!/usr/bin/env python3
"""
pre_commit_hook.py

CVF Governance Pre-Commit Hook
--------------------------------

Run governance checks before allowing a commit.
Place this file or symlink it at .git/hooks/pre-commit.

Exit codes (from ci/exit_codes.py):
  0 = APPROVED    → commit proceeds
  2 = MANUAL_REVIEW  → warning, commit proceeds
  3 = REJECTED    → commit blocked
  4 = FROZEN      → commit blocked

Usage:
  python ci/pre_commit_hook.py

Or symlink:
  ln -s ../../EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/ci/pre_commit_hook.py .git/hooks/pre-commit

Author: Governance Engine — CVF v1.6.1
"""

import sys
import os

# Ensure the ai_governance_core is on the path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, ROOT_DIR)

from ci.exit_codes import ExitCodes


def main():
    """
    Lightweight pre-commit check.
    Validates that governance config exists and is valid.
    """

    # 1. Check governance config exists
    config_path = os.path.join(ROOT_DIR, "config", "governance_config.json")
    if not os.path.exists(config_path):
        print("[CVF] WARNING: governance_config.json not found")
        sys.exit(ExitCodes.MANUAL_REVIEW)

    # 2. Check config is valid JSON
    import json
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
    except (json.JSONDecodeError, IOError):
        print("[CVF] ERROR: governance_config.json is invalid")
        sys.exit(ExitCodes.REJECTED)

    # 3. Check strict mode
    strict = config.get("strict_mode", False)
    freeze = config.get("freeze", False)

    if freeze:
        print("[CVF] FROZEN: Governance is in freeze mode. Commit blocked.")
        sys.exit(ExitCodes.FROZEN)

    # 4. Check ledger integrity
    ledger_path = os.path.join(ROOT_DIR, "ledger_layer", "ledger_chain.json")
    if os.path.exists(ledger_path):
        try:
            with open(ledger_path, "r") as f:
                chain = json.load(f)
            if not isinstance(chain, list):
                print("[CVF] ERROR: ledger_chain.json is not a valid chain")
                sys.exit(ExitCodes.REJECTED)
        except (json.JSONDecodeError, IOError):
            print("[CVF] WARNING: Cannot read ledger_chain.json")
            if strict:
                sys.exit(ExitCodes.REJECTED)

    print("[CVF] Pre-commit governance check passed.")
    sys.exit(ExitCodes.APPROVED)


if __name__ == "__main__":
    main()
