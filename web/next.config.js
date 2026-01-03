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
      // We use NormalModuleReplacementPlugin to swap the request
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^onnxruntime-web$/, 
          (resource) => {
              // Only replace if it's a direct import of the package root
              if (resource.request === 'onnxruntime-web') {
                  resource.request = 'onnxruntime-web/dist/ort.min.js';
              }
          }
        )
      );
      
      // Also ignore the node-specific file that causes the syntax error
      // This prevents webpack from even trying to parse it
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
