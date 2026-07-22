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
        <span aria-label="${abyssT("battle.dps", { value: fmt(stats.dps) })}">⚔ ${fmt(stats.dps)}</span>
        <span aria-label="${abyssT("stat.gold_gain")} ${fmt(stats.goldMult * 100)}%">☼ ${fmt(stats.goldMult * 100)}%</span>
        <span aria-label="${abyssT("heroes.power", { value: fmt(stats.power) })}">◆ ${fmt(stats.power)}</span>
      </div>
      <div class="floor-title">
        <strong>${abyssT("battle.depth_title", { stage: progress.stage })}</strong>
        <span>${abyssT("battle.progress", { progress: progress.progressText })}</span>
      </div>
      <button class="menu-button" data-open-settings>${abyssT("common.menu")}</button>
    </header>
    ${renderCombatEffectRail(stats, enemy)}
    ${app.settings.adviceBubble ? `<div class="speech-bubble">${escapeHtml(speechText)}</div>` : ""}
    <div class="resource-ledger">
      <div class="resource-coin" aria-label="${abyssT("currency.gold")} ${fmt(app.save.gold)}"><span class="res-icon coin" aria-hidden="true"></span><strong>${fmt(app.save.gold)}</strong><small class="resource-rate">+${abyssT("common.per_second", { value: fmtRate(questGoldPerSecond()) })}</small></div>
      <div class="resource-soul" aria-label="${abyssT("currency.soul")} ${fmt(app.save.souls)}"><span class="res-icon soul" aria-hidden="true"></span><strong>${fmt(app.save.souls)}</strong></div>
      <div class="resource-diamond" aria-label="${abyssT("currency.diamond")} ${fmt(app.walletBalance)}"><span class="res-icon diamond" aria-hidden="true"></span><strong>${fmt(app.walletBalance)}</strong></div>
    </div>
    <footer class="bottombar">
      <nav class="nav-row">
        ${navButton("quest", "nav.quest")}
        ${navButton("weapon", "nav.weapon")}
        ${navButton("summon", "nav.summon")}
        ${navButton("heroes", "nav.heroes")}
        ${navButton("gear", "nav.gear")}
        ${navButton("treasure", "nav.treasure")}
        ${navButton("shop", "nav.shop")}
        ${navButton("rebirth", "nav.rebirth")}
      </nav>
      <section class="panel" data-panel-tab="${app.tab}">${renderPanel()}</section>
    </footer>
  `;
  restorePanelScroll();
}

function navButton(tab, labelKey) {
  const label = abyssT(labelKey);
  return `<button class="${app.tab === tab ? "active" : ""}" data-tab="${tab}" aria-label="${label}"><span class="nav-icon nav-${tab}"></span><span>${label}</span></button>`;
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
    abyssT("effect.live_dps", { value: fmt(stats.dps) }),
    abyssT("effect.summoner_companion", { summoner: fmtRate(stats.summonerDps), companion: fmtRate(stats.familiarDps) }),
    abyssT("effect.attack_speed", { value: stats.attackSpeedMult.toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) }),
    abyssT("effect.crit", { chance: pct(stats.critChancePct), damage: stats.critDamageMult.toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) }),
    abyssT("effect.extra_projectile", { value: pct(stats.projectileChancePct) })
  ];
  if (boost.battleCatalystActive) {
    firepowerRows.push(abyssT("effect.catalyst_active", { time: formatDuration(boost.battleCatalystRemaining) }));
  } else {
    firepowerRows.push(abyssT("effect.catalyst_inactive"));
  }
  const curseRows = debuff.damageCutPct > 0
    ? [
        abyssT("effect.pressure_damage", { label: debuff.label, value: pct(debuff.damageCutPct) }),
        abyssT("effect.raw_pressure", { value: pct(debuff.rawDamageCutPct) }),
        abyssT("effect.pressure_resist_applied", { value: pct(debuff.resistPct) }),
        abyssT("effect.pressure_scales")
      ]
    : [
        abyssT("effect.no_pressure"),
        abyssT("effect.pressure_resist_owned", { value: pct(stats.debuffResistPct) }),
        abyssT("effect.pressure_after_1000"),
        abyssT("effect.curse_boss_pressure")
      ];
  return [
    {
      id: "firepower",
      label: abyssT("effect.firepower"),
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-firepower.webp",
      active: stats.dps > 0 || boost.battleCatalystActive,
      progress: Math.max(0.12, Math.min(1, stats.attackSpeedMult / 3.25)),
      summary: boost.battleCatalystActive ? abyssT("effect.catalyst_summary") : `DPS ${fmt(stats.dps)}`,
      rows: firepowerRows
    },
    {
      id: "resonance",
      label: abyssT("effect.resonance"),
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-resonance.webp",
      active: (stats.roster?.uniqueCount || 0) >= 3 || stats.gearPower > 0,
      progress: Math.max(0.08, Math.min(1, (stats.roster?.uniqueCount || 0) / HEROES.length)),
      summary: abyssT("effect.companion_count", { value: fmt(stats.roster?.uniqueCount || 0) }),
      rows: [
        abyssT("effect.owned_companions", { owned: fmt(stats.roster?.uniqueCount || 0), total: HEROES.length }),
        abyssT("effect.reserve_dps", { value: fmtRate(stats.roster?.reserveDps || 0), share: pct(stats.roster?.reserveShare || 0) }),
        abyssT("effect.resonance_attack", { value: pct(stats.roster?.attackPct || 0) }),
        abyssT("effect.gear_collection_attack", { value: pct(stats.gearCollection?.attackPct || 0) }),
        abyssT("effect.gear_power", { value: fmt(stats.gearPower) })
      ]
    },
    {
      id: "curse",
      label: abyssT("effect.curse"),
      tone: "curse",
      icon: "../assets/generated/effect-icons-v1/effect-curse.webp",
      active: debuff.damageCutPct > 0,
      progress: Math.max(0.08, Math.min(1, (debuff.rawDamageCutPct || 0) / 0.46)),
      summary: debuff.damageCutPct > 0 ? abyssT("effect.damage_down", { value: pct(debuff.damageCutPct) }) : abyssT("effect.pressure_waiting"),
      rows: curseRows
    },
    {
      id: "boss",
      label: abyssT("effect.boss"),
      tone: "positive",
      icon: "../assets/generated/effect-icons-v1/effect-boss.webp",
      active: enemy?.boss || stats.bossDamagePct > 0,
      progress: Math.max(0.08, Math.min(1, stats.bossDamagePct / 2)),
      summary: enemy?.boss ? abyssT("effect.boss_active") : abyssT("effect.boss_damage", { value: pct(stats.bossDamagePct) }),
      rows: [
        abyssT("effect.boss_damage", { value: pct(stats.bossDamagePct) }),
        abyssT("effect.high_hp_boss", { value: pct(stats.highHpBossDamagePct) }),
        abyssT("effect.low_hp_boss", { value: pct(stats.lowHpBossDamagePct) }),
        abyssT("effect.boss_reward", { value: pct(stats.bossRewardPct) }),
        enemy?.boss ? abyssT("effect.boss_current") : abyssT("effect.boss_auto")
      ]
    }
  ];
}

function renderCombatEffectOrb(group) {
  const open = app.effectTooltipId === group.id;
  return `
    <button type="button" class="effect-orb ${group.tone} ${group.active ? "is-active" : "is-muted"} ${open ? "is-open" : ""}" data-effect-group="${group.id}" aria-label="${abyssT("effect.details_label", { label: group.label })}" aria-expanded="${open ? "true" : "false"}" style="--buff-progress:${group.progress}">
      <img src="${group.icon}" alt="" aria-hidden="true" loading="eager" decoding="async">
      <i></i>
    </button>
  `;
}

function renderCombatEffectPopover(group) {
  const rows = group.rows.map((row) => `<li><span>${escapeHtml(row)}</span></li>`).join("");
  return `
    <aside class="effect-popover ${group.tone}" role="status" aria-live="polite">
      <header>
        <img src="${group.icon}" alt="" aria-hidden="true" loading="eager" decoding="async">
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
    <button class="${app.upgradeStep === option.value ? "active" : ""}" data-upgrade-step="${option.value}">${option.labelKey ? abyssT(option.labelKey) : option.label}</button>
  `).join("");
  return `
    <div class="upgrade-toolbar">
      <div class="upgrade-toolbar-copy">
        <strong>${abyssT("upgrade.amount")}</strong>
        <span>${abyssT("upgrade.amount_desc")}</span>
      </div>
      <div class="upgrade-stepper" role="group" aria-label="${abyssT("upgrade.amount_label")}">
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
  const rebirthLabel = reward.canRebirth
    ? abyssT("upgrade.rebirth_souls", { souls: fmt(reward.souls) })
    : abyssT("upgrade.rebirth_floors", { floors: reward.remainingStages });
  const upgradeValue = (type) => {
    if (type === "attack") return abyssT("upgrade.spell_damage", { value: Math.pow(1.11, app.save.runUpgrades.attack).toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) });
    if (type === "attackSpeed") return abyssT("upgrade.speed", { value: stats.attackSpeedMult.toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) });
    if (type === "bossBreak") return abyssT("effect.boss_damage", { value: pct(stats.bossDamagePct) });
    if (type === "greed") return abyssT("upgrade.gold_bonus", { value: Math.floor(app.save.runUpgrades[type] * 8) });
    if (type === "familiar") return abyssT("upgrade.companion_dps", { value: fmt(stats.familiarDps) });
    if (type === "chainSpell") return abyssT("effect.extra_projectile", { value: pct(stats.projectileChancePct) });
    if (type === "weaknessMark") return abyssT("upgrade.weakness", { value: (1.32 + stats.weaknessBonusPct).toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) });
    if (type === "soulDrain") return abyssT("upgrade.soul_bonus", { value: pct(stats.weaponEffects.soulPct) });
    if (type === "abyssPierce") return abyssT("effect.high_hp_boss", { value: pct(stats.highHpBossDamagePct) });
    if (type === "vanguardOrder") return `${abyssT("summon.hero")} ${abyssT("stat.damage")} +${pct(stats.weaponEffects.vanguardPct)}`;
    if (type === "abyssResistance") return abyssT("upgrade.pressure_resist", { value: pct(stats.debuffResistPct) });
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
        title: abyssT("upgrade.gate"),
        desc: `${abyssT("common.floor", { value: progress.stage })} · ${abyssT("battle.progress", { progress: progress.progressText })}`,
        value: reward.canRebirth ? abyssT("upgrade.rebirth_ready") : abyssT("upgrade.rebirth_remaining", { current: reward.currentStage, remaining: reward.remainingStages }),
        button: `<button class="${reward.canRebirth ? "primary" : ""}" data-tab="rebirth">${rebirthLabel}</button>`,
        currency: "soul"
      })}
      ${upgradeRow({
        icon: "custom",
        art: weaponUiIcon("runWeapon"),
        title: `${weaponName()} Lv.${app.save.weaponLevel}/99999`,
        desc: abyssT("upgrade.weapon_desc"),
        value: abyssT("upgrade.weapon_atk", { current: fmt(weaponPower()), next: weaponPlan.levels > 0 ? abyssT("upgrade.current_next", { value: fmt(weaponPowerAtLevel(weaponPlan.nextLevel)) }) : "" }),
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
      value: abyssT("upgrade.quest_gold", { current: fmtRate(questGoldPerSecondFor(quest)), next: plan.levels > 0 ? ` · +${abyssT("common.per_second", { value: fmtRate(questGoldGainForLevels(quest, plan.levels)) })}` : "" }),
      button: `<button class="primary" data-buy-quest="${quest.id}" ${!canBuyUpgradePlan(plan) ? "disabled" : ""}>${actionButton(upgradePlanLabel(plan), "coin", plan.cost)}</button>`,
      currency: "coin"
    });
  }).join("");
  return `
    ${renderUpgradeStepControl()}
    <div class="upgrade-list">
      ${upgradeRow({
        icon: "coin",
        title: abyssT("upgrade.gold_income"),
        desc: abyssT("upgrade.gold_income_desc"),
        value: abyssT("upgrade.offline_value", { rate: fmtRate(questGoldPerSecond()), gold: fmt(app.pendingOfflineGold) }),
        button: `<button data-claim-offline ${app.pendingOfflineGold <= 0 ? "disabled" : ""}><span class="button-main">${abyssT("upgrade.claim")}</span>${freeLine()}</button><button class="premium" data-rush-offline ${app.pendingOfflineGold <= 0 ? "disabled" : ""}>${actionButton(abyssT("upgrade.claim_triple"), "diamond", ACTION_BY_ID["rush-offline-reward"].amount)}</button>`,
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
    title: `${treasure.name} Lv.${treasureLevel(treasure.id)} (${abyssT("common.max")} 99999)`,
    desc: treasure.desc,
    value: treasureEffectText(treasure),
    button: `<button class="primary" data-buy-treasure="${treasure.id}" ${app.save.souls < treasureCost(treasure) ? "disabled" : ""}>${actionButton(abyssT("upgrade.plus_one"), "soul", treasureCost(treasure))}</button>`,
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
        ? `<button disabled><span class="button-main">${abyssT("common.max")}</span></button>`
        : `<button class="premium" data-diamond-upgrade="${upgrade.id}">${actionButton(abyssT("upgrade.plus_one"), "diamond", diamondActionAmount(upgrade.action))}</button>`,
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
      <button class="premium" data-buy-consumable="${item.id}">${actionButton(abyssT("upgrade.buy_plus_one"), "diamond", diamondActionAmount(item.action))}</button>
      <button data-use-consumable="${item.id}" ${consumableCount(item.id) <= 0 ? "disabled" : ""}><span class="button-main">${abyssT("common.use")}</span><span class="button-free">${abyssT("upgrade.owned_count", { value: fmt(consumableCount(item.id)) })}</span></button>
    `,
    currency: "diamond dual"
  })).join("");
  const skinRows = SKINS.map(renderSkinShopCard).join("");
  return `
    <div class="shop-head">
      <div>
        <h2>${abyssT("shop.title")}</h2>
        <p class="muted">${abyssT("shop.description")}</p>
      </div>
      <div class="shop-diamond-badge"><span class="res-icon diamond"></span><strong>${fmt(app.walletBalance)}</strong></div>
    </div>
    ${boost.battleCatalystActive ? `<div class="shop-active-boost">${abyssT("shop.catalyst_active", { time: formatDuration(boost.battleCatalystRemaining) })}</div>` : ""}
    <section class="shop-section">
      <div class="shop-section-title">
        <strong>${abyssT("shop.abilities")}</strong>
        <span>${abyssT("shop.abilities_desc")}</span>
      </div>
      <div class="upgrade-list">${upgradeRows}</div>
    </section>
    <section class="shop-section">
      <div class="shop-section-title">
        <strong>${abyssT("shop.consumables")}</strong>
        <span>${abyssT("shop.consumables_desc")}</span>
      </div>
      <div class="upgrade-list">${consumableRows}</div>
    </section>
    <section class="shop-section">
      <div class="shop-section-title">
        <strong>${abyssT("shop.skins")}</strong>
        <span>${abyssT("shop.skins_desc")}</span>
      </div>
      <div class="skin-summary">${abyssT("shop.skin_total", { value: skinSetEffectText() })}</div>
      <div class="skin-shop-grid">${skinRows}</div>
    </section>
  `;
}

