export const PLANS = {
  free: { price: 0, minutes: 5, name: "Free", available: true, billingModel: "monthly" },
  plus: { price: 349, minutes: 20, name: "Plus", available: true, billingModel: "pack" },
  max: { price: 699, minutes: 45, name: "Max", available: true, billingModel: "pack" },
  // Retained for historical receipts and users who bought the previous offer.
  starter: { price: 399, minutes: 20, name: "Starter", available: false, billingModel: "legacy_monthly" },
  growth: { price: 799, minutes: 40, name: "Growth", available: false, billingModel: "legacy_monthly" },
  pro: { price: 1499, minutes: 75, name: "Pro", available: false, billingModel: "legacy_monthly" },
} as const;

export type PlanKey = keyof typeof PLANS;

export type PurchasablePlanKey = {
  [K in PlanKey]: typeof PLANS[K]["available"] extends true
    ? typeof PLANS[K]["price"] extends 0
      ? never
      : K
    : never
}[PlanKey];

export type PaidPlanKey = {
  [K in PlanKey]: typeof PLANS[K]["price"] extends 0 ? never : K
}[PlanKey];

export function isPurchasablePlan(planId: PlanKey): planId is PurchasablePlanKey {
  const plan = PLANS[planId];
  return Boolean(plan && plan.available && plan.price > 0);
}

export function isPaidPlan(planId: PlanKey): planId is PaidPlanKey {
  const plan = PLANS[planId];
  return Boolean(plan && plan.price > 0);
}
