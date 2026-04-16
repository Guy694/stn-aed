/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/stn-aed',
  assetPrefix: '/stn-aed',
  output: 'standalone',
  reactCompiler: true,
  trailingSlash: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
  /* config options here */
};

export default nextConfig;