function renderSkinShopCard(skin) {
  const owned = ownsSkin(skin.id);
  const active = activeSkin().id === skin.id;
  const button = active
    ? `<button disabled><span class="button-main">${abyssT("shop.equipped")}</span></button>`
    : owned
      ? `<button data-equip-skin="${skin.id}"><span class="button-main">${abyssT("shop.equip")}</span><span class="button-free">${abyssT("shop.owned_effect_active")}</span></button>`
      : `<button class="premium" data-buy-skin="${skin.id}">${actionButton(abyssT("common.buy"), "diamond", diamondActionAmount(skin.action))}</button>`;
  return `
    <div class="skin-card ${owned ? "owned" : ""} ${active ? "active" : ""}">
      <div class="skin-preview" style="--skin-primary:${skin.primary};--skin-secondary:${skin.secondary};--skin-accent:${skin.accent}" aria-hidden="true">
        ${skin.art ? `<img src="${skin.art}" alt="" loading="eager" decoding="async" />` : `
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
    attackPct: abyssT("stat.all_damage"),
    attackSpeedPct: abyssT("stat.attack_speed"),
    goldPct: abyssT("stat.gold_gain"),
    soulPct: abyssT("stat.soul")
  }[upgrade.effect];
  return `${label} +${pct(current)}${level < upgrade.max ? ` → +${pct(next)}` : ""}`;
}

