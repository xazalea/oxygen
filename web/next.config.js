/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Handle Pyodide and Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        tls: false,
        net: false,
        http: false,
        https: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        buffer: false,
      };
      
      // Externalize Node.js-only packages for client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'node-telegram-bot-api': 'commonjs node-telegram-bot-api',
        'tunnel-agent': 'commonjs tunnel-agent',
        '@cypress/request': 'commonjs @cypress/request',
      });

      // --- FIX FOR ONNXRUNTIME-WEB ---
      try {
        // 1. Locate the onnxruntime-web package root
        // We resolve package.json to get the absolute path to the installation
        const onnxPackageJsonPath = require.resolve('onnxruntime-web/package.json');
        const onnxPackageRoot = path.dirname(onnxPackageJsonPath);
        const onnxDistPath = path.join(onnxPackageRoot, 'dist');
        
        // 2. Define the absolute path to the browser-compatible script
        const ortBrowserPath = path.join(onnxDistPath, 'ort.min.js');

        // 3. Alias the main package import to the browser script
        // This overrides the default exports configuration in package.json
        config.resolve.alias['onnxruntime-web'] = ortBrowserPath;

        // 4. Explicitly stub out the node-specific builds to false
        // This ensures that even if something tries to import them, they are treated as empty
        config.resolve.alias[path.join(onnxDistPath, 'ort.node.min.mjs')] = false;
        config.resolve.alias[path.join(onnxDistPath, 'ort-node.min.mjs')] = false;

      } catch (e) {
        console.warn('Failed to configure onnxruntime-web aliases:', e);
        
        // Fallback: try manual path if require.resolve fails
        const onnxDistPath = path.join(process.cwd(), 'node_modules', 'onnxruntime-web', 'dist');
        config.resolve.alias['onnxruntime-web'] = path.join(onnxDistPath, 'ort.min.js');
        config.resolve.alias[path.join(onnxDistPath, 'ort.node.min.mjs')] = false;
      }

      // 5. Use IgnorePlugin as a final safety net
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs$/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
