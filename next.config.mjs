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
  // External packages configuration for server components
  serverExternalPackages: ['@prisma/client'],
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
      },
      // Specific headers for API routes to ensure they're not cached
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Signature, X-Request-Id'
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
  // Additional production optimizations
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
