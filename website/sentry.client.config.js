import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://a035462487e3d8353bb74a384d25ad86@o4511928406441984.ingest.de.sentry.io/4512046230274128",

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Monitor 10% of visits for performance.
  tracesSampleRate: 0.1,

  // Replay 10% of normal sessions and all sessions containing errors.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
// Temporary verification: only runs when ?sentry-test is added to the URL.
if (window.location.search.includes("sentry-test")) {
  Sentry.captureException(
    new Error("Aether Sentry verification test")
  );
}