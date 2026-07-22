"use strict";


const canvas = document.getElementById("battleCanvas");
const ctx = canvas.getContext("2d");
const ui = document.getElementById("ui");
const modalLayer = document.getElementById("modalLayer");
const toastLayer = document.getElementById("toastLayer");
const startLayer = document.getElementById("startLayer");
const host = window.createHostAdapter();

function requireSystem(name) {
  const system = window[name];
  if (!system) {
    throw new Error(`${name} must be loaded before main.js`);
  }
  return system;
}

const systems = {
  battle: requireSystem("ABYSS_SUMMONER_BATTLE"),
  canvas: requireSystem("ABYSS_SUMMONER_CANVAS"),
  input: requireSystem("ABYSS_SUMMONER_INPUT"),
  ui: requireSystem("ABYSS_SUMMONER_UI")
};

const battleBgImages = BATTLE_BACKGROUNDS.map((background) => ({
  ...background,
  image: null,
  preloadQueued: false
}));

function ensureBattleBackgroundImage(background) {
  if (!background) return null;
  if (!background.image) {
    background.image = systems.canvas.loadImage(background.src);
  }
  return background.image;
}

function queueBattleBackgroundImage(background) {
  if (!background || background.image || background.preloadQueued) return;
  background.preloadQueued = true;
  const load = () => ensureBattleBackgroundImage(background);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: 2500 });
  } else {
    window.setTimeout(load, 500);
  }
}

function scheduleBattleBackgroundPreload(stage, activeBackground) {
  const stageNumber = Number.isFinite(stage) ? Math.max(1, Math.floor(stage)) : 1;
  const activeIndex = battleBgImages.indexOf(activeBackground);
  const nextBackground = activeIndex >= 0 ? battleBgImages[activeIndex + 1] : null;
  if (nextBackground && stageNumber >= nextBackground.startStage - 10) {
    queueBattleBackgroundImage(nextBackground);
  }
}
const summonerSpriteSheet = systems.canvas.loadImage(ASSETS.summonerSheet);
const companionSpriteSheet = systems.canvas.loadImage(ASSETS.companionSheet);
const enemySpriteSheet = systems.canvas.loadImage(ASSETS.enemySheet);
const bossSpriteSheet = systems.canvas.loadImage(ASSETS.bossSheet);
const bossMarkerSkullImage = systems.canvas.loadImage(ASSETS.bossMarkerSkull);
const attackBoltSpriteSheet = systems.canvas.loadImage(ASSETS.attackBoltSheet);
const companionProjectileSpriteSheet = systems.canvas.loadImage(ASSETS.companionProjectileSheet);
const hitImpactSpriteSheet = systems.canvas.loadImage(ASSETS.hitImpactSheet);
const criticalIconImage = systems.canvas.loadImage(ASSETS.criticalIcon);
const catalogImageCache = new Map();
const skinImageCache = new Map();
const bgm = {
  tracks: null,
  catalog: null,
  trackMeta: null,
  sfx: null,
  currentTrack: null,
  bossStartedAt: 0,
  returnDungeonAt: 0,
  lastSwitchAt: 0,
  syncTimer: null,
  fadeTimer: null,
  lastBlockedAt: 0,
  sfxLastPlayed: {}
};

const app = {
  save: clone(DEFAULT_SAVE),
  started: false,
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
  effectTooltipId: null,
  panelScroll: {},
  panelScrollHoldUntil: 0,
  panelPointerScroll: null,
  panelRenderResumeTimer: null,
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
  log: [{ key: "log.gate_opened", variables: {} }]
};

async function init() {
  await window.ABYSS_SUMMONER_I18N.initialize(host);
  systems.input.bindEvents();
  const loaded = await host.save.load(DEFAULT_SAVE);
  app.save = ensureSaveShape(loaded);
  if (app.save.localeOverride) {
    window.ABYSS_SUMMONER_I18N.setLocale(app.save.localeOverride, { persist: true, emit: false });
  }
  app.pendingOfflineGold = calcOfflineReward(app.save.lastSeenAt);
  grantStarterRoster();
  nextEnemy();
  await refreshBalance();
  systems.ui.render();
  window.ABYSS_SUMMONER_START_SCREEN.renderStartScreen();
  setInterval(tick, 100);
  setInterval(writeSave, 5000);
  requestAnimationFrame(systems.canvas.draw);
}

function tick() {
  const now = performance.now();
  const dt = Math.min(0.5, (now - app.lastTick) / 1000);
  app.lastTick = now;
  if (!app.started) return;
  updateQuestIncome(dt);
  systems.battle.updateCombat(dt);
  const boost = activeBoostEffects();
  if (Boolean(boost.battleCatalystActive) !== app.lastBoostRenderActive) {
    app.lastBoostRender = now;
    app.lastBoostRenderActive = Boolean(boost.battleCatalystActive);
    systems.ui.render();
  }
}

async function setGameLanguage(locale) {
  const normalized = window.ABYSS_SUMMONER_I18N.setLocale(locale, { persist: true });
  app.save.localeOverride = normalized;
  const settingsOpen = Boolean(modalLayer.querySelector(".settings-modal"));
  await writeSave();
  systems.ui.render(true);
  window.ABYSS_SUMMONER_START_SCREEN.renderStartScreen();
  if (settingsOpen) openSettingsModal();
  toastLayer.replaceChildren();
  showToast(abyssT("language.changed"));
}

init().catch((error) => {
  console.error(error);
  ui.innerHTML = `<div class="panel"><h2>${abyssT("toast.init_error")}</h2><p>${escapeHtml(error.message)}</p></div>`;
});
