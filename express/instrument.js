import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const dsn = process.env.EXPRESS_APP_DSN;
const release = process.env.RELEASE;
const environment = process.env.EXPRESS_ENV;

Sentry.init({
  dsn: dsn,
  environment: environment,
  release: release,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enableLogs: true,
});