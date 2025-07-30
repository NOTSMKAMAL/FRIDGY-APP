module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1) dotenv plugin
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,             // set true if you have a .env.example
        allowUndefined: true,    // don’t error on missing vars
      }],
      // 2) then Reanimated
      'react-native-reanimated/plugin',
    ],
  };
};