import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  assetPrefix: '/web/blogsmith',
  /* config options here */
  output: 'export', // Added for SSG
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'quarto.nvcr.ai',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
