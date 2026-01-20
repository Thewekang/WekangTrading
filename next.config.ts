import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui/react-icons'],
  },
};

// Bundle analyzer setup (only runs when ANALYZE=true)
// Usage: ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
