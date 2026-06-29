"use strict";

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
  effects.premiumLuckPct = Math.min(SUMMON_BALANCE.premiumLuck.cap, effects.premiumLuckPct);
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
    const balance = SUMMON_BALANCE.premiumLuck;
    const luck = treasureEffects().premiumLuckPct;
    const epicBonus = Math.round(luck * balance.epicBonusScale * 10) / 10;
    const legendaryBonus = Math.round(luck * balance.legendaryBonusScale * 10) / 10;
    const totalBonus = epicBonus + legendaryBonus;
    rates.common = Math.max(balance.minCommon, Math.round((rates.common - totalBonus) * 10) / 10);
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
  const previous = app.save.equippedHeroes.filter(Boolean);
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
  const selectedIds = selected.slice(0, 3);
  const selectedNames = selectedIds.map((id) => getData("hero", id)?.name || id);
  const changed = !sameIdList(previous, selectedIds);
  if (changed) {
    app.save.equippedHeroes = selectedIds;
    writeSave();
    render();
  }
  return { changed, selectedIds, selectedNames };
}

function equipGear(id) {
  const gear = getData("gear", id);
  app.save.equippedGear[gear.slot] = id;
  writeSave();
  render();
}

function autoEquipGear() {
  const slots = ["weapon", "armor", "relic"];
  const previous = { ...app.save.equippedGear };
  const next = { ...app.save.equippedGear };
  slots.forEach((slot) => {
    const best = Object.keys(app.save.ownedGear)
      .filter((id) => getData("gear", id).slot === slot)
      .sort((a, b) => gearEquipScore(b) - gearEquipScore(a))[0];
    if (best) next[slot] = best;
  });
  const changed = slots.some((slot) => previous[slot] !== next[slot]);
  if (changed) {
    app.save.equippedGear = next;
    writeSave();
    render();
  }
  const selectedIds = slots.map((slot) => next[slot]).filter(Boolean);
  const selectedNames = selectedIds.map((id) => getData("gear", id)?.name || id);
  return { changed, selectedIds, selectedNames };
}

function sameIdList(left, right) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
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

function panelScrollHoldRemaining() {
  return Math.max(0, (app.panelScrollHoldUntil || 0) - performance.now());
}

function scheduleDeferredRender(delay = 0) {
  if (app.panelRenderResumeTimer) window.clearTimeout(app.panelRenderResumeTimer);
  app.panelRenderResumeTimer = window.setTimeout(() => {
    app.panelRenderResumeTimer = null;
    flushDeferredRender();
  }, Math.max(0, delay));
}

function holdPanelScrollRender(ms = 320) {
  app.panelScrollHoldUntil = Math.max(app.panelScrollHoldUntil || 0, performance.now() + ms);
  if (app.deferredRender) scheduleDeferredRender(panelScrollHoldRemaining() + 24);
}

function restorePanelScroll() {
  const panel = ui.querySelector(".panel");
  if (!panel) return;
  const tab = app.tab;
  const savedTop = app.panelScroll[tab] || 0;
  if (savedTop <= 0) return;
  const applyScroll = () => {
    if (Math.abs((app.panelScroll[tab] || 0) - savedTop) > 0.5) return;
    const currentPanel = ui.querySelector(`.panel[data-panel-tab="${tab}"]`);
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
  const holdRemaining = panelScrollHoldRemaining();
  if (holdRemaining > 0) {
    scheduleDeferredRender(holdRemaining + 24);
    return;
  }
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


window.ABYSS_SUMMONER_PROGRESSION = {
  calcStats,
  effectiveSummonRates,
  normalSummonCost,
  summon,
  buyUpgrade,
  buyWeapon,
  buyQuest,
  buyTreasure,
  buyDiamondUpgrade,
  buyConsumable,
  useConsumable,
  rebirth,
  equipHero,
  equipGear,
  autoEquipHeroes,
  autoEquipGear,
  setTab,
  setSummonView,
  setCodexKind
};
