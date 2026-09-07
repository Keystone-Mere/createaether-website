import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://a035462487e3d8353bb74a384d25ad86@o4511928406441984.ingest.de.sentry.io/4512046230274128",

  // Monitor 10% of server-side operations for performance.
  tracesSampleRate: 0.1,
});