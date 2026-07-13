# Security report

- Status target: `trusted_official`
- Runtime: sandboxed static iframe
- Network: denied
- Progress storage: pack-scoped Host save
- UI preferences: namespaced browser local storage; no card or user-authored text
- Wallet: manifest-gated actions with confirmation and persistent idempotency
- Node, Electron, filesystem, clipboard and card APIs: unavailable
- Nested archives, source maps, executable files and development logs: absent

The host rechecks every runtime file against `manifest.integrity.files` before mounting it.
