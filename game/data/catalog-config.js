"use strict";

const PACK_ID = "meowthology.abyss-summoner";
const SAVE_KEY = "abyss-summoner-save-v1";
const ECONOMY_CONFIG = window.ABYSS_SUMMONER_ECONOMY_CONFIG;
if (!ECONOMY_CONFIG) {
  throw new Error("economy-config.js must be loaded before main.js");
}
const MAX_PITY = ECONOMY_CONFIG.maxPity;
const NORMAL_PITY = ECONOMY_CONFIG.normalPity;
const MONSTERS_PER_FLOOR = 5;
const TABS = ["quest", "weapon", "summon", "heroes", "gear", "treasure", "shop", "rebirth"];

const ACTIONS = ECONOMY_CONFIG.diamondActions;
const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((action) => [action.id, action]));
const DIAMOND_UPGRADES = ECONOMY_CONFIG.diamondUpgrades;
const CONSUMABLES = ECONOMY_CONFIG.consumables;
const BATTLE_CATALYST_DURATION_MS = ECONOMY_CONFIG.battleCatalystDurationMs;
const SUMMON_BALANCE = ECONOMY_CONFIG.summonBalance;

const SKINS = [
  {
    id: "base",
    art: "../assets/generated/sprites/skins/base-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/base/sheet-transparent.webp?v=20260627-skinidle1",
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
    art: "../assets/generated/sprites/skins/abyss-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/abyss/sheet-transparent.webp?v=20260627-skinidle1",
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
    art: "../assets/generated/sprites/skins/crimson-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/crimson/sheet-transparent.webp?v=20260627-skinidle1",
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
    art: "../assets/generated/sprites/skins/gilded-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/gilded/sheet-transparent.webp?v=20260627-skinidle1",
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
    art: "../assets/generated/sprites/skins/eclipse-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/eclipse/sheet-transparent.webp?v=20260627-skinidle1",
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
    art: "../assets/generated/sprites/skins/soul-display.webp?v=20260627-skinforge1",
    idleSheet: "../assets/generated/sprites/skins/idle/soul/sheet-transparent.webp?v=20260627-skinidle1",
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
const SUMMON_MODES = ECONOMY_CONFIG.summonModes;

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
  summonerSheet: "../assets/generated/sprites/summoner/sheet-transparent.webp",
  companionSheet: "../assets/generated/sprites/companions-v3/sheet-transparent.webp?v=20260703-companionnorm1",
  enemySheet: "../assets/generated/sprites/enemies-v3/sheet-transparent.webp?v=20260627-enemyv3",
  bossSheet: "../assets/generated/sprites/bosses-v3/sheet-transparent.webp?v=20260627-bossv3",
  bossMarkerSkull: "../assets/generated/boss-marker-skull/boss-skull.webp?v=20260628-bossskull1",
  attackBoltSheet: "../assets/generated/fx/abyss-bolt/sheet-transparent.webp",
  companionProjectileSheet: "../assets/generated/fx/companion-projectiles-v2/sheet-transparent.webp?v=20260627-projectilesv2",
  hitImpactSheet: "../assets/generated/fx/abyss-impact/sheet-transparent.webp",
  criticalIcon: "../assets/generated/fx/critical-impact/critical-icon.webp?v=20260628-criticalicon5",
  audio: {
    dungeonBgm: "../assets/audio/abyss-dungeon-loop.mp3?v=20260703-bgmvar2",
    bossBgm: "../assets/audio/abyss-boss-loop.mp3?v=20260703-bgmvar2",
    dungeonBgms: [
      {
        id: "catacomb-reliquary",
        startStage: 1,
        backgrounds: ["sewer-catacomb-v2", "bone-reliquary-v2"],
        src: "../assets/audio/abyss-dungeon-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "catacomb-lantern",
        startStage: 1,
        backgrounds: ["sewer-catacomb-v2", "bone-reliquary-v2"],
        src: "../assets/audio/abyss-catacomb-lantern-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "bell-prison",
        startStage: 300,
        backgrounds: ["cracked-belltower-v2", "drowned-prison-v2"],
        src: "../assets/audio/abyss-bell-prison-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "bell-prison-echo",
        startStage: 300,
        backgrounds: ["cracked-belltower-v2", "drowned-prison-v2"],
        src: "../assets/audio/abyss-bell-prison-echo-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "pressure-archive",
        startStage: 1000,
        backgrounds: ["abyss-pressure-v2", "forbidden-archive-v2"],
        src: "../assets/audio/abyss-pressure-archive-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "archive-ink",
        startStage: 1000,
        backgrounds: ["abyss-pressure-v2", "forbidden-archive-v2"],
        src: "../assets/audio/abyss-archive-ink-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "dream-star",
        startStage: 2500,
        backgrounds: ["dream-corridor-v2", "star-observatory-v2"],
        src: "../assets/audio/abyss-dream-star-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "dream-observatory",
        startStage: 2500,
        backgrounds: ["dream-corridor-v2", "star-observatory-v2"],
        src: "../assets/audio/abyss-dream-observatory-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "throne-rim",
        startStage: 6000,
        backgrounds: ["ancient-throne-v2", "nameless-rim-v2"],
        src: "../assets/audio/abyss-throne-rim-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "nameless-throne",
        startStage: 6000,
        backgrounds: ["ancient-throne-v2", "nameless-rim-v2"],
        src: "../assets/audio/abyss-nameless-throne-loop.mp3?v=20260703-bgmvar2"
      }
    ],
    bossBgms: [
      {
        id: "boss-rite",
        startStage: 1,
        src: "../assets/audio/abyss-boss-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "void-boss",
        startStage: 1000,
        src: "../assets/audio/abyss-void-boss-loop.mp3?v=20260703-bgmvar2"
      },
      {
        id: "final-boss",
        startStage: 6000,
        src: "../assets/audio/abyss-final-boss-loop.mp3?v=20260703-bgmvar2"
      }
    ],
    summon: "../assets/audio/summon-rite.mp3?v=20260703-bgmvar2",
    summonRare: "../assets/audio/summon-rare.mp3?v=20260703-bgmvar2",
    rebirth: "../assets/audio/rebirth.mp3?v=20260703-bgmvar2",
    upgrade: "../assets/audio/upgrade.mp3?v=20260703-bgmvar2",
    bossClear: "../assets/audio/boss-clear.mp3?v=20260703-bgmvar2",
    attackCast: "../assets/audio/attack-cast.mp3?v=20260703-bgmvar2",
    attackSwing: "../assets/audio/attack-swing.mp3?v=20260703-bgmvar2",
    attackArrow: "../assets/audio/attack-arrow.mp3?v=20260703-bgmvar2",
    attackCurse: "../assets/audio/attack-curse.mp3?v=20260703-bgmvar2",
    hitLight: "../assets/audio/hit-light.mp3?v=20260703-bgmvar2",
    hitHeavy: "../assets/audio/hit-heavy.mp3?v=20260703-bgmvar2",
    criticalHit: "../assets/audio/critical-hit.mp3?v=20260703-bgmvar2",
    enemyDown: "../assets/audio/enemy-down.mp3?v=20260703-bgmvar2"
  }
};
const BATTLE_BACKGROUNDS = [
  { id: "sewer-catacomb-v2", startStage: 1, src: "../assets/generated/backgrounds/sewer-catacomb-v2.webp" },
  { id: "bone-reliquary-v2", startStage: 100, src: "../assets/generated/backgrounds/bone-reliquary-v2.webp" },
  { id: "cracked-belltower-v2", startStage: 300, src: "../assets/generated/backgrounds/cracked-belltower-v2.webp" },
  { id: "drowned-prison-v2", startStage: 600, src: "../assets/generated/backgrounds/drowned-prison-v2.webp" },
  { id: "abyss-pressure-v2", startStage: 1000, src: "../assets/generated/backgrounds/abyss-pressure-v2.webp" },
  { id: "forbidden-archive-v2", startStage: 1500, src: "../assets/generated/backgrounds/forbidden-archive-v2.webp" },
  { id: "dream-corridor-v2", startStage: 2500, src: "../assets/generated/backgrounds/dream-corridor-v2.webp" },
  { id: "star-observatory-v2", startStage: 4000, src: "../assets/generated/backgrounds/star-observatory-v2.webp" },
  { id: "ancient-throne-v2", startStage: 6000, src: "../assets/generated/backgrounds/ancient-throne-v2.webp" },
  { id: "nameless-rim-v2", startStage: 8000, src: "../assets/generated/backgrounds/nameless-rim-v2.webp" }
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

const TREASURES = ECONOMY_CONFIG.treasures;

window.ABYSS_SUMMONER_DATA = {
  PACK_ID,
  SAVE_KEY,
  MAX_PITY,
  NORMAL_PITY,
  MONSTERS_PER_FLOOR,
  TABS,
  ACTIONS,
  ACTION_BY_ID,
  DIAMOND_UPGRADES,
  CONSUMABLES,
  BATTLE_CATALYST_DURATION_MS,
  SUMMON_BALANCE,
  SKINS,
  RARITIES,
  CODEX_RARITY_ORDER,
  SUMMON_MODES,
  ROLES,
  HEROES,
  GEARS,
  ENEMY_ROLES,
  ASSETS,
  BATTLE_BACKGROUNDS,
  SPRITES,
  ROLE_PROJECTILE_FRAME,
  HERO_PROJECTILE_FRAME,
  PROJECTILE_FRAME_HEIGHT,
  ROLE_ATTACK_PROFILE,
  SUMMONER_ATTACK_PROFILE,
  SPRITE_SOURCE_FACING,
  COMPANION_ROLE_COL,
  COMPANION_RARITY_ROW,
  ENEMY_VARIANTS,
  BOSS_VARIANTS,
  WEAK_ENEMY_VARIANTS,
  WEAPON_CHAIN,
  QUESTS,
  TREASURES
};
