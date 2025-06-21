// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1️⃣ Remove `.svg` from assetExts so Metro doesn’t treat it as a static file
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== "svg");

// 2️⃣ Add `.svg` to sourceExts so Metro will parse it
config.resolver.sourceExts.push("svg");

// 3️⃣ Tell Metro to transform SVGs into React components
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

// 4️⃣ Wrap with NativeWind
module.exports = withNativeWind(config, {
  input: "./app/globals.css",
});