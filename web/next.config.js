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

      // Force resolution to the browser bundle via NormalModuleReplacementPlugin
      // This is often more reliable than resolve.alias for bypassing exports
      const webpack = require('webpack');
      
      // We know where the file *should* be in a standard install
      // Constructing the relative path from the import location to the dist file
      // is tricky without knowing the importer's location.
      // So we use absolute pathing but hope the plugin handles it.
      
      // NEW STRATEGY:
      // Instead of relying on require.resolve which checks exports,
      // or alias which checks exports,
      // We use NormalModuleReplacementPlugin to rewrite the REQUEST itself.
      // But to avoid the exports check on the rewritten request, we target the file directly via absolute path?
      // No, that still triggers checks in webpack resolution.
      
      // We will define an ALIAS for a completely different name, and point that to the absolute path,
      // then replace imports of 'onnxruntime-web' with that alias.
      
      const onnxWebDist = path.join(process.cwd(), 'node_modules', 'onnxruntime-web', 'dist', 'ort.min.js');
      
      // Define a custom alias that maps to the file directly
      config.resolve.alias['__onnxruntime_web_custom__'] = onnxWebDist;
      
      // Rewrite all imports of 'onnxruntime-web' to use our custom alias
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^onnxruntime-web$/, 
          '__onnxruntime_web_custom__'
        )
      );
      
      // And still ignore the node file just in case
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /ort\.node\.min\.mjs|ort\.node\.min\.js/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
