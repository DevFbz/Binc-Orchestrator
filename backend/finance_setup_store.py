"""Atomic JSON persistence for workspace-scoped finance setup."""
from __future__ import annotations

import json
import os
from copy import deepcopy
from collections.abc import Callable
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock
from typing import TypeVar

EMPTY_SETUP = {"categories": [], "accounts": [], "recurrences": []}
_SETUP_LOCK = Lock()
T = TypeVar("T")


def load_setup(path: Path) -> dict:
    if not path.exists():
        return {key: list(value) for key, value in EMPTY_SETUP.items()}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {key: list(payload.get(key, [])) for key in EMPTY_SETUP}


def save_setup(path: Path, setup: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {key: list(setup.get(key, [])) for key in EMPTY_SETUP}
    temporary: Path | None = None
    try:
        with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def mutate_setup(path: Path, mutation: Callable[[dict], T], *, after_save: Callable[[T], None] | None = None) -> T:
    """Apply one read-modify-write transaction inside this process."""
    with _SETUP_LOCK:
        setup = load_setup(path)
        original = deepcopy(setup)
        result = mutation(setup)
        save_setup(path, setup)
        if after_save is not None:
            try:
                after_save(result)
            except Exception:
                save_setup(path, original)
                raise
        return result
