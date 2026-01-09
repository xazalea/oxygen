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
      try {
        // Resolve the package name itself to get the main entry point defined in package.json
        const sodiumPath = require.resolve('libsodium-wrappers');
        
        console.log('Build: Resolved libsodium-wrappers to:', sodiumPath);

        // Force 'libsodium-wrappers' to resolve to the resolved path
        config.resolve.alias['libsodium-wrappers$'] = sodiumPath;
        
        // Redirect the specific ESM file to the resolved main entry point
        // We use a regex for the key to be more flexible with path separators and relative/absolute paths
        // This is crucial because Webpack might see different paths depending on context
        config.resolve.alias['libsodium-wrappers/dist/modules-esm/libsodium-wrappers.mjs'] = sodiumPath;

        // Redirect the failing relative import to the main entry point as well
        // Assuming the main entry point exports everything needed or side-effects setup correctly
        config.resolve.alias['./libsodium.mjs'] = sodiumPath;
        
        // Also add NormalModuleReplacementPlugin as a fallback to catch the request before alias resolution
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /libsodium-wrappers\.mjs$/,
            sodiumPath
          )
        );
        
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /\.\/libsodium\.mjs$/,
            sodiumPath
          )
        );

      } catch (e) {
        console.warn('Build: Could not resolve libsodium-wrappers for patching:', e);
      }

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
