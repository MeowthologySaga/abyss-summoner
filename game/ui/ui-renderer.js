"use strict";

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

function renderCombatEffectRail(stats, enemy) {
  const groups = buildCombatEffectGroups(stats, enemy);
  const selected = groups.find((group) => group.id === app.effectTooltipId) || null;
  const chips = groups.map((group) => renderCombatEffectOrb(group)).join("");
  const popover = selected ? renderCombatEffectPopover(selected) : "";
  return `<div class="effect-rail">${chips}${popover}</div>`;
}

function buildCombatEffectGroups(stats, enemy) {
  const boost = activeBoostEffects();
  const debuff = enemyDebuffEffects(enemy, stats);
  const firepowerRows = [
    `실전 DPS ${fmt(stats.dps)}`,
    `주인공 ${fmtRate(stats.summonerDps)} / 동료 ${fmtRate(stats.familiarDps)}`,
    `공격속도 x${stats.attackSpeedMult.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`,
    `치명 ${pct(stats.critChancePct)} / 피해 x${stats.critDamageMult.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`,
    `추가 투사체 ${pct(stats.projectileChancePct)}`
  ];
  if (boost.battleCatalystActive) {
    firepowerRows.push(`전투 촉매: 피해 +20% / 공속 +20% · ${formatDuration(boost.battleCatalystRemaining)}`);
  } else {
    firepowerRows.push("전투 촉매 비활성");
  }
  const curseRows = debuff.damageCutPct > 0
    ? [
        `${debuff.label}: 아군 최종 피해 -${pct(debuff.damageCutPct)}`,
        `원 압박 ${pct(debuff.rawDamageCutPct)}`,
        `압박 저항 ${pct(debuff.resistPct)} 적용`,
        "층수/적 역할로 압박 강화"
      ]
    : [
        "현재 압박 없음",
        `압박 저항 ${pct(stats.debuffResistPct)} 보유`,
        "1000층 이후 발동",
        "저주/보스 압박 강화"
      ];
  return [
    {
      id: "firepower",
      label: "화력",
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-firepower.png",
      active: stats.dps > 0 || boost.battleCatalystActive,
      progress: Math.max(0.12, Math.min(1, stats.attackSpeedMult / 3.25)),
      summary: boost.battleCatalystActive ? "촉매 적용 중" : `DPS ${fmt(stats.dps)}`,
      rows: firepowerRows
    },
    {
      id: "resonance",
      label: "공명",
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-resonance.png",
      active: (stats.roster?.uniqueCount || 0) >= 3 || stats.gearPower > 0,
      progress: Math.max(0.08, Math.min(1, (stats.roster?.uniqueCount || 0) / HEROES.length)),
      summary: `동료 ${fmt(stats.roster?.uniqueCount || 0)}명`,
      rows: [
        `보유 동료 ${fmt(stats.roster?.uniqueCount || 0)}/${HEROES.length}`,
        `예비대 DPS ${fmtRate(stats.roster?.reserveDps || 0)} (${pct(stats.roster?.reserveShare || 0)})`,
        `동료 공명 공격 +${pct(stats.roster?.attackPct || 0)}`,
        `장비 수집 공격 +${pct(stats.gearCollection?.attackPct || 0)}`,
        `장비 전투력 ${fmt(stats.gearPower)}`
      ]
    },
    {
      id: "curse",
      label: "저주",
      tone: "curse",
      icon: "../assets/generated/effect-icons-v1/effect-curse.png",
      active: debuff.damageCutPct > 0,
      progress: Math.max(0.08, Math.min(1, (debuff.rawDamageCutPct || 0) / 0.46)),
      summary: debuff.damageCutPct > 0 ? `피해 -${pct(debuff.damageCutPct)}` : "압박 대기",
      rows: curseRows
    },
    {
      id: "boss",
      label: "보스전",
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-boss.png",
      active: enemy?.boss || stats.bossDamagePct > 0,
      progress: Math.max(0.08, Math.min(1, stats.bossDamagePct / 2)),
      summary: enemy?.boss ? "보스전 적용 중" : `보스 피해 +${pct(stats.bossDamagePct)}`,
      rows: [
        `보스 피해 +${pct(stats.bossDamagePct)}`,
        `고HP 보스 피해 +${pct(stats.highHpBossDamagePct)}`,
        `저HP 보스 피해 +${pct(stats.lowHpBossDamagePct)}`,
        `보스 보상 +${pct(stats.bossRewardPct)}`,
        enemy?.boss ? "현재 보스전 효과 적용 중" : "보스전에서 자동 적용"
      ]
    }
  ];
}

