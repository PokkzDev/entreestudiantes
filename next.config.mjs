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
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  // Redirect common attack vectors
  async redirects() {
    return [
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/wp-content/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/wp-includes/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/admin/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/administrator/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/phpmyadmin/:path*',
        destination: '/',
        permanent: false
      },
      {
        source: '/xmlrpc.php',
        destination: '/',
        permanent: false
      },
      {
        source: '/wp-login.php',
        destination: '/',
        permanent: false
      }
    ];
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
  // Additional production optimizations
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
