// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Disable the old 'react-native-reanimated/plugin'
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false }],
      'nativewind/babel',
    ],
    // Optional: you can omit this because the preset will add it when
    // 'react-native-worklets' is installed (default 'worklets: true')
    //plugins: ['react-native-worklets/plugin'],
  };
};
