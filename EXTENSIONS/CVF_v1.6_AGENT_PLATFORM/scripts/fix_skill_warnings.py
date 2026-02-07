#!/usr/bin/env python
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parents[3]
    tool = repo_root / "tools" / "skill-validation" / "fix_skill_warnings.py"
    default_root = repo_root / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"

    args = sys.argv[1:]
    if "--root" not in args:
        args = ["--root", str(default_root), *args]

    return subprocess.call([sys.executable, str(tool), *args])


if __name__ == "__main__":
    sys.exit(main())
