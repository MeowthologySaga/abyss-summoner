# Security report

- Status target: `trusted_official`
- Runtime: sandboxed static iframe; GitHub Pages browser preview uses the same static files
- Network: denied
- Progress storage: pack-scoped Host save with backward-compatible schema 2 to 3 migration
- UI preferences: namespaced browser local storage; no card or user-authored text
- Wallet: manifest-gated actions with confirmation and persistent idempotency; Pages uses a local mock only
- Node, Electron, filesystem, clipboard and card APIs: unavailable
- Nested archives, source maps, executable files and development logs: absent
- Localization: Korean and English catalogs are bundled as source, with no remote translation service

The host rechecks every runtime file against `manifest.integrity.files` before mounting it.
