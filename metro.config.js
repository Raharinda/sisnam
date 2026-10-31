// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase JS SDK + Metro package exports = "dual package hazard":
// `firebase/app` (ESM) resolves `@firebase/app` to the ESM build, while the
// React Native auth build `require`s `@firebase/app` and gets the CJS build.
// Two copies of @firebase/app means auth registers on one and the app is
// created on the other -> "Component auth has not been registered yet".
// Resolve Firebase packages via classic `react-native`/`browser`/`main`
// fields so every import shares a single instance.
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isFirebase =
    moduleName === "firebase" ||
    moduleName.startsWith("firebase/") ||
    moduleName.startsWith("@firebase/");

  const ctx = isFirebase
    ? { ...context, unstable_enablePackageExports: false }
    : context;

  return defaultResolveRequest
    ? defaultResolveRequest(ctx, moduleName, platform)
    : ctx.resolveRequest(ctx, moduleName, platform);
};

module.exports = config;

