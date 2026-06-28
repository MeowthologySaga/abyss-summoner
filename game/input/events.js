"use strict";

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

window.ABYSS_SUMMONER_INPUT = {
bindEvents,
rememberPanelScrollFromEvent
};
