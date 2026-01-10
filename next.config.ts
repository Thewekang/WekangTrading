/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ['@prisma/adapter-libsql', '@libsql/client'],
  webpack: (config: any) => {
    // Ignore README.md and LICENSE files in node_modules
    config.module.rules.push({
      test: /\.(md|LICENSE)$/,
      type: 'asset/source',
    });
    // Ignore .node binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
}

export default nextConfig
