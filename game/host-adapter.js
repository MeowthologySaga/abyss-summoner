(function () {
  "use strict";

  const diamondActions = [
    { id: "summon-hero-1", amount: 30, reason: "심연의 무명소환사 프리미엄 동료 1회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-hero-10", amount: 300, reason: "심연의 무명소환사 프리미엄 동료 10회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-gear-1", amount: 30, reason: "심연의 무명소환사 프리미엄 장비 1회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-gear-10", amount: 300, reason: "심연의 무명소환사 프리미엄 장비 10회 소환", requiresConfirm: true, repeatable: true },
    { id: "rush-offline-reward", amount: 50, reason: "심연의 무명소환사 방치 보상 3배 정산", requiresConfirm: true, repeatable: true },
    { id: "unlock-skin-abyss", amount: 100, reason: "심연의 무명소환사 스킨 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-crimson", amount: 120, reason: "붉은 집행자 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-gilded", amount: 140, reason: "황금 세금관 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-eclipse", amount: 160, reason: "일식 순례자 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-soul", amount: 180, reason: "영혼 등불지기 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "upgrade-void-brand", amount: 120, reason: "심연의 무명소환사 공허 각인 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-quick-ritual", amount: 90, reason: "심연의 무명소환사 가속 의식 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-gold-oath", amount: 80, reason: "심연의 무명소환사 황금 서약 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-soul-compass", amount: 100, reason: "심연의 무명소환사 영혼 나침반 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "buy-battle-catalyst", amount: 50, reason: "심연의 무명소환사 전투 촉매 구매", requiresConfirm: true, repeatable: true },
    { id: "buy-gold-seal", amount: 40, reason: "심연의 무명소환사 금고 봉인서 구매", requiresConfirm: true, repeatable: true },
    { id: "buy-soul-candle", amount: 80, reason: "심연의 무명소환사 영혼 촛불 구매", requiresConfirm: true, repeatable: true }
  ];

  window.ABYSS_SUMMONER_DIAMOND_ACTIONS = diamondActions;

  window.createHostAdapter = function createHostAdapter() {
    if (window.LEM_GAME_HOST_API) {
      return window.LEM_GAME_HOST_API;
    }
    return window.createMockHostApi(diamondActions);
  };
})();
