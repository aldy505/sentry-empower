import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_DSN,
  release: process.env.REACT_APP_RELEASE,
  environment: process.env.REACT_APP_ENVIRONMENT,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  integrations: [
    //  performance
    // If you're using react router, use the integration for your react router version instead.
    // Learn more at
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
    Sentry.browserTracingIntegration(),
    //  performance
    //  session-replay
    Sentry.replayIntegration({
        blockAllMedia: false,
        networkDetailAllowUrls: [/.*/],
        unmask: [".sentry-unmask"],
    }),
    //  session-replay
    //  user-feedback
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: "system",
    }),
    //  user-feedback
    Sentry.consoleLoggingIntegration(),
    Sentry.browserProfilingIntegration(),
  ],
  //  logs
  // Enable logs to be sent to Sentry
  enableLogs: true,
  //  logs
  //  performance
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: [/^\//, "localhost"],
  //  performance
  //  session-replay
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  //  session-replay
});
