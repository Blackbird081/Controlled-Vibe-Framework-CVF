from __future__ import annotations

import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ENV_FILES = [
    REPO_ROOT / 'EXTENSIONS' / 'CVF_v1.6_AGENT_PLATFORM' / 'cvf-web' / '.env.local',
    REPO_ROOT / 'EXTENSIONS' / 'CVF_v1.6_AGENT_PLATFORM' / 'cvf-web' / '.env',
    REPO_ROOT / '.env.local',
    REPO_ROOT / '.env',
]


def _normalize_env_value(raw_value: str) -> str:
    trimmed = raw_value.strip()
    if (trimmed.startswith('"') and trimmed.endswith('"')) or (
        trimmed.startswith("'") and trimmed.endswith("'")
    ):
        unwrapped = trimmed[1:-1]
        return unwrapped.replace('\\n', '\n') if trimmed.startswith('"') else unwrapped
    return trimmed


def _parse_env_line(line: str) -> tuple[str, str] | None:
    trimmed = line.strip()
    if not trimmed or trimmed.startswith('#'):
        return None

    normalized = trimmed[7:].strip() if trimmed.startswith('export ') else trimmed
    if '=' not in normalized:
        return None

    key, raw_value = normalized.split('=', 1)
    key = key.strip()
    if not key or not (key[0].isalpha() or key[0] == '_'):
        return None

    return key, _normalize_env_value(raw_value)


def bootstrap_repo_env(env_files: list[Path] | None = None) -> list[Path]:
    loaded_files: list[Path] = []

    for env_path in env_files or DEFAULT_ENV_FILES:
        if not env_path.exists():
            continue

        for line in env_path.read_text(encoding='utf-8').splitlines():
            parsed = _parse_env_line(line)
            if not parsed:
                continue

            key, value = parsed
            current_value = os.environ.get(key, '').strip()
            if not current_value:
                os.environ[key] = value

        loaded_files.append(env_path)

    return loaded_files
