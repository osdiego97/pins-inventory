module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [require.resolve('react-native-css-interop/dist/babel-plugin')],
  };
};
