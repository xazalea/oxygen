/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

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

      // Force resolution to the browser bundle
      const webpack = require('webpack');
      
      // Ignore the node build completely
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs/,
        })
      );
      
      // Manually alias via resolve.alias again, but using a relative path trick
      // that sometimes bypasses exports checks in newer webpack versions
      // combined with NormalModuleReplacementPlugin for safety
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-web': require.resolve('onnxruntime-web/dist/ort.min.js'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
