// server/src/lib/analytics.ts
import { PostHog } from "posthog-node";

const client = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: "https://app.posthog.com",
});

export function trackServer(event: string, userId: string, props?: Record<string, any>) {
  if (!process.env.POSTHOG_API_KEY) return; // skip in dev
  client.capture({ distinctId: userId, event, properties: props });
}