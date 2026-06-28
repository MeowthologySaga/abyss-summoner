"use strict";


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
const criticalIconImage = loadImage(ASSETS.criticalIcon);
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
  log: ["심연의 문이 열렸습니다."]
};

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
