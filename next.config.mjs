/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const isDocker = process.env.DEPLOY_TARGET === 'docker';

const nextConfig = {
  ...(basePath && { basePath, assetPrefix: basePath }),
  ...(isDocker && { output: 'standalone' }),
  reactCompiler: true,
  trailingSlash: true,
  experimental: {
    serverActions: { bodySizeLimit: '50mb' }
  }
};

export default nextConfig;