function consumablePreviewText(id) {
  if (id === "battle-catalyst") return abyssT("shop.preview_catalyst");
  if (id === "gold-seal") return abyssT("shop.preview_gold", { value: fmt(instantGoldReward()) });
  if (id === "soul-candle") return abyssT("shop.preview_soul", { value: fmt(instantSoulReward()) });
  return "";
}

function upgradeRow({ icon, art, title, desc, value, button, currency }) {
  const iconMarkup = art
    ? `<div class="item-icon item-sprite icon-${icon}" aria-hidden="true"><img src="${art}" alt="" loading="eager" decoding="async" onerror="this.remove()" /></div>`
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
    attack: abyssT("upgrade.desc_attack"),
    attackSpeed: abyssT("upgrade.desc_attack_speed"),
    bossBreak: abyssT("upgrade.desc_boss_break"),
    familiar: abyssT("upgrade.desc_familiar"),
    greed: abyssT("upgrade.desc_greed"),
    chainSpell: abyssT("upgrade.desc_chain_spell"),
    weaknessMark: abyssT("upgrade.desc_weakness"),
    soulDrain: abyssT("upgrade.desc_soul_drain"),
    abyssPierce: abyssT("upgrade.desc_abyss_pierce"),
    vanguardOrder: abyssT("upgrade.desc_vanguard"),
    abyssResistance: abyssT("upgrade.desc_resistance")
  }[type];
}

