// app.config.js
export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,

    name: "Fridgy",
    slug: "fridgy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    // one scheme only — used by AuthSession redirectUri
    scheme: "fridgy",

    ios: {
      supportsTablet: true,
      // ✅ exactly one bundleIdentifier
      bundleIdentifier: "com.anonymous.fridgy",
    },

    android: {
      // ✅ exactly one package
      package: "com.anonymous.fridgy",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    // ✅ one plugins array
    plugins: [
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      FATSECRET_CONSUMER_KEY: process.env.FATSECRET_CONSUMER_KEY,
      FATSECRET_CONSUMER_SECRET: process.env.FATSECRET_CONSUMER_SECRET,
    },
  },
});
