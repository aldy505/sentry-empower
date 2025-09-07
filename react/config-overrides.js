import { sentryWebpackPlugin } from "@sentry/webpack-plugin";
import { WebpackReactSourcemapsPlugin } from "@acemarke/react-prod-sourcemaps";
import { codecovWebpackPlugin } from "@codecov/webpack-plugin";

export default function override(config, env) {
  //do stuff with the webpack config...
  config.plugins.push(
    WebpackReactSourcemapsPlugin({
      mode: "strict",
    }),
  );
  config.plugins.push(
    sentryWebpackPlugin({
      url: process.env.SENTRY_URL,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      include: ".",
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      ignoreFile: ".sentrycliignore",
      ignore: ["webpack.config.js"],
      configFile: "sentry.properties",
    }),
  );
  config.plugins.push(
    codecovWebpackPlugin({
      enableBundleAnalysis: process.env.CI !== undefined || process.env.CODECOV_TOKEN !== undefined,
      bundleName: "empower-react-app",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  );
  return config;
};
