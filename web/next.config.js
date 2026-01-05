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

      const webpack = require('webpack');

      // 3. Ignore plugin with a very specific regex that matches the filename
      // This should prevent webpack from processing it even if alias fails
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs$/,
        })
      );

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
