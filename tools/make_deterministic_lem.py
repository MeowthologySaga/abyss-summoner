from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT.parent
MANIFEST_PATH = ROOT / "manifest.json"
MANIFEST = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
PACK_ID = str(MANIFEST.get("id", "abyss-summoner")).rsplit(".", 1)[-1]
PACK_VERSION = str(MANIFEST.get("version", "0.0.0"))
BASE_NAME = f"{PACK_ID}-{PACK_VERSION}"
ZIP_PATH = OUT_DIR / f"{BASE_NAME}.zip"
LEM_PATH = OUT_DIR / f"{BASE_NAME}.lemgame"
ARCHIVE_HASH_PATH = OUT_DIR / f"{BASE_NAME}.archives.sha256"
FIXED_DATE = (2026, 7, 14, 0, 0, 0)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_files():
    declared = MANIFEST.get("integrity", {}).get("files", {})
    if not isinstance(declared, dict) or not declared:
        raise ValueError("manifest.integrity.files must list every packaged runtime file")

    yield MANIFEST_PATH
    for relative in sorted(declared):
        path = (ROOT / relative).resolve()
        try:
            path.relative_to(ROOT.resolve())
        except ValueError as exc:
            raise ValueError(f"unsafe manifest integrity path: {relative}") from exc
        if not path.is_file():
            raise FileNotFoundError(f"manifest integrity file is missing: {relative}")
        yield path


def sync_manifest_integrity() -> None:
    declared = MANIFEST.get("integrity", {}).get("files", {})
    if not isinstance(declared, dict) or not declared:
        raise ValueError("manifest.integrity.files must list every packaged runtime file")

    next_files = {}
    for relative in sorted(declared):
        path = (ROOT / relative).resolve()
        try:
            path.relative_to(ROOT.resolve())
        except ValueError as exc:
            raise ValueError(f"unsafe manifest integrity path: {relative}") from exc
        if not path.is_file():
            raise FileNotFoundError(f"manifest integrity file is missing: {relative}")
        next_files[relative] = sha256_file(path)

    MANIFEST["integrity"] = {"files": next_files}
    text = json.dumps(MANIFEST, ensure_ascii=False, indent=2) + "\n"
    with MANIFEST_PATH.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write(text)


def write_archive(path: Path) -> None:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for file_path in iter_files():
            arcname = file_path.relative_to(ROOT).as_posix()
            info = zipfile.ZipInfo(arcname, FIXED_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, file_path.read_bytes())


def write_checksums() -> None:
    sums = []
    for file_path in iter_files():
        rel = file_path.relative_to(ROOT).as_posix()
        sums.append(f"{sha256_file(file_path)}  {rel}")
    (ROOT / "SHA256SUMS.txt").write_text("\n".join(sums) + "\n", encoding="utf-8")


def main() -> None:
    sync_manifest_integrity()
    write_checksums()
    write_archive(ZIP_PATH)
    write_archive(LEM_PATH)
    lines = [
        f"{sha256_file(ZIP_PATH)}  {ZIP_PATH.name}",
        f"{sha256_file(LEM_PATH)}  {LEM_PATH.name}",
    ]
    ARCHIVE_HASH_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
