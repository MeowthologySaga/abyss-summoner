from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", "dist", "build", "coverage"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def check_manifest_integrity(manifest: dict) -> list[dict]:
    bad = []
    for rel, expected in manifest["integrity"]["files"].items():
        path = ROOT / rel
        actual = sha256_file(path) if path.exists() else None
        if actual != expected:
            bad.append({"file": rel, "expected": expected, "actual": actual})
    return bad


def check_javascript() -> list[dict]:
    bad = []
    for path in sorted((ROOT / "game").rglob("*.js")):
        result = subprocess.run(
            ["node", "--check", str(path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        if result.returncode:
            bad.append({"file": path.relative_to(ROOT).as_posix(), "stderr": result.stderr[-1000:]})
    return bad


def check_audio_metadata() -> list[dict]:
    bad = []
    needles = [
        "artist",
        "title",
        "comment",
        "album",
        "date",
        "creation_time",
        "suno",
        "pic" + "man",
        "c:/",
        "c:\\users",
        "appdata",
        "temp",
        "uuid",
        "generation",
    ]
    for path in sorted((ROOT / "assets").rglob("*.mp3")):
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", str(path)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=8,
        )
        tags = (json.loads(result.stdout or "{}").get("format") or {}).get("tags") or {}
        joined = json.dumps(tags, ensure_ascii=False).lower()
        flags = [needle for needle in needles if needle in joined]
        if flags:
            bad.append({"file": path.relative_to(ROOT).as_posix(), "flags": flags, "tags": tags})
    return bad


def check_public_patterns() -> list[dict]:
    patterns = [
        r"sk-[A-Za-z0-9_-]{20,}",
        r"ghp_[A-Za-z0-9_]{20,}",
        r"github_pat_[A-Za-z0-9_]{20,}",
        r"AIza[0-9A-Za-z_-]{20,}",
        r"xox[baprs]-[0-9A-Za-z-]{20,}",
        "C:" + r"\\Users\\",
        "C:" + r"/Users/",
        "App" + "Data",
        "Local" + r"\\Temp",
    ]
    text_exts = {".html", ".js", ".css", ".json", ".md", ".txt", ".py", ".gitignore", ".nojekyll", ""}
    bad = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix.lower() not in text_exts and path.name not in {".gitignore", ".nojekyll"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in patterns:
            if re.search(pattern, text):
                bad.append({"file": path.relative_to(ROOT).as_posix(), "pattern": pattern})
                break
    return bad


def check_unwanted_files() -> list[str]:
    bad = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        rel = path.relative_to(ROOT).as_posix().lower()
        name = path.name.lower()
        if name in {"pipeline-meta.json", "prompt-used.txt"}:
            bad.append(path.relative_to(ROOT).as_posix())
        elif "/raw" in rel or rel.endswith(".wav") or rel.endswith(".log"):
            bad.append(path.relative_to(ROOT).as_posix())
    return bad


def main() -> None:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    report = {
        "manifest_integrity_bad": check_manifest_integrity(manifest),
        "js_bad": check_javascript(),
        "audio_metadata_bad": check_audio_metadata(),
        "public_pattern_bad": check_public_patterns(),
        "unwanted_files": check_unwanted_files(),
    }
    report["status"] = "PASS" if not any(report.values()) else "FAIL"
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
