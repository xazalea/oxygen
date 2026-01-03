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

      // Fix for onnxruntime-web:
      // Copy the worker files to public directory during build if they don't exist
      // This is a common pattern for onnxruntime-web usage with Next.js
      const CopyPlugin = require('copy-webpack-plugin');
      
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: 'node_modules/onnxruntime-web/dist/*.wasm',
              to: 'static/chunks/pages/[name][ext]',
            },
          ],
        })
      );

      // Force resolution to the browser bundle
      // Instead of alias, we use NormalModuleReplacementPlugin to swap the request
      // This often works better when alias fails due to exports
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^onnxruntime-web$/, 
          (resource) => {
              resource.request = 'onnxruntime-web/dist/ort.min.js';
          }
        )
      );
    }
    return config;
  },
};

module.exports = nextConfig;
