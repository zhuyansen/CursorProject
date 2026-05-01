"""
Load KEY=VALUE lines from .env files into os.environ without extra dependencies.

Rules:
  - Does not override variables already set in the process environment.
  - Strips optional single/double quotes around values.
  - Ignores blank lines and # comments.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def _workspace_root(script_file: Path) -> Path:
    script_dir = script_file.resolve().parent
    if script_dir.name == "source_watch":
        return script_dir.parent.parent
    if script_dir.name == "scripts":
        return script_dir.parent
    return script_dir.parent.parent


def _candidate_env_paths(script_file: Path) -> list[Path]:
    root = _workspace_root(script_file)
    script_dir = script_file.resolve().parent
    ordered = [
        root / ".env",
        root / "scripts" / "source_watch" / ".env",
        script_dir / ".env",
    ]
    seen: set[Path] = set()
    out: list[Path] = []
    for path in ordered:
        key = path.resolve()
        if key in seen:
            continue
        seen.add(key)
        out.append(path)
    return out


def _parse_line(raw_line: str) -> tuple[str, str] | None:
    line = raw_line.strip()
    if not line or line.startswith("#"):
        return None
    if line.startswith("export "):
        line = line[len("export ") :].lstrip()
    if "=" not in line:
        return None
    key, value = line.split("=", 1)
    key = key.strip()
    if not key or key.startswith("#"):
        return None
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        value = value[1:-1]
    return key, value


def _scripts_dir_for(script_file: Path) -> Path:
    script_path = script_file.resolve()
    if script_path.parent.name == "source_watch":
        return script_path.parent.parent
    return script_path.parent


def activate_script_env(script_file: Path) -> int:
    """
    Prepend `scripts/` to sys.path (so this module is importable from source_watch),
    then load .env files. Returns load_local_env's set count.
    """
    scripts_dir = _scripts_dir_for(script_file)
    scripts_str = str(scripts_dir)
    if scripts_str not in sys.path:
        sys.path.insert(0, scripts_str)
    return load_local_env(script_file.resolve())


def load_local_env(script_file: Path) -> int:
    """
    Load from repo root .env, then scripts/source_watch/.env, then script_dir/.env.
    Returns number of keys set (skipped if already in os.environ).
    """
    set_count = 0
    for path in _candidate_env_paths(script_file):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        if text.startswith("\ufeff"):
            text = text[1:]
        for raw_line in text.splitlines():
            parsed = _parse_line(raw_line)
            if not parsed:
                continue
            env_key, env_value = parsed
            if env_key in os.environ and os.environ[env_key].strip() != "":
                continue
            os.environ[env_key] = env_value
            set_count += 1
    return set_count
