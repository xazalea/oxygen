/** @type {import('next').NextConfig} */
const path = require('path');

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
      // We use require.resolve to find the exact path to the browser-compatible script
      try {
        const onnxWebPath = require.resolve('onnxruntime-web/dist/ort.min.js');
        config.resolve.alias = {
          ...config.resolve.alias,
          'onnxruntime-web': onnxWebPath,
        };
      } catch (e) {
        console.warn('Could not resolve onnxruntime-web/dist/ort.min.js', e);
      }
    }
    return config;
  },
};

module.exports = nextConfig;
