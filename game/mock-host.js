(function () {
  "use strict";

  const saveKey = "meowthology.abyss-summoner.mock-save.v1";

  window.createMockHostApi = function createMockHostApi(actions) {
    let balance = 1200;
    const spent = new Map();
    const actionMap = new Map(actions.map((action) => [action.id, action]));

    return {
      packId: "meowthology.abyss-summoner",
      appVersion: "mock-preview",
      getLocale() {
        return window.navigator?.language || "ko";
      },
      wallet: {
        async getBalance() {
          return { balance };
        },
        async spend(input) {
          const action = actionMap.get(input.id);
          if (!action) {
            return { ok: false, code: "invalid_action", message: abyssT("wallet.invalid_action"), balance };
          }
          if (
            action.amount !== input.amount ||
            action.reason !== input.reason ||
            action.requiresConfirm !== input.requiresConfirm
          ) {
            return { ok: false, code: "invalid_action", message: abyssT("wallet.invalid_contract"), balance };
          }
          if (!input.idempotencyKey) {
            return { ok: false, code: "invalid_idempotency_key", message: abyssT("wallet.invalid_key"), balance };
          }
          if (spent.has(input.idempotencyKey)) {
            return { ...spent.get(input.idempotencyKey), idempotentReplay: true };
          }
          if (action.requiresConfirm) {
            const displayReason = window.ABYSS_SUMMONER_I18N.actionReason(action);
            const ok = window.confirm(`${displayReason}\n\n${abyssT("wallet.confirm_required", { amount: input.amount })}\n${abyssT("wallet.confirm_balance", { balance })}`);
            if (!ok) {
              return { ok: false, code: "cancelled", message: abyssT("wallet.cancelled"), balance };
            }
          }
          if (balance < input.amount) {
            return { ok: false, code: "insufficient_balance", message: abyssT("wallet.insufficient"), balance };
          }
          balance -= input.amount;
          const result = {
            ok: true,
            transactionId: `mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            balanceAfter: balance
          };
          spent.set(input.idempotencyKey, result);
          return result;
        }
      },
      save: {
        async load(fallback) {
          try {
            const raw = window.localStorage.getItem(saveKey);
            return raw ? JSON.parse(raw) : fallback;
          } catch (_error) {
            return fallback;
          }
        },
        async write(value) {
          try {
            window.localStorage.setItem(saveKey, JSON.stringify(value));
          } catch (_error) {
            // The preview can continue without persistent mock save.
          }
        },
        async clear() {
          window.localStorage.removeItem(saveKey);
        }
      },
      ui: {
        toast(message) {
          window.dispatchEvent(new CustomEvent("abyss-summoner-toast", { detail: { message } }));
        },
        async confirm(input) {
          return window.confirm(`${input.title}\n\n${input.message}`);
        }
      }
    };
  };
})();
