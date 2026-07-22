"use strict";

function renderLanguagePicker(className = "") {
  const locale = window.ABYSS_SUMMONER_I18N.getLocale();
  return `
    <div class="language-picker ${className}" role="group" aria-label="${abyssT("language.label")}">
      <button type="button" data-language="ko" aria-pressed="${locale === "ko"}" class="${locale === "ko" ? "active" : ""}">${abyssT("language.korean")}</button>
      <button type="button" data-language="en" aria-pressed="${locale === "en"}" class="${locale === "en" ? "active" : ""}">${abyssT("language.english")}</button>
    </div>
  `;
}

function renderStartScreen() {
  const layer = document.getElementById("startLayer");
  if (!layer || app.started) {
    if (layer) layer.innerHTML = "";
    return;
  }
  const gameUi = document.getElementById("ui");
  const canvas = document.getElementById("battleCanvas");
  const modal = document.getElementById("modalLayer");
  if (gameUi) gameUi.inert = true;
  if (modal) modal.inert = true;
  if (canvas) canvas.setAttribute("aria-hidden", "true");
  const firstRun = !app.save.onboardingComplete;
  layer.innerHTML = `
    <div class="start-backdrop" aria-hidden="true"></div>
    <section class="start-card" role="dialog" aria-modal="true" aria-labelledby="startTitle">
      <div class="start-topline">
        <span>${abyssT("start.eyebrow")}</span>
        ${renderLanguagePicker("start-language")}
      </div>
      <div class="start-title-mark" aria-hidden="true"><span></span></div>
      <p class="start-kicker">${firstRun ? abyssT("start.new_journey") : abyssT("start.returning")}</p>
      <h1 id="startTitle">${abyssT("game.title")}</h1>
      <p class="start-subtitle">${abyssT("game.subtitle")}</p>
      ${firstRun ? `
        <div class="tutorial-panel" aria-label="${abyssT("start.tutorial_title")}">
          <h2>${abyssT("start.tutorial_title")}</h2>
          <div class="tutorial-grid">
            <article>
              <i aria-hidden="true">I</i>
              <strong>${abyssT("start.tutorial_battle_title")}</strong>
              <p>${abyssT("start.tutorial_battle_desc")}</p>
            </article>
            <article>
              <i aria-hidden="true">II</i>
              <strong>${abyssT("start.tutorial_summon_title")}</strong>
              <p>${abyssT("start.tutorial_summon_desc")}</p>
            </article>
            <article>
              <i aria-hidden="true">III</i>
              <strong>${abyssT("start.tutorial_rebirth_title")}</strong>
              <p>${abyssT("start.tutorial_rebirth_desc")}</p>
            </article>
          </div>
        </div>
      ` : ""}
      <button type="button" class="start-button" data-start-game>
        <span>${firstRun ? abyssT("start.enter") : abyssT("start.continue")}</span>
        <small>${abyssT("start.autosave")}</small>
      </button>
      <div class="start-meta">
        <span>${abyssT("start.offline")}</span>
        <span>${abyssT("start.credits")}</span>
      </div>
    </section>
  `;
}

async function startGameFromTitle() {
  app.started = true;
  const gameUi = document.getElementById("ui");
  const canvas = document.getElementById("battleCanvas");
  const modal = document.getElementById("modalLayer");
  if (gameUi) gameUi.inert = false;
  if (modal) modal.inert = false;
  if (canvas) canvas.removeAttribute("aria-hidden");
  if (!app.save.onboardingComplete) {
    app.save.onboardingComplete = true;
    await writeSave();
  }
  const layer = document.getElementById("startLayer");
  if (layer) {
    layer.classList.add("is-leaving");
    window.setTimeout(() => {
      layer.innerHTML = "";
      layer.classList.remove("is-leaving");
    }, app.settings.reducedMotion ? 0 : 260);
  }
  app.lastTick = performance.now();
  render(true);
  if (app.settings.bgmEnabled) void syncBgm();
}

window.ABYSS_SUMMONER_START_SCREEN = {
  renderStartScreen,
  renderLanguagePicker,
  startGameFromTitle
};
