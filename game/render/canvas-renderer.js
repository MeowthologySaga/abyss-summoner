"use strict";

function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  image.addEventListener("load", () => render());
  return image;
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
  const battleBgImage = typeof ensureBattleBackgroundImage === "function"
    ? ensureBattleBackgroundImage(activeBackground)
    : activeBackground && activeBackground.image;
  if (typeof scheduleBattleBackgroundPreload === "function") {
    scheduleBattleBackgroundPreload(app.save.stage, activeBackground);
  }
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
  const enemyX = w * (compact ? 0.7 : 0.78);
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
  const panelW = compact ? Math.min(176, Math.max(150, w * 0.43)) : Math.min(260, w * 0.48);
  const panelH = compact ? 48 : 52;
  const panelX = Math.round(w - panelW - (compact ? 10 : 14));
  const panelY = Math.round(compact && hudBand > 0 ? h - panelH - 6 : floorY + 34);
  const hpPct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
  const bossBonus = enemy.boss ? 1 + stats.bossDamagePct : 1;
  const effectiveDps = damageAfterEnemyDebuff(stats.dps * bossBonus * bossHighHpMultiplier(enemy, stats) * bossLowHpMultiplier(enemy, stats), enemy, stats);
  const labelLimit = compact ? 6 : 8;
  const enemyLabel = enemy.name.length > labelLimit ? `${enemy.name.slice(0, labelLimit)}…` : enemy.name;
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

window.ABYSS_SUMMONER_CANVAS = {
loadImage,
draw,
resizeCanvas
};
