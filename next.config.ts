import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui/react-icons', 'date-fns'],
    
    // Enable optimistic client cache (faster navigation)
    optimisticClientCache: true,
  },
  
  // Compression and performance
  compress: true, // Enable gzip compression
  
  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Suppress harmless development warnings
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suppress React DevTools suggestion in development
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-dom$': 'react-dom/profiling',
      };
    }
    return config;
  },
  
  // Security and performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ];
  },
};

// Bundle analyzer setup (only runs when ANALYZE=true)
// Usage: ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
