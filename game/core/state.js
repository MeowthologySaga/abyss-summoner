"use strict";

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


function clone(value) {
  return JSON.parse(JSON.stringify(value));
}


window.ABYSS_SUMMONER_STATE = {
  DEFAULT_SAVE,
  DEFAULT_SETTINGS,
  readUpgradeStepPreference,
  writeUpgradeStepPreference,
  readGearSlotFilterPreference,
  writeGearSlotFilterPreference,
  readSettingsPreference,
  writeSettingsPreference,
  normalizeVolumeSetting,
  clone
};
