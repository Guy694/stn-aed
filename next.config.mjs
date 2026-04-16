/** @type {import('next').NextConfig} */
const isDocker = process.env.DEPLOY_TARGET === 'docker';

const nextConfig = {
  ...(isDocker && { basePath: '/stn-aed', assetPrefix: '/stn-aed' }),
  ...(isDocker && { output: 'standalone' }),
  reactCompiler: true,
  trailingSlash: true,
  experimental: {
    serverActions: { bodySizeLimit: '50mb' }
  }
};

export default nextConfig;
