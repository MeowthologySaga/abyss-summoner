# Abyss Summoner | 심연의 무명소환사

[Play in your browser](https://meowthologysaga.github.io/abyss-summoner/) · [Source repository](https://github.com/MeowthologySaga/abyss-summoner)

**Abyss Summoner** is a dark-fantasy idle RPG. Summon heroes and gear, grow through upgrades and rebirth, and collect offline rewards.

**심연의 무명소환사**는 자동전투, 강화, 소환, 환생과 방치 보상으로 성장하는 다크 판타지 방치형 RPG입니다.

## Play

- Browser preview: open the GitHub Pages link above. It uses the built-in mock wallet only and does not make network requests.
- Language Miner PlayZone: install the official `.lemgame` package. The host storage and Diamond contracts remain manifest-gated.
- Languages: Korean (한국어) and English. The game uses a Language Miner host language when available, otherwise the OS language; players can change it in Settings and their choice is saved.

## Development verification

```powershell
python tools/verify_public_export.py
python tools/make_deterministic_lem.py
```

See [BUILD.md](./BUILD.md) for the deterministic package procedure.

## Licenses and asset rights

- JavaScript, HTML, CSS, and manifest: `GPL-3.0-only`
- Images and audio: `LicenseRef-Meowthology-Official-Builtin`

See [ASSET-INVENTORY.md](./ASSET-INVENTORY.md), [MEDIA-LICENSE.md](./MEDIA-LICENSE.md), and [LICENSE.media.txt](./LICENSE.media.txt) for the asset inventory and terms.
