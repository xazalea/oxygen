/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');
const webpack = require('webpack'); // Move require('webpack') to top level

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

      // --- FIX FOR LIBSODIUM-WRAPPERS ---
      // Fix the ESM import failure by patching the package resolution
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /libsodium-wrappers\/dist\/modules-esm\/libsodium-wrappers\.mjs/,
          (resource) => {
             resource.request = path.resolve(__dirname, 'node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js');
          }
        )
      );
      
      // Also catch any relative imports of .mjs within that package
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /\.\/libsodium\.mjs/,
          (resource) => {
             resource.request = path.resolve(__dirname, 'node_modules/libsodium-wrappers/dist/modules/libsodium.js');
          }
        )
      );

      config.module.rules.push({
        test: /libsodium-wrappers/,
        resolve: {
          fullySpecified: false
        }
      });

      config.module.rules.push({
        test: /libsodium-wrappers/,
        resolve: {
          fullySpecified: false
        }
      });
      
      // Externalize Node.js-only packages for client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'node-telegram-bot-api': 'commonjs node-telegram-bot-api',
        'tunnel-agent': 'commonjs tunnel-agent',
        '@cypress/request': 'commonjs @cypress/request',
      });

      // --- FIX FOR ONNXRUNTIME-WEB ---
      
      // Force usage of the browser build by aliasing the package to the minified script
      // We assume standard npm structure since we can't detect it at build time in some envs
      config.resolve.alias['onnxruntime-web$'] = 'onnxruntime-web/dist/ort.min.js';
      config.resolve.alias['onnxruntime-web/dist/ort.min.js'] = 'onnxruntime-web/dist/ort.min.js';

      // Explicitly ignore Node.js specific files
      const nodeFiles = [
        'dist/ort.node.min.mjs',
        'dist/ort-node.min.mjs',
        'dist/ort.node.min.js',
        'dist/ort-wasm-simd-threaded.mjs',
        'dist/ort-wasm-threaded.mjs',
        'dist/ort-wasm-simd.mjs',
        'dist/ort-wasm.mjs'
      ];
      
      nodeFiles.forEach(file => {
        config.resolve.alias[`onnxruntime-web/${file}`] = false;
      });

      // --- FIX FOR LIBSODIUM-WRAPPERS ---
      // Force resolution to the UMD/CJS build to avoid ESM resolution issues
      config.resolve.alias['libsodium-wrappers$'] = 'libsodium-wrappers/dist/modules/libsodium-wrappers.js';
      
      // --- FIX FOR ONNXRUNTIME-WEB (Dynamic Require) ---
      // Add IgnorePlugin to ignore dynamic requires in onnxruntime-web
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^onnxruntime-node$|^node:/,
        })
      );

      // Disable parsing for the problematic ort files to avoid syntax errors
      config.module.rules.push({
        test: /ort\.node\.min\.mjs$/,
        use: 'null-loader', // Use null-loader or ignore
      });
    }
    return config;
  },
};

module.exports = nextConfig;
