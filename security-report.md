# Security Report

Last reviewed: 2026-06-28

## Files

- Pack id: `meowthology.abyss-summoner`
- Version: `0.1.1`
- Content type: `game_pack`
- Entry: `game/index.html`
- Executable binaries included: no
- Local source files included: HTML, CSS, JavaScript, and one Python asset-generation utility
- Nested archives included: no
- Source maps included: no
- Runtime external URLs: none
- Local preview URL in docs: `http://127.0.0.1:3000/game/index.html`
- Absolute paths in sanitized branch: none found
- Absolute paths in current pack text after cleanup: none found
- Path traversal entries: none found
- Ignored local logs: `.static-server.*.log`

## Sensitive Information Audit

Scope reviewed:

- Sanitized `main` branch after generated metadata cleanup
- All commits reachable after history cleanup
- Current working tree text files, excluding binary media and `.git`
- New screenshot and generated boss-marker assets

Checked for:

- API keys, bearer tokens, GitHub tokens, cloud keys, private key blocks
- Password, credential, secret, JWT, database URL, Firebase/Supabase/OpenAI/Anthropic key patterns
- Email addresses, Korean mobile numbers, 주민번호-like patterns, account/contact keywords
- Windows/macOS/Linux local absolute paths
- `localhost`/`127.0.0.1`/external URL references

Findings:

- No API keys, tokens, passwords, private keys, personal contact information, or database URLs were found.
- The previous generated pipeline metadata/raw asset outputs were removed from the public tree and added to `.gitignore`.
- The remaining local preview URL is documentation-only: `http://127.0.0.1:3000/game/index.html`.
- Screenshot PNGs and runtime generated assets were scanned for local path/URL strings; no matches were found after cleanup.

## Asset Sanitization

- Image assets: final generated runtime PNG/GIF assets and README screenshots
- Removed public intermediates: `pipeline-meta.json`, prompt text, raw sheets, raw source images, fitted/clean intermediate images
- Image metadata: no local path strings detected in retained runtime assets
- Audio assets: local WAV assets included for UI/combat feedback and loops
- Subtitle HTML/script stripped: no subtitle files included

## Permissions

- `network`: false
- `externalLinks`: false
- `filesystem`: false
- `clipboard`: false
- `cardsRead`: false
- `cardsCreate`: false
- `walletSpend`: true

## Economy

Diamond actions:

- `summon-hero-1`: 30, repeatable, confirm required
- `summon-hero-10`: 300, repeatable, confirm required
- `summon-gear-1`: 30, repeatable, confirm required
- `summon-gear-10`: 300, repeatable, confirm required
- `rush-offline-reward`: 50, repeatable, confirm required
- `unlock-skin-abyss`: 100, non-repeatable, confirm required
- `unlock-skin-crimson`: 120, non-repeatable, confirm required
- `unlock-skin-gilded`: 140, non-repeatable, confirm required
- `unlock-skin-eclipse`: 160, non-repeatable, confirm required
- `unlock-skin-soul`: 180, non-repeatable, confirm required
- `upgrade-void-brand`: 120, repeatable, confirm required
- `upgrade-quick-ritual`: 90, repeatable, confirm required
- `upgrade-gold-oath`: 80, repeatable, confirm required
- `upgrade-soul-compass`: 100, repeatable, confirm required
- `buy-battle-catalyst`: 50, repeatable, confirm required
- `buy-gold-seal`: 40, repeatable, confirm required
- `buy-soul-candle`: 80, repeatable, confirm required

Idempotency plan:

```text
meowthology.abyss-summoner:hero:1:{timestamp}
meowthology.abyss-summoner:hero:10:{timestamp}
meowthology.abyss-summoner:gear:1:{timestamp}
meowthology.abyss-summoner:gear:10:{timestamp}
meowthology.abyss-summoner:offline:{timestamp}
meowthology.abyss-summoner:skin:{skinId}
meowthology.abyss-summoner:diamond-upgrade:{upgradeId}:{level}
meowthology.abyss-summoner:consumable:{itemId}:{timestamp}
```

The game never stores wallet balance in save data. It stores only diamond-shop upgrade levels, unlocked skin flags, consumable counts, and active consumable expiry timestamps after a validated `wallet.spend` succeeds. The mock Host keeps a preview balance for standalone testing and validates spend requests against declared actions.

## Risk Notes

- Risk level: medium
- Reason: iframe Game Pack with local JavaScript and `walletSpend` permission, but no network/file-system permissions
- Blocked files: none
- Warnings:
  - `mock-host.js` is for standalone preview only.
  - `mock-host.js` may use browser storage/confirmation UI only as a mock Host boundary.
  - Local `.static-server.*.log` files are ignored and should not be committed.
- Required Host protections:
  - sandboxed iframe execution
  - no Node/Electron exposure
  - permission-gated Host API
  - `wallet.spend` validation against manifest
  - idempotency check on every spend
  - save data isolated by pack id and profile id
