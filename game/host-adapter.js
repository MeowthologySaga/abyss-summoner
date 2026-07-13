(function () {
  "use strict";

  const config = window.ABYSS_SUMMONER_ECONOMY_CONFIG;
  if (!config) {
    throw new Error("economy-config.js must be loaded before host-adapter.js");
  }
  const diamondActions = config.diamondActions;

  window.ABYSS_SUMMONER_DIAMOND_ACTIONS = diamondActions;

  window.createHostAdapter = function createHostAdapter() {
    if (window.LEM_GAME_HOST_API) {
      return window.LEM_GAME_HOST_API;
    }
    throw new Error("Abyss Summoner must be launched from the Language Miner PlayZone host.");
  };
})();
