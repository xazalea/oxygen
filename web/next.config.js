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
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^onnxruntime-web$/, 
          (resource) => {
              resource.request = 'onnxruntime-web/dist/ort.min.js';
          }
        )
      );
      
      // Explicitly ignore the node-specific file causing syntax errors
      // Use a more aggressive ignore strategy that covers different path formats
      config.plugins.push(
          new webpack.IgnorePlugin({
              resourceRegExp: /ort\.node\.min\.mjs|ort\.node\.min\.js/,
          })
      );

      // Also mark it as an external to be extra safe
      config.externals.push({
        'onnxruntime-web/dist/ort-node.min.js': 'commonjs onnxruntime-web/dist/ort-node.min.js',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
