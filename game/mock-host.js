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
      wallet: {
        async getBalance() {
          return { balance };
        },
        async spend(input) {
          const action = actionMap.get(input.id);
          if (!action) {
            return { ok: false, code: "invalid_action", message: "선언되지 않은 다이아 액션입니다.", balance };
          }
          if (
            action.amount !== input.amount ||
            action.reason !== input.reason ||
            action.requiresConfirm !== input.requiresConfirm
          ) {
            return { ok: false, code: "invalid_action", message: "manifest와 다른 차감 요청입니다.", balance };
          }
          if (!input.idempotencyKey) {
            return { ok: false, code: "invalid_idempotency_key", message: "idempotencyKey가 필요합니다.", balance };
          }
          if (spent.has(input.idempotencyKey)) {
            return { ...spent.get(input.idempotencyKey), idempotentReplay: true };
          }
          if (action.requiresConfirm) {
            const ok = window.confirm(`${input.reason}\n\n필요 다이아: ${input.amount}\n현재 잔액: ${balance}`);
            if (!ok) {
              return { ok: false, code: "cancelled", message: "사용자가 취소했습니다.", balance };
            }
          }
          if (balance < input.amount) {
            return { ok: false, code: "insufficient_balance", message: "mock 다이아 잔액이 부족합니다.", balance };
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
