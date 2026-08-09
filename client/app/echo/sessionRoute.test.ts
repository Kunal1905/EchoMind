import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeSubscriptionAllowance,
  routeForSessionPage,
} from "./sessionRoute";

test("normalizes a valid subscription allowance", () => {
  assert.deepEqual(
    normalizeSubscriptionAllowance({
      freeTrialUsed: 7,
      freeTrialLimit: 10,
      isPremium: false,
      minutesRemaining: 3,
    }),
    {
      freeTrialUsed: 7,
      freeTrialLimit: 10,
      isPremium: false,
      minutesRemaining: 3,
    },
  );
});

test("rejects a response without a valid minute balance", () => {
  assert.throws(
    () => normalizeSubscriptionAllowance({ isPremium: false }),
    /valid minute balance/,
  );
});

test("clamps a negative server balance to zero", () => {
  const allowance = normalizeSubscriptionAllowance({ minutesRemaining: -2 });
  assert.equal(allowance.minutesRemaining, 0);
});

test("resolves session navigation destinations", () => {
  assert.equal(routeForSessionPage("chat"), "/echo/new");
  assert.equal(routeForSessionPage("history"), "/history");
  assert.equal(routeForSessionPage("unknown"), "/");
});
