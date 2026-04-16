/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/stn-aed',
  assetPrefix: '/stn-aed',
  ...(process.env.DEPLOY_TARGET === 'docker' && { output: 'standalone' }),
  reactCompiler: true,
  trailingSlash: true,
  experimental: {
    serverActions: { bodySizeLimit: '50mb' }
  }
};

export default nextConfig;
