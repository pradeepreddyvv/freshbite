/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Proxy Spring Boot API calls through Vercel to avoid mixed-content (HTTPS→HTTP)
  // and CORS issues. Fallback rewrites only trigger when no Next.js API route matches.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
}

module.exports = nextConfig
