# Third-Party Notices

Abyss Summoner v0.1.2 uses browser-native APIs only at runtime.

## Runtime Dependencies

No bundled third-party JavaScript library is included in this export.

## Build and Verification Tools

These tools are used to verify the release but are not part of the game runtime:

- Python 3: file inventory, checksum, deterministic archive, and validation scripts.
- FFmpeg / FFprobe: MP3 metadata inspection.
- Node.js: JavaScript syntax checks with `node --check`.

## Generated Media Services

- Image and UI media: generated for this project through Codex-assisted image-generation workflows.
- Music and sound effects: generated for this project through a paid Suno workflow, then normalized and metadata-sanitized before public export.

See `MEDIA-LICENSE.md`, `LICENSE.media.txt`, `LICENSE.assets.md`, and `ASSET-INVENTORY.md` for path-level media notes.
