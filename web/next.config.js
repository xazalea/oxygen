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
      
      // Externalize Node.js-only packages for client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'node-telegram-bot-api': 'commonjs node-telegram-bot-api',
        'tunnel-agent': 'commonjs tunnel-agent',
        '@cypress/request': 'commonjs @cypress/request',
      });

      // --- FIX FOR ONNXRUNTIME-WEB ---
      
      // Helper to find package root
      function findOnnxRoot() {
        const potentialPaths = [
          path.join(process.cwd(), 'node_modules', 'onnxruntime-web'),
          path.join(process.cwd(), '..', 'node_modules', 'onnxruntime-web'),
          path.join(__dirname, 'node_modules', 'onnxruntime-web')
        ];
        
        for (const p of potentialPaths) {
          if (fs.existsSync(p)) return p;
        }
        return null;
      }

      const onnxRoot = findOnnxRoot();
      
      if (onnxRoot) {
        // Force usage of the browser build
        config.resolve.alias['onnxruntime-web$'] = path.join(onnxRoot, 'dist', 'ort.min.js');
        config.resolve.alias['onnxruntime-web/dist/ort.min.js'] = path.join(onnxRoot, 'dist', 'ort.min.js');

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
          config.resolve.alias[path.join(onnxRoot, file)] = false;
        });
      }

      // Prevent webpack from parsing these files at all
      config.module.noParse = config.module.noParse || [];
      if (Array.isArray(config.module.noParse)) {
        config.module.noParse.push(/ort\.node\.min\.mjs$/);
        config.module.noParse.push(/ort-node\.min\.mjs$/);
      } else {
        // If it's a RegExp or function, wrap it (rare in Next.js default but safe to handle)
        const existingNoParse = config.module.noParse;
        config.module.noParse = (content) => {
          if (/ort\.node\.min\.mjs$/.test(content)) return true;
          if (/ort-node\.min\.mjs$/.test(content)) return true;
          if (typeof existingNoParse === 'function') return existingNoParse(content);
          if (existingNoParse instanceof RegExp) return existingNoParse.test(content);
          return false;
        };
      }

      // Explicitly load these with null-loader as a fallback
      config.module.rules.push({
        test: /ort\.node\.min\.mjs$/,
        use: 'null-loader', 
      });
      config.module.rules.push({
        test: /ort-node\.min\.mjs$/,
        use: 'null-loader', 
      });

      // --- FIX FOR LIBSODIUM-WRAPPERS ---
      // Force resolution to the UMD/CJS build to avoid ESM resolution issues
      // We use path.join to avoid Node.js 'exports' restrictions that might block require.resolve
      const libsodiumWrapperPath = path.join(process.cwd(), 'node_modules', 'libsodium-wrappers', 'dist', 'modules', 'libsodium-wrappers.js');
      
      // Only apply alias if we can reasonably guess the path, otherwise let standard resolution fail/succeed
      if (fs.existsSync(path.join(process.cwd(), 'node_modules', 'libsodium-wrappers'))) {
        config.resolve.alias['libsodium-wrappers$'] = libsodiumWrapperPath;
        config.resolve.alias['libsodium-wrappers/dist/modules-esm/libsodium-wrappers.mjs'] = libsodiumWrapperPath;
        
        // Also alias the internal import that was failing: ./libsodium.mjs
        // This is a relative import inside the package, so we need to be careful.
        // Webpack allows aliasing relative imports if we match exact string.
        config.resolve.alias['./libsodium.mjs'] = libsodiumWrapperPath;
      }
    }
    return config;
  },
};

module.exports = nextConfig;
