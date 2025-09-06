export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    name: "Fridgy",
    slug: "Fridgy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "fridgy",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.fridgy", // iOS ID
    },

    android: {
      package: "com.anonymous.fridgy", // 👈 REQUIRED: manually add this
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

    plugins: [
      "expo-router",
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

