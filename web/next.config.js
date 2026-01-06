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

      // --- FIX FOR ONNXRUNTIME-WEB ---
      
      // Helper to find package root since require.resolve('onnxruntime-web/package.json') 
      // fails due to exports configuration
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
        const onnxBrowserBuild = path.join(onnxRoot, 'dist', 'ort.min.js');
        
        // 1. Alias the main package to the browser build
        config.resolve.alias['onnxruntime-web'] = onnxBrowserBuild;
        
        // 2. Explicitly alias the node builds to false
        const nodeFiles = [
          'dist/ort.node.min.mjs',
          'dist/ort-node.min.mjs',
          'dist/ort.node.min.js'
        ];
        
        nodeFiles.forEach(file => {
          config.resolve.alias[path.join(onnxRoot, file)] = false;
        });
      }

      // --- ADDED FIX FOR WEBPACK PARSING ERROR ---
      // We need to match the file path regardless of where it is in node_modules
      config.module.rules.push({
        test: /ort\.node\.min\.mjs$/,
        use: 'null-loader', 
      });
      // Also ignore the specific import trace mentioned in logs if it comes from another file
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs$/,
        })
      );

      const webpack = require('webpack');

      // 3. Ignore plugin with a very specific regex that matches the filename
      // This should prevent webpack from processing it even if alias fails
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs$/,
        })
      );

      // --- FIX FOR LIBSODIUM-WRAPPERS ---
      // Force resolution to the main entry point which should be CJS or UMD compatible with Webpack 5 default
      try {
        config.resolve.alias['libsodium-wrappers'] = require.resolve('libsodium-wrappers');
      } catch (e) {
        // Fallback: If installed in node_modules, it should resolve automatically.
        // We explicitly tell webpack to look for the browser or main field.
        // But if it's failing to find './libsodium.mjs', it means it's picking up the ESM build.
        // Let's force it to pick the UMD build if possible, or just let standard resolution happen 
        // but ensure we don't break if it's missing.
        // The previous error "Module not found: Can't resolve './libsodium.mjs'" suggests it found the wrapper but not the worker.
        
        // Strategy 2: Explicitly alias to the memory-safe version which is usually simpler
        // config.resolve.alias['libsodium-wrappers'] = 'libsodium-wrappers/dist/modules/libsodium-wrappers.js';
      }
      
      // NEW FIX: Force resolution of libsodium.js (worker) if the wrapper tries to load it
      // This is a bit of a hack, but if the ESM build is used, it expects relative paths.
      // We can try to redirect the ESM build request to the CJS build.
      
      // Let's try to ignore the specific failing ESM file for libsodium-wrappers if possible, 
      // or alias the package to the distribution file directly.
      
      // Direct path alias to the UMD/CJS file which usually doesn't have the .mjs import issue
      // We assume it is installed at the root node_modules
      const libsodiumPath = path.join(process.cwd(), 'node_modules', 'libsodium-wrappers', 'dist', 'modules', 'libsodium-wrappers.js');
      if (fs.existsSync(libsodiumPath)) {
         config.resolve.alias['libsodium-wrappers'] = libsodiumPath;
      }

      // 4. NormalModuleReplacementPlugin as a backup to redirect requests
      if (onnxRoot) {
         config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /onnxruntime-web\/dist\/ort\.node\.min\.mjs/,
            path.join(onnxRoot, 'dist', 'ort.min.js')
          )
        );
      }
    }
    return config;
  },
};

module.exports = nextConfig;
