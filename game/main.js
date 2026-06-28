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

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    image.addEventListener("load", () => render());
    return image;
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

  function render(force = false) {
    const holdRemaining = panelScrollHoldRemaining();
    if (!force && (app.inputRenderGuard || holdRemaining > 0)) {
      app.deferredRender = true;
      if (holdRemaining > 0) scheduleDeferredRender(holdRemaining + 24);
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
    const hudBand = compact ? Math.min(58, Math.max(48, h * 0.18)) : 0;
    const playH = h - hudBand;
    const sceneScale = compact ? Math.max(0.68, Math.min(0.78, playH / 340)) : 1;
    const heroX = w * (compact ? 0.25 : 0.24);
    const enemyX = w * (compact ? 0.76 : 0.78);
    const floorY = playH * (compact ? 0.78 : 0.73);
    const bob = app.settings.reducedMotion ? 0 : 1;

    app.save.equippedHeroes.forEach((id, index) => {
      const hero = getData("hero", id);
      if (!hero) return;
      const slot = companionBattleSlot(heroX, index, compact, sceneScale);
      drawCompanion(slot.x, floorY + slot.y + Math.sin(t * 3 + index) * 3 * bob, hero, id, slot.scale);
    });
    drawSummoner(heroX, floorY, activeSkin(), sceneScale);

    drawEnemy(enemyX, floorY - 4 + Math.sin(t * 2) * 3 * bob, enemy, sceneScale);
    drawProjectiles(heroX, enemyX, floorY, t, compact, sceneScale);

    drawHitImpacts(enemyX, floorY);
    drawDamageTexts(enemyX, floorY, compact);
    drawCombatStatusPanel(w, h, floorY, enemy, stats, compact, hudBand);

    app.attackFlash = Math.max(0, app.attackFlash - 0.016);
    app.enemyFlash = Math.max(0, app.enemyFlash - 0.016);
  }

  function companionBattleSlot(heroX, index, compact, sceneScale = 1) {
    const slots = compact
      ? [
          { x: -78, y: 22, scale: 1.8 },
          { x: -38, y: -40, scale: 1.8 },
          { x: 62, y: 12, scale: 1.8 }
        ]
      : [
          { x: -84, y: 24, scale: 1 },
          { x: -46, y: -48, scale: 1 },
          { x: 74, y: 12, scale: 1 }
        ];
    const slot = slots[index] || slots[slots.length - 1];
    return { x: heroX + slot.x * sceneScale, y: slot.y * sceneScale, scale: slot.scale * sceneScale };
  }

  function drawCombatStatusPanel(w, h, floorY, enemy, stats, compact, hudBand = 0) {
    const panelW = Math.min(compact ? 188 : 260, w * (compact ? 0.45 : 0.48));
    const panelH = compact ? 48 : 52;
    const panelX = Math.round(w - panelW - (compact ? 8 : 14));
    const panelY = Math.round(compact && hudBand > 0 ? h - panelH - 6 : floorY + 34);
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
    ctx.font = `800 ${compact ? 9 : 11}px sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#f6efe7";
    ctx.fillText(`${enemyKind} · ${roleLabel}`, panelX + 10, panelY + 15);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f5c76a";
    ctx.fillText(enemyLabel, panelX + panelW - 10, panelY + 15);

    ctx.fillStyle = "#2b1115";
    ctx.fillRect(panelX + (compact ? 7 : 9), panelY + (compact ? 18 : 22), panelW - (compact ? 14 : 18), compact ? 6 : 8);
    ctx.fillStyle = enemy.boss ? "#fb7185" : "#f5c76a";
    ctx.fillRect(panelX + (compact ? 7 : 9), panelY + (compact ? 18 : 22), (panelW - (compact ? 14 : 18)) * hpPct, compact ? 6 : 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(panelX + (compact ? 7 : 9), panelY + (compact ? 18 : 22), panelW - (compact ? 14 : 18), compact ? 1.5 : 2);

    ctx.fillStyle = "#f6efe7";
    ctx.textAlign = "left";
    ctx.font = `900 ${compact ? 9 : 11}px sans-serif`;
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

  function drawSummoner(x, y, skin, scale = 1) {
    const currentSkin = skin || SKINS[0];
    const frame = Math.floor(performance.now() / 180) % SPRITES.skinSummoner.frameCount;
    const skinHeight = SPRITES.skinSummoner.height * scale;
    const summonerHeight = SPRITES.summoner.height * scale;
    if (drawSheetSprite(skinIdleSheet(currentSkin), SPRITES.skinSummoner, frame, x, y + 6 * scale, skinHeight)) {
      return;
    }
    if (drawImageSprite(skinImage(currentSkin), x, y + 6 * scale, skinHeight)) {
      return;
    }

    const fallbackFrame = frame % SPRITES.summoner.frameCount;
    const flipX = shouldFlipSprite(SPRITE_SOURCE_FACING.summoner, "right");
    const filter = currentSkin?.filter && currentSkin.filter !== "none" ? currentSkin.filter : "";
    if (drawSheetSprite(summonerSpriteSheet, SPRITES.summoner, fallbackFrame, x, y + 6 * scale, summonerHeight, { flipX, filter })) {
      drawSummonerSkinAccent(x, y, currentSkin, scale);
      return;
    }

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flipX) ctx.scale(-1, 1);
    ctx.scale(scale, scale);
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

  function drawSummonerSkinAccent(x, y, skin, scale = 1) {
    if (!skin || skin.id === "base") return;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.strokeStyle = skin.accent || "#f5c76a";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(Math.round(x + 30 * scale), Math.round(y - 84 * scale));
    ctx.lineTo(Math.round(x + 43 * scale), Math.round(y - 92 * scale));
    ctx.stroke();
    ctx.fillStyle = skin.primary || "#f5c76a";
    ctx.fillRect(Math.round(x - 26 * scale), Math.round(y - 48 * scale), 5 * scale, 31 * scale);
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

  function drawEnemy(x, y, enemy, sceneScale = 1) {
    const normalScaleBoost = enemy.tier === "weak" ? 1.24 : 1.14;
    const baseScale = (enemy.visualScale || 1) * (enemy.apexBoss ? 1.35 : enemy.boss ? 1.18 : normalScaleBoost) * sceneScale;
    const flash = app.enemyFlash > 0;
    const frame = enemy.frame ?? ENEMY_SPRITE_BY_ROLE[enemy.role] ?? 0;
    const spriteSpec = enemy.boss ? SPRITES.bosses : SPRITES.enemies;
    const spriteSheet = enemy.boss ? bossSpriteSheet : enemySpriteSheet;
    const minNormalHeight = Math.max(SPRITES.companions.height * 1.5, SPRITES.enemies.height * 1.3) * sceneScale;
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

  function drawProjectiles(heroX, enemyX, y, t, compact, sceneScale = 1) {
    if (app.projectiles.length === 0) return;
    ctx.save();
    app.projectiles.forEach((projectile) => {
      const progressRaw = Math.min(1, projectile.elapsed / projectile.duration);
      const progress = progressRaw * progressRaw * (3 - progressRaw * 2);
      const sourceIndex = Math.max(0, projectile.sourceIndex || 0);
      const companionSlot = companionBattleSlot(heroX, sourceIndex, compact, sceneScale);
      const fromX = projectile.source === "summoner" ? heroX + 36 * sceneScale : companionSlot.x + 20 * sceneScale;
      const fromY = projectile.source === "summoner" ? y - 66 * sceneScale : y + companionSlot.y - 42 * sceneScale;
      const targetX = enemyX - 42 * sceneScale;
      const targetY = y - 52 * sceneScale + projectile.yOffset * sceneScale;
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
      const x = enemyX - 38 + ((index * 11) % 19) - 9;
      const yy = y - 48 + impact.yOffset;
      const impactScale = impact.critical ? 0.88 : 1;
      ctx.globalAlpha = (impact.critical ? 0.38 : 0.86) * (1 - progress * 0.35);
      if (!drawSheetSprite(hitImpactSpriteSheet, SPRITES.hitImpact, frame, x, yy, SPRITES.hitImpact.height * (0.82 + progress * 0.25) * impactScale)) {
        ctx.fillStyle = impact.color || "#f5c76a";
        ctx.beginPath();
        ctx.arc(x, yy - 22, (8 + progress * 9) * impactScale, 0, Math.PI * 2);
        ctx.fill();
      }
      if (impact.critical) {
        const cx = x;
        const cy = yy - 24;
        const radius = 8 + progress * 12;
        ctx.globalAlpha = 0.34 * (1 - progress);
        ctx.strokeStyle = "rgba(255, 224, 138, 0.72)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
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
        const iconHeight = compact ? 20 : 24;
        const iconX = x - width * 0.5 - 9;
        const iconY = yy - fontSize * 0.34 + iconHeight * 0.5;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress * 1.05);
        if (!drawImageSprite(criticalIconImage, iconX, iconY, iconHeight)) {
          ctx.strokeStyle = "rgba(255, 232, 138, 0.95)";
          ctx.lineWidth = compact ? 1.8 : 2.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(iconX - 7, iconY - iconHeight + 5);
          ctx.lineTo(iconX + 7, iconY - 5);
          ctx.moveTo(iconX - 7, iconY - 5);
          ctx.lineTo(iconX + 7, iconY - iconHeight + 5);
          ctx.stroke();
        }
        ctx.restore();
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
    const panel = target?.closest(".panel");
    if (!panel) return;
    const tab = panel.dataset.panelTab || app.tab;
    app.panelScroll[tab] = panel.scrollTop;
    holdPanelScrollRender(260);
  }

  function beginPanelPointerScroll(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(".panel")) return;
    app.panelPointerScroll = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false
    };
  }

  function trackPanelPointerScroll(event) {
    const pointer = app.panelPointerScroll;
    if (!pointer || pointer.id !== event.pointerId) return;
    const movedY = Math.abs(event.clientY - pointer.y);
    const movedX = Math.abs(event.clientX - pointer.x);
    if (movedY < 6 && movedX < 8) return;
    pointer.active = true;
    holdPanelScrollRender(360);
  }

  function endPanelPointerScroll(event) {
    const pointer = app.panelPointerScroll;
    if (!pointer || pointer.id !== event.pointerId) return;
    if (pointer.active) holdPanelScrollRender(460);
    app.panelPointerScroll = null;
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
    holdPanelScrollRender(180);
    event.preventDefault();
  }

  function bindEvents() {
    document.addEventListener(
      "pointerdown",
      (event) => beginInputRenderGuard(event.target),
      { capture: true }
    );
    document.addEventListener("pointerdown", beginPanelPointerScroll, { capture: true });
    document.addEventListener("pointermove", trackPanelPointerScroll, { capture: true, passive: true });
    document.addEventListener("pointerup", endInputRenderGuard, { capture: true });
    document.addEventListener("pointerup", endPanelPointerScroll, { capture: true });
    document.addEventListener("pointercancel", endInputRenderGuard, { capture: true });
    document.addEventListener("pointercancel", endPanelPointerScroll, { capture: true });
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
