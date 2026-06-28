(function () {
  "use strict";

  const PACK_ID = "meowthology.abyss-summoner";
  const SAVE_KEY = "abyss-summoner-save-v1";
  const MAX_PITY = 60;
  const NORMAL_PITY = 120;
  const MONSTERS_PER_FLOOR = 5;
  const TABS = ["quest", "weapon", "summon", "heroes", "gear", "treasure", "shop", "rebirth"];

  const ACTIONS = window.ABYSS_SUMMONER_DIAMOND_ACTIONS;
  const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((action) => [action.id, action]));

  const DIAMOND_UPGRADES = [
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

  const CONSUMABLES = [
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

  const BATTLE_CATALYST_DURATION_MS = 5 * 60 * 1000;

  const SKINS = [
    {
      id: "base",
      art: "../assets/generated/sprites/skins/base-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/base/sheet-transparent.png?v=20260627-skinidle1",
      name: "낡은 후드",
      desc: "처음부터 보유한 기본 외형입니다.",
      action: null,
      primary: "#d7c1a7",
      secondary: "#273039",
      accent: "#d33c3c",
      filter: "none",
      effects: {}
    },
    {
      id: "abyss",
      art: "../assets/generated/sprites/skins/abyss-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/abyss/sheet-transparent.png?v=20260627-skinidle1",
      name: "심연 소환사",
      desc: "심연의 보랏빛 망토를 두른 외형입니다.",
      action: "unlock-skin-abyss",
      primary: "#9f7aea",
      secondary: "#35204d",
      accent: "#c084fc",
      filter: "hue-rotate(255deg) saturate(1.22) brightness(0.9)",
      effects: { attackPct: 0.03 }
    },
    {
      id: "crimson",
      art: "../assets/generated/sprites/skins/crimson-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/crimson/sheet-transparent.png?v=20260627-skinidle1",
      name: "붉은 집행자",
      desc: "보스전 압박감을 높이는 붉은 전투복입니다.",
      action: "unlock-skin-crimson",
      primary: "#ef4444",
      secondary: "#401318",
      accent: "#fb7185",
      filter: "hue-rotate(330deg) saturate(1.35) brightness(0.92)",
      effects: { bossDamagePct: 0.04 }
    },
    {
      id: "gilded",
      art: "../assets/generated/sprites/skins/gilded-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/gilded/sheet-transparent.png?v=20260627-skinidle1",
      name: "황금 세금관",
      desc: "퀘스트와 처치 보상을 끌어올리는 금장 외형입니다.",
      action: "unlock-skin-gilded",
      primary: "#f5c76a",
      secondary: "#4a3417",
      accent: "#fde68a",
      filter: "sepia(0.48) saturate(1.55) brightness(1.05)",
      effects: { goldPct: 0.06 }
    },
    {
      id: "eclipse",
      art: "../assets/generated/sprites/skins/eclipse-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/eclipse/sheet-transparent.png?v=20260627-skinidle1",
      name: "일식 순례자",
      desc: "의식 동작을 빠르게 만드는 검푸른 예복입니다.",
      action: "unlock-skin-eclipse",
      primary: "#60a5fa",
      secondary: "#111827",
      accent: "#93c5fd",
      filter: "hue-rotate(205deg) saturate(1.15) brightness(0.88)",
      effects: { attackSpeedPct: 0.025 }
    },
    {
      id: "soul",
      art: "../assets/generated/sprites/skins/soul-display.png?v=20260627-skinforge1",
      idleSheet: "../assets/generated/sprites/skins/idle/soul/sheet-transparent.png?v=20260627-skinidle1",
      name: "영혼 등불지기",
      desc: "환생과 보스 처치에서 영혼석 흐름을 보강합니다.",
      action: "unlock-skin-soul",
      primary: "#34d399",
      secondary: "#12362f",
      accent: "#a7f3d0",
      filter: "hue-rotate(115deg) saturate(1.3) brightness(0.95)",
      effects: { soulPct: 0.04 }
    }
  ];

  const RARITIES = {
    common: { label: "Common", weight: 64, shard: 1, color: "#d6d3d1", mult: 1 },
    rare: { label: "Rare", weight: 28, shard: 1, color: "#60a5fa", mult: 1.8 },
    epic: { label: "Epic", weight: 7, shard: 1, color: "#a78bfa", mult: 3.2 },
    legendary: { label: "Legendary", weight: 1, shard: 1, color: "#f5c76a", mult: 6 }
  };
  const CODEX_RARITY_ORDER = ["legendary", "epic", "rare", "common"];

  const SUMMON_MODES = {
    normal: {
      label: "일반",
      currency: "gold",
      pity: NORMAL_PITY,
      rates: { common: 78, rare: 19, epic: 2.7, legendary: 0.3 }
    },
    premium: {
      label: "프리미엄",
      currency: "diamond",
      pity: MAX_PITY,
      rates: { common: 50, rare: 35, epic: 12, legendary: 3 }
    }
  };

  const ROLES = {
    tank: { label: "탱커", className: "role-tank", bonus: "보스 피해 +10%" },
    dps: { label: "딜러", className: "role-dps", bonus: "전투 DPS +12%" },
    support: { label: "지원", className: "role-support", bonus: "골드 획득 +10%" },
    curse: { label: "저주", className: "role-curse", bonus: "보스 HP -10%" }
  };

  const BASE_HEROES = [
    { id: "iron-page", name: "철서의 시종", rarity: "common", role: "tank", base: 18 },
    { id: "grave-archer", name: "묘지 궁수", rarity: "common", role: "dps", base: 21 },
    { id: "candle-nun", name: "촛불 수녀", rarity: "common", role: "support", base: 16 },
    { id: "ash-rat-knight", name: "잿쥐 기사", rarity: "common", role: "tank", base: 20 },
    { id: "bone-knife-boy", name: "뼈칼 소년", rarity: "common", role: "dps", base: 22 },
    { id: "grave-bell-girl", name: "묘종 소녀", rarity: "common", role: "support", base: 18 },
    { id: "black-goat-scribe", name: "검은 염소 서기", rarity: "rare", role: "curse", base: 28 },
    { id: "scarlet-lancer", name: "주홍 창기사", rarity: "rare", role: "dps", base: 32 },
    { id: "bell-shield", name: "종탑 방패병", rarity: "rare", role: "tank", base: 30 },
    { id: "wax-healer", name: "밀랍 치유사", rarity: "rare", role: "support", base: 29 },
    { id: "chain-exorcist", name: "사슬 퇴마사", rarity: "rare", role: "curse", base: 34 },
    { id: "cinder-hunter", name: "잿불 사냥꾼", rarity: "rare", role: "dps", base: 35 },
    { id: "moon-apothecary", name: "월광 약제사", rarity: "epic", role: "support", base: 43 },
    { id: "hex-duelist", name: "저주 결투가", rarity: "epic", role: "curse", base: 46 },
    { id: "saint-ruin", name: "폐허의 성녀", rarity: "epic", role: "support", base: 42 },
    { id: "gallows-captain", name: "교수대 대장", rarity: "epic", role: "tank", base: 50 },
    { id: "red-choir", name: "붉은 성가대", rarity: "epic", role: "dps", base: 52 },
    { id: "moth-oracle", name: "나방 예언자", rarity: "epic", role: "curse", base: 49 },
    { id: "duke-ashen", name: "잿빛 공작", rarity: "legendary", role: "dps", base: 70 },
    { id: "morrow-king", name: "내일 없는 왕", rarity: "legendary", role: "tank", base: 74 },
    { id: "oracle-thorn", name: "가시 예언자", rarity: "legendary", role: "curse", base: 68 },
    { id: "white-lantern", name: "백등의 성녀", rarity: "legendary", role: "support", base: 69 },
    { id: "nameless-bishop", name: "무명의 주교", rarity: "legendary", role: "curse", base: 76 },
    { id: "abyss-marshal", name: "심연 원수", rarity: "legendary", role: "tank", base: 79 }
  ];

  const HERO_CATALOG_TARGETS = {
    common: { tank: 12, dps: 12, support: 12, curse: 12 },
    rare: { tank: 9, dps: 9, support: 9, curse: 9 },
    epic: { tank: 6, dps: 6, support: 6, curse: 6 },
    legendary: { tank: 3, dps: 3, support: 3, curse: 3 }
  };

  const HERO_RARITY_BASE = {
    common: 18,
    rare: 31,
    epic: 48,
    legendary: 74
  };

  const HERO_CATALOG_FAMILIES = {
    common: [
      { id: "sewer-rat", names: { tank: "갑각 시궁쥐", dps: "칼이빨 시궁쥐", support: "물자쥐 사역마", curse: "역병 시궁쥐" } },
      { id: "wax-slime", names: { tank: "굳은 촛농 슬라임", dps: "불붙은 촛농 슬라임", support: "제단 촛농 슬라임", curse: "검은 심지 슬라임" } },
      { id: "grave-bat", names: { tank: "무덤날개 박쥐", dps: "피갈퀴 박쥐", support: "초음파 박쥐", curse: "귀먹은 묘지 박쥐" } },
      { id: "cracked-skeleton", names: { tank: "금 간 방패해골", dps: "녹슨 칼해골", support: "뼛가루 시종", curse: "저주받은 해골머리" } },
      { id: "bone-grub", names: { tank: "성골 구더기", dps: "톱니 뼈벌레", support: "뼛가루 운반충", curse: "묘독 뼈벌레" } },
      { id: "mold-imp", names: { tank: "버섯등 임프", dps: "송곳니 곰팡이 임프", support: "포자 주머니 임프", curse: "검은 포자 임프" } },
      { id: "gutter-spider", names: { tank: "하수 갑각거미", dps: "갈고리 하수거미", support: "실타래 하수거미", curse: "독안개 하수거미" } },
      { id: "coffin-mite", names: { tank: "관짝 진드기", dps: "못박이 관진드기", support: "목재 갉이 진드기", curse: "부패 관진드기" } },
      { id: "ash-crawler", names: { tank: "잿더미 기어귀", dps: "불씨 기어귀", support: "재받이 사역마", curse: "꺼진 불씨 기어귀" } },
      { id: "grave-crow", names: { tank: "묘비 까마귀", dps: "눈쪼는 까마귀", support: "장례 까마귀", curse: "불길한 까마귀" } },
      { id: "rust-puppet", names: { tank: "녹슨 나무인형", dps: "못박이 인형", support: "실감개 인형", curse: "저주 인형" } },
      { id: "black-snail", names: { tank: "검은 껍질달팽이", dps: "산성 달팽이", support: "점액 운반달팽이", curse: "눈먼 달팽이" } }
    ],
    rare: [
      { id: "bone-miner", names: { tank: "성골 광부", dps: "곡괭이 광부", support: "광맥 안내자", curse: "먼지폐 광부" } },
      { id: "coffin-bearer", names: { tank: "관 운반 방패수", dps: "못망치 장의사", support: "장례 운반자", curse: "닫힌 관의 속삭임" } },
      { id: "bell-acolyte", names: { tank: "종탑 파수시종", dps: "종추 타격수", support: "울림 조율사", curse: "깨진 종의 예언자" } },
      { id: "gill-prisoner", names: { tank: "아가미 죄수", dps: "물칼 죄수", support: "수압 봉합사", curse: "침수 감염자" } },
      { id: "black-tide", names: { tank: "검은 조수 방패체", dps: "파도칼 조수체", support: "조수 부름꾼", curse: "눈먼 조수의 알" } },
      { id: "ink-worm", names: { tank: "두꺼운 잉크벌레", dps: "글자씹는 벌레", support: "먹물 운반충", curse: "이름먹는 벌레" } },
      { id: "page-wraith", names: { tank: "책등 망령", dps: "찢긴 페이지 망령", support: "색인 망령", curse: "금서 속삭임" } },
      { id: "dream-moth", names: { tank: "두꺼운 꿈나방", dps: "수면가루 나방", support: "꿈길 안내나방", curse: "악몽 가루나방" } }
    ],
    epic: [
      { id: "moon-werewolf", names: { tank: "달빛 갑주 늑대인간", dps: "붉은 달 웨어울프", support: "무리 부름 늑대", curse: "월식 저주늑대" } },
      { id: "star-dust", names: { tank: "별먼지 갑각사도", dps: "혜성발톱 사도", support: "성좌 기록사", curse: "별빛 광신자" } },
      { id: "glass-constellation", names: { tank: "유리 성좌 파수체", dps: "파편별 검사", support: "별자리 조율사", curse: "깨진 성좌의 눈" } },
      { id: "red-oath", names: { tank: "붉은 조약 기사", dps: "피서약 처형자", support: "조약 서기관", curse: "봉인 위반자" } },
      { id: "nameless-apostle", names: { tank: "무명 사도 방패체", dps: "무명 사도 칼날체", support: "무명 사도 성가체", curse: "무명 사도 저주체" } },
      { id: "void-midwife", names: { tank: "공허 산파의 껍질", dps: "공허 산파의 손톱", support: "공허 산파의 등불", curse: "공허 산파의 가면" } }
    ],
    legendary: [
      { id: "sleeping-star", names: { tank: "잠든 성좌의 파편", dps: "별을 베는 사냥꾼", support: "꿈을 엮는 성좌", curse: "눈먼 별의 대리자" } },
      { id: "closed-name", names: { tank: "닫힌 이름의 수호자", dps: "닫힌 이름의 칼날", support: "닫힌 이름의 사제", curse: "닫힌 이름의 저주" } }
    ]
  };

  const HERO_ROLE_BASE_OFFSET = { tank: 1, dps: 3, support: 0, curse: 2 };
  const HERO_ROLE_ORDER = ["tank", "dps", "support", "curse"];

  function buildHeroCatalog(baseHeroes) {
    const heroes = [...baseHeroes];
    Object.entries(HERO_CATALOG_TARGETS).forEach(([rarity, roleTargets]) => {
      const roleCounts = Object.fromEntries(HERO_ROLE_ORDER.map((role) => [role, heroes.filter((hero) => hero.rarity === rarity && hero.role === role).length]));
      HERO_CATALOG_FAMILIES[rarity].forEach((family, familyIndex) => {
        HERO_ROLE_ORDER.forEach((role) => {
          if (roleCounts[role] >= roleTargets[role]) return;
          heroes.push({
            id: `${family.id}-${role}`,
            name: family.names[role],
            rarity,
            role,
            base: HERO_RARITY_BASE[rarity] + HERO_ROLE_BASE_OFFSET[role] + familyIndex
          });
          roleCounts[role] += 1;
        });
      });
    });
    return heroes;
  }

  const HEROES = buildHeroCatalog(BASE_HEROES);

  const BASE_GEARS = [
    { id: "rusted-knife", name: "녹슨 제례검", rarity: "common", slot: "weapon", base: 16 },
    { id: "pilgrim-coat", name: "순례자의 외투", rarity: "common", slot: "armor", base: 12 },
    { id: "cracked-sigil", name: "금 간 인장", rarity: "common", slot: "relic", base: 11 },
    { id: "bone-buckler", name: "뼈 버클러", rarity: "common", slot: "armor", base: 15 },
    { id: "ash-talisman", name: "잿빛 부적", rarity: "common", slot: "relic", base: 14 },
    { id: "chipped-cleaver", name: "이 빠진 도살검", rarity: "common", slot: "weapon", base: 18 },
    { id: "mourning-blade", name: "애도의 칼날", rarity: "rare", slot: "weapon", base: 31, effect: "attackPct", effectBase: 0.045 },
    { id: "bone-mail", name: "성골 갑주", rarity: "rare", slot: "armor", base: 28, effect: "debuffResistPct", effectBase: 0.025 },
    { id: "saint-finger", name: "성자의 손가락", rarity: "rare", slot: "relic", base: 25, effect: "bossSoulPct", effectBase: 0.035 },
    { id: "blood-pike", name: "피 묻은 장창", rarity: "rare", slot: "weapon", base: 36, effect: "weaknessBonusPct", effectBase: 0.035 },
    { id: "grave-plate", name: "묘지 판금갑", rarity: "rare", slot: "armor", base: 34, effect: "bossDamagePct", effectBase: 0.035 },
    { id: "bell-chain", name: "종의 사슬", rarity: "rare", slot: "relic", base: 32, effect: "questGoldPct", effectBase: 0.05 },
    { id: "eclipse-staff", name: "일식 지팡이", rarity: "epic", slot: "weapon", base: 48, effect: "projectileChancePct", effectBase: 0.08 },
    { id: "quickening-rapier", name: "가속의 침검", rarity: "epic", slot: "weapon", base: 46, effect: "attackSpeedPct", effectBase: 0.12 },
    { id: "widow-veil", name: "과부의 장막", rarity: "epic", slot: "armor", base: 42, effect: "debuffResistPct", effectBase: 0.045 },
    { id: "abyss-lantern", name: "심연 등불", rarity: "epic", slot: "relic", base: 45, effect: "soulPct", effectBase: 0.045 },
    { id: "funeral-halberd", name: "장례 미늘창", rarity: "epic", slot: "weapon", base: 57, effect: "bossDamagePct", effectBase: 0.06 },
    { id: "moth-cloak", name: "나방 망토", rarity: "epic", slot: "armor", base: 53, effect: "ownedEffectPct", effectBase: 0.055 },
    { id: "black-rosary", name: "검은 묵주", rarity: "epic", slot: "relic", base: 51, effect: "goldPct", effectBase: 0.055 },
    { id: "king-eater", name: "왕을 먹는 검", rarity: "legendary", slot: "weapon", base: 84, effect: "bossDamagePct", effectBase: 0.095 },
    { id: "night-crown", name: "밤의 왕관", rarity: "legendary", slot: "armor", base: 78, effect: "ownedEffectPct", effectBase: 0.08 },
    { id: "last-gospel", name: "마지막 복음", rarity: "legendary", slot: "relic", base: 75, effect: "reserveDpsPct", effectBase: 0.075 },
    { id: "void-executioner", name: "공허 처형검", rarity: "legendary", slot: "weapon", base: 93, effect: "projectileChancePct", effectBase: 0.12 },
    { id: "saintless-armor", name: "성자 없는 갑주", rarity: "legendary", slot: "armor", base: 88, effect: "bossDamagePct", effectBase: 0.075 },
    { id: "nameless-reliquary", name: "무명 성물함", rarity: "legendary", slot: "relic", base: 86, effect: "rebirthSoulPct", effectBase: 0.06 },
    { id: "null-warden-mask", name: "공허 파수 가면", rarity: "legendary", slot: "armor", base: 82, effect: "debuffResistPct", effectBase: 0.07 },
    { id: "contract-ledger", name: "계약자의 원장", rarity: "legendary", slot: "relic", base: 80, effect: "normalSummonDiscountPct", effectBase: 0.045 }
  ];

  const GEAR_CATALOG_TARGETS = {
    common: { weapon: 16, armor: 16, relic: 16 },
    rare: { weapon: 12, armor: 12, relic: 12 },
    epic: { weapon: 8, armor: 8, relic: 8 },
    legendary: { weapon: 4, armor: 4, relic: 4 }
  };

  const GEAR_RARITY_BASE = {
    common: { weapon: 16, armor: 13, relic: 12 },
    rare: { weapon: 34, armor: 31, relic: 29 },
    epic: { weapon: 54, armor: 49, relic: 47 },
    legendary: { weapon: 90, armor: 84, relic: 82 }
  };

  const GEAR_CATALOG_SETS = {
    common: [
      { id: "sewer-rite", names: { weapon: "하수 제례칼", armor: "하수 방수포", relic: "녹슨 배수열쇠" } },
      { id: "wax-altar", names: { weapon: "촛농 단검", armor: "밀랍 앞치마", relic: "꺼진 심지" } },
      { id: "grave-bone", names: { weapon: "뼈 송곳", armor: "금 간 뼈갑주", relic: "묘비 조각" } },
      { id: "rat-king", names: { weapon: "쥐왕 이빨칼", armor: "쥐가죽 망토", relic: "하수 왕관" } },
      { id: "mold-cellar", names: { weapon: "곰팡이 낫", armor: "포자 두건", relic: "푸른 곰팡이병" } },
      { id: "coffin-nail", names: { weapon: "관못 망치", armor: "관뚜껑 방패", relic: "장례 못상자" } },
      { id: "ash-pit", names: { weapon: "재받이 칼", armor: "그을린 두루마기", relic: "꺼진 숯조각" } },
      { id: "gutter-web", names: { weapon: "거미다리 송곳", armor: "거미줄 내피", relic: "하수 거미알" } },
      { id: "black-snail", names: { weapon: "산성 껍질칼", armor: "검은 껍질갑", relic: "점액 유리병" } },
      { id: "crypt-crow", names: { weapon: "까마귀 부리검", armor: "깃털 망토", relic: "불길한 깃" } },
      { id: "rust-puppet", names: { weapon: "꼭두각시 실칼", armor: "나무 관절갑", relic: "끊어진 조종실" } },
      { id: "bone-lantern", names: { weapon: "등불 갈고리", armor: "등불지기 코트", relic: "뼈등불" } },
      { id: "grave-digger", names: { weapon: "무덤삽", armor: "흙묻은 장화", relic: "묘지 흙주머니" } },
      { id: "candle-prayer", names: { weapon: "기도 초검", armor: "기도 천갑", relic: "짧은 기도문" } }
    ],
    rare: [
      { id: "bone-mine", names: { weapon: "성골 곡괭이", armor: "광부 두개갑", relic: "성골 광석" } },
      { id: "bell-tower", names: { weapon: "종추 철퇴", armor: "종탑 판금", relic: "금 간 종설" } },
      { id: "flood-prison", names: { weapon: "수압 작살", armor: "침수 죄수복", relic: "녹슨 족쇄" } },
      { id: "black-tide", names: { weapon: "조수 창", armor: "검은 물비늘", relic: "눈먼 조수병" } },
      { id: "ink-script", names: { weapon: "먹물 절단검", armor: "검은 양피갑", relic: "이름 지운 펜" } },
      { id: "page-warden", names: { weapon: "책등 미늘창", armor: "색인 판갑", relic: "찢긴 금서장" } },
      { id: "dream-hall", names: { weapon: "잠꼬대 단검", armor: "꿈결 로브", relic: "깨진 베개종" } },
      { id: "mirror-face", names: { weapon: "뒤집힌 얼굴낫", armor: "거울 가면", relic: "얼굴 없는 거울" } },
      { id: "gill-court", names: { weapon: "아가미 의식검", armor: "젖은 법복", relic: "침수 재판문" } },
      { id: "moth-sleep", names: { weapon: "나방 날개칼", armor: "수면가루 망토", relic: "꿈나방 고치" } }
    ],
    epic: [
      { id: "moon-wolf", names: { weapon: "월식 발톱검", armor: "달빛 웨어울프 갑주", relic: "붉은 달 송곳니" } },
      { id: "star-observer", names: { weapon: "혜성 절단창", armor: "유리 성좌갑", relic: "별먼지 관측판" } },
      { id: "red-oath", names: { weapon: "붉은 조약검", armor: "봉인 전쟁갑", relic: "피서약 인장" } },
      { id: "throne-war", names: { weapon: "왕좌 징수검", armor: "무덤 장군갑", relic: "왕좌 세금장부" } },
      { id: "void-shell", names: { weapon: "신격 껍질칼", armor: "공허 껍질갑", relic: "공허 산파의 눈" } },
      { id: "nameless-gate", names: { weapon: "끝의 문지기창", armor: "무명 사도 장갑", relic: "닫힌 문장" } }
    ],
    legendary: [
      { id: "sleeping-star", names: { weapon: "잠든 성좌의 검", armor: "성좌 파편갑", relic: "눈먼 별핵" } },
      { id: "closed-name", names: { weapon: "닫힌 이름의 칼날", armor: "닫힌 이름의 갑주", relic: "닫힌 이름의 성물" } }
    ]
  };

  const GEAR_EFFECT_POOLS = {
    weapon: ["attackPct", "attackSpeedPct", "bossDamagePct", "projectileChancePct", "weaknessBonusPct", "lowHpBossDamagePct"],
    armor: ["debuffResistPct", "ownedEffectPct", "bossDamagePct", "reserveDpsPct"],
    relic: ["goldPct", "questGoldPct", "soulPct", "bossSoulPct", "rebirthSoulPct", "normalSummonDiscountPct"]
  };

  const GEAR_EFFECT_BASE_BY_RARITY = {
    rare: 0.032,
    epic: 0.055,
    legendary: 0.085
  };

  const GEAR_SLOT_ORDER = ["weapon", "armor", "relic"];

  function buildGearCatalog(baseGear) {
    const gear = [...baseGear];
    Object.entries(GEAR_CATALOG_TARGETS).forEach(([rarity, slotTargets]) => {
      const slotCounts = Object.fromEntries(GEAR_SLOT_ORDER.map((slot) => [slot, gear.filter((item) => item.rarity === rarity && item.slot === slot).length]));
      GEAR_CATALOG_SETS[rarity].forEach((set, setIndex) => {
        GEAR_SLOT_ORDER.forEach((slot) => {
          if (slotCounts[slot] >= slotTargets[slot]) return;
          const item = {
            id: `${set.id}-${slot}`,
            name: set.names[slot],
            rarity,
            slot,
            base: GEAR_RARITY_BASE[rarity][slot] + setIndex * 2
          };
          if (rarity !== "common") {
            const effectPool = GEAR_EFFECT_POOLS[slot];
            const effect = effectPool[(setIndex + slotCounts[slot]) % effectPool.length];
            item.effect = effect;
            item.effectBase = GEAR_EFFECT_BASE_BY_RARITY[rarity] + (setIndex % 3) * 0.004;
            if (effect === "normalSummonDiscountPct") item.effectBase = Math.min(item.effectBase, 0.045);
            if (effect === "attackSpeedPct") item.effectBase += 0.035;
            if (effect === "projectileChancePct") item.effectBase += 0.025;
          }
          gear.push(item);
          slotCounts[slot] += 1;
        });
      });
    });
    return gear;
  }

  const GEARS = buildGearCatalog(BASE_GEARS);

  const ENEMY_ROLES = ["tank", "dps", "support", "curse"];
  const ASSETS = {
    summonerSheet: "../assets/generated/sprites/summoner/sheet-transparent.png",
    companionSheet: "../assets/generated/sprites/companions-v3/sheet-transparent.png?v=20260627-companionv3",
    enemySheet: "../assets/generated/sprites/enemies-v3/sheet-transparent.png?v=20260627-enemyv3",
    bossSheet: "../assets/generated/sprites/bosses-v3/sheet-transparent.png?v=20260627-bossv3",
    bossMarkerSkull: "../assets/generated/boss-marker-skull/boss-skull.png?v=20260628-bossskull1",
    attackBoltSheet: "../assets/generated/fx/abyss-bolt/sheet-transparent.png",
    companionProjectileSheet: "../assets/generated/fx/companion-projectiles-v2/sheet-transparent.png?v=20260627-projectilesv2",
    hitImpactSheet: "../assets/generated/fx/abyss-impact/sheet-transparent.png",
    audio: {
      dungeonBgm: "../assets/audio/abyss-dungeon-loop.wav?v=20260627-combat-sfx1",
      bossBgm: "../assets/audio/abyss-boss-loop.wav?v=20260627-combat-sfx1",
      summon: "../assets/audio/summon-rite.wav?v=20260627-combat-sfx1",
      summonRare: "../assets/audio/summon-rare.wav?v=20260627-combat-sfx1",
      rebirth: "../assets/audio/rebirth.wav?v=20260627-combat-sfx1",
      upgrade: "../assets/audio/upgrade.wav?v=20260627-combat-sfx1",
      bossClear: "../assets/audio/boss-clear.wav?v=20260627-combat-sfx1",
      attackCast: "../assets/audio/attack-cast.wav?v=20260627-combat-sfx1",
      attackSwing: "../assets/audio/attack-swing.wav?v=20260627-combat-sfx1",
      attackArrow: "../assets/audio/attack-arrow.wav?v=20260627-combat-sfx1",
      attackCurse: "../assets/audio/attack-curse.wav?v=20260627-combat-sfx1",
      hitLight: "../assets/audio/hit-light.wav?v=20260627-combat-sfx1",
      hitHeavy: "../assets/audio/hit-heavy.wav?v=20260627-combat-sfx1",
      criticalHit: "../assets/audio/critical-hit.wav?v=20260628-critical1",
      enemyDown: "../assets/audio/enemy-down.wav?v=20260627-combat-sfx1"
    }
  };
  const BATTLE_BACKGROUNDS = [
    { id: "sewer-catacomb-v2", startStage: 1, src: "../assets/generated/backgrounds/sewer-catacomb-v2.png" },
    { id: "bone-reliquary-v2", startStage: 100, src: "../assets/generated/backgrounds/bone-reliquary-v2.png" },
    { id: "cracked-belltower-v2", startStage: 300, src: "../assets/generated/backgrounds/cracked-belltower-v2.png" },
    { id: "drowned-prison-v2", startStage: 600, src: "../assets/generated/backgrounds/drowned-prison-v2.png" },
    { id: "abyss-pressure-v2", startStage: 1000, src: "../assets/generated/backgrounds/abyss-pressure-v2.png" },
    { id: "forbidden-archive-v2", startStage: 1500, src: "../assets/generated/backgrounds/forbidden-archive-v2.png" },
    { id: "dream-corridor-v2", startStage: 2500, src: "../assets/generated/backgrounds/dream-corridor-v2.png" },
    { id: "star-observatory-v2", startStage: 4000, src: "../assets/generated/backgrounds/star-observatory-v2.png" },
    { id: "ancient-throne-v2", startStage: 6000, src: "../assets/generated/backgrounds/ancient-throne-v2.png" },
    { id: "nameless-rim-v2", startStage: 8000, src: "../assets/generated/backgrounds/nameless-rim-v2.png" }
  ];

  const SPRITES = {
    summoner: { cols: 2, rows: 2, frameCount: 4, height: 116 },
    skinSummoner: { cols: 2, rows: 2, frameCount: 4, height: 126 },
    companions: { cols: 12, rows: 10, frameCount: 120, height: 80 },
    enemies: { cols: 16, rows: 10, frameCount: 160, height: 92 },
    bosses: { cols: 8, rows: 5, frameCount: 40, height: 116 },
    attackBolt: { cols: 2, rows: 2, frameCount: 4, height: 42 },
    companionProjectile: { cols: 4, rows: 4, frameCount: 16, height: 38 },
    hitImpact: { cols: 2, rows: 2, frameCount: 4, height: 58 }
  };

  const ROLE_PROJECTILE_FRAME = {
    tank: 4,
    dps: 2,
    support: 10,
    curse: 12
  };

  const HERO_PROJECTILE_FRAME = {
    "iron-page": 4,
    "grave-archer": 1,
    "candle-nun": 9,
    "ash-rat-knight": 4,
    "bone-knife-boy": 3,
    "grave-bell-girl": 8,
    "black-goat-scribe": 13,
    "scarlet-lancer": 5,
    "bell-shield": 8,
    "wax-healer": 11,
    "chain-exorcist": 7,
    "cinder-hunter": 2,
    "moon-apothecary": 11,
    "hex-duelist": 14,
    "saint-ruin": 10,
    "gallows-captain": 4,
    "red-choir": 9,
    "moth-oracle": 14,
    "duke-ashen": 2,
    "morrow-king": 7,
    "oracle-thorn": 6,
    "white-lantern": 10,
    "nameless-bishop": 15,
    "abyss-marshal": 7
  };

  const PROJECTILE_FRAME_HEIGHT = {
    0: 34,
    1: 34,
    2: 36,
    3: 34,
    4: 32,
    5: 36,
    6: 38,
    7: 32,
    8: 42,
    9: 36,
    10: 38,
    11: 36,
    12: 42,
    13: 40,
    14: 42,
    15: 40
  };

  const ROLE_ATTACK_PROFILE = {
    tank: { cooldown: 1.55, damage: 0.82, duration: 0.62, height: 36, yOffset: 4, color: "#93c5fd" },
    dps: { cooldown: 0.92, damage: 1.22, duration: 0.42, height: 36, yOffset: -10, color: "#f87171" },
    support: { cooldown: 1.25, damage: 0.74, duration: 0.58, height: 34, yOffset: -24, color: "#fde68a" },
    curse: { cooldown: 1.68, damage: 0.96, duration: 0.68, height: 38, yOffset: -16, color: "#c084fc" }
  };

  const SUMMONER_ATTACK_PROFILE = {
    cooldown: 0.82,
    duration: 0.48,
    height: 42,
    yOffset: -8,
    color: "#f5c76a"
  };

  const SPRITE_SOURCE_FACING = {
    summoner: "right",
    companion: "right",
    enemy: "left"
  };

  const COMPANION_ROLE_COL = {
    tank: 0,
    dps: 1,
    support: 2,
    curse: 3
  };

  const COMPANION_RARITY_ROW = {
    common: 0,
    rare: 1,
    epic: 2,
    legendary: 3
  };

  function companionSpriteFrame(hero) {
    const exactIndex = HEROES.findIndex((entry) => entry.id === hero?.id);
    if (exactIndex >= 0) return exactIndex;
    const row = COMPANION_RARITY_ROW[hero?.rarity] ?? 0;
    const col = COMPANION_ROLE_COL[hero?.role] ?? 0;
    return row * 4 + col;
  }

  const ENEMY_SPRITE_BY_ROLE = {
    tank: 0,
    dps: 1,
    support: 2,
    curse: 3
  };

  const LEGACY_WEAK_ENEMY_VARIANTS = [
    { id: "sewer-rat", role: "dps", tier: "weak", name: "시궁쥐", visualScale: 0.58, hpMult: 0.5 },
    { id: "grave-bat", role: "dps", tier: "weak", name: "묘지 박쥐", visualScale: 0.56, hpMult: 0.48 },
    { id: "candle-slime", role: "support", tier: "weak", name: "촛농 슬라임", visualScale: 0.62, hpMult: 0.54 },
    { id: "bone-grub", role: "tank", tier: "weak", name: "뼈 구더기", visualScale: 0.6, hpMult: 0.58 },
    { id: "ash-crawler", role: "curse", tier: "weak", name: "잿더미 기어귀", visualScale: 0.6, hpMult: 0.52 },
    { id: "cracked-skeleton", role: "tank", tier: "weak", name: "금 간 해골병", visualScale: 0.68, hpMult: 0.64 },
    { id: "mold-imp", role: "curse", tier: "weak", name: "곰팡이 임프", visualScale: 0.62, hpMult: 0.56 },
    { id: "gutter-spider", role: "dps", tier: "weak", name: "하수도 거미", visualScale: 0.58, hpMult: 0.5 },
    { id: "tattered-familiar", role: "support", tier: "weak", name: "해진 사역마", visualScale: 0.62, hpMult: 0.55 },
    { id: "coffin-mite", role: "tank", tier: "weak", name: "관짝 진드기", visualScale: 0.6, hpMult: 0.6 }
  ];

  const LEGACY_ENEMY_VARIANTS = [
    ...LEGACY_WEAK_ENEMY_VARIANTS,
    { id: "iron-wraith", role: "tank", name: "철갑 망령", filter: "none", visualScale: 1 },
    { id: "grave-shielder", role: "tank", name: "묘지 방패병", filter: "hue-rotate(14deg) saturate(0.9) brightness(0.95)", visualScale: 0.96 },
    { id: "black-armor", role: "tank", name: "검은 갑주", filter: "hue-rotate(250deg) saturate(0.78) brightness(0.72)", visualScale: 1.04 },
    { id: "door-golem", role: "tank", name: "문지기 골렘", filter: "saturate(0.65) brightness(1.12)", visualScale: 1.12 },
    { id: "chain-warden", role: "tank", name: "사슬 파수병", filter: "hue-rotate(205deg) saturate(0.82) brightness(0.9)", visualScale: 1 },
    { id: "bell-colossus", role: "tank", name: "종탑 거인", filter: "sepia(0.28) saturate(1.25) brightness(0.9)", visualScale: 1.18 },
    { id: "bone-barricade", role: "tank", name: "성골 장벽병", filter: "sepia(0.45) saturate(0.7) brightness(1.08)", visualScale: 1.05 },
    { id: "rusted-guardian", role: "tank", name: "녹슨 수호자", filter: "hue-rotate(330deg) saturate(1.1) brightness(0.88)", visualScale: 1.08 },
    { id: "coffin-bearer", role: "tank", name: "관 짊어진 자", filter: "hue-rotate(32deg) saturate(0.82) brightness(0.82)", visualScale: 1.1 },
    { id: "gravegate-sentinel", role: "tank", name: "무덤문 감시자", filter: "hue-rotate(185deg) saturate(0.88) brightness(0.96)", visualScale: 1.02 },

    { id: "blood-duelist", role: "dps", name: "피 굶주린 검객", filter: "none", visualScale: 1 },
    { id: "shadow-cutter", role: "dps", name: "그림자 칼잡이", filter: "hue-rotate(245deg) saturate(0.85) brightness(0.78)", visualScale: 0.96 },
    { id: "rage-hunter", role: "dps", name: "분노의 사냥꾼", filter: "hue-rotate(340deg) saturate(1.35) brightness(1.02)", visualScale: 1.04 },
    { id: "grave-chaser", role: "dps", name: "묘지 추격자", filter: "hue-rotate(28deg) saturate(0.9) brightness(0.9)", visualScale: 0.98 },
    { id: "blood-butcher", role: "dps", name: "피묻은 도살자", filter: "saturate(1.45) brightness(0.82)", visualScale: 1.08 },
    { id: "red-claw", role: "dps", name: "붉은 발톱", filter: "hue-rotate(12deg) saturate(1.6) brightness(1.05)", visualScale: 0.92 },
    { id: "knife-acolyte", role: "dps", name: "칼날 시종", filter: "hue-rotate(210deg) saturate(0.92) brightness(0.95)", visualScale: 0.94 },
    { id: "ash-stalker", role: "dps", name: "잿빛 추적자", filter: "grayscale(0.35) brightness(0.98)", visualScale: 1 },
    { id: "crimson-archer", role: "dps", name: "홍염 사수", filter: "hue-rotate(320deg) saturate(1.2) brightness(1)", visualScale: 0.97 },
    { id: "gallows-slasher", role: "dps", name: "교수대 난도질꾼", filter: "hue-rotate(285deg) saturate(1.05) brightness(0.86)", visualScale: 1.02 },

    { id: "fallen-priest", role: "support", name: "타락한 성직자", filter: "none", visualScale: 1 },
    { id: "curse-apothecary", role: "support", name: "저주 약제사", filter: "hue-rotate(94deg) saturate(1.12) brightness(0.95)", visualScale: 0.98 },
    { id: "night-prayer", role: "support", name: "밤의 기도자", filter: "hue-rotate(230deg) saturate(0.85) brightness(0.82)", visualScale: 1 },
    { id: "bell-priest", role: "support", name: "종의 사제", filter: "sepia(0.45) saturate(1.2) brightness(1.04)", visualScale: 1.04 },
    { id: "wax-monk", role: "support", name: "밀랍 수도자", filter: "hue-rotate(36deg) saturate(0.75) brightness(1.12)", visualScale: 0.96 },
    { id: "forbidden-reader", role: "support", name: "금서 봉독자", filter: "hue-rotate(260deg) saturate(1.25) brightness(0.96)", visualScale: 1.02 },
    { id: "lantern-cantor", role: "support", name: "등불 성가수", filter: "hue-rotate(58deg) saturate(1.3) brightness(1.1)", visualScale: 0.98 },
    { id: "funeral-deacon", role: "support", name: "장례 부제", filter: "grayscale(0.18) sepia(0.26) brightness(0.9)", visualScale: 1.05 },
    { id: "hollow-choir", role: "support", name: "텅 빈 합창대", filter: "hue-rotate(178deg) saturate(0.9) brightness(1.08)", visualScale: 1 },
    { id: "pale-mender", role: "support", name: "창백한 봉합사", filter: "hue-rotate(130deg) saturate(0.72) brightness(1.12)", visualScale: 0.95 },

    { id: "void-scribe", role: "curse", name: "공허 서기관", filter: "none", visualScale: 1 },
    { id: "abyss-seer", role: "curse", name: "심연 점술가", filter: "hue-rotate(282deg) saturate(1.2) brightness(1)", visualScale: 1.02 },
    { id: "nameless-heretic", role: "curse", name: "이름 없는 이단자", filter: "hue-rotate(210deg) saturate(0.85) brightness(0.84)", visualScale: 0.98 },
    { id: "black-ledger", role: "curse", name: "검은 장부관", filter: "sepia(0.25) saturate(0.9) brightness(0.86)", visualScale: 1 },
    { id: "shadow-prophet", role: "curse", name: "그림자 예언자", filter: "hue-rotate(248deg) saturate(1.28) brightness(0.9)", visualScale: 1.05 },
    { id: "mouthless-shaman", role: "curse", name: "입 없는 주술사", filter: "hue-rotate(305deg) saturate(0.92) brightness(1.02)", visualScale: 0.96 },
    { id: "moth-warlock", role: "curse", name: "나방 흑마술사", filter: "hue-rotate(72deg) saturate(0.95) brightness(1.08)", visualScale: 1.02 },
    { id: "eclipse-astrologer", role: "curse", name: "일식 점성술사", filter: "hue-rotate(190deg) saturate(1.05) brightness(0.98)", visualScale: 1 },
    { id: "grave-whisperer", role: "curse", name: "무덤 속삭임", filter: "grayscale(0.25) hue-rotate(265deg) brightness(0.86)", visualScale: 0.94 },
    { id: "red-ink-witch", role: "curse", name: "붉은 잉크 마녀", filter: "hue-rotate(330deg) saturate(1.4) brightness(0.95)", visualScale: 0.98 }
  ].map((enemy, index) => ({ ...enemy, frame: enemy.frame ?? index, filter: "none" }));

  const LEGACY_BOSS_VARIANTS = [
    { id: "abyss-gatekeeper", name: "심연 문지기", role: "tank", frame: 0, filter: "saturate(1.1) brightness(0.92)", visualScale: 1.14, hpMult: 1 },
    { id: "blackdoor-hound", name: "검은문 파수견", role: "dps", frame: 1, filter: "hue-rotate(340deg) saturate(1.5) brightness(0.92)", visualScale: 1.2, hpMult: 1.06 },
    { id: "corridor-king", name: "회랑의 왕", role: "support", frame: 2, filter: "sepia(0.42) saturate(1.35) brightness(1.02)", visualScale: 1.22, hpMult: 1.12 },
    { id: "nameless-shadow", name: "무명 왕의 그림자", role: "curse", frame: 3, filter: "hue-rotate(260deg) saturate(1.35) brightness(0.78)", visualScale: 1.24, hpMult: 1.18 },
    { id: "ash-duke", name: "잿빛 대공", role: "tank", frame: 0, filter: "grayscale(0.32) sepia(0.28) brightness(1)", visualScale: 1.28, hpMult: 1.2 },
    { id: "nine-bell-apostle", name: "아홉 종의 사도", role: "support", frame: 2, filter: "hue-rotate(50deg) saturate(1.4) brightness(1.08)", visualScale: 1.26, hpMult: 1.24 },
    { id: "hundred-abyss-dragon", name: "백층의 심연 용", role: "curse", frame: 3, filter: "hue-rotate(292deg) saturate(1.7) brightness(0.9)", visualScale: 1.42, hpMult: 1.4 },
    { id: "bone-cathedral", name: "성골 대성당", role: "tank", frame: 0, filter: "sepia(0.5) saturate(0.78) brightness(1.12)", visualScale: 1.3, hpMult: 1.18 },
    { id: "crimson-executioner", name: "홍련 처형자", role: "dps", frame: 1, filter: "hue-rotate(355deg) saturate(1.75) brightness(1)", visualScale: 1.22, hpMult: 1.12 },
    { id: "wax-saint", name: "밀랍 성자", role: "support", frame: 2, filter: "hue-rotate(35deg) saturate(0.85) brightness(1.18)", visualScale: 1.2, hpMult: 1.1 },
    { id: "void-taxmaster", name: "공허 징수관", role: "curse", frame: 3, filter: "hue-rotate(218deg) saturate(1.12) brightness(0.86)", visualScale: 1.18, hpMult: 1.08 },
    { id: "grave-leviathan", name: "무덤의 레비아탄", role: "tank", frame: 0, filter: "hue-rotate(185deg) saturate(0.9) brightness(0.95)", visualScale: 1.36, hpMult: 1.28 },
    { id: "scarlet-packmaster", name: "핏빛 무리장", role: "dps", frame: 1, filter: "hue-rotate(15deg) saturate(1.45) brightness(0.86)", visualScale: 1.18, hpMult: 1.1 },
    { id: "lantern-matriarch", name: "등불의 대모", role: "support", frame: 2, filter: "hue-rotate(76deg) saturate(1.2) brightness(1.15)", visualScale: 1.18, hpMult: 1.14 },
    { id: "eclipse-bishop", name: "일식 주교", role: "curse", frame: 3, filter: "hue-rotate(300deg) saturate(1.18) brightness(0.98)", visualScale: 1.22, hpMult: 1.16 },
    { id: "rust-throne", name: "녹슨 왕좌", role: "tank", frame: 0, filter: "hue-rotate(24deg) saturate(1.05) brightness(0.85)", visualScale: 1.34, hpMult: 1.22 }
  ].map((boss, index) => ({ ...boss, frame: index, filter: "none" }));

  const MONSTER_ROLE_SUFFIX = {
    tank: "방패체",
    dps: "칼날체",
    support: "증식체",
    curse: "저주체"
  };

  const MONSTER_ROLE_HP = { tank: 1.18, dps: 0.88, support: 1, curse: 1.06 };
  const MONSTER_ROLE_SCALE = { tank: 1.05, dps: 0.96, support: 1, curse: 1.02 };
  const MONSTER_CODEX_RARITY_BY_ZONE = ["common", "common", "rare", "rare", "rare", "epic", "epic", "epic", "legendary", "legendary"];

  const MONSTER_ZONE_CATALOG = [
    {
      id: "sewer-grave", index: 1, start: 1, end: 99, theme: "하수 묘지",
      families: [
        { id: "sewer-rat", name: "시궁쥐", tier: "weak", scale: 0.62, hp: 0.55, visual: "낮은 자세의 작은 설치류, 젖은 털, 노란 눈" },
        { id: "wax-slime", name: "촛농 슬라임", tier: "weak", scale: 0.66, hp: 0.58, visual: "흘러내리는 밀랍 덩어리, 작은 촛불 심지" },
        { id: "grave-bat", name: "묘지 박쥐", tier: "weak", scale: 0.6, hp: 0.5, visual: "찢긴 날개, 회색 귀, 빠른 급강하" },
        { id: "cracked-skeleton", name: "금 간 해골", tier: "weak", scale: 0.72, hp: 0.66, visual: "금 간 두개골, 짧은 녹슨 장비" }
      ],
      bosses: [
        { id: "sewer-rat-king", name: "하수 왕쥐", role: "dps", type: "floor", scale: 1.08, hp: 1.02 },
        { id: "wax-gatekeeper", name: "밀랍 문지기", role: "tank", type: "floor", scale: 1.15, hp: 1.1 },
        { id: "ossuary-cleaner", name: "납골 청소부", role: "support", type: "gate", scale: 1.18, hp: 1.18 },
        { id: "first-grave-king", name: "묘지 첫 왕", role: "curse", type: "apex", scale: 1.26, hp: 1.3 }
      ]
    },
    {
      id: "bone-mine", index: 2, start: 100, end: 299, theme: "납골 광맥",
      families: [
        { id: "bone-grub", name: "뼈벌레", scale: 0.82, hp: 0.82, visual: "뼈마디가 이어진 벌레, 흙먼지" },
        { id: "skeleton-miner", name: "해골 광부", scale: 0.92, hp: 0.92, visual: "곡괭이와 광부등, 성골 가루" },
        { id: "ossuary-spider", name: "유골 거미", scale: 0.9, hp: 0.88, visual: "갈비뼈 다리, 하얀 거미줄" },
        { id: "coffin-bearer", name: "관 운반자", scale: 1.02, hp: 1.02, visual: "등에 관을 멘 장의 잔재" }
      ],
      bosses: [
        { id: "holybone-driller", name: "성골 굴착자", role: "dps", type: "floor", scale: 1.2, hp: 1.12 },
        { id: "boneheap-knight", name: "뼈무더기 기사", role: "tank", type: "floor", scale: 1.28, hp: 1.24 },
        { id: "minegate-warden", name: "관문 파수꾼", role: "support", type: "gate", scale: 1.22, hp: 1.2 },
        { id: "ossuary-lord", name: "납골 광맥의 주인", role: "curse", type: "apex", scale: 1.34, hp: 1.34 }
      ]
    },
    {
      id: "fallen-bell", index: 3, start: 300, end: 599, theme: "폐성당 종탑",
      families: [
        { id: "bell-worm", name: "종벌레", scale: 0.88, hp: 0.9, visual: "금속 종 껍질, 떨리는 울림" },
        { id: "wax-doll", name: "밀랍 인형", scale: 0.94, hp: 0.96, visual: "기도 자세의 밀랍 인형, 녹은 얼굴" },
        { id: "exiled-nun", name: "파문 수녀 잔재", scale: 0.98, hp: 1, visual: "찢긴 수도복, 꺼진 촛불" },
        { id: "glass-eye", name: "스테인드글라스 눈", scale: 0.92, hp: 0.94, visual: "유리 파편 눈동자, 성화 색채" }
      ],
      bosses: [
        { id: "belltower-hammer", name: "종탑 망치수", role: "dps", type: "floor", scale: 1.22, hp: 1.14 },
        { id: "wax-choirmaster", name: "밀랍 성가대장", role: "support", type: "floor", scale: 1.2, hp: 1.18 },
        { id: "exiled-bishop", name: "파문된 주교", role: "curse", type: "gate", scale: 1.26, hp: 1.24 },
        { id: "broken-icon-watch", name: "깨진 성화의 감시자", role: "tank", type: "apex", scale: 1.34, hp: 1.38 }
      ]
    },
    {
      id: "flooded-prison", index: 4, start: 600, end: 999, theme: "침수 지하감옥",
      families: [
        { id: "gill-prisoner", name: "아가미 죄수", scale: 0.98, hp: 1, visual: "젖은 죄수복, 목의 아가미" },
        { id: "black-tide-slime", name: "검은 조수 슬라임", scale: 0.92, hp: 0.96, visual: "먹빛 물덩어리, 파도 자국" },
        { id: "tentacle-fish", name: "촉수 괴어", scale: 1.02, hp: 1.02, visual: "물고기 몸통과 촉수 턱" },
        { id: "deep-crab", name: "심해 게", scale: 1.05, hp: 1.08, visual: "두꺼운 집게, 조개 갑각" }
      ],
      bosses: [
        { id: "sunken-jailer", name: "잠긴 간수장", role: "tank", type: "floor", scale: 1.24, hp: 1.22 },
        { id: "tide-condemned", name: "조수의 사형수", role: "dps", type: "floor", scale: 1.2, hp: 1.16 },
        { id: "tentacle-door-warden", name: "촉수문 문지기", role: "curse", type: "gate", scale: 1.3, hp: 1.26 },
        { id: "blind-floodgate", name: "눈먼 수문장", role: "support", type: "apex", scale: 1.36, hp: 1.38 }
      ]
    },
    {
      id: "abyss-pressure", index: 5, start: 1000, end: 1499, theme: "심연 압박 시작",
      families: [
        { id: "rift-knight", name: "균열 기사", scale: 1.04, hp: 1.08, visual: "균열 난 갑주, 보랏빛 틈" },
        { id: "gravity-wraith", name: "중력 망령", scale: 1, hp: 1.05, visual: "아래로 처지는 망토, 검은 중력장" },
        { id: "pressure-brute", name: "압박자", scale: 1.08, hp: 1.12, visual: "눌린 근육, 짓누르는 손" },
        { id: "blind-watcher", name: "눈먼 감시자", scale: 1.02, hp: 1.08, visual: "눈가리개와 빛나는 감각기관" }
      ],
      bosses: [
        { id: "rift-general", name: "균열 장군", role: "tank", type: "floor", scale: 1.28, hp: 1.26 },
        { id: "abyss-oppressor", name: "심연 압박자", role: "dps", type: "floor", scale: 1.26, hp: 1.22 },
        { id: "blind-judge", name: "눈먼 재판관", role: "support", type: "gate", scale: 1.28, hp: 1.28 },
        { id: "first-pressure-wall", name: "첫 번째 압박의 벽", role: "curse", type: "apex", scale: 1.4, hp: 1.42 }
      ]
    },
    {
      id: "forbidden-library", index: 6, start: 1500, end: 2499, theme: "금서 서고",
      families: [
        { id: "ink-worm", name: "잉크 벌레", scale: 0.96, hp: 1, visual: "검은 먹물 몸통, 글자 이빨" },
        { id: "bookspine-golem", name: "책등 골렘", scale: 1.1, hp: 1.14, visual: "가죽 책등과 금속 장정" },
        { id: "page-wraith", name: "페이지 망령", scale: 0.98, hp: 1.04, visual: "찢긴 종이 망토, 떠다니는 문장" },
        { id: "name-thief", name: "이름 훔치는 서기", scale: 1, hp: 1.06, visual: "빈 얼굴, 깃펜과 검은 장부" }
      ],
      bosses: [
        { id: "grimoire-warden", name: "금서 파수관", role: "tank", type: "floor", scale: 1.28, hp: 1.28 },
        { id: "black-ink-monk", name: "검은 잉크의 수도사", role: "support", type: "floor", scale: 1.22, hp: 1.24 },
        { id: "name-thief-inquisitor", name: "이름 도둑 심문관", role: "curse", type: "gate", scale: 1.28, hp: 1.28 },
        { id: "living-index", name: "살아 있는 색인", role: "dps", type: "apex", scale: 1.34, hp: 1.36 }
      ]
    },
    {
      id: "dream-corridor", index: 7, start: 2500, end: 3999, theme: "꿈의 회랑",
      families: [
        { id: "dream-moth", name: "꿈나방", scale: 0.96, hp: 1, visual: "분홍빛 수면가루, 부드러운 날개" },
        { id: "sleep-talker", name: "잠꼬대 기사", scale: 1.04, hp: 1.08, visual: "잠든 투구, 비틀거리는 검" },
        { id: "inverted-face", name: "뒤집힌 얼굴", scale: 0.98, hp: 1.06, visual: "거꾸로 붙은 얼굴, 웃는 입" },
        { id: "underbed-hunter", name: "침대 밑 사냥꾼", scale: 1, hp: 1.08, visual: "납작한 몸, 긴 팔과 발톱" }
      ],
      bosses: [
        { id: "dream-cleaver", name: "꿈을 베는 기사", role: "dps", type: "floor", scale: 1.24, hp: 1.22 },
        { id: "sleeping-face-king", name: "잠든 얼굴의 왕", role: "curse", type: "floor", scale: 1.3, hp: 1.28 },
        { id: "corridor-predator", name: "회랑의 포식자", role: "tank", type: "gate", scale: 1.32, hp: 1.34 },
        { id: "nightmare-emblem", name: "악몽의 문장", role: "support", type: "apex", scale: 1.3, hp: 1.36 }
      ]
    },
    {
      id: "star-observatory", index: 8, start: 4000, end: 5999, theme: "별의 관측소",
      families: [
        { id: "stardust-apostle", name: "별먼지 사도", scale: 1.02, hp: 1.08, visual: "별가루 로브, 빛나는 손" },
        { id: "glass-constellation", name: "유리 성좌", scale: 1.08, hp: 1.12, visual: "유리 별자리 골격, 푸른 빛" },
        { id: "comet-beast", name: "혜성 짐승", scale: 1.08, hp: 1.1, visual: "불타는 꼬리, 빠른 돌진" },
        { id: "moon-werewolf", name: "달빛 웨어울프", scale: 1.1, hp: 1.12, visual: "은빛 갈기, 달무늬 발톱" }
      ],
      bosses: [
        { id: "starlight-executioner", name: "별빛 처형자", role: "dps", type: "floor", scale: 1.28, hp: 1.24 },
        { id: "glass-zodiac", name: "유리 별자리", role: "support", type: "floor", scale: 1.3, hp: 1.28 },
        { id: "lunar-mutant-king", name: "달의 변이왕", role: "tank", type: "gate", scale: 1.36, hp: 1.36 },
        { id: "fallen-star-priest", name: "떨어진 별의 사제", role: "curse", type: "apex", scale: 1.34, hp: 1.38 }
      ]
    },
    {
      id: "ancient-throne", index: 9, start: 6000, end: 7999, theme: "고대 왕좌",
      families: [
        { id: "throne-soldier", name: "왕좌병", scale: 1.06, hp: 1.12, visual: "낡은 왕실 갑주, 황금 흠집" },
        { id: "oath-judge", name: "조약 심판관", scale: 1.04, hp: 1.12, visual: "붉은 계약서와 판결봉" },
        { id: "red-seal-beast", name: "붉은 봉인 야수", scale: 1.12, hp: 1.16, visual: "붉은 봉인끈, 거대한 등" },
        { id: "grave-general", name: "무덤 장군", scale: 1.1, hp: 1.16, visual: "전쟁 깃발, 무덤 흙 갑주" }
      ],
      bosses: [
        { id: "red-oath-knight", name: "붉은 조약의 기사", role: "tank", type: "floor", scale: 1.32, hp: 1.34 },
        { id: "throne-taxmaster", name: "왕좌의 징수관", role: "support", type: "floor", scale: 1.28, hp: 1.3 },
        { id: "sealed-war-commander", name: "봉인 전쟁의 사령관", role: "dps", type: "gate", scale: 1.36, hp: 1.36 },
        { id: "sleeping-king-proxy", name: "잠든 왕의 대리자", role: "curse", type: "apex", scale: 1.4, hp: 1.44 }
      ]
    },
    {
      id: "nameless-edge", index: 10, start: 8000, end: 10000, theme: "무명신 외곽",
      families: [
        { id: "nameless-apostle", name: "무명 사도", scale: 1.08, hp: 1.16, visual: "얼굴 없는 성자, 검은 후광" },
        { id: "void-midwife", name: "공허 산파", scale: 1.06, hp: 1.14, visual: "긴 팔과 포대기, 푸른 공허빛" },
        { id: "god-shell", name: "신격 껍질", scale: 1.14, hp: 1.2, visual: "빈 신상 갑각, 균열 난 금빛" },
        { id: "end-gatekeeper", name: "끝의 문지기", scale: 1.12, hp: 1.18, visual: "거대한 열쇠창, 문장 없는 방패" }
      ],
      bosses: [
        { id: "void-midwife", name: "공허의 산파", role: "support", type: "floor", scale: 1.32, hp: 1.34 },
        { id: "god-shell-warden", name: "신격 껍질 수호자", role: "tank", type: "floor", scale: 1.4, hp: 1.44 },
        { id: "end-gatekeeper", name: "끝의 문지기", role: "dps", type: "gate", scale: 1.36, hp: 1.38 },
        { id: "closed-name-god", name: "닫힌 이름의 신", role: "curse", type: "final", scale: 1.5, hp: 1.6, firstStage: 10000 }
      ]
    }
  ];

  function monsterZoneForStage(stage) {
    const safeStage = Math.max(1, Math.floor(Number(stage) || 1));
    return MONSTER_ZONE_CATALOG.find((zone) => safeStage >= zone.start && safeStage <= zone.end) || MONSTER_ZONE_CATALOG[MONSTER_ZONE_CATALOG.length - 1];
  }

  function codexRarityForMonsterZone(zone) {
    return MONSTER_CODEX_RARITY_BY_ZONE[Math.max(0, zone.index - 1)] || "rare";
  }

  const MONSTER_FAMILY_FRAME = {
    "sewer-rat": 0,
    "wax-slime": 2,
    "grave-bat": 1,
    "cracked-skeleton": 5,
    "bone-grub": 3,
    "skeleton-miner": 5,
    "ossuary-spider": 7,
    "coffin-bearer": 18,
    "bell-worm": 15,
    "wax-doll": 34,
    "exiled-nun": 30,
    "glass-eye": 8,
    "gill-prisoner": 23,
    "black-tide-slime": 4,
    "tentacle-fish": 4,
    "deep-crab": 7,
    "rift-knight": 12,
    "gravity-wraith": 48,
    "pressure-brute": 24,
    "blind-watcher": 41,
    "ink-worm": 3,
    "bookspine-golem": 43,
    "page-wraith": 8,
    "name-thief": 40,
    "dream-moth": 46,
    "sleep-talker": 11,
    "inverted-face": 42,
    "underbed-hunter": 21,
    "stardust-apostle": 36,
    "glass-constellation": 47,
    "comet-beast": 25,
    "moon-werewolf": 25,
    "throne-soldier": 17,
    "oath-judge": 33,
    "red-seal-beast": 24,
    "grave-general": 17,
    "nameless-apostle": 42,
    "void-midwife": 37,
    "god-shell": 13,
    "end-gatekeeper": 19
  };

  const BOSS_FRAME_BY_ID = {
    "sewer-rat-king": 1,
    "wax-gatekeeper": 0,
    "ossuary-cleaner": 7,
    "first-grave-king": 2,
    "holybone-driller": 8,
    "boneheap-knight": 4,
    "minegate-warden": 0,
    "ossuary-lord": 7,
    "belltower-hammer": 0,
    "wax-choirmaster": 5,
    "exiled-bishop": 14,
    "broken-icon-watch": 2,
    "sunken-jailer": 0,
    "tide-condemned": 8,
    "tentacle-door-warden": 3,
    "blind-floodgate": 13,
    "rift-general": 4,
    "abyss-oppressor": 3,
    "blind-judge": 14,
    "first-pressure-wall": 15,
    "grimoire-warden": 10,
    "black-ink-monk": 10,
    "name-thief-inquisitor": 10,
    "living-index": 14,
    "dream-cleaver": 8,
    "sleeping-face-king": 2,
    "corridor-predator": 12,
    "nightmare-emblem": 14,
    "starlight-executioner": 8,
    "glass-zodiac": 14,
    "lunar-mutant-king": 12,
    "fallen-star-priest": 14,
    "red-oath-knight": 4,
    "throne-taxmaster": 15,
    "sealed-war-commander": 4,
    "sleeping-king-proxy": 2,
    "void-midwife": 3,
    "god-shell-warden": 7,
    "end-gatekeeper": 0,
    "closed-name-god": 3
  };

  function buildEnemyCatalog() {
    return MONSTER_ZONE_CATALOG.flatMap((zone) => zone.families.flatMap((family, familyIndex) => ENEMY_ROLES.map((role, roleIndex) => ({
      id: `${zone.id}-${family.id}-${role}`,
      name: `${family.name} ${MONSTER_ROLE_SUFFIX[role]}`,
      role,
      zone: zone.index,
      zoneId: zone.id,
      firstStage: zone.start,
      tier: family.tier || (zone.index <= 2 ? "weak" : "normal"),
      codexRarity: codexRarityForMonsterZone(zone),
      visualKeywords: family.visual,
      frame: MONSTER_FAMILY_FRAME[family.id] ?? ((zone.index - 1) * 16 + familyIndex * 4 + roleIndex) % SPRITES.enemies.frameCount,
      filter: `hue-rotate(${(zone.index * 31 + familyIndex * 19 + roleIndex * 11) % 360}deg) saturate(${(0.9 + zone.index * 0.035).toFixed(2)}) brightness(${(0.92 + roleIndex * 0.025).toFixed(2)})`,
      visualScale: (family.scale || 1) * MONSTER_ROLE_SCALE[role],
      hpMult: (family.hp || 1) * MONSTER_ROLE_HP[role]
    }))));
  }

  function bossFirstStage(zone, boss) {
    if (boss.firstStage) return boss.firstStage;
    if (boss.type === "gate") return Math.max(zone.start, Math.ceil(zone.start / 10) * 10);
    if (boss.type === "apex") return Math.max(zone.start, Math.ceil(zone.start / 100) * 100);
    return zone.start;
  }

  function buildBossCatalog() {
    return MONSTER_ZONE_CATALOG.flatMap((zone) => zone.bosses.map((boss, bossIndex) => ({
      ...boss,
      id: `boss-${zone.id}-${boss.id}`,
      zone: zone.index,
      zoneId: zone.id,
      firstStage: bossFirstStage(zone, boss),
      codexRarity: codexRarityForMonsterZone(zone),
      frame: BOSS_FRAME_BY_ID[boss.id] ?? ((zone.index - 1) * 4 + bossIndex) % SPRITES.bosses.frameCount,
      filter: `hue-rotate(${(zone.index * 37 + bossIndex * 47) % 360}deg) saturate(${(1.05 + zone.index * 0.04).toFixed(2)}) brightness(${(0.88 + bossIndex * 0.035).toFixed(2)})`,
      visualScale: boss.scale || 1.2,
      hpMult: boss.hp || 1
    })));
  }

  const ENEMY_VARIANTS = buildEnemyCatalog();
  const BOSS_VARIANTS = buildBossCatalog();
  const WEAK_ENEMY_VARIANTS = ENEMY_VARIANTS.filter((enemy) => enemy.tier === "weak");

  const WEAPON_CHAIN = [
    "녹슨 의식검",
    "감철 왕검",
    "검은 회랑검",
    "망자의 장검",
    "심연 절단검",
    "무명왕의 낫검",
    "황혼 성검",
    "파멸의 종검",
    "사도 포식검",
    "심장 없는 대검",
    "밤의 황제검",
    "이름 지워진 신검"
  ];

  const QUESTS = [
    { id: "door", name: "하수구 정화", desc: "가장 낮은 층의 잔해와 시궁쥐를 처리하는 기본 의뢰입니다.", icon: "scroll", baseCost: 2, growth: 1.58, incomeBase: 0.8, incomeGrowth: 1.22 },
    { id: "altar", name: "촛농 제단 수습", desc: "꺼진 제단을 정리해 초반 퀘스트 골드 흐름을 만듭니다.", icon: "relic", baseCost: 26, growth: 1.6, incomeBase: 5.8, incomeGrowth: 1.24 },
    { id: "library", name: "묘비명 기록", desc: "낡은 비문을 베껴 첫 환생 전 수입을 안정화합니다.", icon: "book", baseCost: 360, growth: 1.62, incomeBase: 41, incomeGrowth: 1.25 },
    { id: "grave-market", name: "검은 장부 회수", desc: "무덤 시장의 빚 장부를 찾아 중반 수입을 키웁니다.", icon: "bag", baseCost: 5400, growth: 1.64, incomeBase: 330, incomeGrowth: 1.26 },
    { id: "bell-tower", name: "종탑 봉인 보수", desc: "균열난 종탑 봉인을 고쳐 보스전 강화 재원을 마련합니다.", icon: "bell", baseCost: 81000, growth: 1.66, incomeBase: 2700, incomeGrowth: 1.27 },
    { id: "bone-mine", name: "성골 광맥 채굴", desc: "환생 이후 반복 성장에 쓰는 안정적인 고효율 의뢰입니다.", icon: "crystal", baseCost: 1200000, growth: 1.68, incomeBase: 22000, incomeGrowth: 1.28 },
    { id: "eclipse-archive", name: "일식 기록관 해독", desc: "일식 문서를 해독해 장기 방치 수익의 축을 만듭니다.", icon: "book", baseCost: 18000000, growth: 1.7, incomeBase: 180000, incomeGrowth: 1.29 },
    { id: "abyss-tax", name: "심연세 징수", desc: "심연의 통행세를 거두어 후반 숫자 성장을 여는 의뢰입니다.", icon: "diamond", baseCost: 270000000, growth: 1.72, incomeBase: 1500000, incomeGrowth: 1.3 },
    { id: "black-audit", name: "검은 회계 감사", desc: "누락된 사령세를 정산해 고층 강화 자금을 확보합니다.", icon: "coin", baseCost: 4000000000, growth: 1.74, incomeBase: 12500000, incomeGrowth: 1.31 },
    { id: "gravegate-toll", name: "망자의 관문 통행료", desc: "끝없는 관문을 지나는 혼령에게 통행료를 받습니다.", icon: "scroll", baseCost: 60000000000, growth: 1.76, incomeBase: 105000000, incomeGrowth: 1.32 },
    { id: "forbidden-appraisal", name: "금단 유물 감정", desc: "봉인된 유물을 감정해 큰 단위의 퀘스트 골드를 만듭니다.", icon: "chest", baseCost: 900000000000, growth: 1.78, incomeBase: 900000000, incomeGrowth: 1.33 },
    { id: "nameless-contract", name: "무명 계약서 작성", desc: "이름 없는 계약을 대필해 심연 귀족의 보수를 받습니다.", icon: "book", baseCost: 13500000000000, growth: 1.8, incomeBase: 7800000000, incomeGrowth: 1.34 },
    { id: "void-sermon", name: "공허 설교 대행", desc: "비어 있는 성소에서 공허 의식을 대신 집행합니다.", icon: "bell", baseCost: 200000000000000, growth: 1.82, incomeBase: 68000000000, incomeGrowth: 1.35 },
    { id: "abyss-cartography", name: "심연 지도 제작", desc: "무너진 층계를 기록해 원정대가 내는 보상금을 받습니다.", icon: "relic", baseCost: 3000000000000000, growth: 1.84, incomeBase: 600000000000, incomeGrowth: 1.36 },
    { id: "throne-bloodline", name: "왕좌 혈통 검증", desc: "오래된 왕좌의 혈통 문서를 판별해 초고층 수입을 엽니다.", icon: "crystal", baseCost: 45000000000000000, growth: 1.86, incomeBase: 5400000000000, incomeGrowth: 1.37 },
    { id: "endless-tribute", name: "끝없는 조공 징수", desc: "심연 끝자락의 조공을 모아 장기 성장의 핵심 수입을 만듭니다.", icon: "diamond", baseCost: 675000000000000000, growth: 1.88, incomeBase: 49000000000000, incomeGrowth: 1.38 }
  ];

  const TREASURES = [
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
    { id: "radiant-seal", name: "찬란한 봉인", desc: "프리미엄 소환 Epic/Legendary 확률 증가", effect: "premiumLuckPct", base: 0.012, cost: 30 },
    { id: "purifying-mask", name: "정화의 가면", desc: "심연 압박 디버프 저항 증가", effect: "debuffResistPct", base: 0.028, cost: 26 },
    { id: "weakness-sigil", name: "약점 성표", desc: "역할 상성 피해 증가", effect: "weaknessBonusPct", base: 0.026, cost: 18 },
    { id: "execution-candle", name: "처형자의 초", desc: "보스 HP가 낮을수록 마무리 피해 증가", effect: "lowHpBossDamagePct", base: 0.04, cost: 20 }
  ];

  const DEFAULT_SAVE = {
    saveSchemaVersion: 2,
    gold: 0,
    stage: 1,
    floorKill: 1,
    maxStage: 1,
    souls: 0,
    rebirths: 0,
    weaponLevel: 0,
    questLevel: 0,
    questLevels: {},
    treasures: {},
    diamondUpgrades: {
      "void-brand": 0,
      "quick-ritual": 0,
      "gold-oath": 0,
      "soul-compass": 0
    },
    consumables: {
      "battle-catalyst": 0,
      "gold-seal": 0,
      "soul-candle": 0
    },
    activeBoosts: {
      battleCatalystUntil: 0
    },
    runUpgrades: {
      attack: 0,
      attackSpeed: 0,
      bossBreak: 0,
      familiar: 0,
      greed: 0,
      chainSpell: 0,
      weaknessMark: 0,
      soulDrain: 0,
      abyssPierce: 0,
      vanguardOrder: 0,
      abyssResistance: 0
    },
    pity: {
      hero: 0,
      gear: 0
    },
    normalPity: {
      hero: 0,
      gear: 0
    },
    pulls: {
      hero: 0,
      gear: 0
    },
    normalPulls: {
      hero: 0,
      gear: 0
    },
    ownedHeroes: {},
    ownedGear: {},
    equippedHeroes: [],
    equippedGear: {
      weapon: null,
      armor: null,
      relic: null
    },
    ownedSkins: {
      base: true
    },
    activeSkin: "base",
    unlockedSkinAbyss: false,
    stats: {
      bossesKilled: 0,
      monstersKilled: 0,
      floorsCleared: 0,
      soulsEarned: 0,
      totalGoldEarned: 0,
      totalSummons: 0,
      bestPower: 0
    },
    lastSeenAt: 0
  };

  const MAX_UPGRADE_LEVEL = 99999;
  const UPGRADE_STEP_OPTIONS = [
    { value: "1", label: "+1" },
    { value: "10", label: "+10" },
    { value: "100", label: "+100" },
    { value: "max", label: "최대" }
  ];
  const GEAR_SLOT_FILTERS = [
    { value: "weapon", label: "무기" },
    { value: "armor", label: "갑옷" },
    { value: "relic", label: "유물" }
  ];
  const CODEX_KIND_FILTERS = [
    { value: "heroes", label: "동료" },
    { value: "gear", label: "장비" },
    { value: "monsters", label: "몬스터" }
  ];
  const ITEM_LEVEL_POWER_GROWTH = 0.22;
  const RESERVE_DPS_SHARE = 0.18;
  const GEAR_OPTION_LEVEL_GROWTH = 0.12;
  const GEAR_OWNED_EFFECT_BASE = 0.0015;
  const GEAR_OWNED_EFFECT_GROWTH = 0.18;
  const BASE_CRIT_CHANCE = 0.1;
  const BASE_CRIT_DAMAGE_MULT = 1.45;
  const CRIT_CHANCE_SCALE = 0.16;
  const MAX_CRIT_CHANCE = 0.55;
  const MAX_CRIT_DAMAGE_MULT = 9.99;

  function readUpgradeStepPreference() {
    try {
      return localStorage.getItem("abyss-summoner-upgrade-step") || "1";
    } catch (_error) {
      return "1";
    }
  }

  function writeUpgradeStepPreference(value) {
    try {
      localStorage.setItem("abyss-summoner-upgrade-step", value);
    } catch (_error) {
      // The selector still works for the current session.
    }
  }

  function readGearSlotFilterPreference() {
    try {
      return localStorage.getItem("abyss-summoner-gear-slot") || "weapon";
    } catch (_error) {
      return "weapon";
    }
  }

  function writeGearSlotFilterPreference(value) {
    try {
      localStorage.setItem("abyss-summoner-gear-slot", value);
    } catch (_error) {
      // The selector still works for the current session.
    }
  }

  const DEFAULT_SETTINGS = {
    bgmEnabled: false,
    sfxEnabled: true,
    bgmVolume: 1,
    sfxVolume: 1,
    damageNumbers: true,
    adviceBubble: true,
    reducedMotion: false
  };

  function normalizeVolumeSetting(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 1;
    return Math.max(0, Math.min(1, number));
  }

  function readSettingsPreference() {
    try {
      const raw = localStorage.getItem("abyss-summoner-settings");
      const settings = { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
      settings.bgmVolume = normalizeVolumeSetting(settings.bgmVolume);
      settings.sfxVolume = normalizeVolumeSetting(settings.sfxVolume);
      return settings;
    } catch (_error) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function writeSettingsPreference(settings) {
    try {
      localStorage.setItem("abyss-summoner-settings", JSON.stringify(settings));
    } catch (_error) {
      // Settings still apply for the current session.
    }
  }

  const canvas = document.getElementById("battleCanvas");
  const ctx = canvas.getContext("2d");
  const ui = document.getElementById("ui");
  const modalLayer = document.getElementById("modalLayer");
  const toastLayer = document.getElementById("toastLayer");
  const host = window.createHostAdapter();
  const battleBgImages = BATTLE_BACKGROUNDS.map((background) => ({
    ...background,
    image: loadImage(background.src)
  }));
  const summonerSpriteSheet = loadImage(ASSETS.summonerSheet);
  const companionSpriteSheet = loadImage(ASSETS.companionSheet);
  const enemySpriteSheet = loadImage(ASSETS.enemySheet);
  const bossSpriteSheet = loadImage(ASSETS.bossSheet);
  const bossMarkerSkullImage = loadImage(ASSETS.bossMarkerSkull);
  const attackBoltSpriteSheet = loadImage(ASSETS.attackBoltSheet);
  const companionProjectileSpriteSheet = loadImage(ASSETS.companionProjectileSheet);
  const hitImpactSpriteSheet = loadImage(ASSETS.hitImpactSheet);
  const catalogImageCache = new Map();
  const skinImageCache = new Map();
  const bgm = {
    tracks: null,
    sfx: null,
    currentTrack: null,
    lastBlockedAt: 0,
    sfxLastPlayed: {}
  };

  const app = {
    save: clone(DEFAULT_SAVE),
    tab: TABS.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : "weapon",
    walletBalance: 0,
    enemy: null,
    lastTick: performance.now(),
    lastRender: performance.now(),
    pendingOfflineGold: 0,
    upgradeStep: normalizeUpgradeStep(readUpgradeStepPreference()),
    gearSlotFilter: normalizeGearSlotFilter(readGearSlotFilterPreference()),
    summonView: "summon",
    codexKind: "heroes",
    settings: readSettingsPreference(),
    questGoldCarry: 0,
    lastQuestGoldRender: 0,
    lastBoostRender: 0,
    lastBoostRenderActive: false,
    panelScroll: {},
    projectiles: [],
    hitImpacts: [],
    damageTexts: [],
    fireTimers: { summoner: 0.25, heroes: {} },
    projectileSerial: 0,
    attackFlash: 0,
    enemyFlash: 0,
    speechHintIndex: 0,
    speechHintNextAt: 0,
    inputRenderGuard: false,
    deferredRender: false,
    log: ["심연의 문이 열렸습니다."]
  };

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    image.addEventListener("load", () => render());
    return image;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function battleBackgroundForStage(stage) {
    const stageNumber = Number.isFinite(stage) ? Math.max(1, Math.floor(stage)) : 1;
    let selected = battleBgImages[0];
    battleBgImages.forEach((background) => {
      if (stageNumber >= background.startStage) selected = background;
    });
    return selected || battleBgImages[0];
  }

  function fmt(value) {
    if (!Number.isFinite(value)) return "0";
    if (Math.abs(value) >= 1000) {
      const tier = Math.min(702, Math.floor(Math.log(Math.abs(value)) / Math.log(1000)));
      const scaled = value / Math.pow(1000, tier);
      const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
      return `${scaled.toFixed(decimals)}${alphaTier(tier)}`;
    }
    return Math.floor(value).toLocaleString("ko-KR");
  }

  function fmtRate(value) {
    if (!Number.isFinite(value) || value <= 0) return "0";
    if (value >= 100) return fmt(value);
    if (value >= 10) return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
    return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }

  function alphaTier(tier) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let n = tier;
    let label = "";
    while (n > 0) {
      n -= 1;
      label = letters[n % 26] + label;
      n = Math.floor(n / 26);
    }
    return label;
  }

  function pct(value) {
    return `${Math.max(0, Math.min(100, value * 100)).toFixed(1)}%`;
  }

  function rarityClass(rarity) {
    return `rarity-${rarity}`;
  }

  function roleClass(role) {
    return ROLES[role].className;
  }

  function actionText(actionId) {
    return `${ACTION_BY_ID[actionId].amount} ${currencyLabel("diamond")}`;
  }

  function diamondActionAmount(actionId) {
    return ACTION_BY_ID[actionId]?.amount || 0;
  }

  function currencyLabel(currency) {
    return {
      coin: "골드",
      soul: "영혼석",
      diamond: "다이아"
    }[currency] || currency;
  }

  function costLine(currency, amount) {
    return `
      <span class="button-cost cost-${currency}">
        <span class="button-cost-icon" aria-hidden="true"></span>
        <span class="button-cost-label">${currencyLabel(currency)}</span>
        <strong>${fmt(amount)}</strong>
      </span>
    `;
  }

  function freeLine() {
    return `<span class="button-free">무료</span>`;
  }

  function actionButton(label, currency, amount) {
    return `<span class="button-main">${label}</span>${costLine(currency, amount)}`;
  }

  const UI_ICON_VERSION = "20260627-uiicons1";
  const QUEST_UI_ICONS = {
    door: 1,
    altar: 2,
    library: 3,
    "grave-market": 4,
    "bell-tower": 5,
    "bone-mine": 6,
    "eclipse-archive": 7,
    "abyss-tax": 8,
    "black-audit": 9,
    "gravegate-toll": 10,
    "forbidden-appraisal": 11,
    "nameless-contract": 12,
    "void-sermon": 13,
    "abyss-cartography": 14,
    "throne-bloodline": 15,
    "endless-tribute": 16
  };
  const WEAPON_UI_ICONS = {
    abyssGate: 1,
    runWeapon: 2,
    attack: 3,
    attackSpeed: 4,
    bossBreak: 5,
    familiar: 6,
    greed: 7,
    chainSpell: 8,
    weaknessMark: 9,
    soulDrain: 10,
    abyssPierce: 11,
    vanguardOrder: 12,
    abyssResistance: 13
  };
  const SHOP_UI_ICONS = {
    "void-brand": 1,
    "quick-ritual": 2,
    "gold-oath": 3,
    "soul-compass": 4,
    "battle-catalyst": 5,
    "gold-seal": 6,
    "soul-candle": 7
  };

  function uiIconAsset(pack, index) {
    return `../assets/generated/ui-icons/${pack}-v1/${pack}-icon-${index}.png?v=${UI_ICON_VERSION}`;
  }

  function questUiIcon(id) {
    return QUEST_UI_ICONS[id] ? uiIconAsset("quest", QUEST_UI_ICONS[id]) : "";
  }

  function weaponUiIcon(id) {
    return WEAPON_UI_ICONS[id] ? uiIconAsset("weapon", WEAPON_UI_ICONS[id]) : "";
  }

  function shopUiIcon(id) {
    return SHOP_UI_ICONS[id] ? uiIconAsset("shop", SHOP_UI_ICONS[id]) : "";
  }

  function catalogAsset(kind, id) {
    return `../assets/generated/catalog/${kind}/${id}.png`;
  }

  function catalogFallbackIcon(kind, id) {
    if (kind === "gear") {
      const gear = getData("gear", id);
      if (gear?.slot === "weapon") return "sword";
      if (gear?.slot === "armor") return "chest";
      if (gear?.slot === "relic") return "relic";
    }
    if (kind === "treasures") return treasureIcon(id);
    if (kind === "heroes") return "bell";
    return "relic";
  }

  function catalogFallbackAsset(kind, id) {
    return `../assets/generated/icons/${catalogFallbackIcon(kind, id)}.png?v=20260627-iconforge2`;
  }

  function catalogImgTag(kind, id, alt = "") {
    const fallback = catalogFallbackAsset(kind, id);
    return `<img src="${catalogAsset(kind, id)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'" />`;
  }

  function spriteFrameStyle(src, spec, frame, filter = "none", locked = false) {
    const safeFrame = ((Math.floor(Number(frame) || 0) % spec.frameCount) + spec.frameCount) % spec.frameCount;
    const col = safeFrame % spec.cols;
    const row = Math.floor(safeFrame / spec.cols);
    const posX = spec.cols <= 1 ? 0 : (col / (spec.cols - 1)) * 100;
    const posY = spec.rows <= 1 ? 0 : (row / (spec.rows - 1)) * 100;
    const spriteFilter = filter && filter !== "none" ? filter : "";
    const finalFilter = locked
      ? "grayscale(1) brightness(0.34) opacity(0.78) drop-shadow(0 3px 0 rgba(0, 0, 0, 0.72))"
      : `${spriteFilter} drop-shadow(0 3px 0 rgba(0, 0, 0, 0.72))`.trim();
    return [
      `background-image:url(${src})`,
      `background-size:${spec.cols * 100}% ${spec.rows * 100}%`,
      `background-position:${posX.toFixed(4)}% ${posY.toFixed(4)}%`,
      finalFilter ? `filter:${finalFilter}` : ""
    ].filter(Boolean).join(";");
  }

  function monsterSpriteData(monster, type) {
    const boss = type === "boss";
    return {
      src: boss ? ASSETS.bossSheet : ASSETS.enemySheet,
      spec: boss ? SPRITES.bosses : SPRITES.enemies,
      frame: monster.frame ?? 0,
      filter: monster.filter || "none"
    };
  }

  function codexMonsterSpriteTag(sprite, locked) {
    return `<span class="codex-monster-sprite" style="${escapeHtml(spriteFrameStyle(sprite.src, sprite.spec, sprite.frame, sprite.filter, locked))}" aria-hidden="true"></span>`;
  }

  function catalogImage(kind, id) {
    const src = catalogAsset(kind, id);
    let image = catalogImageCache.get(src);
    if (!image) {
      image = loadImage(src);
      catalogImageCache.set(src, image);
    }
    return image;
  }

  function skinImage(skin) {
    if (!skin?.art) return null;
    let image = skinImageCache.get(skin.art);
    if (!image) {
      image = loadImage(skin.art);
      skinImageCache.set(skin.art, image);
    }
    return image;
  }

  function skinIdleSheet(skin) {
    if (!skin?.idleSheet) return null;
    let image = skinImageCache.get(skin.idleSheet);
    if (!image) {
      image = loadImage(skin.idleSheet);
      skinImageCache.set(skin.idleSheet, image);
    }
    return image;
  }

  function pushLog(message) {
    app.log.unshift(message);
    app.log = app.log.slice(0, 5);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastLayer.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function ensureSaveShape(save) {
    const next = { ...clone(DEFAULT_SAVE), ...save };
    const incomingSchema = Number(save.saveSchemaVersion) || 1;
    const legacyKeys = Number(save.keys) || 0;
    const legacyKeysEarned = Number(save.stats?.keysEarned) || 0;
    const legacySouls = Number(save.souls) || 0;
    const savedSoulsEarned = Number(save.stats?.soulsEarned) || 0;
    next.runUpgrades = { ...DEFAULT_SAVE.runUpgrades, ...(save.runUpgrades || {}) };
    if (!next.runUpgrades.bossBreak && save.runUpgrades?.vitality) {
      next.runUpgrades.bossBreak = Number(save.runUpgrades.vitality) || 0;
    }
    delete next.runUpgrades.vitality;
    next.pity = { ...DEFAULT_SAVE.pity, ...(save.pity || {}) };
    next.normalPity = { ...DEFAULT_SAVE.normalPity, ...(save.normalPity || {}) };
    next.pulls = { ...DEFAULT_SAVE.pulls, ...(save.pulls || {}) };
    next.normalPulls = { ...DEFAULT_SAVE.normalPulls, ...(save.normalPulls || {}) };
    next.equippedGear = { ...DEFAULT_SAVE.equippedGear, ...(save.equippedGear || {}) };
    next.stats = { ...DEFAULT_SAVE.stats, ...(save.stats || {}) };
    next.treasures = { ...DEFAULT_SAVE.treasures, ...(save.treasures || {}) };
    next.diamondUpgrades = { ...DEFAULT_SAVE.diamondUpgrades, ...(save.diamondUpgrades || {}) };
    next.consumables = { ...DEFAULT_SAVE.consumables, ...(save.consumables || {}) };
    next.activeBoosts = { ...DEFAULT_SAVE.activeBoosts, ...(save.activeBoosts || {}) };
    next.questLevels = { ...DEFAULT_SAVE.questLevels, ...(save.questLevels || {}) };
    next.ownedHeroes = save.ownedHeroes || {};
    next.ownedGear = save.ownedGear || {};
    normalizeOwnedCollection("hero", next.ownedHeroes);
    normalizeOwnedCollection("gear", next.ownedGear);
    next.ownedSkins = { ...DEFAULT_SAVE.ownedSkins, ...(save.ownedSkins || {}) };
    if (save.unlockedSkinAbyss) next.ownedSkins.abyss = true;
    SKINS.forEach((skin) => {
      next.ownedSkins[skin.id] = skin.id === "base" || Boolean(next.ownedSkins[skin.id]);
    });
    next.activeSkin = SKINS.some((skin) => skin.id === save.activeSkin && next.ownedSkins[skin.id]) ? save.activeSkin : "base";
    next.unlockedSkinAbyss = Boolean(next.ownedSkins.abyss);
    next.equippedHeroes = Array.isArray(save.equippedHeroes) ? save.equippedHeroes : [];
    DIAMOND_UPGRADES.forEach((upgrade) => {
      next.diamondUpgrades[upgrade.id] = Math.max(0, Math.min(upgrade.max, Number(next.diamondUpgrades[upgrade.id]) || 0));
    });
    CONSUMABLES.forEach((item) => {
      next.consumables[item.id] = Math.max(0, Math.floor(Number(next.consumables[item.id]) || 0));
    });
    next.activeBoosts.battleCatalystUntil = Math.max(0, Number(next.activeBoosts.battleCatalystUntil) || 0);
    next.floorKill = Math.min(MONSTERS_PER_FLOOR, Math.max(1, Number(next.floorKill) || 1));
    next.souls = Number(next.souls) || 0;
    if (incomingSchema < 2) {
      next.souls += legacyKeys;
      next.stats.soulsEarned = Math.max(savedSoulsEarned, legacySouls + legacyKeysEarned, legacySouls + legacyKeys);
    } else {
      next.stats.soulsEarned = Math.max(savedSoulsEarned, next.souls);
    }
    delete next.keys;
    delete next.stats.keysEarned;
    next.saveSchemaVersion = 2;
    next.weaponLevel = Number(next.weaponLevel) || 0;
    next.questLevel = Number(next.questLevel) || 0;
    delete next.bossTickets;
    return next;
  }

  function grantStarterRoster() {
    if (Object.keys(app.save.ownedHeroes).length === 0) {
      ["iron-page", "grave-archer", "candle-nun"].forEach((id) => addOwned("hero", id, true));
      app.save.equippedHeroes = ["iron-page", "grave-archer", "candle-nun"];
    }
    if (Object.keys(app.save.ownedGear).length === 0) {
      ["rusted-knife", "pilgrim-coat", "cracked-sigil"].forEach((id) => addOwned("gear", id, true));
      app.save.equippedGear = {
        weapon: "rusted-knife",
        armor: "pilgrim-coat",
        relic: "cracked-sigil"
      };
    }
  }

  function getData(kind, id) {
    return (kind === "hero" ? HEROES : GEARS).find((item) => item.id === id);
  }

  function getOwned(kind, id) {
    return kind === "hero" ? app.save.ownedHeroes[id] : app.save.ownedGear[id];
  }

  function setOwned(kind, id, value) {
    if (kind === "hero") app.save.ownedHeroes[id] = value;
    else app.save.ownedGear[id] = value;
  }

  function addOwned(kind, id, silent) {
    const data = getData(kind, id);
    const owned = getOwned(kind, id);
    const shardGain = RARITIES[data.rarity].shard;
    if (!owned) {
      setOwned(kind, id, { id, level: 1, shards: 0 });
      if (!silent) pushLog(`${data.name} 획득`);
      return { id, duplicate: false, levelUp: false, shardGain: 0 };
    }
    owned.shards += shardGain;
    const need = shardNeed(data.rarity, owned.level);
    let levelUp = false;
    if (owned.shards >= need) {
      owned.shards -= need;
      owned.level += 1;
      levelUp = true;
    }
    if (!silent) {
      pushLog(levelUp ? `${data.name} 승급 Lv.${owned.level}` : `${data.name} 조각 획득`);
    }
    return { id, duplicate: true, levelUp, shardGain };
  }

  function shardNeed(rarity, level) {
    const rarityScale = { common: 3, rare: 4, epic: 5, legendary: 6 }[rarity] || 3;
    return rarityScale + Math.floor(Math.max(1, level) * 1.5);
  }

  function shardProgressText(data, owned) {
    return `승급 조각 ${owned.shards}/${shardNeed(data.rarity, owned.level)}`;
  }

  function normalizeOwnedCollection(kind, collection) {
    Object.entries(collection || {}).forEach(([id, owned]) => {
      const data = getData(kind, id);
      if (!data || !owned) {
        delete collection[id];
        return;
      }
      let level = Math.max(1, Math.floor(Number(owned.level) || 1));
      let shards = Math.max(0, Math.floor(Number(owned.shards) || 0));
      let guard = 0;
      while (shards >= shardNeed(data.rarity, level) && guard < 1000) {
        shards -= shardNeed(data.rarity, level);
        level += 1;
        guard += 1;
      }
      collection[id] = { ...owned, id, level, shards };
    });
  }

  function itemPower(kind, id) {
    if (!id) return 0;
    const data = getData(kind, id);
    const owned = getOwned(kind, id);
    if (!data || !owned) return 0;
    return itemPowerAtLevel(kind, id, owned.level);
  }

  function itemPowerAtLevel(kind, id, level) {
    const data = getData(kind, id);
    if (!data) return 0;
    const safeLevel = Math.max(1, Number(level) || 1);
    return Math.floor(data.base * RARITIES[data.rarity].mult * (1 + (safeLevel - 1) * ITEM_LEVEL_POWER_GROWTH));
  }

  function itemPowerGainNextLevel(kind, id) {
    const owned = getOwned(kind, id);
    if (!owned) return 0;
    return Math.max(0, itemPowerAtLevel(kind, id, owned.level + 1) - itemPowerAtLevel(kind, id, owned.level));
  }

  function gearEffectValue(id, effect) {
    const gear = getData("gear", id);
    const owned = getOwned("gear", id);
    if (!gear || !owned || gear.effect !== effect) return 0;
    return gearEffectValueAtLevel(id, effect, owned.level);
  }

  function gearEffectValueAtLevel(id, effect, level) {
    const gear = getData("gear", id);
    if (!gear || gear.effect !== effect) return 0;
    const safeLevel = Math.max(1, Number(level) || 1);
    return (gear.effectBase || 0) * (1 + (safeLevel - 1) * GEAR_OPTION_LEVEL_GROWTH);
  }

  function equippedGearEffect(effect) {
    return Object.values(app.save.equippedGear).reduce((sum, id) => sum + gearEffectValue(id, effect), 0);
  }

  function gearEquipScore(id) {
    const gear = getData("gear", id);
    const power = itemPower("gear", id);
    const weights = {
      attackPct: 1300,
      attackSpeedPct: 1600,
      bossDamagePct: 1450,
      projectileChancePct: 1500,
      ownedEffectPct: 1050,
      questGoldPct: 720,
      goldPct: 820,
      soulPct: 980,
      bossSoulPct: 980,
      rebirthSoulPct: 980,
      reserveDpsPct: 1180,
      debuffResistPct: 1200,
      weaknessBonusPct: 1250,
      lowHpBossDamagePct: 1300,
      normalSummonDiscountPct: 820
    };
    return power + gearEffectValue(id, gear?.effect) * (weights[gear?.effect] || 0);
  }

  function gearOptionText(gear, owned) {
    if (!gear.effect) return "기본 전투력 증가";
    const labels = {
      attackPct: "전체 피해",
      attackSpeedPct: "공격속도",
      bossDamagePct: "보스 피해",
      projectileChancePct: "추가 투사체",
      ownedEffectPct: "보유 효과",
      questGoldPct: "퀘스트 골드",
      goldPct: "골드 획득",
      soulPct: "보스 영혼석",
      bossSoulPct: "보스 영혼석",
      rebirthSoulPct: "환생 영혼석",
      reserveDpsPct: "예비대 DPS",
      debuffResistPct: "압박 저항",
      weaknessBonusPct: "상성 피해",
      lowHpBossDamagePct: "마무리 보스 피해",
      normalSummonDiscountPct: "일반 소환 비용"
    };
    if (gear.effect === "normalSummonDiscountPct") return `${labels[gear.effect]} -${pct(gearEffectValueAtLevel(gear.id, gear.effect, owned.level))}`;
    if (labels[gear.effect]) return `${labels[gear.effect]} +${pct(gearEffectValueAtLevel(gear.id, gear.effect, owned.level))}`;
    return "기본 전투력 증가";
  }

  function heroGrowthLines(id, isEquipped) {
    const currentPower = itemPower("hero", id);
    const nextPowerGain = itemPowerGainNextLevel("hero", id);
    if (isEquipped) {
      return `
        <div class="growth-lines">
          <span>Lv+1 전투력 +${fmt(nextPowerGain)} (+${pct(ITEM_LEVEL_POWER_GROWTH)})</span>
          <span>편성 중: 전투력 100%가 전투에 적용</span>
        </div>
      `;
    }
    return `
      <div class="growth-lines">
        <span>예비대 DPS ${fmtRate(currentPower * RESERVE_DPS_SHARE)}</span>
        <span>Lv+1 예비대 DPS +${fmtRate(nextPowerGain * RESERVE_DPS_SHARE)} (전투력의 ${pct(RESERVE_DPS_SHARE)})</span>
      </div>
    `;
  }

  function gearGrowthLines(id) {
    const gear = getData("gear", id);
    const owned = getOwned("gear", id);
    const nextPowerGain = itemPowerGainNextLevel("gear", id);
    const optionLine = gear.effect === "attackSpeedPct"
      ? `특수 옵션 Lv+1 +${pct(gearEffectValueAtLevel(id, "attackSpeedPct", owned.level + 1) - gearEffectValueAtLevel(id, "attackSpeedPct", owned.level))}`
      : "장착 효과: 장비 전투력만 상승";
    return `
      <div class="growth-lines">
        <span>Lv+1 장비 전투력 +${fmt(nextPowerGain)} (+${pct(ITEM_LEVEL_POWER_GROWTH)})</span>
        <span>${optionLine}</span>
      </div>
    `;
  }

  function heroGrowthEffectLines(id) {
    const hero = getData("hero", id);
    const owned = getOwned("hero", id);
    const nextPowerGain = itemPowerGainNextLevel("hero", id);
    return `
      <div class="growth-lines">
        <span>Lv+1 편성 효과: 전투력 +${fmt(nextPowerGain)}</span>
        <span>Lv+1 보유 효과: ${heroOwnedGrowthText(hero, owned.level)}</span>
      </div>
    `;
  }

  function gearGrowthEffectLines(id) {
    const gear = getData("gear", id);
    const owned = getOwned("gear", id);
    const nextPowerGain = itemPowerGainNextLevel("gear", id);
    const optionGain = gear.effect
      ? gearEffectValueAtLevel(id, gear.effect, owned.level + 1) - gearEffectValueAtLevel(id, gear.effect, owned.level)
      : 0;
    const optionLabel = {
      attackPct: "전체 피해",
      attackSpeedPct: "공격속도",
      bossDamagePct: "보스 피해",
      projectileChancePct: "추가 투사체",
      ownedEffectPct: "보유 효과",
      questGoldPct: "퀘스트 골드",
      goldPct: "골드 획득",
      soulPct: "보스 영혼석",
      bossSoulPct: "보스 영혼석",
      rebirthSoulPct: "환생 영혼석",
      reserveDpsPct: "예비대 DPS",
      debuffResistPct: "압박 저항",
      weaknessBonusPct: "상성 피해",
      lowHpBossDamagePct: "마무리 보스 피해",
      normalSummonDiscountPct: "일반 소환 비용"
    }[gear.effect] || "특수 옵션";
    const optionLine = optionGain > 0
      ? `, ${optionLabel} ${gear.effect === "normalSummonDiscountPct" ? "-" : "+"}${pct(optionGain)}`
      : "";
    return `
      <div class="growth-lines">
        <span>Lv+1 장착 효과: 전투력 +${fmt(nextPowerGain)}${optionLine}</span>
        <span>Lv+1 보유 효과: ${gearOwnedGrowthText(gear, owned.level)}</span>
      </div>
    `;
  }

  function ownedHeroEntries() {
    return Object.keys(app.save.ownedHeroes)
      .map((id) => {
        const data = getData("hero", id);
        const owned = getOwned("hero", id);
        if (!data || !owned) return null;
        return { id, data, owned, power: itemPower("hero", id) };
      })
      .filter(Boolean);
  }

  function equippedHeroes() {
    return app.save.equippedHeroes.map((id) => getData("hero", id)).filter(Boolean);
  }

  function roleCounts() {
    const counts = { tank: 0, dps: 0, support: 0, curse: 0 };
    equippedHeroes().forEach((hero) => {
      counts[hero.role] += 1;
    });
    return counts;
  }

  function heroInfluence(data, owned) {
    return Math.sqrt(RARITIES[data.rarity].mult) * Math.sqrt(Math.max(1, owned.level));
  }

  function heroInfluenceAtLevel(data, level) {
    return Math.sqrt(RARITIES[data.rarity].mult) * Math.sqrt(Math.max(1, level));
  }

  function heroOwnedAttackContribution(level) {
    return 0.01 + Math.max(0, level - 1) * 0.004;
  }

  function heroRoleOwnedContribution(data, level) {
    const influence = heroInfluenceAtLevel(data, level);
    const config = {
      tank: { label: "탱커 보스피해", value: influence * 0.014 },
      dps: { label: "딜러 피해", value: influence * 0.012 },
      support: { label: "지원 골드", value: influence * 0.014 },
      curse: { label: "저주 보스피해", value: influence * 0.015 }
    }[data.role];
    return config || { label: "공명", value: 0 };
  }

  function heroOwnedEffectText(data, level) {
    const role = heroRoleOwnedContribution(data, level);
    return `전체 공격 +${pct(heroOwnedAttackContribution(level))}, ${role.label} +${pct(role.value)}`;
  }

  function heroOwnedGrowthText(data, level) {
    const currentRole = heroRoleOwnedContribution(data, level);
    const nextRole = heroRoleOwnedContribution(data, level + 1);
    return `전체 공격 +${pct(0.004)}, ${currentRole.label} +${pct(Math.max(0, nextRole.value - currentRole.value))}`;
  }

  function gearOwnedEffectConfig(slot) {
    return {
      weapon: { effect: "attackPct", label: "전체 공격" },
      armor: { effect: "bossDamagePct", label: "보스 피해" },
      relic: { effect: "goldPct", label: "골드 획득" }
    }[slot] || { effect: "attackPct", label: "전체 공격" };
  }

  function gearOwnedEffectValueAtLevel(gear, level) {
    const safeLevel = Math.max(1, Number(level) || 1);
    return GEAR_OWNED_EFFECT_BASE * Math.sqrt(RARITIES[gear.rarity].mult) * (1 + (safeLevel - 1) * GEAR_OWNED_EFFECT_GROWTH);
  }

  function gearOwnedEffectText(gear, level) {
    const config = gearOwnedEffectConfig(gear.slot);
    return `${config.label} +${pct(gearOwnedEffectValueAtLevel(gear, level))}`;
  }

  function gearOwnedGrowthText(gear, level) {
    const config = gearOwnedEffectConfig(gear.slot);
    const gain = gearOwnedEffectValueAtLevel(gear, level + 1) - gearOwnedEffectValueAtLevel(gear, level);
    return `${config.label} +${pct(gain)}`;
  }

  function gearCollectionSummary(ownedEffectBoost = 0) {
    const effects = { attackPct: 0, bossDamagePct: 0, goldPct: 0 };
    const mult = 1 + ownedEffectBoost;
    Object.entries(app.save.ownedGear || {}).forEach(([id, owned]) => {
      const gear = getData("gear", id);
      if (!gear || !owned) return;
      const config = gearOwnedEffectConfig(gear.slot);
      effects[config.effect] += gearOwnedEffectValueAtLevel(gear, owned.level) * mult;
    });
    effects.attackPct = Math.min(0.35, effects.attackPct);
    effects.bossDamagePct = Math.min(0.35, effects.bossDamagePct);
    effects.goldPct = Math.min(0.45, effects.goldPct);
    return effects;
  }

  function heroRosterSummary(ownedEffectBoost = 0, reserveBoost = 0) {
    const equipped = new Set(app.save.equippedHeroes.filter(Boolean));
    const roleInfluence = { tank: 0, dps: 0, support: 0, curse: 0 };
    const ownedRoleCounts = { tank: 0, dps: 0, support: 0, curse: 0 };
    const rarityCounts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let rosterPower = 0;
    let reservePower = 0;
    let totalLevels = 0;
    let duplicateLevels = 0;
    const ownedEffectMult = 1 + ownedEffectBoost;

    ownedHeroEntries().forEach(({ id, data, owned, power }) => {
      const level = Math.max(1, owned.level || 1);
      rosterPower += power;
      totalLevels += level;
      duplicateLevels += Math.max(0, level - 1);
      ownedRoleCounts[data.role] += 1;
      rarityCounts[data.rarity] += 1;
      roleInfluence[data.role] += heroInfluence(data, owned) * ownedEffectMult;
      if (!equipped.has(id)) {
        reservePower += power;
      }
    });

    const uniqueCount = Object.keys(app.save.ownedHeroes).length;
    const roleResonance = {
      tank: ownedRoleCounts.tank >= 3 ? 0.06 + (ownedRoleCounts.tank - 3) * 0.012 : 0,
      dps: ownedRoleCounts.dps >= 3 ? 0.05 + (ownedRoleCounts.dps - 3) * 0.01 : 0,
      support: ownedRoleCounts.support >= 3 ? 0.05 + (ownedRoleCounts.support - 3) * 0.01 : 0,
      curse: ownedRoleCounts.curse >= 3 ? 0.05 + (ownedRoleCounts.curse - 3) * 0.01 : 0
    };
    const rarityBonus = Math.min(0.35, rarityCounts.rare * 0.004 + rarityCounts.epic * 0.012 + rarityCounts.legendary * 0.028);
    const reserveShare = Math.min(0.75, RESERVE_DPS_SHARE + reserveBoost);
    return {
      uniqueCount,
      totalLevels,
      duplicateLevels,
      rosterPower,
      reservePower,
      reserveShare,
      reserveDps: reservePower * reserveShare,
      attackPct: Math.min(1.45, (uniqueCount * 0.01 + duplicateLevels * 0.004) * ownedEffectMult + rarityBonus),
      tankBossPct: Math.min(0.65, roleInfluence.tank * 0.014 + roleResonance.tank),
      dpsPct: Math.min(0.6, roleInfluence.dps * 0.012 + roleResonance.dps),
      goldPct: Math.min(0.75, roleInfluence.support * 0.014 + roleResonance.support),
      bossDamagePct: Math.min(0.7, roleInfluence.curse * 0.015 + roleResonance.curse),
      roleInfluence,
      ownedRoleCounts,
      rarityCounts,
      roleResonance,
      rarityBonus
    };
  }

  function treasureLevel(id) {
    return app.save.treasures[id] || 0;
  }

  function treasureEffects() {
    const effects = {
      attackPct: 0,
      critPct: 0,
      attackSpeedPct: 0,
      questGoldPct: 0,
      killGoldPct: 0,
      familiarPct: 0,
      bossDamagePct: 0,
      bossRewardPct: 0,
      weaponPct: 0,
      soulPct: 0,
      bossSoulPct: 0,
      reserveDpsPct: 0,
      ownedEffectPct: 0,
      rebirthSoulPct: 0,
      normalSummonDiscountPct: 0,
      premiumLuckPct: 0,
      debuffResistPct: 0,
      weaknessBonusPct: 0,
      lowHpBossDamagePct: 0
    };
    TREASURES.forEach((treasure) => {
      const level = treasureLevel(treasure.id);
      if (level > 0) {
        effects[treasure.effect] += treasure.base * level;
      }
    });
    effects.attackSpeedPct = Math.min(0.85, effects.attackSpeedPct);
    effects.reserveDpsPct = Math.min(0.6, effects.reserveDpsPct);
    effects.ownedEffectPct = Math.min(0.7, effects.ownedEffectPct);
    effects.normalSummonDiscountPct = Math.min(0.65, effects.normalSummonDiscountPct);
    effects.premiumLuckPct = Math.min(0.18, effects.premiumLuckPct);
    effects.rebirthSoulPct = Math.min(1.2, effects.rebirthSoulPct);
    effects.bossRewardPct = Math.min(0.8, effects.bossRewardPct);
    effects.debuffResistPct = Math.min(0.65, effects.debuffResistPct);
    effects.weaknessBonusPct = Math.min(0.5, effects.weaknessBonusPct);
    effects.lowHpBossDamagePct = Math.min(1.1, effects.lowHpBossDamagePct);
    return effects;
  }

  function weaponUpgradeEffects() {
    const upgrades = app.save.runUpgrades;
    return {
      projectileChancePct: Math.min(0.45, upgrades.chainSpell * 0.004),
      weaknessBonusPct: Math.min(0.6, upgrades.weaknessMark * 0.006),
      soulPct: Math.min(0.9, upgrades.soulDrain * 0.012),
      highHpBossDamagePct: Math.min(1.1, upgrades.abyssPierce * 0.018),
      vanguardPct: Math.min(0.8, upgrades.vanguardOrder * 0.01),
      debuffResistPct: Math.min(0.55, upgrades.abyssResistance * 0.008)
    };
  }

  function criticalProfile(critPct = 0) {
    const bonus = Math.max(0, Number(critPct) || 0);
    const critChancePct = bonus > 0
      ? Math.min(MAX_CRIT_CHANCE, BASE_CRIT_CHANCE + Math.sqrt(bonus) * CRIT_CHANCE_SCALE)
      : BASE_CRIT_CHANCE;
    const idealCritDamageMult = bonus > 0
      ? 1 + bonus / Math.max(0.01, critChancePct)
      : BASE_CRIT_DAMAGE_MULT;
    const critDamageMult = Math.min(MAX_CRIT_DAMAGE_MULT, Math.max(BASE_CRIT_DAMAGE_MULT, idealCritDamageMult));
    const critAverageMult = 1 + critChancePct * (critDamageMult - 1);
    return { critChancePct, critDamageMult, critAverageMult };
  }

  function diamondUpgradeLevel(id) {
    return Math.max(0, Number(app.save.diamondUpgrades[id]) || 0);
  }

  function consumableCount(id) {
    return Math.max(0, Math.floor(Number(app.save.consumables[id]) || 0));
  }

  function skinData(id) {
    return SKINS.find((skin) => skin.id === id) || SKINS[0];
  }

  function ownsSkin(id) {
    return id === "base" || Boolean(app.save.ownedSkins?.[id]);
  }

  function activeSkin() {
    return ownsSkin(app.save.activeSkin) ? skinData(app.save.activeSkin) : SKINS[0];
  }

  function skinEffects() {
    const effects = {
      attackPct: 0,
      attackSpeedPct: 0,
      goldPct: 0,
      soulPct: 0,
      bossDamagePct: 0
    };
    SKINS.forEach((skin) => {
      if (!ownsSkin(skin.id)) return;
      Object.entries(skin.effects || {}).forEach(([key, value]) => {
        effects[key] = (effects[key] || 0) + value;
      });
    });
    return effects;
  }

  function skinEffectText(skin) {
    const labels = {
      attackPct: "전체 피해",
      attackSpeedPct: "공속",
      goldPct: "골드",
      soulPct: "영혼석",
      bossDamagePct: "보스 피해"
    };
    const entries = Object.entries(skin.effects || {});
    if (entries.length === 0) return "보유 효과 없음";
    return entries.map(([key, value]) => `${labels[key]} +${pct(value)}`).join(" / ");
  }

  function skinSetEffectText() {
    const effects = skinEffects();
    const parts = [
      effects.attackPct > 0 ? `피해 +${pct(effects.attackPct)}` : "",
      effects.bossDamagePct > 0 ? `보스 +${pct(effects.bossDamagePct)}` : "",
      effects.attackSpeedPct > 0 ? `공속 +${pct(effects.attackSpeedPct)}` : "",
      effects.goldPct > 0 ? `골드 +${pct(effects.goldPct)}` : "",
      effects.soulPct > 0 ? `영혼석 +${pct(effects.soulPct)}` : ""
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "아직 보유 효과 없음";
  }

  function diamondUpgradeEffects() {
    const effects = {
      attackPct: 0,
      attackSpeedPct: 0,
      goldPct: 0,
      soulPct: 0
    };
    DIAMOND_UPGRADES.forEach((upgrade) => {
      const level = diamondUpgradeLevel(upgrade.id);
      if (level > 0) {
        effects[upgrade.effect] += upgrade.base * level;
      }
    });
    return effects;
  }

  function activeBoostEffects(now = Date.now()) {
    const until = Number(app.save.activeBoosts.battleCatalystUntil) || 0;
    const remaining = Math.max(0, Math.ceil((until - now) / 1000));
    const active = remaining > 0;
    return {
      battleCatalystActive: active,
      battleCatalystRemaining: remaining,
      attackPct: active ? 0.2 : 0,
      attackSpeedPct: active ? 0.2 : 0
    };
  }

  function enemyDebuffEffects(enemy = app.enemy, stats = null) {
    if (!enemy) return { damageCutPct: 0, label: "" };
    const stage = Number(enemy.stage) || app.save.stage;
    const pressurePhase = Math.max(0, Math.min(1, (stage - 1000) / 1500));
    const stagePressure = Math.max(0, stage - 1000) * 0.00018;
    const rolePressureBase = {
      tank: 0.025,
      dps: 0.035,
      support: 0.02,
      curse: 0.04
    }[enemy.role] || 0.02;
    const rolePressure = rolePressureBase * pressurePhase;
    const bossPressure = enemy.boss ? 0.04 * pressurePhase : 0;
    const apexPressure = enemy.apexBoss ? 0.06 * pressurePhase : 0;
    const rawDamageCutPct = Math.min(0.46, stagePressure + rolePressure + bossPressure + apexPressure);
    const resistPct = Math.min(0.75, Math.max(0, stats?.debuffResistPct ?? calcStats().debuffResistPct ?? 0));
    const damageCutPct = rawDamageCutPct * (1 - resistPct);
    const label = enemy.role === "curse" ? "저주 압박" : enemy.boss ? "보스 위압" : "심연 압박";
    return { damageCutPct, rawDamageCutPct, resistPct, label };
  }

  function damageAfterEnemyDebuff(damage, enemy = app.enemy, stats = null) {
    const debuff = enemyDebuffEffects(enemy, stats);
    return damage * Math.max(0.38, 1 - debuff.damageCutPct);
  }

  function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;
    if (minutes <= 0) return `${rest}초`;
    return `${minutes}분 ${String(rest).padStart(2, "0")}초`;
  }

  function weaponName() {
    return WEAPON_CHAIN[Math.min(WEAPON_CHAIN.length - 1, Math.floor(app.save.weaponLevel / 10))];
  }

  function weaponPowerAtLevel(level) {
    if (level <= 0) return 0;
    return Math.floor(28 * Math.pow(1.1, level - 1) + level * 4);
  }

  function weaponPower() {
    return weaponPowerAtLevel(app.save.weaponLevel);
  }

  function questLevel(id) {
    return app.save.questLevels[id] || 0;
  }

  function totalQuestLevel() {
    return QUESTS.reduce((sum, quest) => sum + questLevel(quest.id), app.save.questLevel || 0);
  }

  function questBaseGoldPerSecondAtLevel(quest, level) {
    if (level <= 0) return 0;
    const growth = quest.incomeGrowth || 1.24;
    return quest.incomeBase * (Math.pow(growth, level) - 1) / (growth - 1);
  }

  function questBaseGoldPerSecond(quest) {
    return questBaseGoldPerSecondAtLevel(quest, questLevel(quest.id));
  }

  function questIncomeMultiplier() {
    const upgrades = app.save.runUpgrades;
    const role = roleCounts();
    const treasures = treasureEffects();
    const roster = heroRosterSummary(treasures.ownedEffectPct, treasures.reserveDpsPct + equippedGearEffect("reserveDpsPct"));
    const diamond = diamondUpgradeEffects();
    return (1 + upgrades.greed * 0.08 + role.support * 0.1 + roster.goldPct + diamond.goldPct + equippedGearEffect("goldPct")) * (1 + treasures.questGoldPct + equippedGearEffect("questGoldPct"));
  }

  function questGoldPerSecondFor(quest) {
    return questBaseGoldPerSecond(quest) * questIncomeMultiplier();
  }

  function questGoldPerSecond() {
    return QUESTS.reduce((sum, quest) => sum + questBaseGoldPerSecond(quest), 0) * questIncomeMultiplier();
  }

  function questNextGoldPerSecond(quest) {
    const level = questLevel(quest.id);
    return quest.incomeBase * Math.pow(quest.incomeGrowth || 1.24, level) * questIncomeMultiplier();
  }

  function questGoldGainForLevels(quest, levels) {
    if (levels <= 0) return 0;
    const level = questLevel(quest.id);
    const current = questBaseGoldPerSecondAtLevel(quest, level);
    const next = questBaseGoldPerSecondAtLevel(quest, level + levels);
    return (next - current) * questIncomeMultiplier();
  }

  function calcStats() {
    const upgrades = app.save.runUpgrades;
    const souls = Math.max(Number(app.save.stats.soulsEarned) || 0, Number(app.save.souls) || 0);
    const role = roleCounts();
    const heroPower = app.save.equippedHeroes.reduce((sum, id) => sum + itemPower("hero", id), 0);
    const gearPower = Object.values(app.save.equippedGear).reduce((sum, id) => sum + itemPower("gear", id), 0);
    const treasures = treasureEffects();
    const weaponEffects = weaponUpgradeEffects();
    const gearOwnedBoost = treasures.ownedEffectPct + equippedGearEffect("ownedEffectPct");
    const gearCollection = gearCollectionSummary(gearOwnedBoost);
    const reserveBoost = treasures.reserveDpsPct + equippedGearEffect("reserveDpsPct");
    const roster = heroRosterSummary(treasures.ownedEffectPct, reserveBoost);
    const diamond = diamondUpgradeEffects();
    const skin = skinEffects();
    const activeBoost = activeBoostEffects();
    const soulMult = (1 + souls * 0.028) * (1 + treasures.soulPct);
    const weaponBase = weaponPower() * (1 + treasures.weaponPct);
    const premiumDamagePct = diamond.attackPct + skin.attackPct + activeBoost.attackPct + equippedGearEffect("attackPct");
    const attackBase = (20 + weaponBase) * Math.pow(1.11, upgrades.attack) * soulMult * (1 + treasures.attackPct + roster.attackPct + gearCollection.attackPct + premiumDamagePct);
    const familiarBase = (heroPower * (1 + treasures.familiarPct + weaponEffects.vanguardPct) + roster.reserveDps + upgrades.familiar * 14) * (1 + role.dps * 0.12 + roster.dpsPct + premiumDamagePct);
    const gearBase = gearPower * 0.72;
    const critical = criticalProfile(treasures.critPct);
    const attackSpeedMult = Math.min(3.25, 1 + upgrades.attackSpeed * 0.018 + treasures.attackSpeedPct + equippedGearEffect("attackSpeedPct") + diamond.attackSpeedPct + skin.attackSpeedPct + activeBoost.attackSpeedPct);
    const summonerBaseDps = Math.max(1, (attackBase + gearBase) * attackSpeedMult);
    const familiarBaseDps = Math.max(0, familiarBase * attackSpeedMult);
    const summonerDps = summonerBaseDps * critical.critAverageMult;
    const familiarDps = familiarBaseDps * critical.critAverageMult;
    const dps = Math.max(1, summonerDps + familiarDps);
    const goldMult = 1 + upgrades.greed * 0.08 + role.support * 0.1 + treasures.killGoldPct + roster.goldPct + gearCollection.goldPct + diamond.goldPct + skin.goldPct + equippedGearEffect("goldPct");
    const curseBossCut = Math.min(0.38, role.curse * 0.1);
    const bossBreakPct = upgrades.bossBreak * 0.035 + role.tank * 0.1 + roster.tankBossPct;
    const bossDamagePct = treasures.bossDamagePct + roster.bossDamagePct + gearCollection.bossDamagePct + equippedGearEffect("bossDamagePct") + bossBreakPct + skin.bossDamagePct;
    const projectileChancePct = Math.min(0.7, weaponEffects.projectileChancePct + equippedGearEffect("projectileChancePct"));
    const weaknessBonusPct = Math.min(1.05, weaponEffects.weaknessBonusPct + treasures.weaknessBonusPct + equippedGearEffect("weaknessBonusPct"));
    const highHpBossDamagePct = weaponEffects.highHpBossDamagePct;
    const lowHpBossDamagePct = treasures.lowHpBossDamagePct + equippedGearEffect("lowHpBossDamagePct");
    const debuffResistPct = Math.min(0.75, weaponEffects.debuffResistPct + treasures.debuffResistPct + equippedGearEffect("debuffResistPct"));
    const soulBonusPct = weaponEffects.soulPct + treasures.bossSoulPct + diamond.soulPct + skin.soulPct + equippedGearEffect("soulPct") + equippedGearEffect("bossSoulPct");
    const rebirthSoulPct = weaponEffects.soulPct + treasures.rebirthSoulPct + diamond.soulPct + skin.soulPct + equippedGearEffect("rebirthSoulPct");
    const bossRewardPct = treasures.bossRewardPct;
    const power = Math.floor(dps * (9 + bossDamagePct * 2) + gearPower + heroPower + roster.reservePower * 0.35 + souls * 8);
    app.save.stats.bestPower = Math.max(app.save.stats.bestPower, power);
    return { dps, summonerDps, familiarDps, summonerBaseDps, familiarBaseDps, attackSpeedMult, goldMult, curseBossCut, bossDamagePct, projectileChancePct, weaknessBonusPct, highHpBossDamagePct, lowHpBossDamagePct, debuffResistPct, bossRewardPct, soulBonusPct, rebirthSoulPct, power, heroPower, gearPower, treasures, weaponEffects, roster, gearCollection, diamond, skin, activeBoost, ...critical };
  }

  function enemyForStage(stage, slot = app.save.floorKill) {
    const boss = slot >= MONSTERS_PER_FLOOR;
    const gateBoss = boss && stage % 10 === 0;
    const apexBoss = boss && stage % 100 === 0;
    const variant = boss ? bossVariantForStage(stage, gateBoss, apexBoss) : enemyVariantForStage(stage, slot);
    const role = variant.role;
    const stats = calcStats();
    const bossMult = apexBoss ? 48 : gateBoss ? 12 : boss ? 4.8 : 1;
    const earlyStages = Math.min(stage - 1, 30);
    const lateStages = Math.max(0, stage - 31);
    const stageMult = Math.pow(1.18, earlyStages) * Math.pow(1.165, lateStages);
    const baseHp = 118 * bossMult * (variant.hpMult || 1);
    const hp = Math.floor(baseHp * stageMult * (boss ? 1 - stats.curseBossCut : 1));
    return {
      stage,
      name: variant.name,
      role,
      boss,
      gateBoss,
      apexBoss,
      slot,
      frame: variant.frame ?? ENEMY_SPRITE_BY_ROLE[role] ?? 0,
      spriteFilter: variant.filter || "none",
      visualScale: variant.visualScale || 1,
      hp,
      maxHp: hp
    };
  }

  function battleProgress() {
    const stage = Math.max(1, Math.floor(Number(app.enemy?.stage ?? app.save.stage) || 1));
    const slot = Math.min(MONSTERS_PER_FLOOR, Math.max(1, Math.floor(Number(app.enemy?.slot ?? app.save.floorKill) || 1)));
    return {
      stage,
      slot,
      progressText: `${slot}/${MONSTERS_PER_FLOOR}`
    };
  }

  function enemyVariantForStage(stage, slot) {
    const zone = monsterZoneForStage(stage);
    const role = ENEMY_ROLES[(Math.floor(stage / 5) + stage + slot) % ENEMY_ROLES.length];
    const roleVariants = ENEMY_VARIANTS.filter((enemy) => enemy.zone === zone.index && enemy.role === role);
    const weakVariants = roleVariants.filter((enemy) => enemy.tier === "weak");
    const regularVariants = roleVariants.filter((enemy) => enemy.tier !== "weak");
    let variants = roleVariants.length ? roleVariants : ENEMY_VARIANTS.filter((enemy) => enemy.role === role);
    if (stage <= 14 && weakVariants.length) {
      variants = weakVariants;
    } else if (stage <= 30 && weakVariants.length && regularVariants.length) {
      variants = slot % 3 === 0 ? weakVariants : regularVariants.concat(weakVariants);
    }
    return variants[stablePick(stage * 17 + slot * 31, variants.length)] || ENEMY_VARIANTS[0];
  }

  function bossVariantForStage(stage, gateBoss, apexBoss) {
    const zone = monsterZoneForStage(stage);
    const zoneBosses = BOSS_VARIANTS.filter((boss) => boss.zone === zone.index);
    if (stage >= 10000) return zoneBosses.find((boss) => boss.type === "final") || BOSS_VARIANTS[BOSS_VARIANTS.length - 1];
    if (apexBoss) return zoneBosses.find((boss) => boss.type === "apex") || zoneBosses[3] || BOSS_VARIANTS[0];
    if (gateBoss) return zoneBosses.find((boss) => boss.type === "gate") || zoneBosses[2] || BOSS_VARIANTS[0];
    const pool = zoneBosses.filter((boss) => boss.type === "floor");
    return pool[stablePick(stage * 43 + (gateBoss ? 10 : 5), pool.length)] || BOSS_VARIANTS[0];
  }

  function stablePick(seed, count) {
    if (count <= 0) return 0;
    const mixed = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return Math.abs(Math.floor(mixed)) % count;
  }

  function enemyGold(enemy) {
    const stats = calcStats();
    const bossBonus = enemy.boss ? 1 + stats.bossRewardPct : 1;
    const base = enemy.boss ? 36 : 8;
    return Math.floor(base * Math.pow(app.save.stage + enemy.slot, 1.04) * stats.goldMult * bossBonus);
  }

  function enemySoulReward(enemy) {
    if (!enemy.boss) return 0;
    const stats = calcStats();
    const base = enemy.apexBoss ? 10 : enemy.gateBoss ? 5 : 2;
    return Math.max(1, Math.floor(base * (1 + stats.soulBonusPct + stats.bossRewardPct)));
  }

  function nextEnemy() {
    clearBattleProjectiles();
    app.enemy = enemyForStage(app.save.stage, app.save.floorKill);
    if (app.settings.bgmEnabled) void syncBgm();
  }

  async function refreshBalance() {
    const result = await host.wallet.getBalance();
    app.walletBalance = result.balance;
    render();
  }

  async function writeSave() {
    app.save.lastSeenAt = Date.now();
    await host.save.write(app.save);
  }

  async function spend(actionId, key) {
    const action = ACTION_BY_ID[actionId];
    if (!action) {
      showToast("선언되지 않은 다이아 액션입니다.");
      return false;
    }
    const result = await host.wallet.spend({
      id: action.id,
      amount: action.amount,
      reason: action.reason,
      requiresConfirm: action.requiresConfirm,
      idempotencyKey: key
    });
    if (result.ok) {
      app.walletBalance = result.balanceAfter;
      render();
      return true;
    }
    showToast(result.message || "다이아 요청이 취소되었습니다.");
    return false;
  }

  function updateCombat(dt) {
    updateHitEffects(dt);
    if (!app.enemy) return;

    const stats = calcStats();

    queueSummonerAttack(dt, stats);
    queueCompanionAttacks(dt, stats);
    updateProjectiles(dt);

    if (app.enemy.hp <= 0) {
      defeatEnemy();
    }
  }

  function queueSummonerAttack(dt, stats) {
    app.fireTimers.summoner -= dt;
    if (app.fireTimers.summoner > 0) return;
    const profile = SUMMONER_ATTACK_PROFILE;
    const cooldown = profile.cooldown / stats.attackSpeedMult;
    const bossBonus = app.enemy.boss ? 1 + stats.bossDamagePct : 1;
    const damage = damageAfterEnemyDebuff(stats.summonerBaseDps * cooldown * bossBonus * bossHighHpMultiplier(app.enemy, stats) * bossLowHpMultiplier(app.enemy, stats), app.enemy, stats);
    spawnProjectile({
      source: "summoner",
      role: "summoner",
      damage,
      critChancePct: stats.critChancePct,
      critDamageMult: stats.critDamageMult,
      duration: Math.max(0.24, profile.duration / Math.sqrt(stats.attackSpeedMult)),
      height: profile.height,
      yOffset: profile.yOffset,
      sourceIndex: -1,
      color: profile.color
    });
    if (stats.projectileChancePct > 0 && Math.random() < stats.projectileChancePct) {
      spawnProjectile({
        source: "summoner",
        role: "summoner",
        damage: damage * 0.55,
        critChancePct: stats.critChancePct,
        critDamageMult: stats.critDamageMult,
        duration: Math.max(0.26, profile.duration / Math.sqrt(stats.attackSpeedMult) + 0.04),
        height: profile.height * 0.82,
        yOffset: profile.yOffset + 16,
        sourceIndex: -1,
        color: "#f5c76a"
      });
    }
    app.fireTimers.summoner += cooldown;
  }

  function queueCompanionAttacks(dt, stats) {
    const equipped = app.save.equippedHeroes.filter(Boolean);
    Object.keys(app.fireTimers.heroes).forEach((id) => {
      if (!equipped.includes(id)) delete app.fireTimers.heroes[id];
    });

    const totalHeroPower = Math.max(1, equipped.reduce((sum, id) => sum + Math.max(1, itemPower("hero", id)), 0));
    equipped.forEach((id, index) => {
      const hero = getData("hero", id);
      if (!hero) return;
      const profile = ROLE_ATTACK_PROFILE[hero.role];
      const cooldown = profile.cooldown / stats.attackSpeedMult;
      const initialDelay = cooldown * (0.24 + index * 0.18);
      let timer = app.fireTimers.heroes[id] ?? initialDelay;
      timer -= dt;
      if (timer <= 0) {
        const heroWeight = Math.max(1, itemPower("hero", id)) / totalHeroPower;
        const roleBonus = roleProjectileBonus(hero.role, app.enemy.role, stats);
        const bossBonus = app.enemy.boss ? 1 + stats.bossDamagePct : 1;
        const damage = damageAfterEnemyDebuff(stats.familiarBaseDps * heroWeight * cooldown * profile.damage * roleBonus * bossBonus * bossHighHpMultiplier(app.enemy, stats) * bossLowHpMultiplier(app.enemy, stats), app.enemy, stats);
        const projectileFrame = companionProjectileFrame(id, hero.role);
        spawnProjectile({
          source: "companion",
          role: hero.role,
          projectileFrame,
          damage,
          critChancePct: stats.critChancePct,
          critDamageMult: stats.critDamageMult,
          duration: Math.max(0.24, profile.duration / Math.sqrt(stats.attackSpeedMult)),
          height: companionProjectileHeight(projectileFrame, profile.height),
          yOffset: profile.yOffset + (index - 1) * 8,
          sourceIndex: index,
          color: profile.color
        });
        timer += cooldown;
      }
      app.fireTimers.heroes[id] = timer;
    });
  }

  function companionProjectileFrame(heroId, role) {
    return HERO_PROJECTILE_FRAME[heroId] ?? ROLE_PROJECTILE_FRAME[role] ?? 0;
  }

  function companionProjectileHeight(frame, fallbackHeight) {
    return PROJECTILE_FRAME_HEIGHT[frame] ?? fallbackHeight;
  }

  function attackSfxForProjectile(projectile) {
    if (projectile.source === "summoner") return "attackCast";
    const frame = projectile.projectileFrame ?? ROLE_PROJECTILE_FRAME[projectile.role] ?? 0;
    if ([1, 2, 6].includes(frame)) return "attackArrow";
    if (projectile.role === "curse" || frame >= 12) return "attackCurse";
    if (projectile.role === "support" || [8, 9, 10, 11].includes(frame)) return "attackCast";
    return "attackSwing";
  }

  function roleProjectileBonus(attackerRole, enemyRole, stats = calcStats()) {
    const preferred = {
      tank: "curse",
      dps: "tank",
      support: "dps",
      curse: "support"
    }[enemyRole];
    return attackerRole === preferred ? 1.32 + stats.weaknessBonusPct : 1;
  }

  function bossHighHpMultiplier(enemy, stats) {
    if (!enemy?.boss || stats.highHpBossDamagePct <= 0) return 1;
    const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
    return 1 + stats.highHpBossDamagePct * hpPct;
  }

  function bossLowHpMultiplier(enemy, stats) {
    if (!enemy?.boss || stats.lowHpBossDamagePct <= 0) return 1;
    const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
    return 1 + stats.lowHpBossDamagePct * (1 - hpPct);
  }

  function spawnProjectile(projectile) {
    if (!app.enemy) return;
    app.projectileSerial += 1;
    app.projectiles.push({
      id: app.projectileSerial,
      elapsed: 0,
      ...projectile
    });
    app.projectiles = app.projectiles.slice(-24);
    app.attackFlash = Math.max(app.attackFlash, 0.16);
    playSfx(attackSfxForProjectile(projectile), projectile.source === "summoner" ? 0.78 : 0.58, projectile.source === "summoner" ? 190 : 150);
  }

  function updateProjectiles(dt) {
    if (!app.enemy || app.projectiles.length === 0) return;
    const remaining = [];
    for (const projectile of app.projectiles) {
      projectile.elapsed += dt;
      if (projectile.elapsed >= projectile.duration) {
        applyProjectileHit(projectile);
        if (app.enemy.hp <= 0) break;
      } else {
        remaining.push(projectile);
      }
    }
    app.projectiles = app.enemy.hp <= 0 ? [] : remaining;
  }

  function applyProjectileHit(projectile) {
    if (!app.enemy) return;
    const critChancePct = Math.max(0, Number(projectile.critChancePct) || 0);
    const critical = critChancePct > 0 && Math.random() < critChancePct;
    const critDamageMult = Math.max(1, Number(projectile.critDamageMult) || 1);
    const damage = Math.max(1, Math.floor(projectile.damage * (critical ? critDamageMult : 1)));
    app.enemy.hp -= damage;
    app.enemyFlash = Math.max(app.enemyFlash, critical ? 0.2 : 0.16);
    if (critical) {
      playSfx("criticalHit", 0.86, 140);
    } else {
      playSfx(app.enemy.boss ? "hitHeavy" : "hitLight", app.enemy.boss ? 0.82 : 0.58, app.enemy.boss ? 170 : 95);
    }
    app.hitImpacts.push({
      role: projectile.role,
      elapsed: 0,
      duration: critical ? 0.3 : 0.34,
      yOffset: projectile.yOffset,
      color: critical ? "#ffd166" : projectile.color,
      critical
    });
    if (app.settings.damageNumbers) {
      app.damageTexts.push({
        amount: damage,
        role: projectile.role,
        elapsed: 0,
        duration: critical ? 0.78 : 0.72,
        yOffset: projectile.yOffset,
        xJitter: ((projectile.id * 17) % 31) - 15,
        lane: projectile.id % 4,
        color: critical ? "#ffd166" : projectile.color,
        critical,
        critDamageMult
      });
    }
    app.hitImpacts = app.hitImpacts.slice(-10);
    app.damageTexts = app.damageTexts.slice(-16);
  }

  function updateHitEffects(dt) {
    app.hitImpacts = app.hitImpacts
      .map((impact) => ({ ...impact, elapsed: impact.elapsed + dt }))
      .filter((impact) => impact.elapsed < impact.duration);
    app.damageTexts = app.damageTexts
      .map((text) => ({ ...text, elapsed: text.elapsed + dt }))
      .filter((text) => text.elapsed < text.duration);
  }

  function clearBattleProjectiles(clearDamageText = false) {
    app.projectiles = [];
    app.hitImpacts = [];
    if (clearDamageText) app.damageTexts = [];
  }

  function defeatEnemy() {
    if (!app.enemy) return;
    const defeated = app.enemy;
    const gold = enemyGold(defeated);
    const souls = enemySoulReward(defeated);
    app.save.gold += gold;
    app.save.stats.totalGoldEarned += gold;
    app.save.stats.monstersKilled += 1;
    if (defeated.boss) {
      app.save.souls += souls;
      app.save.stats.soulsEarned += souls;
      app.save.stats.bossesKilled += 1;
      pushLog(`보스 처치! 골드 +${fmt(gold)} / 영혼석 +${fmt(souls)}`);
      playSfx("bossClear");
    } else {
      pushLog(`${defeated.name} 격파. 골드 +${fmt(gold)}`);
      playSfx("enemyDown", 0.62, 520);
    }
    if (app.save.floorKill >= MONSTERS_PER_FLOOR) {
      app.save.floorKill = 1;
      app.save.stage += 1;
      app.save.stats.floorsCleared += 1;
    } else {
      app.save.floorKill += 1;
    }
    app.save.maxStage = Math.max(app.save.maxStage, app.save.stage);
    nextEnemy();
    render();
  }

  function enemyWeaknessBonus(enemyRole) {
    const counts = roleCounts();
    const preferred = {
      tank: "curse",
      dps: "tank",
      support: "dps",
      curse: "support"
    }[enemyRole];
    return 1 + counts[preferred] * 0.18;
  }

  function upgradeCostAtLevel(type, level) {
    const base = {
      attack: 42,
      attackSpeed: 58,
      bossBreak: 40,
      familiar: 52,
      greed: 68,
      chainSpell: 84,
      weaknessMark: 76,
      soulDrain: 92,
      abyssPierce: 88,
      vanguardOrder: 82,
      abyssResistance: 94
    }[type];
    return Math.floor(base * Math.pow(1.24, level));
  }

  function upgradeCost(type) {
    return upgradeCostAtLevel(type, app.save.runUpgrades[type]);
  }

  function normalizeUpgradeStep(value) {
    const text = String(value || "1");
    return UPGRADE_STEP_OPTIONS.some((option) => option.value === text) ? text : "1";
  }

  function normalizeGearSlotFilter(value) {
    const text = String(value || "weapon");
    return GEAR_SLOT_FILTERS.some((option) => option.value === text) ? text : "weapon";
  }

  function setUpgradeStep(value) {
    app.upgradeStep = normalizeUpgradeStep(value);
    writeUpgradeStepPreference(app.upgradeStep);
    render();
  }

  function setGearSlotFilter(value) {
    app.gearSlotFilter = normalizeGearSlotFilter(value);
    writeGearSlotFilterPreference(app.gearSlotFilter);
    app.panelScroll.gear = 0;
    render();
  }

  function normalizeCodexKind(value) {
    const text = String(value || "heroes");
    return CODEX_KIND_FILTERS.some((option) => option.value === text) ? text : "heroes";
  }

  function setSummonView(value) {
    app.summonView = value === "codex" ? "codex" : "summon";
    app.panelScroll.summon = 0;
    render();
  }

  function setCodexKind(value) {
    app.codexKind = normalizeCodexKind(value);
    app.panelScroll.summon = 0;
    render();
  }

  function openCodexShortcut(kind) {
    modalLayer.innerHTML = "";
    app.tab = "summon";
    app.summonView = "codex";
    app.codexKind = kind ? normalizeCodexKind(kind) : normalizeCodexKind(app.codexKind);
    app.panelScroll.summon = 0;
    if (window.location.hash.slice(1) !== "summon") {
      window.history.replaceState(null, "", "#summon");
    }
    render();
  }

  function costForLevels(costAtLevel, startLevel, levels) {
    let total = 0;
    for (let i = 0; i < levels; i += 1) {
      const cost = costAtLevel(startLevel + i);
      if (!Number.isFinite(cost) || !Number.isFinite(total + cost)) return Infinity;
      total += cost;
    }
    return total;
  }

  function upgradePurchasePlan(currentLevel, costAtLevel) {
    const remaining = Math.max(0, MAX_UPGRADE_LEVEL - currentLevel);
    const maxMode = app.upgradeStep === "max";
    if (remaining <= 0) return { levels: 0, cost: 0, nextLevel: currentLevel, maxMode };
    if (maxMode) {
      let levels = 0;
      let cost = 0;
      for (let level = currentLevel; level < MAX_UPGRADE_LEVEL; level += 1) {
        const nextCost = costAtLevel(level);
        if (!Number.isFinite(nextCost) || cost + nextCost > app.save.gold) break;
        cost += nextCost;
        levels += 1;
      }
      return { levels, cost: levels > 0 ? cost : costAtLevel(currentLevel), nextLevel: currentLevel + levels, maxMode };
    }
    const levels = Math.min(Number(app.upgradeStep) || 1, remaining);
    return {
      levels,
      cost: costForLevels(costAtLevel, currentLevel, levels),
      nextLevel: currentLevel + levels,
      maxMode
    };
  }

  function upgradePlanLabel(plan) {
    if (plan.maxMode) return plan.levels > 0 ? `최대 +${fmt(plan.levels)}` : "최대";
    return `+${fmt(plan.levels)} Lv`;
  }

  function canBuyUpgradePlan(plan) {
    return plan.levels > 0 && Number.isFinite(plan.cost) && app.save.gold >= plan.cost;
  }

  async function buyUpgrade(type) {
    const plan = upgradePurchasePlan(app.save.runUpgrades[type], (level) => upgradeCostAtLevel(type, level));
    if (!canBuyUpgradePlan(plan)) {
      showToast("골드가 부족합니다.");
      return;
    }
    app.save.gold -= plan.cost;
    app.save.runUpgrades[type] += plan.levels;
    pushLog(`${upgradeName(type)} +${plan.levels}Lv → Lv.${app.save.runUpgrades[type]}`);
    playSfx("upgrade");
    await writeSave();
    render();
  }

  function upgradeName(type) {
    return {
      attack: "주문 공격",
      attackSpeed: "속공 연마",
      bossBreak: "보스 피해",
      familiar: "소환수 지휘",
      greed: "탐욕 의식",
      chainSpell: "연쇄 주문",
      weaknessMark: "약점 각인",
      soulDrain: "영혼 흡수",
      abyssPierce: "심연 관통",
      vanguardOrder: "전열 지휘",
      abyssResistance: "심연 저항"
    }[type];
  }

  function weaponCostAtLevel(level) {
    const milestoneTax = 1 + Math.floor(level / 25) * 0.16;
    return Math.floor(90 * Math.pow(1.3, level) * milestoneTax);
  }

  function weaponCost() {
    return weaponCostAtLevel(app.save.weaponLevel);
  }

  async function buyWeapon() {
    const plan = upgradePurchasePlan(app.save.weaponLevel, weaponCostAtLevel);
    if (!canBuyUpgradePlan(plan)) {
      showToast("골드가 부족합니다.");
      return;
    }
    app.save.gold -= plan.cost;
    app.save.weaponLevel += plan.levels;
    pushLog(`${weaponName()} +${plan.levels}Lv → Lv.${app.save.weaponLevel}`);
    playSfx("upgrade");
    await writeSave();
    render();
  }

  function questCostAtLevel(id, level) {
    const index = Math.max(0, QUESTS.findIndex((quest) => quest.id === id));
    const quest = QUESTS[index];
    return Math.floor((quest.baseCost || 2 + index * 24) * Math.pow(quest.growth || 1.6, level));
  }

  function questCost(id) {
    return questCostAtLevel(id, questLevel(id));
  }

  async function buyQuest(id) {
    const quest = QUESTS.find((item) => item.id === id);
    if (!quest) return;
    const plan = upgradePurchasePlan(questLevel(id), (level) => questCostAtLevel(id, level));
    if (!canBuyUpgradePlan(plan)) {
      showToast("골드가 부족합니다.");
      return;
    }
    app.save.gold -= plan.cost;
    app.save.questLevels[id] = questLevel(id) + plan.levels;
    pushLog(`${quest.name} +${plan.levels}Lv → Lv.${app.save.questLevels[id]}`);
    playSfx("upgrade", 0.82);
    await writeSave();
    render();
  }

  function treasureCost(treasure) {
    const level = treasureLevel(treasure.id);
    return Math.floor(treasure.cost * Math.pow(1.2, level));
  }

  async function buyTreasure(id) {
    const treasure = TREASURES.find((item) => item.id === id);
    if (!treasure) return;
    const cost = treasureCost(treasure);
    if (app.save.souls < cost) {
      showToast("영혼석이 부족합니다.");
      return;
    }
    app.save.souls -= cost;
    app.save.treasures[id] = treasureLevel(id) + 1;
    pushLog(`${treasure.name} Lv.${app.save.treasures[id]} 강화`);
    playSfx("upgrade", 0.9);
    await writeSave();
    render();
  }

  function treasureEffectText(treasure) {
    const level = treasureLevel(treasure.id);
    const nextValue = treasure.base * (level + 1);
    const currentValue = treasure.base * level;
    if (treasure.effect === "critPct") {
      const current = criticalProfile(currentValue);
      const next = criticalProfile(nextValue);
      return `치명률 ${pct(current.critChancePct)} → ${pct(next.critChancePct)} / 치명 피해 ${multiplierText(current.critDamageMult)} → ${multiplierText(next.critDamageMult)}`;
    }
    if (treasure.effect === "normalSummonDiscountPct") {
      return `일반 소환 비용 -${pct(currentValue)} → -${pct(nextValue)}`;
    }
    const labels = {
      bossRewardPct: "보스 보상",
      debuffResistPct: "압박 저항",
      weaknessBonusPct: "상성 피해",
      lowHpBossDamagePct: "마무리 보스 피해",
      bossSoulPct: "보스 영혼석",
      rebirthSoulPct: "환생 영혼석",
      soulPct: "보유 영혼석 피해",
      weaponPct: "회차 무기 ATK"
    };
    const label = labels[treasure.effect];
    if (label) return `${label} +${pct(currentValue)} → +${pct(nextValue)}`;
    return `+ ${pct(nextValue)} / 현재 ${pct(currentValue)}`;
  }

  function pct(value, digits = 1) {
    return `${(value * 100).toLocaleString("ko-KR", { maximumFractionDigits: digits })}%`;
  }

  function multiplierText(value, digits = 2) {
    return `x${value.toLocaleString("ko-KR", { maximumFractionDigits: digits })}`;
  }

  function rebirthReward() {
    if (app.save.maxStage < 8) return { souls: 0 };
    const stageOverStart = Math.max(0, app.save.maxStage - 4);
    const soulStage = Math.max(0, app.save.maxStage - 10);
    const formerKeyReward = Math.floor(Math.pow(stageOverStart, 1.18) + app.save.stats.bossesKilled * 1.8);
    const depthSoulReward = Math.floor(Math.pow(soulStage, 1.08) / 3 + app.save.rebirths * 0.5);
    const diamond = diamondUpgradeEffects();
    const skin = skinEffects();
    const treasures = treasureEffects();
    const weaponEffects = weaponUpgradeEffects();
    const soulBoost = diamond.soulPct + skin.soulPct + treasures.rebirthSoulPct + weaponEffects.soulPct + equippedGearEffect("rebirthSoulPct") + equippedGearEffect("soulPct");
    return { souls: Math.max(0, Math.floor((formerKeyReward + depthSoulReward) * (1 + soulBoost))) };
  }

  async function rebirth() {
    const reward = rebirthReward();
    if (reward.souls <= 0) {
      showToast("8층 이후부터 환생 보상이 생깁니다.");
      return;
    }
    const ok = await host.ui.confirm({
      title: "환생",
      message: `현재 진행을 1층으로 되돌리고 영혼석 ${reward.souls}개를 얻습니다. 동료, 장비, 보물, 소환 천장은 유지됩니다.`
    });
    if (!ok) return;
    app.save.souls += reward.souls;
    app.save.stats.soulsEarned += reward.souls;
    app.save.rebirths += 1;
    app.save.gold = 0;
    app.save.stage = 1;
    app.save.floorKill = 1;
    app.save.weaponLevel = 0;
    app.save.questLevel = 0;
    app.save.questLevels = {};
    app.questGoldCarry = 0;
    app.pendingOfflineGold = 0;
    app.save.runUpgrades = clone(DEFAULT_SAVE.runUpgrades);
    pushLog(`환생 완료. 영혼석 +${reward.souls}`);
    nextEnemy();
    playSfx("rebirth");
    await writeSave();
    render();
  }

  function summonRateText(mode) {
    const rates = effectiveSummonRates(mode);
    return `Common ${rates.common}% / Rare ${rates.rare}% / Epic ${rates.epic}% / Legendary ${rates.legendary}%`;
  }

  function effectiveSummonRates(mode) {
    const rates = { ...SUMMON_MODES[mode].rates };
    if (mode === "premium") {
      const luck = treasureEffects().premiumLuckPct;
      const epicBonus = Math.round(luck * 420) / 10;
      const legendaryBonus = Math.round(luck * 130) / 10;
      const totalBonus = epicBonus + legendaryBonus;
      rates.common = Math.max(20, Math.round((rates.common - totalBonus) * 10) / 10);
      rates.epic = Math.round((rates.epic + epicBonus) * 10) / 10;
      rates.legendary = Math.round((rates.legendary + legendaryBonus) * 10) / 10;
    }
    return rates;
  }

  function normalSummonCost(kind, count) {
    const base = kind === "hero" ? 140 : 160;
    const stage = Math.max(1, app.save.maxStage || app.save.stage || 1);
    const stageMult = Math.pow(1.17, Math.max(0, stage - 1));
    const tenDiscount = count === 10 ? 0.95 : 1;
    const discountPct = Math.min(0.75, treasureEffects().normalSummonDiscountPct + equippedGearEffect("normalSummonDiscountPct"));
    const discount = 1 - discountPct;
    return Math.max(1, Math.floor(base * stageMult * count * tenDiscount * discount));
  }

  function rollRarity(kind, forceLegendary, minRare, mode) {
    if (forceLegendary) return "legendary";
    const rates = effectiveSummonRates(mode);
    const pool = Object.entries(rates);
    const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of pool) {
      roll -= weight;
      if (roll <= 0) {
        if (minRare && key === "common") return "rare";
        return key;
      }
    }
    return minRare ? "rare" : "common";
  }

  function poolFor(kind, rarity) {
    return (kind === "hero" ? HEROES : GEARS).filter((item) => item.rarity === rarity);
  }

  function pullOne(kind, minRare, mode) {
    const pityBank = mode === "premium" ? app.save.pity : app.save.normalPity;
    const pullBank = mode === "premium" ? app.save.pulls : app.save.normalPulls;
    const pityLimit = SUMMON_MODES[mode].pity;
    pityBank[kind] += 1;
    const forced = pityBank[kind] >= pityLimit;
    const rarity = rollRarity(kind, forced, minRare, mode);
    if (rarity === "legendary") {
      pityBank[kind] = 0;
    }
    const item = pick(poolFor(kind, rarity));
    const ownership = addOwned(kind, item.id, false);
    pullBank[kind] += 1;
    app.save.stats.totalSummons += 1;
    return { ...item, kind, ...ownership };
  }

  async function summon(mode, kind, count) {
    if (!SUMMON_MODES[mode]) return;
    if (mode === "premium") {
      const actionId = `summon-${kind}-${count}`;
      const ok = await spend(actionId, `${PACK_ID}:premium:${kind}:${count}:${Date.now()}`);
      if (!ok) return;
    } else {
      const cost = normalSummonCost(kind, count);
      if (app.save.gold < cost) {
        showToast("골드가 부족합니다.");
        return;
      }
      app.save.gold -= cost;
    }
    const results = [];
    for (let i = 0; i < count; i += 1) {
      const needsRareGuarantee = count === 10 && i === count - 1 && !results.some((item) => item.rarity !== "common");
      results.push(pullOne(kind, needsRareGuarantee, mode));
    }
    playSfx(results.some((item) => item.rarity === "legendary" || item.rarity === "epic") ? "summonRare" : "summon");
    pushLog(`${SUMMON_MODES[mode].label} ${kind === "hero" ? "동료" : "장비"} 소환 ${count}회`);
    await writeSave();
    render();
    showSummonResults(mode, kind, results);
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function summonResultStatusText(kind, item) {
    if (!item.duplicate) {
      return kind === "hero" ? "신규 획득 · 공명 개방" : "신규 획득";
    }
    if (item.levelUp) {
      return "이미 보유 · 조각 획득 · Lv 상승";
    }
    return "이미 보유 · 조각 획득";
  }

  function showSummonResults(mode, kind, results) {
    modalLayer.innerHTML = `
      <div class="modal summon-result-modal">
        <div class="modal-header split">
          <div>
            <h2>${SUMMON_MODES[mode].label} ${kind === "hero" ? "동료" : "장비"} 소환 결과</h2>
            <p class="muted">${kind === "hero" ? "이미 보유한 동료는 조각이 되고, Lv+1 시 편성 효과와 보유 효과가 올라갑니다." : "이미 보유한 장비는 조각이 되고, Lv+1 시 장착 효과와 보유 효과가 올라갑니다."}</p>
          </div>
          <button class="modal-close" data-close-modal aria-label="닫기">닫기</button>
        </div>
        <div class="modal-body">
          <div class="grid summon-result-grid">
            ${results
              .map((item) => `
                <div class="card collection-card result-card rarity-${item.rarity}">
                  <div class="collection-art">${catalogImgTag(kind === "hero" ? "heroes" : "gear", item.id, item.name)}</div>
                  <div class="collection-copy">
                    <h3 class="${rarityClass(item.rarity)}">${item.name}</h3>
                    <p class="tiny">${RARITIES[item.rarity].label} ${item.role ? ` / ${ROLES[item.role].label}` : ` / ${slotLabel(item.slot)}`}</p>
                    <p class="muted">${summonResultStatusText(kind, item)}</p>
                  </div>
                </div>
              `)
              .join("")}
          </div>
        </div>
        <div class="modal-actions">
          <button class="primary" data-close-modal>확인</button>
        </div>
      </div>
    `;
  }

  async function buySkin(id) {
    const skin = skinData(id);
    if (!skin || skin.id === "base") return;
    if (ownsSkin(skin.id)) {
      equipSkin(skin.id);
      return;
    }
    const ok = await spend(skin.action, `${PACK_ID}:skin:${skin.id}`);
    if (!ok) return;
    app.save.ownedSkins[skin.id] = true;
    app.save.activeSkin = skin.id;
    app.save.unlockedSkinAbyss = Boolean(app.save.ownedSkins.abyss);
    pushLog(`${skin.name} 외형 해금 · ${skinEffectText(skin)}`);
    await writeSave();
    render();
  }

  function equipSkin(id) {
    if (!ownsSkin(id)) return;
    app.save.activeSkin = id;
    app.save.unlockedSkinAbyss = Boolean(app.save.ownedSkins.abyss);
    writeSave();
    render();
  }

  function createAudio(src, { loop = false, volume = 0.45 } = {}) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = loop;
    audio.volume = volume;
    return audio;
  }

  function ensureAudioAssets() {
    if (bgm.tracks && bgm.sfx) return;
    bgm.tracks = {
      dungeon: createAudio(ASSETS.audio.dungeonBgm, { loop: true, volume: 0 }),
      boss: createAudio(ASSETS.audio.bossBgm, { loop: true, volume: 0 })
    };
    bgm.sfx = {
      summon: createAudio(ASSETS.audio.summon, { volume: 0.46 }),
      summonRare: createAudio(ASSETS.audio.summonRare, { volume: 0.55 }),
      rebirth: createAudio(ASSETS.audio.rebirth, { volume: 0.56 }),
      upgrade: createAudio(ASSETS.audio.upgrade, { volume: 0.32 }),
      bossClear: createAudio(ASSETS.audio.bossClear, { volume: 0.48 }),
      attackCast: createAudio(ASSETS.audio.attackCast, { volume: 0.28 }),
      attackSwing: createAudio(ASSETS.audio.attackSwing, { volume: 0.24 }),
      attackArrow: createAudio(ASSETS.audio.attackArrow, { volume: 0.22 }),
      attackCurse: createAudio(ASSETS.audio.attackCurse, { volume: 0.25 }),
      hitLight: createAudio(ASSETS.audio.hitLight, { volume: 0.25 }),
      hitHeavy: createAudio(ASSETS.audio.hitHeavy, { volume: 0.34 }),
      criticalHit: createAudio(ASSETS.audio.criticalHit, { volume: 0.38 }),
      enemyDown: createAudio(ASSETS.audio.enemyDown, { volume: 0.28 })
    };
  }

  function desiredBgmTrack() {
    return app.enemy?.boss ? "boss" : "dungeon";
  }

  async function syncBgm() {
    ensureAudioAssets();
    const tracks = bgm.tracks;
    if (!app.settings.bgmEnabled) {
      Object.values(tracks).forEach((track) => {
        track.pause();
        track.volume = 0;
      });
      bgm.currentTrack = null;
      return;
    }

    const activeKey = desiredBgmTrack();
    const activeTrack = tracks[activeKey];
    Object.entries(tracks).forEach(([key, track]) => {
      if (key !== activeKey) {
        track.pause();
        track.volume = 0;
      }
    });
    activeTrack.volume = (activeKey === "boss" ? 0.78 : 0.7) * normalizeVolumeSetting(app.settings.bgmVolume);
    if (bgm.currentTrack === activeKey && !activeTrack.paused) return;
    bgm.currentTrack = activeKey;
    try {
      await activeTrack.play();
    } catch (_error) {
      const now = Date.now();
      if (now - bgm.lastBlockedAt > 5000) {
        bgm.lastBlockedAt = now;
        showToast("브라우저 정책상 화면을 한 번 누르면 BGM이 재생됩니다.");
      }
    }
  }

  function playSfx(name, volume = 1, minGapMs = 0) {
    if (!app.settings.sfxEnabled) return;
    ensureAudioAssets();
    const source = bgm.sfx[name];
    if (!source) return;
    const now = performance.now();
    if (minGapMs > 0 && now - (bgm.sfxLastPlayed[name] || 0) < minGapMs) return;
    bgm.sfxLastPlayed[name] = now;
    const sound = source.cloneNode(true);
    sound.volume = Math.max(0, Math.min(1, source.volume * volume * normalizeVolumeSetting(app.settings.sfxVolume)));
    sound.play().catch(() => {});
  }

  function setVolumeSetting(key, value) {
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    const volume = normalizeVolumeSetting(percent / 100);
    app.settings = { ...app.settings, [key]: volume };
    writeSettingsPreference(app.settings);
    if (key === "bgmVolume") void syncBgm();
    const output = modalLayer.querySelector(`[data-setting-range-value="${key}"]`);
    if (output) output.textContent = `${Math.round(volume * 100)}%`;
  }

  async function setSetting(key, value) {
    app.settings = { ...app.settings, [key]: Boolean(value) };
    writeSettingsPreference(app.settings);
    if (key === "bgmEnabled") await syncBgm();
    if (key === "damageNumbers" && !app.settings.damageNumbers) app.damageTexts = [];
    if (key === "adviceBubble") app.speechHintNextAt = 0;
    render();
    if (modalLayer.innerHTML) openSettingsModal();
  }

  function settingToggleRow(key, title, desc) {
    const enabled = Boolean(app.settings[key]);
    return `
      <button class="settings-row ${enabled ? "enabled" : ""}" data-setting-toggle="${key}" aria-pressed="${enabled}">
        <span>
          <strong>${title}</strong>
          <small>${desc}</small>
        </span>
        <i>${enabled ? "ON" : "OFF"}</i>
      </button>
    `;
  }

  function settingRangeRow(key, title, desc) {
    const value = Math.round(normalizeVolumeSetting(app.settings[key]) * 100);
    return `
      <label class="settings-range">
        <span class="settings-range-head">
          <strong>${title}</strong>
          <output data-setting-range-value="${key}">${value}%</output>
        </span>
        <input type="range" min="0" max="100" step="5" value="${value}" data-setting-range="${key}" aria-label="${title}" />
        <small>${desc}</small>
      </label>
    `;
  }

  function openSettingsModal() {
    modalLayer.innerHTML = `
      <div class="modal settings-modal">
        <div class="modal-header split">
          <div>
            <h2>설정</h2>
            <p class="muted">전투 화면과 사운드 표시를 조정합니다.</p>
          </div>
          <button class="modal-close" data-close-modal aria-label="닫기">닫기</button>
        </div>
        <div class="modal-body settings-body">
          <button class="settings-link" data-open-codex>
            <span>
              <strong>도감 열기</strong>
              <small>동료, 장비, 보물, 몬스터 수집률을 확인합니다.</small>
            </span>
            <i>보기</i>
          </button>
          <button class="settings-link" data-open-codex="monsters">
            <span>
              <strong>적 도감</strong>
              <small>발견한 잡몹과 보스, 역할 정보를 바로 확인합니다.</small>
            </span>
            <i>ENEMY</i>
          </button>
          ${settingToggleRow("bgmEnabled", "BGM", "던전/보스 전투 음악을 켜거나 끕니다.")}
          ${settingRangeRow("bgmVolume", "배경음악 크기", "계속 깔리는 던전/보스 음악 볼륨입니다.")}
          ${settingToggleRow("sfxEnabled", "효과음", "소환, 강화, 환생 같은 짧은 효과음을 켜거나 끕니다.")}
          ${settingRangeRow("sfxVolume", "효과음 크기", "버튼, 소환, 강화, 환생 효과음 볼륨입니다.")}
          ${settingToggleRow("damageNumbers", "데미지 숫자", "전투 중 떠오르는 데미지 숫자를 표시합니다.")}
          ${settingToggleRow("adviceBubble", "조언 말풍선", "주인공 말풍선의 튜토리얼 조언을 표시합니다.")}
          ${settingToggleRow("reducedMotion", "모션 절감", "전투 연출의 흔들림과 떠오르는 움직임을 줄입니다.")}
          <div class="settings-status">
            <strong>저장</strong>
            <span>진행 상황은 5초마다 자동 저장됩니다.</span>
            <button data-save-now>지금 저장</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="primary" data-close-modal>확인</button>
        </div>
      </div>
    `;
  }

  async function buyDiamondUpgrade(id) {
    const upgrade = DIAMOND_UPGRADES.find((item) => item.id === id);
    if (!upgrade) return;
    const level = diamondUpgradeLevel(id);
    if (level >= upgrade.max) {
      showToast("이미 최대 레벨입니다.");
      return;
    }
    const ok = await spend(upgrade.action, `${PACK_ID}:diamond-upgrade:${id}:${level + 1}`);
    if (!ok) return;
    app.save.diamondUpgrades[id] = level + 1;
    pushLog(`${upgrade.name} Lv.${level + 1} 해금`);
    await writeSave();
    render();
  }

  async function buyConsumable(id) {
    const item = CONSUMABLES.find((entry) => entry.id === id);
    if (!item) return;
    const ok = await spend(item.action, `${PACK_ID}:consumable:${id}:${Date.now()}`);
    if (!ok) return;
    app.save.consumables[id] = consumableCount(id) + 1;
    pushLog(`${item.name} 보관 +1`);
    await writeSave();
    render();
  }

  function instantGoldReward() {
    const questGold = Math.floor(questGoldPerSecond() * 600);
    const stageGold = Math.floor(220 * Math.pow(Math.max(1, app.save.maxStage), 1.35) * calcStats().goldMult);
    return Math.max(500, questGold, stageGold);
  }

  function instantSoulReward() {
    const reward = rebirthReward().souls;
    const stageBonus = Math.floor(Math.sqrt(Math.max(1, app.save.maxStage)) * 3 + app.save.rebirths * 2 + app.save.stats.bossesKilled * 0.35);
    return Math.max(3, Math.floor(reward * 0.35 + stageBonus));
  }

  async function useConsumable(id) {
    const item = CONSUMABLES.find((entry) => entry.id === id);
    if (!item) return;
    const count = consumableCount(id);
    if (count <= 0) {
      showToast("보유한 소모품이 없습니다.");
      return;
    }
    app.save.consumables[id] = count - 1;
    if (id === "battle-catalyst") {
      const startAt = Math.max(Date.now(), Number(app.save.activeBoosts.battleCatalystUntil) || 0);
      app.save.activeBoosts.battleCatalystUntil = startAt + BATTLE_CATALYST_DURATION_MS;
      pushLog("전투 촉매 사용. 5분 동안 피해/공속 증가");
    } else if (id === "gold-seal") {
      const gold = instantGoldReward();
      app.save.gold += gold;
      app.save.stats.totalGoldEarned += gold;
      pushLog(`금고 봉인서 사용. 골드 +${fmt(gold)}`);
    } else if (id === "soul-candle") {
      const souls = instantSoulReward();
      app.save.souls += souls;
      app.save.stats.soulsEarned += souls;
      pushLog(`영혼 촛불 사용. 영혼석 +${fmt(souls)}`);
    }
    await writeSave();
    render();
  }

  async function claimOffline(multiplier, premium) {
    if (app.pendingOfflineGold <= 0) {
      showToast("정산할 방치 보상이 없습니다.");
      return;
    }
    if (premium) {
      const ok = await spend("rush-offline-reward", `${PACK_ID}:offline:${Date.now()}`);
      if (!ok) return;
    }
    const gold = Math.floor(app.pendingOfflineGold * multiplier);
    app.save.gold += gold;
    app.save.stats.totalGoldEarned += gold;
    app.pendingOfflineGold = 0;
    pushLog(`방치 보상 정산 +${fmt(gold)} 골드`);
    await writeSave();
    render();
  }

  function calcOfflineReward(lastSeenAt) {
    if (!lastSeenAt) return 0;
    const elapsedSeconds = Math.min(8 * 60 * 60, Math.max(0, (Date.now() - lastSeenAt) / 1000));
    if (elapsedSeconds < 30) return 0;
    return Math.floor(elapsedSeconds * questGoldPerSecond());
  }

  function updateQuestIncome(dt) {
    const perSecond = questGoldPerSecond();
    if (perSecond <= 0) return;
    const accrued = app.questGoldCarry + perSecond * dt;
    const gold = Math.floor(accrued);
    app.questGoldCarry = accrued - gold;
    if (gold <= 0) return;
    app.save.gold += gold;
    app.save.stats.totalGoldEarned += gold;
    const now = performance.now();
    if (now - app.lastQuestGoldRender > 500) {
      app.lastQuestGoldRender = now;
      render();
    }
  }

  function equipHero(id) {
    const equipped = app.save.equippedHeroes.filter(Boolean);
    if (equipped.includes(id)) {
      app.save.equippedHeroes = equipped.filter((heroId) => heroId !== id);
    } else if (equipped.length < 3) {
      equipped.push(id);
      app.save.equippedHeroes = equipped;
    } else {
      let weakestIndex = 0;
      let weakestPower = Infinity;
      equipped.forEach((heroId, index) => {
        const power = itemPower("hero", heroId);
        if (power < weakestPower) {
          weakestPower = power;
          weakestIndex = index;
        }
      });
      equipped[weakestIndex] = id;
      app.save.equippedHeroes = equipped;
    }
    writeSave();
    render();
  }

  function autoEquipHeroes() {
    const entries = ownedHeroEntries().sort((a, b) => b.power - a.power);
    const selected = [];
    ["dps", "tank", "support", "curse"].forEach((role) => {
      if (selected.length >= 3) return;
      const best = entries.find((entry) => entry.data.role === role && !selected.includes(entry.id));
      if (best) selected.push(best.id);
    });
    entries.forEach((entry) => {
      if (selected.length < 3 && !selected.includes(entry.id)) {
        selected.push(entry.id);
      }
    });
    app.save.equippedHeroes = selected.slice(0, 3);
    writeSave();
    render();
  }

  function equipGear(id) {
    const gear = getData("gear", id);
    app.save.equippedGear[gear.slot] = id;
    writeSave();
    render();
  }

  function autoEquipGear() {
    ["weapon", "armor", "relic"].forEach((slot) => {
      const best = Object.keys(app.save.ownedGear)
        .filter((id) => getData("gear", id).slot === slot)
        .sort((a, b) => gearEquipScore(b) - gearEquipScore(a))[0];
      if (best) app.save.equippedGear[slot] = best;
    });
    writeSave();
    render();
  }

  function setTab(tab) {
    if (!TABS.includes(tab)) return;
    rememberPanelScroll();
    app.tab = tab;
    if (window.location.hash.slice(1) !== tab) {
      window.history.replaceState(null, "", `#${tab}`);
    }
    render();
  }

  function syncTabFromHash() {
    const hashTab = window.location.hash.slice(1);
    if (!TABS.includes(hashTab) || app.tab === hashTab) return;
    rememberPanelScroll();
    app.tab = hashTab;
    render();
  }

  function rememberPanelScroll() {
    const panel = ui.querySelector(".panel");
    if (!panel) return;
    const tab = panel.dataset.panelTab || app.tab;
    app.panelScroll[tab] = panel.scrollTop;
  }

  function restorePanelScroll() {
    const panel = ui.querySelector(".panel");
    if (!panel) return;
    const savedTop = app.panelScroll[app.tab] || 0;
    if (savedTop <= 0) return;
    const applyScroll = () => {
      const currentPanel = ui.querySelector(`.panel[data-panel-tab="${app.tab}"]`);
      if (currentPanel) {
        const maxTop = Math.max(0, currentPanel.scrollHeight - currentPanel.clientHeight);
        currentPanel.scrollTop = Math.min(savedTop, maxTop);
      }
    };
    const maxTop = Math.max(0, panel.scrollHeight - panel.clientHeight);
    panel.scrollTop = Math.min(savedTop, maxTop);
    requestAnimationFrame(applyScroll);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function speechTips(stats, enemy, progress, reward) {
    const tips = [
      "골드는 퀘스트와 무기 강화에 먼저 쓰면 초반 진행이 빨라진다.",
      "다이아 소환은 프리미엄 뽑기다. 확률과 천장은 소환 탭에서 확인해라.",
      "중복 소환은 조각이 되고, 조각이 차면 동료와 장비 레벨이 오른다.",
      "편성하지 않은 동료도 예비대와 보유 효과로 전투에 기여한다.",
      "보스 피가 잘 안 줄면 환생해서 영혼석 보물을 올릴 타이밍이다.",
      "장비는 부위별로 장착 효과와 보유 효과가 따로 적용된다.",
      "전투 촉매는 짧은 시간 피해와 공속을 올린다. 보스 돌파 전에 쓰면 좋다.",
      "1000층 이후부터 적의 심연 압박이 켜진다. 버프 아이콘에 마우스를 올려 확인해라."
    ];
    if (app.tab === "quest") tips.unshift(`퀘스트 골드가 ${fmtRate(questGoldPerSecond())}/초 들어온다. 자동 수입의 뼈대다.`);
    if (app.tab === "weapon") tips.unshift("무기 탭은 직접 전투 체감이 크다. 공속과 보스 피해를 같이 올려라.");
    if (app.tab === "summon") tips.unshift("일반 소환은 골드, 프리미엄 소환은 다이아를 쓴다. 프리미엄이 희귀 확률이 높다.");
    if (app.tab === "heroes") tips.unshift(`현재 보유 동료 ${stats.roster.uniqueCount}명. 안 쓰는 동료도 보유 효과가 있다.`);
    if (app.tab === "gear") tips.unshift("장비는 무기/갑옷/유물 필터로 나눠 보고, 각 부위 최고 점수를 장착해라.");
    if (app.tab === "treasure") tips.unshift("보물은 환생해도 초기화되지 않는 장기 성장축이다.");
    if (app.tab === "shop") tips.unshift("상점의 특수능력과 외형 보유 효과는 환생해도 유지된다.");
    if (enemy.boss && reward.souls > 0) tips.unshift(`막히면 환생해라. 지금 영혼석 ${fmt(reward.souls)}개를 받을 수 있다.`);
    if (enemy.boss && enemy.hp / enemy.maxHp > 0.55) tips.unshift("보스 피가 천천히 줄면 보스 피해, 공속, 환생 보물을 확인해라.");
    if (progress.stage >= 1000) tips.unshift("심연 압박이 켜지는 구간이다. 적 디버프 아이콘을 확인해라.");
    return tips;
  }

  function currentSpeechText(stats, enemy, progress, reward) {
    const tips = speechTips(stats, enemy, progress, reward);
    const now = Date.now();
    if (now >= app.speechHintNextAt) {
      app.speechHintIndex = (app.speechHintIndex + 1) % tips.length;
      app.speechHintNextAt = now + 12000;
    }
    const urgent = enemy.boss && (reward.souls > 0 || enemy.hp / enemy.maxHp > 0.55);
    if (urgent) return tips[0];
    return tips[app.speechHintIndex % tips.length] || tips[0];
  }

  function shouldGuardRenderTarget(target) {
    return target instanceof Element && Boolean(target.closest("button, input, select, textarea"));
  }

  function beginInputRenderGuard(target) {
    if (!shouldGuardRenderTarget(target)) return;
    app.inputRenderGuard = true;
  }

  function flushDeferredRender() {
    if (!app.deferredRender) return;
    app.deferredRender = false;
    render(true);
  }

  function endInputRenderGuard() {
    if (!app.inputRenderGuard) return;
    window.setTimeout(() => {
      app.inputRenderGuard = false;
      flushDeferredRender();
    }, 0);
  }

  function render(force = false) {
    if (!force && app.inputRenderGuard) {
      app.deferredRender = true;
      return;
    }
    rememberPanelScroll();
    const stats = calcStats();
    const enemy = app.enemy || enemyForStage(app.save.stage, app.save.floorKill);
    const progress = battleProgress();
    const reward = rebirthReward();
    const speechText = currentSpeechText(stats, enemy, progress, reward);
    ui.innerHTML = `
      <header class="topbar">
        <div class="buff-row">
          <span>⚔ ${fmt(stats.dps)}</span>
          <span>☼ ${fmt(stats.goldMult * 100)}%</span>
          <span>◆ ${fmt(stats.power)}</span>
        </div>
        <div class="floor-title">
          <strong>${progress.stage}층 심연</strong>
          <span>${progress.progressText} 진행 중</span>
        </div>
        <button class="menu-button" data-open-settings>MENU</button>
      </header>
      ${renderCombatEffectRail(stats, enemy)}
      ${app.settings.adviceBubble ? `<div class="speech-bubble">${escapeHtml(speechText)}</div>` : ""}
      <div class="resource-ledger">
        <div class="resource-coin"><span class="res-icon coin"></span><strong>${fmt(app.save.gold)}</strong><small class="resource-rate">+${fmtRate(questGoldPerSecond())}/초</small></div>
        <div class="resource-soul"><span class="res-icon soul"></span><strong>${fmt(app.save.souls)}</strong></div>
        <div class="resource-diamond"><span class="res-icon diamond"></span><strong>${fmt(app.walletBalance)}</strong></div>
      </div>
      <footer class="bottombar">
        <nav class="nav-row">
          ${navButton("quest", "퀘스트")}
          ${navButton("weapon", "무기")}
          ${navButton("summon", "소환")}
          ${navButton("heroes", "동료")}
          ${navButton("gear", "장비")}
          ${navButton("treasure", "보물")}
          ${navButton("shop", "상점")}
          ${navButton("rebirth", "환생")}
        </nav>
        <section class="panel" data-panel-tab="${app.tab}">${renderPanel()}</section>
      </footer>
    `;
    restorePanelScroll();
  }

  function navButton(tab, label) {
    return `<button class="${app.tab === tab ? "active" : ""}" data-tab="${tab}"><span class="nav-icon nav-${tab}"></span><span>${label}</span></button>`;
  }

  function renderActiveBuffChips() {
    const boost = activeBoostEffects();
    if (!boost.battleCatalystActive) return "";
    const progress = Math.max(0, Math.min(1, boost.battleCatalystRemaining / (BATTLE_CATALYST_DURATION_MS / 1000)));
    return `
      <span class="boost-chip" title="전투 촉매: 피해 +20%, 공속 +20%">
        <b>촉매</b>
        <small>${formatDuration(boost.battleCatalystRemaining)}</small>
        <i style="--buff-progress:${progress}"></i>
      </span>
    `;
  }

  function renderCombatEffectRail(stats, enemy) {
    const chips = [];
    const boost = activeBoostEffects();
    if (boost.battleCatalystActive) {
      const progress = Math.max(0, Math.min(1, boost.battleCatalystRemaining / (BATTLE_CATALYST_DURATION_MS / 1000)));
      chips.push(`
        <span class="effect-orb ally" data-tooltip="아군 버프&#10;전투 촉매&#10;전체 피해 +20% / 공격속도 +20%&#10;남은 시간 ${formatDuration(boost.battleCatalystRemaining)}" aria-label="전투 촉매">
          <b>촉</b>
          <i style="--buff-progress:${progress}"></i>
        </span>
      `);
    }
    const debuff = enemyDebuffEffects(enemy, stats);
    if (debuff.damageCutPct > 0) {
      const resistLine = debuff.resistPct > 0 ? `&#10;압박 저항 ${pct(debuff.resistPct)} 적용` : "";
      chips.push(`
        <span class="effect-orb enemy" data-tooltip="적군 디버프&#10;${debuff.label}&#10;아군 최종 피해 -${pct(debuff.damageCutPct)}${resistLine}&#10;1000층 이후 점점 강해집니다." aria-label="${debuff.label}">
          <b>압</b>
          <i style="--buff-progress:${Math.min(1, debuff.damageCutPct / 0.46)}"></i>
        </span>
      `);
    }
    if (enemy.boss && stats.bossDamagePct > 0) {
      chips.push(`
        <span class="effect-orb ally" data-tooltip="아군 버프&#10;보스 피해 증가&#10;보스에게 주는 최종 피해 +${pct(stats.bossDamagePct)}" aria-label="보스 피해 증가">
          <b>보</b>
          <i style="--buff-progress:${Math.min(1, stats.bossDamagePct / 2)}"></i>
        </span>
      `);
    }
    if (stats.roster?.uniqueCount >= 3) {
      chips.push(`
        <span class="effect-orb ally passive" data-tooltip="팀 공명&#10;보유 동료 ${fmt(stats.roster.uniqueCount)}명&#10;보유/예비대 효과가 전투력에 반영 중" aria-label="팀 공명">
          <b>공</b>
          <i style="--buff-progress:${Math.min(1, stats.roster.uniqueCount / HEROES.length)}"></i>
        </span>
      `);
    }
    return chips.length ? `<div class="effect-rail">${chips.join("")}</div>` : "";
  }

  function renderPanel() {
    if (app.tab === "upgrade") return renderWeaponPanel();
    if (app.tab === "quest") return renderQuestPanel();
    if (app.tab === "weapon") return renderWeaponPanel();
    if (app.tab === "summon") return renderSummonPanel();
    if (app.tab === "heroes") return renderHeroesPanel();
    if (app.tab === "gear") return renderGearPanel();
    if (app.tab === "treasure") return renderTreasurePanel();
    if (app.tab === "shop") return renderShopPanel();
    return renderRebirthPanel();
  }

  function renderUpgradeStepControl() {
    const buttons = UPGRADE_STEP_OPTIONS.map((option) => `
      <button class="${app.upgradeStep === option.value ? "active" : ""}" data-upgrade-step="${option.value}">${option.label}</button>
    `).join("");
    return `
      <div class="upgrade-toolbar">
        <div class="upgrade-toolbar-copy">
          <strong>1회 강화량</strong>
          <span>선택한 레벨 수만큼 비용을 합산합니다.</span>
        </div>
        <div class="upgrade-stepper" role="group" aria-label="한 번에 올릴 레벨 수">
          ${buttons}
        </div>
      </div>
    `;
  }

  function renderWeaponPanel() {
    const enemy = app.enemy || enemyForStage(app.save.stage, app.save.floorKill);
    const progress = battleProgress();
    const reward = rebirthReward();
    const stats = calcStats();
    const weaponPlan = upgradePurchasePlan(app.save.weaponLevel, weaponCostAtLevel);
    const gateState = enemy.boss
        ? "보스전 진행"
        : "자동 전투";
    const rebirthLabel = reward.souls > 0 ? `환생 ${fmt(reward.souls)}영혼석` : "환생 보기";
    const upgradeValue = (type) => {
      if (type === "attack") return `주문 피해 x${Math.pow(1.11, app.save.runUpgrades.attack).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
      if (type === "attackSpeed") return `공속 x${stats.attackSpeedMult.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
      if (type === "bossBreak") return `보스 피해 +${pct(stats.bossDamagePct)}`;
      if (type === "greed") return `골드 +${Math.floor(app.save.runUpgrades[type] * 8)}%`;
      if (type === "familiar") return `동료 DPS ${fmt(stats.familiarDps)}`;
      if (type === "chainSpell") return `추가 투사체 ${pct(stats.projectileChancePct)}`;
      if (type === "weaknessMark") return `상성 피해 x${(1.32 + stats.weaknessBonusPct).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
      if (type === "soulDrain") return `영혼석 +${pct(stats.weaponEffects.soulPct)}`;
      if (type === "abyssPierce") return `고HP 보스 피해 +${pct(stats.highHpBossDamagePct)}`;
      if (type === "vanguardOrder") return `동료 피해 +${pct(stats.weaponEffects.vanguardPct)}`;
      if (type === "abyssResistance") return `압박 저항 +${pct(stats.debuffResistPct)}`;
      return "";
    };
    const spellRows = ["attack", "attackSpeed", "bossBreak", "familiar", "greed", "chainSpell", "weaknessMark", "soulDrain", "abyssPierce", "vanguardOrder", "abyssResistance"]
      .map((type) => upgradeRow({
        icon: "custom",
        art: weaponUiIcon(type),
        title: `${upgradeName(type)} Lv.${app.save.runUpgrades[type]}`,
        desc: upgradeDesc(type),
        value: upgradeValue(type),
        button: (() => {
          const plan = upgradePurchasePlan(app.save.runUpgrades[type], (level) => upgradeCostAtLevel(type, level));
          return `<button class="primary" data-upgrade="${type}" ${!canBuyUpgradePlan(plan) ? "disabled" : ""}>${actionButton(upgradePlanLabel(plan), "coin", plan.cost)}</button>`;
        })(),
        currency: "coin"
      }))
      .join("");
    return `
      ${renderUpgradeStepControl()}
      <div class="upgrade-list">
        ${upgradeRow({
          icon: "custom",
          art: weaponUiIcon("abyssGate"),
          title: "심연문",
          desc: `${progress.stage}층 ${progress.progressText} 진행 중`,
          value: gateState,
          button: `<button class="${reward.souls > 0 ? "primary" : ""}" data-tab="rebirth">${rebirthLabel}</button>`,
          currency: "soul"
        })}
        ${upgradeRow({
          icon: "custom",
          art: weaponUiIcon("runWeapon"),
          title: `${weaponName()} Lv.${app.save.weaponLevel}/99999`,
          desc: "현재 회차 기본 무기 공격력을 올립니다.",
          value: `무기 ATK ${fmt(weaponPower())}${weaponPlan.levels > 0 ? ` → ${fmt(weaponPowerAtLevel(weaponPlan.nextLevel))}` : ""}`,
          button: `<button class="primary" data-buy-weapon ${!canBuyUpgradePlan(weaponPlan) ? "disabled" : ""}>${actionButton(upgradePlanLabel(weaponPlan), "coin", weaponPlan.cost)}</button>`,
          currency: "coin"
        })}
        ${spellRows}
      </div>
    `;
  }

  function renderQuestPanel() {
    const rows = QUESTS.map((quest) => {
      const plan = upgradePurchasePlan(questLevel(quest.id), (level) => questCostAtLevel(quest.id, level));
      return upgradeRow({
        icon: "custom",
        art: questUiIcon(quest.id),
        title: `${quest.name} Lv.${questLevel(quest.id)}/99999`,
        desc: quest.desc,
        value: `퀘스트 골드: ${fmtRate(questGoldPerSecondFor(quest))} / 초${plan.levels > 0 ? ` · +${fmtRate(questGoldGainForLevels(quest, plan.levels))}/초` : ""}`,
        button: `<button class="primary" data-buy-quest="${quest.id}" ${!canBuyUpgradePlan(plan) ? "disabled" : ""}>${actionButton(upgradePlanLabel(plan), "coin", plan.cost)}</button>`,
        currency: "coin"
      });
    }).join("");
    return `
      ${renderUpgradeStepControl()}
      <div class="upgrade-list">
        ${upgradeRow({
          icon: "coin",
          title: "골드 획득",
          desc: "퀘스트 자동 수입과 접속하지 않은 시간의 보상입니다.",
          value: `${fmtRate(questGoldPerSecond())}/초 · 방치 ${fmt(app.pendingOfflineGold)} 골드`,
          button: `<button data-claim-offline ${app.pendingOfflineGold <= 0 ? "disabled" : ""}><span class="button-main">받기</span>${freeLine()}</button><button class="premium" data-rush-offline ${app.pendingOfflineGold <= 0 ? "disabled" : ""}>${actionButton("3배 받기", "diamond", ACTION_BY_ID["rush-offline-reward"].amount)}</button>`,
          currency: "coin"
        })}
        ${rows}
      </div>
    `;
  }

  function renderTreasurePanel() {
    const rows = TREASURES.map((treasure) => upgradeRow({
      icon: treasureIcon(treasure.id),
      art: catalogAsset("treasures", treasure.id),
      title: `${treasure.name} Lv.${treasureLevel(treasure.id)}(Max99999)`,
      desc: treasure.desc,
      value: treasureEffectText(treasure),
      button: `<button class="primary" data-buy-treasure="${treasure.id}" ${app.save.souls < treasureCost(treasure) ? "disabled" : ""}>${actionButton("+1 Lv", "soul", treasureCost(treasure))}</button>`,
      currency: "soul"
    })).join("");
    return `<div class="upgrade-list">${rows}</div>`;
  }

  function renderShopPanel() {
    const boost = activeBoostEffects();
    const upgradeRows = DIAMOND_UPGRADES.map((upgrade) => {
      const level = diamondUpgradeLevel(upgrade.id);
      const maxed = level >= upgrade.max;
      return upgradeRow({
        icon: "custom",
        art: shopUiIcon(upgrade.id),
        title: `${upgrade.name} Lv.${level}/${upgrade.max}`,
        desc: upgrade.desc,
        value: diamondUpgradeEffectText(upgrade),
        button: maxed
          ? `<button disabled><span class="button-main">최대</span></button>`
          : `<button class="premium" data-diamond-upgrade="${upgrade.id}">${actionButton("+1 Lv", "diamond", diamondActionAmount(upgrade.action))}</button>`,
        currency: "diamond"
      });
    }).join("");
    const consumableRows = CONSUMABLES.map((item) => upgradeRow({
      icon: "custom",
      art: shopUiIcon(item.id),
      title: `${item.name} x${fmt(consumableCount(item.id))}`,
      desc: item.desc,
      value: consumablePreviewText(item.id),
      button: `
        <button class="premium" data-buy-consumable="${item.id}">${actionButton("구매 +1", "diamond", diamondActionAmount(item.action))}</button>
        <button data-use-consumable="${item.id}" ${consumableCount(item.id) <= 0 ? "disabled" : ""}><span class="button-main">사용</span><span class="button-free">보유 ${fmt(consumableCount(item.id))}</span></button>
      `,
      currency: "diamond dual"
    })).join("");
    const skinRows = SKINS.map(renderSkinShopCard).join("");
    return `
      <div class="shop-head">
        <div>
          <h2>다이아 상점</h2>
          <p class="muted">특수능력은 환생해도 유지됩니다. 소모품은 구매 후 원하는 타이밍에 사용합니다.</p>
        </div>
        <div class="shop-diamond-badge"><span class="res-icon diamond"></span><strong>${fmt(app.walletBalance)}</strong></div>
      </div>
      ${boost.battleCatalystActive ? `<div class="shop-active-boost">전투 촉매 적용 중 · 남은 시간 ${formatDuration(boost.battleCatalystRemaining)}</div>` : ""}
      <section class="shop-section">
        <div class="shop-section-title">
          <strong>특수능력</strong>
          <span>구매 즉시 영구 적용</span>
        </div>
        <div class="upgrade-list">${upgradeRows}</div>
      </section>
      <section class="shop-section">
        <div class="shop-section-title">
          <strong>특수 소모품</strong>
          <span>구매 후 보관, 필요할 때 사용</span>
        </div>
        <div class="upgrade-list">${consumableRows}</div>
      </section>
      <section class="shop-section">
        <div class="shop-section-title">
          <strong>주인공 외형</strong>
          <span>보유 효과 누적 · 착용은 외형만 변경</span>
        </div>
        <div class="skin-summary">누적 보유 효과: ${skinSetEffectText()}</div>
        <div class="skin-shop-grid">${skinRows}</div>
      </section>
    `;
  }

  function renderSkinShopCard(skin) {
    const owned = ownsSkin(skin.id);
    const active = activeSkin().id === skin.id;
    const button = active
      ? `<button disabled><span class="button-main">착용 중</span></button>`
      : owned
        ? `<button data-equip-skin="${skin.id}"><span class="button-main">착용</span><span class="button-free">보유 효과 적용 중</span></button>`
        : `<button class="premium" data-buy-skin="${skin.id}">${actionButton("구매", "diamond", diamondActionAmount(skin.action))}</button>`;
    return `
      <div class="skin-card ${owned ? "owned" : ""} ${active ? "active" : ""}">
        <div class="skin-preview" style="--skin-primary:${skin.primary};--skin-secondary:${skin.secondary};--skin-accent:${skin.accent}" aria-hidden="true">
          ${skin.art ? `<img src="${skin.art}" alt="" loading="lazy" />` : `
            <span class="skin-hood"></span>
            <span class="skin-body"></span>
            <span class="skin-staff"></span>
          `}
        </div>
        <div class="skin-copy">
          <h3>${skin.name}</h3>
          <p>${skin.desc}</p>
          <strong>${skinEffectText(skin)}</strong>
        </div>
        <div class="skin-action">${button}</div>
      </div>
    `;
  }

  function diamondUpgradeEffectText(upgrade) {
    const level = diamondUpgradeLevel(upgrade.id);
    const current = upgrade.base * level;
    const next = upgrade.base * Math.min(upgrade.max, level + 1);
    const label = {
      attackPct: "전체 피해",
      attackSpeedPct: "공격속도",
      goldPct: "골드 획득",
      soulPct: "영혼석 획득"
    }[upgrade.effect];
    return `${label} +${pct(current)}${level < upgrade.max ? ` → +${pct(next)}` : ""}`;
  }

  function consumablePreviewText(id) {
    if (id === "battle-catalyst") return "5분 동안 전체 피해 +20% / 공격속도 +20%";
    if (id === "gold-seal") return `즉시 골드 +${fmt(instantGoldReward())}`;
    if (id === "soul-candle") return `즉시 영혼석 +${fmt(instantSoulReward())}`;
    return "";
  }

  function upgradeRow({ icon, art, title, desc, value, button, currency }) {
    const iconMarkup = art
      ? `<div class="item-icon item-sprite icon-${icon}" aria-hidden="true"><img src="${art}" alt="" onerror="this.remove()" /></div>`
      : `<div class="item-icon icon-${icon}" aria-hidden="true"></div>`;
    return `
      <div class="upgrade-item">
        ${iconMarkup}
        <div class="item-copy">
          <h3>${title}</h3>
          <p>${desc}</p>
          <strong>${value}</strong>
        </div>
        <div class="item-action ${currency}">${button}</div>
      </div>
    `;
  }

  function treasureIcon(id) {
    return {
      "evolved-signet": "relic",
      "twisted-ring": "relic",
      "storm-claw": "sword",
      "owls-crown": "crystal",
      "golden-crystal": "chest",
      "hollow-incense": "bell",
      "grave-crown": "crystal",
      "black-tithe": "book",
      "haste-gear": "bell",
      "pilgrim-chain": "relic",
      "nameless-anvil": "sword",
      "soul-hourglass": "crystal",
      "gate-lantern": "bell",
      "reserve-banner": "scroll",
      "collector-crest": "relic",
      "abyss-compass": "crystal",
      "old-contract": "book",
      "obsidian-hourglass": "bell",
      "rift-incense": "bell",
      "summoner-ledger": "book",
      "radiant-seal": "diamond",
      "purifying-mask": "crystal",
      "weakness-sigil": "relic",
      "execution-candle": "bell"
    }[id] || "relic";
  }

  function upgradeDesc(type) {
    return {
      attack: "주인공의 기본 주문 피해를 높입니다.",
      attackSpeed: "주인공과 동료의 공격 주기를 줄입니다.",
      bossBreak: "보스에게 주는 최종 피해를 높입니다.",
      familiar: "동료 피해 보정을 높입니다.",
      greed: "전투와 퀘스트 골드 획득량을 높입니다.",
      chainSpell: "주문이 일정 확률로 추가 투사체를 발사합니다.",
      weaknessMark: "적 역할 상성에 맞는 동료 공격 보너스를 높입니다.",
      soulDrain: "보스 처치와 환생으로 얻는 영혼석을 늘립니다.",
      abyssPierce: "보스 HP가 높을수록 추가 피해를 줍니다.",
      vanguardOrder: "편성 동료와 예비대 동료의 피해 기여도를 높입니다.",
      abyssResistance: "1000층 이후 적이 거는 심연 압박 디버프를 줄입니다."
    }[type];
  }

  function renderSummonPanel() {
    return `
      <div class="summon-subnav" role="group" aria-label="소환 메뉴">
        <button class="${app.summonView === "summon" ? "active" : ""}" data-summon-view="summon" aria-pressed="${app.summonView === "summon"}">
          <strong>뽑기</strong>
          <span>일반/프리미엄 소환</span>
        </button>
        <button class="${app.summonView === "codex" ? "active" : ""}" data-summon-view="codex" aria-pressed="${app.summonView === "codex"}">
          <strong>도감</strong>
          <span>수집률과 보유 효과</span>
        </button>
      </div>
      ${app.summonView === "codex" ? renderCodexPanel() : renderSummonDrawPanel()}
    `;
  }

  function renderSummonDrawPanel() {
    const normalButton = (kind, count) => {
      const cost = normalSummonCost(kind, count);
      return `<button class="primary" data-summon="normal:${kind}:${count}" ${app.save.gold < cost ? "disabled" : ""}>${actionButton(`일반 ${count}회`, "coin", cost)}</button>`;
    };
    const premiumButton = (kind, count) => {
      return `<button class="premium" data-summon="premium:${kind}:${count}">${actionButton(`프리미엄 ${count}회`, "diamond", ACTION_BY_ID[`summon-${kind}-${count}`].amount)}</button>`;
    };
    return `
      <div class="split">
        <div>
          <h2>심연 소환</h2>
          <p class="muted">골드는 일반 소환, 다이아는 프리미엄 소환입니다. 프리미엄은 Epic/Legendary 확률이 더 높습니다.</p>
        </div>
        <div class="card">
          <div class="tiny">일반 동료 천장 ${app.save.normalPity.hero}/${NORMAL_PITY} / 장비 ${app.save.normalPity.gear}/${NORMAL_PITY}</div>
          <div class="tiny">프리미엄 동료 천장 ${app.save.pity.hero}/${MAX_PITY} / 장비 ${app.save.pity.gear}/${MAX_PITY}</div>
          <div class="tiny">일반 확률 ${summonRateText("normal")}</div>
          <div class="tiny">프리미엄 확률 ${summonRateText("premium")}</div>
        </div>
      </div>
      <div class="grid cols-2">
        <div class="card summon-card">
          <div class="summon-art"><img src="${catalogAsset("heroes", "white-lantern")}" alt="" /></div>
          <div class="summon-copy">
            <h3>동료 계약</h3>
            <p class="muted">전열 3명 외의 동료도 예비대와 공명으로 반영됩니다. 승급 레벨이 오를수록 전체 보너스가 커집니다.</p>
          </div>
          <div class="summon-lanes">
            <div class="summon-lane">
              <strong>일반 뽑기</strong>
              <span>골드 사용 · 낮은 희귀 확률</span>
              <div class="row">${normalButton("hero", 1)}${normalButton("hero", 10)}</div>
            </div>
            <div class="summon-lane premium-lane">
              <strong>프리미엄 뽑기</strong>
              <span>다이아 사용 · Epic/Legendary 확률 상승</span>
              <div class="row">${premiumButton("hero", 1)}${premiumButton("hero", 10)}</div>
            </div>
          </div>
        </div>
        <div class="card summon-card">
          <div class="summon-art"><img src="${catalogAsset("gear", "king-eater")}" alt="" /></div>
          <div class="summon-copy">
            <h3>장비 의식</h3>
            <p class="muted">무기, 갑옷, 유물을 뽑아 주인공 전투력을 끌어올립니다.</p>
          </div>
          <div class="summon-lanes">
            <div class="summon-lane">
              <strong>일반 뽑기</strong>
              <span>골드 사용 · 낮은 희귀 확률</span>
              <div class="row">${normalButton("gear", 1)}${normalButton("gear", 10)}</div>
            </div>
            <div class="summon-lane premium-lane">
              <strong>프리미엄 뽑기</strong>
              <span>다이아 사용 · Epic/Legendary 확률 상승</span>
              <div class="row">${premiumButton("gear", 1)}${premiumButton("gear", 10)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function codexEntries(kind) {
    const normalized = normalizeCodexKind(kind);
    if (normalized === "heroes") {
      return HEROES.map((hero) => {
        const owned = getOwned("hero", hero.id);
        const level = owned?.level || 1;
        return {
          kind: normalized,
          id: hero.id,
          name: hero.name,
          rarity: hero.rarity,
          owned: Boolean(owned),
          image: catalogAsset("heroes", hero.id),
          meta: `${RARITIES[hero.rarity].label} / ${ROLES[hero.role].label}`,
          value: owned ? `보유 효과: ${heroOwnedEffectText(hero, level)}` : "소환에서 획득 가능",
          detail: owned ? `Lv.${level} / 조각 ${owned.shards}/${shardNeed(hero.rarity, level)}` : `기본 전투력 ${fmt(itemPowerAtLevel("hero", hero.id, 1))}`
        };
      });
    }
    if (normalized === "gear") {
      return GEARS.map((gear) => {
        const owned = getOwned("gear", gear.id);
        const level = owned?.level || 1;
        return {
          kind: normalized,
          id: gear.id,
          name: gear.name,
          rarity: gear.rarity,
          owned: Boolean(owned),
          image: catalogAsset("gear", gear.id),
          meta: `${RARITIES[gear.rarity].label} / ${slotLabel(gear.slot)}`,
          value: owned ? `장착 효과: 전투력 ${fmt(itemPower("gear", gear.id))} · ${gearOptionText(gear, owned)}` : "장비 소환에서 획득 가능",
          detail: owned ? `보유 효과: ${gearOwnedEffectText(gear, level)} / 조각 ${owned.shards}/${shardNeed(gear.rarity, level)}` : `기본 전투력 ${fmt(itemPowerAtLevel("gear", gear.id, 1))}`
        };
      });
    }
    const maxStage = Math.max(1, app.save.maxStage || app.save.stage || 1);
    const normals = ENEMY_VARIANTS.map((enemy) => {
      const zone = MONSTER_ZONE_CATALOG.find((item) => item.index === enemy.zone);
      const discovered = maxStage >= enemy.firstStage;
      return {
        kind: normalized,
        id: enemy.id,
        name: enemy.name,
        rarity: enemy.codexRarity,
        owned: discovered,
        monsterType: "normal",
        role: enemy.role,
        sprite: monsterSpriteData(enemy, "normal"),
        meta: `${zone?.theme || "심연"} / ${enemy.tier === "weak" ? "약한 잡몹" : "일반 잡몹"} / ${ROLES[enemy.role].label}`,
        value: enemy.visualKeywords || "심연 진행 중 반복 출현하는 일반 적입니다.",
        detail: discovered ? `${enemy.firstStage}층권 발견` : `${enemy.firstStage}층부터 발견 가능`
      };
    });
    const bossTypeLabels = { floor: "층 보스", gate: "10층 관문 보스", apex: "100층 심층 보스", final: "최종 보스" };
    const bosses = BOSS_VARIANTS.map((boss) => {
      const zone = MONSTER_ZONE_CATALOG.find((item) => item.index === boss.zone);
      const requiredStage = boss.firstStage || zone?.start || 1;
      return {
        kind: normalized,
        id: boss.id,
        name: boss.name,
        rarity: boss.codexRarity,
        owned: maxStage >= requiredStage,
        monsterType: "boss",
        role: boss.role,
        sprite: monsterSpriteData(boss, "boss"),
        meta: `${zone?.theme || "심연"} / ${bossTypeLabels[boss.type] || "보스"} / ${ROLES[boss.role].label}`,
        value: "각 구간에서 성장 속도를 시험하는 강한 적입니다.",
        detail: maxStage >= requiredStage ? `${requiredStage}층 보스 발견` : `${requiredStage}층에서 발견 가능`
      };
    });
    return [...normals, ...bosses];
  }

  function codexSummary(kind) {
    const entries = codexEntries(kind);
    const owned = entries.filter((entry) => entry.owned).length;
    return {
      owned,
      total: entries.length,
      ratio: entries.length ? owned / entries.length : 0
    };
  }

  function renderCodexFilterButton(option) {
    const summary = codexSummary(option.value);
    const active = normalizeCodexKind(app.codexKind) === option.value;
    return `
      <button class="${active ? "active" : ""}" data-codex-kind="${option.value}" aria-pressed="${active}">
        <strong>${option.label}</strong>
        <span>${summary.owned}/${summary.total}</span>
      </button>
    `;
  }

  function renderCodexPanel() {
    const kind = normalizeCodexKind(app.codexKind);
    if (app.codexKind !== kind) app.codexKind = kind;
    const entries = codexEntries(kind);
    const summary = codexSummary(kind);
    const currentLabel = CODEX_KIND_FILTERS.find((option) => option.value === kind)?.label || "도감";
    return `
      <div class="codex-head">
        <div>
          <h2>심연 도감</h2>
          <p class="muted">수집한 항목의 보유 효과와 발견 진행도를 확인합니다. 도감은 별도 하단 탭 없이 소환 탭 안에서 관리합니다.</p>
        </div>
        <div class="codex-progress">
          <strong>${currentLabel} ${summary.owned}/${summary.total}</strong>
          <span>${Math.round(summary.ratio * 100)}%</span>
          <i style="--codex-progress:${summary.ratio}"></i>
        </div>
      </div>
      <div class="codex-filter" role="group" aria-label="도감 분류">
        ${CODEX_KIND_FILTERS.map(renderCodexFilterButton).join("")}
      </div>
      <div class="codex-groups">
        ${renderCodexGroups(entries)}
      </div>
    `;
  }

  function renderCodexGroups(entries) {
    return CODEX_RARITY_ORDER.map((rarity) => {
      const groupEntries = entries.filter((entry) => entry.rarity === rarity);
      if (groupEntries.length === 0) return "";
      const owned = groupEntries.filter((entry) => entry.owned).length;
      return `
        <section class="codex-rarity-section rarity-${rarity}">
          <div class="codex-rarity-head">
            <strong>${RARITIES[rarity].label}</strong>
            <span>${owned}/${groupEntries.length}</span>
          </div>
          <div class="codex-grid">
            ${groupEntries.map(renderCodexCard).join("")}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderCodexCard(entry) {
    const locked = !entry.owned;
    const displayName = locked && entry.kind === "monsters" ? "미발견" : entry.name;
    const status = locked ? (entry.kind === "monsters" ? "미발견" : "미획득") : "보유";
    const tooltip = [
      displayName,
      entry.meta,
      entry.value,
      entry.detail
    ].filter(Boolean).join("\n");
    const art = entry.sprite
      ? codexMonsterSpriteTag(entry.sprite, locked)
      : entry.image
      ? catalogImgTag(entry.kind === "gear" ? "gear" : "heroes", entry.id, displayName)
      : `<span>${entry.monsterType === "boss" ? "B" : "M"}</span>`;
    const artClass = entry.sprite ? `monster sprite-monster role-${entry.role || "dps"}` : entry.image ? "" : `monster role-${entry.role || "dps"}`;
    return `
      <article class="codex-card rarity-${entry.rarity} ${locked ? "locked" : "owned"}" tabindex="0" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">
        <div class="codex-art ${artClass}">
          ${art}
        </div>
        <strong class="codex-card-name">${escapeHtml(displayName)}</strong>
        <span class="codex-card-status">${escapeHtml(status)}</span>
      </article>
    `;
  }

  function renderHeroesPanel() {
    const equipped = new Set(app.save.equippedHeroes);
    const treasures = treasureEffects();
    const roster = heroRosterSummary(treasures.ownedEffectPct, treasures.reserveDpsPct + equippedGearEffect("reserveDpsPct"));
    const cards = Object.keys(app.save.ownedHeroes)
      .sort((a, b) => itemPower("hero", b) - itemPower("hero", a))
      .map((id) => {
        const hero = getData("hero", id);
        const owned = getOwned("hero", id);
        const isEquipped = equipped.has(id);
        const influence = heroInfluence(hero, owned);
        return `
          <div class="card collection-card rarity-${hero.rarity} ${isEquipped ? "selected" : ""}">
            <div class="collection-art">${catalogImgTag("heroes", id, hero.name)}</div>
            <div class="collection-copy">
              <h3 class="${rarityClass(hero.rarity)}">${hero.name} Lv.${owned.level}</h3>
              <p class="tiny">${RARITIES[hero.rarity].label} / <span class="${roleClass(hero.role)}">${ROLES[hero.role].label}</span> / 전투력 ${fmt(itemPower("hero", id))}</p>
              <p class="muted">${isEquipped ? "편성 효과 적용 중: 전투력 100%" : `예비대 효과: 전투력의 ${pct(roster.reserveShare)}를 DPS로 적용`} · ${ROLES[hero.role].bonus}</p>
              <p class="tiny">보유 효과: ${heroOwnedEffectText(hero, owned.level)}</p>
              ${heroGrowthEffectLines(id)}
              <div class="tiny">${shardProgressText(hero, owned)}</div>
              <div class="tiny">공명 영향 ${influence.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</div>
              <button data-equip-hero="${id}">${isEquipped ? "편성 해제" : "편성"}</button>
            </div>
          </div>
        `;
      })
      .join("");
    return `
      <div class="split">
        <div>
          <h2>동료 편성</h2>
          <p class="muted">전열 3명은 직접 전투하고, 나머지 보유 동료는 예비대와 공명으로 항상 성장에 기여합니다.</p>
        </div>
        <button data-auto-heroes>추천 편성</button>
      </div>
      <div class="card">
        <h3>동료 공명</h3>
        <p class="muted">조각이 차면 Lv+1 됩니다. Lv+1은 편성 효과와 보유 효과를 함께 올립니다.</p>
        <div class="grid cols-4">
          <p class="tiny">수집 ${roster.uniqueCount}/${HEROES.length}</p>
          <p class="tiny">총 레벨 ${fmt(roster.totalLevels)}</p>
          <p class="tiny">승급 레벨 ${fmt(roster.duplicateLevels)}</p>
          <p class="tiny">예비대 DPS ${fmtRate(roster.reserveDps)} (${pct(roster.reserveShare)})</p>
          <p class="tiny">도감 공격 +${pct(roster.attackPct)}</p>
          <p class="tiny">희귀도 도감 +${pct(roster.rarityBonus)}</p>
          <p class="tiny">탱커 보스피해 +${pct(roster.tankBossPct)}</p>
          <p class="tiny">딜러 피해 +${pct(roster.dpsPct)}</p>
          <p class="tiny">지원 골드 +${pct(roster.goldPct)}</p>
          <p class="tiny">저주 보스피해 +${pct(roster.bossDamagePct)}</p>
        </div>
      </div>
      <div class="grid cols-3">${cards}</div>
    `;
  }

  function renderLegacyGearPanel() {
    const equipped = new Set(Object.values(app.save.equippedGear).filter(Boolean));
    const slotOrder = ["weapon", "armor", "relic"];
    const ownedIds = Object.keys(app.save.ownedGear).sort((a, b) => itemPower("gear", b) - itemPower("gear", a));
    const renderCard = (id) => {
        const gear = getData("gear", id);
        const owned = getOwned("gear", id);
        return `
          <div class="card collection-card rarity-${gear.rarity} ${equipped.has(id) ? "selected" : ""}">
            <div class="collection-art">${catalogImgTag("gear", id, gear.name)}</div>
            <div class="collection-copy">
              <h3 class="${rarityClass(gear.rarity)}">${gear.name} Lv.${owned.level}</h3>
              <p class="tiny">${RARITIES[gear.rarity].label} / ${slotLabel(gear.slot)} / 전투력 ${fmt(itemPower("gear", id))}</p>
              <p class="tiny">${gearOptionText(gear, owned)}</p>
              <div class="tiny">${shardProgressText(gear, owned)}</div>
              <button data-equip-gear="${id}">${equipped.has(id) ? "장착 중" : "장착"}</button>
            </div>
          </div>
        `;
      };
    const sections = slotOrder
      .map((slot) => {
        const slotIds = ownedIds.filter((id) => getData("gear", id).slot === slot);
        const equippedId = app.save.equippedGear[slot];
        const equippedText = equippedId ? `장착 ${getData("gear", equippedId).name}` : "장착 없음";
        const cards = slotIds.map(renderCard).join("");
        return `
          <section class="gear-section">
            <div class="gear-section-head">
              <strong>${slotLabel(slot)}</strong>
              <span>${slotIds.length}개 보유 · ${equippedText}</span>
            </div>
            <div class="grid cols-3 gear-grid">
              ${cards || `<div class="gear-empty">아직 보유한 ${slotLabel(slot)} 장비가 없습니다.</div>`}
            </div>
          </section>
        `;
      })
      .join("");
    return `
      <div class="split">
        <div>
          <h2>장비</h2>
          <p class="muted">무기, 갑옷, 유물 3개 슬롯이 주인공의 기본 전투력을 올립니다.</p>
        </div>
        <button data-auto-gear>추천 장비</button>
      </div>
      <div class="gear-sections">${sections}</div>
    `;
  }

  function renderGearSlotFilters(ownedIds) {
    return `
      <div class="gear-slot-filter" role="group" aria-label="장비 부위 선택">
        ${GEAR_SLOT_FILTERS.map((option) => {
          const count = ownedIds.filter((id) => getData("gear", id).slot === option.value).length;
          const active = app.gearSlotFilter === option.value;
          return `
            <button class="${active ? "active" : ""}" data-gear-slot-filter="${option.value}" aria-pressed="${active}">
              <strong>${option.label}</strong>
              <span>${count}개</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderGearPanel() {
    const equipped = new Set(Object.values(app.save.equippedGear).filter(Boolean));
    const ownedIds = Object.keys(app.save.ownedGear).sort((a, b) => itemPower("gear", b) - itemPower("gear", a));
    const activeSlot = normalizeGearSlotFilter(app.gearSlotFilter);
    if (app.gearSlotFilter !== activeSlot) app.gearSlotFilter = activeSlot;
    const slotIds = ownedIds.filter((id) => getData("gear", id).slot === activeSlot);
    const equippedId = app.save.equippedGear[activeSlot];
    const equippedText = equippedId ? `장착 ${getData("gear", equippedId).name}` : "장착 없음";
    const cards = slotIds.map((id) => {
      const gear = getData("gear", id);
      const owned = getOwned("gear", id);
      return `
        <div class="card collection-card rarity-${gear.rarity} ${equipped.has(id) ? "selected" : ""}">
          <div class="collection-art">${catalogImgTag("gear", id, gear.name)}</div>
          <div class="collection-copy">
            <h3 class="${rarityClass(gear.rarity)}">${gear.name} Lv.${owned.level}</h3>
            <p class="tiny">${RARITIES[gear.rarity].label} / ${slotLabel(gear.slot)} / 전투력 ${fmt(itemPower("gear", id))}</p>
            <p class="tiny">장착 효과: 전투력 ${fmt(itemPower("gear", id))} · ${gearOptionText(gear, owned)}</p>
            <p class="tiny">보유 효과: ${gearOwnedEffectText(gear, owned.level)}</p>
            ${gearGrowthEffectLines(id)}
            <div class="tiny">${shardProgressText(gear, owned)}</div>
            <button data-equip-gear="${id}">${equipped.has(id) ? "장착 중" : "장착"}</button>
          </div>
        </div>
      `;
    }).join("");
    return `
      <div class="split">
        <div>
          <h2>장비</h2>
          <p class="muted">조각이 차면 Lv+1 됩니다. Lv+1은 장착 효과와 보유 효과를 함께 올립니다.</p>
        </div>
        <button data-auto-gear>추천 장비</button>
      </div>
      ${renderGearSlotFilters(ownedIds)}
      <div class="gear-sections">
        <section class="gear-section">
          <div class="gear-section-head">
            <strong>${slotLabel(activeSlot)}</strong>
            <span>${slotIds.length}개 보유 · ${equippedText}</span>
          </div>
          <div class="grid cols-3 gear-grid">
            ${cards || `<div class="gear-empty">아직 보유한 ${slotLabel(activeSlot)} 장비가 없습니다.</div>`}
          </div>
        </section>
      </div>
    `;
  }

  function slotLabel(slot) {
    return { weapon: "무기", armor: "갑옷", relic: "유물" }[slot];
  }

  function renderRebirthPanel() {
    const reward = rebirthReward();
    return `
      <div class="grid cols-2">
        <div class="card">
          <h2>환생</h2>
          <p class="muted">막히면 1층으로 돌아가 영혼석을 얻습니다. 동료, 장비, 보물, 천장 카운트는 유지됩니다.</p>
          <p>예상 보상: <strong>${fmt(reward.souls)} 영혼석</strong></p>
          <button class="warn" data-rebirth ${reward.souls <= 0 ? "disabled" : ""}>환생하기</button>
        </div>
        <div class="card">
          <h2>누적 기록</h2>
          <p class="tiny">최고 층 ${app.save.maxStage}</p>
          <p class="tiny">처치 ${app.save.stats.monstersKilled}마리 / 클리어 ${app.save.stats.floorsCleared}층</p>
          <p class="tiny">환생 ${app.save.rebirths}회</p>
          <p class="tiny">보스 처치 ${app.save.stats.bossesKilled}회</p>
          <p class="tiny">누적 영혼석 ${fmt(app.save.stats.soulsEarned)}</p>
          <p class="tiny">누적 소환 ${app.save.stats.totalSummons}회</p>
          <p class="tiny">최고 전투력 ${fmt(app.save.stats.bestPower)}</p>
        </div>
      </div>
      <div class="card" style="margin-top:10px">
        <h3>최근 기록</h3>
        ${app.log.map((line) => `<p class="tiny">${line}</p>`).join("")}
      </div>
    `;
  }

  function draw() {
    resizeCanvas();
    ctx.imageSmoothingEnabled = false;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    drawBackground(width, height);
    drawBattle(width, height);
    requestAnimationFrame(draw);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * scale);
    const height = Math.floor(rect.height * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function drawBackground(width, height) {
    const cssWidth = width / (window.devicePixelRatio || 1);
    const cssHeight = height / (window.devicePixelRatio || 1);
    const activeBackground = battleBackgroundForStage(app.save.stage);
    const battleBgImage = activeBackground && activeBackground.image;
    if (battleBgImage.complete && battleBgImage.naturalWidth > 0) {
      const sourceRatio = battleBgImage.naturalWidth / battleBgImage.naturalHeight;
      const targetRatio = cssWidth / cssHeight;
      let sx = 0;
      let sy = 0;
      let sw = battleBgImage.naturalWidth;
      let sh = battleBgImage.naturalHeight;
      if (sourceRatio > targetRatio) {
        sw = battleBgImage.naturalHeight * targetRatio;
        sx = (battleBgImage.naturalWidth - sw) / 2;
      } else {
        sh = battleBgImage.naturalWidth / targetRatio;
        sy = Math.max(0, (battleBgImage.naturalHeight - sh) * 0.36);
      }
      ctx.drawImage(battleBgImage, sx, sy, sw, sh, 0, 0, cssWidth, cssHeight);
      const shade = ctx.createLinearGradient(0, 0, 0, cssHeight);
      shade.addColorStop(0, "rgba(3, 6, 9, 0.36)");
      shade.addColorStop(0.58, "rgba(3, 6, 9, 0.02)");
      shade.addColorStop(1, "rgba(3, 6, 9, 0.42)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      return;
    }
    const gradient = ctx.createLinearGradient(0, 0, cssWidth, cssHeight);
    gradient.addColorStop(0, "#26383d");
    gradient.addColorStop(0.48, "#16272d");
    gradient.addColorStop(1, "#0b1519");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.fillStyle = "rgba(255,255,255,0.045)";
    for (let y = 34; y < cssHeight * 0.64; y += 26) {
      for (let x = (y / 26) % 2 ? -36 : 0; x < cssWidth; x += 72) {
        ctx.fillRect(Math.floor(x), Math.floor(y), 38, 3);
      }
    }

    for (let x = 26; x < cssWidth; x += 128) {
      ctx.fillStyle = "rgba(10,18,22,0.62)";
      ctx.fillRect(x, 62, 18, cssHeight * 0.6);
      ctx.fillRect(x - 7, 58, 32, 6);
      ctx.fillStyle = "rgba(245,199,106,0.72)";
      ctx.fillRect(x + 3, 70, 12, 16);
      ctx.fillStyle = "rgba(245,199,106,0.16)";
      ctx.fillRect(x - 10, 64, 38, 32);
    }

    ctx.fillStyle = "#11191d";
    ctx.fillRect(0, cssHeight * 0.62, cssWidth, cssHeight * 0.38);
    ctx.fillStyle = "#1c2b31";
    for (let x = 0; x < cssWidth; x += 38) {
      ctx.fillRect(x, cssHeight * 0.62, 22, 3);
      ctx.fillRect(x + 12, cssHeight * 0.78, 18, 3);
    }
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 79) % cssWidth;
      const y = cssHeight * 0.66 + ((i * 23) % Math.max(20, cssHeight * 0.28));
      ctx.fillRect(Math.floor(x), Math.floor(y), 5 + (i % 3) * 4, 3);
    }
  }

  function drawBattle(width, height) {
    const ratio = window.devicePixelRatio || 1;
    const w = width / ratio;
    const h = height / ratio;
    const t = performance.now() * 0.001;
    const stats = calcStats();
    const enemy = app.enemy || enemyForStage(app.save.stage, app.save.floorKill);
    const compact = w < 430;
    const heroX = w * (compact ? 0.29 : 0.24);
    const enemyX = w * (compact ? 0.7 : 0.78);
    const floorY = h * 0.73;
    const bob = app.settings.reducedMotion ? 0 : 1;

    app.save.equippedHeroes.forEach((id, index) => {
      const hero = getData("hero", id);
      if (!hero) return;
      const slot = companionBattleSlot(heroX, index, compact);
      drawCompanion(slot.x, floorY + slot.y + Math.sin(t * 3 + index) * 3 * bob, hero, id, slot.scale);
    });
    drawSummoner(heroX, floorY, activeSkin());

    drawEnemy(enemyX, floorY - 4 + Math.sin(t * 2) * 3 * bob, enemy);
    drawProjectiles(heroX, enemyX, floorY, t, compact);

    drawHitImpacts(enemyX, floorY);
    drawDamageTexts(enemyX, floorY, compact);
    drawCombatStatusPanel(w, floorY, enemy, stats, compact);

    app.attackFlash = Math.max(0, app.attackFlash - 0.016);
    app.enemyFlash = Math.max(0, app.enemyFlash - 0.016);
  }

  function companionBattleSlot(heroX, index, compact) {
    const slots = compact
      ? [
          { x: -56, y: 24, scale: 1 },
          { x: -22, y: -38, scale: 1 },
          { x: 52, y: 12, scale: 1 }
        ]
      : [
          { x: -84, y: 24, scale: 1 },
          { x: -46, y: -48, scale: 1 },
          { x: 74, y: 12, scale: 1 }
        ];
    const slot = slots[index] || slots[slots.length - 1];
    return { x: heroX + slot.x, y: slot.y, scale: slot.scale };
  }

  function drawCombatStatusPanel(w, floorY, enemy, stats, compact) {
    const panelW = Math.min(compact ? 216 : 260, w * 0.48);
    const panelH = 52;
    const panelX = Math.round(w - panelW - (compact ? 10 : 14));
    const panelY = Math.round(floorY + 34);
    const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
    const bossBonus = enemy.boss ? 1 + stats.bossDamagePct : 1;
    const effectiveDps = damageAfterEnemyDebuff(stats.dps * bossBonus * bossHighHpMultiplier(enemy, stats) * bossLowHpMultiplier(enemy, stats), enemy, stats);
    const enemyLabel = enemy.name.length > 8 ? `${enemy.name.slice(0, 8)}…` : enemy.name;
    const enemyKind = enemy.apexBoss ? "100층 보스" : enemy.gateBoss ? "10층 보스" : enemy.boss ? "층 보스" : "일반";
    const roleLabel = ROLES[enemy.role].label;

    ctx.save();
    ctx.fillStyle = "rgba(7, 10, 12, 0.82)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(245, 199, 106, 0.48)";
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    ctx.textBaseline = "alphabetic";
    ctx.font = `800 ${compact ? 10 : 11}px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#f6efe7";
    ctx.fillText(`${enemyKind} · ${roleLabel}`, panelX + 10, panelY + 15);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f5c76a";
    ctx.fillText(enemyLabel, panelX + panelW - 10, panelY + 15);

    ctx.fillStyle = "#2b1115";
    ctx.fillRect(panelX + 9, panelY + 22, panelW - 18, 8);
    ctx.fillStyle = enemy.boss ? "#fb7185" : "#f5c76a";
    ctx.fillRect(panelX + 9, panelY + 22, (panelW - 18) * hpPct, 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(panelX + 9, panelY + 22, panelW - 18, 2);

    ctx.fillStyle = "#f6efe7";
    ctx.textAlign = "left";
    ctx.font = `900 ${compact ? 10 : 11}px sans-serif`;
    ctx.fillText(`실전 DPS ${fmt(effectiveDps)}`, panelX + 10, panelY + 44);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f5c76a";
    ctx.fillText(`HP ${pct(hpPct, 0)} · 치명 ${pct(stats.critChancePct, 0)}`, panelX + panelW - 10, panelY + 44);
    ctx.restore();
  }

  function shouldFlipSprite(sourceFacing, targetFacing) {
    return Boolean(sourceFacing && targetFacing && sourceFacing !== targetFacing);
  }

  function drawSheetSprite(image, spec, frame, x, y, height, options = {}) {
    if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return false;
    }

    const safeFrame = frame % spec.frameCount;
    const col = safeFrame % spec.cols;
    const row = Math.floor(safeFrame / spec.cols);
    const cellWidth = image.naturalWidth / spec.cols;
    const cellHeight = image.naturalHeight / spec.rows;
    const width = height * (cellWidth / cellHeight);
    const previousSmoothing = ctx.imageSmoothingEnabled;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.filter) {
      ctx.filter = options.filter;
    }
    if (options.flipX) {
      ctx.translate(Math.round(x), 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      image,
      col * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight,
      options.flipX ? Math.round(-width / 2) : Math.round(x - width / 2),
      Math.round(y - height),
      Math.round(width),
      Math.round(height)
    );
    ctx.restore();
    ctx.imageSmoothingEnabled = previousSmoothing;
    return true;
  }

  function drawImageSprite(image, x, y, height, options = {}) {
    if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return false;
    }

    const width = height * (image.naturalWidth / image.naturalHeight);
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (options.filter) {
      ctx.filter = options.filter;
    }
    if (options.flipX) {
      ctx.translate(Math.round(x), 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      image,
      options.flipX ? Math.round(-width / 2) : Math.round(x - width / 2),
      Math.round(y - height),
      Math.round(width),
      Math.round(height)
    );
    ctx.restore();
    ctx.imageSmoothingEnabled = previousSmoothing;
    return true;
  }

  function drawSummoner(x, y, skin) {
    const currentSkin = skin || SKINS[0];
    const frame = Math.floor(performance.now() / 180) % SPRITES.skinSummoner.frameCount;
    if (drawSheetSprite(skinIdleSheet(currentSkin), SPRITES.skinSummoner, frame, x, y + 6, SPRITES.skinSummoner.height)) {
      return;
    }
    if (drawImageSprite(skinImage(currentSkin), x, y + 6, SPRITES.skinSummoner.height)) {
      return;
    }

    const fallbackFrame = frame % SPRITES.summoner.frameCount;
    const flipX = shouldFlipSprite(SPRITE_SOURCE_FACING.summoner, "right");
    const filter = currentSkin?.filter && currentSkin.filter !== "none" ? currentSkin.filter : "";
    if (drawSheetSprite(summonerSpriteSheet, SPRITES.summoner, fallbackFrame, x, y + 6, SPRITES.summoner.height, { flipX, filter })) {
      drawSummonerSkinAccent(x, y, currentSkin);
      return;
    }

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flipX) ctx.scale(-1, 1);
    ctx.fillStyle = "#0b0d10";
    ctx.fillRect(-22, -60, 44, 70);
    ctx.fillStyle = currentSkin?.primary || "#d7c1a7";
    ctx.fillRect(-14, -82, 28, 24);
    ctx.fillStyle = "#f6efe7";
    ctx.fillRect(-18, -78, 36, 8);
    ctx.fillStyle = currentSkin?.secondary || "#273039";
    ctx.fillRect(-18, -56, 36, 54);
    ctx.fillStyle = currentSkin?.accent || "#d33c3c";
    ctx.fillRect(-24, -50, 10, 38);
    ctx.fillStyle = "#f5c76a";
    ctx.fillRect(22, -78, 7, 86);
    ctx.fillRect(17, -72, 17, 7);
    ctx.fillStyle = "#fff4b6";
    ctx.fillRect(24, -86, 3, 14);
    ctx.restore();
  }

  function drawSummonerSkinAccent(x, y, skin) {
    if (!skin || skin.id === "base") return;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = skin.accent || "#f5c76a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.round(x + 30), Math.round(y - 84));
    ctx.lineTo(Math.round(x + 43), Math.round(y - 92));
    ctx.stroke();
    ctx.fillStyle = skin.primary || "#f5c76a";
    ctx.fillRect(Math.round(x - 26), Math.round(y - 48), 5, 31);
    ctx.restore();
  }

  function drawCompanion(x, y, hero, heroId, scale = 1) {
    const color = RARITIES[hero.rarity].color;
    const frame = companionSpriteFrame(hero);
    const flipX = shouldFlipSprite(SPRITE_SOURCE_FACING.companion, "right");
    const height = SPRITES.companions.height * scale;

    if (drawSheetSprite(companionSpriteSheet, SPRITES.companions, frame, x, y + 4, height, { flipX })) {
      return;
    }

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flipX) ctx.scale(-1, 1);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#0b0d10";
    ctx.fillRect(-12, -45, 24, 43);
    ctx.fillStyle = color;
    ctx.fillRect(-10, -58, 20, 18);
    ctx.fillStyle = "#273039";
    ctx.fillRect(-10, -38, 20, 34);
    ctx.fillStyle = color;
    ctx.fillRect(-14, -24, 5, 18);
    ctx.fillRect(9, -24, 5, 18);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(-5, -52, 4, 4);
    ctx.fillRect(4, -52, 4, 4);
    ctx.restore();
  }

  function drawEnemy(x, y, enemy) {
    const normalScaleBoost = enemy.tier === "weak" ? 1.24 : 1.14;
    const baseScale = (enemy.visualScale || 1) * (enemy.apexBoss ? 1.35 : enemy.boss ? 1.18 : normalScaleBoost);
    const flash = app.enemyFlash > 0;
    const frame = enemy.frame ?? ENEMY_SPRITE_BY_ROLE[enemy.role] ?? 0;
    const spriteSpec = enemy.boss ? SPRITES.bosses : SPRITES.enemies;
    const spriteSheet = enemy.boss ? bossSpriteSheet : enemySpriteSheet;
    const minNormalHeight = Math.max(SPRITES.companions.height * 1.5, SPRITES.enemies.height * 1.3);
    const height = enemy.boss ? spriteSpec.height * baseScale : Math.max(spriteSpec.height * baseScale, minNormalHeight);
    const scale = height / spriteSpec.height;
    const flipX = shouldFlipSprite(SPRITE_SOURCE_FACING.enemy, "left");
    const baseFilter = enemy.spriteFilter && enemy.spriteFilter !== "none" ? enemy.spriteFilter : "";
    const spriteFilter = [baseFilter, flash ? "brightness(2.1)" : ""].filter(Boolean).join(" ");

    ctx.save();
    if (drawSheetSprite(spriteSheet, spriteSpec, frame, x, y + 8, height, { flipX, filter: spriteFilter })) {
      ctx.restore();
      drawEnemyAccent(x, y, enemy, scale);
      return;
    }
    ctx.restore();

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flipX) ctx.scale(-1, 1);
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? "#ffffff" : enemy.boss ? "#9b1f28" : "#708189";
    ctx.fillRect(-24, -70, 48, 28);
    ctx.fillRect(-18, -42, 36, 46);
    ctx.fillStyle = flash ? "#f6efe7" : enemy.boss ? "#cf3844" : "#b8c5c4";
    ctx.fillRect(-15, -66, 10, 10);
    ctx.fillRect(5, -66, 10, 10);
    ctx.fillStyle = "#11191d";
    ctx.fillRect(-9, -54, 18, 5);
    ctx.fillStyle = enemy.boss ? "#f5c76a" : "#6b7780";
    ctx.fillRect(-30, -36, 10, 34);
    ctx.fillRect(20, -36, 10, 34);
    ctx.fillRect(-12, 4, 8, 16);
    ctx.fillRect(6, 4, 8, 16);
    if (enemy.gateBoss) {
      ctx.fillStyle = "#f5c76a";
      ctx.fillRect(-26, -82, 52, 6);
      ctx.fillRect(-18, -88, 8, 8);
      ctx.fillRect(10, -88, 8, 8);
    }
    ctx.restore();
    drawEnemyAccent(x, y, enemy, scale);
  }

  function drawEnemyAccent(x, y, enemy, scale) {
    if (!enemy.boss) return;
    const bossScale = Math.max(1, scale);
    const markerHeight = (enemy.apexBoss ? 40 : enemy.gateBoss ? 36 : 32) * Math.min(1.35, bossScale);
    const markerBottom = y - (enemy.apexBoss ? 104 : enemy.gateBoss ? 98 : 94) * bossScale;
    drawImageSprite(bossMarkerSkullImage, x, markerBottom, markerHeight);
  }

  function drawProjectiles(heroX, enemyX, y, t, compact) {
    if (app.projectiles.length === 0) return;
    ctx.save();
    app.projectiles.forEach((projectile) => {
      const progressRaw = Math.min(1, projectile.elapsed / projectile.duration);
      const progress = progressRaw * progressRaw * (3 - progressRaw * 2);
      const sourceIndex = Math.max(0, projectile.sourceIndex || 0);
      const companionSlot = companionBattleSlot(heroX, sourceIndex, compact);
      const fromX = projectile.source === "summoner" ? heroX + 36 : companionSlot.x + 20;
      const fromY = projectile.source === "summoner" ? y - 66 : y + companionSlot.y - 42;
      const targetX = enemyX - 42;
      const targetY = y - 52 + projectile.yOffset;
      const x = fromX + (targetX - fromX) * progress;
      const arc = app.settings.reducedMotion ? -4 : -18;
      const yy = fromY + (targetY - fromY) * progress + Math.sin(progress * Math.PI) * arc;
      const alpha = 0.74 + Math.sin(progressRaw * Math.PI) * 0.22;
      ctx.globalAlpha = alpha;
      if (projectile.source === "summoner") {
        const frame = Math.floor((t * 9 + projectile.id) % SPRITES.attackBolt.frameCount);
        if (!drawSheetSprite(attackBoltSpriteSheet, SPRITES.attackBolt, frame, x, yy + projectile.height * 0.5, projectile.height)) {
          drawProjectileFallback(x, yy, projectile.color, projectile.height);
        }
      } else {
        const frame = projectile.projectileFrame ?? ROLE_PROJECTILE_FRAME[projectile.role] ?? 0;
        if (!drawSheetSprite(companionProjectileSpriteSheet, SPRITES.companionProjectile, frame, x, yy + projectile.height * 0.5, projectile.height)) {
          drawProjectileFallback(x, yy, projectile.color, projectile.height);
        }
      }
    });
    ctx.restore();
  }

  function drawProjectileFallback(x, y, color, height) {
    ctx.save();
    ctx.fillStyle = color || "#f5c76a";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), height * 0.5, height * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHitImpacts(enemyX, y) {
    if (app.hitImpacts.length === 0) return;
    ctx.save();
    app.hitImpacts.forEach((impact, index) => {
      const progress = Math.min(1, impact.elapsed / impact.duration);
      const frame = Math.min(SPRITES.hitImpact.frameCount - 1, Math.floor(progress * SPRITES.hitImpact.frameCount));
      ctx.globalAlpha = 0.86 * (1 - progress * 0.35);
      const x = enemyX - 38 + ((index * 11) % 19) - 9;
      const yy = y - 48 + impact.yOffset;
      const impactScale = impact.critical ? 1.08 : 1;
      if (!drawSheetSprite(hitImpactSpriteSheet, SPRITES.hitImpact, frame, x, yy, SPRITES.hitImpact.height * (0.82 + progress * 0.25) * impactScale)) {
        ctx.fillStyle = impact.color || "#f5c76a";
        ctx.beginPath();
        ctx.arc(x, yy - 22, (8 + progress * 9) * impactScale, 0, Math.PI * 2);
        ctx.fill();
      }
      if (impact.critical) {
        const cx = x;
        const cy = yy - 24;
        const radius = 10 + progress * 18;
        ctx.globalAlpha = 0.62 * (1 - progress);
        ctx.strokeStyle = "rgba(255, 224, 138, 0.92)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        const slashAlpha = Math.max(0, 1 - progress / 0.68);
        if (slashAlpha > 0) {
          const cut = 1 - progress * 0.24;
          ctx.lineCap = "round";
          ctx.globalAlpha = 0.88 * slashAlpha;
          ctx.strokeStyle = "rgba(255, 246, 189, 0.95)";
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(cx - 18 * cut, cy + 10 * cut);
          ctx.lineTo(cx + 16 * cut, cy - 9 * cut);
          ctx.moveTo(cx - 9 * cut, cy + 16 * cut);
          ctx.lineTo(cx + 20 * cut, cy - 1 * cut);
          ctx.stroke();
          ctx.globalAlpha = 0.9 * slashAlpha;
          ctx.strokeStyle = "rgba(245, 158, 11, 0.92)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 16 * cut, cy + 9 * cut);
          ctx.lineTo(cx + 14 * cut, cy - 8 * cut);
          ctx.moveTo(cx - 7 * cut, cy + 14 * cut);
          ctx.lineTo(cx + 17 * cut, cy);
          ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  function drawDamageTexts(enemyX, y, compact) {
    if (!app.settings.damageNumbers) return;
    if (app.damageTexts.length === 0) return;
    ctx.save();
    ctx.textAlign = "center";
    app.damageTexts.forEach((text) => {
      const progress = Math.min(1, text.elapsed / text.duration);
      const isCritical = Boolean(text.critical);
      const lane = Math.max(0, Number(text.lane) || 0);
      const x = enemyX - 36 + text.xJitter + (isCritical ? (lane - 1.5) * 9 + Math.sin(progress * Math.PI) * 4 : 0);
      const rise = isCritical ? 38 : 34;
      const yy = y - 78 + text.yOffset - progress * rise - (isCritical ? lane * 5 : 0);
      ctx.globalAlpha = isCritical ? 1 - progress * 0.85 : 1 - progress;
      const fontSize = isCritical ? compact ? 26 : 31 : compact ? 18 : 22;
      const amountText = fmt(text.amount);
      ctx.font = `900 ${fontSize}px monospace`;
      ctx.lineWidth = isCritical ? 6 : 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.78)";
      if (isCritical) {
        const width = ctx.measureText(amountText).width;
        const sparkX = x - width * 0.5 - 9;
        const sparkY = yy - fontSize * 0.34;
        const spark = Math.max(0, 1 - progress * 1.5);
        if (spark > 0) {
          ctx.save();
          ctx.globalAlpha *= spark;
          ctx.strokeStyle = "rgba(255, 232, 138, 0.95)";
          ctx.lineWidth = compact ? 1.8 : 2.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sparkX - 5, sparkY);
          ctx.lineTo(sparkX + 5, sparkY);
          ctx.moveTo(sparkX, sparkY - 5);
          ctx.lineTo(sparkX, sparkY + 5);
          ctx.stroke();
          ctx.restore();
        }
        ctx.strokeStyle = "rgba(42, 14, 0, 0.84)";
        ctx.lineWidth = 6;
      }
      ctx.strokeText(amountText, x, yy);
      ctx.fillStyle = isCritical ? "#fff2a8" : text.color || "#f5c76a";
      ctx.fillText(amountText, x, yy);
      if (isCritical) {
        ctx.globalAlpha *= 0.58;
        ctx.fillStyle = "#f59e0b";
        ctx.fillText(amountText, x + 1.5, yy + 1.5);
      }
    });
    ctx.restore();
  }

  function rememberPanelScrollFromEvent(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !target.classList.contains("panel")) return;
    const tab = target.dataset.panelTab || app.tab;
    app.panelScroll[tab] = target.scrollTop;
  }

  function routePanelWheel(event) {
    if (!event.deltaY) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("#modalLayer")) return;
    const panel = ui.querySelector(".panel");
    if (!panel) return;
    const panelRect = panel.getBoundingClientRect();
    const appRoot = document.getElementById("app");
    const appRect = appRoot?.getBoundingClientRect();
    const inPanel = target?.closest(".panel") === panel;
    const inBottomBar = Boolean(target?.closest(".bottombar"));
    const inAppPanelBand = Boolean(
      appRect &&
        event.clientX >= appRect.left &&
        event.clientX <= appRect.right &&
        event.clientY >= panelRect.top - 8 &&
        event.clientY <= appRect.bottom
    );
    if (!inPanel && !inBottomBar && !inAppPanelBand) return;

    const maxTop = Math.max(0, panel.scrollHeight - panel.clientHeight);
    if (maxTop <= 0) return;
    const nextTop = Math.max(0, Math.min(maxTop, panel.scrollTop + event.deltaY));
    if (Math.abs(nextTop - panel.scrollTop) < 0.01) {
      app.panelScroll[app.tab] = panel.scrollTop;
      event.preventDefault();
      return;
    }
    panel.scrollTop = nextTop;
    app.panelScroll[app.tab] = panel.scrollTop;
    event.preventDefault();
  }

  function bindEvents() {
    document.addEventListener(
      "pointerdown",
      (event) => beginInputRenderGuard(event.target),
      { capture: true }
    );
    document.addEventListener("pointerup", endInputRenderGuard, { capture: true });
    document.addEventListener("pointercancel", endInputRenderGuard, { capture: true });
    window.addEventListener("blur", () => {
      app.inputRenderGuard = false;
      flushDeferredRender();
    });
    document.addEventListener("click", async (event) => {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!target) return;
      if (target.dataset.upgradeStep) {
        setUpgradeStep(target.dataset.upgradeStep);
        return;
      }
      if (target.dataset.openSettings !== undefined) {
        if (modalLayer.querySelector(".settings-modal")) {
          modalLayer.innerHTML = "";
          return;
        }
        openSettingsModal();
        return;
      }
      if (target.dataset.settingToggle) {
        await setSetting(target.dataset.settingToggle, !app.settings[target.dataset.settingToggle]);
        return;
      }
      if (target.dataset.saveNow !== undefined) {
        await writeSave();
        showToast("저장했습니다.");
        return;
      }
      if (target.dataset.gearSlotFilter) {
        setGearSlotFilter(target.dataset.gearSlotFilter);
        return;
      }
      if (target.dataset.summonView) {
        setSummonView(target.dataset.summonView);
        return;
      }
      if (target.dataset.codexKind) {
        setCodexKind(target.dataset.codexKind);
        return;
      }
      if (target.dataset.openCodex !== undefined) {
        openCodexShortcut(target.dataset.openCodex);
        return;
      }
      if (target.dataset.tab) setTab(target.dataset.tab);
      if (target.dataset.upgrade) await buyUpgrade(target.dataset.upgrade);
      if (target.dataset.buyWeapon !== undefined) await buyWeapon();
      if (target.dataset.buyQuest) await buyQuest(target.dataset.buyQuest);
      if (target.dataset.buyTreasure) await buyTreasure(target.dataset.buyTreasure);
      if (target.dataset.diamondUpgrade) await buyDiamondUpgrade(target.dataset.diamondUpgrade);
      if (target.dataset.buyConsumable) await buyConsumable(target.dataset.buyConsumable);
      if (target.dataset.useConsumable) await useConsumable(target.dataset.useConsumable);
      if (target.dataset.summon) {
        const [mode, kind, count] = target.dataset.summon.split(":");
        await summon(mode, kind, Number(count));
      }
      if (target.dataset.equipHero) equipHero(target.dataset.equipHero);
      if (target.dataset.autoHeroes !== undefined) autoEquipHeroes();
      if (target.dataset.equipGear) equipGear(target.dataset.equipGear);
      if (target.dataset.autoGear !== undefined) autoEquipGear();
      if (target.dataset.rebirth !== undefined) await rebirth();
      if (target.dataset.buySkin) await buySkin(target.dataset.buySkin);
      if (target.dataset.equipSkin) equipSkin(target.dataset.equipSkin);
      if (target.dataset.claimOffline !== undefined) await claimOffline(1, false);
      if (target.dataset.rushOffline !== undefined) await claimOffline(3, true);
      if (target.dataset.closeModal !== undefined) modalLayer.innerHTML = "";
    });
    document.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.dataset.settingRange) return;
      setVolumeSetting(target.dataset.settingRange, target.value);
    });
    document.addEventListener("scroll", rememberPanelScrollFromEvent, true);
    document.addEventListener("wheel", routePanelWheel, { passive: false });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalLayer.innerHTML) modalLayer.innerHTML = "";
    });
    document.addEventListener(
      "pointerdown",
      () => {
        if (app.settings.bgmEnabled) void syncBgm();
      },
      { once: true }
    );
    window.addEventListener("abyss-summoner-toast", (event) => showToast(event.detail.message));
    window.addEventListener("hashchange", syncTabFromHash);
  }

  async function init() {
    bindEvents();
    const loaded = await host.save.load(DEFAULT_SAVE);
    app.save = ensureSaveShape(loaded);
    app.pendingOfflineGold = calcOfflineReward(app.save.lastSeenAt);
    grantStarterRoster();
    nextEnemy();
    await refreshBalance();
    render();
    setInterval(tick, 100);
    setInterval(writeSave, 5000);
    requestAnimationFrame(draw);
  }

  function tick() {
    const now = performance.now();
    const dt = Math.min(0.5, (now - app.lastTick) / 1000);
    app.lastTick = now;
    updateQuestIncome(dt);
    updateCombat(dt);
    const boost = activeBoostEffects();
    if ((boost.battleCatalystActive || app.lastBoostRenderActive) && now - app.lastBoostRender > 1000) {
      app.lastBoostRender = now;
      app.lastBoostRenderActive = boost.battleCatalystActive;
      render();
    }
  }

  init().catch((error) => {
    console.error(error);
    ui.innerHTML = `<div class="panel"><h2>초기화 오류</h2><p>${error.message}</p></div>`;
  });
})();
