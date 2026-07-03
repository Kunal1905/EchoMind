export const PLANS = {
  free: { price: 0, minutes: 5, name: "Free" },
  basic: { price: 249, minutes: 30, name: "Basic" },
  pro: { price: 499, minutes: 60, name: "Pro" },
  premium: { price: 999, minutes: 120, name: "Premium" },
} as const;

export type PlanKey = keyof typeof PLANS;
