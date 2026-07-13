# 심연의 무명소환사

어둠 속으로 계속 내려가며 동료와 장비를 소환하고, 막히면 환생해 더 강해지는 다크 판타지 방치형 RPG입니다. Language Miner의 공식 PlayZone 게임으로 제공됩니다.

## 주요 특징

- 자동 전투와 오프라인 보상
- 동료·장비 소환과 도감 수집
- 강화, 보물, 외형, 환생을 잇는 장기 성장
- Language Miner 다이아를 사용하는 선택형 보상

## 실행 방법

이 게임팩은 Language Miner PlayZone 전용입니다. 웹 브라우저에서 `game/index.html`을 직접 열면 실행되지 않습니다.

1. [Language Miner](https://github.com/MeowthologySaga/Language_Miner)를 설치합니다.
2. 앱에서 `PlayZone`을 엽니다.
3. 공식 게임 목록에서 `심연의 무명소환사`를 설치하고 실행합니다.

진행 데이터는 Language Miner의 게임팩 전용 저장소에 보관됩니다. 화면·소리 설정 일부는 게임팩 이름이 붙은 브라우저 로컬 설정으로 저장됩니다. 게임은 네트워크, 외부 링크, 학습 카드에 접근하지 않습니다. 다이아는 manifest에 선언된 항목만 앱의 확인을 거쳐 사용할 수 있습니다.

## 개발자 확인

```powershell
python tools/verify_public_export.py
```

빌드·체크섬·게임팩 재생성 방법은 [BUILD.md](./BUILD.md)를 참고하세요.

## 라이선스

- JavaScript, HTML, CSS와 manifest: `GPL-3.0-only`
- 이미지와 오디오: `LicenseRef-Meowthology-Official-Builtin`

자세한 범위와 재배포 조건은 [ASSET-INVENTORY.md](./ASSET-INVENTORY.md), [MEDIA-LICENSE.md](./MEDIA-LICENSE.md), [LICENSE.media.txt](./LICENSE.media.txt)를 참고하세요.