function renderCombatEffectOrb(group) {
  const open = app.effectTooltipId === group.id;
  return `
    <button type="button" class="effect-orb ${group.tone} ${group.active ? "is-active" : "is-muted"} ${open ? "is-open" : ""}" data-effect-group="${group.id}" aria-label="${group.label} 효과 상세" aria-expanded="${open ? "true" : "false"}" style="--buff-progress:${group.progress}">
      <img src="${group.icon}" alt="" aria-hidden="true" loading="lazy">
      <i></i>
    </button>
  `;
}

function renderCombatEffectPopover(group) {
  const rows = group.rows.map((row) => `<li><span>${escapeHtml(row)}</span></li>`).join("");
  return `
    <aside class="effect-popover ${group.tone}" role="status" aria-live="polite">
      <header>
        <img src="${group.icon}" alt="" aria-hidden="true">
        <div>
          <strong>${escapeHtml(group.label)}</strong>
          <small>${escapeHtml(group.summary)}</small>
        </div>
      </header>
      <ul>${rows}</ul>
    </aside>
  `;
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
  const progress = battleProgress();
  const reward = rebirthReward();
  const stats = calcStats();
  const weaponPlan = upgradePurchasePlan(app.save.weaponLevel, weaponCostAtLevel);
  const rebirthLabel = reward.canRebirth ? `환생 ${fmt(reward.souls)}영혼석` : `환생 ${reward.remainingStages}층 남음`;
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
        value: reward.canRebirth ? "이번 회차 환생 가능" : `현재 ${reward.currentStage}층 · ${reward.remainingStages}층 남음`,
        button: `<button class="${reward.canRebirth ? "primary" : ""}" data-tab="rebirth">${rebirthLabel}</button>`,
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
        <span>소환 실행</span>
      </button>
      <button class="${app.summonView === "codex" ? "active" : ""}" data-summon-view="codex" aria-pressed="${app.summonView === "codex"}">
        <strong>도감</strong>
        <span>수집/효과</span>
      </button>
    </div>
    ${app.summonView === "codex" ? renderCodexPanel() : renderSummonDrawPanel()}
  `;
}

function renderSummonDrawPanel() {
  const normalButton = (kind, count) => {
    const cost = normalSummonCost(kind, count);
    return `<button class="primary summon-action-btn" data-summon="normal:${kind}:${count}" ${app.save.gold < cost ? "disabled" : ""}>${renderSummonButtonContent(`${count}회`, "coin", cost)}</button>`;
  };
  const premiumButton = (kind, count) => {
    return `<button class="premium summon-action-btn" data-summon="premium:${kind}:${count}">${renderSummonButtonContent(`${count}회`, "diamond", ACTION_BY_ID[`summon-${kind}-${count}`].amount)}</button>`;
  };
  return `
    <div class="summon-draw">
      <div class="summon-draw-head">
        <div>
          <p class="panel-kicker">소환</p>
          <h2>심연 소환</h2>
          <p class="muted">골드/다이아로 소환합니다. 보유 효과는 계속 누적됩니다.</p>
        </div>
        <div class="summon-wallet" aria-label="보유 재화">
          <span><i class="res-icon coin"></i><strong>${fmt(app.save.gold)}</strong></span>
          <span><i class="res-icon diamond"></i><strong>${fmt(app.walletBalance)}</strong></span>
        </div>
      </div>
      <div class="summon-mode-grid">
        ${renderSummonModeCard("normal", normalButton)}
        ${renderSummonModeCard("premium", premiumButton)}
      </div>
      <div class="summon-info-grid">
        ${renderSummonPityPanel()}
        ${renderSummonBonusCard()}
      </div>
    </div>
  `;
}

function renderSummonButtonContent(label, currency, amount) {
  const currencyLabel = currency === "diamond" ? "다이아" : "골드";
  return `
    <span class="summon-action-main">${label}</span>
    <span class="summon-action-cost"><i class="res-icon ${currency}"></i><b>${currencyLabel} ${fmt(amount)}</b></span>
  `;
}

function renderSummonModeCard(mode, buttonFor) {
  const premium = mode === "premium";
  const label = premium ? "프리미엄 소환" : "일반 소환";
  const currency = premium ? "다이아" : "골드";
  const desc = premium ? "Epic/Legendary 확률이 더 높습니다." : "기본 성장 재료를 안정적으로 모읍니다.";
  return `
    <article class="summon-mode-card ${premium ? "premium" : "normal"}">
      <div class="summon-mode-head">
        <div>
          <strong>${label}</strong>
          <span>${desc}</span>
        </div>
        <b>${currency}</b>
      </div>
      <div class="summon-kind-list">
        ${renderSummonKindRow("hero", "동료", "heroes", "white-lantern", buttonFor)}
        ${renderSummonKindRow("gear", "장비", "gear", "king-eater", buttonFor)}
      </div>
      <div class="summon-rate-chips" aria-label="${label} 확률">
        ${renderSummonRateChips(mode)}
      </div>
    </article>
  `;
}

function renderSummonKindRow(kind, label, assetKind, assetId, buttonFor) {
  return `
    <div class="summon-kind-row">
      <div class="summon-kind-title">
        <span class="summon-kind-thumb">${catalogImgTag(assetKind, assetId, "")}</span>
        <strong>${label}</strong>
      </div>
      <div class="summon-button-pair">
        ${buttonFor(kind, 1)}
        ${buttonFor(kind, 10)}
      </div>
    </div>
  `;
}

function renderSummonRateChips(mode) {
  const rates = effectiveSummonRates(mode);
  return ["common", "rare", "epic", "legendary"].map((rarity) => `
    <span class="summon-rate-chip rarity-${rarity}">
      <b>${RARITIES[rarity].label}</b>
      <i>${rates[rarity]}%</i>
    </span>
  `).join("");
}

function renderSummonPityPanel() {
  return `
    <section class="summon-meter-card" aria-label="소환 천장">
      <div class="summon-section-label">
        <strong>천장</strong>
        <span>확정 보상까지의 진행도</span>
      </div>
      <div class="summon-pity-list">
        ${renderSummonPityRow("일반 동료", app.save.normalPity.hero, NORMAL_PITY)}
        ${renderSummonPityRow("일반 장비", app.save.normalPity.gear, NORMAL_PITY)}
        ${renderSummonPityRow("프리미엄 동료", app.save.pity.hero, MAX_PITY)}
        ${renderSummonPityRow("프리미엄 장비", app.save.pity.gear, MAX_PITY)}
      </div>
    </section>
  `;
}

function renderSummonPityRow(label, value, max) {
  const progress = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return `
    <div class="summon-pity-row">
      <span>${label}</span>
      <em class="summon-pity-bar" aria-hidden="true"><i style="--pity-progress:${progress}%"></i></em>
      <strong>${value}/${max}</strong>
    </div>
  `;
}

function renderSummonBonusCard() {
  return `
    <section class="summon-bonus-card">
      <div class="summon-bonus-icon">${catalogImgTag("heroes", "white-lantern", "")}</div>
      <div>
        <strong>동료 계약</strong>
        <p>편성하지 않은 동료도 예비대와 공명으로 보유 효과가 반영됩니다.</p>
      </div>
    </section>
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
      firstStage: enemy.firstStage,
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
      firstStage: requiredStage,
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

function codexProgressLabel(kind) {
  return kind === "monsters" ? "발견" : "보유";
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
        <strong>${currentLabel} ${codexProgressLabel(kind)} ${summary.owned}/${summary.total}</strong>
        <span>${Math.round(summary.ratio * 100)}%</span>
        <i style="--codex-progress:${summary.ratio}"></i>
      </div>
    </div>
    <div class="codex-filter" role="group" aria-label="도감 분류">
      ${CODEX_KIND_FILTERS.map(renderCodexFilterButton).join("")}
    </div>
    <div class="codex-groups">
      ${kind === "monsters" ? renderMonsterCodexGroups(entries) : renderCodexGroups(entries)}
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

function renderMonsterCodexGroups(entries) {
  const groups = [
    { value: "normal", label: "일반 몬스터" },
    { value: "boss", label: "보스" }
  ];
  return groups.map((group) => {
    const groupEntries = entries.filter((entry) => entry.monsterType === group.value)
      .sort((a, b) => {
        const discoveredDiff = Number(b.owned) - Number(a.owned);
        if (discoveredDiff !== 0) return discoveredDiff;
        const stageDiff = (a.firstStage || 0) - (b.firstStage || 0);
        if (stageDiff !== 0) return stageDiff;
        const rarityDiff = CODEX_RARITY_ORDER.indexOf(a.rarity) - CODEX_RARITY_ORDER.indexOf(b.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        return a.name.localeCompare(b.name, "ko-KR");
      });
    if (groupEntries.length === 0) return "";
    const discovered = groupEntries.filter((entry) => entry.owned).length;
    return `
      <section class="codex-rarity-section monster-codex-section monster-${group.value}">
        <div class="codex-rarity-head monster-codex-head">
          <strong>${group.label}</strong>
          <span>발견 ${discovered}/${groupEntries.length}</span>
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
  const status = entry.kind === "monsters" ? (locked ? "미발견" : "발견") : (locked ? "미획득" : "보유");
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
        <div class="card collection-card hero-card rarity-${hero.rarity} ${isEquipped ? "selected" : ""}" data-hero-id="${id}">
          <div class="collection-art">${catalogImgTag("heroes", id, hero.name)}</div>
          <div class="collection-copy">
            <h3 class="${rarityClass(hero.rarity)}">${hero.name} Lv.${owned.level}</h3>
            <p class="tiny">${RARITIES[hero.rarity].label} / <span class="${roleClass(hero.role)}">${ROLES[hero.role].label}</span> / 전투력 ${fmt(itemPower("hero", id))}</p>
            <p class="muted">${isEquipped ? "전열 전투 중" : `예비대 DPS ${pct(roster.reserveShare)}`} · ${ROLES[hero.role].bonus}</p>
            <p class="tiny">보유 효과: ${heroOwnedEffectText(hero, owned.level)}</p>
            ${heroGrowthEffectLines(id)}
            <div class="tiny">${shardProgressText(hero, owned)}</div>
            <div class="tiny">공명 ${influence.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</div>
            <button data-equip-hero="${id}">${isEquipped ? "편성 해제" : "편성"}</button>
          </div>
        </div>
      `;
    })
    .join("");
  return `
    <div class="hero-panel-head">
      <div>
        <h2>동료 편성</h2>
        <p class="muted">전열 3명은 직접 전투하고, 나머지는 예비대와 공명으로 기여합니다.</p>
      </div>
      <button data-auto-heroes>추천 편성</button>
    </div>
    <div class="hero-summary-grid">
      ${heroSummaryChip("수집", `${roster.uniqueCount}/${HEROES.length}`)}
      ${heroSummaryChip("전열", `${app.save.equippedHeroes.length}/3`)}
      ${heroSummaryChip("예비대 DPS", fmtRate(roster.reserveDps))}
      ${heroSummaryChip("공명 공격", `+${pct(roster.attackPct)}`)}
      ${heroSummaryChip("레벨/승급", `${fmt(roster.totalLevels)} / ${fmt(roster.duplicateLevels)}`)}
      ${heroSummaryChip("역할 보너스", `탱 ${pct(roster.tankBossPct)} · 딜 ${pct(roster.dpsPct)}`)}
    </div>
    <div class="grid cols-3 heroes-grid">${cards}</div>
  `;
}

function heroSummaryChip(label, value) {
  return `
    <div class="hero-summary-chip">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
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
      <div class="card collection-card rarity-${gear.rarity} ${equipped.has(id) ? "selected" : ""}" data-gear-id="${id}">
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
  const gateText = reward.canRebirth
    ? `현재 ${reward.currentStage}층 · 지금 환생 가능`
    : `현재 ${reward.currentStage}층 · ${reward.remainingStages}층 더 진행 필요`;
  const rewardText = reward.canRebirth ? `${fmt(reward.souls)} 영혼석` : `${reward.requiredStage}층 도달 후 계산`;
  const buttonText = reward.canRebirth ? "환생하기" : `${reward.remainingStages}층 남음`;
  return `
    <div class="grid cols-2">
      <div class="card">
        <h2>환생</h2>
        <p class="muted">${reward.requiredStage}층 이상에서 이번 회차를 끝내고 1층부터 다시 시작합니다. 보상으로 영혼석을 받고, 동료·장비·보물·소환 천장은 유지됩니다.</p>
        <p class="tiny">${gateText}</p>
        <p>받을 영혼석: <strong>${rewardText}</strong></p>
        <button class="warn" data-rebirth ${!reward.canRebirth || reward.souls <= 0 ? "disabled" : ""}>${buttonText}</button>
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

window.ABYSS_SUMMONER_UI = {
render,
renderPanel,
renderCombatEffectRail
};
