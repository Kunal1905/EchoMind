import "dotenv/config";
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  beforeSend(event) {
    if (!event.request) return event;

    // Conversations may contain sensitive wellness information. Keep request
    // metadata useful for debugging without sending user-provided content.
    event.request.data = undefined;
    event.request.cookies = undefined;
    event.request.headers = undefined;
    event.request.query_string = undefined;

    if (event.request.url) {
      event.request.url = event.request.url.split("?", 1)[0];
    }

    return event;
  },
});
