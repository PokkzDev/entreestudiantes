/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin Server Actions for Flow.cl integration
  experimental: {
    serverActions: {
      allowedOrigins: [
        'sandbox.flow.cl',
        'www.flow.cl',
        'flow.cl',
        'entreestudiantes.online',
        'localhost:3000',
        'localhost:3001'
      ],
      bodySizeLimit: '2mb'
    }
  },
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
            value: 'Content-Type, Authorization, x-signature, x-request-id'
          }
        ]
      },
      // Special headers for Flow.cl integration endpoints
      {
        source: '/api/flow/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://sandbox.flow.cl'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, x-forwarded-for, x-forwarded-host, x-forwarded-proto'
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
