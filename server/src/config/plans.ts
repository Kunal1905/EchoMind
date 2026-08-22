export const PLANS = {
  free: { price: 0, minutes: 5, name: "Free", available: true },
  starter: { price: 399, minutes: 20, name: "Starter", available: true },
  growth: { price: 799, minutes: 40, name: "Growth", available: true },
  pro: { price: 1499, minutes: 75, name: "Pro", available: true },
} as const;

export type PlanKey = keyof typeof PLANS;

export type PurchasablePlanKey = {
  [K in PlanKey]: typeof PLANS[K]["available"] extends true
    ? typeof PLANS[K]["price"] extends 0
      ? never
      : K
    : never
}[PlanKey];

export function isPurchasablePlan(planId: PlanKey): planId is PurchasablePlanKey {
  const plan = PLANS[planId];
  return Boolean(plan && plan.available && plan.price > 0);
}
