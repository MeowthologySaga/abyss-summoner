"use strict";

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

window.ABYSS_SUMMONER_BATTLE = {
  updateCombat,
  clearBattleProjectiles
};