function renderSummonPanel() {
  return `
    <div class="summon-subnav" role="group" aria-label="${abyssT("summon.menu_label")}">
      <button class="${app.summonView === "summon" ? "active" : ""}" data-summon-view="summon" aria-pressed="${app.summonView === "summon"}">
        <strong>${abyssT("summon.draw")}</strong>
        <span>${abyssT("summon.draw_desc")}</span>
      </button>
      <button class="${app.summonView === "codex" ? "active" : ""}" data-summon-view="codex" aria-pressed="${app.summonView === "codex"}">
        <strong>${abyssT("summon.codex")}</strong>
        <span>${abyssT("summon.codex_desc")}</span>
      </button>
    </div>
    ${app.summonView === "codex" ? renderCodexPanel() : renderSummonDrawPanel()}
  `;
}

function renderSummonDrawPanel() {
  const normalButton = (kind, count) => {
    const cost = normalSummonCost(kind, count);
    return `<button class="primary summon-action-btn" data-summon="normal:${kind}:${count}" ${app.save.gold < cost ? "disabled" : ""}>${renderSummonButtonContent(abyssT("summon.count", { count }), "coin", cost)}</button>`;
  };
  const premiumButton = (kind, count) => {
    return `<button class="premium summon-action-btn" data-summon="premium:${kind}:${count}">${renderSummonButtonContent(abyssT("summon.count", { count }), "diamond", ACTION_BY_ID[`summon-${kind}-${count}`].amount)}</button>`;
  };
  return `
    <div class="summon-draw">
      <div class="summon-draw-head">
        <div>
          <p class="panel-kicker">${abyssT("nav.summon")}</p>
          <h2>${abyssT("summon.title")}</h2>
          <p class="muted">${abyssT("summon.description")}</p>
        </div>
        <div class="summon-wallet" aria-label="${abyssT("summon.wallet_label")}">
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
  const currencyLabel = currency === "diamond" ? abyssT("currency.diamond") : abyssT("currency.gold");
  return `
    <span class="summon-action-main">${label}</span>
    <span class="summon-action-cost"><i class="res-icon ${currency}"></i><b>${currencyLabel} ${fmt(amount)}</b></span>
  `;
}

function renderSummonModeCard(mode, buttonFor) {
  const premium = mode === "premium";
  const label = abyssT(premium ? "summon.premium" : "summon.normal");
  const currency = abyssT(premium ? "currency.diamond" : "currency.gold");
  const desc = abyssT(premium ? "summon.premium_desc" : "summon.normal_desc");
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
        ${renderSummonKindRow("hero", abyssT("summon.hero"), "heroes", "white-lantern", buttonFor)}
        ${renderSummonKindRow("gear", abyssT("summon.gear"), "gear", "king-eater", buttonFor)}
      </div>
      <div class="summon-rate-chips" aria-label="${abyssT("summon.rates_label", { label })}">
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
    <section class="summon-meter-card" aria-label="${abyssT("summon.pity_label")}">
      <div class="summon-section-label">
        <strong>${abyssT("summon.pity")}</strong>
        <span>${abyssT("summon.pity_desc")}</span>
      </div>
      <div class="summon-pity-list">
        ${renderSummonPityRow(abyssT("summon.normal_hero"), app.save.normalPity.hero, NORMAL_PITY)}
        ${renderSummonPityRow(abyssT("summon.normal_gear"), app.save.normalPity.gear, NORMAL_PITY)}
        ${renderSummonPityRow(abyssT("summon.premium_hero"), app.save.pity.hero, MAX_PITY)}
        ${renderSummonPityRow(abyssT("summon.premium_gear"), app.save.pity.gear, MAX_PITY)}
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
        <strong>${abyssT("summon.contract")}</strong>
        <p>${abyssT("summon.contract_desc")}</p>
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
        value: owned ? abyssT("codex.owned_effect", { value: heroOwnedEffectText(hero, level) }) : abyssT("codex.available_summon"),
        detail: owned
          ? abyssT("codex.level_shards", { level, current: owned.shards, required: shardNeed(hero.rarity, level) })
          : abyssT("codex.base_power", { value: fmt(itemPowerAtLevel("hero", hero.id, 1)) })
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
        value: owned
          ? abyssT("codex.equip_effect", { power: fmt(itemPower("gear", gear.id)), effect: gearOptionText(gear, owned) })
          : abyssT("codex.available_gear_summon"),
        detail: owned
          ? abyssT("codex.owned_shards", { effect: gearOwnedEffectText(gear, level), current: owned.shards, required: shardNeed(gear.rarity, level) })
          : abyssT("codex.base_power", { value: fmt(itemPowerAtLevel("gear", gear.id, 1)) })
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
      meta: `${zone?.theme || abyssT("codex.abyss")} / ${abyssT(enemy.tier === "weak" ? "codex.weak_mob" : "codex.normal_mob")} / ${ROLES[enemy.role].label}`,
      value: enemy.visualKeywords || abyssT("codex.normal_desc"),
      detail: abyssT(discovered ? "codex.found_band" : "codex.available_from", { stage: enemy.firstStage })
    };
  });
  const bossTypeLabels = {
    floor: abyssT("codex.type_floor"),
    gate: abyssT("codex.type_gate"),
    apex: abyssT("codex.type_apex"),
    final: abyssT("codex.type_final")
  };
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
      meta: `${zone?.theme || abyssT("codex.abyss")} / ${bossTypeLabels[boss.type] || abyssT("codex.boss")} / ${ROLES[boss.role].label}`,
      value: abyssT("codex.boss_desc"),
      detail: abyssT(maxStage >= requiredStage ? "codex.boss_found" : "codex.boss_available", { stage: requiredStage })
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
  return abyssT(kind === "monsters" ? "codex.discovered" : "codex.owned");
}

function renderCodexFilterButton(option) {
  const summary = codexSummary(option.value);
  const active = normalizeCodexKind(app.codexKind) === option.value;
  return `
    <button class="${active ? "active" : ""}" data-codex-kind="${option.value}" aria-pressed="${active}">
      <strong>${abyssT(option.labelKey)}</strong>
      <span>${summary.owned}/${summary.total}</span>
    </button>
  `;
}

function renderCodexPanel() {
  const kind = normalizeCodexKind(app.codexKind);
  if (app.codexKind !== kind) app.codexKind = kind;
  const entries = codexEntries(kind);
  const summary = codexSummary(kind);
  const currentOption = CODEX_KIND_FILTERS.find((option) => option.value === kind);
  const currentLabel = currentOption ? abyssT(currentOption.labelKey) : abyssT("codex.default");
  return `
    <div class="codex-head">
      <div>
        <h2>${abyssT("codex.title")}</h2>
        <p class="muted">${abyssT("codex.description")}</p>
      </div>
      <div class="codex-progress">
        <strong>${currentLabel} ${codexProgressLabel(kind)} ${summary.owned}/${summary.total}</strong>
        <span>${Math.round(summary.ratio * 100)}%</span>
        <i style="--codex-progress:${summary.ratio}"></i>
      </div>
    </div>
    <div class="codex-filter" role="group" aria-label="${abyssT("codex.group_label")}">
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
    { value: "normal", label: abyssT("codex.normal_monster") },
    { value: "boss", label: abyssT("codex.boss") }
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
        return a.name.localeCompare(b.name, abyssLocaleTag());
      });
    if (groupEntries.length === 0) return "";
    const discovered = groupEntries.filter((entry) => entry.owned).length;
    return `
      <section class="codex-rarity-section monster-codex-section monster-${group.value}">
        <div class="codex-rarity-head monster-codex-head">
          <strong>${group.label}</strong>
          <span>${abyssT("codex.discovered")} ${discovered}/${groupEntries.length}</span>
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
  const displayName = locked && entry.kind === "monsters" ? abyssT("codex.undiscovered") : entry.name;
  const status = entry.kind === "monsters"
    ? abyssT(locked ? "codex.undiscovered" : "codex.discovered")
    : abyssT(locked ? "codex.not_owned" : "codex.owned");
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
            <p class="tiny">${RARITIES[hero.rarity].label} / <span class="${roleClass(hero.role)}">${ROLES[hero.role].label}</span> / ${abyssT("heroes.power", { value: fmt(itemPower("hero", id)) })}</p>
            <p class="muted">${isEquipped ? abyssT("heroes.frontline") : abyssT("heroes.reserve", { value: pct(roster.reserveShare) })} · ${ROLES[hero.role].bonus}</p>
            <p class="tiny">${abyssT("heroes.owned_effect", { value: heroOwnedEffectText(hero, owned.level) })}</p>
            ${heroGrowthEffectLines(id)}
            <div class="tiny">${shardProgressText(hero, owned)}</div>
            <div class="tiny">${abyssT("heroes.resonance", { value: influence.toLocaleString(abyssLocaleTag(), { maximumFractionDigits: 2 }) })}</div>
            <button data-equip-hero="${id}">${abyssT(isEquipped ? "heroes.remove" : "heroes.equip")}</button>
          </div>
        </div>
      `;
    })
    .join("");
  return `
    <div class="hero-panel-head">
      <div>
        <h2>${abyssT("heroes.title")}</h2>
        <p class="muted">${abyssT("heroes.description")}</p>
      </div>
      <button data-auto-heroes>${abyssT("heroes.recommend")}</button>
    </div>
    <div class="hero-summary-grid">
      ${heroSummaryChip(abyssT("heroes.collection"), `${roster.uniqueCount}/${HEROES.length}`)}
      ${heroSummaryChip(abyssT("heroes.frontline_count"), `${app.save.equippedHeroes.length}/3`)}
      ${heroSummaryChip(abyssT("stat.reserve_dps"), fmtRate(roster.reserveDps))}
      ${heroSummaryChip(abyssT("heroes.resonance_attack"), `+${pct(roster.attackPct)}`)}
      ${heroSummaryChip(abyssT("heroes.level_rank"), `${fmt(roster.totalLevels)} / ${fmt(roster.duplicateLevels)}`)}
      ${heroSummaryChip(abyssT("heroes.role_bonus"), abyssT("heroes.role_bonus_value", { tank: pct(roster.tankBossPct), dps: pct(roster.dpsPct) }))}
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
    <div class="gear-slot-filter" role="group" aria-label="${abyssT("gear.slot_label")}">
      ${GEAR_SLOT_FILTERS.map((option) => {
        const count = ownedIds.filter((id) => getData("gear", id).slot === option.value).length;
        const active = app.gearSlotFilter === option.value;
        return `
          <button class="${active ? "active" : ""}" data-gear-slot-filter="${option.value}" aria-pressed="${active}">
            <strong>${abyssT(option.labelKey)}</strong>
            <span>${abyssT("common.count", { value: count })}</span>
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
  const equippedText = equippedId ? abyssT("gear.equipped_name", { name: getData("gear", equippedId).name }) : abyssT("gear.equipped_none");
  const cards = slotIds.map((id) => {
    const gear = getData("gear", id);
    const owned = getOwned("gear", id);
    return `
      <div class="card collection-card rarity-${gear.rarity} ${equipped.has(id) ? "selected" : ""}" data-gear-id="${id}">
        <div class="collection-art">${catalogImgTag("gear", id, gear.name)}</div>
        <div class="collection-copy">
          <h3 class="${rarityClass(gear.rarity)}">${gear.name} Lv.${owned.level}</h3>
          <p class="tiny">${abyssT("gear.power_line", { rarity: RARITIES[gear.rarity].label, slot: slotLabel(gear.slot), power: fmt(itemPower("gear", id)) })}</p>
          <p class="tiny">${abyssT("gear.equip_effect", { power: fmt(itemPower("gear", id)), effect: gearOptionText(gear, owned) })}</p>
          <p class="tiny">${abyssT("gear.owned_effect", { effect: gearOwnedEffectText(gear, owned.level) })}</p>
          ${gearGrowthEffectLines(id)}
          <div class="tiny">${shardProgressText(gear, owned)}</div>
          <button data-equip-gear="${id}">${abyssT(equipped.has(id) ? "gear.equipped" : "gear.equip")}</button>
        </div>
      </div>
    `;
  }).join("");
  return `
    <div class="split">
      <div>
        <h2>${abyssT("gear.title")}</h2>
        <p class="muted">${abyssT("gear.description")}</p>
      </div>
      <button data-auto-gear>${abyssT("gear.recommend")}</button>
    </div>
    ${renderGearSlotFilters(ownedIds)}
    <div class="gear-sections">
      <section class="gear-section">
        <div class="gear-section-head">
          <strong>${slotLabel(activeSlot)}</strong>
          <span>${abyssT("gear.owned_summary", { count: slotIds.length, equipped: equippedText })}</span>
        </div>
        <div class="grid cols-3 gear-grid">
          ${cards || `<div class="gear-empty">${abyssT("gear.empty", { slot: slotLabel(activeSlot) })}</div>`}
        </div>
      </section>
    </div>
  `;
}

