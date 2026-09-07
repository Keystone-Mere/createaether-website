// @ts-check
import { defineConfig } from "astro/config";
import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [
    sentry({
      project: "createaether-website",
      org: "keystone-mere",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});