# Asset Inventory

This inventory is path-based for the v0.1.2 public export created from the Language Miner runtime cartridge.

## Runtime Source

- Source runtime: local Language Miner v0.1.2 cartridge runtime
- Export target: clean public export folder
- Cartridge id: `meowthology.abyss-summoner`
- Cartridge version: `0.1.2`

## Code

- `game/index.html`
- `game/styles.css`
- `game/**/*.js`
- `manifest.json`

License: `GPL-3.0-only`.

## Repository Landing Page

- root `index.html`: static GitHub Pages notice that directs users to Language Miner

The repository landing page is GPL-3.0-only and is not included in the `.lemgame` runtime archive.

## Image and UI Media

- `assets/icon.webp`
- `assets/thumbnail.webp`
- `assets/generated/**/*.webp`

Declared origin: generated for this project with Codex-assisted image-generation workflows and local post-processing.

License: `LicenseRef-Meowthology-Official-Builtin`; see `LICENSE.media.txt`.

## Music and Sound Effects

- `assets/audio/*.mp3`

Declared origin: generated for this project with a paid Suno workflow, then normalized and metadata-sanitized.

License: `LicenseRef-Meowthology-Official-Builtin`; see `LICENSE.media.txt`.

## Excluded From Runtime Export

- `.git/`
- local agent/tool folders and remote attachment caches
- local screenshots, logs, generated prompt notes, and temporary files
- raw image sheets, prompt files, and `pipeline-meta.json`
- WAV sources and unused audio experiments
- private design notes or local machine paths

The actual runtime copy contains final static files only: HTML/CSS/JS, manifest, WebP image media, MP3 audio media, and license/security notices.
