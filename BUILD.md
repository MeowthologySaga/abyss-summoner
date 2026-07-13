# Build, Test, Checksum, and Tag Reproduction

Run these commands from the export root.

## 1. Validate JSON and JavaScript

```powershell
python -m json.tool manifest.json > $null
Get-ChildItem -Recurse -File game -Filter *.js | ForEach-Object {
  node --check $_.FullName
}
```

Expected result: every JavaScript file prints no syntax error.

## 2. Verify Export

```powershell
python tools/verify_public_export.py
```

## 3. Verify Audio Metadata Sanitization

```powershell
Get-ChildItem -Recurse -File assets/audio -Filter *.mp3 | ForEach-Object {
  ffprobe -v quiet -print_format json -show_format $_.FullName
}
```

Public MP3 copies must not contain `artist`, Suno generation IDs, account names, local paths, or creation timestamps.

## 4. Rebuild Deterministic Package Archive

The `.lemgame` cartridge is ZIP-compatible. The packager includes only `manifest.json` and the files declared in `manifest.integrity.files`, uses sorted file order, and applies a fixed timestamp for reproducible bytes. Git metadata and repository-only build files are never included in the cartridge.

```powershell
python tools/make_deterministic_lem.py
```

Expected output is written beside the export folder as `abyss-summoner-<version>.zip` and `abyss-summoner-<version>.lemgame`, with SHA-256 hashes in `SHA256SUMS.txt` and `*.archives.sha256`.

## 5. Public Release Gate

Do not push or tag if any check reports unresolved personal data, secret patterns, unclear media rights, source/package mismatch, or manifest integrity mismatch.
