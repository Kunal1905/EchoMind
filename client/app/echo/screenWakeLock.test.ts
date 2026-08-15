import assert from "node:assert/strict";
import test from "node:test";
import {
  releaseScreenWakeLock,
  requestScreenWakeLock,
  type ScreenWakeLockSentinel,
} from "./screenWakeLock";

test("gracefully skips wake lock when the browser does not support it", async () => {
  const result = await requestScreenWakeLock({} as Navigator, null);
  assert.equal(result, null);
});

test("requests a screen wake lock from a supported browser", async () => {
  const sentinel: ScreenWakeLockSentinel = { release: async () => {} };
  const navigatorObject = {
    wakeLock: {
      request: async (type: "screen") => {
        assert.equal(type, "screen");
        return sentinel;
      },
    },
  } as unknown as Navigator;

  assert.equal(await requestScreenWakeLock(navigatorObject, null), sentinel);
});

test("reuses an active wake lock and releases it when the call ends", async () => {
  let releaseCount = 0;
  const sentinel: ScreenWakeLockSentinel = {
    released: false,
    release: async () => {
      releaseCount += 1;
      sentinel.released = true;
    },
  };

  assert.equal(await requestScreenWakeLock({} as Navigator, sentinel), sentinel);
  await releaseScreenWakeLock(sentinel);
  await releaseScreenWakeLock(sentinel);
  assert.equal(releaseCount, 1);
});
