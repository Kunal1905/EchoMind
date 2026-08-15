export type ScreenWakeLockSentinel = {
  released?: boolean;
  release: () => Promise<void>;
};

export type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<ScreenWakeLockSentinel>;
  };
};

export function supportsScreenWakeLock(
  navigatorObject: Navigator,
): navigatorObject is WakeLockNavigator {
  return "wakeLock" in navigatorObject;
}

export async function requestScreenWakeLock(
  navigatorObject: Navigator,
  current: ScreenWakeLockSentinel | null,
) {
  if (current && !current.released) return current;
  if (!supportsScreenWakeLock(navigatorObject) || !navigatorObject.wakeLock) {
    return null;
  }

  return navigatorObject.wakeLock.request("screen");
}

export async function releaseScreenWakeLock(
  current: ScreenWakeLockSentinel | null,
) {
  if (current && !current.released) await current.release();
}
