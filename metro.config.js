const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// papaparse.min.js causes Babel stack overflow; papaparse.js requires Node's `stream`.
// Redirect papaparse to its unminified build and shim `stream` with an empty stub.
const path = require('path');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'papaparse') {
    return { filePath: require.resolve('papaparse/papaparse.js'), type: 'sourceFile' };
  }
  if (moduleName === 'stream') {
    return { filePath: path.resolve(__dirname, 'shims/stream.js'), type: 'sourceFile' };
  }
  if (originalResolveRequest) return originalResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
