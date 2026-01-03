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

      // Fix for onnxruntime-web trying to load node version
      // We manually construct the path to ort.min.js assuming standard node_modules structure
      // This is a fallback if require.resolve fails or exports are not defined
      const onnxWebPath = path.join(process.cwd(), 'node_modules', 'onnxruntime-web', 'dist', 'ort.min.js');
      
      // Also try to find it in nested node_modules if not in root
      let finalOnnxPath = onnxWebPath;
      try {
          if (!fs.existsSync(onnxWebPath)) {
              // try to find via require.resolve but pointing to package.json then resolving dist
              const pkgPath = require.resolve('onnxruntime-web/package.json');
              finalOnnxPath = path.join(path.dirname(pkgPath), 'dist', 'ort.min.js');
          }
      } catch (e) {
          console.warn('Could not resolve onnxruntime-web path via package.json', e);
      }

      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-web': finalOnnxPath,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
