// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6d9033cce03fd3149ea0c5d1781684da@o4511169337688064.ingest.de.sentry.io/4511169338015824",

  // Sample 10% of transactions to stay within Sentry free tier (5,000 events/month).
  // Increase to 1.0 temporarily if debugging a specific performance issue.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disabled: avoids accidentally capturing passwords or form input in error reports.
  // sendDefaultPii: true,
});
