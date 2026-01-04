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
      // 1. Manually construct paths (avoid require.resolve to bypass exports check)
      const onnxWebRoot = path.join(process.cwd(), 'node_modules', 'onnxruntime-web');
      const onnxBrowserBuild = path.join(onnxWebRoot, 'dist', 'ort.min.js');
      
      // 2. Alias the package name to the browser build
      config.resolve.alias['onnxruntime-web'] = onnxBrowserBuild;

      // 3. Stub out the node builds explicitly to prevent them from being bundled
      // We assume standard paths inside the package
      const nodeBuilds = [
          'dist/ort.node.min.mjs',
          'dist/ort-node.min.mjs',
          'dist/ort.node.min.js',
          'dist/ort-node.min.js'
      ];
      
      nodeBuilds.forEach(buildPath => {
          config.resolve.alias[path.join(onnxWebRoot, buildPath)] = false;
      });

      // 4. Use NormalModuleReplacementPlugin to intercept any remaining requests
      // pointing to the node build and redirect them to the browser build
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /onnxruntime-web[\/\\]dist[\/\\]ort\.node\.min\.mjs/,
          onnxBrowserBuild
        )
      );
      
      // 5. Ignore the node files completely as a final safety net
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs|ort-node\.min\.mjs/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
