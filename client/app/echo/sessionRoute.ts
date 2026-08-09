export type SubscriptionAllowance = {
  freeTrialUsed: number;
  freeTrialLimit: number;
  isPremium: boolean;
  minutesRemaining: number;
};

const routeByPage: Record<string, string> = {
  home: "/",
  chat: "/echo/new",
  history: "/history",
  sessions: "/",
  settings: "/settings",
};

const numberOrFallback = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function normalizeSubscriptionAllowance(data: unknown): SubscriptionAllowance {
  if (!data || typeof data !== "object") {
    throw new Error("Subscription response was invalid.");
  }

  const subscription = data as Record<string, unknown>;
  const minutesRemaining = Number(subscription.minutesRemaining);

  if (!Number.isFinite(minutesRemaining)) {
    throw new Error("Subscription response did not include a valid minute balance.");
  }

  return {
    freeTrialUsed: Math.max(0, numberOrFallback(subscription.freeTrialUsed, 0)),
    freeTrialLimit: Math.max(0, numberOrFallback(subscription.freeTrialLimit, 10)),
    isPremium: subscription.isPremium === true,
    minutesRemaining: Math.max(0, minutesRemaining),
  };
}

export function routeForSessionPage(page: string) {
  return routeByPage[page] || "/";
}
