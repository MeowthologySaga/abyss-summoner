(function () {
  "use strict";

  const diamondActions = [
    { id: "summon-hero-1", amount: 30, reason: "심연의 무명소환사 프리미엄 동료 1회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-hero-10", amount: 300, reason: "심연의 무명소환사 프리미엄 동료 10회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-gear-1", amount: 30, reason: "심연의 무명소환사 프리미엄 장비 1회 소환", requiresConfirm: true, repeatable: true },
    { id: "summon-gear-10", amount: 300, reason: "심연의 무명소환사 프리미엄 장비 10회 소환", requiresConfirm: true, repeatable: true },
    { id: "rush-offline-reward", amount: 50, reason: "심연의 무명소환사 방치 보상 3배 정산", requiresConfirm: true, repeatable: true },
    { id: "unlock-skin-abyss", amount: 100, reason: "심연의 무명소환사 스킨 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-crimson", amount: 120, reason: "심연의 무명소환사 붉은 집행자 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-gilded", amount: 140, reason: "심연의 무명소환사 황금 세금관 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-eclipse", amount: 160, reason: "심연의 무명소환사 일식 순례자 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "unlock-skin-soul", amount: 180, reason: "심연의 무명소환사 영혼 등불지기 외형 해금", requiresConfirm: true, repeatable: false },
    { id: "upgrade-void-brand", amount: 120, reason: "심연의 무명소환사 공허 각인 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-quick-ritual", amount: 90, reason: "심연의 무명소환사 가속 의식 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-gold-oath", amount: 80, reason: "심연의 무명소환사 황금 서약 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "upgrade-soul-compass", amount: 100, reason: "심연의 무명소환사 영혼 나침반 특수능력 강화", requiresConfirm: true, repeatable: true },
    { id: "buy-battle-catalyst", amount: 50, reason: "심연의 무명소환사 전투 촉매 구매", requiresConfirm: true, repeatable: true },
    { id: "buy-gold-seal", amount: 40, reason: "심연의 무명소환사 금고 봉인서 구매", requiresConfirm: true, repeatable: true },
    { id: "buy-soul-candle", amount: 80, reason: "심연의 무명소환사 영혼 촛불 구매", requiresConfirm: true, repeatable: true }
  ];

  const diamondUpgrades = [
    {
      id: "void-brand",
      action: "upgrade-void-brand",
      name: "공허 각인",
      desc: "환생해도 사라지지 않는 전체 피해 보정입니다.",
      icon: "diamond",
      effect: "attackPct",
      base: 0.08,
      max: 20
    },
    {
      id: "quick-ritual",
      action: "upgrade-quick-ritual",
      name: "가속 의식",
      desc: "주인공과 동료의 공격 주기를 영구적으로 줄입니다.",
      icon: "bell",
      effect: "attackSpeedPct",
      base: 0.03,
      max: 15
    },
    {
      id: "gold-oath",
      action: "upgrade-gold-oath",
      name: "황금 서약",
      desc: "전투와 퀘스트 골드 획득량을 영구적으로 높입니다.",
      icon: "coin",
      effect: "goldPct",
      base: 0.12,
      max: 20
    },
    {
      id: "soul-compass",
      action: "upgrade-soul-compass",
      name: "영혼 나침반",
      desc: "보스와 환생으로 얻는 영혼석을 영구적으로 늘립니다.",
      icon: "crystal",
      effect: "soulPct",
      base: 0.08,
      max: 15
    }
  ];

  const consumables = [
    {
      id: "battle-catalyst",
      action: "buy-battle-catalyst",
      name: "전투 촉매",
      desc: "사용하면 5분 동안 전체 피해와 공격속도가 크게 오릅니다.",
      icon: "catalyst"
    },
    {
      id: "gold-seal",
      action: "buy-gold-seal",
      name: "금고 봉인서",
      desc: "사용하면 현재 진행도 기준 골드를 즉시 얻습니다.",
      icon: "order"
    },
    {
      id: "soul-candle",
      action: "buy-soul-candle",
      name: "영혼 촛불",
      desc: "사용하면 현재 심연 진행도 기준 영혼석을 얻습니다.",
      icon: "soul-flare"
    }
  ];

  const summonModes = {
    normal: {
      label: "일반",
      currency: "gold",
      pity: 120,
      rates: { common: 78, rare: 19, epic: 2.7, legendary: 0.3 }
    },
    premium: {
      label: "프리미엄",
      currency: "diamond",
      pity: 60,
      rates: { common: 50, rare: 35, epic: 12, legendary: 3 }
    }
  };

  const treasures = [
    { id: "haste-gear", name: "가속 태엽", desc: "공격속도 증가", effect: "attackSpeedPct", base: 0.035, cost: 10 },
    { id: "evolved-signet", name: "진화된 힘의 십자가", desc: "공격력 추가 증가", effect: "attackPct", base: 0.075, cost: 3 },
    { id: "twisted-ring", name: "버려진 힘의 반지", desc: "공격력 증가", effect: "attackPct", base: 0.055, cost: 2 },
    { id: "storm-claw", name: "버려진 폭풍의 칼날", desc: "치명률과 치명 피해 증가", effect: "critPct", base: 0.12, cost: 3 },
    { id: "owls-crown", name: "버려진 독수리의 상", desc: "퀘스트 골드 획득 증가", effect: "questGoldPct", base: 0.055, cost: 6 },
    { id: "golden-crystal", name: "버려진 황금 수정", desc: "적 처치 골드 획득 증가", effect: "killGoldPct", base: 0.04, cost: 4 },
    { id: "hollow-incense", name: "텅 빈 향로", desc: "동료 전투력 보정 증가", effect: "familiarPct", base: 0.06, cost: 5 },
    { id: "grave-crown", name: "무덤왕의 관", desc: "보스에게 주는 피해 증가", effect: "bossDamagePct", base: 0.075, cost: 7 },
    { id: "black-tithe", name: "검은 십일조 장부", desc: "보스 처치 골드와 영혼석 보상 증가", effect: "bossRewardPct", base: 0.04, cost: 8 },
    { id: "pilgrim-chain", name: "순례자의 사슬", desc: "보스 피해 증가", effect: "bossDamagePct", base: 0.05, cost: 5 },
    { id: "nameless-anvil", name: "무명 대장간 모루", desc: "회차 무기 ATK 증가", effect: "weaponPct", base: 0.055, cost: 9 },
    { id: "soul-hourglass", name: "영혼 모래시계", desc: "보유 영혼석 피해 보정 증가", effect: "soulPct", base: 0.035, cost: 12 },
    { id: "gate-lantern", name: "문지기의 등불", desc: "보스 영혼석 획득 증가", effect: "bossSoulPct", base: 0.025, cost: 15 },
    { id: "reserve-banner", name: "예비대 깃발", desc: "미편성 동료 DPS 반영률 증가", effect: "reserveDpsPct", base: 0.018, cost: 18 },
    { id: "collector-crest", name: "수집가의 문장", desc: "동료와 장비 보유 효과 증가", effect: "ownedEffectPct", base: 0.022, cost: 20 },
    { id: "abyss-compass", name: "심연 나침반", desc: "환생 영혼석 획득 증가", effect: "rebirthSoulPct", base: 0.03, cost: 22 },
    { id: "old-contract", name: "오래된 계약서", desc: "퀘스트 골드 획득 증가", effect: "questGoldPct", base: 0.048, cost: 14 },
    { id: "obsidian-hourglass", name: "흑요석 모래시계", desc: "공격속도 증가", effect: "attackSpeedPct", base: 0.026, cost: 18 },
    { id: "rift-incense", name: "균열의 향로", desc: "1000층 이후 적 압박 디버프 저항", effect: "debuffResistPct", base: 0.035, cost: 16 },
    { id: "summoner-ledger", name: "소환사의 장부", desc: "일반 소환 골드 비용 감소", effect: "normalSummonDiscountPct", base: 0.018, cost: 24 },
    { id: "radiant-seal", name: "찬란한 봉인", desc: "프리미엄 소환 Epic/Legendary 확률 소폭 증가", effect: "premiumLuckPct", base: 0.004, cost: 30 },
    { id: "purifying-mask", name: "정화의 가면", desc: "심연 압박 디버프 저항 증가", effect: "debuffResistPct", base: 0.028, cost: 26 },
    { id: "weakness-sigil", name: "약점 성표", desc: "역할 상성 피해 증가", effect: "weaknessBonusPct", base: 0.026, cost: 18 },
    { id: "execution-candle", name: "처형자의 초", desc: "보스 HP가 낮을수록 마무리 피해 증가", effect: "lowHpBossDamagePct", base: 0.04, cost: 20 }
  ];

  const economyConfig = {
    maxPity: summonModes.premium.pity,
    normalPity: summonModes.normal.pity,
    battleCatalystDurationMs: 5 * 60 * 1000,
    diamondActions,
    diamondUpgrades,
    consumables,
    summonModes,
    treasures,
    summonBalance: {
      premiumLuck: {
        cap: 0.06,
        epicBonusScale: 18,
        legendaryBonusScale: 4.5,
        minCommon: 20
      }
    }
  };

  window.ABYSS_SUMMONER_ECONOMY_CONFIG = economyConfig;
  window.ABYSS_SUMMONER_DIAMOND_ACTIONS = diamondActions;
})();