function slotLabel(slot) {
  const key = { weapon: "gear.weapon", armor: "gear.armor", relic: "gear.relic" }[slot];
  return key ? abyssT(key) : slot;
}

function renderRebirthPanel() {
  const reward = rebirthReward();
  const gateText = reward.canRebirth
    ? abyssT("rebirth.ready", { stage: reward.currentStage })
    : abyssT("rebirth.need_more", { stage: reward.currentStage, remaining: reward.remainingStages });
  const rewardText = reward.canRebirth
    ? abyssT("rebirth.reward", { value: fmt(reward.souls) })
    : abyssT("rebirth.calculate_after", { stage: reward.requiredStage });
  const buttonText = reward.canRebirth ? abyssT("rebirth.action") : abyssT("rebirth.remaining", { remaining: reward.remainingStages });
  return `
    <div class="grid cols-2">
      <div class="card">
        <h2>${abyssT("rebirth.title")}</h2>
        <p class="muted">${abyssT("rebirth.description", { stage: reward.requiredStage })}</p>
        <p class="tiny">${gateText}</p>
        <p>${abyssT("rebirth.reward_label")} <strong>${rewardText}</strong></p>
        <button class="warn" data-rebirth ${!reward.canRebirth || reward.souls <= 0 ? "disabled" : ""}>${buttonText}</button>
      </div>
      <div class="card">
        <h2>${abyssT("rebirth.records")}</h2>
        <p class="tiny">${abyssT("rebirth.max_floor", { value: app.save.maxStage })}</p>
        <p class="tiny">${abyssT("rebirth.kills_clears", { kills: app.save.stats.monstersKilled, floors: app.save.stats.floorsCleared })}</p>
        <p class="tiny">${abyssT("rebirth.count", { value: app.save.rebirths })}</p>
        <p class="tiny">${abyssT("rebirth.bosses", { value: app.save.stats.bossesKilled })}</p>
        <p class="tiny">${abyssT("rebirth.total_souls", { value: fmt(app.save.stats.soulsEarned) })}</p>
        <p class="tiny">${abyssT("rebirth.total_summons", { value: app.save.stats.totalSummons })}</p>
        <p class="tiny">${abyssT("rebirth.best_power", { value: fmt(app.save.stats.bestPower) })}</p>
      </div>
    </div>
    <div class="card" style="margin-top:10px">
      <h3>${abyssT("rebirth.recent")}</h3>
      ${app.log.map((entry) => `<p class="tiny">${escapeHtml(abyssFormatLog(entry))}</p>`).join("")}
    </div>
  `;
}

window.ABYSS_SUMMONER_UI = {
render,
renderPanel,
renderCombatEffectRail
};
