/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Configure body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Enable instrumentation hook for database initialization on startup
    instrumentationHook: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native WebSocket modules and packages with modern syntax for server-side
      config.externals.push({
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
        'undici': 'commonjs undici',
        'cheerio': 'commonjs cheerio',
      });
    }

    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
}

module.exports = nextConfig
