/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Ensure proper production behavior
  reactStrictMode: true,
  // Disable HMR in production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Disable HMR in production client builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: false,
            vendors: false,
          },
        },
      };
    }
    return config;
  },
  // Ensure proper environment detection
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },
};

export default nextConfig;
